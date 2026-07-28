<?php

namespace App\Console\Commands;

use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Regenerates seed data files from the current DB state so that
 * `migrate:fresh --seed` restores an identical snapshot.
 *
 * Rewrites :
 *  - database/seeders/data/certifications.json
 *  - database/seeders/data/questions.json
 *  - database/seeders/data/settings.json
 *  - database/seeders/data/translations/certifications-{locale}.json
 *  - database/seeders/data/translations/{slug}-{locale}.json  (questions+answers)
 *  - database/seeders/data/translations/courses/{slug}-{locale}.json  (course blocks)
 *
 * Idempotent : consolidates any previously-split ITIL files
 * (itil-foundation-v5-en-2.json etc.) into a single canonical file per slug/locale.
 */
class DumpSeedersCommand extends Command
{
    protected $signature = 'certifloop:dump-seeders {--dry-run : Print what would be written without touching files}';
    protected $description = 'Dump all content in the local DB back to seeder files.';

    private string $dataDir;
    private string $transDir;
    private string $coursesDir;
    private bool $dryRun;

    public function handle(): int
    {
        $this->dryRun = (bool) $this->option('dry-run');
        $this->dataDir = database_path('seeders/data');
        $this->transDir = $this->dataDir . '/translations';
        $this->coursesDir = $this->transDir . '/courses';

        if (!$this->dryRun) {
            File::ensureDirectoryExists($this->coursesDir);
        }

        $this->dumpCertifications();
        $this->dumpQuestions();
        $this->dumpSettings();
        $this->dumpCertificationTranslations();
        $this->dumpQuestionTranslations();
        $this->dumpCourseTranslations();

        $this->info($this->dryRun ? "Dry run OK - no files modified." : "Seed files rewritten from DB state.");
        return self::SUCCESS;
    }

    private function dumpCertifications(): void
    {
        $rows = Certification::orderBy('id')->get()->map(fn (Certification $c) => [
            'title' => $c->title,
            'slug' => $c->slug,
            'logo_path' => $c->logo_path,
            'description' => $c->description,
            'long_description' => $c->long_description,
            'importance' => $c->importance,
            'target_roles' => $c->target_roles ?? [],
            'duration_minutes' => $c->duration_minutes,
            'passing_score' => $c->passing_score,
            'total_questions' => $c->total_questions,
            'min_questions' => $c->min_questions,
            'max_questions' => $c->max_questions,
            'navigation_mode' => $c->navigation_mode ?? 'free',
            'validity_months' => $c->validity_months,
            'validity_note' => $c->validity_note,
            'version_retires_at' => $c->version_retires_at?->toIso8601String(),
            'questions_updated_at' => $c->questions_updated_at?->toIso8601String(),
            'course_blocks' => $c->course_blocks,
            'course_updated_at' => $c->course_updated_at?->toIso8601String(),
            'syllabus_blueprint' => $c->syllabus_blueprint,
            'is_active' => (bool) $c->is_active,
            'available_languages' => $c->available_languages ?: [$c->default_language ?? 'fr'],
            'default_language' => $c->default_language ?? 'fr',
        ])->all();

        $this->writeJson($this->dataDir . '/certifications.json', $rows, count($rows) . ' certifications');
    }

    private function dumpQuestions(): void
    {
        $out = [];
        foreach (Certification::orderBy('id')->get() as $cert) {
            $qs = Question::where('certification_id', $cert->id)
                ->with(['answers' => fn ($q) => $q->orderBy('letter')])
                ->orderBy('position')
                ->get();
            $out[$cert->slug] = $qs->map(fn (Question $q) => [
                'position' => $q->position,
                'topic' => $q->topic,
                'concept_group_key' => $q->concept_group_key,
                'syllabus_domain' => $q->syllabus_domain,
                'learning_objective' => $q->learning_objective,
                'scenario' => $q->scenario,
                'question_text' => $q->question_text,
                'explanation' => $q->explanation,
                'question_type' => $q->question_type ?? 'multiple_choice',
                'matching_pairs' => $q->matching_pairs,
                'answers' => $q->answers->map(fn (Answer $a) => [
                    'letter' => $a->letter,
                    'answer_text' => $a->answer_text,
                    'rationale' => $a->rationale,
                    'is_correct' => (bool) $a->is_correct,
                ])->all(),
            ])->all();
        }
        $this->writeJson($this->dataDir . '/questions.json', $out,
            'questions per cert: ' . collect($out)->map(fn ($v) => count($v))->toJson());
    }

    private function dumpSettings(): void
    {
        // SettingSeeder expects an array of {key, value} objects, not a map.
        $rows = Setting::orderBy('key')->get()->map(fn ($s) => [
            'key' => $s->key,
            'value' => $s->value,
        ])->all();
        $this->writeJson($this->dataDir . '/settings.json', $rows, count($rows) . ' settings');
    }

