<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Support\LocaleUrl;
use Illuminate\Http\Response;

/**
 * robots.txt et sitemap.xml generes a partir de APP_URL et des certifications
 * en ligne. Chaque page est listee dans les deux langues avec ses alternatives
 * hreflang (racine = francais, /en/... = anglais).
 */
class SeoController extends Controller
{
    /** Zones privees ou sans interet pour un moteur de recherche. */
    private const DISALLOW = [
        '/admin', '/exam/', '/profile', '/stats', '/bookmarks', '/study-plans',
        '/login', '/register', '/forgot-password', '/reset-password', '/verify-email',
        '/confirm-password', '/offline', '/offline-review', '/certificate/',
    ];

    public function robots(): Response
    {
        $lines = ['User-agent: *'];
        foreach (self::DISALLOW as $path) {
            $lines[] = "Disallow: $path";
            foreach (LocaleUrl::PREFIXED as $code) {
                $lines[] = "Disallow: /$code$path";
            }
        }
        $lines[] = '';
        $lines[] = 'Sitemap: '.url('/sitemap.xml');

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    public function sitemap(): Response
    {
        $paths = ['/' => null, '/legal' => null];

        $certifications = Certification::query()
            ->where('is_active', true)
            ->withCount('questions')
            ->get();

        foreach ($certifications as $cert) {
            if ($cert->questions_count === 0) {
                continue; // "bientot" : pas encore de contenu a indexer
            }
            $updated = $cert->questions_updated_at ?? $cert->updated_at;
            $base = "/certifications/{$cert->slug}";
            $paths[$base] = $updated;
            $paths["$base/examen"] = $updated;
            $paths["$base/flashcards"] = $updated;
            if (is_array($cert->course_blocks) && count($cert->course_blocks) > 0) {
                $paths["$base/cours"] = $updated;
            }
        }

        $locales = array_merge([LocaleUrl::DEFAULT], LocaleUrl::PREFIXED);
        $xml = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];

        foreach ($paths as $path => $updated) {
            foreach ($locales as $locale) {
                $xml[] = '  <url>';
                $xml[] = '    <loc>'.e(LocaleUrl::to($path, $locale)).'</loc>';
                if ($updated) {
                    $xml[] = '    <lastmod>'.$updated->toDateString().'</lastmod>';
                }
                foreach ($locales as $alt) {
                    $xml[] = '    <xhtml:link rel="alternate" hreflang="'.$alt.'" href="'.e(LocaleUrl::to($path, $alt)).'"/>';
                }
                $xml[] = '    <xhtml:link rel="alternate" hreflang="x-default" href="'.e(LocaleUrl::to($path, LocaleUrl::DEFAULT)).'"/>';
                $xml[] = '  </url>';
            }
        }
        $xml[] = '</urlset>';

        return response(implode("\n", $xml)."\n", 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
