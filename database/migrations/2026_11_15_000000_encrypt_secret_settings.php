<?php

use App\Models\Setting;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Chiffre les cles secretes deja enregistrees en clair (ex. openai_api_key).
 * Idempotent : une valeur deja dechiffrable est laissee telle quelle.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (Setting::SECRET_KEYS as $key) {
            $row = DB::table('settings')->where('key', $key)->first();
            if (! $row || $row->value === null || $row->value === '') {
                continue;
            }
            try {
                Crypt::decryptString($row->value);
            } catch (DecryptException) {
                DB::table('settings')->where('key', $key)
                    ->update(['value' => Crypt::encryptString($row->value)]);
            }
        }
        Cache::forget(Setting::CACHE_KEY);
    }

    public function down(): void
    {
        foreach (Setting::SECRET_KEYS as $key) {
            $row = DB::table('settings')->where('key', $key)->first();
            if (! $row || $row->value === null || $row->value === '') {
                continue;
            }
            try {
                DB::table('settings')->where('key', $key)
                    ->update(['value' => Crypt::decryptString($row->value)]);
            } catch (DecryptException) {
                // deja en clair
            }
        }
        Cache::forget(Setting::CACHE_KEY);
    }
};
