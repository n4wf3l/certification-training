<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Share brand settings with all Blade views (so <head> can render favicon + title).
        View::composer('*', function ($view) {
            $brandName = 'CertifLoop';
            $brandLogoUrl = null;
            try {
                if (Schema::hasTable('settings')) {
                    $brandName = Setting::get('brand_name') ?: 'CertifLoop';
                    $logoPath = Setting::get('brand_logo_path');
                    if ($logoPath) {
                        $brandLogoUrl = asset('storage/'.$logoPath);
                    }
                }
            } catch (\Throwable $e) {
                // Skip if DB isn't ready (fresh install / migration).
            }
            $view->with([
                'brandName' => $brandName,
                'brandLogoUrl' => $brandLogoUrl,
            ]);
        });
    }
}
