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

        $questions = $items->map(fn (AttemptAnswer $aa) => [
            'id' => $aa->question->id,
            'position' => $aa->position,
            'topic' => $aa->question->topic,
            'scenario' => $aa->question->scenario,
            'question_text' => $aa->question->question_text,
            'answers' => $aa->question->answers->map(fn ($a) => [
                'id' => $a->id,
                'letter' => $a->letter,
                'answer_text' => $a->answer_text,
            ]),
        ]);

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
                    ? now()->diffInSeconds($attempt->started_at)
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

        $details = $attempt->attemptAnswers->sortBy('position')->values()->map(function (AttemptAnswer $aa) {
            $correct = $aa->question->answers->firstWhere('is_correct', true);
            return [
                'position' => $aa->position,
                'question_text' => $aa->question->question_text,
                'scenario' => $aa->question->scenario,
                'topic' => $aa->question->topic,
                'is_correct' => $aa->is_correct,
                'chosen' => $aa->answer ? [
                    'letter' => $aa->answer->letter,
                    'text' => $aa->answer->answer_text,
                ] : null,
                'correct' => $correct ? [
                    'letter' => $correct->letter,
                    'text' => $correct->answer_text,
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
     * Sélection adaptative :
     *  1. On force les questions actuellement ratées (last_result = 'wrong').
     *     Si elles sont plus nombreuses que la taille de l'échantillon, on
     *     priorise celles ratées le plus souvent, puis les plus anciennes.
     *  2. On complète avec les questions jamais vues.
     *  3. On complète avec les questions vues 1 fois correctement (streak 1).
     *  4. En dernier, les questions maîtrisées (streak >= 2), pondération faible.
     * Chaque bucket est mélangé pour que l'ordre change à chaque session.
     */
    private function selectQuestions(Certification $certification, int $userId, int $sampleSize): array
    {
        $questionIds = $certification->questions()->reorder()->pluck('id');
        $stats = UserQuestionStat::where('user_id', $userId)
            ->whereIn('question_id', $questionIds)
            ->get()
            ->keyBy('question_id');

        $toReview = collect();
        $unseen = collect();
        $inProgress = collect();
        $mastered = collect();

        foreach ($questionIds as $qid) {
            $s = $stats->get($qid);
            if ($s === null) {
                $unseen->push($qid);
            } elseif ($s->last_result === 'wrong') {
                $toReview->push(['id' => $qid, 'times_wrong' => $s->times_wrong, 'last' => $s->last_seen_at]);
            } elseif ($s->correct_streak >= 2) {
                $mastered->push($qid);
            } else {
                $inProgress->push($qid);
            }
        }

        // 1. Ratées : trier par times_wrong desc puis last_seen_at asc, mais mélanger dans chaque niveau
        $toReviewIds = $toReview
            ->groupBy(fn ($x) => $x['times_wrong'])
            ->sortKeysDesc()
            ->flatMap(fn ($group) => $group->shuffle())
            ->pluck('id')
            ->values();

        $selected = $toReviewIds->take($sampleSize);

        // 2-4. Fill avec le reste
        $remaining = $sampleSize - $selected->count();
        if ($remaining > 0) {
            $filler = collect()
                ->concat($unseen->shuffle())
                ->concat($inProgress->shuffle())
                ->concat($mastered->shuffle())
                ->take($remaining);
            $selected = $selected->concat($filler);
        }

        // Ordre de présentation aléatoire
        return $selected->shuffle()->values()->toArray();
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
