<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $fillable = [
        'certification_id',
        'position',
        'topic',
        'scenario',
        'question_text',
    ];

    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class)->orderBy('letter');
    }

    public function correctAnswer(): ?Answer
    {
        return $this->answers()->where('is_correct', true)->first();
    }
}
