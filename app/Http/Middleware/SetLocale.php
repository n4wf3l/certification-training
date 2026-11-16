<?php

namespace App\Http\Middleware;

use App\Support\LocaleUrl;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * La langue d'une page vient de son adresse : racine = francais, /en/... = anglais
 * (App\Support\LocaleUrl). C'est ce qui permet a Google d'indexer les deux langues.
 *
 * Confort : un visiteur qui a explicitement choisi l'anglais (cookie du
 * LocaleSwitcher ou preference de son compte) et qui arrive sur une adresse
 * francaise est redirige vers la version /en. Les robots, sans cookie, voient
 * chaque adresse dans sa propre langue. L'ancien ?lang=xx redirige vers la bonne adresse.
 *
 * Hors pages (POST /locale, robots.txt, sitemap.xml) : la langue de la session.
 */
class SetLocale
{
    public const SUPPORTED = ['en', 'fr'];

    /** Chemins servis hors prefixe de langue. */
    private const UNPREFIXED = ['locale', 'robots.txt', 'sitemap.xml'];

    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->path(), self::UNPREFIXED, true)) {
            $fromSession = $request->session()->get('ui_locale');
            app()->setLocale($this->storedPreference($request)
                ?? (is_string($fromSession) && $this->isSupported($fromSession) ? $fromSession : LocaleUrl::DEFAULT));

            return $next($request);
        }

        $fromUrl = LocaleUrl::fromRequest($request) ?? LocaleUrl::DEFAULT;

        if ($request->isMethod('GET')) {
            // Ancien format de lien partage : ?lang=en -> /en/...
            $fromQuery = $request->query('lang');
            if (is_string($fromQuery) && $this->isSupported($fromQuery)) {
                return $this->redirectTo($request, strtolower($fromQuery));
            }

            // Preference explicite pour l'anglais, sur une adresse francaise.
            if ($fromUrl === LocaleUrl::DEFAULT && $this->storedPreference($request) === 'en') {
                return $this->redirectTo($request, 'en');
            }
        }

        app()->setLocale($fromUrl);
        $request->session()->put('ui_locale', $fromUrl);

        return $next($request);
    }

    /** Choix explicite du visiteur : compte, puis cookie du LocaleSwitcher. */
    private function storedPreference(Request $request): ?string
    {
        $user = $request->user();
        if ($user && is_string($user->preferred_locale) && $this->isSupported($user->preferred_locale)) {
            return $user->preferred_locale;
        }
        $fromCookie = $request->cookie('ui_locale');

        return is_string($fromCookie) && $this->isSupported($fromCookie) ? $fromCookie : null;
    }

    private function redirectTo(Request $request, string $locale): Response
    {
        $query = collect($request->query())->except('lang')->all();
        $url = LocaleUrl::to(LocaleUrl::basePath($request), $locale);

        $target = $query ? $url.'?'.http_build_query($query) : $url;

        // Visite Inertia : rechargement complet, pour que les liens (Ziggy) suivent la langue.
        return $request->header('X-Inertia') ? \Inertia\Inertia::location($target) : redirect()->to($target);
    }

    private function isSupported(string $code): bool
    {
        return in_array(strtolower($code), self::SUPPORTED, true);
    }
}
