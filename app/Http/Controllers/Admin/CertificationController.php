<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
                'questions_updated_at' => $c->questions_updated_at,
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
        $data['target_roles'] = $this->parseRoles($data['target_roles_text'] ?? null);
        unset($data['target_roles_text']);

        Certification::create($data);

        return redirect()->route('admin.certifications.index')->with('success', 'Certification créée.');
    }

    public function edit(Certification $certification): Response
    {
        $payload = $certification->toArray();
        $payload['target_roles_text'] = collect($certification->target_roles ?? [])->implode("\n");
        return Inertia::render('Admin/Certifications/Form', [
            'certification' => $payload,
        ]);
    }

    public function update(Request $request, Certification $certification): RedirectResponse
    {
        $data = $this->validated($request, $certification->id);
        $data['slug'] = $data['slug'] ?: Str::slug($data['title']);
        $data['target_roles'] = $this->parseRoles($data['target_roles_text'] ?? null);
        unset($data['target_roles_text']);

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

    /**
     * Export all Q&A of a certification as a JSON file download.
     * Raw content only — no prompt embedded, the admin writes the ChatGPT prompt themselves.
     */
    public function export(Certification $certification)
    {
        $certification->load(['questions' => fn ($q) => $q->orderBy('position'), 'questions.answers']);

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'certification' => [
                'title' => $certification->title,
                'slug' => $certification->slug,
                'description' => $certification->description,
                'long_description' => $certification->long_description,
                'importance' => $certification->importance,
                'target_roles' => $certification->target_roles ?? [],
                'duration_minutes' => $certification->duration_minutes,
                'passing_score' => $certification->passing_score,
                'total_questions' => $certification->total_questions,
                'validity_months' => $certification->validity_months,
                'validity_note' => $certification->validity_note,
                'version_retires_at' => $certification->version_retires_at?->toDateString(),
                'questions_updated_at' => $certification->questions_updated_at?->toIso8601String(),
                'available_questions_count' => $certification->questions->count(),
            ],
            'questions' => $certification->questions->map(fn ($q) => [
                'position' => $q->position,
                'topic' => $q->topic,
                'scenario' => $q->scenario,
                'question' => $q->question_text,
                'answers' => $q->answers
                    ->sortBy('letter')
                    ->values()
                    ->map(fn ($a) => [
                        'letter' => $a->letter,
                        'text' => $a->answer_text,
                        'correct' => (bool) $a->is_correct,
                    ])
                    ->all(),
                'correct_letter' => optional($q->answers->firstWhere('is_correct', true))->letter,
            ])->values()->all(),
        ];

        $filename = sprintf(
            'certif-%s-%s.json',
            $certification->slug,
            now()->format('Y-m-d')
        );

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        return response($json, 200, [
            'Content-Type' => 'application/json; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private const ALLOWED_BLOCK_TYPES = [
        'heading', 'paragraph', 'list', 'callout', 'key_terms',
        'steps', 'comparison', 'example', 'code', 'summary',
    ];

    public function courseImportForm(Request $request): Response
    {
        return Inertia::render('Admin/Certifications/CourseImport', [
            'certifications' => Certification::orderBy('title')->get(['id', 'title', 'slug', 'logo_path']),
            'default_certification_id' => $request->integer('certification_id') ?: null,
        ]);
    }

    public function courseImportStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'payload' => 'required|string',
        ]);

        $raw = trim($validated['payload']);
        $raw = preg_replace('/^```(?:json|js|javascript)?\s*\n?/i', '', $raw);
        $raw = preg_replace('/\n?```\s*$/i', '', $raw);
        $decoded = json_decode(trim($raw), true);
        if (!is_array($decoded)) {
            throw ValidationException::withMessages([
                'payload' => "Le JSON n'est pas valide. Vérifie qu'il commence par [ et se termine par ].",
            ]);
        }

        $normalized = [];
        foreach ($decoded as $i => $block) {
            if (!is_array($block) || empty($block['type'])) {
                throw ValidationException::withMessages([
                    'payload' => "Bloc " . ($i + 1) . " : clé 'type' manquante.",
                ]);
            }
            if (!in_array($block['type'], self::ALLOWED_BLOCK_TYPES, true)) {
                throw ValidationException::withMessages([
                    'payload' => "Bloc " . ($i + 1) . " : type '{$block['type']}' inconnu. Autorisés : " . implode(', ', self::ALLOWED_BLOCK_TYPES) . '.',
                ]);
            }
            $normalized[] = $block;
        }

        if (count($normalized) < 5) {
            throw ValidationException::withMessages([
                'payload' => "Un cours doit contenir au moins 5 blocs. " . count($normalized) . " reçu(s).",
            ]);
        }

        $certification = Certification::findOrFail($validated['certification_id']);
        $certification->update([
            'course_blocks' => $normalized,
            'course_updated_at' => now(),
        ]);

        $count = count($normalized);
        return redirect()
            ->route('admin.certifications.index')
            ->with('success', "Cours importé : {$count} blocs pour {$certification->title}.");
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:certifications,slug' . ($ignoreId ? ",$ignoreId" : ''),
            'description' => 'nullable|string|max:2000',
            'long_description' => 'nullable|string|max:5000',
            'importance' => 'nullable|string|max:2000',
            'target_roles_text' => 'nullable|string|max:2000',
            'questions_updated_at' => 'nullable|date',
            'duration_minutes' => 'required|integer|min:1|max:600',
            'passing_score' => 'required|integer|min:1',
            'total_questions' => 'required|integer|min:1',
            'validity_months' => 'nullable|integer|min:1|max:600',
            'validity_note' => 'nullable|string|max:2000',
            'version_retires_at' => 'nullable|date',
            'is_active' => 'boolean',
            'logo' => 'nullable|image|max:2048',
        ]);
    }

    private function parseRoles(?string $raw): array
    {
        if (! $raw) return [];
        return collect(preg_split('/[\r\n]+/', $raw))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->values()
            ->all();
    }

    private function handleLogo(Request $request): ?string
    {
        if (! $request->hasFile('logo')) {
            return null;
        }
        return $request->file('logo')->store('logos', 'public');
    }
}
