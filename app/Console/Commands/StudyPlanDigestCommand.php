<?php

namespace App\Console\Commands;

use App\Mail\StudyPlanDigestMail;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Setting;
use App\Models\StudyPlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class StudyPlanDigestCommand extends Command
{
    protected $signature = 'study-plan:digest {--dry-run}';

    protected $description = 'Envoie le digest hebdomadaire aux users avec email_weekly_digest = true';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $brandName = Setting::get('brand_name') ?: 'CertifLoop';

        $plans = StudyPlan::where('email_weekly_digest', true)
            ->whereDate('exam_date', '>', today())
            ->with('user:id,name,email', 'certification:id,title,slug')
            ->get();

        $this->info("Cible : {$plans->count()} plan(s)");

        $weekStart = now()->subDays(7);
        $sent = 0;

        foreach ($plans as $plan) {
            if (!$plan->user?->email) continue;

            $answered = AttemptAnswer::whereHas('attempt', fn ($q) => $q
                ->where('user_id', $plan->user_id)
                ->where('certification_id', $plan->certification_id)
                ->where('completed_at', '>=', $weekStart))
                ->count();

            $exams = Attempt::where('user_id', $plan->user_id)
                ->where('certification_id', $plan->certification_id)
                ->whereNotNull('completed_at')
                ->where('completed_at', '>=', $weekStart)
                ->get();

            $avg = $exams->isNotEmpty()
                ? (int) round($exams->avg(fn ($a) => $a->total_questions > 0 ? ($a->score / $a->total_questions * 100) : 0))
                : 0;

            $stats = [
                'questions_answered' => $answered,
                'exams_completed' => $exams->count(),
                'avg_score' => $avg,
            ];

            if ($dryRun) {
                $this->line("  [dry] {$plan->user->email} - {$plan->certification->title} - " . json_encode($stats));
                continue;
            }
            try {
                Mail::to($plan->user->email)->send(new StudyPlanDigestMail($plan, $stats, $brandName));
                $sent++;
                $this->line("  envoye a {$plan->user->email}");
            } catch (\Throwable $e) {
                $this->error("  echec pour {$plan->user->email} : {$e->getMessage()}");
            }
        }

        $this->info($dryRun ? "Dry-run termine." : "{$sent} email(s) envoye(s).");
        return self::SUCCESS;
    }
}
