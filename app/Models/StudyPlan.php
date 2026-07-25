<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyPlan extends Model
{
    protected $fillable = [
        'user_id',
        'certification_id',
        'exam_date',
        'daily_target',
        'weekday_focus',
        'email_daily_reminder',
        'email_weekly_digest',
    ];

    protected $casts = [
        'exam_date' => 'date',
        'daily_target' => 'integer',
        'weekday_focus' => 'array',
        'email_daily_reminder' => 'boolean',
        'email_weekly_digest' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }

    /**
     * Nombre de jours restants jusqu'au jour J (peut etre negatif si depasse).
     */
    public function daysUntilExam(): int
    {
        return (int) now()->startOfDay()->diffInDays($this->exam_date, false);
    }

    /**
     * Focus du jour actuel (ex: 'guiding-principles' pour lundi, 'exam' pour samedi).
     */
    public function todayFocus(): ?string
    {
        $day = strtolower(now()->format('l')); // monday, tuesday, ...
        return ($this->weekday_focus ?? [])[$day] ?? null;
    }
}
