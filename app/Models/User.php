<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'preferred_locale',
        'current_streak',
        'longest_streak',
        'last_activity_date',
        'total_xp',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_activity_date' => 'date',
            'current_streak' => 'integer',
            'longest_streak' => 'integer',
            'total_xp' => 'integer',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    public function badges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(UserCertificate::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(QuestionBookmark::class);
    }
}
