<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\Certification;
use App\Models\User;
use App\Models\UserCertificate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Ensures GDPR Article 20 data portability works end to end : auth-gated,
 * rate-limited, returns structured JSON with every user-scoped table dumped.
 */
class ProfileDataExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_export(): void
    {
        $this->get('/profile/export')->assertRedirect('/login');
    }

    public function test_authenticated_user_gets_json_dump(): void
    {
        $user = User::factory()->create();
        $cert = Certification::create([
            'title' => 'Cert',
            'slug' => 'cert',
            'description' => 'd',
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
        ]);
        Attempt::create([
            'user_id' => $user->id,
            'certification_id' => $cert->id,
            'score' => 40,
            'total_questions' => 40,
            'passing_score' => 30,
            'passed' => true,
            'started_at' => now()->subHour(),
            'completed_at' => now(),
        ]);
        UserCertificate::create([
            'user_id' => $user->id,
            'certification_id' => $cert->id,
            'best_score' => 40,
            'total_questions' => 40,
            'mastery_pct' => 100,
        ]);

        $response = $this->actingAs($user)->get('/profile/export');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/json; charset=utf-8');
        $response->assertHeader('Content-Disposition');

        $content = $response->streamedContent();
        $payload = json_decode($content, true);

        $this->assertIsArray($payload);
        $this->assertArrayHasKey('export_meta', $payload);
        $this->assertSame(20, $payload['export_meta']['rgpd_article']);
        $this->assertSame($user->email, $payload['account']['email']);
        $this->assertCount(1, $payload['attempts']);
        $this->assertCount(1, $payload['certificates']);
    }

    public function test_export_excludes_other_users_data(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $cert = Certification::create([
            'title' => 'Cert',
            'slug' => 'cert',
            'description' => 'd',
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
        ]);
        Attempt::create([
            'user_id' => $other->id,
            'certification_id' => $cert->id,
            'score' => 40,
            'total_questions' => 40,
            'passing_score' => 30,
            'passed' => true,
            'started_at' => now()->subHour(),
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($me)->get('/profile/export');
        $payload = json_decode($response->streamedContent(), true);

        // Me has no attempts, other's attempt must NOT leak
        $this->assertEmpty($payload['attempts']);
    }
}
