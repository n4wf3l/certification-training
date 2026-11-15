<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Cle anonyme pour le rate limiting des visiteurs non connectes.
 *
 * L'IP n'est jamais stockee : on garde seulement un HMAC (cle = APP_KEY), qui vit
 * dans le cache le temps de la fenetre de limitation (quelques minutes a une heure)
 * puis expire. Impossible de retrouver l'IP a partir de la cle sans APP_KEY.
 */
class ClientKey
{
    public static function for(Request $request): string
    {
        if ($user = $request->user()) {
            return 'u:'.$user->id;
        }

        return 'g:'.static::anonymousIp($request);
    }

    public static function anonymousIp(Request $request): string
    {
        return substr(hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')), 0, 32);
    }
}
