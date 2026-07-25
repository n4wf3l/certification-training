import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { loadCache, clearCache } from '@/lib/offlineCache';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function QuestionCard({ item }) {
    const t = useT();
    const locale = useLocale();
    const dateTag = locale === 'fr' ? 'fr-FR' : 'en-US';
    const [reveal, setReveal] = useState(false);
    return (
        <div className="card p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="badge-muted !py-0 text-[10px]">
                    {item.certification?.title ?? t('offline_review.cert_fallback')}
                </span>
                {item.topic && <span className="badge-brand !py-0 text-[10px]">{item.topic}</span>}
                <span className="font-mono text-[10px] text-ink-400">
                    {t('offline_review.cached_on', { date: new Date(item.cached_at).toLocaleDateString(dateTag, { day: '2-digit', month: 'short' }) })}
                </span>
            </div>
            {item.scenario && (
                <div className="mb-3 rounded-lg border-l-4 border-brand-500 bg-brand-500/5 p-3 text-sm text-ink-700 dark:text-ink-200">
                    {item.scenario}
                </div>
            )}
            <h3 className="text-base font-semibold text-ink-900 dark:text-white">{item.question_text}</h3>
            {!reveal ? (
                <button
                    type="button"
                    onClick={() => setReveal(true)}
                    className="btn-secondary mt-4 !py-2 !text-xs"
                >
                    <Icon.Sparkles className="h-3.5 w-3.5" />
                    {t('offline_review.reveal')}
                </button>
            ) : (
                <div className="mt-4 space-y-2">
                    {item.answers.map((a, idx) => (
                        <div
                            key={idx}
                            className={`rounded-lg border-2 p-3 text-sm ${
                                a.is_correct
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                                    : a.is_chosen
                                    ? 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                                    : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${
                                    a.is_correct ? 'bg-emerald-500 text-white' : a.is_chosen ? 'bg-rose-500 text-white' : 'bg-ink-100 dark:bg-ink-800'
                                }`}>
                                    {a.letter}
                                </span>
                                <div className="flex-1">
                                    <div>{a.text}</div>
                                    {a.rationale && (
                                        <div className="mt-2 text-xs opacity-80">{a.rationale}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {item.explanation && (
                        <div className="rounded-lg border-l-4 border-brand-500 bg-brand-500/5 p-3 text-sm">
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">
                                {t('offline_review.explanation')}
                            </div>
                            {item.explanation}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function OfflineReview() {
    const t = useT();
    const locale = useLocale();
    const dateTag = locale === 'fr' ? 'fr-FR' : 'en-US';
    const [cache, setCache] = useState({ updated_at: null, items: [] });
    const [online, setOnline] = useState(true);

    useEffect(() => {
        setCache(loadCache());
        setOnline(window.navigator.onLine);
        const goOn = () => setOnline(true);
        const goOff = () => setOnline(false);
        window.addEventListener('online', goOn);
        window.addEventListener('offline', goOff);
        return () => {
            window.removeEventListener('online', goOn);
            window.removeEventListener('offline', goOff);
        };
    }, []);

    const purge = () => {
        if (!confirm(t('offline_review.clear_confirm'))) return;
        clearCache();
        setCache({ updated_at: null, items: [] });
    };

    const items = cache.items || [];

    return (
        <AppLayout ambient={false}>
            <Head title={t('offline_review.page_title')} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div>
                    <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        {t('offline_review.kicker')}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                        {t('offline_review.title')}
                    </h1>
                    <p className="mt-2 text-sm text-ink-500">
                        {t('offline_review.subtitle', { n: items.length })}
                        {cache.updated_at && (
                            <span> {t('offline_review.last_update', { date: new Date(cache.updated_at).toLocaleString(dateTag, { dateStyle: 'short', timeStyle: 'short' }) })}</span>
                        )}
                    </p>
                </div>

                {items.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
                            <Icon.Cards className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{t('offline_review.empty_title')}</h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                            {online ? t('offline_review.empty_online') : t('offline_review.empty_offline')}
                        </p>
                        {online && (
                            <Link href={route('home')} className="btn-primary mt-5 !inline-flex">
                                {t('offline_review.empty_cta')}
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {items.map((item, i) => (
                                <QuestionCard key={`${item.question_id}-${i}`} item={item} />
                            ))}
                        </div>
                        <div className="flex justify-between border-t border-ink-200 pt-4 text-xs dark:border-ink-800">
                            <span className="text-ink-500">
                                {t('offline_review.cache_note')}
                            </span>
                            <button type="button" onClick={purge} className="text-rose-500 hover:text-rose-600">
                                {t('offline_review.clear_cache')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
