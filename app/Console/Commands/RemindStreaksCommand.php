<?php

namespace App\Console\Commands;

use App\Mail\StreakAtRiskMail;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class RemindStreaksCommand extends Command
{
    protected $signature = 'streaks:remind
                            {--min-streak=3 : Streak minimum pour envoyer un rappel}
                            {--dry-run : Ne pas envoyer les emails, juste lister les destinataires}';

    protected $description = 'Envoie un email aux users dont le streak est menace (pas d\'activite aujourd\'hui, mais actif hier)';

    public function handle(): int
    {
        $minStreak = (int) $this->option('min-streak');
        $dryRun = (bool) $this->option('dry-run');
        $brandName = Setting::get('brand_name') ?: 'CertifLoop';

        // Cible : users dont last_activity_date = hier (streak vivant mais menace)
        // et current_streak >= min-streak (evite le spam quand le streak est trivial)
        $yesterday = today()->subDay();
        $users = User::whereDate('last_activity_date', $yesterday)
            ->where('current_streak', '>=', $minStreak)
            ->whereNotNull('email')
            ->get();

        $this->info("Cible : {$users->count()} user(s) avec streak >= {$minStreak} et derniere activite = {$yesterday->toDateString()}");

        if ($users->isEmpty()) {
            $this->line('Aucun user a rappeler aujourd\'hui.');
            return self::SUCCESS;
        }

        $sent = 0;
        foreach ($users as $user) {
            if ($dryRun) {
                $this->line("  [dry] {$user->email} (streak {$user->current_streak})");
                continue;
            }
            try {
                Mail::to($user->email)
                    ->locale($user->preferred_locale ?: config('app.fallback_locale', 'en'))
                    ->send(new StreakAtRiskMail($user, $brandName));
                $sent++;
                $this->line("  envoye a {$user->email} (streak {$user->current_streak})");
            } catch (\Throwable $e) {
                $this->error("  echec pour {$user->email} : {$e->getMessage()}");
            }
        }

        $this->info($dryRun ? "Dry-run termine." : "{$sent} email(s) envoye(s).");
        return self::SUCCESS;
    }
}
