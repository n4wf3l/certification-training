<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resout la locale UI de la requete courante selon la priorite suivante :
 *
 * 1. ?lang=xx dans la query string (override explicite pour partage de liens)
 * 2. session()->get('ui_locale') (preference persistee cote client via LocaleController)
 * 3. user->preferred_locale (user authentifie avec preference DB)
 * 4. cookie 'ui_locale' (fallback guest apres switch)
 * 5. Accept-Language header (best-guess navigateur)
 * 6. config('app.fallback_locale') / 'en' (defaut plateforme)
 *
 * La valeur est stockee dans app()->getLocale() pour Laravel translator, et
 * partagee via Inertia (HandleInertiaRequests) au front pour le t() helper.
 */
class SetLocale
{
    public const SUPPORTED = ['en', 'fr'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);
        app()->setLocale($locale);
        // Persiste en session pour que les redirects gardent la locale (le
        // middleware retourne la meme valeur au prochain hit).
        $request->session()->put('ui_locale', $locale);
        return $next($request);
    }

    private function resolveLocale(Request $request): string
    {
        // 1. Query string ?lang=xx
        $fromQuery = $request->query('lang');
        if (is_string($fromQuery) && $this->isSupported($fromQuery)) {
            return $fromQuery;
        }

        // 2. Session (persisted user choice)
        $fromSession = $request->session()->get('ui_locale');
        if (is_string($fromSession) && $this->isSupported($fromSession)) {
            return $fromSession;
        }

        // 3. User preference in DB
        $user = $request->user();
        if ($user && is_string($user->preferred_locale) && $this->isSupported($user->preferred_locale)) {
            return $user->preferred_locale;
        }

        // 4. Cookie (guest fallback across sessions)
        $fromCookie = $request->cookie('ui_locale');
        if (is_string($fromCookie) && $this->isSupported($fromCookie)) {
            return $fromCookie;
        }

        // 5. Accept-Language header
        $preferred = $request->getPreferredLanguage(self::SUPPORTED);
        if (is_string($preferred) && $this->isSupported($preferred)) {
            return $preferred;
        }

        // 6. Platform default
        return config('app.fallback_locale', 'en');
    }

    private function isSupported(string $code): bool
    {
        return in_array(strtolower($code), self::SUPPORTED, true);
    }
}
