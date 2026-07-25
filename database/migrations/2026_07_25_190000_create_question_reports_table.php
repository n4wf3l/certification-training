<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Categorie : wrong_answer | contradictory_rationale | outdated | unclear | typo | other
            $table->string('category', 40);
            // Message libre optionnel de l'utilisateur (max 1000 char)
            $table->text('message')->nullable();
            // Contexte : quelle reponse avait choisi l'user (peut aider a diagnostiquer)
            $table->foreignId('chosen_answer_id')->nullable()->constrained('answers')->nullOnDelete();
            $table->foreignId('attempt_id')->nullable()->constrained('attempts')->nullOnDelete();
            // Statut de traitement admin : pending | reviewed | resolved | dismissed
            $table->string('status', 20)->default('pending')->index();
            // Note interne de l'admin (visible seulement en admin)
            $table->text('admin_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_reports');
    }
};
