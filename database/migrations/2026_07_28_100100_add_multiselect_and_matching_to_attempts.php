<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * - answer_ids  : JSON array pour multi-select (aussi utilise pour single par
 *                 uniformite : {[id]} pour 1 correcte, {[id1,id2]} pour 2+).
 * - matching_answer : JSON map { leftKey: rightKey, ... } pour drag-and-drop.
 * - question_type : enum question level (multiple_choice, matching), inference
 *                    par defaut si null -> multiple_choice.
 * - matching_pairs : JSON [{ left, right }] pour le rendu et le scoring des
 *                     questions de type matching.
 *
 * Backfill : chaque attempt_answers.answer_id existant -> answer_ids = [id].
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('question_type', 32)->default('multiple_choice')->after('explanation');
            $table->json('matching_pairs')->nullable()->after('question_type');
        });

        Schema::table('attempt_answers', function (Blueprint $table) {
            $table->json('answer_ids')->nullable()->after('answer_id');
            $table->json('matching_answer')->nullable()->after('answer_ids');
        });

        // Backfill : convertit answer_id (scalar) en answer_ids [id] pour toutes
        // les tentatives existantes, garantit la retro-compat au scoring.
        DB::table('attempt_answers')
            ->whereNotNull('answer_id')
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                foreach ($rows as $r) {
                    DB::table('attempt_answers')
                        ->where('id', $r->id)
                        ->update(['answer_ids' => json_encode([(int) $r->answer_id])]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn(['question_type', 'matching_pairs']);
        });
        Schema::table('attempt_answers', function (Blueprint $table) {
            $table->dropColumn(['answer_ids', 'matching_answer']);
        });
    }
};
