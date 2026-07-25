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
                'allow_instant_feedback' => (bool) Setting::get('allow_instant_feedback', false),
                // On expose seulement si la cle est definie ou pas (jamais la valeur elle-meme)
                'openai_api_key_set' => !empty(Setting::get('openai_api_key')),
                'openai_daily_limit_per_user' => (int) Setting::get('openai_daily_limit_per_user', 10),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'brand_name' => 'nullable|string|max:60',
            'brand_logo' => 'nullable|image|max:2048',
            'remove_logo' => 'nullable|boolean',
            'allow_instant_feedback' => 'nullable|boolean',
            'openai_api_key' => 'nullable|string|max:200',
            'clear_openai_key' => 'nullable|boolean',
            'openai_daily_limit_per_user' => 'nullable|integer|min:0|max:1000',
        ]);

        Setting::set('brand_name', $data['brand_name'] ?: null);
        Setting::set('allow_instant_feedback', ! empty($data['allow_instant_feedback']) ? '1' : '0');

        // OpenAI key : ecraser seulement si une nouvelle valeur non vide est fournie,
        // ou effacer si clear_openai_key coche. Ne jamais l'ecraser avec une string vide accidentellement.
        if (! empty($data['clear_openai_key'])) {
            Setting::set('openai_api_key', null);
        } elseif (! empty($data['openai_api_key'])) {
            Setting::set('openai_api_key', $data['openai_api_key']);
        }
        Setting::set('openai_daily_limit_per_user', (string) ($data['openai_daily_limit_per_user'] ?? 10));

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

        return redirect()->route('admin.settings.edit')->with('success', __('flash.settings_updated'));
    }
}
