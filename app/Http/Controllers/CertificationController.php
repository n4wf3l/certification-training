<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Models\UserCertificate;
use App\Models\UserQuestionStat;
use App\Services\GamificationService;
use Inertia\Inertia;
use Inertia\Response;

class CertificationController extends Controller
{
    public function show(Certification $certification): Response
    {
        abort_unless($certification->is_active, 404);

        $availableQuestions = $certification->questions()->count();
        $mastery = auth()->check()
            ? $this->masterySummary(auth()->id(), $certification)
            : null;
        $locale = app()->getLocale();
        // target_roles est un array : localized() renvoie array ou array selon
        // ce qui est stocke dans translations[locale][target_roles]. Fallback
        // vers la colonne directe (langue canonique) si absent.
        $targetRoles = $certification->localized($locale, 'target_roles') ?? [];

        return Inertia::render('Certification/Show', [
            'certification' => [
                'id' => $certification->id,
                'title' => $certification->localized($locale, 'title'),
                'slug' => $certification->slug,
                'logo_path' => $certification->logo_path,
                'description' => $certification->localized($locale, 'description'),
                'long_description' => $certification->localized($locale, 'long_description'),
                'importance' => $certification->localized($locale, 'importance'),
                'target_roles' => is_array($targetRoles) ? $targetRoles : [],
                'questions_updated_at' => $certification->questions_updated_at,
                'duration_minutes' => $certification->duration_minutes,
                'passing_score' => $certification->passing_score,
                'total_questions' => $certification->total_questions,
                'validity_months' => $certification->validity_months,
                'validity_note' => $certification->localized($locale, 'validity_note'),
                'version_retires_at' => $certification->version_retires_at?->toDateString(),
                'available_questions' => $availableQuestions,
                'has_course' => is_array($certification->course_blocks) && count($certification->course_blocks) > 0,
                'course_updated_at' => $certification->course_updated_at?->toIso8601String(),
            ],
            'mastery' => $mastery,
            'cert_progress' => $this->certProgress($certification),
        ]);
    }

    /**
     * Progression du user vers le certificat CertifLoop pour cette cert.
     * Rule: 3 mock exams complets d'affilee a 100 %. Renvoie null si guest.
     */
    private function certProgress(Certification $certification): ?array
    {
        if (!auth()->check()) return null;

        $userId = auth()->id();
        $state = app(GamificationService::class)->computeStreakState($userId, $certification->id);

        $awarded = UserCertificate::where('user_id', $userId)
            ->where('certification_id', $certification->id)
            ->first();

        return [
            'perfect_runs' => $state['perfect_runs'],
            'required' => $state['required'],
            'quits_used' => $state['quits_used'],
            'quits_left' => $state['quits_left'],
            'quit_budget' => $state['quit_budget'],
            'awarded' => $awarded !== null,
            'awarded_token' => $awarded?->token,
            'awarded_at' => $awarded?->awarded_at?->toIso8601String(),
        ];
    }

    public function course(Certification $certification): Response
    {
        abort_unless($certification->is_active, 404);

        $payload = $this->basePayload($certification);
        $payload['course_blocks'] = $certification->localizedCourseBlocks();
        $payload['course_updated_at'] = $certification->course_updated_at?->toIso8601String();

        return Inertia::render('Certification/Course', [
            'certification' => $payload,
        ]);
    }

    public function flashcards(Certification $certification): Response
    {
        abort_unless($certification->is_active, 404);

        $questions = $certification->questions()->with('answers')->get()->shuffle()->values()->map(fn ($q) => [
            'id' => $q->id,
            'position' => $q->position,
            'topic' => $q->topic,
            'scenario' => $q->scenario,
            'question_text' => $q->question_text,
            // Shuffle answers and reassign letters so users can't memorize positions
            'answers' => $q->answers->shuffle()->values()->map(fn ($a, $i) => [
                'letter' => chr(65 + $i),
                'answer_text' => $a->answer_text,
                'is_correct' => $a->is_correct,
            ]),
        ]);

        return Inertia::render('Certification/Flashcards', [
            'certification' => $this->basePayload($certification),
            'cards' => $questions,
        ]);
    }

    private function basePayload(Certification $certification): array
    {
        $locale = app()->getLocale();
        return [
            'id' => $certification->id,
            'title' => $certification->localized($locale, 'title'),
            'slug' => $certification->slug,
            'logo_path' => $certification->logo_path,
            'description' => $certification->localized($locale, 'description'),
            'duration_minutes' => $certification->duration_minutes,
            'passing_score' => $certification->passing_score,
            'total_questions' => $certification->total_questions,
            'available_questions' => $certification->questions()->count(),
        ];
    }

    private function masterySummary(int $userId, Certification $certification): array
    {
        $questionIds = $certification->questions()->pluck('id');
        $total = $questionIds->count();
        if ($total === 0) {
            return ['total' => 0, 'mastered' => 0, 'to_review' => 0, 'never_seen' => 0, 'in_progress' => 0];
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
