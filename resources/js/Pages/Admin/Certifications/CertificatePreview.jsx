import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';

/**
 * Admin-side preview of the CertifLoop preparation certificate for a given
 * certification. Renders the exact same Blade template as the real user
 * download (via iframe with ?format=raw), plus a "Download PDF" button that
 * exercises the same DomPDF pipeline (via ?format=pdf).
 *
 * The preview is fed with mock data server-side (admin name, 100 %, today's
 * date) and always renders in EN (product rule: the certificate is a
 * professional signal targeted at recruiters).
 */
export default function CertificatePreview({ certification, preview_html_url, preview_pdf_url }) {
    const t = useT();

    return (
        <AppLayout>
            <Head title={t('admin.certificate_preview.head_title', { title: certification.title })} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">
                            {t('admin.common.dashboard_breadcrumb')}
                        </Link>
                        <span>/</span>
                        <Link href={route('admin.certifications.index')} className="hover:text-brand-500">
                            {t('admin.certs_index.title')}
                        </Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">
                            {certification.title}
                        </span>
                        <span>/</span>
                        <span className="text-ink-900 dark:text-white">
                            {t('admin.certificate_preview.breadcrumb')}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                                <Icon.Shield className="h-3.5 w-3.5" />
                                {t('admin.certificate_preview.kicker')}
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {t('admin.certificate_preview.title')}
                            </h1>
                            <p className="mt-1 text-sm text-ink-500">
                                {t('admin.certificate_preview.subtitle', { title: certification.title })}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={preview_pdf_url}
                                className="btn-primary"
                            >
                                <Icon.ArrowDown className="h-4 w-4" />
                                {t('admin.certificate_preview.download_pdf')}
                            </a>
                            <Link
                                href={route('admin.certifications.edit', certification.id)}
                                className="btn-secondary"
                            >
                                <Icon.ArrowLeft className="h-4 w-4" />
                                {t('admin.common.back')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mock-data banner (amber) : reminds the admin nothing is saved */}
                <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300">
                            <Icon.Bolt className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-200">
                                {t('admin.certificate_preview.banner_kicker')}
                            </div>
                            <p className="mt-1 text-sm text-ink-800 dark:text-ink-100">
                                {t('admin.certificate_preview.banner_body')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* HTML preview via iframe. A4 landscape ratio (297:210 = 1.4) with
                    max-width fixed at 1000px so it fits typical laptop screens.
                    Iframe isolates the certificate's CSS from the admin layout. */}
                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 shadow-inner dark:border-ink-800 dark:bg-ink-950/40">
                    <div className="flex items-center justify-between border-b border-ink-200 bg-white/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 dark:bg-ink-900/40">
                        <span>{t('admin.certificate_preview.iframe_label')}</span>
                        <span>{t('admin.certificate_preview.iframe_size')}</span>
                    </div>
                    <div className="p-4 sm:p-8">
                        <div className="mx-auto w-full max-w-[1000px]" style={{ aspectRatio: '297 / 210' }}>
                            <iframe
                                src={preview_html_url}
                                title={t('admin.certificate_preview.iframe_title')}
                                className="h-full w-full rounded-lg border border-ink-200 bg-white shadow-lg dark:border-ink-800"
                            />
                        </div>
                    </div>
                </div>

                {/* Info block : lang notice */}
                <div className="rounded-xl border border-ink-200 bg-white/50 p-4 text-xs text-ink-500 dark:border-ink-800 dark:bg-ink-900/30">
                    <div className="flex items-start gap-2">
                        <Icon.Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                        <p>{t('admin.certificate_preview.en_notice')}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
