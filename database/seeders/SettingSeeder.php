<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $dataDir = database_path('seeders/data');
        $file = $dataDir . '/settings.json';
        if (! File::exists($file)) {
            return;
        }

        $settings = json_decode(File::get($file), true) ?: [];
        Storage::disk('public')->makeDirectory('brand');

        foreach ($settings as $setting) {
            // Si un logo de marque est référencé, restaure le fichier
            if ($setting['key'] === 'brand_logo_path' && ! empty($setting['value'])) {
                $src = $dataDir . '/logos/' . basename($setting['value']);
                if (File::exists($src) && ! Storage::disk('public')->exists($setting['value'])) {
                    Storage::disk('public')->put($setting['value'], File::get($src));
                }
            }

            Setting::set($setting['key'], $setting['value']);
        }

        $this->command?->info(sprintf('Snapshot settings : %d entrées restaurées.', count($settings)));
    }
}
