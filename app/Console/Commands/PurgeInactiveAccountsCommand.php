<?php

namespace App\Console\Commands;

use App\Mail\InactiveAccountWarningMail;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * CertifLoop sert a passer des examens blancs, pas a stocker des comptes dormants.
 *
 *  - J+53 sans visite : email de prevenance (une seule fois).
 *  - J+60 sans visite : le compte et toutes ses donnees sont supprimes
 *    (tentatives, stats, favoris, plans, certificats : cascade en base).
 *
 * Les admins ne sont jamais supprimes. Une visite connectee remet le compteur a zero
 * (middleware TouchLastSeen).
 */
class PurgeInactiveAccountsCommand extends Command
{
    public const INACTIVE_DAYS = 60;

    public const WARNING_DAYS_BEFORE = 7;

    protected $signature = 'accounts:purge-inactive
                            {--dry-run : Lister sans envoyer ni supprimer}';

    protected $description = 'Previent puis supprime les comptes sans visite depuis 60 jours';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $brandName = Setting::get('brand_name') ?: 'CertifLoop';

        // 1. Suppression : aucune visite depuis 60 jours.
        $deleteBefore = now()->subDays(self::INACTIVE_DAYS);
        $toDelete = $this->inactiveSince($deleteBefore)->get();
        foreach ($toDelete as $user) {
            if ($dryRun) {
                $this->line("  [dry] suppression #{$user->id}");
                continue;
            }
            DB::transaction(function () use ($user) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
                $user->delete();
            });
        }
        $this->info(($dryRun ? '[dry] ' : '')."Comptes supprimes : {$toDelete->count()}");

        // 2. Prevenance : 7 jours avant la suppression, une seule fois.
        $warnBefore = now()->subDays(self::INACTIVE_DAYS - self::WARNING_DAYS_BEFORE);
        $toWarn = $this->inactiveSince($warnBefore)->whereNull('inactivity_warned_at')->get();
        $warned = 0;
        foreach ($toWarn as $user) {
            if ($dryRun) {
                $this->line("  [dry] prevenance #{$user->id}");
                continue;
            }
            try {
                Mail::to($user->email)
                    ->locale($user->preferred_locale ?: config('app.fallback_locale', 'en'))
                    ->send(new InactiveAccountWarningMail($user, $brandName, self::WARNING_DAYS_BEFORE));
                $user->forceFill(['inactivity_warned_at' => now()])->saveQuietly();
                $warned++;
            } catch (\Throwable $e) {
                // Pas d'email = pas de prevenance enregistree : on reessaie demain.
                $this->error("  echec de l'email pour #{$user->id} : {$e->getMessage()}");
            }
        }
        $this->info(($dryRun ? '[dry] ' : '')."Comptes prevenus : ".($dryRun ? $toWarn->count() : $warned));

        return self::SUCCESS;
    }

    private function inactiveSince(\DateTimeInterface $before)
    {
        return User::where('role', '!=', 'admin')
            ->where(function ($q) use ($before) {
                $q->where('last_seen_at', '<', $before)
                    ->orWhere(fn ($q) => $q->whereNull('last_seen_at')->where('created_at', '<', $before));
            });
    }
}
