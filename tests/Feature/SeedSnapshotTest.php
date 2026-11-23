<?php

namespace Tests\Feature;

use App\Models\Certification;
use App\Models\Question;
use Database\Seeders\CertificationSeeder;
use Database\Seeders\CertificationTranslationsSeeder;
use Database\Seeders\CourseTranslationsSeeder;
use Database\Seeders\QuestionTranslationsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le deploiement repose sur database/seeders/data : un `db:seed` sur une base
 * vide doit remettre toutes les questions, traductions et cours, et un
 * deuxieme `db:seed` en production ne doit pas effacer la banque en place.
 */
class SeedSnapshotTest extends TestCase
{
    use RefreshDatabase;

    private function seedContent(): void
    {
        // Appel direct : `db:seed` demande une confirmation en production.
        foreach ([CertificationSeeder::class, CertificationTranslationsSeeder::class, CourseTranslationsSeeder::class, QuestionTranslationsSeeder::class] as $seeder) {
            $this->app->make($seeder)->run();
        }
    }

    public function test_the_snapshot_restores_all_content_and_production_keeps_it(): void
    {
        $this->seedContent();

        $snapshot = json_decode(file_get_contents(database_path('seeders/data/questions.json')), true);
        $expected = array_sum(array_map('count', $snapshot));
        $this->assertSame($expected, Question::count());

        $itil = Certification::where('slug', 'itil-foundation-v5')->firstOrFail();
        $this->assertSame(count($snapshot['itil-foundation-v5']), $itil->questions()->count());
        $this->assertSame(100.0, (float) array_sum($itil->syllabus_blueprint));
        $this->assertNotEmpty($itil->course_blocks);
        $this->assertNotEmpty($itil->translations['en']['course_blocks'] ?? null);
        $untranslated = $itil->questions()->get()->filter(fn ($q) => empty($q->translations['en']['question_text'] ?? null));
        $this->assertCount(0, $untranslated, 'Questions ITIL sans traduction anglaise');

        $ccna = Certification::where('slug', 'ccna-200-301')->firstOrFail();
        $untranslated = $ccna->questions()->get()->filter(fn ($q) => empty($q->translations['fr']['question_text'] ?? null));
        $this->assertCount(0, $untranslated, 'Questions CCNA sans traduction française');
        $this->assertNotEmpty($ccna->translations['fr']['course_blocks'] ?? null);

        // Deuxieme seed en production : les questions existantes restent les memes.
        $ids = Question::orderBy('id')->pluck('id')->all();
        $this->app['env'] = 'production';
        $this->seedContent();
        $this->assertSame($ids, Question::orderBy('id')->pluck('id')->all());
    }
}
