<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Validation\ValidationException;

/**
 * Course-block localization plumbing.
 *
 * Mirrors the Q&A import pattern: ChatGPT emits inline bilingual objects
 * ({ lang: value }) for every translatable field, and this trait splits
 * each block into a canonical version + one shadow per locale, both
 * conforming to the flat renderer shape.
 *
 * Callers store the canonical result in certifications.course_blocks and
 * merge the shadows into certifications.translations[locale].course_blocks.
 */
trait SplitsLocalizedBlocks
{
    /**
     * For each block type, the list of dotted paths whose leaf value is
     * translatable. Paths ending with `[]` mean "map over the array at that
     * key and split each element". `code` has no translatable field.
     *
     * @var array<string, array<int, string>>
     */
    private static array $TRANSLATABLE_PATHS = [
        'heading'   => ['text'],
        'paragraph' => ['text'],
        'list'      => ['items[]'],
        'callout'   => ['title', 'body'],
        'key_terms' => ['items[].term', 'items[].definition'],
        'steps'     => ['items[].title', 'items[].body'],
        'comparison' => ['columns[]', 'rows[].label', 'rows[].values[]'],
        'example'   => ['title', 'body'],
        'code'      => [],
        'summary'   => ['title', 'items[]'],
        // mermaid.code = syntax non traduisible (mono-lang), caption = titre du diagramme (traduisible)
        'mermaid'   => ['caption'],
    ];

    /**
     * Split a raw block array (where translatable leaves are { lang: value }
     * objects OR plain strings for mono-language back-compat) into a
     * canonical version + one shadow per non-canonical locale.
     *
     * @param array<int, array<string, mixed>> $rawBlocks
     * @param array<int, string>               $availableLangs
     * @return array{0: array<int, array<string, mixed>>, 1: array<string, array<int, array<string, mixed>>>}
     */
    protected function splitBlocksByLocale(
        array $rawBlocks,
        string $canonicalLang,
        array $availableLangs,
    ): array {
        $canonical = [];
        $shadows = [];
        foreach ($availableLangs as $lang) {
            if ($lang !== $canonicalLang) {
                $shadows[$lang] = [];
            }
        }

        foreach ($rawBlocks as $idx => $block) {
            $type = $block['type'] ?? null;
            $paths = self::$TRANSLATABLE_PATHS[$type] ?? [];

            // Start from an exact copy for every output shape, then overwrite
            // the translatable leaves per locale.
            $canonical[$idx] = $block;
            foreach ($shadows as $lang => $_) {
                $shadows[$lang][$idx] = $block;
            }

            foreach ($paths as $path) {
                $this->applyPath(
                    block: $canonical[$idx],
                    shadows: $shadows,
                    path: $path,
                    canonicalLang: $canonicalLang,
                    availableLangs: $availableLangs,
                    blockIndex: $idx,
                );
            }
        }

        return [array_values($canonical), $shadows];
    }

    /**
     * Walk a dotted path (supporting `foo[]` array-map segments) into $block
     * and $shadows in lock-step, resolving the { lang: value } object at the
     * leaf into per-locale scalar strings.
     *
     * @param array<string, array<int, array<string, mixed>>> $shadows Passed by reference for in-place mutation.
     */
    private function applyPath(
        array &$block,
        array &$shadows,
        string $path,
        string $canonicalLang,
        array $availableLangs,
        int $blockIndex,
    ): void {
        $segments = explode('.', $path);
        $this->walk(
            canonicalRef: $block,
            shadowRefs: $this->refsAtIndex($shadows, $blockIndex),
            segments: $segments,
            canonicalLang: $canonicalLang,
            availableLangs: $availableLangs,
            fieldLabelPath: $path,
            blockIndex: $blockIndex,
        );
    }

    /**
     * Build an associative array of references to each shadow's current
     * block slot. Kept as a helper to keep the walker signature narrow.
     *
     * @param array<string, array<int, array<string, mixed>>> $shadows
     * @return array<string, mixed>  map of lang => reference to that shadow's block at $blockIndex
     */
    private function &refsAtIndex(array &$shadows, int $blockIndex): array
    {
        $refs = [];
        foreach ($shadows as $lang => $_) {
            $refs[$lang] = &$shadows[$lang][$blockIndex];
        }
        return $refs;
    }

