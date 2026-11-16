import { useEffect, useState } from 'react';

/**
 * Chrono d'examen qui decompte depuis :minutes (60:00 par defaut), comme dans
 * la vraie salle. Purement decoratif (aria-hidden sur les chiffres) ; avec
 * prefers-reduced-motion il reste fige sur la duree de depart.
 */
export default function ExamClock({ minutes = 60, label }) {
    const total = minutes * 60;
    const [left, setLeft] = useState(total);

    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        const started = Date.now();
        const id = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - started) / 1000);
            setLeft(total - (elapsed % total));
        }, 1000);
        return () => window.clearInterval(id);
    }, [total]);

    const mm = String(Math.floor(left / 60)).padStart(2, '0');
    const ss = String(left % 60).padStart(2, '0');

    return (
        <div className="inline-flex items-center gap-2.5 rounded-md border border-ink-200 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500 dark:border-ink-800 dark:text-ink-400">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
            </span>
            <span>{label}</span>
            <span aria-hidden="true" className="text-sm font-semibold tabular-nums tracking-normal text-ink-900 dark:text-white">
                {mm}:{ss}
            </span>
        </div>
    );
}
