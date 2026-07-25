<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            // Locale UI resolue par SetLocale (session > user > cookie > header > default).
            // Le t() helper front lit cette valeur pour piocher dans en/fr.
            'locale' => app()->getLocale(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_admin' => $user->isAdmin(),
                    'has_attempts' => \App\Models\Attempt::where('user_id', $user->id)
                        ->whereNotNull('completed_at')
                        ->exists(),
                    // Gamification exposee globalement pour le header
                    'gamification' => [
                        'current_streak' => $user->current_streak ?? 0,
                        'longest_streak' => $user->longest_streak ?? 0,
                        'total_xp' => $user->total_xp ?? 0,
                        'last_activity_date' => $user->last_activity_date?->toDateString(),
                        'badges_count' => $user->badges()->count(),
                    ],
                ] : null,
            ],
            'settings' => fn () => [
                'brand_name' => \App\Models\Setting::get('brand_name') ?: 'CertifLoop',
                'brand_logo_path' => \App\Models\Setting::get('brand_logo_path'),
            ],
            // Feature flags calcules cote serveur. Le front s'en sert pour afficher
            // "Bientot disponible" plutot que de laisser l'user cliquer sur une
            // fonctionnalite qui va echouer avec un message d'erreur technique.
            'features' => fn () => [
                'ai_explain' => ! empty(\App\Models\Setting::get('openai_api_key'))
                    && (int) \App\Models\Setting::get('openai_daily_limit_per_user', 10) > 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
                'gamification_reward' => fn () => $request->session()->get('gamification_reward'),
            ],
        ];
    }
}
