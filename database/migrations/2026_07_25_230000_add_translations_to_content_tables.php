<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Phase 1 multilingue : ajouter un buffer JSON `translations` sur les tables
        // de contenu pour stocker les traductions vers les langues NON canoniques.
        // Les colonnes directes (question_text, answer_text, etc.) restent la source
        // de verite pour la langue "default_language" de chaque certif (fr aujourd'hui
        // pour ITIL, en pour les nouvelles certifs).

        Schema::table('certifications', function (Blueprint $table) {
            // Langue des colonnes directes (title/description/importance/...) de cette certif.
            // Existante = fr (contenu actuel), nouvelles = en par defaut cote controller.
            $table->string('default_language', 5)->default('en')->after('available_languages');
            // Traductions non canoniques : { "en": {"title": "...", "description": "..."}, ... }
            $table->json('translations')->nullable()->after('default_language');
        });

        Schema::table('questions', function (Blueprint $table) {
            // { "en": {"topic": "...", "scenario": "...", "question_text": "...", "explanation": "..."}, "de": {...} }
            $table->json('translations')->nullable()->after('explanation');
        });

        Schema::table('answers', function (Blueprint $table) {
            // { "en": {"answer_text": "...", "rationale": "..."}, "de": {...} }
            $table->json('translations')->nullable()->after('rationale');
        });

        Schema::table('attempts', function (Blueprint $table) {
            // Locale figee au demarrage de la tentative. Toutes les vues (Take, Result,
            // AttemptAnswer replays) rendent dans cette locale, meme si l'user change
            // sa preference apres coup. null = utiliser la default_language de la certif.
            $table->string('locale', 5)->nullable()->after('completed_at');
        });

        // Backfill : les 4 certifs existantes sont en francais dans leurs colonnes directes.
        \DB::table('certifications')->update(['default_language' => 'fr']);
    }

    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropColumn('locale');
        });
        Schema::table('answers', function (Blueprint $table) {
            $table->dropColumn('translations');
        });
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('translations');
        });
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn(['translations', 'default_language']);
        });
    }
};
