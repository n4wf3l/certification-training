import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';

export default function Offline() {
    const t = useT();
    return (
        <AppLayout ambient={false}>
            <Head title={t('offline.page_title')} />
            <div className="mx-auto max-w-2xl py-16 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 1l22 22" />
                        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <path d="M12 20h.01" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                    {t('offline.title')}
                </h1>
                <p className="mt-3 text-ink-600 dark:text-ink-300">
                    {t('offline.subtitle')}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link href={route('offline.review')} className="btn-primary">
                        <Icon.Cards className="h-4 w-4" />
                        {t('offline.cta_review')}
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="btn-secondary"
                    >
                        <Icon.Refresh className="h-4 w-4" />
                        {t('offline.cta_retry')}
                    </button>
                </div>
                <p className="mt-8 text-xs text-ink-400">
                    {t('offline.note')}
                </p>
            </div>
        </AppLayout>
    );
}
