<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
    protected $fillable = [
        'question_id',
        'letter',
        'answer_text',
        'rationale',
        'is_correct',
        'translations',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'translations' => 'array',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    /**
     * Resolve a text field for the requested locale. Canonical language is
     * inherited from the grand-parent certification, or passed explicitly to
     * skip the double relation lookup when the caller already knows it.
     */
    public function localized(string $locale, string $field, ?string $canonicalOverride = null): ?string
    {
        $canonical = $canonicalOverride ?? ($this->question?->certification?->default_language ?? 'en');
        if ($locale === $canonical) {
            return $this->{$field};
        }
        $translated = data_get($this->translations, "{$locale}.{$field}");
        return ($translated !== null && $translated !== '') ? $translated : $this->{$field};
    }
}
