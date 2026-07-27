<?php

namespace Tests\Unit;

use App\Models\Attempt;
use App\Models\Certification;
use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests the core rule of the CertifLoop preparation certificate :
 * 3 consecutive flawless mock exams unlock the streak, with a quit budget
 * of 1 abandonment before the streak resets to zero.
 */
class GamificationStreakTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Certification $cert;
    private GamificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->cert = Certification::create([
            'title' => 'Test Cert',
            'slug' => 'test-cert',
            'description' => 't',
            'duration_minutes' => 60,
            'passing_score' => 30,
            'total_questions' => 40,
            'is_active' => true,
        ]);
        $this->service = new GamificationService();
    }

    public function test_empty_state_has_zero_perfects_and_full_quit_budget(): void
    {
        $state = $this->service->computeStreakState($this->user->id, $this->cert->id);

        $this->assertSame(0, $state['perfect_runs']);
        $this->assertSame(0, $state['quits_used']);
        $this->assertSame(1, $state['quits_left']);
        $this->assertSame(3, $state['required']);
    }

    public function test_two_perfect_completed_attempts_counted(): void
    {
        $this->completePerfect();
        $this->completePerfect();

        $state = $this->service->computeStreakState($this->user->id, $this->cert->id);
        $this->assertSame(2, $state['perfect_runs']);
        $this->assertSame(1, $state['quits_left']);
    }

    public function test_first_abandonment_preserves_streak_but_consumes_budget(): void
    {
        $this->completePerfect();
        $this->abandonAttempt();

        $state = $this->service->computeStreakState($this->user->id, $this->cert->id);
        $this->assertSame(1, $state['perfect_runs']);
        $this->assertSame(1, $state['quits_used']);
        $this->assertSame(0, $state['quits_left']);
    }

    public function test_second_abandonment_nukes_the_streak(): void
    {
        $this->completePerfect();
        $this->completePerfect();
        $this->abandonAttempt();
        $this->abandonAttempt();

        $state = $this->service->computeStreakState($this->user->id, $this->cert->id);
        $this->assertSame(0, $state['perfect_runs'], 'Streak should be nuked');
    }

    public function test_non_perfect_completed_attempt_breaks_streak(): void
    {
        $this->completePerfect();
        $this->completePerfect();
        // Now a completed exam that missed one : streak resets
        Attempt::create([
            'user_id' => $this->user->id,
            'certification_id' => $this->cert->id,
            'score' => 39,
            'total_questions' => 40,
            'passing_score' => 30,
            'passed' => true,
            'started_at' => now()->subHour(),
            'completed_at' => now(),
        ]);

        $state = $this->service->computeStreakState($this->user->id, $this->cert->id);
        $this->assertSame(0, $state['perfect_runs']);
    }

    public function test_practice_attempts_are_ignored_from_the_streak(): void
    {
        // Practice attempts (domain-scoped) don't count toward the certificate
        Attempt::create([
            'user_id' => $this->user->id,
            'certification_id' => $this->cert->id,
            'score' => 15,
            'total_questions' => 15,
            'passing_score' => 10,
            'passed' => true,
            'practice_domain' => 'guiding-principles',
            'started_at' => now()->subMinutes(30),
            'completed_at' => now(),
        ]);

        $state = $this->service->computeStreakState($this->user->id, $this->cert->id);
        $this->assertSame(0, $state['perfect_runs']);
    }

    private function completePerfect(): Attempt
    {
        return Attempt::create([
            'user_id' => $this->user->id,
            'certification_id' => $this->cert->id,
            'score' => 40,
            'total_questions' => 40,
            'passing_score' => 30,
            'passed' => true,
            'started_at' => now()->subHour(),
            'completed_at' => now(),
        ]);
    }

    private function abandonAttempt(): Attempt
    {
        return Attempt::create([
            'user_id' => $this->user->id,
            'certification_id' => $this->cert->id,
            'score' => 0,
            'total_questions' => 40,
            'passing_score' => 30,
            'passed' => false,
            'started_at' => now()->subMinutes(10),
            'abandoned_at' => now(),
        ]);
    }
}
