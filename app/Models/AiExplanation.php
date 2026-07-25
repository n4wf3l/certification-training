<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiExplanation extends Model
{
    protected $fillable = [
        'question_id',
        'wrong_answer_id',
        'explanation',
        'model',
        'tokens_used',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function wrongAnswer(): BelongsTo
    {
        return $this->belongsTo(Answer::class, 'wrong_answer_id');
    }
}
