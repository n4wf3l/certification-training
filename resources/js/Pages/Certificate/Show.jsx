import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';

function LinkedInIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3v9zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66L19 19z" />
        </svg>
    );
}

export default function Show({ certificate, brand_name, public_url, linkedin_share_url, og }) {
    const t = useT();
    return (
        <AppLayout ambient={false}>
            <Head title={og.title}>
                <meta name="description" content={og.description} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={og.title} />
                <meta property="og:description" content={og.description} />
                <meta property="og:url" content={og.url} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={og.title} />
                <meta name="twitter:description" content={og.description} />
            </Head>

            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                            {t('certificate.kicker')}
                        </div>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                            {certificate.user_name}
                        </h1>
                        <p className="mt-1 text-sm text-ink-500">
                            {t('certificate.awarded_on', { date: certificate.awarded_date })}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={route('certificate.pdf', certificate.token)}
                            className="btn-secondary"
                            title={t('certificate.download_pdf_title')}
                        >
                            <Icon.ArrowDown className="h-4 w-4" />
                            {t('certificate.download_pdf')}
                        </a>
                        <a
                            href={linkedin_share_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004182]"
                        >
                            <LinkedInIcon className="h-4 w-4" />
                            {t('certificate.share_linkedin')}
                        </a>
                    </div>
                </div>

                <div className="rounded-3xl border-4 border-brand-500 bg-gradient-to-br from-white to-brand-500/5 p-10 shadow-xl dark:from-ink-900 dark:to-brand-500/10">
                    <div className="text-center">
                        <div className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-300">
                            {brand_name}
                        </div>
                        <div className="text-4xl font-bold tracking-wide text-ink-900 dark:text-white sm:text-5xl">
                            {t('certificate.cert_title')}
                        </div>
                        <div className="mt-6 text-sm text-ink-500">{t('certificate.awarded_to')}</div>
                        <div className="mt-2 border-b border-ink-200 pb-4 text-3xl font-bold italic text-brand-600 dark:border-ink-800 dark:text-brand-300 sm:text-4xl">
                            {certificate.user_name}
                        </div>
                        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-ink-700 dark:text-ink-200">
                            {t('certificate.body', {
                                pct: certificate.mastery_pct,
                                cert: certificate.certification.title,
                                best: certificate.best_score,
                                total: certificate.total_questions,
                            })}
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 px-5 py-3">
                                <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">{t('certificate.mastery_label')}</div>
                                <div className="mt-1 font-mono text-3xl font-bold text-brand-700 dark:text-brand-200">{certificate.mastery_pct}%</div>
                            </div>
                            <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 px-5 py-3">
                                <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">{t('certificate.best_score_label')}</div>
                                <div className="mt-1 font-mono text-3xl font-bold text-brand-700 dark:text-brand-200">{certificate.best_score}/{certificate.total_questions}</div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-wrap items-end justify-between gap-4 border-t border-ink-200 pt-6 text-sm text-ink-500 dark:border-ink-800">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest">{t('certificate.awarded_col')}</div>
                                <div className="mt-0.5 font-semibold text-ink-900 dark:text-white">{certificate.awarded_date}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-widest">{t('certificate.serial_col')}</div>
                                <div className="mt-0.5 font-mono text-xs text-ink-700 dark:text-ink-300">{certificate.token}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4 text-xs text-ink-600 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300">
                    <strong className="text-ink-900 dark:text-white">{t('certificate.verify_prefix')}</strong>{' '}
                    {t('certificate.verify_body', { url: public_url, brand: brand_name }).split(public_url).map((chunk, idx, arr) => (
                        <span key={idx}>
                            {chunk}
                            {idx < arr.length - 1 && (
                                <code className="mx-1 rounded bg-ink-200 px-1.5 py-0.5 font-mono text-[11px] dark:bg-ink-800">{public_url}</code>
                            )}
                        </span>
                    ))}
                </div>

                <div className="text-center">
                    <Link href={route('home')} className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 dark:hover:text-white">
                        {t('certificate.back_home')}
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
