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

    private function awardMasteryBadges(User $user, ?Certification $cert): array
    {
        if (!$cert) return [];

        $questionIds = $cert->questions()->pluck('id');
        $total = $questionIds->count();
        if ($total === 0) return [];

        $mastered = UserQuestionStat::where('user_id', $user->id)
            ->whereIn('question_id', $questionIds)
            ->where('correct_streak', '>=', 2)
            ->count();

        $pct = ($mastered / $total) * 100;
        if ($pct >= 90) {
            $badge = $this->tryAward($user, 'master_cert', $cert->id, [
                'mastered' => $mastered,
                'total' => $total,
                'pct' => round($pct),
            ]);

            // Trigger l'attribution du certificat partageable si pas deja fait
            $bestAttempt = $user->attempts()
                ->where('certification_id', $cert->id)
                ->whereNotNull('completed_at')
                ->orderByDesc('score')
                ->first();

            UserCertificate::firstOrCreate(
                ['user_id' => $user->id, 'certification_id' => $cert->id],
                [
                    'best_score' => $bestAttempt?->score ?? 0,
                    'total_questions' => $bestAttempt?->total_questions ?? 0,
                    'mastery_pct' => (int) round($pct),
                ]
            );

            if ($badge) return ['master_cert'];
        }
        return [];
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
