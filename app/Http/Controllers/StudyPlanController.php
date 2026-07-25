<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Certification;
use App\Models\StudyPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class StudyPlanController extends Controller
{
    public function index(): InertiaResponse
    {
        $plans = StudyPlan::where('user_id', auth()->id())
            ->with('certification:id,title,slug,logo_path')
            ->get()
            ->map(fn (StudyPlan $p) => [
                'id' => $p->id,
                'exam_date' => $p->exam_date?->toDateString(),
                'days_until_exam' => $p->daysUntilExam(),
                'daily_target' => $p->daily_target,
                'weekday_focus' => $p->weekday_focus,
                'today_focus' => $p->todayFocus(),
                'email_daily_reminder' => $p->email_daily_reminder,
                'email_weekly_digest' => $p->email_weekly_digest,
                'certification' => $p->certification ? [
                    'id' => $p->certification->id,
                    'title' => $p->certification->title,
                    'slug' => $p->certification->slug,
                    'logo_path' => $p->certification->logo_path,
                ] : null,
            ]);

        return Inertia::render('StudyPlan/Index', [
            'plans' => $plans,
            'available_certifications' => Certification::where('is_active', true)
                ->orderBy('title')
                ->get(['id', 'title', 'slug', 'logo_path']),
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('StudyPlan/Create', [
            'certifications' => Certification::where('is_active', true)
                ->orderBy('title')
                ->get(['id', 'title', 'slug', 'logo_path']),
            'existing_plan_cert_ids' => StudyPlan::where('user_id', auth()->id())->pluck('certification_id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'exam_date' => 'required|date|after:today',
            'daily_target' => 'required|integer|min:1|max:200',
            'weekday_focus' => 'nullable|array',
            'weekday_focus.*' => 'nullable|string|max:60',
            'email_daily_reminder' => 'boolean',
            'email_weekly_digest' => 'boolean',
        ]);

        // Un seul plan actif par (user, cert)
        $existing = StudyPlan::where('user_id', auth()->id())
            ->where('certification_id', $data['certification_id'])
            ->exists();
        if ($existing) {
            return back()->withErrors(['certification_id' => "Tu as deja un plan pour cette certification. Supprime l'ancien avant d'en creer un nouveau."]);
        }

        $plan = StudyPlan::create([
            'user_id' => auth()->id(),
            'certification_id' => $data['certification_id'],
            'exam_date' => $data['exam_date'],
            'daily_target' => $data['daily_target'],
            'weekday_focus' => $data['weekday_focus'] ?? null,
            'email_daily_reminder' => $data['email_daily_reminder'] ?? true,
            'email_weekly_digest' => $data['email_weekly_digest'] ?? true,
        ]);

        return redirect()->route('study-plans.show', $plan)->with('success', __('flash.study_plan_created'));
    }

    public function show(StudyPlan $studyPlan): InertiaResponse
    {
        abort_unless($studyPlan->user_id === auth()->id(), 403);
        $studyPlan->load('certification');

        // Questions repondues aujourd'hui (via attempt_answers rattaches a un attempt de ce user)
        $today = today();
        $answeredToday = AttemptAnswer::query()
            ->whereHas('attempt', fn ($q) => $q->where('user_id', auth()->id())
                ->where('certification_id', $studyPlan->certification_id)
                ->whereBetween('completed_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()]))
            ->count();

        // Attempts sur les 30 derniers jours pour graphe simple d'assiduite
        $recentAttempts = Attempt::where('user_id', auth()->id())
            ->where('certification_id', $studyPlan->certification_id)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subDays(30))
            ->orderBy('completed_at')
            ->get(['id', 'score', 'total_questions', 'passed', 'completed_at']);

        return Inertia::render('StudyPlan/Show', [
            'plan' => [
                'id' => $studyPlan->id,
                'exam_date' => $studyPlan->exam_date?->toDateString(),
                'days_until_exam' => $studyPlan->daysUntilExam(),
                'daily_target' => $studyPlan->daily_target,
                'weekday_focus' => $studyPlan->weekday_focus,
                'today_focus' => $studyPlan->todayFocus(),
                'email_daily_reminder' => $studyPlan->email_daily_reminder,
                'email_weekly_digest' => $studyPlan->email_weekly_digest,
                'certification' => [
                    'id' => $studyPlan->certification->id,
                    'title' => $studyPlan->certification->title,
                    'slug' => $studyPlan->certification->slug,
                    'logo_path' => $studyPlan->certification->logo_path,
                ],
                'ics_url' => route('study-plans.ics', $studyPlan),
            ],
            'progress' => [
                'answered_today' => $answeredToday,
                'target_today' => $studyPlan->daily_target,
                'pct' => $studyPlan->daily_target > 0 ? min(100, (int) round($answeredToday / $studyPlan->daily_target * 100)) : 0,
                'recent_attempts' => $recentAttempts,
            ],
        ]);
    }

    public function destroy(StudyPlan $studyPlan): RedirectResponse
    {
        abort_unless($studyPlan->user_id === auth()->id(), 403);
        $studyPlan->delete();
        return redirect()->route('study-plans.index')->with('success', __('flash.study_plan_deleted'));
    }

    /**
     * Genere un fichier .ics importable dans Google Calendar, Apple Calendar, Outlook, etc.
     * Cree un event unique le jour de l'examen + un event recurrent quotidien (rappel de revision).
     */
    public function ics(StudyPlan $studyPlan): Response
    {
        abort_unless($studyPlan->user_id === auth()->id(), 403);
        $studyPlan->load('certification');

        $now = now()->format('Ymd\THis\Z');
        $examDate = $studyPlan->exam_date->format('Ymd');
        $certTitle = str_replace(',', '\,', $studyPlan->certification->title);
        $dailyTarget = $studyPlan->daily_target;

        // UID stables pour permettre le refresh des events sans doublons
        $uidExam = "studyplan-{$studyPlan->id}-exam@certifloop";
        $uidDaily = "studyplan-{$studyPlan->id}-daily@certifloop";

        // Recurrence : quotidienne jusqu'a la veille de l'examen
        $rruleUntil = $studyPlan->exam_date->copy()->subDay()->format('Ymd\T235959\Z');

        $ics = implode("\r\n", [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CertifLoop//StudyPlan//FR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',

            // Event unique : jour J de l'examen
            'BEGIN:VEVENT',
            "UID:{$uidExam}",
            "DTSTAMP:{$now}",
            "DTSTART;VALUE=DATE:{$examDate}",
            "SUMMARY:Examen {$certTitle}",
            "DESCRIPTION:Jour J de ton examen {$certTitle}. Bonne chance !",
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            "DESCRIPTION:Examen {$certTitle} demain",
            'END:VALARM',
            'END:VEVENT',

            // Event recurrent quotidien : session de revision
            'BEGIN:VEVENT',
            "UID:{$uidDaily}",
            "DTSTAMP:{$now}",
            'DTSTART:' . now()->format('Ymd\T193000\Z'),
            'DTEND:' . now()->format('Ymd\T200000\Z'),
            "SUMMARY:Revision {$certTitle} ({$dailyTarget} questions)",
            "DESCRIPTION:Objectif du jour : {$dailyTarget} questions sur CertifLoop pour maintenir ton rythme.",
            "RRULE:FREQ=DAILY;UNTIL={$rruleUntil}",
            'END:VEVENT',

            'END:VCALENDAR',
            '',
        ]);

        $filename = sprintf('certifloop-plan-%s.ics', $studyPlan->certification->slug);

        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
