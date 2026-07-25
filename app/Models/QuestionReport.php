<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionReport extends Model
{
    protected $fillable = [
        'question_id',
        'user_id',
        'category',
        'message',
        'chosen_answer_id',
        'attempt_id',
        'status',
        'admin_note',
    ];

    public const CATEGORIES = [
        'wrong_answer' => 'La bonne reponse me semble fausse',
        'contradictory_rationale' => "L'explication contredit une reponse",
        'outdated' => 'Question obsolete (ancienne version)',
        'unclear' => 'Enonce ambigu ou pas clair',
        'typo' => 'Faute de frappe ou d\'orthographe',
        'other' => 'Autre probleme',
    ];

    public const STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chosenAnswer(): BelongsTo
    {
        return $this->belongsTo(Answer::class, 'chosen_answer_id');
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(Attempt::class);
    }
}
