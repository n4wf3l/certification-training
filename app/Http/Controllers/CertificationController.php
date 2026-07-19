<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Models\UserQuestionStat;
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

        return Inertia::render('Certification/Show', [
            'certification' => [
                'id' => $certification->id,
                'title' => $certification->title,
                'slug' => $certification->slug,
                'logo_path' => $certification->logo_path,
                'description' => $certification->description,
                'long_description' => $certification->long_description,
                'importance' => $certification->importance,
                'target_roles' => $certification->target_roles ?? [],
                'questions_updated_at' => $certification->questions_updated_at,
                'duration_minutes' => $certification->duration_minutes,
                'passing_score' => $certification->passing_score,
                'total_questions' => $certification->total_questions,
                'validity_months' => $certification->validity_months,
                'validity_note' => $certification->validity_note,
                'version_retires_at' => $certification->version_retires_at?->toDateString(),
                'available_questions' => $availableQuestions,
            ],
            'mastery' => $mastery,
        ]);
    }

    public function course(Certification $certification): Response
    {
        abort_unless($certification->is_active, 404);

        $payload = $this->basePayload($certification);
        $payload['course_blocks'] = $certification->course_blocks;
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
            'answers' => $q->answers->map(fn ($a) => [
                'letter' => $a->letter,
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
        return [
            'id' => $certification->id,
            'title' => $certification->title,
            'slug' => $certification->slug,
            'logo_path' => $certification->logo_path,
            'description' => $certification->description,
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
