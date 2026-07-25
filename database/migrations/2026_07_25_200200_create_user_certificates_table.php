<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('certification_id')->constrained()->cascadeOnDelete();
            // Token public URL-safe pour partage (32 chars). Sert d'ID stable dans /certificate/{token}
            $table->string('token', 64)->unique();
            // Score meilleur / moyen atteint (pour affichage)
            $table->unsignedInteger('best_score')->default(0);
            $table->unsignedInteger('total_questions')->default(0);
            $table->unsignedTinyInteger('mastery_pct')->default(0);
            $table->timestamp('awarded_at');
            $table->timestamps();

            // Un user ne recoit qu'un seul certificat par certification
            $table->unique(['user_id', 'certification_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_certificates');
    }
};
