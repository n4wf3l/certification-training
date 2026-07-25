<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->unique()->constrained()->cascadeOnDelete();
            // Cumul de tentatives (chaque fois qu'une question apparait dans un attempt complete)
            $table->unsignedInteger('total_seen')->default(0);
            // Cumul de bonnes reponses (is_correct = true)
            $table->unsignedInteger('correct_count')->default(0);
            // Distribution des reponses choisies : { "answer_id": count, ... }
            // Permet d'afficher "42% ont choisi B au lieu de C"
            $table->json('answer_distribution')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_stats');
    }
};
