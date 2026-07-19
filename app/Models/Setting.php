<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public const CACHE_KEY = 'settings.all';

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::allCached()[$key] ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => is_scalar($value) || $value === null ? $value : json_encode($value)]
        );
        Cache::forget(static::CACHE_KEY);
    }

    /** @return array<string,mixed> */
    public static function allCached(): array
    {
        return Cache::rememberForever(static::CACHE_KEY, function () {
            return static::query()->pluck('value', 'key')->all();
        });
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(static::CACHE_KEY));
        static::deleted(fn () => Cache::forget(static::CACHE_KEY));
    }
}
