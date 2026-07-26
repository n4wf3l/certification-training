<?php

namespace App\Console\Commands;

use App\Mail\StudyPlanReminderMail;
use App\Models\Setting;
use App\Models\StudyPlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class StudyPlanRemindCommand extends Command
{
    protected $signature = 'study-plan:remind
                            {--min-skip=2 : Nombre de jours sans activite requis}
                            {--dry-run : Ne pas envoyer les emails}';

    protected $description = 'Envoie un email aux users dont le plan est inactif depuis N jours';

    public function handle(): int
    {
        $minSkip = (int) $this->option('min-skip');
        $dryRun = (bool) $this->option('dry-run');
        $brandName = Setting::get('brand_name') ?: 'CertifLoop';

        // Cible : plans avec email_daily_reminder = true
        //         + user dont last_activity_date est plus vieille que minSkip jours (ou null)
        //         + exam_date pas encore passee
        $threshold = today()->subDays($minSkip);

        $plans = StudyPlan::where('email_daily_reminder', true)
            ->whereDate('exam_date', '>', today())
            ->whereHas('user', function ($q) use ($threshold) {
                $q->where(function ($sub) use ($threshold) {
                    $sub->whereNull('last_activity_date')
                        ->orWhereDate('last_activity_date', '<=', $threshold);
                })->whereNotNull('email');
            })
            ->with('user', 'certification')
            ->get();

        $this->info("Cible : {$plans->count()} plan(s) inactifs depuis >= {$minSkip}j");

        $sent = 0;
        foreach ($plans as $plan) {
            $lastActive = $plan->user->last_activity_date;
            $daysSince = $lastActive ? (int) $lastActive->diffInDays(today()) : 999;

            if ($dryRun) {
                $this->line("  [dry] {$plan->user->email} - {$plan->certification->title} ({$daysSince}j sans activite)");
                continue;
            }
            try {
                Mail::to($plan->user->email)
                    ->locale($plan->user->preferred_locale ?: config('app.fallback_locale', 'en'))
                    ->send(new StudyPlanReminderMail($plan, $daysSince, $brandName));
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
