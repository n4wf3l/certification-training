<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmailVerificationFlowTest extends TestCase
{
    use RefreshDatabase;

    private function form(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Pseudo',
            'email' => 'new@example.test',
            'password' => 'password-123456',
            'password_confirmation' => 'password-123456',
        ], $overrides);
    }

    /** Session telle qu'apres l'affichage du formulaire il y a 10 secondes. */
    private function startedForm(): static
    {
        return $this->withSession(['register_form_at' => now()->subSeconds(10)->timestamp]);
    }

    public function test_sign_up_sends_a_confirmation_link_and_shows_the_notice(): void
    {
        Notification::fake();

        $this->startedForm()->post('/register', $this->form())->assertRedirect(route('verification.notice'));

        $user = User::where('email', 'new@example.test')->firstOrFail();
        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_unconfirmed_accounts_cannot_start_exams_or_see_stats(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get('/stats')->assertRedirect(route('verification.notice'));
        $this->actingAs($user)->get('/profile')->assertOk();
    }

    public function test_honeypot_blocks_bots(): void
    {
        $this->startedForm()->post('/register', $this->form(['website' => 'http://spam.test']))
            ->assertSessionHasErrors('email');

        $this->assertDatabaseMissing('users', ['email' => 'new@example.test']);
    }

    public function test_too_fast_submission_is_rejected(): void
    {
        $this->withSession(['register_form_at' => now()->timestamp])
            ->post('/register', $this->form())
            ->assertSessionHasErrors('email');

        $this->post('/register', $this->form())->assertSessionHasErrors('email'); // formulaire jamais affiche

        $this->assertDatabaseMissing('users', ['email' => 'new@example.test']);
    }

    public function test_unconfirmed_accounts_are_purged_after_seven_days(): void
    {
        $old = User::factory()->unverified()->create(['created_at' => now()->subDays(8)]);
        $recent = User::factory()->unverified()->create(['created_at' => now()->subDays(2)]);
        $confirmed = User::factory()->create(['created_at' => now()->subDays(30), 'last_seen_at' => now()]);

        $this->artisan('accounts:purge-inactive')->assertSuccessful();

        $this->assertModelMissing($old);
        $this->assertModelExists($recent);
        $this->assertModelExists($confirmed);
    }

    public function test_redirect_to_rejects_external_targets(): void
    {
        $this->get('/register?redirect_to=//evil.test/x')->assertOk();
        $this->assertNull(session('url.intended'));

        $this->get('/register?redirect_to=/certifications/x/examen')->assertOk();
        $this->assertSame(url('/certifications/x/examen'), session('url.intended'));
    }
}
