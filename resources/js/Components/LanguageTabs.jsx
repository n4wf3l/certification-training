import { LANGUAGE_CATALOG } from '@/lib/languages';
import { useT } from '@/lib/i18n';

/**
 * LanguageTabs : compact language tab bar for admin forms that edit both the
 * canonical column values and per-locale `translations` shadows.
 *
 * Props:
 *   - availableLangs : string[] (from cert.available_languages)
 *   - canonicalLang  : string   (cert.default_language)
 *   - activeLang     : string   (controlled)
 *   - onChange       : (lang: string) => void
 *   - missingLangs   : string[] (optional - locales flagged as missing content, gets a badge)
 */
export default function LanguageTabs({
    availableLangs = [],
    canonicalLang,
    activeLang,
    onChange,
    missingLangs = [],
}) {
    const t = useT();

    // Canonical first, then the rest in the order the admin configured.
    const orderedLangs = [
        canonicalLang,
        ...availableLangs.filter((l) => l !== canonicalLang),
    ].filter(Boolean);

    const missingSet = new Set(missingLangs);

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50/60 p-1 dark:border-ink-800 dark:bg-ink-950/40">
            {orderedLangs.map((code) => {
                const meta = LANGUAGE_CATALOG.find((l) => l.code === code) || {
                    code,
                    label: code.toUpperCase(),
                    native: code,
                };
                const isCanonical = code === canonicalLang;
                const active = activeLang === code;
                const isMissing = missingSet.has(code);
                return (
                    <button
                        key={code}
                        type="button"
                        onClick={() => onChange(code)}
                        className={`group relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            active
                                ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
                                : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                        }`}
                    >
                        <span className={`font-mono uppercase tracking-widest ${active ? 'text-brand-600 dark:text-brand-300' : 'text-ink-400'}`}>
                            {code}
                        </span>
                        <span>{meta.label}</span>
                        {isCanonical && (
                            <span className="ml-0.5 rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                                {t('language_tabs.canonical_badge')}
                            </span>
                        )}
                        {!isCanonical && isMissing && (
                            <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                {t('language_tabs.missing_badge')}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
