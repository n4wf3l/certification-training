<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Une adresse par langue : l'anglais a la racine (/legal), le francais sous
 * /fr (/fr/legal). La langue d'une page vient de son adresse, ce qui permet a
 * Google d'indexer les deux versions (canonique + hreflang + sitemap).
 *
 * Les routes web sont enregistrees sous le prefixe de la requete courante
 * (routes/web.php) : Ziggy genere donc des liens qui restent dans la langue.
 * Consequence : pas de `php artisan route:cache` (il figerait un seul prefixe).
 */
class LocaleUrl
{
    public const DEFAULT = 'en';

    /** Langues servies sous un prefixe d'URL (la langue par defaut est a la racine). */
    public const PREFIXED = ['fr'];

    /**
     * Anciens prefixes (le francais etait a la racine et l'anglais sous /en
     * jusqu'en novembre 2026) : redirection permanente vers la racine.
     */
    public const LEGACY = ['en'];

    /** Langue portee par le premier segment de l'adresse, ou null si aucun. */
    public static function fromRequest(Request $request): ?string
    {
        $first = $request->segment(1);

        return in_array($first, self::PREFIXED, true) ? $first : null;
    }

    /** Prefixe de route pour la requete courante ('' ou 'fr'). */
    public static function prefix(): string
    {
        // Commandes artisan : pas de requete HTTP, donc routes sans prefixe.
        if (app()->runningInConsole() && ! app()->runningUnitTests()) {
            return '';
        }

        return self::fromRequest(request()) ?? '';
    }

    /** Chemin sans le prefixe de langue, toujours avec un "/" initial. */
    public static function basePath(Request $request): string
    {
        $path = '/'.ltrim($request->path(), '/');
        foreach (self::PREFIXED as $code) {
            if ($path === "/$code") {
                return '/';
            }
            if (str_starts_with($path, "/$code/")) {
                return substr($path, strlen($code) + 1);
            }
        }

        return $path;
    }

    /** Adresse absolue d'un chemin "de base" dans une langue donnee. */
    public static function to(string $basePath, string $locale): string
    {
        $basePath = '/'.ltrim($basePath, '/');
        if ($locale === self::DEFAULT) {
            return url($basePath);
        }

        return url(rtrim("/$locale$basePath", '/'));
    }

    /** ['en' => url, 'fr' => url] pour la page courante. */
    public static function alternates(Request $request): array
    {
        $base = self::basePath($request);
        $urls = [self::DEFAULT => self::to($base, self::DEFAULT)];
        foreach (self::PREFIXED as $code) {
            $urls[$code] = self::to($base, $code);
        }

        return $urls;
    }
}
