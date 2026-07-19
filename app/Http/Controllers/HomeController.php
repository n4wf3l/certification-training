<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Models\Question;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $certifications = Certification::query()
            ->where('is_active', true)
            ->withCount('questions')
            ->orderBy('title')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'slug' => $c->slug,
                'description' => $c->description,
                'logo_path' => $c->logo_path,
                'duration_minutes' => $c->duration_minutes,
                'passing_score' => $c->passing_score,
                'total_questions' => $c->total_questions,
                'available_questions' => $c->questions_count,
                'questions_updated_at' => $c->questions_updated_at,
                'validity_months' => $c->validity_months,
                'version_retires_at' => $c->version_retires_at?->toDateString(),
                'ready' => $c->questions_count > 0,
            ]);

        // Teaser pour les guests : 3 questions réelles tirées aléatoirement
        $teaserQuestions = null;
        if (! auth()->check()) {
            $teaserQuestions = $this->buildTeaser();
        }

        return Inertia::render('Home', [
            'certifications' => $certifications,
            'teaser_questions' => $teaserQuestions,
        ]);
    }

    /**
     * Tire 3 questions aléatoires (en évitant les doublons de certification quand
     * possible) pour donner un aperçu jouable aux visiteurs non connectés.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildTeaser(int $count = 3): array
    {
        // On récupère les IDs, shuffle côté PHP (Question a un default orderBy('position'))
        $ids = Question::query()
            ->whereHas('certification', fn ($q) => $q->where('is_active', true))
            ->reorder()
            ->pluck('id', 'certification_id');

        if ($ids->isEmpty()) return [];

        // Regroupe par certif → shuffle chaque groupe → prend 1 par certif dans l'ordre
        // (garantit la diversité tant qu'il y a assez de certifs)
        $byCert = Question::query()
            ->whereHas('certification', fn ($q) => $q->where('is_active', true))
            ->reorder()
            ->get(['id', 'certification_id'])
            ->groupBy('certification_id');

        $picked = collect();
        $shuffledCerts = $byCert->keys()->shuffle();
        foreach ($shuffledCerts as $certId) {
            if ($picked->count() >= $count) break;
            $picked->push($byCert->get($certId)->random()->id);
        }
        // S'il en manque encore (< count certifs), on complète avec des ids aléatoires globaux
        while ($picked->count() < $count) {
            $remaining = Question::query()
                ->whereHas('certification', fn ($q) => $q->where('is_active', true))
                ->whereNotIn('id', $picked)
                ->reorder()
                ->pluck('id')
                ->shuffle()
                ->first();
            if (! $remaining) break;
            $picked->push($remaining);
        }

        return Question::query()
            ->with(['answers', 'certification:id,title,slug,logo_path'])
            ->whereIn('id', $picked->take($count))
            ->get()
            ->map(fn (Question $q) => [
                'id' => $q->id,
                'topic' => $q->topic,
                'scenario' => $q->scenario,
                'question_text' => $q->question_text,
                'certification' => [
                    'title' => $q->certification->title,
                    'slug' => $q->certification->slug,
                    'logo_path' => $q->certification->logo_path,
                ],
                'answers' => $q->answers
                    ->sortBy('letter')
                    ->values()
                    ->map(fn ($a) => [
                        'letter' => $a->letter,
                        'text' => $a->answer_text,
                        'is_correct' => (bool) $a->is_correct,
                    ])
                    ->all(),
            ])
            ->values()
            ->all();
    }
}
