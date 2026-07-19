<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->json('course_blocks')->nullable()->after('long_description');
            $table->timestamp('course_updated_at')->nullable()->after('course_blocks');
        });
    }

    public function down(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn(['course_blocks', 'course_updated_at']);
        });
    }
};
