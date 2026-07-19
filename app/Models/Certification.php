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
        'duration_minutes',
        'passing_score',
        'total_questions',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'duration_minutes' => 'integer',
        'passing_score' => 'integer',
        'total_questions' => 'integer',
    ];

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
