<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\Certification;
use App\Models\Setting;
use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SprintTest extends TestCase
{
    use RefreshDatabase;

    private function certWithQuestions(int $n = 30): Certification
    {
        $cert = Certification::forceCreate([
            'slug' => 'itil-foundation-v5',
            'title' => 'ITIL',
            'is_active' => true,
            'duration_minutes' => 60,
            'passing_score' => 26,
            'total_questions' => 40,
        ]);
        for ($i = 1; $i <= $n; $i++) {
            $q = $cert->questions()->create(['position' => $i, 'question_text' => "Question $i", 'question_type' => 'multiple_choice']);
            foreach (['A', 'B', 'C', 'D'] as $k => $letter) {
                $q->answers()->create(['letter' => $letter, 'answer_text' => "Option $letter", 'is_correct' => $k === 0]);
            }
        }
        return $cert;
    }

    public function test_a_sprint_draws_ten_questions_with_instant_feedback(): void
    {
        Setting::set('allow_instant_feedback', '1');
        $cert = $this->certWithQuestions();
        $user = User::factory()->create();

        $this->actingAs($user)->post('/certifications/itil-foundation-v5/sprint')->assertRedirect();

        $attempt = Attempt::firstOrFail();
        $this->assertSame('sprint', $attempt->kind);
        $this->assertSame(10, $attempt->total_questions);
        $this->assertSame(7, $attempt->passing_score);
        $this->assertSame('instant', $attempt->feedback_mode);
        $this->assertSame(10, $attempt->attemptAnswers()->count());

        // Duree au prorata : 60 min x 10/40 = 15 min.
        $this->actingAs($user)->get("/exam/{$attempt->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Exam/Take')
                ->where('attempt.kind', 'sprint')
                ->where('attempt.duration_minutes', 15)
                ->where('cert_progress', null));
    }

    public function test_finishing_without_any_answer_completes_with_zero(): void
    {
        Setting::set('allow_instant_feedback', '1');
        $this->certWithQuestions();
        $user = User::factory()->create();
        $this->actingAs($user)->post('/certifications/itil-foundation-v5/sprint');
        $attempt = Attempt::firstOrFail();

        // Terminer tout de suite (ou chrono ecoule) : aucune reponse envoyee.
        $this->actingAs($user)->post("/exam/{$attempt->id}/submit", ['answers' => []])
            ->assertRedirect(route('exam.result', $attempt));
        $this->actingAs($user)->post("/exam/{$attempt->id}/submit", [])
            ->assertRedirect(route('exam.result', $attempt));

        $attempt->refresh();
        $this->assertNotNull($attempt->completed_at);
        $this->assertSame(0, $attempt->score);
        $this->assertFalse($attempt->passed);
    }

    public function test_a_perfect_sprint_does_not_count_as_a_mock_exam(): void
    {
        $cert = $this->certWithQuestions(10);
        $user = User::factory()->create();

        $sprint = Attempt::create([
            'user_id' => $user->id,
            'certification_id' => $cert->id,
            'total_questions' => 10,
            'passing_score' => 7,
            'score' => 10,
            'passed' => true,
            'feedback_mode' => 'instant',
            'kind' => Attempt::KIND_SPRINT,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->assertFalse($sprint->isMockExam());
        $state = app(GamificationService::class)->computeStreakState($user->id, $cert->id);
        $this->assertSame(0, $state['perfect_runs']);

        $reward = app(GamificationService::class)->processAttempt($sprint->load('user', 'certification'));
        $this->assertNotContains('perfect_exam', $reward['new_badges']);
        $this->assertNotContains('first_pass', $reward['new_badges']);
        $this->assertSame(100, $reward['xp_gained']);
    }
}
