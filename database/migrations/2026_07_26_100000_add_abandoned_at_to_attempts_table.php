<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Track explicit and best-effort implicit mid-exam abandonments.
 *
 * An attempt with `abandoned_at` set is dead: cannot be resumed, does not
 * appear in the completed history, and consumes 1 unit of "quit budget"
 * in the CertifLoop certificate streak (2nd quit resets the streak).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->timestamp('abandoned_at')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropColumn('abandoned_at');
        });
    }
};
