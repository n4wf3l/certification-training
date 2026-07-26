<?php

namespace App\Services;

use App\Models\Attempt;
use App\Models\Certification;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserCertificate;
use App\Models\UserQuestionStat;

/**
 * Centralise la logique XP + streak + badges.
 * Appele apres chaque exam submit.
 */
class GamificationService
{
    /**
     * XP par action.
     */
    public const XP_PER_CORRECT = 10;
    public const XP_PASSING_BONUS = 50;   // Score >= passing_score
    public const XP_PERFECT_BONUS = 100;  // Score = total (sans-faute)

    /**
     * Traite un attempt fraichement complete : XP, streak, badges.
     * Idempotent : peut etre rappele, ne double pas les XP (la logique
     * est appelee dans DB::transaction dans ExamController).
     */
    public function processAttempt(Attempt $attempt): array
    {
        $user = $attempt->user;
        if (!$user) return ['xp_gained' => 0, 'streak' => 0, 'new_badges' => []];

        $xpGained = 0;
        $newBadges = [];

        // XP par bonne reponse
        $xpGained += $attempt->score * self::XP_PER_CORRECT;

        // Bonus reussite
        if ($attempt->passed) $xpGained += self::XP_PASSING_BONUS;

        // Bonus sans-faute
        if ($attempt->score === $attempt->total_questions && $attempt->total_questions > 0) {
            $xpGained += self::XP_PERFECT_BONUS;
        }

        // Update XP
        $user->total_xp = ($user->total_xp ?? 0) + $xpGained;

        // Update streak
        $today = today();
        $lastActive = $user->last_activity_date;
        if ($lastActive === null) {
            $user->current_streak = 1;
        } else {
            $daysDiff = $lastActive->diffInDays($today, false);
            if ($daysDiff === 0) {
                // deja actif aujourd'hui, streak inchange
            } elseif ($daysDiff === 1) {
                $user->current_streak = ($user->current_streak ?? 0) + 1;
            } else {
                // Streak brise
                $user->current_streak = 1;
            }
        }
        $user->longest_streak = max($user->longest_streak ?? 0, $user->current_streak);
        $user->last_activity_date = $today;

        $user->save();

        // Awarding badges
        $newBadges = array_merge($newBadges, $this->awardStreakBadges($user));
        $newBadges = array_merge($newBadges, $this->awardXpBadges($user));
        $newBadges = array_merge($newBadges, $this->awardExamBadges($user, $attempt));
        $newBadges = array_merge($newBadges, $this->awardMasteryBadges($user, $attempt->certification));

        return [
            'xp_gained' => $xpGained,
            'streak' => $user->current_streak,
            'new_badges' => $newBadges,
        ];
    }

    private function awardStreakBadges(User $user): array
    {
        $awarded = [];
        foreach ([7 => 'streak_7', 30 => 'streak_30', 100 => 'streak_100'] as $threshold => $key) {
            if ($user->current_streak >= $threshold) {
                $badge = $this->tryAward($user, $key);
                if ($badge) $awarded[] = $key;
            }
        }
        return $awarded;
    }

    private function awardXpBadges(User $user): array
    {
        $awarded = [];
        foreach ([500 => 'xp_500', 2000 => 'xp_2000', 10000 => 'xp_10000'] as $threshold => $key) {
            if ($user->total_xp >= $threshold) {
                $badge = $this->tryAward($user, $key);
                if ($badge) $awarded[] = $key;
            }
        }
        return $awarded;
    }

    private function awardExamBadges(User $user, Attempt $attempt): array
    {
        $awarded = [];
        // Premier examen valide
        if ($attempt->passed) {
            $badge = $this->tryAward($user, 'first_pass', null, [
                'attempt_id' => $attempt->id,
                'certification' => $attempt->certification?->title,
            ]);
            if ($badge) $awarded[] = 'first_pass';
        }
        // Sans-faute (une fois toute cert confondue - le contexte est meta)
        if ($attempt->total_questions > 0 && $attempt->score === $attempt->total_questions) {
            $badge = $this->tryAward($user, 'perfect_exam', null, [
                'attempt_id' => $attempt->id,
                'certification' => $attempt->certification?->title,
                'total' => $attempt->total_questions,
            ]);
            if ($badge) $awarded[] = 'perfect_exam';
        }
        return $awarded;
    }

    /**
     * Nombre requis de mock exams parfaits consecutifs pour debloquer le
     * certificat CertifLoop. Ratio choisi pour rendre la memorisation
     * statistiquement impossible : le picker adaptatif deduplique les
     * questions entre attempts, donc 3 sans-faute d'affilee = 3 pools
     * differents 100% resolus.
     */
    public const CERT_PERFECT_RUNS_REQUIRED = 3;

    /**
     * Budget quit autorise sur la fenetre des 3 perfects. 1 = un abandon
     * mid-examen "gratuit" (accident, coupure reseau, changement d'avis).
     * Le 2e abandon durant le meme streak nuke le streak entier.
     */
    public const QUIT_BUDGET_PER_STREAK = 1;

