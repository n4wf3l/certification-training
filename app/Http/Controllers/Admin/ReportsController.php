<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuestionReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->input('status', 'pending');
        if (!in_array($filter, QuestionReport::STATUSES, true)) $filter = 'pending';

        $reports = QuestionReport::query()
            ->when($filter !== 'all', fn ($q) => $q->where('status', $filter))
            ->with([
                'question:id,position,certification_id,topic,question_text',
                'question.certification:id,title,slug',
                'user:id,name,email',
                'chosenAnswer:id,letter,answer_text',
            ])
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'reviewed' THEN 1 WHEN 'resolved' THEN 2 WHEN 'dismissed' THEN 3 END")
            ->orderByDesc('created_at')
            ->get();

        $counts = QuestionReport::query()
            ->selectRaw('status, COUNT(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status')
            ->all();

        return Inertia::render('Admin/Reports/Index', [
            'reports' => $reports->map(fn (QuestionReport $r) => [
                'id' => $r->id,
                'category' => $r->category,
                'category_label' => QuestionReport::CATEGORIES[$r->category] ?? $r->category,
                'message' => $r->message,
                'status' => $r->status,
                'admin_note' => $r->admin_note,
                'created_at' => $r->created_at?->toIso8601String(),
                'user' => $r->user ? ['id' => $r->user->id, 'name' => $r->user->name, 'email' => $r->user->email] : null,
                'question' => $r->question ? [
                    'id' => $r->question->id,
                    'position' => $r->question->position,
                    'topic' => $r->question->topic,
                    'text' => $r->question->question_text,
                    'certification' => $r->question->certification ? [
                        'id' => $r->question->certification->id,
                        'title' => $r->question->certification->title,
                        'slug' => $r->question->certification->slug,
                    ] : null,
                ] : null,
                'chosen_answer' => $r->chosenAnswer ? [
                    'letter' => $r->chosenAnswer->letter,
                    'text' => $r->chosenAnswer->answer_text,
                ] : null,
            ]),
            'counts' => [
                'pending' => (int) ($counts['pending'] ?? 0),
                'reviewed' => (int) ($counts['reviewed'] ?? 0),
                'resolved' => (int) ($counts['resolved'] ?? 0),
                'dismissed' => (int) ($counts['dismissed'] ?? 0),
                'all' => (int) array_sum($counts),
            ],
            'filter' => $filter,
        ]);
    }

    public function update(Request $request, QuestionReport $report): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(QuestionReport::STATUSES)],
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $report->update($data);

        return back()->with('success', __('flash.report_updated'));
    }
}
