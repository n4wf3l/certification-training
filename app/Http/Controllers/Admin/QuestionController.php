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
            'certifications' => Certification::orderBy('title')->get(['id', 'title', 'logo_path']),
            'default_certification_id' => $request->integer('certification_id') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            $nextPosition = Question::where('certification_id', $data['certification_id'])->max('position') + 1;

            $question = Question::create([
                'certification_id' => $data['certification_id'],
                'position' => $data['position'] ?: $nextPosition,
                'topic' => $data['topic'] ?? null,
                'scenario' => $data['scenario'] ?? null,
                'question_text' => $data['question_text'],
                'explanation' => $data['explanation'] ?? null,
            ]);

            foreach ($data['answers'] as $index => $answer) {
                Answer::create([
                    'question_id' => $question->id,
                    'letter' => $answer['letter'],
                    'answer_text' => $answer['answer_text'],
                    'rationale' => $answer['rationale'] ?? null,
                    'is_correct' => (int) $data['correct_index'] === $index,
                ]);
            }
        });

        return redirect()->route('admin.questions.index')->with('success', 'Question ajoutée.');
    }

    public function edit(Question $question): Response
    {
        $question->load('answers');
        $correctIndex = $question->answers->values()->search(fn ($a) => $a->is_correct);

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
            ],
            'certifications' => Certification::orderBy('title')->get(['id', 'title', 'logo_path']),
            'default_certification_id' => null,
        ]);
    }

    public function update(Request $request, Question $question): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($question, $data) {
            $question->update([
                'certification_id' => $data['certification_id'],
                'position' => $data['position'] ?: $question->position,
                'topic' => $data['topic'] ?? null,
                'scenario' => $data['scenario'] ?? null,
                'question_text' => $data['question_text'],
                'explanation' => $data['explanation'] ?? null,
            ]);

            $question->answers()->delete();
            foreach ($data['answers'] as $index => $answer) {
                Answer::create([
                    'question_id' => $question->id,
                    'letter' => $answer['letter'],
                    'answer_text' => $answer['answer_text'],
                    'rationale' => $answer['rationale'] ?? null,
                    'is_correct' => (int) $data['correct_index'] === $index,
                ]);
            }
        });

        return redirect()->route('admin.questions.index')->with('success', 'Question mise à jour.');
    }

    public function destroy(Question $question): RedirectResponse
    {
        $question->delete();
        return redirect()->route('admin.questions.index')->with('success', 'Question supprimée.');
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
            'certifications' => Certification::orderBy('title')->get(['id', 'title', 'logo_path']),
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

        $raw = $this->extractTopLevelArray($validated['payload']);
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw ValidationException::withMessages([
                'payload' => "Le JSON n'est pas valide. Vérifie qu'il commence par [ et se termine par ].",
            ]);
        }

        $normalized = [];
        foreach ($decoded as $i => $item) {
            $questionText = trim((string) ($item['question'] ?? ''));
            $answers = $item['answers'] ?? [];

            if ($questionText === '' || !is_array($answers) || count($answers) < 2 || count($answers) > 6) {
                throw ValidationException::withMessages([
                    'payload' => "Question " . ($i + 1) . " : énoncé manquant ou nombre de réponses invalide (2 à 6 attendues).",
                ]);
            }

            $cleanAnswers = [];
            $correctCount = 0;
            foreach ($answers as $a) {
                $text = trim((string) ($a['text'] ?? ''));
                $correct = (bool) ($a['correct'] ?? false);
                $rationale = isset($a['rationale']) && $a['rationale'] !== null && $a['rationale'] !== ''
                    ? trim((string) $a['rationale'])
                    : null;
                if ($text === '') {
                    throw ValidationException::withMessages([
                        'payload' => "Question " . ($i + 1) . " : une réponse a un texte vide.",
                    ]);
                }
                $cleanAnswers[] = ['text' => $text, 'correct' => $correct, 'rationale' => $rationale];
                if ($correct) $correctCount++;
            }

            if ($correctCount !== 1) {
                throw ValidationException::withMessages([
                    'payload' => "Question " . ($i + 1) . " : une seule réponse correcte attendue, {$correctCount} trouvée(s).",
                ]);
            }

            $normalized[] = [
                'topic' => isset($item['topic']) ? trim((string) $item['topic']) : null,
                'scenario' => isset($item['scenario']) && $item['scenario'] !== null && $item['scenario'] !== ''
                    ? trim((string) $item['scenario'])
                    : null,
                'question' => $questionText,
                'explanation' => isset($item['explanation']) && $item['explanation'] !== null && $item['explanation'] !== ''
                    ? trim((string) $item['explanation'])
                    : null,
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
                ]);

                foreach ($q['answers'] as $idx => $a) {
                    Answer::create([
                        'question_id' => $question->id,
                        'letter' => chr(65 + $idx), // A, B, C, D, E, F
                        'answer_text' => $a['text'],
                        'rationale' => $a['rationale'] ?? null,
                        'is_correct' => $a['correct'],
                    ]);
                }
            }

            Certification::where('id', $validated['certification_id'])
                ->update(['questions_updated_at' => now()]);
        });

        $count = count($normalized);
        return redirect()
            ->route('admin.questions.index', ['certification_id' => $validated['certification_id']])
            ->with('success', "{$count} question" . ($count > 1 ? 's' : '') . ' importée' . ($count > 1 ? 's' : '') . ' avec succès.');
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
        ]);
    }
}
