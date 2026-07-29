<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pose les headers HTTP de securite basiques sur toutes les reponses.
 * Reduit la surface pour clickjacking, MIME sniffing, referer leak, et
 * abus de permissions navigateur.
 *
 * Volontairement PAS de Content-Security-Policy ici : une CSP mal calibree
 * casse la page (Google Fonts, Inertia inline data-page, etc.). A activer
 * plus tard une fois toutes les sources whitelisted et testees.
 *
 * HSTS n'est envoye qu'en HTTPS pour eviter de forcer la migration prod
 * tant que le domaine n'est pas servi en TLS.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

        // HSTS : force HTTPS pour 1 an + inclut les sous-domaines. Uniquement
        // envoye si la requete est deja en HTTPS (evite de bloquer un dev en
        // HTTP local ou un rollback vers HTTP en cas d'incident TLS).
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
