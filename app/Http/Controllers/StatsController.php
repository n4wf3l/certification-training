<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\UserBadge;
use App\Models\UserCertificate;
use Inertia\Inertia;
use Inertia\Response;

class StatsController extends Controller
{
    private const EVOLUTION_MIN_ATTEMPTS = 5;

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

        // Build per-certification evolution series (only when >= EVOLUTION_MIN_ATTEMPTS)
        $evolutions = $attempts
            ->groupBy('certification.id')
            ->filter(fn ($group) => $group->count() >= self::EVOLUTION_MIN_ATTEMPTS)
            ->map(function ($group) {
                // Series must be chronological (oldest → newest)
                $ordered = $group->sortBy('completed_at')->values();
                $first = $ordered->first();
                $last = $ordered->last();
                $percentages = $ordered->pluck('percentage');
                $requiredPct = $first['total_questions'] > 0
                    ? (int) round(($first['passing_score'] / $first['total_questions']) * 100)
                    : 0;

                return [
                    'certification' => $first['certification'],
                    'passing_percentage' => $requiredPct,
                    'points' => $ordered->map(fn ($a, $i) => [
                        'index' => $i + 1,
                        'attempt_id' => $a['id'],
                        'percentage' => $a['percentage'],
                        'passed' => $a['passed'],
                        'duration_seconds' => $a['duration_seconds'],
                        'completed_at' => $a['completed_at'],
                    ])->values(),
                    'stats' => [
                        'total' => $ordered->count(),
                        'passed' => $ordered->where('passed', true)->count(),
                        'best' => (int) $percentages->max(),
                        'worst' => (int) $percentages->min(),
                        'average' => (int) round($percentages->avg()),
                        'first' => (int) $first['percentage'],
                        'last' => (int) $last['percentage'],
                        'delta' => (int) ($last['percentage'] - $first['percentage']),
                        'best_time_seconds' => $ordered->whereNotNull('duration_seconds')->min('duration_seconds'),
                    ],
                ];
            })
            ->values();

        // Gamification : liste des badges obtenus, avec labels du catalogue
        $badges = UserBadge::where('user_id', $userId)
            ->with('certification:id,title,slug,logo_path')
            ->orderByDesc('earned_at')
            ->get()
            ->map(function (UserBadge $b) {
                $catalog = UserBadge::CATALOG[$b->badge_key] ?? ['label' => $b->badge_key, 'description' => '', 'icon' => 'sparkles'];
                return [
                    'key' => $b->badge_key,
                    'label' => $catalog['label'],
                    'description' => $catalog['description'],
                    'icon' => $catalog['icon'],
                    'certification' => $b->certification ? [
                        'title' => $b->certification->title,
                        'slug' => $b->certification->slug,
                    ] : null,
                    'meta' => $b->meta,
                    'earned_at' => $b->earned_at?->toIso8601String(),
                ];
            });

        // Certificats obtenus (maitrise >= 90% sur une certif)
        $certificates = UserCertificate::where('user_id', $userId)
            ->with('certification:id,title,slug,logo_path')
            ->orderByDesc('awarded_at')
            ->get()
            ->map(fn (UserCertificate $c) => [
                'token' => $c->token,
                'awarded_at' => $c->awarded_at?->toIso8601String(),
                'awarded_date' => $c->awarded_at?->translatedFormat('d F Y'),
                'best_score' => $c->best_score,
                'total_questions' => $c->total_questions,
                'mastery_pct' => $c->mastery_pct,
                'certification' => $c->certification ? [
                    'title' => $c->certification->title,
                    'slug' => $c->certification->slug,
                    'logo_path' => $c->certification->logo_path,
                ] : null,
                'public_url' => route('certificate.show', $c->token),
                'pdf_url' => route('certificate.pdf', $c->token),
                'linkedin_url' => 'https://www.linkedin.com/sharing/share-offsite/?url=' . urlencode(route('certificate.show', $c->token)),
            ]);

        return Inertia::render('Stats/Index', [
            'attempts' => $attempts,
            'summary' => $summary,
            'evolutions' => $evolutions,
            'evolution_min_attempts' => self::EVOLUTION_MIN_ATTEMPTS,
            'badges' => $badges,
            'certificates' => $certificates,
        ]);
    }
}
