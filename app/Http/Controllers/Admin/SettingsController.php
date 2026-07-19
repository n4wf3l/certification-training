<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/Settings/Edit', [
            'settings' => [
                'brand_name' => Setting::get('brand_name'),
                'brand_logo_path' => Setting::get('brand_logo_path'),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'brand_name' => 'nullable|string|max:60',
            'brand_logo' => 'nullable|image|max:2048',
            'remove_logo' => 'nullable|boolean',
        ]);

        Setting::set('brand_name', $data['brand_name'] ?: null);

        if (! empty($data['remove_logo'])) {
            $current = Setting::get('brand_logo_path');
            if ($current) {
                Storage::disk('public')->delete($current);
            }
            Setting::set('brand_logo_path', null);
        }

        if ($request->hasFile('brand_logo')) {
            $current = Setting::get('brand_logo_path');
            if ($current) {
                Storage::disk('public')->delete($current);
            }
            $path = $request->file('brand_logo')->store('brand', 'public');
            Setting::set('brand_logo_path', $path);
        }

        return redirect()->route('admin.settings.edit')->with('success', 'Paramètres mis à jour.');
    }
}
