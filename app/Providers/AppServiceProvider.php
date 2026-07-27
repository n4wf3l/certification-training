<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $this->configureRateLimiters();

        // Share brand settings with all Blade views (so <head> can render favicon + title).
        View::composer('*', function ($view) {
            $brandName = 'CertifLoop';
            $brandLogoUrl = null;
            try {
                if (Schema::hasTable('settings')) {
                    $brandName = Setting::get('brand_name') ?: 'CertifLoop';
                    $logoPath = Setting::get('brand_logo_path');
                    if ($logoPath) {
                        $brandLogoUrl = asset('storage/'.$logoPath);
                    }
                }
            } catch (\Throwable $e) {
                // Skip if DB isn't ready (fresh install / migration).
            }
            $view->with([
                'brandName' => $brandName,
                'brandLogoUrl' => $brandLogoUrl,
            ]);
        });
    }

    /**
     * Named RateLimiter bindings used via ->middleware('throttle:xxx') on
     * sensitive routes. IP-based for guests, user-scoped for authenticated.
     */
    private function configureRateLimiters(): void
    {
        // Login / register / password-reset : 5 attempts / minute / IP.
        // Standard defense against credential stuffing bots.
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Question reports : anti-spam, 10 reports / hour / user.
        RateLimiter::for('reports', function (Request $request) {
            return Limit::perHour(10)->by($request->user()?->id ?: $request->ip());
        });

        // Exam start : 20 starts / hour / user. Empeche le grinding automatise.
        RateLimiter::for('exam-start', function (Request $request) {
            return Limit::perHour(20)->by($request->user()?->id ?: $request->ip());
        });

        // Public certificate share page : 60 hits / minute / IP. Suffisant pour
        // un vrai visiteur (partage LinkedIn), stoppe le scraping.
        RateLimiter::for('certificate-public', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // Data export (RGPD) : 3 exports / hour / user. Coute cher (aggregation
        // sur toutes les tables), et un vrai user en a besoin 1 fois maximum.
        RateLimiter::for('data-export', function (Request $request) {
            return Limit::perHour(3)->by($request->user()?->id ?: $request->ip());
        });

        // AI explanation : 30 / hour / user en surface, avec la per-user daily
        // limit gerée cote controller par-dessus.
        RateLimiter::for('ai-explain', function (Request $request) {
            return Limit::perHour(30)->by($request->user()?->id ?: $request->ip());
        });
    }
}
