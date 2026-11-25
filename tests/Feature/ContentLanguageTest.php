<?php

namespace Tests\Feature;

use App\Models\AiExplanation;
use App\Models\Attempt;
use App\Models\Certification;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * La langue des questions suit celle du site quand la banque existe dans
 * cette langue, et l'explication IA est produite et gardee par langue.
 */
class ContentLanguageTest extends TestCase
{
    use RefreshDatabase;

    // Les routes sont enregistrees sous le prefixe de langue de la requete :
    // on les recharge pour l'adresse visee (meme methode que SeoLocaleTest).
    private function routesFor(string $uri): static
    {
        $this->app->instance('request', \Illuminate\Http\Request::create($uri));
        $router = $this->app['router'];
        $router->setRoutes(new \Illuminate\Routing\RouteCollection);
        $router->middleware('web')->group(base_path('routes/web.php'));
        // Les redirections utilisent route('exam.take') : index des noms a jour.
        $router->getRoutes()->refreshNameLookups();
        $this->app['url']->setRoutes($router->getRoutes());
        return $this;
    }

    private function frenchCert(bool $withEnglish): Certification
    {
        $cert = Certification::forceCreate([
            'slug' => 'itil-foundation-v5',
            'title' => 'ITIL',
            'is_active' => true,
            'duration_minutes' => 60,
            'passing_score' => 26,
            'total_questions' => 40,
            'default_language' => 'fr',
            'available_languages' => ['fr', 'en'],
        ]);
        for ($i = 1; $i <= 12; $i++) {
            $q = $cert->questions()->create([
                'position' => $i,
                'question_text' => "Question $i en français",
                'question_type' => 'multiple_choice',
                'translations' => $withEnglish ? ['en' => ['question_text' => "Question $i in English"]] : null,
            ]);
            foreach (['A', 'B', 'C', 'D'] as $k => $letter) {
                $q->answers()->create([
                    'letter' => $letter,
                    'answer_text' => "Réponse $letter",
                    'is_correct' => $k === 0,
                    'translations' => $withEnglish ? ['en' => ['answer_text' => "Answer $letter"]] : null,
                ]);
            }
        }
        return $cert;
    }

    public function test_english_site_gets_english_questions_when_they_exist(): void
    {
        $this->frenchCert(withEnglish: true);
        $user = User::factory()->create();

        $this->routesFor('/certifications/itil-foundation-v5/sprint')->actingAs($user)->post('/certifications/itil-foundation-v5/sprint')->assertRedirect();
        $this->assertSame('en', Attempt::latest('id')->first()->locale);

        // Sur le site francais (/fr) : questions en francais.
        $this->routesFor('/fr/certifications/itil-foundation-v5/sprint')->actingAs($user)->post('/fr/certifications/itil-foundation-v5/sprint')->assertRedirect();
        $this->assertSame('fr', Attempt::latest('id')->first()->locale);

        // Un choix explicite l'emporte sur la langue du site.
        $this->routesFor('/certifications/itil-foundation-v5/sprint')->actingAs($user)->post('/certifications/itil-foundation-v5/sprint', ['lang' => 'fr'])->assertRedirect();
        $this->assertSame('fr', Attempt::latest('id')->first()->locale);
    }

    public function test_falls_back_to_the_certification_language_without_translation(): void
    {
        $this->frenchCert(withEnglish: false);
        $user = User::factory()->create();

        $this->routesFor('/certifications/itil-foundation-v5/sprint')->actingAs($user)->post('/certifications/itil-foundation-v5/sprint')->assertRedirect();
        $this->assertSame('fr', Attempt::latest('id')->first()->locale);
    }

    public function test_ai_explanation_is_written_and_cached_per_language(): void
    {
        $cert = $this->frenchCert(withEnglish: true);
        $question = $cert->questions()->with('answers')->first();
        $wrong = $question->answers->firstWhere('letter', 'B');
        Setting::set('openai_api_key', 'sk-test');
        Http::fake(['api.openai.com/*' => Http::response([
            'choices' => [['message' => ['content' => 'Explanation']]],
            'usage' => ['total_tokens' => 42],
        ])]);
        $user = User::factory()->create();

        $this->routesFor("/questions/{$question->id}/explain-me-better")->actingAs($user)->postJson("/questions/{$question->id}/explain-me-better", ['wrong_answer_id' => $wrong->id, 'locale' => 'en'])
            ->assertOk()->assertJson(['cached' => false]);
        Http::assertSent(function ($request) {
            $prompt = $request['messages'][1]['content'];
            return str_contains($prompt, 'Question 1 in English')
                && str_contains($prompt, 'The learner chose: "Answer B"')
                && str_contains($prompt, 'Write the answer in English');
        });

        // Meme question en francais : nouvel appel, pas l'explication anglaise du cache.
        $this->routesFor("/fr/questions/{$question->id}/explain-me-better")->actingAs($user)->postJson("/fr/questions/{$question->id}/explain-me-better", ['wrong_answer_id' => $wrong->id, 'locale' => 'fr'])
            ->assertOk()->assertJson(['cached' => false]);
        Http::assertSent(fn ($request) => str_contains($request['messages'][1]['content'], 'Write the answer in French'));

        $this->assertEqualsCanonicalizing(['en', 'fr'], AiExplanation::pluck('locale')->all());

        // Deuxieme demande en anglais : servie depuis le cache.
        $this->routesFor("/questions/{$question->id}/explain-me-better")->actingAs($user)->postJson("/questions/{$question->id}/explain-me-better", ['wrong_answer_id' => $wrong->id, 'locale' => 'en'])
            ->assertOk()->assertJson(['cached' => true]);
    }
}
