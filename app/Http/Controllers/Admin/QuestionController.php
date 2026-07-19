<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    public function index(Request $request): Response
    {
        $certificationId = $request->integer('certification_id');
        $certifications = Certification::orderBy('title')->get(['id', 'title']);

        $questionsQuery = Question::query()->with('answers', 'certification:id,title');
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
                'question_text' => $q->question_text,
                'certification' => [
                    'id' => $q->certification->id,
                    'title' => $q->certification->title,
                ],
                'answers_count' => $q->answers->count(),
                'correct_letter' => optional($q->answers->firstWhere('is_correct', true))->letter,
            ]),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Questions/Form', [
            'question' => null,
            'certifications' => Certification::orderBy('title')->get(['id', 'title']),
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
            ]);

            foreach ($data['answers'] as $index => $answer) {
                Answer::create([
                    'question_id' => $question->id,
                    'letter' => $answer['letter'],
                    'answer_text' => $answer['answer_text'],
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
                'answers' => $question->answers->map(fn ($a) => [
                    'letter' => $a->letter,
                    'answer_text' => $a->answer_text,
                ])->values(),
                'correct_index' => $correctIndex === false ? 0 : $correctIndex,
            ],
            'certifications' => Certification::orderBy('title')->get(['id', 'title']),
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
            ]);

            $question->answers()->delete();
            foreach ($data['answers'] as $index => $answer) {
                Answer::create([
                    'question_id' => $question->id,
                    'letter' => $answer['letter'],
                    'answer_text' => $answer['answer_text'],
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

    private function validated(Request $request): array
    {
        return $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'position' => 'nullable|integer|min:1',
            'topic' => 'nullable|string|max:150',
            'scenario' => 'nullable|string',
            'question_text' => 'required|string',
            'answers' => 'required|array|min:2|max:6',
            'answers.*.letter' => 'required|string|max:2',
            'answers.*.answer_text' => 'required|string',
            'correct_index' => 'required|integer|min:0',
        ]);
    }
}
