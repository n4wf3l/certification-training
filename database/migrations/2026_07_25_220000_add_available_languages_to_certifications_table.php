<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            // Liste des codes ISO 639-1 des langues dans lesquelles la certif est
            // disponible sur la plateforme. Le prompt ChatGPT s'y adapte et l'admin
            // choisit dans l'UI d'import la langue du batch a generer.
            $table->json('available_languages')->nullable()->after('is_active');
        });

        // Backfill : tout l'existant est en francais tant que l'admin n'a pas revisite.
        DB::table('certifications')->update([
            'available_languages' => json_encode(['fr']),
        ]);
    }

    public function down(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn('available_languages');
        });
    }
};
