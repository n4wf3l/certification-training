<?php

namespace App\Http\Controllers;

use App\Http\Middleware\SetLocale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Endpoint POST /locale utilise par le LocaleSwitcher : persiste le choix
 * en session + cookie + user.preferred_locale (si connecte). SetLocale reprend
 * ensuite cette valeur a chaque requete.
 */
class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'locale' => 'required|string|in:' . implode(',', SetLocale::SUPPORTED),
        ]);
        $locale = $data['locale'];

        // Session : sera lue en priorite par SetLocale au prochain hit
        $request->session()->put('ui_locale', $locale);

        // User authentifie : persiste en DB pour tous les devices
        if ($user = $request->user()) {
            $user->preferred_locale = $locale;
            $user->save();
        }

        // Cookie fallback : 1 an, guest garde sa preference entre sessions
        cookie()->queue(cookie()->forever('ui_locale', $locale));

        return back();
    }
}
