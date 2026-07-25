import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import CertLogo from '@/Components/CertLogo';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ plans }) {
    const t = useT();
    const locale = useLocale();
    const dateTag = locale === 'fr' ? 'fr-FR' : 'en-US';
    const del = (id) => {
        if (!confirm(t('study_plan.delete_confirm'))) return;
        router.delete(route('study-plans.destroy', id), { preserveScroll: false });
    };

    return (
        <AppLayout>
            <Head title={t('study_plan.page_title')} />
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                            {t('study_plan.header_kicker')}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                            {t('study_plan.header_title')}
                        </h1>
                        <p className="mt-1 text-sm text-ink-500">
                            {t('study_plan.header_subtitle')}
                        </p>
                    </div>
                    <Link href={route('study-plans.create')} className="btn-primary">
                        <Icon.Sparkles className="h-4 w-4" />
                        {t('study_plan.new_plan')}
                    </Link>
                </div>

                {plans.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
                            <Icon.Timer className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{t('study_plan.empty_title')}</h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                            {t('study_plan.empty_subtitle')}
                        </p>
                        <Link href={route('study-plans.create')} className="btn-primary mt-5 !inline-flex">
                            {t('study_plan.empty_cta')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {plans.map((p) => (
                            <Link
                                key={p.id}
                                href={route('study-plans.show', p.id)}
                                className="card-lift flex flex-wrap items-center gap-4 p-5"
                            >
                                <CertLogo certification={p.certification} size="md" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-base font-semibold text-ink-900 dark:text-white">
                                        {p.certification?.title}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-500">
                                        <span>
                                            <strong className={p.days_until_exam <= 7 ? 'text-rose-600' : p.days_until_exam <= 30 ? 'text-amber-600' : 'text-ink-900 dark:text-white'}>
                                                {p.days_until_exam > 0 ? t('study_plan.d_minus', { n: p.days_until_exam }) : t('study_plan.d_day')}
                                            </strong>
                                            {' · '}{t('study_plan.exam_on', { date: new Date(p.exam_date).toLocaleDateString(dateTag, { day: '2-digit', month: 'long', year: 'numeric' }) })}
                                        </span>
                                        <span>· {t('study_plan.questions_per_day', { n: p.daily_target })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); del(p.id); }}
                                        className="rounded-lg p-2 text-ink-400 hover:bg-rose-500/10 hover:text-rose-500"
                                        title={t('study_plan.delete_title')}
                                    >
                                        <Icon.Close className="h-4 w-4" />
                                    </button>
                                    <Icon.ArrowRight className="h-4 w-4 text-ink-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
