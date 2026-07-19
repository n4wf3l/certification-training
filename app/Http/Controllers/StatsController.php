<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use Inertia\Inertia;
use Inertia\Response;

class StatsController extends Controller
{
    public function index(): Response
    {
        $userId = auth()->id();

        $attempts = Attempt::query()
            ->with('certification:id,title,slug,logo_path')
            ->where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->get()
            ->map(fn (Attempt $a) => [
                'id' => $a->id,
                'certification' => [
                    'id' => $a->certification->id,
                    'title' => $a->certification->title,
                    'slug' => $a->certification->slug,
                    'logo_path' => $a->certification->logo_path,
                ],
                'score' => $a->score,
                'total_questions' => $a->total_questions,
                'passing_score' => $a->passing_score,
                'percentage' => $a->percentage(),
                'passed' => $a->passed,
                'duration_seconds' => $a->duration_seconds,
                'completed_at' => $a->completed_at,
            ]);

        $summary = [
            'total_attempts' => $attempts->count(),
            'passed_attempts' => $attempts->where('passed', true)->count(),
            'best_percentage' => $attempts->max('percentage') ?? 0,
            'average_percentage' => $attempts->count() > 0
                ? (int) round($attempts->avg('percentage'))
                : 0,
        ];

        return Inertia::render('Stats/Index', [
            'attempts' => $attempts,
            'summary' => $summary,
        ]);
    }
}
