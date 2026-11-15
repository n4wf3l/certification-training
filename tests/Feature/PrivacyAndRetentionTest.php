<?php

namespace Tests\Feature;

use App\Mail\InactiveAccountWarningMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class PrivacyAndRetentionTest extends TestCase
{
    use RefreshDatabase;

    public function test_inactive_account_is_warned_then_deleted(): void
    {
        Mail::fake();

        $warned = User::factory()->create(['last_seen_at' => now()->subDays(54)]);
        $expired = User::factory()->create(['last_seen_at' => now()->subDays(61)]);
        $active = User::factory()->create(['last_seen_at' => now()->subDays(10)]);
        $admin = User::factory()->create(['role' => 'admin', 'last_seen_at' => now()->subYear()]);

        $this->artisan('accounts:purge-inactive')->assertSuccessful();

        $this->assertModelMissing($expired);
        $this->assertModelExists($warned);
        $this->assertModelExists($active);
        $this->assertModelExists($admin);
        Mail::assertSent(InactiveAccountWarningMail::class, fn ($m) => $m->hasTo($warned->email));
        Mail::assertSent(InactiveAccountWarningMail::class, 1);
        $this->assertNotNull($warned->fresh()->inactivity_warned_at);

        // Le lendemain : pas de second email.
        $this->artisan('accounts:purge-inactive')->assertSuccessful();
        Mail::assertSent(InactiveAccountWarningMail::class, 1);
    }

    public function test_a_visit_resets_the_inactivity_clock(): void
    {
        $user = User::factory()->create([
            'last_seen_at' => now()->subDays(55),
            'inactivity_warned_at' => now()->subDay(),
        ]);

        $this->actingAs($user)->get('/')->assertOk();

        $user->refresh();
        $this->assertTrue($user->last_seen_at->isToday());
        $this->assertNull($user->inactivity_warned_at);
    }

    public function test_dry_run_deletes_nothing(): void
    {
        $expired = User::factory()->create(['last_seen_at' => now()->subDays(90)]);

        $this->artisan('accounts:purge-inactive', ['--dry-run' => true])->assertSuccessful();

        $this->assertModelExists($expired);
    }

    public function test_sessions_store_no_ip_or_user_agent(): void
    {
        config(['session.driver' => 'database']);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withServerVariables(['REMOTE_ADDR' => '203.0.113.7'])
            ->withHeader('User-Agent', 'TestBrowser/1.0')
            ->get('/')
            ->assertOk();

        $this->assertDatabaseMissing('sessions', ['ip_address' => '203.0.113.7']);
        $this->assertSame(0, DB::table('sessions')->whereNotNull('ip_address')->orWhereNotNull('user_agent')->count());
    }

    public function test_registration_is_limited_per_visitor(): void
    {
        RateLimiter::clear('register');

        foreach (range(1, 3) as $i) {
            $this->post('/register', [
                'name' => "Pseudo $i",
                'email' => "bot$i@example.test",
                'password' => 'password-123456',
                'password_confirmation' => 'password-123456',
            ]);
            auth()->logout();
        }

        $this->post('/register', [
            'name' => 'Pseudo 4',
            'email' => 'bot4@example.test',
            'password' => 'password-123456',
            'password_confirmation' => 'password-123456',
        ])->assertStatus(429);

        $this->assertDatabaseMissing('users', ['email' => 'bot4@example.test']);
    }
}
