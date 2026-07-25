import { useT } from '@/lib/i18n';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'certifloop.pwa_install_dismissed';
const VISIT_COUNT_KEY = 'certifloop.visits';

export default function PwaInstallPrompt() {
    const t = useT();
    const [deferred, setDeferred] = useState(null);
    const [dismissed, setDismissed] = useState(true);
    const [isIos, setIsIos] = useState(false);
    const [visitCount, setVisitCount] = useState(0);

    useEffect(() => {
        const ua = window.navigator.userAgent;
        const iOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
        const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsIos(iOS && !inStandalone);

        try {
            const n = parseInt(window.localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
            window.localStorage.setItem(VISIT_COUNT_KEY, String(n));
            setVisitCount(n);
        } catch { /* ignore */ }

        try {
            const d = window.localStorage.getItem(DISMISSED_KEY);
            setDismissed(d === '1');
        } catch { /* ignore */ }

        if (inStandalone) {
            setDismissed(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferred(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const dismiss = () => {
        setDismissed(true);
        try { window.localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* ignore */ }
    };

    const install = async () => {
        if (!deferred) return;
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === 'accepted' || outcome === 'dismissed') {
            setDeferred(null);
            if (outcome === 'accepted') dismiss();
        }
    };

    if (dismissed) return null;

    if (isIos && visitCount >= 3) {
        return (
            <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-2xl border border-brand-500/40 bg-white p-4 shadow-2xl dark:bg-ink-900">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                    </div>
                    <div className="flex-1 text-sm">
                        <div className="font-semibold text-ink-900 dark:text-white">{t('components.pwa_ios_title')}</div>
                        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                            {t('components.pwa_ios_body')}
                        </p>
                    </div>
                    <button onClick={dismiss} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200" aria-label={t('components.pwa_close')}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    if (deferred) {
        return (
            <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-2xl border border-brand-500/40 bg-white p-4 shadow-2xl dark:bg-ink-900">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" />
                            <line x1="12" y1="18" x2="12" y2="18" />
                        </svg>
                    </div>
                    <div className="flex-1 text-sm">
                        <div className="font-semibold text-ink-900 dark:text-white">{t('components.pwa_native_title')}</div>
                        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                            {t('components.pwa_native_body')}
                        </p>
                    </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                    <button onClick={dismiss} className="text-xs text-ink-500 hover:text-ink-700 dark:hover:text-ink-200">
                        {t('components.pwa_later')}
                    </button>
                    <button onClick={install} className="btn-primary !py-1.5 !text-xs">
                        {t('components.pwa_install')}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
