<?php

namespace App\Http\Controllers;

use App\Models\AiExplanation;
use App\Models\Answer;
use App\Models\Question;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class AiExplanationController extends Controller
{
    private const MODEL = 'gpt-4o-mini';

    public function explain(Request $request, Question $question): JsonResponse
    {
        $data = $request->validate([
            'wrong_answer_id' => 'nullable|integer|exists:answers,id',
            // Langue dans laquelle l'utilisateur a vu la question (celle de l'examen).
            'locale' => ['nullable', 'string', 'regex:/^[a-z]{2}$/'],
        ]);
        $wrongAnswerId = $data['wrong_answer_id'] ?? null;
        $locale = $data['locale'] ?? app()->getLocale();

        // Verifier que la cle OpenAI est configuree
        $apiKey = Setting::get('openai_api_key');
        if (empty($apiKey)) {
            return response()->json([
                'error' => __('flash.ai_not_configured'),
            ], 503);
        }

        // Rate limit par user
        $dailyLimit = (int) Setting::get('openai_daily_limit_per_user', 10);
        if ($dailyLimit === 0) {
            return response()->json([
                'error' => __('flash.ai_disabled'),
            ], 503);
        }

        $userId = auth()->id();
        $key = "ai-explain:user:{$userId}";
        if (RateLimiter::tooManyAttempts($key, $dailyLimit)) {
            $seconds = RateLimiter::availableIn($key);
            $hours = ceil($seconds / 3600);
            return response()->json([
                'error' => __('flash.ai_daily_limit', ['limit' => $dailyLimit, 'hours' => $hours]),
            ], 429);
        }

        // Cache : si on a deja genere pour cette (question, wrong_answer), on renvoie le cache
        $cached = AiExplanation::where('question_id', $question->id)
            ->where('wrong_answer_id', $wrongAnswerId)
            ->where('locale', $locale)
            ->first();
        if ($cached) {
            return response()->json([
                'explanation' => $cached->explanation,
                'cached' => true,
            ]);
        }

        // Charger les donnees necessaires
        $question->load(['answers', 'certification']);
        $wrongAnswer = $wrongAnswerId ? Answer::find($wrongAnswerId) : null;
        $correctAnswer = $question->answers->firstWhere('is_correct', true);

        // Construire le prompt
        $prompt = $this->buildPrompt($question, $wrongAnswer, $correctAnswer, $locale);

        // Appel OpenAI
        try {
            $response = Http::withToken($apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => self::MODEL,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a personal tutor for IT certifications. You kindly explain why an answer is wrong: first understand the learner\'s reasoning, then correct it.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.6,
                    'max_tokens' => 500,
                ]);
        } catch (\Throwable $e) {
            Log::warning('OpenAI API call failed', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => __('flash.ai_api_unreachable'),
            ], 502);
        }

        if (! $response->successful()) {
            Log::warning('OpenAI API error', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json([
                'error' => __('flash.ai_api_error', ['status' => $response->status()]),
            ], 502);
        }

        $body = $response->json();
        $explanation = trim($body['choices'][0]['message']['content'] ?? '');
        $tokensUsed = $body['usage']['total_tokens'] ?? null;

        if (empty($explanation)) {
            return response()->json(['error' => __('flash.ai_empty')], 502);
        }

        // Cache en base
        AiExplanation::create([
            'question_id' => $question->id,
            'wrong_answer_id' => $wrongAnswerId,
            'locale' => $locale,
            'explanation' => $explanation,
            'model' => self::MODEL,
            'tokens_used' => $tokensUsed,
        ]);

        // Consomme un cran du rate limit user (expire au bout de 24h)
        RateLimiter::hit($key, 86400);

        return response()->json([
            'explanation' => $explanation,
            'cached' => false,
        ]);
    }

    /**
     * Prompt en anglais, contenu dans la langue vue par l'utilisateur, reponse
     * demandee dans cette meme langue. Les options sont citees par leur texte :
     * les lettres sont melangees a chaque examen, l'IA ne doit pas s'y referer.
     */
    private function buildPrompt(Question $question, ?Answer $wrong, ?Answer $correct, string $locale): string
    {
        $canonical = $question->certification?->default_language ?? 'en';
        $text = fn ($model, string $field) => $model->localized($locale, $field, $canonical);
        $language = ['fr' => 'French', 'en' => 'English', 'de' => 'German', 'es' => 'Spanish', 'it' => 'Italian', 'pt' => 'Portuguese', 'pl' => 'Polish', 'ja' => 'Japanese', 'zh' => 'Chinese'][$locale] ?? 'English';

        $lines = [];
        if ($question->certification) {
            $lines[] = "Context: {$question->certification->title} certification.";
        }
        if ($topic = $text($question, 'topic')) {
            $lines[] = "Topic: {$topic}.";
        }
        if ($scenario = $text($question, 'scenario')) {
            $lines[] = "Scenario: {$scenario}";
        }
        $lines[] = 'Question: ' . $text($question, 'question_text');
        $lines[] = '';
        $lines[] = 'Options:';
        foreach ($question->answers as $a) {
            $lines[] = '- ' . $text($a, 'answer_text') . ($a->is_correct ? ' [CORRECT]' : '');
        }
        $lines[] = '';
        if ($wrong && ! $wrong->is_correct) {
            $lines[] = 'The learner chose: "' . $text($wrong, 'answer_text') . '". This answer is WRONG.';
            if ($correct) {
                $lines[] = 'The correct answer was: "' . $text($correct, 'answer_text') . '".';
            }
            $lines[] = '';
            $lines[] = 'In 3 to 5 sentences, explain:';
            $lines[] = '1. why the learner was probably tempted by their choice (the trap);';
            $lines[] = '2. why it is wrong (the concept they misunderstood);';
            $lines[] = '3. why the correct answer is right (the correct concept).';
        } else {
            $lines[] = 'In 3 to 4 sentences, explain the correct answer: why it is right, which concept it tests, and the classic trap to avoid.';
        }
        $lines[] = '';
        $lines[] = "Write the answer in {$language}, in a clear teaching tone. Refer to options by their wording, never by a letter. No headings, no numbered list: one flowing paragraph.";

        return implode("\n", $lines);
    }
}
