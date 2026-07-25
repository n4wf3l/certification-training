<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\QuestionReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuestionReportController extends Controller
{
    public function store(Request $request, Question $question): RedirectResponse
    {
        $data = $request->validate([
            'category' => ['required', Rule::in(array_keys(QuestionReport::CATEGORIES))],
            'message' => 'nullable|string|max:1000',
            'chosen_answer_id' => 'nullable|integer|exists:answers,id',
            'attempt_id' => 'nullable|integer|exists:attempts,id',
        ]);

        // Anti-spam basique : un user ne peut pas reporter 2 fois la meme question
        // avec la meme categorie sous 24h.
        $recent = QuestionReport::where('question_id', $question->id)
            ->where('user_id', auth()->id())
            ->where('category', $data['category'])
            ->where('created_at', '>', now()->subDay())
            ->exists();

        if ($recent) {
            return back()->with('info', __('flash.report_duplicate'));
        }

        QuestionReport::create([
            'question_id' => $question->id,
            'user_id' => auth()->id(),
            'category' => $data['category'],
            'message' => $data['message'] ?? null,
            'chosen_answer_id' => $data['chosen_answer_id'] ?? null,
            'attempt_id' => $data['attempt_id'] ?? null,
        ]);

        return back()->with('success', __('flash.report_submitted'));
    }
}
