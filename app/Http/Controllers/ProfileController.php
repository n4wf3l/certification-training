<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\StudyPlan;
use App\Models\UserBadge;
use App\Models\UserCertificate;
use App\Models\UserQuestionStat;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * RGPD Article 20 - Right to data portability. Returns a JSON file
     * containing every piece of personal data the platform holds about the
     * authenticated user, in a structured/machine-readable format.
     *
     * Includes : account meta, exam attempts + answers, per-question stats,
     * awarded certificates, badges, study plans. Excludes derived aggregates
     * (they can be recomputed) and admin-only fields.
     */
    public function exportData(Request $request): StreamedResponse
    {
        $user = $request->user();

        $attempts = Attempt::where('user_id', $user->id)
            ->orderBy('started_at')
            ->get()
            ->map(fn (Attempt $a) => [
                'id' => $a->id,
                'certification_id' => $a->certification_id,
                'started_at' => $a->started_at?->toIso8601String(),
                'completed_at' => $a->completed_at?->toIso8601String(),
                'abandoned_at' => $a->abandoned_at?->toIso8601String(),
                'score' => $a->score,
                'total_questions' => $a->total_questions,
                'passing_score' => $a->passing_score,
                'passed' => $a->passed,
                'duration_seconds' => $a->duration_seconds,
                'feedback_mode' => $a->feedback_mode,
                'practice_domain' => $a->practice_domain,
                'locale' => $a->locale,
            ])->all();

        $answers = AttemptAnswer::whereIn('attempt_id', Attempt::where('user_id', $user->id)->pluck('id'))
            ->orderBy('attempt_id')
            ->orderBy('position')
            ->get(['attempt_id', 'question_id', 'answer_id', 'is_correct', 'position'])
            ->toArray();

        $stats = UserQuestionStat::where('user_id', $user->id)
            ->get()
            ->map(fn ($s) => [
                'question_id' => $s->question_id,
                'times_seen' => $s->times_seen,
                'times_correct' => $s->times_correct,
                'times_wrong' => $s->times_wrong,
                'correct_streak' => $s->correct_streak,
                'last_result' => $s->last_result,
                'last_seen_at' => $s->last_seen_at?->toIso8601String(),
            ])->all();

        $certificates = UserCertificate::where('user_id', $user->id)
            ->get()
            ->map(fn ($c) => [
                'certification_id' => $c->certification_id,
                'token' => $c->token,
                'best_score' => $c->best_score,
                'total_questions' => $c->total_questions,
                'mastery_pct' => $c->mastery_pct,
                'awarded_at' => $c->awarded_at?->toIso8601String(),
            ])->all();

        $badges = UserBadge::where('user_id', $user->id)
            ->get(['badge_key', 'certification_id', 'meta', 'earned_at'])
            ->toArray();

        $plans = StudyPlan::where('user_id', $user->id)
            ->get(['certification_id', 'exam_date', 'daily_target', 'weekday_focus', 'email_daily_reminder', 'email_weekly_digest', 'created_at'])
            ->toArray();

        $payload = [
            'export_meta' => [
                'exported_at' => now()->toIso8601String(),
                'format_version' => 1,
                'rgpd_article' => 20,
                'platform' => config('app.name', 'CertifLoop'),
            ],
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'preferred_locale' => $user->preferred_locale,
                'total_xp' => $user->total_xp,
                'current_streak' => $user->current_streak,
                'longest_streak' => $user->longest_streak,
                'last_activity_date' => $user->last_activity_date?->toIso8601String(),
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'attempts' => $attempts,
            'attempt_answers' => $answers,
            'question_stats' => $stats,
            'certificates' => $certificates,
            'badges' => $badges,
            'study_plans' => $plans,
        ];

        $filename = sprintf('certifloop-data-export-%s-%s.json', $user->id, now()->format('Y-m-d'));
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        return response()->streamDownload(
            fn () => print($json),
            $filename,
            ['Content-Type' => 'application/json; charset=utf-8']
        );
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
