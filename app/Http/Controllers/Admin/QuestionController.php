<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ExtractsJsonArray;
use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    use ExtractsJsonArray;

    public function index(Request $request): Response
    {
        $certificationId = $request->integer('certification_id');
        $certifications = Certification::orderBy('title')->get(['id', 'title', 'logo_path']);

        $questionsQuery = Question::query()->with('answers', 'certification:id,title,logo_path');
        if ($certificationId) {
            $questionsQuery->where('certification_id', $certificationId);
        }
        $questions = $questionsQuery->orderBy('certification_id')->orderBy('position')->get();

        return Inertia::render('Admin/Questions/Index', [
            'certifications' => $certifications,
            'selected_certification_id' => $certificationId ?: null,
            'questions' => $questions->map(fn (Question $q) => [
                'id' => $q->id,
                'position' => $q->position,
                'topic' => $q->topic,
                'scenario' => $q->scenario,
                'question_text' => $q->question_text,
                'explanation' => $q->explanation,
                'certification' => [
                    'id' => $q->certification->id,
                    'title' => $q->certification->title,
                    'logo_path' => $q->certification->logo_path,
                ],
                'answers_count' => $q->answers->count(),
                'correct_letter' => optional($q->answers->firstWhere('is_correct', true))->letter,
                'answers' => $q->answers->map(fn ($a) => [
                    'letter' => $a->letter,
                    'text' => $a->answer_text,
                    'rationale' => $a->rationale,
                    'is_correct' => $a->is_correct,
                ]),
            ]),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Questions/Form', [
            'question' => null,
            'certifications' => Certification::orderBy('title')->get(['id', 'title', 'logo_path', 'default_language', 'available_languages']),
            'default_certification_id' => $request->integer('certification_id') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            $cert = Certification::findOrFail($data['certification_id']);
            $canonicalLang = $cert->default_language ?? 'fr';
            [$questionShadows, $answerShadows] = $this->splitEditTranslations(
                $data['translations'] ?? [],
                $canonicalLang
            );

            $nextPosition = Question::where('certification_id', $data['certification_id'])->max('position') + 1;

            $question = Question::create([
                'certification_id' => $data['certification_id'],
                'position' => $data['position'] ?: $nextPosition,
                'topic' => $data['topic'] ?? null,
                'scenario' => $data['scenario'] ?? null,
                'question_text' => $data['question_text'],
                'explanation' => $data['explanation'] ?? null,
                'translations' => !empty($questionShadows) ? $questionShadows : null,
            ]);

            foreach ($data['answers'] as $index => $answer) {
                Answer::create([
                    'question_id' => $question->id,
                    'letter' => $answer['letter'],
                    'answer_text' => $answer['answer_text'],
                    'rationale' => $answer['rationale'] ?? null,
                    'is_correct' => (int) $data['correct_index'] === $index,
                    'translations' => !empty($answerShadows[$index]) ? $answerShadows[$index] : null,
                ]);
            }
        });

        return redirect()->route('admin.questions.index')->with('success', __('flash.question_added'));
    }

    public function edit(Question $question): Response
    {
        $question->load('answers', 'certification');
        $correctIndex = $question->answers->values()->search(fn ($a) => $a->is_correct);

        // Recompose la shape { lang: { topic, ..., answers: [ {answer_text, rationale}, ... ] } }
        // pour hydrater le form multi-langue cote client.
        $questionTranslations = is_array($question->translations) ? $question->translations : [];
        $answersOrdered = $question->answers->values();
        $translationsPayload = [];
        foreach ($questionTranslations as $lang => $fields) {
            $translationsPayload[$lang] = [
                'topic' => $fields['topic'] ?? '',
                'scenario' => $fields['scenario'] ?? '',
                'question_text' => $fields['question_text'] ?? '',
                'explanation' => $fields['explanation'] ?? '',
                'answers' => $answersOrdered->map(fn ($a) => [
                    'answer_text' => data_get($a->translations, "{$lang}.answer_text", ''),
                    'rationale' => data_get($a->translations, "{$lang}.rationale", ''),
                ])->all(),
            ];
        }
        // Egalement les locales qui n'ont que des shadow answers (rare mais possible)
        foreach ($answersOrdered as $a) {
            if (! is_array($a->translations)) continue;
            foreach ($a->translations as $lang => $_) {
                if (isset($translationsPayload[$lang])) continue;
                $translationsPayload[$lang] = [
                    'topic' => '',
                    'scenario' => '',
                    'question_text' => '',
                    'explanation' => '',
                    'answers' => $answersOrdered->map(fn ($aa) => [
                        'answer_text' => data_get($aa->translations, "{$lang}.answer_text", ''),
                        'rationale' => data_get($aa->translations, "{$lang}.rationale", ''),
                    ])->all(),
                ];
            }
        }

        return Inertia::render('Admin/Questions/Form', [
            'question' => [
                'id' => $question->id,
                'certification_id' => $question->certification_id,
                'position' => $question->position,
                'topic' => $question->topic,
                'scenario' => $question->scenario,
                'question_text' => $question->question_text,
                'explanation' => $question->explanation,
                'answers' => $question->answers->map(fn ($a) => [
                    'letter' => $a->letter,
                    'answer_text' => $a->answer_text,
                    'rationale' => $a->rationale,
                ])->values(),
                'correct_index' => $correctIndex === false ? 0 : $correctIndex,
                'translations' => $translationsPayload,
                'certification' => [
                    'id' => $question->certification->id,
                    'default_language' => $question->certification->default_language ?? 'fr',
                    'available_languages' => $question->certification->available_languages ?: ['fr'],
                ],
            ],
            'certifications' => Certification::orderBy('title')->get(['id', 'title', 'logo_path', 'default_language', 'available_languages']),
            'default_certification_id' => null,
        ]);
    }

    public function update(Request $request, Question $question): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($question, $data) {
            $cert = Certification::findOrFail($data['certification_id']);
            $canonicalLang = $cert->default_language ?? 'fr';
            [$questionShadows, $answerShadows] = $this->splitEditTranslations(
                $data['translations'] ?? [],
                $canonicalLang
            );

            $question->update([
                'certification_id' => $data['certification_id'],
                'position' => $data['position'] ?: $question->position,
                'topic' => $data['topic'] ?? null,
                'scenario' => $data['scenario'] ?? null,
                'question_text' => $data['question_text'],
                'explanation' => $data['explanation'] ?? null,
                'translations' => !empty($questionShadows) ? $questionShadows : null,
            ]);

            $question->answers()->delete();
            foreach ($data['answers'] as $index => $answer) {
                Answer::create([
                    'question_id' => $question->id,
                    'letter' => $answer['letter'],
                    'answer_text' => $answer['answer_text'],
                    'rationale' => $answer['rationale'] ?? null,
                    'is_correct' => (int) $data['correct_index'] === $index,
                    'translations' => !empty($answerShadows[$index]) ? $answerShadows[$index] : null,
                ]);
            }
        });

        return redirect()->route('admin.questions.index')->with('success', __('flash.question_updated'));
    }

    public function destroy(Question $question): RedirectResponse
    {
        $question->delete();
        return redirect()->route('admin.questions.index')->with('success', __('flash.question_deleted'));
    }

    public function importForm(Request $request): Response
    {
        $existingByCert = Question::query()
            ->orderBy('certification_id')
            ->orderBy('position')
            ->get(['id', 'certification_id', 'position', 'topic', 'scenario', 'question_text'])
            ->groupBy('certification_id')
            ->map(fn ($questions) => $questions->map(fn (Question $q) => [
                'position' => $q->position,
                'topic' => $q->topic,
                'scenario' => $q->scenario,
                'question_text' => $q->question_text,
            ])->values())
            ->all();

        return Inertia::render('Admin/Questions/Import', [
            'certifications' => Certification::orderBy('title')
                ->get(['id', 'title', 'logo_path', 'available_languages'])
                ->map(fn (Certification $c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'logo_path' => $c->logo_path,
                    'available_languages' => $c->available_languages ?: ['fr'],
                ]),
            'default_certification_id' => $request->integer('certification_id') ?: null,
            'existing_by_cert' => $existingByCert,
        ]);
    }

    public function importStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'payload' => 'required|string',
        ]);

        $certification = Certification::findOrFail($validated['certification_id']);
        $canonical = $certification->default_language ?: 'en';
        $availableLangs = $certification->available_languages ?: [$canonical];

        $raw = $this->extractTopLevelArray($validated['payload']);
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw ValidationException::withMessages([
                'payload' => __('flash.questions_invalid_json'),
            ]);
        }

        $normalized = [];
        foreach ($decoded as $i => $item) {
            $answers = $item['answers'] ?? [];
            if (!is_array($answers) || count($answers) < 2 || count($answers) > 6) {
                throw ValidationException::withMessages([
                    'payload' => __('flash.questions_row_bad_shape', ['n' => $i + 1]),
                ]);
            }

            // Question text is either a string (single-lang) or an object { lang: string } (multilingual)
            $questionField = $item['question'] ?? null;
            [$questionCanonical, $questionTranslations] = $this->localizeStringField(
                $questionField,
                $canonical,
                $availableLangs,
                $i + 1,
                'question',
                required: true,
            );

            [$topicCanonical, $topicTranslations] = $this->localizeStringField(
                $item['topic'] ?? null, $canonical, $availableLangs, $i + 1, 'topic', required: false,
            );
            [$scenarioCanonical, $scenarioTranslations] = $this->localizeStringField(
                $item['scenario'] ?? null, $canonical, $availableLangs, $i + 1, 'scenario', required: false,
            );
            [$explanationCanonical, $explanationTranslations] = $this->localizeStringField(
                $item['explanation'] ?? null, $canonical, $availableLangs, $i + 1, 'explanation', required: false,
            );

            $cleanAnswers = [];
            $correctCount = 0;
            foreach ($answers as $a) {
                [$textCanonical, $textTranslations] = $this->localizeStringField(
                    $a['text'] ?? null, $canonical, $availableLangs, $i + 1, 'answer text', required: true,
                );
                if ($textCanonical === '') {
                    throw ValidationException::withMessages([
                        'payload' => __('flash.questions_row_empty_answer', ['n' => $i + 1]),
                    ]);
                }
                [$rationaleCanonical, $rationaleTranslations] = $this->localizeStringField(
                    $a['rationale'] ?? null, $canonical, $availableLangs, $i + 1, 'rationale', required: false,
                );
                $correct = (bool) ($a['correct'] ?? false);

                $cleanAnswers[] = [
                    'text' => $textCanonical,
                    'text_translations' => $textTranslations,
                    'correct' => $correct,
                    'rationale' => $rationaleCanonical,
                    'rationale_translations' => $rationaleTranslations,
                ];
                if ($correct) $correctCount++;
            }

            if ($correctCount !== 1) {
                throw ValidationException::withMessages([
                    'payload' => __('flash.questions_row_wrong_correct_count', ['n' => $i + 1, 'count' => $correctCount]),
                ]);
            }

            // Merge per-field translation buckets into a single translations map per row.
            $questionTranslationsMerged = $this->mergeFieldTranslations([
                'question_text' => $questionTranslations,
                'topic' => $topicTranslations,
                'scenario' => $scenarioTranslations,
                'explanation' => $explanationTranslations,
            ]);

            $normalized[] = [
                'topic' => $topicCanonical,
                'scenario' => $scenarioCanonical,
                'question' => $questionCanonical,
                'explanation' => $explanationCanonical,
                'translations' => $questionTranslationsMerged,
                'answers' => $cleanAnswers,
            ];
        }

        DB::transaction(function () use ($normalized, $validated) {
            $position = Question::where('certification_id', $validated['certification_id'])->max('position') ?? 0;

            foreach ($normalized as $q) {
                $position++;
                $question = Question::create([
                    'certification_id' => $validated['certification_id'],
                    'position' => $position,
                    'topic' => $q['topic'] ?: null,
                    'scenario' => $q['scenario'],
                    'question_text' => $q['question'],
                    'explanation' => $q['explanation'] ?? null,
                    'translations' => $q['translations'] ?: null,
                ]);

                foreach ($q['answers'] as $idx => $a) {
                    $answerTranslations = $this->mergeFieldTranslations([
                        'answer_text' => $a['text_translations'],
                        'rationale' => $a['rationale_translations'],
                    ]);
                    Answer::create([
                        'question_id' => $question->id,
                        'letter' => chr(65 + $idx), // A, B, C, D, E, F
                        'answer_text' => $a['text'],
                        'rationale' => $a['rationale'] ?? null,
                        'is_correct' => $a['correct'],
                        'translations' => $answerTranslations ?: null,
                    ]);
                }
            }

            Certification::where('id', $validated['certification_id'])
                ->update(['questions_updated_at' => now()]);
        });

        $count = count($normalized);
        return redirect()
            ->route('admin.questions.index', ['certification_id' => $validated['certification_id']])
            ->with('success', trans_choice('flash.questions_imported', $count, ['count' => $count]));
    }

    /**
     * Accept either a plain string (single-language) or an object { lang: string } (multilingual).
     * Returns [canonicalValue, translationsMap] where translations only include keys of
     * $availableLangs distinct from $canonical.
     *
     * @return array{0: ?string, 1: array<string, string>}
     */
    private function localizeStringField(
        mixed $raw,
        string $canonical,
        array $availableLangs,
        int $rowNumber,
        string $fieldLabel,
        bool $required,
    ): array {
        // null / '' -> nothing to store
        if ($raw === null || $raw === '') {
            if ($required) {
                throw ValidationException::withMessages([
                    'payload' => __('flash.questions_row_bad_shape', ['n' => $rowNumber]),
                ]);
            }
            return [null, []];
        }

        // Scalar (single-language batch): canonical only, no translations.
        if (is_string($raw)) {
            $val = trim($raw);
            if ($val === '' && $required) {
                throw ValidationException::withMessages([
                    'payload' => __('flash.questions_row_bad_shape', ['n' => $rowNumber]),
                ]);
            }
            return [$val === '' ? null : $val, []];
        }

        // Array/object: per-language map. Filter to cert's available languages.
        if (!is_array($raw)) {
            throw ValidationException::withMessages([
                'payload' => __('flash.questions_row_field_type', ['n' => $rowNumber, 'field' => $fieldLabel]),
            ]);
        }

        $filtered = [];
        foreach ($availableLangs as $lang) {
            if (!array_key_exists($lang, $raw)) {
                if ($required) {
                    throw ValidationException::withMessages([
                        'payload' => __('flash.questions_row_missing_lang', ['n' => $rowNumber, 'field' => $fieldLabel, 'lang' => $lang]),
                    ]);
                }
                continue;
            }
            $val = trim((string) $raw[$lang]);
            if ($val === '') {
                if ($required) {
                    throw ValidationException::withMessages([
                        'payload' => __('flash.questions_row_missing_lang', ['n' => $rowNumber, 'field' => $fieldLabel, 'lang' => $lang]),
                    ]);
                }
                continue;
            }
            $filtered[$lang] = $val;
        }

        $canonicalValue = $filtered[$canonical] ?? null;
        if ($required && ($canonicalValue === null || $canonicalValue === '')) {
            throw ValidationException::withMessages([
                'payload' => __('flash.questions_row_missing_lang', ['n' => $rowNumber, 'field' => $fieldLabel, 'lang' => $canonical]),
            ]);
        }

        $translations = collect($filtered)->except($canonical)->all();
        return [$canonicalValue, $translations];
    }

    /**
     * Turns per-field translation buckets into the shape stored in translations columns:
     * { lang: { field1: value, field2: value, ... } }
     * Skips empty langs to avoid storing {"en": {}} on rows where every field is single-lang.
     *
     * @param array<string, array<string, string>> $fieldsByLang
     * @return array<string, array<string, string>>
     */
    private function mergeFieldTranslations(array $fieldsByLang): array
    {
        $out = [];
        foreach ($fieldsByLang as $field => $langMap) {
            foreach ($langMap as $lang => $value) {
                $out[$lang][$field] = $value;
            }
        }
        return $out;
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'position' => 'nullable|integer|min:1',
            'topic' => 'nullable|string|max:150',
            'scenario' => 'nullable|string',
            'question_text' => 'required|string',
            'explanation' => 'nullable|string|max:2000',
            'answers' => 'required|array|min:2|max:6',
            'answers.*.letter' => 'required|string|max:2',
            'answers.*.answer_text' => 'required|string',
            'answers.*.rationale' => 'nullable|string|max:1000',
            'correct_index' => 'required|integer|min:0',
            // Shadow translations : par langue non-canonique, 4 champs question
            // + 2 champs par reponse (indexes memes que le tableau answers).
            'translations' => 'nullable|array',
            'translations.*.topic' => 'nullable|string|max:150',
            'translations.*.scenario' => 'nullable|string',
            'translations.*.question_text' => 'nullable|string',
            'translations.*.explanation' => 'nullable|string|max:2000',
            'translations.*.answers' => 'nullable|array',
            'translations.*.answers.*.answer_text' => 'nullable|string',
            'translations.*.answers.*.rationale' => 'nullable|string|max:1000',
        ]);
    }

    /**
     * Split le sous-tableau `translations` en 2 shapes :
     *  - questionShadows : { lang: { topic, scenario, question_text, explanation } }
     *  - answerShadowsByIndex : [ answer_index => { lang: { answer_text, rationale } } ]
     *
     * Filtre les locales entierement vides. Exclut la langue canonique.
     *
     * @param array<string, mixed> $incoming
     * @return array{0: array<string, array<string, string>>, 1: array<int, array<string, array<string, string>>>}
     */
    private function splitEditTranslations(array $incoming, string $canonicalLang): array
    {
        $questionShadows = [];
        $answerShadows = [];

        foreach ($incoming as $lang => $block) {
            if (! is_string($lang) || ! preg_match('/^[a-z]{2}$/', $lang)) continue;
            if ($lang === $canonicalLang) continue;
            if (! is_array($block)) continue;

            $qFields = [];
            foreach (['topic', 'scenario', 'question_text', 'explanation'] as $f) {
                $v = isset($block[$f]) ? trim((string) $block[$f]) : '';
                if ($v !== '') $qFields[$f] = $v;
            }
            if (! empty($qFields)) {
                $questionShadows[$lang] = $qFields;
            }

            $answers = $block['answers'] ?? [];
            if (is_array($answers)) {
                foreach ($answers as $idx => $a) {
                    if (! is_array($a)) continue;
                    $aFields = [];
                    foreach (['answer_text', 'rationale'] as $f) {
                        $v = isset($a[$f]) ? trim((string) $a[$f]) : '';
                        if ($v !== '') $aFields[$f] = $v;
                    }
                    if (! empty($aFields)) {
                        $answerShadows[(int) $idx][$lang] = $aFields;
                    }
                }
            }
        }

        return [$questionShadows, $answerShadows];
    }
}
