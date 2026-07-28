<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ExtractsJsonArray;
use App\Http\Controllers\Concerns\SplitsLocalizedBlocks;
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
    use SplitsLocalizedBlocks;

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
        // Shadow translations : batir la colonne translations en excluant la
        // langue canonique (redondante avec les colonnes plates).
        $canonicalLang = $data['default_language'] ?? 'fr';
        $data['translations'] = $this->buildTranslationsPayload(
            $data['translations'] ?? [],
            $canonicalLang,
            null
        );
        unset($data['target_roles_text']);

        Certification::create($data);

        return redirect()->route('admin.certifications.index')->with('success', __('flash.certification_created'));
    }

    public function edit(Certification $certification): Response
    {
        $payload = $certification->toArray();
        $payload['target_roles_text'] = collect($certification->target_roles ?? [])->implode("\n");
        $payload['course_blocks_count'] = is_array($certification->course_blocks) ? count($certification->course_blocks) : 0;

        // Convertit translations[lang].target_roles (array) en target_roles_text
        // (multi-line string) pour que le form <textarea> puisse le hydrater.
        $translations = $certification->translations ?? [];
        foreach ($translations as $lang => &$fields) {
            if (isset($fields['target_roles']) && is_array($fields['target_roles'])) {
                $fields['target_roles_text'] = implode("\n", $fields['target_roles']);
            } elseif (!isset($fields['target_roles_text'])) {
                $fields['target_roles_text'] = '';
            }
        }
        unset($fields);
        $payload['translations'] = $translations;

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
        // Merge shadow translations (preserve keys existants comme course_blocks)
        $canonicalLang = $certification->default_language ?? $data['default_language'] ?? 'fr';
        $data['translations'] = $this->buildTranslationsPayload(
            $data['translations'] ?? [],
            $canonicalLang,
            $certification->translations
        );
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

    /**
     * Preview du certificat CertifLoop avec dummy data pour cette cert.
     * 3 formats via ?format=... :
     *   - default (inertia page) : preview page avec iframe + banner + PDF download button
     *   - raw   : le template Blade brut, servi dans l'iframe
     *   - pdf   : DomPDF, telechargement du preview PDF
     *
     * Le certificat est TOUJOURS rendu en EN (regle produit : signal
     * international destine aux recruteurs, langue UI de l'admin ignoree).
     */
    public function certificatePreview(Request $request, Certification $certification)
    {
        $format = $request->query('format', 'inertia');

        // Force EN quel que soit le UI locale de l'admin.
        app()->setLocale('en');

        $adminName = auth()->user()?->name ?? 'Alice Chen';
        $brandName = \App\Models\Setting::get('brand_name') ?: 'CertifLoop';

        // URL de verification mock (pointe vers /certificate/PREVIEW - route
        // valide mais qui renverra 404 puisque le token n'existe pas en DB.
        // C'est acceptable pour un preview : le QR se genere quand meme et
        // l'admin verifie que le layout est correct).
        $verificationUrl = route('certificate.show', 'PREVIEW');
        $qrDataUri = \App\Http\Controllers\CertificateController::qrCodeDataUri($verificationUrl);

        // Dummy data qui simule une attribution reelle a 100 %.
        $mockData = [
            'user_name' => $adminName,
            'certification_title' => $certification->title,
            'mastery_pct' => 100,
            'best_score' => $certification->total_questions,
            'total_questions' => $certification->total_questions,
            'awarded_date' => now()->translatedFormat('d F Y'),
            'brand_name' => $brandName,
            'token' => 'PREVIEW',
            'verification_url' => $verificationUrl,
            'qr_data_uri' => $qrDataUri,
        ];

        if ($format === 'pdf') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.certificate', $mockData)
                ->setPaper('a4', 'landscape');
            $filename = sprintf('preview-%s-%s.pdf', $certification->slug, now()->format('Y-m-d'));
            return $pdf->download($filename);
        }

        if ($format === 'raw') {
            // Rendu brut du template, sans layout : sert de src pour l'iframe.
            return response()->view('pdf.certificate', $mockData);
        }

        return Inertia::render('Admin/Certifications/CertificatePreview', [
            'certification' => [
                'id' => $certification->id,
                'title' => $certification->title,
                'slug' => $certification->slug,
                'logo_path' => $certification->logo_path,
                'total_questions' => $certification->total_questions,
            ],
            'preview_html_url' => route('admin.certifications.certificate-preview', [
                'certification' => $certification->id,
                'format' => 'raw',
            ]),
            'preview_pdf_url' => route('admin.certifications.certificate-preview', [
                'certification' => $certification->id,
                'format' => 'pdf',
            ]),
        ]);
    }

    private const ALLOWED_BLOCK_TYPES = [
        'heading', 'paragraph', 'list', 'callout', 'key_terms',
        'steps', 'comparison', 'example', 'code', 'summary', 'mermaid',
    ];

    /**
     * Devine le type de bloc qu'un objet sans `type` pourrait etre, pour donner
     * un message d'erreur actionnable au lieu de "missing type" generique.
     * Renvoie un slug qui matche une cle flash `course_block_missing_type_hint_<slug>`
     * ou null si aucun pattern connu ne matche. Mirror de la version JS.
     */
    private function guessMissingBlockType(array $block): ?string
    {
        if (isset($block['label']) && isset($block['values']) && is_array($block['values'])) {
            return 'comparison_row';
        }
        if (isset($block['title']) && (isset($block['content']) || isset($block['description'])) && !isset($block['items'])) {
            return 'step_or_callout';
        }
        if (isset($block['items']) && is_array($block['items']) && !isset($block['title'])) {
            return 'list_or_summary';
        }
        if (isset($block['text']) && is_string($block['text']) && count($block) <= 2) {
            return 'paragraph';
        }
        return null;
    }

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
                // Diagnose le pattern erratique le plus courant : ChatGPT a aplati
                // les rows d'un bloc comparison au niveau racine au lieu de les
                // nester. On donne un message actionnable au lieu du generique.
                $hint = $this->guessMissingBlockType(is_array($block) ? $block : []);
                $flashKey = $hint
                    ? "flash.course_block_missing_type_hint_{$hint}"
                    : 'flash.course_block_missing_type';
                throw ValidationException::withMessages([
                    'payload' => __($flashKey, ['n' => $i + 1]),
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

        // Localization split: cert.available_languages drives which locales
        // must be present in the { lang: value } objects. Canonical goes to
        // the flat column, shadows are merged into translations[lang].course_blocks
        // (mirror shape, so BlockRenderer keeps reading flat strings).
        $availableLangs = $certification->available_languages ?: [$certification->default_language ?? 'fr'];
        $canonicalLang = $certification->default_language ?? $availableLangs[0] ?? 'fr';

        [$canonical, $shadows] = $this->splitBlocksByLocale($normalized, $canonicalLang, $availableLangs);

        $translations = $certification->translations ?? [];
        foreach ($shadows as $lang => $blocks) {
            $translations[$lang] = array_merge($translations[$lang] ?? [], [
                'course_blocks' => $blocks,
            ]);
        }

        $certification->update([
            'course_blocks' => $canonical,
            'course_updated_at' => now(),
            'translations' => $translations,
        ]);

        $count = count($canonical);
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
            'navigation_mode' => 'nullable|in:free,sequential_locked',
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
            // Shadow translations : par langue, memes 6 champs traduisibles que
            // les colonnes canoniques. Tous nullable : un onglet peut etre
            // partiellement rempli (le fallback vers canonique s'en occupe).
            'translations' => 'nullable|array',
            'translations.*.title' => 'nullable|string|max:150',
            'translations.*.description' => 'nullable|string|max:2000',
            'translations.*.long_description' => 'nullable|string|max:5000',
            'translations.*.importance' => 'nullable|string|max:2000',
            'translations.*.validity_note' => 'nullable|string|max:2000',
            'translations.*.target_roles_text' => 'nullable|string|max:2000',
        ]);
    }

    /**
     * Assemble le payload final pour la colonne `translations` JSON.
     *
     * - Merge dans `$existing` (preserve les cles siblings comme course_blocks
     *   qui sont gerees par le CourseTranslationsSeeder / CourseImport).
     * - Exclut la langue canonique (redondante avec les colonnes plates).
     * - Convertit target_roles_text -> target_roles array pour chaque locale.
     * - Filtre les locales entierement vides pour eviter de polluer le JSON
     *   avec {"en": {"title": null, ...}}.
     *
     * @param array<string, array<string, mixed>> $incoming    From request payload
     * @param string                              $canonical   Locale to exclude (canonical column)
     * @param array<string, mixed>|null           $existing    Current translations column value
     * @return array<string, array<string, mixed>>|null       Merged result (null if empty)
     */
    private function buildTranslationsPayload(array $incoming, string $canonical, ?array $existing): ?array
    {
        $result = $existing ?? [];

        foreach ($incoming as $lang => $fields) {
            if (! is_string($lang) || ! preg_match('/^[a-z]{2}$/', $lang)) continue;
            if ($lang === $canonical) continue;
            if (! is_array($fields)) continue;

            $normalized = [
                'title' => isset($fields['title']) ? trim((string) $fields['title']) : null,
                'description' => isset($fields['description']) ? trim((string) $fields['description']) : null,
                'long_description' => isset($fields['long_description']) ? trim((string) $fields['long_description']) : null,
                'importance' => isset($fields['importance']) ? trim((string) $fields['importance']) : null,
                'validity_note' => isset($fields['validity_note']) ? trim((string) $fields['validity_note']) : null,
                'target_roles' => $this->parseRoles($fields['target_roles_text'] ?? null),
            ];
            // Empty string -> null
            foreach ($normalized as $k => $v) {
                if ($v === '') $normalized[$k] = null;
            }
            // Skip if entirely empty (no field set)
            $hasContent = collect($normalized)->contains(fn ($v) => $v !== null && $v !== [] && $v !== '');
            if (! $hasContent) {
                unset($result[$lang]);
                continue;
            }
            // Merge with existing keys for this lang (preserve course_blocks etc.)
            $result[$lang] = array_merge($result[$lang] ?? [], $normalized);
        }

        return empty($result) ? null : $result;
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
