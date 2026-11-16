<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Session;
use App\Support\AnonymousDatabaseSessionHandler;
use App\Support\ClientKey;
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

        // E-mail de confirmation d'adresse : gabarit du site, dans la langue de la page
        // d'inscription (le lien garde aussi le prefixe /en le cas echeant).
        \Illuminate\Auth\Notifications\VerifyEmail::toMailUsing(function ($notifiable, string $url) {
            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject(__('emails.verify.subject'))
                ->view('emails.verify-email', [
                    'url' => $url,
                    'user' => $notifiable,
                    'minutes' => (int) config('auth.verification.expire', 60),
                    'brandName' => Setting::get('brand_name') ?: 'CertifLoop',
                ]);
        });

        // Sessions en base sans IP ni user-agent (voir /legal). Remplace le driver
        // "database" de Laravel, qui les enregistre par defaut.
        Session::extend('database', function ($app) {
            $config = $app['config']['session'];

            return new AnonymousDatabaseSessionHandler(
                $app['db']->connection($config['connection'] ?? null),
                $config['table'],
                $config['lifetime'],
                $app
            );
        });

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
     * sensitive routes. Par utilisateur une fois connecte ; pour un visiteur, par
     * empreinte HMAC de l'IP (ClientKey) : l'IP elle-meme n'est jamais stockee.
     */
    private function configureRateLimiters(): void
    {
        // Filet global sur toutes les pages web : 240 requetes / minute / client.
        // Un vrai utilisateur n'en fait pas 20. La vraie protection DDoS se fait en
        // amont (Cloudflare, nginx limit_req) : voir le README.
        RateLimiter::for('global', function (Request $request) {
            return Limit::perMinute(240)->by(ClientKey::for($request));
        });

        // Inscription : 3 comptes / heure / client, et 200 / jour pour tout le site,
        // pour qu'un robot ne puisse pas remplir la base de comptes vides.
        RateLimiter::for('register', function (Request $request) {
            return [
                Limit::perHour(3)->by('register:'.ClientKey::anonymousIp($request)),
                Limit::perDay(200)->by('register:all'),
            ];
        });

        // Login / register / password-reset : 5 attempts / minute / IP.
        // Standard defense against credential stuffing bots.
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by(ClientKey::anonymousIp($request));
        });

        // Question reports : anti-spam, 10 reports / hour / user.
        RateLimiter::for('reports', function (Request $request) {
            return Limit::perHour(10)->by(ClientKey::for($request));
        });

        // Exam start : 20 starts / hour / user. Empeche le grinding automatise.
        RateLimiter::for('exam-start', function (Request $request) {
            return Limit::perHour(20)->by(ClientKey::for($request));
        });

        // Public certificate share page : 60 hits / minute / IP. Suffisant pour
        // un vrai visiteur (partage LinkedIn), stoppe le scraping.
        RateLimiter::for('certificate-public', function (Request $request) {
            return Limit::perMinute(60)->by(ClientKey::anonymousIp($request));
        });

        // Data export (RGPD) : 3 exports / hour / user. Coute cher (aggregation
        // sur toutes les tables), et un vrai user en a besoin 1 fois maximum.
        RateLimiter::for('data-export', function (Request $request) {
            return Limit::perHour(3)->by(ClientKey::for($request));
        });

        // AI explanation : 30 / hour / user en surface, avec la per-user daily
        // limit gerée cote controller par-dessus.
        RateLimiter::for('ai-explain', function (Request $request) {
            return Limit::perHour(30)->by(ClientKey::for($request));
        });
    }
}