    /**
     * Recursive walker: descend into $segments simultaneously in the canonical
     * block and in every shadow. `foo[]` segments map over the array under
     * `foo`. When the last segment is reached, split the leaf value.
     *
     * @param array<string, mixed> $shadowRefs
     */
    private function walk(
        mixed &$canonicalRef,
        array &$shadowRefs,
        array $segments,
        string $canonicalLang,
        array $availableLangs,
        string $fieldLabelPath,
        int $blockIndex,
    ): void {
        if (empty($segments)) {
            $this->splitLeaf(
                canonicalRef: $canonicalRef,
                shadowRefs: $shadowRefs,
                canonicalLang: $canonicalLang,
                availableLangs: $availableLangs,
                fieldLabelPath: $fieldLabelPath,
                blockIndex: $blockIndex,
            );
            return;
        }

        $segment = array_shift($segments);
        $isArray = str_ends_with($segment, '[]');
        $key = $isArray ? substr($segment, 0, -2) : $segment;

        if (!is_array($canonicalRef) || !array_key_exists($key, $canonicalRef)) {
            // Leaf absent on this block: nothing to translate, skip silently.
            return;
        }

        if ($isArray) {
            if (!is_array($canonicalRef[$key])) {
                return;
            }
            $count = count($canonicalRef[$key]);
            for ($i = 0; $i < $count; $i++) {
                $childShadowRefs = [];
                foreach ($shadowRefs as $lang => $_) {
                    // Ensure the shadow has the same array shape as canonical at this path
                    if (!isset($shadowRefs[$lang][$key]) || !is_array($shadowRefs[$lang][$key])) {
                        $shadowRefs[$lang][$key] = $canonicalRef[$key]; // preserve shape
                    }
                    if (!array_key_exists($i, $shadowRefs[$lang][$key])) {
                        $shadowRefs[$lang][$key][$i] = $canonicalRef[$key][$i];
                    }
                    $childShadowRefs[$lang] = &$shadowRefs[$lang][$key][$i];
                }
                $childCanonical = &$canonicalRef[$key][$i];
                $this->walk(
                    canonicalRef: $childCanonical,
                    shadowRefs: $childShadowRefs,
                    segments: $segments,
                    canonicalLang: $canonicalLang,
                    availableLangs: $availableLangs,
                    fieldLabelPath: $fieldLabelPath,
                    blockIndex: $blockIndex,
                );
                unset($childCanonical);
                foreach ($childShadowRefs as $lang => $_) {
                    unset($childShadowRefs[$lang]);
                }
            }
            return;
        }

        // Plain key segment: descend
        $childShadowRefs = [];
        foreach ($shadowRefs as $lang => $_) {
            if (!isset($shadowRefs[$lang][$key])) {
                $shadowRefs[$lang][$key] = $canonicalRef[$key];
            }
            $childShadowRefs[$lang] = &$shadowRefs[$lang][$key];
        }
        $childCanonical = &$canonicalRef[$key];
        $this->walk(
            canonicalRef: $childCanonical,
            shadowRefs: $childShadowRefs,
            segments: $segments,
            canonicalLang: $canonicalLang,
            availableLangs: $availableLangs,
            fieldLabelPath: $fieldLabelPath,
            blockIndex: $blockIndex,
        );
    }

    /**
     * Terminal step: turn a leaf value (either a plain string or a { lang:
     * value } object) into per-locale scalars. Mutates canonical + shadow
     * refs in place. Throws on shape/lang errors.
     *
     * @param array<string, mixed> $shadowRefs
     */
    private function splitLeaf(
        mixed &$canonicalRef,
        array &$shadowRefs,
        string $canonicalLang,
        array $availableLangs,
        string $fieldLabelPath,
        int $blockIndex,
    ): void {
        $raw = $canonicalRef;

        // Null or empty string: nothing to split, propagate as-is.
        if ($raw === null || $raw === '') {
            $canonicalRef = $raw;
            foreach ($shadowRefs as $lang => $_) {
                $shadowRefs[$lang] = $raw;
            }
            return;
        }

        // Plain string (mono-language back-compat): canonical only.
        if (is_string($raw)) {
            $canonicalRef = $raw;
            foreach ($shadowRefs as $lang => $_) {
                $shadowRefs[$lang] = $raw; // shadow mirrors canonical when the author only gave one language
            }
            return;
        }

        // Must be a { lang: value } object at this point.
        if (!is_array($raw)) {
            throw ValidationException::withMessages([
                'payload' => __('flash.course_row_field_type', [
                    'n' => $blockIndex + 1,
                    'field' => $fieldLabelPath,
                ]),
            ]);
        }

        foreach ($availableLangs as $lang) {
            if (!array_key_exists($lang, $raw) || !is_string($raw[$lang]) || trim($raw[$lang]) === '') {
                throw ValidationException::withMessages([
                    'payload' => __('flash.course_row_missing_lang', [
                        'n' => $blockIndex + 1,
                        'field' => $fieldLabelPath,
                        'lang' => $lang,
                    ]),
                ]);
            }
        }

        $canonicalRef = trim((string) $raw[$canonicalLang]);
        foreach ($shadowRefs as $lang => $_) {
            $shadowRefs[$lang] = trim((string) $raw[$lang]);
        }
    }
}
