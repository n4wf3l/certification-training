<?php

namespace Tests\Unit;

use App\Models\Certification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Ensures the localized() accessor dispatches correctly :
 *  - Returns the canonical column value when locale = default_language
 *  - Returns translations[locale][field] when set for a non-canonical locale
 *  - Falls back to canonical when the translation is missing / empty
 *  - Handles array fields (target_roles) not just strings
 */
class CertificationLocalizedTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_canonical_when_locale_is_default(): void
    {
        $cert = Certification::create([
            'title' => 'ITIL Foundation',
            'slug' => 't',
            'description' => 'Canonical desc',
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
            'default_language' => 'fr',
            'translations' => ['en' => ['title' => 'ITIL Foundation EN', 'description' => 'English desc']],
        ]);

        $this->assertSame('ITIL Foundation', $cert->localized('fr', 'title'));
        $this->assertSame('Canonical desc', $cert->localized('fr', 'description'));
    }

    public function test_returns_translation_when_locale_differs(): void
    {
        $cert = Certification::create([
            'title' => 'FR title',
            'slug' => 't',
            'description' => 'FR desc',
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
            'default_language' => 'fr',
            'translations' => ['en' => ['title' => 'EN title', 'description' => 'EN desc']],
        ]);

        $this->assertSame('EN title', $cert->localized('en', 'title'));
        $this->assertSame('EN desc', $cert->localized('en', 'description'));
    }

    public function test_falls_back_to_canonical_when_translation_missing(): void
    {
        $cert = Certification::create([
            'title' => 'FR title',
            'slug' => 't',
            'description' => 'FR desc',
            'importance' => 'FR importance',
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
            'default_language' => 'fr',
            // EN only defines title, not importance
            'translations' => ['en' => ['title' => 'EN title']],
        ]);

        $this->assertSame('FR importance', $cert->localized('en', 'importance'));
    }

    public function test_handles_target_roles_array_field(): void
    {
        $cert = Certification::create([
            'title' => 'Cert',
            'slug' => 't',
            'target_roles' => ['Rôle FR 1', 'Rôle FR 2'],
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
            'default_language' => 'fr',
            'translations' => ['en' => ['target_roles' => ['EN role 1', 'EN role 2']]],
        ]);

        $this->assertSame(['Rôle FR 1', 'Rôle FR 2'], $cert->localized('fr', 'target_roles'));
        $this->assertSame(['EN role 1', 'EN role 2'], $cert->localized('en', 'target_roles'));
    }

    public function test_localized_course_blocks_dispatches_correctly(): void
    {
        $frBlocks = [['type' => 'heading', 'text' => 'FR Intro']];
        $enBlocks = [['type' => 'heading', 'text' => 'EN Intro']];

        $cert = Certification::create([
            'title' => 'Cert',
            'slug' => 't',
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
            'default_language' => 'fr',
            'course_blocks' => $frBlocks,
            'translations' => ['en' => ['course_blocks' => $enBlocks]],
        ]);

        $this->assertSame($frBlocks, $cert->localizedCourseBlocks('fr'));
        $this->assertSame($enBlocks, $cert->localizedCourseBlocks('en'));
    }
}
