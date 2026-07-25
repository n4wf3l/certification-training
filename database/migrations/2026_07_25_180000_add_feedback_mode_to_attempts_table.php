<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            // Mode de retour choisi au demarrage :
            //   'deferred' : correction visible seulement a la fin (par defaut, comme un vrai examen)
            //   'instant'  : correction revelee apres chaque reponse (mode entrainement)
            // Ce champ est fige a la creation de l'attempt et decide de ce que renvoie take()
            // sur les answers (is_correct + explanation exposes ou non).
            $table->string('feedback_mode', 16)->default('deferred')->after('passing_score');
        });
    }

    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropColumn('feedback_mode');
        });
    }
};
