import { useT } from '@/lib/i18n';
import { useEffect, useState } from 'react';

/**
 * Ecoute online/offline events + affiche un bandeau non-intrusif quand hors ligne.
 * Persistant en haut sous le navbar tant que le reseau est down.
 */
export default function OfflineIndicator() {
    const t = useT();
    const [online, setOnline] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setOnline(window.navigator.onLine);
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    if (online) return null;

    return (
        <div className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-amber-500/20 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1l22 22" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M12 20h.01" />
            </svg>
            {t('components.offline_banner')}
        </div>
    );
}