    private function dumpCertificationTranslations(): void
    {
        // Group by locale : each locale gets its own certifications-{locale}.json
        $byLocale = [];
        foreach (Certification::orderBy('id')->get() as $cert) {
            $translations = $cert->translations ?? [];
            foreach ($translations as $locale => $fields) {
                if (! is_array($fields)) continue;
                // Skip course_blocks - handled by dumpCourseTranslations
                $meta = collect($fields)->except('course_blocks')->all();
                if (empty(array_filter($meta, fn ($v) => $v !== null && $v !== ''))) continue;
                $byLocale[$locale][$cert->slug] = [
                    'title' => $meta['title'] ?? null,
                    'description' => $meta['description'] ?? null,
                    'long_description' => $meta['long_description'] ?? null,
                    'importance' => $meta['importance'] ?? null,
                    'validity_note' => $meta['validity_note'] ?? null,
                    'target_roles' => $meta['target_roles'] ?? [],
                ];
            }
        }

        foreach ($byLocale as $locale => $certs) {
            $payload = [
                'meta' => [
                    'locale' => $locale,
                    'canonical_from' => 'fr',
                    'dumped_at' => now()->toDateString(),
                    'source' => 'certifloop:dump-seeders',
                ],
                'certifications' => $certs,
            ];
            $file = $this->transDir . "/certifications-{$locale}.json";
            $this->writeJson($file, $payload, count($certs) . " certifications translated to {$locale}");
        }
    }

    private function dumpQuestionTranslations(): void
    {
        // Clean up old split files (itil-foundation-v5-en-2.json etc.)
        // before rewriting single consolidated files.
        $slugs = Certification::pluck('slug')->all();
        if (! $this->dryRun) {
            foreach (glob($this->transDir . '/*.json') as $existing) {
                $base = basename($existing);
                if (str_starts_with($base, 'certifications-')) continue;
                if (preg_match('/^(.+?)-([a-z]{2})(-\d+)?\.json$/', $base, $m)) {
                    if (in_array($m[1], $slugs, true) && !empty($m[3])) {
                        // e.g. itil-foundation-v5-en-2.json : delete (we'll rewrite consolidated)
                        File::delete($existing);
                        $this->line("  <fg=yellow>removed split file: {$base}</>");
                    }
                }
            }
        }

        foreach (Certification::orderBy('id')->get() as $cert) {
            $canonical = $cert->default_language ?? 'fr';
            $questions = Question::where('certification_id', $cert->id)
                ->with(['answers' => fn ($q) => $q->orderBy('letter')])
                ->orderBy('position')
                ->get();

            // Collect all locales present across question/answer translations
            $locales = [];
            foreach ($questions as $q) {
                foreach (array_keys($q->translations ?? []) as $l) {
                    if ($l !== $canonical) $locales[$l] = true;
                }
                foreach ($q->answers as $a) {
                    foreach (array_keys($a->translations ?? []) as $l) {
                        if ($l !== $canonical) $locales[$l] = true;
                    }
                }
            }

            foreach (array_keys($locales) as $locale) {
                $qBucket = [];
                foreach ($questions as $q) {
                    $qt = $q->translations[$locale] ?? [];
                    $answerBucket = [];
                    foreach ($q->answers as $a) {
                        $at = $a->translations[$locale] ?? [];
                        if (empty($at['answer_text']) && empty($at['rationale'])) continue;
                        $answerBucket[$a->letter] = [
                            'text' => $at['answer_text'] ?? null,
                            'rationale' => $at['rationale'] ?? null,
                        ];
                    }
                    // Skip questions with no translation whatsoever
                    if (empty($qt) && empty($answerBucket)) continue;
                    $qBucket[(string) $q->position] = [
                        'topic' => $qt['topic'] ?? null,
                        'scenario' => $qt['scenario'] ?? null,
                        'question_text' => $qt['question_text'] ?? null,
                        'explanation' => $qt['explanation'] ?? null,
                        'answers' => (object) $answerBucket,
                    ];
                }

                if (empty($qBucket)) continue;

                $payload = [
                    'meta' => [
                        'certification_slug' => $cert->slug,
                        'locale' => $locale,
                        'canonical_from' => $canonical,
                        'dumped_at' => now()->toDateString(),
                        'source' => 'certifloop:dump-seeders',
                        'coverage' => [
                            'questions_translated' => count($qBucket),
                            'questions_total' => $questions->count(),
                        ],
                    ],
                    'questions' => (object) $qBucket,
                ];
                $file = $this->transDir . "/{$cert->slug}-{$locale}.json";
                $this->writeJson($file, $payload, count($qBucket) . " Q&A translated to {$locale} for {$cert->slug}");
            }
        }
    }

    private function dumpCourseTranslations(): void
    {
        foreach (Certification::orderBy('id')->get() as $cert) {
            $canonical = $cert->default_language ?? 'fr';
            $translations = $cert->translations ?? [];
            foreach ($translations as $locale => $fields) {
                if ($locale === $canonical) continue;
                $blocks = $fields['course_blocks'] ?? null;
                if (! is_array($blocks) || empty($blocks)) continue;
                $payload = [
                    'meta' => [
                        'certification_slug' => $cert->slug,
                        'locale' => $locale,
                        'canonical_from' => $canonical,
                        'dumped_at' => now()->toDateString(),
                        'source' => 'certifloop:dump-seeders',
                        'block_count' => count($blocks),
                    ],
                    'blocks' => $blocks,
                ];
                $file = $this->coursesDir . "/{$cert->slug}-{$locale}.json";
                $this->writeJson($file, $payload, count($blocks) . " course blocks translated to {$locale} for {$cert->slug}");
            }
        }
    }

    private function writeJson(string $path, mixed $data, string $summary): void
    {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($this->dryRun) {
            $this->line("  <fg=cyan>[dry]</> " . basename($path) . " : {$summary}");
            return;
        }
        File::put($path, $json);
        $this->line("  <fg=green>✓</> " . str_replace(database_path('seeders/data') . DIRECTORY_SEPARATOR, '', $path) . " : {$summary}");
    }
}
