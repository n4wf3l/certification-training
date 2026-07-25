<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            // Blueprint editable : { "domain-key": pourcentage } totalisant 100.
            // Utilise par ExamController pour tirer un echantillon d'examen equilibre.
            $table->json('syllabus_blueprint')->nullable()->after('course_updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn('syllabus_blueprint');
        });
    }
};
