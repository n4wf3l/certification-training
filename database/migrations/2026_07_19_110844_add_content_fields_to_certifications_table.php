<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->text('long_description')->nullable()->after('description');
            $table->text('importance')->nullable()->after('long_description');
            $table->json('target_roles')->nullable()->after('importance');
            $table->timestamp('questions_updated_at')->nullable()->after('target_roles');
        });
    }

    public function down(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn(['long_description', 'importance', 'target_roles', 'questions_updated_at']);
        });
    }
};
