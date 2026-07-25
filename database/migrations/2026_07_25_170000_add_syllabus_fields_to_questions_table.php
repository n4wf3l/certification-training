<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Domaine du syllabus (slug court, ex: "guiding-principles", "practices").
            // Utilise par le picker weighted pour respecter les proportions du blueprint.
            $table->string('syllabus_domain')->nullable()->after('concept_group_key')->index();

            // Objectif d'apprentissage precis (ex: "Explain the purpose of the guiding principle 'focus on value'").
            // Optionnel, alimente pour tracabilite pedagogique.
            $table->string('learning_objective', 500)->nullable()->after('syllabus_domain');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex(['syllabus_domain']);
            $table->dropColumn(['syllabus_domain', 'learning_objective']);
        });
    }
};
