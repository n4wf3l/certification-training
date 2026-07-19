<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Ancien seeder ITIL — désormais absorbé dans le snapshot général
 * (database/seeders/data/questions.json restauré par CertificationSeeder).
 * Conservé comme no-op pour éviter de casser DatabaseSeeder si un ancien
 * script y fait référence.
 */
class ItilFoundationSeeder extends Seeder
{
    public function run(): void
    {
        // Contenu déplacé dans CertificationSeeder + database/seeders/data/*.
    }
}
