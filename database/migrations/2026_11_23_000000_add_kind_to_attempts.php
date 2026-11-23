<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Type de session : null = examen blanc ou session ciblee (practice_domain),
// 'sprint' = 10 questions d'entrainement avec correction immediate.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->string('kind', 20)->nullable()->after('practice_domain');
        });
    }

    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
    }
};
