<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBadge extends Model
{
    protected $fillable = [
        'user_id',
        'badge_key',
        'certification_id',
        'meta',
        'earned_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'earned_at' => 'datetime',
    ];

    /**
     * Catalogue de badges disponibles avec leur libelle FR et icone.
     * Non stocke en base : bougable via config, uniquement lu au rendu.
     */
    public const CATALOG = [
        'streak_7' => ['label' => 'Semaine active', 'description' => '7 jours consecutifs de pratique', 'icon' => 'flame'],
        'streak_30' => ['label' => 'Mois de feu', 'description' => '30 jours consecutifs', 'icon' => 'flame'],
        'streak_100' => ['label' => 'Centurion', 'description' => '100 jours consecutifs', 'icon' => 'flame'],
        'xp_500' => ['label' => 'Apprenti', 'description' => '500 XP cumules', 'icon' => 'sparkles'],
        'xp_2000' => ['label' => 'Confirme', 'description' => '2 000 XP cumules', 'icon' => 'sparkles'],
        'xp_10000' => ['label' => 'Expert', 'description' => '10 000 XP cumules', 'icon' => 'trophy'],
        'first_pass' => ['label' => 'Premier examen valide', 'description' => 'Ton premier examen blanc reussi', 'icon' => 'check'],
        'perfect_exam' => ['label' => 'Sans-faute', 'description' => 'Un examen blanc a 100%', 'icon' => 'trophy'],
        'master_cert' => ['label' => 'Maitre de la certif', 'description' => '90% de maitrise sur le pool', 'icon' => 'shield'],
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }
}
