<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Vie privee et retention :
 *   - users.last_seen_at / inactivity_warned_at pour supprimer les comptes inactifs
 *     depuis 60 jours (accounts:purge-inactive). Les comptes existants repartent de
 *     zero au deploiement : personne n'est supprime sans avoir ete prevenu.
 *   - efface les IP et user-agents deja stockes dans la table sessions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamp('inactivity_warned_at')->nullable();
        });

        DB::table('users')->update(['last_seen_at' => now()]);

        if (Schema::hasTable('sessions')) {
            DB::table('sessions')->update(['ip_address' => null, 'user_agent' => null]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['last_seen_at']);
            $table->dropColumn(['last_seen_at', 'inactivity_warned_at']);
        });
    }
};
