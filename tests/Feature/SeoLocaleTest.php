<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Une adresse par langue (racine = francais, /en = anglais), robots.txt,
 * sitemap.xml, canonique / hreflang et noindex des pages privees.
 *
 * Les routes etant enregistrees sous le prefixe de la requete (routes/web.php),
 * les tests sur /en rechargent les routes avec ce prefixe.
 */
class SeoLocaleTest extends TestCase
{
    use RefreshDatabase;

    private function bootFor(string $uri): void
    {
        $this->refreshApplicationFor($uri);
    }

    private function refreshApplicationFor(string $uri): void
    {
        $this->app->instance('request', \Illuminate\Http\Request::create($uri));
        $router = $this->app['router'];
        $router->setRoutes(new \Illuminate\Routing\RouteCollection);
        $router->middleware('web')->group(base_path('routes/web.php'));
    }

    public function test_root_is_english_and_fr_prefix_is_french(): void
    {
        $this->get('/legal')->assertOk()->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));

        $this->bootFor('/fr/legal');
        $this->get('/fr/legal')->assertOk()->assertInertia(fn (Assert $page) => $page->where('locale', 'fr'));
    }

    public function test_old_english_urls_redirect_permanently_to_the_root(): void
    {
        $this->bootFor('/en/legal');
        $this->get('/en/legal?x=1')->assertStatus(301)->assertRedirect('/legal?x=1');
        $this->get('/en')->assertStatus(301)->assertRedirect('/');
    }

    public function test_old_lang_query_redirects_to_the_prefixed_url(): void
    {
        $this->get('/legal?lang=fr')->assertRedirect(url('/fr/legal'));
    }

    public function test_explicit_french_preference_redirects_english_urls(): void
    {
        $this->withCookie('ui_locale', 'fr')->get('/legal')->assertRedirect(url('/fr/legal'));

        $user = User::factory()->create(['preferred_locale' => 'fr']);
        $this->actingAs($user)->get('/legal')->assertRedirect(url('/fr/legal'));
    }

    public function test_switching_language_goes_to_the_same_page_in_the_other_language(): void
    {
        $this->from(url('/legal'))->post('/locale', ['locale' => 'fr'])->assertRedirect(url('/fr/legal'));
        $this->from(url('/fr/legal'))->post('/locale', ['locale' => 'en'])->assertRedirect(url('/legal'));
    }

    public function test_head_has_canonical_and_hreflang(): void
    {
        $html = $this->get('/legal')->assertOk()->getContent();

        $this->assertStringContainsString('<html lang="en"', $html);
        $this->assertStringContainsString('<link rel="canonical" href="'.url('/legal').'">', $html);
        $this->assertStringContainsString('hreflang="fr" href="'.url('/fr/legal').'"', $html);
        $this->assertStringContainsString('hreflang="x-default" href="'.url('/legal').'"', $html);
    }

    public function test_private_pages_are_noindex(): void
    {
        $html = $this->get('/login')->assertOk()->getContent();

        $this->assertStringContainsString('<meta name="robots" content="noindex, nofollow">', $html);
        $this->assertStringNotContainsString('rel="canonical"', $html);
    }

    public function test_robots_txt_points_to_the_sitemap(): void
    {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Disallow: /admin')
            ->assertSee('Disallow: /fr/admin')
            ->assertSee('Sitemap: '.url('/sitemap.xml'));
    }

    public function test_sitemap_lists_both_languages_with_alternates(): void
    {
        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertNotFalse(simplexml_load_string($xml), 'sitemap XML invalide');
        $this->assertStringContainsString('<loc>'.url('/legal').'</loc>', $xml);
        $this->assertStringContainsString('<loc>'.url('/fr/legal').'</loc>', $xml);
        $this->assertStringContainsString('hreflang="x-default"', $xml);
    }
}
