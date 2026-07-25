<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_explanations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            // Reponse qui a genere l'explication (null = pas de reponse choisie)
            $table->foreignId('wrong_answer_id')->nullable()->constrained('answers')->nullOnDelete();
            // L'explication generee par l'IA (Markdown/text brut)
            $table->text('explanation');
            // Modele utilise (ex: "gpt-4o-mini")
            $table->string('model', 60)->nullable();
            // Nombre de tokens utilises (pour tracking cout)
            $table->unsignedInteger('tokens_used')->nullable();
            $table->timestamps();

            // Index pour cache lookup rapide
            $table->unique(['question_id', 'wrong_answer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_explanations');
    }
};
