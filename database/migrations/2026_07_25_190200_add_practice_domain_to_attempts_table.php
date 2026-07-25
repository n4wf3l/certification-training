<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            // Si non-null : cette tentative est un mode "practice cible" sur un seul
            // domaine du syllabus (ex: "practices", "guiding-principles"). Le picker
            // filtre exclusivement dans ce domaine et ignore le blueprint global.
            $table->string('practice_domain', 60)->nullable()->after('feedback_mode')->index();
        });
    }

    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropIndex(['practice_domain']);
            $table->dropColumn('practice_domain');
        });
    }
};
