<?php

namespace Database\Seeders;

use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Applique les traductions Q&A stockees dans
 * database/seeders/data/translations/{slug}-{locale}.json.
 *
 * Format attendu du JSON :
 * {
 *   "meta": { "certification_slug": "...", "locale": "en", "canonical_from": "fr" },
 *   "questions": {
 *     "1": {
 *       "topic": "...",
 *       "scenario": "...",
 *       "question_text": "...",
 *       "explanation": "...",
 *       "answers": {
 *         "A": { "text": "...", "rationale": "..." },
 *         "B": { ... }
 *       }
 *     }
 *   }
 * }
 *
 * Idempotent : ecrase la traduction existante pour ce (locale, question),
 * ne touche pas aux autres locales stockees dans le meme JSON `translations`.
 */
class QuestionTranslationsSeeder extends Seeder
{
    public function run(): void
    {
        $dir = database_path('seeders/data/translations');
        if (! File::isDirectory($dir)) {
            $this->command?->info('Dossier translations absent - skip.');
            return;
        }

        $files = File::files($dir);
        if (empty($files)) {
            $this->command?->info('Aucun fichier de traduction - skip.');
            return;
        }

        $totalQuestions = 0;
        $totalAnswers = 0;

        foreach ($files as $file) {
            if ($file->getExtension() !== 'json') continue;

            $payload = json_decode(File::get($file->getPathname()), true);
            if (! is_array($payload)) {
                $this->command?->warn("  {$file->getFilename()} : JSON invalide, skip.");
                continue;
            }

            $slug = $payload['meta']['certification_slug'] ?? null;
            $locale = $payload['meta']['locale'] ?? null;
            $items = $payload['questions'] ?? [];

            if (! $slug || ! $locale || empty($items)) {
                $this->command?->warn("  {$file->getFilename()} : meta.certification_slug / meta.locale / questions manquants, skip.");
                continue;
            }

            $cert = Certification::where('slug', $slug)->first();
            if (! $cert) {
                $this->command?->warn("  {$file->getFilename()} : certif '{$slug}' introuvable, skip.");
                continue;
            }

            DB::transaction(function () use ($cert, $locale, $items, &$totalQuestions, &$totalAnswers) {
                foreach ($items as $position => $data) {
                    $question = Question::where('certification_id', $cert->id)
                        ->where('position', (int) $position)
                        ->first();
                    if (! $question) continue;

                    // Merge la traduction pour cette locale sans toucher aux autres
                    $qTranslations = $question->translations ?? [];
                    $qTranslations[$locale] = [
                        'topic' => $data['topic'] ?? null,
                        'scenario' => $data['scenario'] ?? null,
                        'question_text' => $data['question_text'] ?? null,
                        'explanation' => $data['explanation'] ?? null,
                    ];
                    $question->translations = $qTranslations;
                    $question->save();
                    $totalQuestions++;

                    $answerMap = $data['answers'] ?? [];
                    foreach ($answerMap as $letter => $aData) {
                        $answer = Answer::where('question_id', $question->id)
                            ->where('letter', (string) $letter)
                            ->first();
                        if (! $answer) continue;

                        $aTranslations = $answer->translations ?? [];
                        $aTranslations[$locale] = [
                            'answer_text' => $aData['text'] ?? null,
                            'rationale' => $aData['rationale'] ?? null,
                        ];
                        $answer->translations = $aTranslations;
                        $answer->save();
                        $totalAnswers++;
                    }
                }
            });

            $this->command?->info("  {$file->getFilename()} : locale={$locale}, cert={$slug} OK");
        }

        $this->command?->info("Traductions appliquees : {$totalQuestions} questions, {$totalAnswers} reponses.");
    }
}
