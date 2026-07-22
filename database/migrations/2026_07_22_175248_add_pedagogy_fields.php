<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->text('explanation')->nullable()->after('question_text');
        });

        Schema::table('answers', function (Blueprint $table) {
            $table->text('rationale')->nullable()->after('answer_text');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('explanation');
        });
        Schema::table('answers', function (Blueprint $table) {
            $table->dropColumn('rationale');
        });
    }
};
