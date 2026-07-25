<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UserCertificate extends Model
{
    protected $fillable = [
        'user_id',
        'certification_id',
        'token',
        'best_score',
        'total_questions',
        'mastery_pct',
        'awarded_at',
    ];

    protected $casts = [
        'awarded_at' => 'datetime',
        'best_score' => 'integer',
        'total_questions' => 'integer',
        'mastery_pct' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (UserCertificate $c) {
            if (empty($c->token)) {
                $c->token = Str::random(40);
            }
            if (empty($c->awarded_at)) {
                $c->awarded_at = now();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }
}