    /**
     * Regle du certificat CertifLoop : 3 mock exams complets d'affilee
     * a 100 %, avec au plus 1 abandon (quit budget) durant la fenetre.
     * Les sessions "practice" (targeted domain) sont exclues car elles
     * ne testent qu'un sous-ensemble du syllabus.
     */
    private function awardMasteryBadges(User $user, ?Certification $cert): array
    {
        if (!$cert) return [];

        $state = $this->computeStreakState($user->id, $cert->id);
        if ($state['perfect_runs'] < self::CERT_PERFECT_RUNS_REQUIRED) return [];

        $badge = $this->tryAward($user, 'master_cert', $cert->id, [
            'perfect_runs' => $state['perfect_runs'],
            'quits_used' => $state['quits_used'],
            'required' => self::CERT_PERFECT_RUNS_REQUIRED,
        ]);

        // Certificat partageable : on cristallise le meilleur score sur cette cert
        // (typiquement le total, puisque 3 attempts sans-faute) + le nb de questions
        // du dernier attempt pour donner un chiffre "sur X" sur le PDF.
        $lastAttempt = $user->attempts()
            ->where('certification_id', $cert->id)
            ->whereNotNull('completed_at')
            ->whereNull('practice_domain')
            ->orderByDesc('completed_at')
            ->first();

        UserCertificate::firstOrCreate(
            ['user_id' => $user->id, 'certification_id' => $cert->id],
            [
                'best_score' => $lastAttempt?->score ?? 0,
                'total_questions' => $lastAttempt?->total_questions ?? 0,
                // On garde mastery_pct pour retrocompat de la colonne, meme si
                // la regle est desormais 100 % perfect x 3 : c'est toujours 100
                // au moment de l'attribution.
                'mastery_pct' => 100,
            ]
        );

        return $badge ? ['master_cert'] : [];
    }

    /**
     * Etat du streak vers le certificat CertifLoop pour ce (user, cert).
     *
     * Algorithme (walk backward through recent non-practice attempts) :
     *  - Chaque perfect completed -> perfect_runs++
     *  - Chaque abandoned -> quits_used++ (n'incremente pas perfect_runs
     *    mais ne casse pas le streak tant que quits_used <= QUIT_BUDGET)
     *  - Un completed non-parfait -> BREAK immediatement (streak reset naturel)
     *  - quits_used > QUIT_BUDGET -> BREAK aussi (streak nuked par le 2e quit)
     *
     * Retourne :
     *  - perfect_runs   : nb de sans-faute completes dans la fenetre courante
     *  - quits_used     : nb d'abandons dans la fenetre courante
     *  - quit_budget    : constante (1 aujourd'hui)
     *  - required       : nb de perfects necessaires (3)
     *  - quits_left     : quit_budget - quits_used, jamais negatif
     *
     * Les compteurs perfect_runs / quits_used sont bornes a leurs limites
     * respectives pour eviter d'exposer des chiffres au-dela du seuil.
     */
    public function computeStreakState(int $userId, int $certificationId): array
    {
        // Fenetre suffisamment large pour capturer 3 perfects + budget quits
        $window = self::CERT_PERFECT_RUNS_REQUIRED + self::QUIT_BUDGET_PER_STREAK + 3;

        $recent = Attempt::where('user_id', $userId)
            ->where('certification_id', $certificationId)
            ->whereNull('practice_domain')
            ->where(function ($q) {
                $q->whereNotNull('completed_at')->orWhereNotNull('abandoned_at');
            })
            ->orderByDesc('id') // id desc = ordre insertion desc, plus stable que completed_at qui peut etre null
            ->limit($window)
            ->get(['id', 'score', 'total_questions', 'completed_at', 'abandoned_at']);

        $perfectRuns = 0;
        $quitsUsed = 0;

        foreach ($recent as $a) {
            if ($a->abandoned_at !== null) {
                $quitsUsed++;
                if ($quitsUsed > self::QUIT_BUDGET_PER_STREAK) {
                    // Le 2e quit casse le streak : on nuke tout ce qu'on a compte
                    // depuis (ce quit-la remet la fenetre a zero).
                    $perfectRuns = 0;
                    $quitsUsed = self::QUIT_BUDGET_PER_STREAK + 1; // freeze pour l'expose
                    break;
                }
                continue;
            }
            // Completed attempt
            if ($a->total_questions > 0 && $a->score === $a->total_questions) {
                $perfectRuns++;
                if ($perfectRuns >= self::CERT_PERFECT_RUNS_REQUIRED) break;
            } else {
                // Completed mais non-parfait : streak natural reset
                break;
            }
        }

        $quitsLeft = max(0, self::QUIT_BUDGET_PER_STREAK - $quitsUsed);

        return [
            'perfect_runs' => min($perfectRuns, self::CERT_PERFECT_RUNS_REQUIRED),
            'quits_used' => min($quitsUsed, self::QUIT_BUDGET_PER_STREAK + 1),
            'quit_budget' => self::QUIT_BUDGET_PER_STREAK,
            'quits_left' => $quitsLeft,
            'required' => self::CERT_PERFECT_RUNS_REQUIRED,
        ];
    }

    private function tryAward(User $user, string $key, ?int $certId = null, array $meta = []): ?UserBadge
    {
        // firstOrCreate garantit l'idempotence grace a l'index unique
        $existing = UserBadge::where('user_id', $user->id)
            ->where('badge_key', $key)
            ->where('certification_id', $certId)
            ->first();
        if ($existing) return null;

        return UserBadge::create([
            'user_id' => $user->id,
            'badge_key' => $key,
            'certification_id' => $certId,
            'meta' => $meta ?: null,
            'earned_at' => now(),
        ]);
    }
}
