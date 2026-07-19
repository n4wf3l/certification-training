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
                ] : null,
            ],
            'settings' => fn () => [
                'brand_name' => \App\Models\Setting::get('brand_name') ?: 'CertifLoop',
                'brand_logo_path' => \App\Models\Setting::get('brand_logo_path'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
