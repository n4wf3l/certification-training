<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table user <-> question pour les favoris "a revoir plus tard" hors examen.
 * Un user peut bookmarker une question depuis la page de resultat d'un examen
 * ou depuis la page dediee /bookmarks. Contrainte unique pour eviter les doublons.
 *
 * `note` optionnel = texte libre personnel de l'user sur la question, purement
 * prive. Sert de "post-it" pour rappels type "revoir cette formule d'OSPF" ou
 * "explication ITIL contre-intuitive".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'question_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_bookmarks');
    }
};
