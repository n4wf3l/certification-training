<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public const CACHE_KEY = 'settings.all';

    /**
     * Cles secretes : chiffrees en base (APP_KEY) et dans le cache.
     * Setting::get() les rend dechiffrees, Setting::set() les chiffre.
     */
    public const SECRET_KEYS = ['openai_api_key'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = static::allCached()[$key] ?? null;
        if ($value === null) {
            return $default;
        }

        if (in_array($key, static::SECRET_KEYS, true)) {
            try {
                return Crypt::decryptString($value);
            } catch (DecryptException) {
                // APP_KEY changee ou valeur corrompue : on desactive plutot que d'utiliser du chiffre.
                Log::warning("Setting secret '$key' illisible (APP_KEY changee ?). A ressaisir dans /admin/settings.");

                return $default;
            }
        }

        return $value;
    }

    public static function set(string $key, mixed $value): void
    {
        if (in_array($key, static::SECRET_KEYS, true) && $value !== null && $value !== '') {
            $value = Crypt::encryptString((string) $value);
        }

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
