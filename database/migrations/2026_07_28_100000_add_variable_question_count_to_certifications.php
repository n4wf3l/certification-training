<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Variable exam size : Cisco et d'autres certifs ne publient pas un count
 * fixe. Chaque tentative tire un nombre entre min et max, ce qui matche
 * la realite du vrai examen (candidats ne savent jamais combien ils auront).
 * Null sur les 2 -> comportement legacy avec le fixe `total_questions`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->unsignedSmallInteger('min_questions')->nullable()->after('total_questions');
            $table->unsignedSmallInteger('max_questions')->nullable()->after('min_questions');
        });
    }

    public function down(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn(['min_questions', 'max_questions']);
        });
    }
};
