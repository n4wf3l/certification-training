<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_a_verified_admin(): void
    {
        $this->artisan('admin:create', ['--email' => 'owner@certifloop.test'])
            ->expectsQuestion('Mot de passe (12 caracteres minimum)', 'a-long-enough-secret')
            ->expectsQuestion('Confirme le mot de passe', 'a-long-enough-secret')
            ->assertSuccessful();

        $admin = User::where('email', 'owner@certifloop.test')->firstOrFail();
        $this->assertSame('admin', $admin->role);
        $this->assertNotNull($admin->email_verified_at);
        $this->assertTrue(Hash::check('a-long-enough-secret', $admin->password));
    }

    public function test_refuses_a_short_password(): void
    {
        $this->artisan('admin:create', ['--email' => 'owner@certifloop.test'])
            ->expectsQuestion('Mot de passe (12 caracteres minimum)', 'short')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'owner@certifloop.test']);
    }

    public function test_never_overwrites_an_existing_account(): void
    {
        $user = User::factory()->create(['email' => 'taken@certifloop.test']);

        $this->artisan('admin:create', ['--email' => 'taken@certifloop.test'])->assertFailed();

        $this->assertSame($user->password, $user->fresh()->password);
        $this->assertNotSame('admin', $user->fresh()->role);
    }
}
