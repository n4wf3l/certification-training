<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProductionSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_accounts_are_not_seeded_in_production(): void
    {
        $this->app['env'] = 'production';
        putenv('ADMIN_EMAIL');
        putenv('ADMIN_PASSWORD');

        (new AdminUserSeeder)->run();

        $this->assertDatabaseMissing('users', ['email' => 'admin@example.com']);
        $this->assertDatabaseMissing('users', ['email' => 'user@example.com']);
    }

    public function test_production_admin_comes_from_env_and_is_never_overwritten(): void
    {
        $this->app['env'] = 'production';
        putenv('ADMIN_EMAIL=owner@certifloop.test');
        putenv('ADMIN_PASSWORD=a-long-enough-secret');

        try {
            (new AdminUserSeeder)->run();
            $admin = User::where('email', 'owner@certifloop.test')->firstOrFail();
            $this->assertSame('admin', $admin->role);
            $hash = $admin->password;

            putenv('ADMIN_PASSWORD=another-long-secret');
            (new AdminUserSeeder)->run();
            $this->assertSame($hash, $admin->fresh()->password);
        } finally {
            putenv('ADMIN_EMAIL');
            putenv('ADMIN_PASSWORD');
        }
    }

    public function test_openai_key_is_encrypted_at_rest(): void
    {
        Setting::set('openai_api_key', 'sk-test-123');

        $raw = DB::table('settings')->where('key', 'openai_api_key')->value('value');
        $this->assertNotSame('sk-test-123', $raw);
        $this->assertSame('sk-test-123', Setting::get('openai_api_key'));

        Setting::set('openai_api_key', null);
        $this->assertNull(Setting::get('openai_api_key'));
    }
}
