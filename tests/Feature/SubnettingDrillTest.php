<?php

namespace Tests\Feature;

use App\Models\Certification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SubnettingDrillTest extends TestCase
{
    use RefreshDatabase;

    private function cert(string $slug): Certification
    {
        return Certification::forceCreate([
            'slug' => $slug,
            'title' => strtoupper($slug),
            'is_active' => true,
            'duration_minutes' => 60,
            'passing_score' => 26,
            'total_questions' => 40,
        ]);
    }

    public function test_ccna_offers_the_drill_without_an_account(): void
    {
        $this->cert('ccna-200-301');

        $this->get('/certifications/ccna-200-301/subnetting')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Certification/Subnetting')->where('certification.slug', 'ccna-200-301'));

        $this->get('/certifications/ccna-200-301')
            ->assertInertia(fn (Assert $page) => $page->where('certification.has_subnetting', true));
    }

    public function test_other_certifications_do_not(): void
    {
        $this->cert('itil-foundation-v5');

        $this->get('/certifications/itil-foundation-v5/subnetting')->assertNotFound();
        $this->get('/certifications/itil-foundation-v5')
            ->assertInertia(fn (Assert $page) => $page->where('certification.has_subnetting', false));
    }
}
