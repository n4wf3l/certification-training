<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Certification;
use App\Models\Question;
use App\Models\UserQuestionStat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function show(Certification $certification): Response
    {
        abort_unless($certification->is_active, 404);

        $availableQuestions = $certification->questions()->count();
        $sampleSize = $this->sampleSize($certification, $availableQuestions);
        $mastery = auth()->check()
            ? $this->masterySummary(auth()->id(), $certification)
            : null;

        return Inertia::render('Exam/Intro', [
            'certification' => [
                'id' => $certification->id,
                'title' => $certification->title,
                'slug' => $certification->slug,
                'logo_path' => $certification->logo_path,
                'description' => $certification->description,
                'duration_minutes' => $certification->duration_minutes,
                'passing_score' => $certification->passing_score,
                'total_questions' => $certification->total_questions,
                'available_questions' => $availableQuestions,
                'sample_size' => $sampleSize,
                'scaled_passing_score' => $this->scaledPassingScore($certification, $sampleSize),
            ],
            'mastery' => $mastery,
        ]);
    }

    public function start(Certification $certification): RedirectResponse
    {
        abort_unless($certification->is_active, 404);
        $availableQuestions = $certification->questions()->count();
        abort_if($availableQuestions === 0, 422, 'Cet examen ne contient aucune question.');

        $sampleSize = $this->sampleSize($certification, $availableQuestions);
        $scaledPassing = $this->scaledPassingScore($certification, $sampleSize);

        return DB::transaction(function () use ($certification, $sampleSize, $scaledPassing) {
            $selectedIds = $this->selectQuestions($certification, auth()->id(), $sampleSize);

            $attempt = Attempt::create([
                'user_id' => auth()->id(),
                'certification_id' => $certification->id,
                'total_questions' => $sampleSize,
                'passing_score' => $scaledPassing,
                'started_at' => now(),
            ]);

            foreach ($selectedIds as $index => $questionId) {
                AttemptAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $questionId,
                    'position' => $index + 1,
                    'answer_id' => null,
                    'is_correct' => false,
                ]);
            }

            return redirect()->route('exam.take', $attempt);
        });
    }

    public function take(Attempt $attempt): Response|RedirectResponse
    {
        $this->authorizeAttempt($attempt);

        if ($attempt->isCompleted()) {
            return redirect()->route('exam.result', $attempt);
        }

        $certification = $attempt->certification;
        $items = $attempt->attemptAnswers()
            ->with(['question.answers'])
            ->orderBy('position')
            ->get();

        $questions = $items->map(function (AttemptAnswer $aa) use ($attempt) {
            $shuffled = $this->shuffledAnswers($aa->question->answers, $this->answerSeed($attempt->id, $aa->question->id));
            return [
                'id' => $aa->question->id,
                'position' => $aa->position,
                'topic' => $aa->question->topic,
                'scenario' => $aa->question->scenario,
                'question_text' => $aa->question->question_text,
                'answers' => collect($shuffled)->map(fn ($a, $i) => [
                    'id' => $a->id,
                    'letter' => chr(65 + $i),
                    'answer_text' => $a->answer_text,
                ])->values(),
            ];
        });

        return Inertia::render('Exam/Take', [
            'attempt' => [
                'id' => $attempt->id,
                'started_at' => $attempt->started_at,
                'duration_minutes' => $certification->duration_minutes,
            ],
            'certification' => [
                'id' => $certification->id,
                'title' => $certification->title,
                'logo_path' => $certification->logo_path,
                'passing_score' => $attempt->passing_score,
            ],
            'questions' => $questions,
        ]);
    }

    public function submit(Request $request, Attempt $attempt): RedirectResponse
    {
        $this->authorizeAttempt($attempt);

        if ($attempt->isCompleted()) {
            return redirect()->route('exam.result', $attempt);
        }

        $data = $request->validate([
            'answers' => 'required|array',
            'answers.*' => 'nullable|integer|exists:answers,id',
        ]);

        DB::transaction(function () use ($attempt, $data) {
            $score = 0;

            foreach ($attempt->attemptAnswers as $aa) {
                $answerId = $data['answers'][$aa->question_id] ?? null;
                $isCorrect = false;

                if ($answerId) {
                    $answer = Answer::where('id', $answerId)
                        ->where('question_id', $aa->question_id)
                        ->first();
                    $isCorrect = $answer?->is_correct ?? false;
                }

                $aa->update([
                    'answer_id' => $answerId,
                    'is_correct' => $isCorrect,
                ]);

                $this->recordStat($attempt->user_id, $aa->question_id, $isCorrect);

                if ($isCorrect) {
                    $score++;
                }
            }

            $attempt->update([
                'score' => $score,
                'completed_at' => now(),
                'passed' => $score >= $attempt->passing_score,
                'duration_seconds' => $attempt->started_at
                    ? (int) $attempt->started_at->diffInSeconds(now())
                    : null,
            ]);
        });

        return redirect()->route('exam.result', $attempt);
    }

    public function result(Attempt $attempt): Response
    {
        $this->authorizeAttempt($attempt);
        abort_unless($attempt->isCompleted(), 404);

        $attempt->load(['certification', 'attemptAnswers.question.answers', 'attemptAnswers.answer']);

        $details = $attempt->attemptAnswers->sortBy('position')->values()->map(function (AttemptAnswer $aa) use ($attempt) {
            $correct = $aa->question->answers->firstWhere('is_correct', true);
            // Rebuild the same shuffled order used during the exam so displayed letters match
            $shuffled = $this->shuffledAnswers($aa->question->answers, $this->answerSeed($attempt->id, $aa->question->id));
            $letterMap = collect($shuffled)->mapWithKeys(fn ($a, $i) => [$a->id => chr(65 + $i)]);
            return [
                'position' => $aa->position,
                'question_text' => $aa->question->question_text,
                'scenario' => $aa->question->scenario,
                'topic' => $aa->question->topic,
                'explanation' => $aa->question->explanation,
                'is_correct' => $aa->is_correct,
                'chosen' => $aa->answer ? [
                    'letter' => $letterMap[$aa->answer->id] ?? $aa->answer->letter,
                    'text' => $aa->answer->answer_text,
                    'rationale' => $aa->answer->rationale,
                ] : null,
                'correct' => $correct ? [
                    'letter' => $letterMap[$correct->id] ?? $correct->letter,
                    'text' => $correct->answer_text,
                    'rationale' => $correct->rationale,
                ] : null,
            ];
        });

        $comparison = $this->buildComparison($attempt);

        return Inertia::render('Exam/Result', [
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'total_questions' => $attempt->total_questions,
                'passing_score' => $attempt->passing_score,
                'percentage' => $attempt->percentage(),
                'passed' => $attempt->passed,
                'duration_seconds' => $attempt->duration_seconds,
                'started_at' => $attempt->started_at,
                'completed_at' => $attempt->completed_at,
            ],
            'certification' => [
                'id' => $attempt->certification->id,
                'slug' => $attempt->certification->slug,
                'title' => $attempt->certification->title,
                'logo_path' => $attempt->certification->logo_path,
            ],
            'details' => $details,
            'mastery' => $this->masterySummary($attempt->user_id, $attempt->certification),
            'comparison' => $comparison,
        ]);
    }

    /**
     * Compare cette tentative aux précédentes du même user sur le même examen.
     *  - attempt_number (n° de tentative)
     *  - previous_attempt (temps + score de la précédente)
     *  - best_time (meilleur temps précédent)
     *  - best_score (meilleur score précédent)
     *  - delta_seconds (négatif = plus rapide)
     *  - delta_score (positif = mieux)
     */
    private function buildComparison(Attempt $attempt): ?array
    {
        $previousAttempts = Attempt::query()
            ->where('user_id', $attempt->user_id)
            ->where('certification_id', $attempt->certification_id)
            ->where('id', '<>', $attempt->id)
            ->whereNotNull('completed_at')
            ->orderBy('completed_at')
            ->get();

        $attemptNumber = $previousAttempts->count() + 1;

        if ($previousAttempts->isEmpty()) {
            return [
                'attempt_number' => $attemptNumber,
                'previous' => null,
                'best_time_before' => null,
                'best_score_before' => null,
                'delta_seconds' => null,
                'delta_score' => null,
                'delta_percentage' => null,
                'is_new_best_time' => false,
                'is_new_best_score' => false,
            ];
        }

        $previous = $previousAttempts->last();
        $bestTimeBefore = $previousAttempts->whereNotNull('duration_seconds')->min('duration_seconds');
        $bestScoreBefore = $previousAttempts->max('score');

        $deltaSeconds = null;
        if ($attempt->duration_seconds !== null && $previous->duration_seconds !== null) {
            $deltaSeconds = $attempt->duration_seconds - $previous->duration_seconds;
        }
        $deltaScore = $attempt->score - $previous->score;
        $deltaPercentage = $attempt->percentage() - $previous->percentage();

        return [
            'attempt_number' => $attemptNumber,
            'previous' => [
                'id' => $previous->id,
                'score' => $previous->score,
                'total' => $previous->total_questions,
                'percentage' => $previous->percentage(),
                'duration_seconds' => $previous->duration_seconds,
                'completed_at' => $previous->completed_at,
            ],
            'best_time_before' => $bestTimeBefore,
            'best_score_before' => $bestScoreBefore,
            'delta_seconds' => $deltaSeconds,
            'delta_score' => $deltaScore,
            'delta_percentage' => $deltaPercentage,
            'is_new_best_time' => $bestTimeBefore !== null && $attempt->duration_seconds !== null && $attempt->duration_seconds < $bestTimeBefore,
            'is_new_best_score' => $bestScoreBefore !== null && $attempt->score > $bestScoreBefore,
        ];
    }

    private function authorizeAttempt(Attempt $attempt): void
    {
        abort_unless($attempt->user_id === auth()->id() || auth()->user()?->isAdmin(), 403);
    }

    /**
     * Deterministic seed for shuffling answers of a given (attempt, question) pair.
     * Same attempt → same order for all views of the same question (stable across
     * refresh, prev/next, and between the exam page and the result page).
     * Different attempts → different order.
     */
    private function answerSeed(int $attemptId, int $questionId): int
    {
        return $attemptId * 100000 + $questionId;
    }

    /**
     * Fisher–Yates shuffle seeded with the attempt-question pair. Returns the
     * answers in a new array; the caller can reassign letters based on index.
     * Correctness lookup remains id-based on submit, so shuffling doesn't
     * affect scoring — only the visual order and displayed letters change.
     */
    private function shuffledAnswers($answers, int $seed): array
    {
        $arr = $answers->values()->all();
        $n = count($arr);
        if ($n <= 1) return $arr;
        mt_srand($seed);
        for ($i = $n - 1; $i > 0; $i--) {
            $j = mt_rand(0, $i);
            [$arr[$i], $arr[$j]] = [$arr[$j], $arr[$i]];
        }
        mt_srand(); // restore a random seed so we don't affect other rand calls
        return $arr;
    }

    private function sampleSize(Certification $certification, int $availableQuestions): int
    {
        $target = $certification->total_questions ?: $availableQuestions;
        return (int) min($availableQuestions, max(1, $target));
    }

    private function scaledPassingScore(Certification $certification, int $sampleSize): int
    {
        $target = $certification->total_questions ?: $sampleSize;
        if ($target === $sampleSize) {
            return min($certification->passing_score, $sampleSize);
        }
        return (int) min(
            $sampleSize,
            max(1, ceil($certification->passing_score / $target * $sampleSize))
        );
    }

    /**
     * Sélection d'examen : combine trois contraintes.
     *
     *  A. Blueprint syllabus (si défini) : respecte les proportions par
     *     syllabus_domain de la certification. Ex : { "practices": 20, ... }
     *     donne 20 % de questions pratiques dans l'échantillon de 40.
     *  B. Répétition adaptative : dans chaque domaine, priorité aux questions
     *     ratées, puis jamais vues, puis vues 1 fois, puis maîtrisées.
     *  C. Dédup pédagogique : max 1 question par concept_group_key.
     *
     * Si aucun blueprint n'est défini, on retombe sur l'ancien tri global
     * priorité-adaptative + dédup groupe.
     */
    private function selectQuestions(Certification $certification, int $userId, int $sampleSize): array
    {
        $questions = $certification->questions()
            ->reorder()
            ->get(['id', 'syllabus_domain', 'concept_group_key']);
        $questionIds = $questions->pluck('id');

        $stats = UserQuestionStat::where('user_id', $userId)
            ->whereIn('question_id', $questionIds)
            ->get()
            ->keyBy('question_id');

        $groupKeys = $questions
            ->whereNotNull('concept_group_key')
            ->pluck('concept_group_key', 'id')
            ->all();

        // Range chaque question par priorité pédagogique (0 = plus prioritaire).
        // Tri secondaire : shuffle intra-bucket pour éviter l'ordre déterministe.
        $priorityOf = function (int $qid) use ($stats): array {
            $s = $stats->get($qid);
            if ($s === null) return [1, 0]; // unseen
            if ($s->last_result === 'wrong') return [0, -($s->times_wrong ?? 0)]; // to-review, times_wrong desc
            if ($s->correct_streak >= 2) return [3, 0]; // mastered
            return [2, 0]; // in-progress
        };

        // Sort a list of question IDs by priority + jitter aléatoire
        $sortByPriority = function (array $ids) use ($priorityOf): array {
            $keyed = array_map(fn ($id) => [
                'id' => $id,
                'p' => $priorityOf($id),
                'r' => mt_rand(),
            ], $ids);
            usort($keyed, fn ($a, $b) => [$a['p'][0], $a['p'][1], $a['r']] <=> [$b['p'][0], $b['p'][1], $b['r']]);
            return array_column($keyed, 'id');
        };

        $blueprint = $certification->syllabus_blueprint ?? null;

        // ─── Sans blueprint : ancien comportement (adaptatif global + dédup groupe) ───
        if (!is_array($blueprint) || empty($blueprint)) {
            $ordered = $sortByPriority($questionIds->all());
            return $this->applyGroupDedupAndTake($ordered, $groupKeys, $sampleSize);
        }

        // ─── Avec blueprint : cible par domaine ───
        $totalPct = array_sum($blueprint);
        if ($totalPct <= 0) $totalPct = 100;

        // Compute target per domain (proportional rounding)
        $targets = [];
        $rawAssign = 0;
        foreach ($blueprint as $domain => $pct) {
            $targets[$domain] = (int) round($sampleSize * $pct / $totalPct);
            $rawAssign += $targets[$domain];
        }
        // Adjust rounding drift so total == sampleSize
        $drift = $sampleSize - $rawAssign;
        if ($drift !== 0) {
            // Add/remove to the largest bucket first
            arsort($targets);
            $keys = array_keys($targets);
            $targets[$keys[0]] += $drift;
        }

        // Group questions by domain
        $byDomain = [];
        foreach ($questions as $q) {
            $d = $q->syllabus_domain ?? '__unassigned__';
            $byDomain[$d][] = $q->id;
        }

        // Pick per domain
        $selected = [];
        $usedGroups = [];
        $leftovers = []; // questions we didn't pick from any domain, for potential fallback
        foreach ($targets as $domain => $target) {
            $pool = $byDomain[$domain] ?? [];
            if (empty($pool)) continue;
            $ordered = $sortByPriority($pool);
            $taken = 0;
            foreach ($ordered as $qid) {
                if ($taken >= $target) {
                    $leftovers[] = $qid; // may serve fallback if another domain is short
                    continue;
                }
                $gk = $groupKeys[$qid] ?? null;
                if ($gk !== null && isset($usedGroups[$gk])) {
                    $leftovers[] = $qid;
                    continue;
                }
                $selected[] = $qid;
                if ($gk !== null) $usedGroups[$gk] = true;
                $taken++;
            }
        }

        // If some domain is short (not enough questions or all colliding on groups),
        // fill from leftovers respecting group dedup, then priority.
        if (count($selected) < $sampleSize) {
            $orderedLeftovers = $sortByPriority(array_values(array_unique($leftovers)));
            foreach ($orderedLeftovers as $qid) {
                if (count($selected) >= $sampleSize) break;
                if (in_array($qid, $selected, true)) continue;
                $gk = $groupKeys[$qid] ?? null;
                if ($gk !== null && isset($usedGroups[$gk])) continue;
                $selected[] = $qid;
                if ($gk !== null) $usedGroups[$gk] = true;
            }
        }

        // Ultimate fallback : still short → relax group dedup
        if (count($selected) < $sampleSize) {
            foreach ($leftovers as $qid) {
                if (count($selected) >= $sampleSize) break;
                if (in_array($qid, $selected, true)) continue;
                $selected[] = $qid;
            }
        }

        return collect($selected)->shuffle()->values()->toArray();
    }

    /**
     * Sélectionne jusqu'à $sampleSize questions dans l'ordre donné, en évitant
     * les collisions par concept_group_key. Fallback autorise les collisions
     * si le pool est trop restreint.
     */
    private function applyGroupDedupAndTake(array $orderedIds, array $groupKeys, int $sampleSize): array
    {
        $selected = [];
        $usedGroups = [];
        $collisions = [];
        foreach ($orderedIds as $qid) {
            if (count($selected) >= $sampleSize) break;
            $gk = $groupKeys[$qid] ?? null;
            if ($gk !== null && isset($usedGroups[$gk])) {
                $collisions[] = $qid;
                continue;
            }
            $selected[] = $qid;
            if ($gk !== null) $usedGroups[$gk] = true;
        }
        if (count($selected) < $sampleSize) {
            foreach ($collisions as $qid) {
                if (count($selected) >= $sampleSize) break;
                $selected[] = $qid;
            }
        }
        return collect($selected)->shuffle()->values()->toArray();
    }

    private function recordStat(int $userId, int $questionId, bool $isCorrect): void
    {
        $stat = UserQuestionStat::firstOrNew([
            'user_id' => $userId,
            'question_id' => $questionId,
        ]);

        $stat->times_seen = ($stat->times_seen ?? 0) + 1;
        if ($isCorrect) {
            $stat->times_correct = ($stat->times_correct ?? 0) + 1;
            $stat->correct_streak = ($stat->correct_streak ?? 0) + 1;
            $stat->last_result = 'correct';
        } else {
            $stat->times_wrong = ($stat->times_wrong ?? 0) + 1;
            $stat->correct_streak = 0;
            $stat->last_result = 'wrong';
        }
        $stat->last_seen_at = now();
        $stat->save();
    }

    private function masterySummary(int $userId, Certification $certification): array
    {
        $questionIds = $certification->questions()->pluck('id');
        $total = $questionIds->count();
        if ($total === 0) {
            return [
                'total' => 0,
                'mastered' => 0,
                'to_review' => 0,
                'never_seen' => 0,
                'in_progress' => 0,
            ];
        }

        $stats = UserQuestionStat::where('user_id', $userId)
            ->whereIn('question_id', $questionIds)
            ->get();

        $mastered = $stats->where('correct_streak', '>=', 2)->count();
        $toReview = $stats->where('last_result', 'wrong')->count();
        $inProgress = $stats->count() - $mastered - $toReview;
        $neverSeen = $total - $stats->count();

        return [
            'total' => $total,
            'mastered' => $mastered,
            'to_review' => $toReview,
            'never_seen' => $neverSeen,
            'in_progress' => max(0, $inProgress),
        ];
    }
}
