<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ExtractsJsonArray;
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
    use ExtractsJsonArray;

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
                'available_languages' => $c->available_languages ?: ['fr'],
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
        $data['available_languages'] = $this->normalizeLanguages($data['available_languages'] ?? null);
        unset($data['target_roles_text']);

        Certification::create($data);

        return redirect()->route('admin.certifications.index')->with('success', __('flash.certification_created'));
    }

    public function edit(Certification $certification): Response
    {
        $payload = $certification->toArray();
        $payload['target_roles_text'] = collect($certification->target_roles ?? [])->implode("\n");
        $payload['course_blocks_count'] = is_array($certification->course_blocks) ? count($certification->course_blocks) : 0;

        // Nombre de questions par syllabus_domain - pour afficher la couverture réelle
        // à côté de chaque ligne du blueprint dans l'UI.
        $counts = \App\Models\Question::where('certification_id', $certification->id)
            ->whereNotNull('syllabus_domain')
            ->select('syllabus_domain', \Illuminate\Support\Facades\DB::raw('COUNT(*) as n'))
            ->groupBy('syllabus_domain')
            ->pluck('n', 'syllabus_domain')
            ->all();

        return Inertia::render('Admin/Certifications/Form', [
            'certification' => $payload,
            'question_counts_by_domain' => $counts,
        ]);
    }

    public function update(Request $request, Certification $certification): RedirectResponse
    {
        $data = $this->validated($request, $certification->id);
        $data['slug'] = $data['slug'] ?: Str::slug($data['title']);
        $data['target_roles'] = $this->parseRoles($data['target_roles_text'] ?? null);
        $data['available_languages'] = $this->normalizeLanguages($data['available_languages'] ?? null);
        $removeCourse = ! empty($data['remove_course']);
        unset($data['target_roles_text'], $data['remove_course']);

        if ($request->hasFile('logo')) {
            if ($certification->logo_path) {
                Storage::disk('public')->delete($certification->logo_path);
            }
            $data['logo_path'] = $this->handleLogo($request);
        } else {
            unset($data['logo_path']);
        }

        if ($removeCourse) {
            $data['course_blocks'] = null;
            $data['course_updated_at'] = null;
        }

        $certification->update($data);

        return redirect()->route('admin.certifications.index')->with('success', $removeCourse
            ? __('flash.certification_updated_course_removed')
            : __('flash.certification_updated'));
    }

    public function destroy(Certification $certification): RedirectResponse
    {
        if ($certification->logo_path) {
            Storage::disk('public')->delete($certification->logo_path);
        }
        $certification->delete();

        return redirect()->route('admin.certifications.index')->with('success', __('flash.certification_deleted'));
    }

    /**
     * Export all Q&A of a certification as a JSON file download.
     * Raw content only - no prompt embedded, the admin writes the ChatGPT prompt themselves.
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
                'explanation' => $q->explanation,
                'answers' => $q->answers
                    ->sortBy('letter')
                    ->values()
                    ->map(fn ($a) => [
                        'letter' => $a->letter,
                        'text' => $a->answer_text,
                        'rationale' => $a->rationale,
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
            'certifications' => Certification::orderBy('title')
                ->get(['id', 'title', 'slug', 'logo_path', 'available_languages'])
                ->map(fn (Certification $c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'slug' => $c->slug,
                    'logo_path' => $c->logo_path,
                    'available_languages' => $c->available_languages ?: ['fr'],
                ]),
            'default_certification_id' => $request->integer('certification_id') ?: null,
        ]);
    }

    public function courseImportStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'payload' => 'required|string',
        ]);

        $raw = $this->extractTopLevelArray($validated['payload']);
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw ValidationException::withMessages([
                'payload' => __('flash.course_invalid_json'),
            ]);
        }

        $normalized = [];
        foreach ($decoded as $i => $block) {
            if (!is_array($block) || empty($block['type'])) {
                throw ValidationException::withMessages([
                    'payload' => __('flash.course_block_missing_type', ['n' => $i + 1]),
                ]);
            }
            if (!in_array($block['type'], self::ALLOWED_BLOCK_TYPES, true)) {
                throw ValidationException::withMessages([
                    'payload' => __('flash.course_block_unknown_type', [
                        'n' => $i + 1,
                        'type' => $block['type'],
                        'allowed' => implode(', ', self::ALLOWED_BLOCK_TYPES),
                    ]),
                ]);
            }
            $normalized[] = $block;
        }

        if (count($normalized) < 5) {
            throw ValidationException::withMessages([
                'payload' => __('flash.course_too_few_blocks', ['count' => count($normalized)]),
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
            ->with('success', __('flash.course_imported', ['count' => $count, 'title' => $certification->title]));
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
            'remove_course' => 'nullable|boolean',
            'syllabus_blueprint' => 'nullable|array',
            'syllabus_blueprint.*' => 'numeric|min:0|max:100',
            'available_languages' => 'nullable|array|min:1',
            'available_languages.*' => 'string|size:2|regex:/^[a-z]{2}$/',
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

    /**
     * Nettoie la liste des langues : force en tableau, dedupe, garde
     * uniquement les codes ISO 639-1 (2 lettres minuscules). Retombe
     * sur ['fr'] si l'admin n'a rien coche pour eviter les prompts vides.
     */
    private function normalizeLanguages(mixed $raw): array
    {
        $codes = collect(is_array($raw) ? $raw : [])
            ->map(fn ($c) => is_string($c) ? strtolower(trim($c)) : null)
            ->filter(fn ($c) => $c && preg_match('/^[a-z]{2}$/', $c))
            ->unique()
            ->values()
            ->all();

        // L'anglais est la langue par defaut de la plateforme depuis la Phase 1
        // multilingue : une certif sans langue definie retombe en EN, pas en FR.
        return $codes ?: ['en'];
    }

    private function handleLogo(Request $request): ?string
    {
        if (! $request->hasFile('logo')) {
            return null;
        }
        return $request->file('logo')->store('logos', 'public');
    }
}
