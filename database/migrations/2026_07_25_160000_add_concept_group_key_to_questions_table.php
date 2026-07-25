<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Identifie un groupe de variantes pédagogiques (ex: "guiding-principle-focus-on-value").
            // Les variantes d'un même concept peuvent être tirées séparément en entraînement,
            // mais au maximum une par examen blanc.
            $table->string('concept_group_key')->nullable()->after('topic')->index();
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex(['concept_group_key']);
            $table->dropColumn('concept_group_key');
        });
    }
};
