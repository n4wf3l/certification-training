import Icon from '@/Components/Icons';
import { useT, useLocale } from '@/lib/i18n';

const FREE_UNTIL_USERS = 10000;

export default function PlatformPromise({ compact = false }) {
    const t = useT();
    const locale = useLocale();
    const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-US';
    const usersLabel = FREE_UNTIL_USERS.toLocaleString(numberLocale);

    if (compact) {
        return (
            <div className="card relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-30" />
                <div className="relative flex flex-wrap items-center gap-3">
                    <span className="badge-brand font-semibold">
                        <Icon.Sparkles className="h-3.5 w-3.5" />
                        {t('platform_promise.kicker')}
                    </span>
                    <span className="text-sm text-ink-700 dark:text-ink-200">
                        {t('platform_promise.compact_body_pre')}{' '}
                        <span className="font-mono font-bold text-ink-900 dark:text-white">{usersLabel}</span>{' '}
                        {t('platform_promise.compact_body_users')}{' '}
                        {t('platform_promise.compact_body_mid')} PeopleCert / Cisco / CompTIA / AWS.
                    </span>
                </div>
            </div>
        );
    }

    const promises = [
        { Icon: Icon.Timer, title: t('platform_promise.promise_time_title'), desc: t('platform_promise.promise_time_desc') },
        { Icon: Icon.Refresh, title: t('platform_promise.promise_vocab_title'), desc: t('platform_promise.promise_vocab_desc') },
        { Icon: Icon.Book, title: t('platform_promise.promise_content_title'), desc: t('platform_promise.promise_content_desc') },
        { Icon: Icon.Target, title: t('platform_promise.promise_progress_title'), desc: t('platform_promise.promise_progress_desc') },
    ];

    return (
        <section className="card relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-40" />
            <div className="relative border-b border-ink-200/60 p-6 dark:border-ink-800/60">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="badge-brand">
                            <Icon.Sparkles className="h-3.5 w-3.5" />
                            {t('platform_promise.kicker')}
                        </div>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                            {t('platform_promise.title_pre')} <span className="gradient-text">{t('platform_promise.title_highlight')}</span> {t('platform_promise.title_post')}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
                            {t('platform_promise.subtitle', { phase: t('platform_promise.subtitle_phase'), n: usersLabel })}
                        </p>
                    </div>
                </div>
            </div>
            <div className="relative grid gap-4 p-6 sm:grid-cols-2">
                {promises.map((p) => (
                    <div
                        key={p.title}
                        className="flex items-start gap-3 rounded-xl border border-ink-200/60 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow">
                            <p.Icon className="h-4 w-4" />
                        </span>
                        <div>
                            <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                {p.title}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-400">
                                {p.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
