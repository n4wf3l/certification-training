<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuestTrustTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_accounts_flag_is_off_outside_local(): void
    {
        $this->app['env'] = 'production';

        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('app_is_local', false));
    }

    public function test_demo_accounts_flag_is_on_in_local(): void
    {
        $this->app['env'] = 'local';

        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('app_is_local', true));
    }

    public function test_preview_wording_until_payments_exist(): void
    {
        config(['certifloop.payments_enabled' => false]);
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('features.payments', false));

        config(['certifloop.payments_enabled' => true]);
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('features.payments', true));
    }

    public function test_legal_page_shows_only_configured_publisher_fields(): void
    {
        config(['certifloop.publisher' => ['name' => 'Exemple SRL', 'company_id' => null, 'address' => 'Rue Test 1, 1000 Bruxelles']]);

        $this->get('/legal')->assertInertia(fn (Assert $page) => $page
            ->component('Legal')
            ->where('publisher.name', 'Exemple SRL')
            ->where('publisher.address', 'Rue Test 1, 1000 Bruxelles')
            ->missing('publisher.company_id'));
    }
}
