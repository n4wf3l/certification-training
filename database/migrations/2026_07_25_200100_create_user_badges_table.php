<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Cle du badge (ex: 'streak_7', 'xp_500', 'master_cert', 'perfect_exam')
            $table->string('badge_key', 50);
            // Contexte optionnel (ex: certification_id pour master_cert)
            $table->foreignId('certification_id')->nullable()->constrained()->cascadeOnDelete();
            // Payload libre : {"score": 40, "attempt_id": 123}
            $table->json('meta')->nullable();
            $table->timestamp('earned_at');
            $table->timestamps();

            // Un user ne peut gagner qu'une fois un badge pour un meme contexte
            // (streak_7 : une seule fois, master_cert : une fois par cert)
            $table->unique(['user_id', 'badge_key', 'certification_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
    }
};
