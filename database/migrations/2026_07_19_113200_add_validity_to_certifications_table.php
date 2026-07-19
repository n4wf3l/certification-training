<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->unsignedSmallInteger('validity_months')->nullable()->after('total_questions');
            $table->text('validity_note')->nullable()->after('validity_months');
        });
    }

    public function down(): void
    {
        Schema::table('certifications', function (Blueprint $table) {
            $table->dropColumn(['validity_months', 'validity_note']);
        });
    }
};
