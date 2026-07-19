<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attempt_answers', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0)->after('question_id');
            $table->index(['attempt_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::table('attempt_answers', function (Blueprint $table) {
            $table->dropIndex(['attempt_id', 'position']);
            $table->dropColumn('position');
        });
    }
};
