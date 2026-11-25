<?php

namespace App\Http\Controllers;

use App\Http\Middleware\SetLocale;
use App\Support\LocaleUrl;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Endpoint POST /locale utilise par le LocaleSwitcher : memorise le choix
 * (cookie + preference du compte) puis renvoie vers la meme page dans la
 * nouvelle langue (racine = anglais, /fr/... = francais).
 */
class LocaleController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'locale' => 'required|string|in:' . implode(',', SetLocale::SUPPORTED),
        ]);
        $locale = $data['locale'];

        $request->session()->put('ui_locale', $locale);

        // User authentifie : persiste en DB pour tous les devices
        if ($user = $request->user()) {
            $user->preferred_locale = $locale;
            $user->save();
        }

        // Cookie : 1 an, le visiteur garde sa preference entre sessions
        cookie()->queue(cookie()->forever('ui_locale', $locale));

        // Meme page, dans l'autre langue (seulement pour une page de ce site).
        // Inertia::location force un rechargement complet : les liens (Ziggy) suivent la nouvelle langue.
        $previous = url()->previous();
        $host = parse_url(url('/'), PHP_URL_HOST);
        if (parse_url($previous, PHP_URL_HOST) !== $host) {
            return Inertia::location(LocaleUrl::to('/', $locale));
        }
        $path = parse_url($previous, PHP_URL_PATH) ?: '/';
        $query = parse_url($previous, PHP_URL_QUERY);
        $base = LocaleUrl::basePath(Request::create($path));
        $target = LocaleUrl::to($base, $locale);

        return Inertia::location($query ? $target.'?'.$query : $target);
    }
}
