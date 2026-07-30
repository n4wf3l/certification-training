<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\QuestionBookmark;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gestion des favoris utilisateur sur les questions. Toggle-style : le meme
 * endpoint POST cree ou supprime le bookmark selon son etat courant, pour
 * simplifier le call cote UI (un seul bouton). Le champ `note` est optionnel
 * et purement prive.
 */
class BookmarkController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $bookmarks = QuestionBookmark::where('user_id', $user->id)
            ->with(['question.certification:id,title,slug,logo_path,default_language,translations'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (QuestionBookmark $b) {
                $q = $b->question;
                $cert = $q?->certification;
                $locale = app()->getLocale();
                $canonical = $cert?->default_language ?? 'en';
                return [
                    'id' => $b->id,
                    'question_id' => $q?->id,
                    'note' => $b->note,
                    'created_at' => $b->created_at?->toIso8601String(),
                    'question' => $q ? [
                        'id' => $q->id,
                        'topic' => $q->localized($locale, 'topic', $canonical),
                        'question_text' => $q->localized($locale, 'question_text', $canonical),
                    ] : null,
                    'certification' => $cert ? [
                        'title' => $cert->localized($locale, 'title'),
                        'slug' => $cert->slug,
                        'logo_path' => $cert->logo_path,
                    ] : null,
                ];
            })
            ->all();

        return Inertia::render('Bookmarks/Index', [
            'bookmarks' => $bookmarks,
        ]);
    }

    /**
     * Toggle : cree si absent, supprime si present. Renvoie flash.
     */
    public function toggle(Request $request, Question $question): RedirectResponse
    {
        $user = $request->user();

        $existing = QuestionBookmark::where('user_id', $user->id)
            ->where('question_id', $question->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return back()->with('success', __('flash.bookmark_removed'));
        }

        QuestionBookmark::create([
            'user_id' => $user->id,
            'question_id' => $question->id,
        ]);

        return back()->with('success', __('flash.bookmark_added'));
    }

    /**
     * Met a jour la note textuelle privee associee au bookmark.
     */
    public function updateNote(Request $request, QuestionBookmark $bookmark): RedirectResponse
    {
        abort_unless($bookmark->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'note' => 'nullable|string|max:2000',
        ]);

        $bookmark->update(['note' => $data['note'] ?? null]);

        return back()->with('success', __('flash.bookmark_note_updated'));
    }

    public function destroy(Request $request, QuestionBookmark $bookmark): RedirectResponse
    {
        abort_unless($bookmark->user_id === $request->user()->id, 403);
        $bookmark->delete();

        return back()->with('success', __('flash.bookmark_removed'));
    }
}
