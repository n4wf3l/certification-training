<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Locale UI preferee par l'user (2 lettres ISO 639-1). null = utiliser
            // la detection auto (cookie -> Accept-Language -> DEFAULT_LOCALE).
            $table->string('preferred_locale', 5)->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('preferred_locale');
        });
    }
};
