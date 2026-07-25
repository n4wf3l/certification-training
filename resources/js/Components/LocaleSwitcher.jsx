import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { SUPPORTED_LOCALES, useLocale, useT } from '@/lib/i18n';

/**
 * Dropdown de switch de langue. Poste sur /locale (persiste session + user + cookie),
 * puis Inertia recharge la page avec la nouvelle locale. Petit, discret, utilisable
 * navbar et footer.
 *
 * variant :
 *   - 'button' (defaut) : bouton texte "EN | FR" dans un dropdown
 *   - 'inline' : deux pills EN / FR cote a cote, style footer
 */
export default function LocaleSwitcher({ variant = 'button' }) {
    const currentLocale = useLocale();
    const t = useT();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (variant !== 'button') return;
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [variant]);

    const change = (locale) => {
        if (locale === currentLocale) {
            setOpen(false);
            return;
        }
        router.post(route('locale.update'), { locale }, {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => setOpen(false),
        });
    };

    if (variant === 'inline') {
        return (
            <div className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white/60 p-0.5 text-[11px] dark:border-ink-800 dark:bg-ink-900/50">
                {SUPPORTED_LOCALES.map((code) => {
                    const active = code === currentLocale;
                    return (
                        <button
                            key={code}
                            type="button"
                            onClick={() => change(code)}
                            className={`rounded-full px-2 py-0.5 font-mono uppercase tracking-widest transition ${
                                active
                                    ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                                    : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'
                            }`}
                            aria-pressed={active}
                            title={t(`locale.${code}`)}
                        >
                            {code}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800/60 dark:hover:text-white"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={t('locale.switcher_label')}
            >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
                </svg>
                <span className="font-mono uppercase tracking-widest">{currentLocale}</span>
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[9rem] animate-scale-in overflow-hidden rounded-xl border border-ink-200/70 bg-white/95 py-1 shadow-xl backdrop-blur-xl dark:border-ink-800/70 dark:bg-ink-900/95"
                >
                    {SUPPORTED_LOCALES.map((code) => {
                        const active = code === currentLocale;
                        return (
                            <button
                                key={code}
                                type="button"
                                onClick={() => change(code)}
                                className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition ${
                                    active
                                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                                        : 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800/70'
                                }`}
                            >
                                <span>{t(`locale.${code}`)}</span>
                                <span className={`font-mono text-[10px] uppercase tracking-widest ${active ? 'text-brand-500' : 'text-ink-400'}`}>
                                    {code}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
