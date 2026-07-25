<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rappel quotidien pour les streaks a risque : 19h (heure locale du serveur)
Schedule::command('streaks:remind')->dailyAt('19:00');

// Rappel plan de revision si skip 2 jours : quotidien 19h15
Schedule::command('study-plan:remind')->dailyAt('19:15');

// Digest hebdomadaire des plans : lundi matin 8h
Schedule::command('study-plan:digest')->weeklyOn(1, '08:00');
