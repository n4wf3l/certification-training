import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

// Monitor icon for the "system" mode. Kept local because it's the only icon
// with a distinct semantic here (follow OS) and doesn't warrant living in Icons.jsx.
function SystemIcon({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
             strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
        </svg>
    );
}

function iconFor(mode) {
    if (mode === 'dark') return Icon.Moon;
    if (mode === 'light') return Icon.Sun;
    return SystemIcon;
}

/**
 * ThemeSwitcher : compact 3-state cycler for the desktop navbar.
 * Cycles system -> dark -> light -> system. Persisted via useTheme.
 *
 * The button carries a small terminal-style caption below on hover that
 * echoes the current mode (e.g. `$ theme --set=dark`) - reinforces the
 * "geek console" tone of the dark aesthetic.
 */
export default function ThemeSwitcher({ variant = 'button' }) {
    const t = useT();
    const [mode, effective, setMode, cycleMode] = useTheme();
    const ActiveIcon = iconFor(mode);

    const label = t(`theme_switcher.${mode}`);
    const title = t('theme_switcher.aria', { mode: label });

    if (variant === 'inline') {
        return (
            <div className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900/40">
                {['system', 'dark', 'light'].map((m) => {
                    const I = iconFor(m);
                    const active = mode === m;
                    return (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            aria-label={t('theme_switcher.aria', { mode: t(`theme_switcher.${m}`) })}
                            className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                                active
                                    ? 'bg-ink-900 text-white shadow-inner dark:bg-white dark:text-ink-900'
                                    : 'text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
                            }`}
                        >
                            <I className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t(`theme_switcher.${m}`)}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={cycleMode}
            title={title}
            aria-label={title}
            className="theme-toggle group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-white text-ink-600 transition hover:border-brand-500/40 hover:text-brand-600 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300 dark:hover:border-brand-400/60 dark:hover:text-brand-300"
        >
            {/* Neon halo (dark mode only) */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_center,rgba(18,204,176,0.35),transparent_70%)]"
            />
            {/* Rotating icon */}
            <span
                key={mode}
                className="relative inline-flex h-full w-full items-center justify-center transition-transform duration-300"
            >
                <ActiveIcon className="h-4 w-4" />
            </span>
            {/* Terminal caption on hover */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-tight text-brand-300 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-ink-950 dark:text-brand-300"
            >
                $ theme --set={mode}
            </span>
        </button>
    );
}

