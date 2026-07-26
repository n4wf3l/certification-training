<?php

namespace Database\Seeders;

use App\Models\Certification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * Applique les traductions de cours stockees dans
 * database/seeders/data/translations/courses/{slug}-{locale}.json.
 *
 * Format attendu :
 * {
 *   "meta": { "certification_slug": "...", "locale": "en", "canonical_from": "fr", "block_count": 100 },
 *   "blocks": [ { "type": "...", ... }, ... ]  // meme shape que course_blocks canonique
 * }
 *
 * Idempotent : merge dans certifications.translations[locale].course_blocks
 * sans toucher aux autres cles de translations[locale] ni aux autres locales.
 *
 * Valide la parite structurelle avec le canonique (nombre de blocs + type
 * par position) et logue un warning si drift.
 */
class CourseTranslationsSeeder extends Seeder
{
    public function run(): void
    {
        $dir = database_path('seeders/data/translations/courses');
        if (! File::isDirectory($dir)) {
            $this->command?->info('Dossier translations/courses absent - skip.');
            return;
        }

        $files = collect(File::files($dir))
            ->filter(fn ($f) => $f->getExtension() === 'json');

        if ($files->isEmpty()) {
            $this->command?->info('Aucun fichier de traduction de cours - skip.');
            return;
        }

        $totalCourses = 0;
        $totalBlocks = 0;

        foreach ($files as $file) {
            $payload = json_decode(File::get($file->getPathname()), true);
            if (! is_array($payload)) {
                $this->command?->warn("  {$file->getFilename()} : JSON invalide, skip.");
                continue;
            }

            $slug = $payload['meta']['certification_slug'] ?? null;
            $locale = $payload['meta']['locale'] ?? null;
            $blocks = $payload['blocks'] ?? null;

            if (! $slug || ! $locale || ! is_array($blocks)) {
                $this->command?->warn("  {$file->getFilename()} : meta.certification_slug / meta.locale / blocks manquants, skip.");
                continue;
            }

            $cert = Certification::where('slug', $slug)->first();
            if (! $cert) {
                $this->command?->warn("  {$file->getFilename()} : certif '{$slug}' introuvable, skip.");
                continue;
            }

            // Structural parity check vs canonique
            $canonical = $cert->course_blocks ?? [];
            if (count($canonical) !== count($blocks)) {
                $this->command?->warn(sprintf(
                    "  %s : block count mismatch (canonical=%d, %s=%d) - possible drift.",
                    $file->getFilename(),
                    count($canonical),
                    $locale,
                    count($blocks),
                ));
            } else {
                foreach ($canonical as $i => $cBlock) {
                    $cType = $cBlock['type'] ?? null;
                    $tType = $blocks[$i]['type'] ?? null;
                    if ($cType !== $tType) {
                        $this->command?->warn(sprintf(
                            "  %s : block #%d type mismatch (canonical=%s, %s=%s) - possible drift.",
                            $file->getFilename(),
                            $i + 1,
                            $cType,
                            $locale,
                            $tType,
                        ));
                    }
                }
            }

            $translations = $cert->translations ?? [];
            $translations[$locale] = array_merge($translations[$locale] ?? [], [
                'course_blocks' => $blocks,
            ]);
            $cert->translations = $translations;
            $cert->save();

            $totalCourses++;
            $totalBlocks += count($blocks);
            $this->command?->info("  {$file->getFilename()} : locale={$locale}, cert={$slug} OK (" . count($blocks) . ' blocs)');
        }

        $this->command?->info("Traductions cours appliquees : {$totalCourses} cours, {$totalBlocks} blocs au total.");
    }
}
