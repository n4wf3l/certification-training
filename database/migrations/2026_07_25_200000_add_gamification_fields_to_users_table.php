<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Streak quotidien : nombre de jours consecutifs avec au moins une reponse correcte
            $table->unsignedInteger('current_streak')->default(0);
            $table->unsignedInteger('longest_streak')->default(0);
            // Derniere date d'activite (utilise pour calculer si le streak est brise/vivant)
            $table->date('last_activity_date')->nullable();
            // Total d'experience cumulee (points gagnes par les bonnes reponses, examens reussis, streaks)
            $table->unsignedInteger('total_xp')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['current_streak', 'longest_streak', 'last_activity_date', 'total_xp']);
        });
    }
};
