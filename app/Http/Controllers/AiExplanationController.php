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
        ]);
        $wrongAnswerId = $data['wrong_answer_id'] ?? null;

        // Verifier que la cle OpenAI est configuree
        $apiKey = Setting::get('openai_api_key');
        if (empty($apiKey)) {
            return response()->json([
                'error' => "La feature n'est pas activee : l'admin doit configurer une cle OpenAI dans les parametres.",
            ], 503);
        }

        // Rate limit par user
        $dailyLimit = (int) Setting::get('openai_daily_limit_per_user', 10);
        if ($dailyLimit === 0) {
            return response()->json([
                'error' => "La feature est desactivee par l'admin.",
            ], 503);
        }

        $userId = auth()->id();
        $key = "ai-explain:user:{$userId}";
        if (RateLimiter::tooManyAttempts($key, $dailyLimit)) {
            $seconds = RateLimiter::availableIn($key);
            $hours = ceil($seconds / 3600);
            return response()->json([
                'error' => "Limite quotidienne atteinte ({$dailyLimit} explications/jour). Reessaie dans {$hours}h.",
            ], 429);
        }

        // Cache : si on a deja genere pour cette (question, wrong_answer), on renvoie le cache
        $cached = AiExplanation::where('question_id', $question->id)
            ->where('wrong_answer_id', $wrongAnswerId)
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
        $prompt = $this->buildPrompt($question, $wrongAnswer, $correctAnswer);

        // Appel OpenAI
        try {
            $response = Http::withToken($apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => self::MODEL,
                    'messages' => [
                        ['role' => 'system', 'content' => "Tu es un tuteur personnel specialise dans les certifications IT. Tu expliques avec bienveillance pourquoi une reponse est fausse, en te mettant a la place de l'utilisateur pour comprendre son raisonnement, puis en corrigeant."],
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
                'error' => "Erreur cote API OpenAI (HTTP {$response->status()}). Verifie ta cle admin.",
            ], 502);
        }

        $body = $response->json();
        $explanation = trim($body['choices'][0]['message']['content'] ?? '');
        $tokensUsed = $body['usage']['total_tokens'] ?? null;

        if (empty($explanation)) {
            return response()->json(['error' => "L'API a retourne une explication vide."], 502);
        }

        // Cache en base
        AiExplanation::create([
            'question_id' => $question->id,
            'wrong_answer_id' => $wrongAnswerId,
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

    private function buildPrompt(Question $question, ?Answer $wrong, ?Answer $correct): string
    {
        $lines = [];
        if ($question->certification) {
            $lines[] = "Contexte : certification {$question->certification->title}.";
        }
        if ($question->topic) {
            $lines[] = "Thème : {$question->topic}.";
        }
        if ($question->scenario) {
            $lines[] = "Scénario : {$question->scenario}";
        }
        $lines[] = "Question : {$question->question_text}";
        $lines[] = '';
        $lines[] = 'Options :';
        foreach ($question->answers as $a) {
            $mark = $a->is_correct ? '[BONNE]' : '';
            $lines[] = "  {$a->letter}. {$a->answer_text} {$mark}";
        }
        $lines[] = '';
        if ($wrong && ! $wrong->is_correct) {
            $lines[] = "L'utilisateur a choisi la reponse {$wrong->letter} : « {$wrong->answer_text} ». Cette reponse est FAUSSE.";
            if ($correct) {
                $lines[] = "La bonne reponse etait la {$correct->letter} : « {$correct->answer_text} ».";
            }
            $lines[] = '';
            $lines[] = "Explique pedagogiquement en 3 a 5 phrases :";
            $lines[] = "1. Pourquoi l'utilisateur a probablement ete tente par {$wrong->letter} (le piege).";
            $lines[] = "2. Pourquoi cette reponse est fausse (le concept qu'il a mal saisi).";
            $lines[] = "3. Pourquoi la {$correct?->letter} est la bonne (le concept correct).";
        } else {
            $lines[] = "Explique la bonne reponse en 3 a 4 phrases : pourquoi elle est correcte, quel concept elle teste, et le piege classique a eviter.";
        }
        $lines[] = '';
        $lines[] = 'Reponse en francais, ton pedagogique et clair. Pas de titres, pas de listes numerotees, juste un paragraphe fluide.';

        return implode("\n", $lines);
    }
}
