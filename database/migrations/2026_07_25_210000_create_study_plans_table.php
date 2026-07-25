<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('certification_id')->constrained()->cascadeOnDelete();
            // Date de l'examen reel vise par l'utilisateur
            $table->date('exam_date');
            // Nombre cible de questions par jour (calcule ou personnalise)
            $table->unsignedInteger('daily_target')->default(20);
            // Focus par jour de la semaine : { "monday": "guiding-principles", "wednesday": "practices", "saturday": "exam" }
            $table->json('weekday_focus')->nullable();
            // Preferences de notification
            $table->boolean('email_daily_reminder')->default(true);
            $table->boolean('email_weekly_digest')->default(true);
            $table->timestamps();

            // Un user n'a qu'un plan actif par certif
            $table->unique(['user_id', 'certification_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_plans');
    }
};
