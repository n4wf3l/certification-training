<?php

namespace App\Console\Commands;

use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Aligne le CCNA 200-301 sur les langues officielles Cisco (EN + JP).
 *
 * - Promeut le contenu translations[en] vers les colonnes canoniques
 *   (question_text, topic, scenario, explanation, matching_pairs / answer_text, rationale).
 * - Retrograde le contenu FR (ex-canonique) vers translations[fr].
 * - Set default_language='en' et available_languages=['en','ja'].
 *
 * Idempotent : si default_language est deja 'en' on ne fait rien.
 * Aucune perte : le FR est preserve dans translations[fr] pour futur reactivation.
 */
class PromoteCcnaEnglishCanonicalCommand extends Command
{
    protected $signature = 'certifloop:promote-ccna-english {--dry-run : Preview sans ecrire}';
    protected $description = 'Promeut EN en canonique CCNA et set available_languages=[en,ja].';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $cert = Certification::where('slug', 'ccna-200-301')->first();
        if (!$cert) {
            $this->error('CCNA 200-301 introuvable.');
            return self::FAILURE;
        }

        if (($cert->default_language ?? 'fr') === 'en') {
            $this->info('CCNA est deja en canonique EN. Rien a faire.');
            // On assure quand meme que available_languages est bien [en, ja].
            if (!$dryRun) {
                $cert->update(['available_languages' => ['en', 'ja']]);
            }
            return self::SUCCESS;
        }

        $oldCanonical = $cert->default_language ?? 'fr'; // 'fr'
        $newCanonical = 'en';

        $stats = ['questions' => 0, 'answers' => 0, 'skipped_no_en' => 0];

        DB::transaction(function () use ($cert, $oldCanonical, $newCanonical, $dryRun, &$stats) {
            $questions = Question::where('certification_id', $cert->id)
                ->with('answers')
                ->get();

            foreach ($questions as $question) {
                $translations = $question->translations ?? [];
                $enFields = $translations[$newCanonical] ?? [];
                // Sans traduction EN on ne peut pas promouvoir : on skip (rare
                // mais on ne veut pas vider un champ canonique).
                if (empty($enFields['question_text'])) {
                    $stats['skipped_no_en']++;
                    continue;
                }

                // Old FR content sauvegarde dans translations[fr] avant ecrasement
                $oldFr = [
                    'topic'          => $question->topic,
                    'scenario'       => $question->scenario,
                    'question_text'  => $question->question_text,
                    'explanation'    => $question->explanation,
                ];
                if ($question->question_type === 'matching' && is_array($question->matching_pairs)) {
                    $oldFr['matching_pairs'] = $question->matching_pairs;
                }

                // Nouvelles valeurs canoniques (EN)
                $newTopic       = $enFields['topic']         ?? $question->topic;
                $newScenario    = $enFields['scenario']      ?? $question->scenario;
                $newQuestion    = $enFields['question_text'] ?? $question->question_text;
                $newExplanation = $enFields['explanation']   ?? $question->explanation;
                $newPairs       = $enFields['matching_pairs'] ?? $question->matching_pairs;

                // Reconstruit translations : on retire [en] (devient canonique)
                // et on injecte [fr] avec l'ancien contenu FR.
                unset($translations[$newCanonical]);
                $translations[$oldCanonical] = array_filter([
                    'topic'          => $oldFr['topic'],
                    'scenario'       => $oldFr['scenario'],
                    'question_text'  => $oldFr['question_text'],
                    'explanation'    => $oldFr['explanation'],
                    'matching_pairs' => $oldFr['matching_pairs'] ?? null,
                ], fn ($v) => $v !== null && $v !== '');

                if (!$dryRun) {
                    $question->update([
                        'topic'          => $newTopic,
                        'scenario'       => $newScenario,
                        'question_text'  => $newQuestion,
                        'explanation'    => $newExplanation,
                        'matching_pairs' => $newPairs,
                        'translations'   => $translations,
                    ]);
                }
                $stats['questions']++;

                // Meme traitement pour les reponses
                foreach ($question->answers as $answer) {
                    $aTranslations = $answer->translations ?? [];
                    $enA = $aTranslations[$newCanonical] ?? [];
                    if (empty($enA['answer_text'])) continue;

                    $oldFrA = [
                        'answer_text' => $answer->answer_text,
                        'rationale'   => $answer->rationale,
                    ];
                    $newText      = $enA['answer_text'] ?? $answer->answer_text;
                    $newRationale = $enA['rationale']   ?? $answer->rationale;

                    unset($aTranslations[$newCanonical]);
                    $aTranslations[$oldCanonical] = array_filter([
                        'answer_text' => $oldFrA['answer_text'],
                        'rationale'   => $oldFrA['rationale'],
                    ], fn ($v) => $v !== null && $v !== '');

                    if (!$dryRun) {
                        $answer->update([
                            'answer_text'  => $newText,
                            'rationale'    => $newRationale,
                            'translations' => $aTranslations,
                        ]);
                    }
                    $stats['answers']++;
                }
            }

            // Update cert-level metadata
            $certTranslations = $cert->translations ?? [];
            $enCert = $certTranslations[$newCanonical] ?? [];

            // Sauvegarde du contenu FR dans translations[fr] avant swap
            $oldFrCert = array_filter([
                'title'            => $cert->title,
                'description'      => $cert->description,
                'long_description' => $cert->long_description,
                'importance'       => $cert->importance,
                'validity_note'    => $cert->validity_note,
                'target_roles'     => $cert->target_roles,
                'course_blocks'    => $cert->course_blocks,
            ], fn ($v) => $v !== null && $v !== '' && $v !== []);

            $newTitle           = $enCert['title']            ?? $cert->title;
            $newDescription     = $enCert['description']      ?? $cert->description;
            $newLongDescription = $enCert['long_description'] ?? $cert->long_description;
            $newImportance      = $enCert['importance']       ?? $cert->importance;
            $newValidityNote    = $enCert['validity_note']    ?? $cert->validity_note;
            $newTargetRoles     = $enCert['target_roles']     ?? $cert->target_roles;
            $newCourseBlocks    = $enCert['course_blocks']    ?? $cert->course_blocks;

            unset($certTranslations[$newCanonical]);
            $certTranslations[$oldCanonical] = $oldFrCert;

            if (!$dryRun) {
                $cert->update([
                    'title'              => $newTitle,
                    'description'        => $newDescription,
                    'long_description'   => $newLongDescription,
                    'importance'         => $newImportance,
                    'validity_note'      => $newValidityNote,
                    'target_roles'       => $newTargetRoles,
                    'course_blocks'      => $newCourseBlocks,
                    'translations'       => $certTranslations,
                    'default_language'   => 'en',
                    'available_languages' => ['en', 'ja'],
                ]);
            }
        });

        $verb = $dryRun ? '[dry-run]' : 'Fait';
        $this->info(sprintf(
            '%s : %d questions promues + %d reponses (%d sans EN, skip). CCNA canonique=en, langues=[en,ja].',
            $verb, $stats['questions'], $stats['answers'], $stats['skipped_no_en']
        ));
        if (!$dryRun) {
            $this->line('Pense a lancer <fg=cyan>php artisan certifloop:dump-seeders</> pour persister.');
        }
        return self::SUCCESS;
    }
}
