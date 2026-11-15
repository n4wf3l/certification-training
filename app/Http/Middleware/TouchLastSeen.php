<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Note la derniere visite d'un utilisateur connecte (au plus une ecriture par jour).
 * Sert uniquement a la suppression automatique des comptes inactifs
 * (commande accounts:purge-inactive). Aucune IP ni localisation n'est enregistree.
 */
class TouchLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && (! $user->last_seen_at || $user->last_seen_at->lt(today()))) {
            $user->forceFill([
                'last_seen_at' => now(),
                'inactivity_warned_at' => null,
            ])->saveQuietly();
        }

        return $next($request);
    }
}
