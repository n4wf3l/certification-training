<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Certification;
use App\Models\Question;
use App\Models\QuestionStat;
use App\Models\Setting;
use App\Models\UserQuestionStat;
use App\Services\GamificationService;
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

        $canonical = $certification->default_language ?? 'en';
        $available = $certification->available_languages ?: [$canonical];

        // Nombre de questions eligibles par langue :
        // - langue canonique : toutes les questions (les champs directs sont la source de verite)
        // - autre langue : uniquement les questions avec translations->{locale} complet
        $languagePools = [];
        foreach ($available as $lang) {
            $count = $this->eligibleQuestionsQuery($certification, $lang)->count();
            $sample = $this->sampleSize($certification, $count);
            $languagePools[$lang] = [
                'available' => $count,
                'sample_size' => $sample,
                'scaled_passing_score' => $this->scaledPassingScore($certification, $sample),
            ];
        }

        $canonicalPool = $languagePools[$canonical] ?? ['available' => 0, 'sample_size' => 0, 'scaled_passing_score' => 0];
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
                'available_questions' => $canonicalPool['available'],
                'sample_size' => $canonicalPool['sample_size'],
                'scaled_passing_score' => $canonicalPool['scaled_passing_score'],
                'available_languages' => $available,
                'default_language' => $canonical,
                'language_pools' => $languagePools,
            ],
            'mastery' => $mastery,
            'allow_instant_feedback' => (bool) Setting::get('allow_instant_feedback', false),
        ]);
    }

    /**
     * Retourne la query des questions eligibles pour cette langue.
     * En langue canonique : tout est eligible (colonnes directes).
     * En langue traduite : uniquement les questions dont translations->{locale}
     * contient question_text (proxy pour "traduction significative disponible").
     */
    private function eligibleQuestionsQuery(Certification $certification, string $locale)
    {
        $canonical = $certification->default_language ?? 'en';
        $query = $certification->questions();
        if ($locale === $canonical) {
            return $query;
        }
        return $query->whereNotNull('translations')
            ->whereRaw("json_extract(translations, '$.\"" . $locale . "\".question_text') IS NOT NULL");
    }

    public function start(Request $request, Certification $certification): RedirectResponse
    {
        abort_unless($certification->is_active, 404);

        // Locale de l'exam : validee contre les langues assignees a la certif.
        // Fallback = default_language de la certif (langue des colonnes directes).
        $available = $certification->available_languages ?: [$certification->default_language ?? 'en'];
        $requestedLang = $request->input('lang');
        $locale = (is_string($requestedLang) && in_array($requestedLang, $available, true))
            ? $requestedLang
            : ($certification->default_language ?? 'en');

        // Le pool depend de la langue : en langue non canonique, seules les questions
        // avec traduction complete sont eligibles.
        $availableQuestions = $this->eligibleQuestionsQuery($certification, $locale)->count();
        abort_if($availableQuestions === 0, 422, __('flash.exam_no_questions_language'));

        $sampleSize = $this->sampleSize($certification, $availableQuestions);
        $scaledPassing = $this->scaledPassingScore($certification, $sampleSize);

        // Feedback mode : forcé à 'deferred' si l'admin a désactivé le mode instantané,
        // sinon respecte le choix de l'utilisateur.
        $requestedMode = $request->input('feedback_mode', 'deferred');
        $allowInstant = (bool) Setting::get('allow_instant_feedback', false);
        $feedbackMode = ($allowInstant && $requestedMode === 'instant') ? 'instant' : 'deferred';

        return DB::transaction(function () use ($certification, $sampleSize, $scaledPassing, $feedbackMode, $locale) {
            $selectedIds = $this->selectQuestions($certification, auth()->id(), $sampleSize, $locale);

            $attempt = Attempt::create([
                'user_id' => auth()->id(),
                'certification_id' => $certification->id,
                'total_questions' => $sampleSize,
                'passing_score' => $scaledPassing,
                'feedback_mode' => $feedbackMode,
                'started_at' => now(),
                'locale' => $locale,
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

    /**
     * Mode "practice cible" : lance une session courte sur un seul domaine du syllabus.
     * Utile apres un exam blanc pour retravailler les points faibles.
     */
    public function practiceStart(Request $request, Certification $certification, string $domain): RedirectResponse
    {
        abort_unless($certification->is_active, 404);

        // Locale du practice : validee comme pour un exam complet.
        $available = $certification->available_languages ?: [$certification->default_language ?? 'en'];
        $requestedLang = $request->input('lang');
        $locale = (is_string($requestedLang) && in_array($requestedLang, $available, true))
            ? $requestedLang
            : ($certification->default_language ?? 'en');

        // Sanity check : le domaine existe-t-il dans le blueprint OU sur au moins 1 question (dans cette langue) ?
        $blueprint = $certification->syllabus_blueprint ?? [];
        $inBlueprint = array_key_exists($domain, $blueprint);
        $availableInDomain = $this->eligibleQuestionsQuery($certification, $locale)
            ->where('syllabus_domain', $domain)
            ->count();
        abort_if(!$inBlueprint && $availableInDomain === 0, 404, __('flash.exam_domain_unknown'));
        abort_if($availableInDomain === 0, 422, __('flash.exam_no_questions_domain_language'));

        // Practice : session courte, 15 questions (ou moins si le pool est plus petit)
        $sampleSize = (int) min(15, $availableInDomain);
        // Seuil : 70% pour "réussir" une pratique - c'est un entraînement, pas un vrai examen
        $scaledPassing = (int) max(1, ceil($sampleSize * 0.7));

        return DB::transaction(function () use ($certification, $domain, $sampleSize, $scaledPassing, $locale) {
            // Picker restreint au domaine + langue avec la meme priorite adaptative
            $questionIds = $this->eligibleQuestionsQuery($certification, $locale)
                ->where('syllabus_domain', $domain)
                ->pluck('id')
                ->all();

            $stats = UserQuestionStat::where('user_id', auth()->id())
                ->whereIn('question_id', $questionIds)
                ->get()
                ->keyBy('question_id');

            $priorityOf = function (int $qid) use ($stats): array {
                $s = $stats->get($qid);
                if ($s === null) return [1, 0];
                if ($s->last_result === 'wrong') return [0, -($s->times_wrong ?? 0)];
                if ($s->correct_streak >= 2) return [3, 0];
                return [2, 0];
            };
            $keyed = array_map(fn ($id) => ['id' => $id, 'p' => $priorityOf($id), 'r' => mt_rand()], $questionIds);
            usort($keyed, fn ($a, $b) => [$a['p'][0], $a['p'][1], $a['r']] <=> [$b['p'][0], $b['p'][1], $b['r']]);
            $selectedIds = collect(array_slice(array_column($keyed, 'id'), 0, $sampleSize))->shuffle()->values()->toArray();

            $attempt = Attempt::create([
                'user_id' => auth()->id(),
                'certification_id' => $certification->id,
                'total_questions' => $sampleSize,
                'passing_score' => $scaledPassing,
                'feedback_mode' => 'deferred',
                'practice_domain' => $domain,
                'started_at' => now(),
                'locale' => $locale,
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

        $isInstant = $attempt->feedback_mode === 'instant';
        $canonical = $certification->default_language ?? 'en';
        $locale = $attempt->locale ?: $canonical;

        $questions = $items->map(function (AttemptAnswer $aa) use ($attempt, $isInstant, $locale, $canonical) {
            $shuffled = $this->shuffledAnswers($aa->question->answers, $this->answerSeed($attempt->id, $aa->question->id));
            return [
                'id' => $aa->question->id,
                'position' => $aa->position,
                'topic' => $aa->question->localized($locale, 'topic', $canonical),
                'scenario' => $aa->question->localized($locale, 'scenario', $canonical),
                'question_text' => $aa->question->localized($locale, 'question_text', $canonical),
                // Explication uniquement en mode instant (dévoilée après réponse)
                'explanation' => $isInstant ? $aa->question->localized($locale, 'explanation', $canonical) : null,
                'answers' => collect($shuffled)->map(fn ($a, $i) => array_filter([
                    'id' => $a->id,
                    'letter' => chr(65 + $i),
                    'answer_text' => $a->localized($locale, 'answer_text', $canonical),
                    // is_correct et rationale uniquement en mode instant
                    'is_correct' => $isInstant ? (bool) $a->is_correct : null,
                    'rationale' => $isInstant ? $a->localized($locale, 'rationale', $canonical) : null,
                ], fn ($v) => $v !== null))->values(),
            ];
        });

        return Inertia::render('Exam/Take', [
            'attempt' => [
                'id' => $attempt->id,
                'started_at' => $attempt->started_at,
                'duration_minutes' => $certification->duration_minutes,
                'feedback_mode' => $attempt->feedback_mode,
                'locale' => $locale,
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
                $this->recordCrowdStat($aa->question_id, $answerId, $isCorrect);

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

        // Gamification : XP + streak + badges (hors transaction pour ne pas rollback si echec)
        try {
            $attempt->refresh()->load('user', 'certification');
            $reward = app(GamificationService::class)->processAttempt($attempt);
            // On stocke le reward en session pour affichage sur la page result
            session()->flash('gamification_reward', $reward);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Gamification failed', ['error' => $e->getMessage()]);
        }

        return redirect()->route('exam.result', $attempt);
    }

    public function result(Attempt $attempt): Response
    {
        $this->authorizeAttempt($attempt);
        abort_unless($attempt->isCompleted(), 404);

        $attempt->load(['certification', 'attemptAnswers.question.answers', 'attemptAnswers.question.stat', 'attemptAnswers.answer']);
        $canonical = $attempt->certification->default_language ?? 'en';
        $locale = $attempt->locale ?: $canonical;

        $details = $attempt->attemptAnswers->sortBy('position')->values()->map(function (AttemptAnswer $aa) use ($attempt, $locale, $canonical) {
            $correct = $aa->question->answers->firstWhere('is_correct', true);
            // Rebuild the same shuffled order used during the exam so displayed letters match
            $shuffled = $this->shuffledAnswers($aa->question->answers, $this->answerSeed($attempt->id, $aa->question->id));
            $letterMap = collect($shuffled)->mapWithKeys(fn ($a, $i) => [$a->id => chr(65 + $i)]);

            // Crowd stats : n'inclure que si un seuil minimum est atteint (statistiquement significatif)
            $crowd = null;
            $stat = $aa->question->stat;
            if ($stat && $stat->total_seen >= 5) {
                $dist = $stat->answer_distribution ?? [];
                $topWrong = null;
                foreach ($dist as $ansIdKey => $count) {
                    if ($ansIdKey === 'null') continue;
                    $ansId = (int) $ansIdKey;
                    if ($correct && $ansId === $correct->id) continue; // skip la bonne reponse
                    if ($topWrong === null || $count > $topWrong['count']) {
                        $topWrong = ['answer_id' => $ansId, 'count' => $count];
                    }
                }
                $crowd = [
                    'total_seen' => $stat->total_seen,
                    'correct_rate' => $stat->total_seen > 0 ? round($stat->correct_count / $stat->total_seen * 100) : 0,
                    'top_wrong' => $topWrong ? [
                        'letter' => $letterMap[$topWrong['answer_id']] ?? '?',
                        'pct' => $stat->total_seen > 0 ? round($topWrong['count'] / $stat->total_seen * 100) : 0,
                    ] : null,
                ];
            }

            return [
                'question_id' => $aa->question->id,
                'position' => $aa->position,
                'question_text' => $aa->question->localized($locale, 'question_text', $canonical),
                'scenario' => $aa->question->localized($locale, 'scenario', $canonical),
                'topic' => $aa->question->localized($locale, 'topic', $canonical),
                'syllabus_domain' => $aa->question->syllabus_domain,
                'explanation' => $aa->question->localized($locale, 'explanation', $canonical),
                'is_correct' => $aa->is_correct,
                'chosen' => $aa->answer ? [
                    'id' => $aa->answer->id,
                    'letter' => $letterMap[$aa->answer->id] ?? $aa->answer->letter,
                    'text' => $aa->answer->localized($locale, 'answer_text', $canonical),
                    'rationale' => $aa->answer->localized($locale, 'rationale', $canonical),
                ] : null,
                'correct' => $correct ? [
                    'id' => $correct->id,
                    'letter' => $letterMap[$correct->id] ?? $correct->letter,
                    'text' => $correct->localized($locale, 'answer_text', $canonical),
                    'rationale' => $correct->localized($locale, 'rationale', $canonical),
                ] : null,
                'crowd' => $crowd,
            ];
        });

        $comparison = $this->buildComparison($attempt);

        // Score par domaine syllabus (pour proposer des sessions "practice" ciblees sur les points faibles)
        $domainBreakdown = [];
        foreach ($attempt->attemptAnswers as $aa) {
            $d = $aa->question->syllabus_domain;
            if (!$d) continue;
            $domainBreakdown[$d] ??= ['seen' => 0, 'correct' => 0];
            $domainBreakdown[$d]['seen']++;
            if ($aa->is_correct) $domainBreakdown[$d]['correct']++;
        }
        $domainBreakdown = collect($domainBreakdown)->map(fn ($v, $k) => [
            'domain' => $k,
            'seen' => $v['seen'],
            'correct' => $v['correct'],
            'pct' => $v['seen'] > 0 ? round($v['correct'] / $v['seen'] * 100) : 0,
        ])->sortBy('pct')->values()->all();

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
                'practice_domain' => $attempt->practice_domain,
                'locale' => $locale,
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
            'domain_breakdown' => $domainBreakdown,
        ]);
    }

    public function downloadResult(Attempt $attempt)
    {
        $this->authorizeAttempt($attempt);
        abort_unless($attempt->isCompleted(), 404);

        $attempt->load(['certification', 'attemptAnswers.question.answers', 'attemptAnswers.answer']);
        $canonical = $attempt->certification->default_language ?? 'en';
        $locale = $attempt->locale ?: $canonical;

        $details = $attempt->attemptAnswers->sortBy('position')->values()->map(function (AttemptAnswer $aa) use ($attempt, $locale, $canonical) {
            $correct = $aa->question->answers->firstWhere('is_correct', true);
            $shuffled = $this->shuffledAnswers($aa->question->answers, $this->answerSeed($attempt->id, $aa->question->id));
            $letterMap = collect($shuffled)->mapWithKeys(fn ($a, $i) => [$a->id => chr(65 + $i)]);
            return [
                'position' => $aa->position,
                'topic' => $aa->question->localized($locale, 'topic', $canonical),
                'question_text' => $aa->question->localized($locale, 'question_text', $canonical),
                'scenario' => $aa->question->localized($locale, 'scenario', $canonical),
                'explanation' => $aa->question->localized($locale, 'explanation', $canonical),
                'is_correct' => $aa->is_correct,
                'chosen' => $aa->answer ? [
                    'letter' => $letterMap[$aa->answer->id] ?? $aa->answer->letter,
                    'text' => $aa->answer->localized($locale, 'answer_text', $canonical),
                ] : null,
                'correct' => $correct ? [
                    'letter' => $letterMap[$correct->id] ?? $correct->letter,
                    'text' => $correct->localized($locale, 'answer_text', $canonical),
                ] : null,
            ];
        })->all();

        $seconds = (int) ($attempt->duration_seconds ?? 0);
        $mins = intdiv($seconds, 60);
        $secs = $seconds % 60;
        $durationHuman = sprintf('%02d:%02d', $mins, $secs);

        $data = [
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'total_questions' => $attempt->total_questions,
                'passing_score' => $attempt->passing_score,
                'percentage' => $attempt->percentage(),
                'passed' => (bool) $attempt->passed,
                'started_at' => $attempt->started_at?->toIso8601String(),
                'completed_at' => $attempt->completed_at?->toIso8601String(),
            ],
            'certification' => [
                'title' => $attempt->certification->title,
                'slug' => $attempt->certification->slug,
            ],
            'details' => $details,
            'duration_human' => $durationHuman,
            'generated_at' => now()->format('d/m/Y à H:i'),
            'brand_name' => Setting::get('brand_name') ?: 'CertifLoop',
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.exam-result', $data);
        $filename = sprintf(
            'resultat-%s-%s-%s.pdf',
            $attempt->certification->slug,
            $attempt->passed ? 'valide' : 'a-retravailler',
            $attempt->completed_at?->format('Y-m-d-His') ?? 'now'
        );

        return $pdf->download($filename);
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
     * affect scoring - only the visual order and displayed letters change.
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
    private function selectQuestions(Certification $certification, int $userId, int $sampleSize, ?string $locale = null): array
    {
        $canonical = $certification->default_language ?? 'en';
        $locale = $locale ?: $canonical;
        $questions = $this->eligibleQuestionsQuery($certification, $locale)
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

    /**
     * Aggregation temps reel des stats "crowd" par question :
     *   - total_seen : nombre de tentatives ou la question est apparue
     *   - correct_count : nombre de bonnes reponses
     *   - answer_distribution : { "answer_id_str": count, ... } pour les choix de reponse
     *
     * Anonyme (aucun user_id), agrege sur tous les users. Sert a montrer
     * "34% se sont trompes ici" sur la page resultat.
     */
    private function recordCrowdStat(int $questionId, ?int $answerId, bool $isCorrect): void
    {
        $stat = QuestionStat::firstOrNew(['question_id' => $questionId]);
        $stat->total_seen = ($stat->total_seen ?? 0) + 1;
        if ($isCorrect) {
            $stat->correct_count = ($stat->correct_count ?? 0) + 1;
        }
        $dist = $stat->answer_distribution ?? [];
        if ($answerId !== null) {
            $key = (string) $answerId;
            $dist[$key] = ($dist[$key] ?? 0) + 1;
        } else {
            $dist['null'] = ($dist['null'] ?? 0) + 1; // non repondue
        }
        $stat->answer_distribution = $dist;
        $stat->save();
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
