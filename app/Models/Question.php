<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Question extends Model
{
    protected $fillable = [
        'certification_id',
        'position',
        'topic',
        'concept_group_key',
        'syllabus_domain',
        'learning_objective',
        'scenario',
        'question_text',
        'explanation',
        'translations',
    ];

    protected $casts = [
        'translations' => 'array',
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

    public function stat(): HasOne
    {
        return $this->hasOne(QuestionStat::class);
    }

    /**
     * Resolve a text field for the requested locale.
     * Fallback chain: direct column when locale = canonical language,
     * then translations[locale][field], then direct column (canonical fallback).
     *
     * $canonicalOverride evite un lookup certification->default_language quand
     * l'appelant connait deja la langue canonique (evite un N+1 dans les listes).
     */
    public function localized(string $locale, string $field, ?string $canonicalOverride = null): ?string
    {
        $canonical = $canonicalOverride ?? ($this->certification?->default_language ?? 'en');
        if ($locale === $canonical) {
            return $this->{$field};
        }
        $translated = data_get($this->translations, "{$locale}.{$field}");
        return ($translated !== null && $translated !== '') ? $translated : $this->{$field};
    }
}
