<?php

namespace App\Http\Controllers\Concerns;

trait ExtractsJsonArray
{
    /**
     * Extract the first top-level JSON array [...] from arbitrary text.
     * Handles markdown fences, prefixes, footnotes (`[1]: https://…`) and
     * any other prose ChatGPT tends to append after the actual payload.
     * Bracket depth is tracked while skipping strings and escaped chars.
     */
    protected function extractTopLevelArray(string $raw): string
    {
        $s = trim($raw);
        // Remove opening/closing markdown fences
        $s = preg_replace('/^```(?:json|js|javascript)?\s*\n?/i', '', $s);
        $s = preg_replace('/\n?```\s*$/i', '', $s);
        $s = trim($s);

        $start = strpos($s, '[');
        if ($start === false) {
            return $s;
        }
        $depth = 0;
        $inString = false;
        $escape = false;
        $length = strlen($s);
        for ($i = $start; $i < $length; $i++) {
            $ch = $s[$i];
            if ($escape) { $escape = false; continue; }
            if ($ch === '\\') { $escape = true; continue; }
            if ($ch === '"') { $inString = ! $inString; continue; }
            if ($inString) { continue; }
            if ($ch === '[') { $depth++; }
            elseif ($ch === ']') {
                $depth--;
                if ($depth === 0) {
                    return substr($s, $start, $i - $start + 1);
                }
            }
        }
        // Unclosed — return from first '[' onward so json_decode can complain cleanly
        return substr($s, $start);
    }
}
