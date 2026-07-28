<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Navigation mode per certification :
 *   free               : nav libre, retour arriere possible, grille visible (defaut, ITIL-like)
 *   sequential_locked  : pas de retour, pas de grille, skip autorise (CCNA-like)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->string('navigation_mode', 32)->default('free')->after('max_questions');
        });
    }

    public function down(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn('navigation_mode');
        });
    }
};
