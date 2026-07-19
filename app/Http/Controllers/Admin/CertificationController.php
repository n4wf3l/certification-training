<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CertificationController extends Controller
{
    public function index(): Response
    {
        $certifications = Certification::withCount('questions')
            ->orderBy('title')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'slug' => $c->slug,
                'logo_path' => $c->logo_path,
                'duration_minutes' => $c->duration_minutes,
                'passing_score' => $c->passing_score,
                'total_questions' => $c->total_questions,
                'questions_count' => $c->questions_count,
                'is_active' => $c->is_active,
            ]);

        return Inertia::render('Admin/Certifications/Index', [
            'certifications' => $certifications,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Certifications/Form', [
            'certification' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['logo_path'] = $this->handleLogo($request);
        $data['slug'] = $data['slug'] ?: Str::slug($data['title']);

        Certification::create($data);

        return redirect()->route('admin.certifications.index')->with('success', 'Certification créée.');
    }

    public function edit(Certification $certification): Response
    {
        return Inertia::render('Admin/Certifications/Form', [
            'certification' => $certification,
        ]);
    }

    public function update(Request $request, Certification $certification): RedirectResponse
    {
        $data = $this->validated($request, $certification->id);
        $data['slug'] = $data['slug'] ?: Str::slug($data['title']);

        if ($request->hasFile('logo')) {
            if ($certification->logo_path) {
                Storage::disk('public')->delete($certification->logo_path);
            }
            $data['logo_path'] = $this->handleLogo($request);
        } else {
            unset($data['logo_path']);
        }

        $certification->update($data);

        return redirect()->route('admin.certifications.index')->with('success', 'Certification mise à jour.');
    }

    public function destroy(Certification $certification): RedirectResponse
    {
        if ($certification->logo_path) {
            Storage::disk('public')->delete($certification->logo_path);
        }
        $certification->delete();

        return redirect()->route('admin.certifications.index')->with('success', 'Certification supprimée.');
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:certifications,slug' . ($ignoreId ? ",$ignoreId" : ''),
            'description' => 'nullable|string|max:2000',
            'duration_minutes' => 'required|integer|min:1|max:600',
            'passing_score' => 'required|integer|min:1',
            'total_questions' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'logo' => 'nullable|image|max:2048',
        ]);
    }

    private function handleLogo(Request $request): ?string
    {
        if (! $request->hasFile('logo')) {
            return null;
        }
        return $request->file('logo')->store('logos', 'public');
    }
}
