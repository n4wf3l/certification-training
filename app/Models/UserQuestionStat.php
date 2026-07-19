<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserQuestionStat extends Model
{
    protected $fillable = [
        'user_id',
        'question_id',
        'times_seen',
        'times_correct',
        'times_wrong',
        'correct_streak',
        'last_result',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    /**
     * Poids pour la sélection pondérée : + élevé = + prioritaire à revoir.
     *  jamais vue = 8
     *  ratée à la dernière tentative = 20 + times_wrong
     *  1 bonne réponse (streak = 1) = 4
     *  maîtrisée (streak >= 2) = 1
     */
    public static function computeWeight(?self $stat): float
    {
        if ($stat === null) {
            return 8.0;
        }
        if ($stat->last_result === 'wrong') {
            return 20.0 + min($stat->times_wrong, 20);
        }
        if ($stat->correct_streak >= 2) {
            return 1.0;
        }
        return 4.0; // 1 bonne réponse mais pas encore maîtrisée
    }
}
