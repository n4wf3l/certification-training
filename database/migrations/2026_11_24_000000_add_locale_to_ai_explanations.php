<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Une explication IA par langue : un utilisateur anglophone ne doit pas
// recevoir l'explication mise en cache pour un francophone.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_explanations', function (Blueprint $table) {
            $table->string('locale', 5)->nullable()->after('wrong_answer_id');
        });
        // Les explications existantes ont ete ecrites en francais.
        DB::table('ai_explanations')->whereNull('locale')->update(['locale' => 'fr']);
        Schema::table('ai_explanations', function (Blueprint $table) {
            $table->dropUnique(['question_id', 'wrong_answer_id']);
            $table->unique(['question_id', 'wrong_answer_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::table('ai_explanations', function (Blueprint $table) {
            $table->dropUnique(['question_id', 'wrong_answer_id', 'locale']);
            $table->unique(['question_id', 'wrong_answer_id']);
        });
        Schema::table('ai_explanations', function (Blueprint $table) {
            $table->dropColumn('locale');
        });
    }
};
