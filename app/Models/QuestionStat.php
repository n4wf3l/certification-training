<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionStat extends Model
{
    protected $fillable = [
        'question_id',
        'total_seen',
        'correct_count',
        'answer_distribution',
    ];

    protected $casts = [
        'total_seen' => 'integer',
        'correct_count' => 'integer',
        'answer_distribution' => 'array',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
