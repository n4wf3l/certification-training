<?php

namespace Database\Seeders;

use App\Models\Certification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * Applique les traductions de metadonnees certif (title/description/
 * long_description/importance/validity_note) depuis les fichiers
 * database/seeders/data/translations/certifications-{locale}.json.
 *
 * Idempotent : merge dans certifications.translations sans ecraser les
 * autres locales deja presentes pour un meme cert.
 */
class CertificationTranslationsSeeder extends Seeder
{
    public function run(): void
    {
        $dir = database_path('seeders/data/translations');
        if (! File::isDirectory($dir)) {
            $this->command?->info('Dossier translations absent - skip.');
            return;
        }

        $files = collect(File::files($dir))
            ->filter(fn ($f) => str_starts_with($f->getFilename(), 'certifications-') && $f->getExtension() === 'json');

        if ($files->isEmpty()) {
            $this->command?->info('Aucun fichier certifications-*.json - skip.');
            return;
        }

        $totalCerts = 0;

        foreach ($files as $file) {
            $payload = json_decode(File::get($file->getPathname()), true);
            if (! is_array($payload)) {
                $this->command?->warn("  {$file->getFilename()} : JSON invalide, skip.");
                continue;
            }

            $locale = $payload['meta']['locale'] ?? null;
            $items = $payload['certifications'] ?? [];

            if (! $locale || empty($items)) {
                $this->command?->warn("  {$file->getFilename()} : meta.locale ou certifications manquants, skip.");
                continue;
            }

            foreach ($items as $slug => $data) {
                $cert = Certification::where('slug', $slug)->first();
                if (! $cert) {
                    $this->command?->warn("    certif slug '{$slug}' introuvable, skip.");
                    continue;
                }

                $translations = $cert->translations ?? [];
                $translations[$locale] = [
                    'title' => $data['title'] ?? null,
                    'description' => $data['description'] ?? null,
                    'long_description' => $data['long_description'] ?? null,
                    'importance' => $data['importance'] ?? null,
                    'validity_note' => $data['validity_note'] ?? null,
                    // target_roles est un array de titres de poste, cible aussi
                    // par le localized() du controller show.
                    'target_roles' => $data['target_roles'] ?? null,
                ];
                $cert->translations = $translations;
                $cert->save();
                $totalCerts++;
            }

            $this->command?->info("  {$file->getFilename()} : locale={$locale} OK");
        }

        $this->command?->info("Traductions certif appliquees : {$totalCerts} certif(s).");
    }
}
