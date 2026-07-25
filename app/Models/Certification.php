<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Certification extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'logo_path',
        'description',
        'long_description',
        'course_blocks',
        'course_updated_at',
        'importance',
        'target_roles',
        'syllabus_blueprint',
        'questions_updated_at',
        'duration_minutes',
        'passing_score',
        'total_questions',
        'validity_months',
        'validity_note',
        'version_retires_at',
        'is_active',
        'available_languages',
        'default_language',
        'translations',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'duration_minutes' => 'integer',
        'passing_score' => 'integer',
        'total_questions' => 'integer',
        'validity_months' => 'integer',
        'target_roles' => 'array',
        'syllabus_blueprint' => 'array',
        'course_blocks' => 'array',
        'available_languages' => 'array',
        'translations' => 'array',
        'course_updated_at' => 'datetime',
        'questions_updated_at' => 'datetime',
        'version_retires_at' => 'date',
    ];

    /**
     * Resolve a field for the requested locale.
     * Fallback chain: direct column when locale = default_language,
     * then translations[locale][field], then direct column (canonical).
     *
     * Return type is mixed to support both string fields (title, description)
     * and array fields like target_roles.
     */
    public function localized(string $locale, string $field): mixed
    {
        if ($locale === $this->default_language) {
            return $this->{$field};
        }
        $translated = data_get($this->translations, "{$locale}.{$field}");
        if ($translated === null || $translated === '') {
            return $this->{$field};
        }
        return $translated;
    }

    protected static function booted(): void
    {
        static::creating(function (Certification $c) {
            if (empty($c->slug)) {
                $c->slug = Str::slug($c->title);
            }
        });
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }
}
