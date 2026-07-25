import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import CertLogo from '@/Components/CertLogo';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link, router } from '@inertiajs/react';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const FOCUS_KEY_MAP = {
    foundations: 'focus_foundations',
    'guiding-principles': 'focus_guiding_principles',
    'four-dimensions': 'focus_four_dimensions',
    'itil-value-system': 'focus_value_system',
    'lifecycle-activities': 'focus_lifecycle',
    practices: 'focus_practices',
    'continual-improvement': 'focus_continual',
    'digital-ai-innovation': 'focus_digital_ai',
    exam: 'focus_exam',
};

function focusLabel(t, key) {
    const dictKey = FOCUS_KEY_MAP[key];
    return dictKey ? t(`study_plan.${dictKey}`) : key;
}

export default function Show({ plan, progress }) {
    const t = useT();
    const locale = useLocale();
    const dateTag = locale === 'fr' ? 'fr-FR' : 'en-US';
    const del = () => {
        if (!confirm(t('study_plan.delete_confirm'))) return;
        router.delete(route('study-plans.destroy', plan.id));
    };

    const dRemaining = plan.days_until_exam;
    const urgency = dRemaining <= 7 ? 'rose' : dRemaining <= 30 ? 'amber' : 'brand';

    return (
        <AppLayout>
            <Head title={`${t('study_plan.breadcrumb')} - ${plan.certification.title}`} />
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center gap-2 text-xs text-ink-500">
                    <Link href={route('study-plans.index')} className="hover:text-brand-500">{t('study_plan.breadcrumb')}</Link>
                    <span>/</span>
                    <span className="text-ink-700 dark:text-ink-300">{plan.certification.title}</span>
                </div>

                <div className="card p-6">
                    <div className="flex flex-wrap items-start gap-4">
                        <CertLogo certification={plan.certification} size="lg" />
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                                {plan.certification.title}
                            </h1>
                            <p className="mt-1 text-sm text-ink-500">
                                {t('study_plan.exam_scheduled', { date: new Date(plan.exam_date).toLocaleDateString(dateTag, { day: '2-digit', month: 'long', year: 'numeric' }) })}
                            </p>
                        </div>
                        <div className={`rounded-2xl border-2 px-5 py-3 text-center ${
                            urgency === 'rose' ? 'border-rose-500 bg-rose-500/10'
                            : urgency === 'amber' ? 'border-amber-500 bg-amber-500/10'
                            : 'border-brand-500 bg-brand-500/10'
                        }`}>
                            <div className={`font-mono text-3xl font-bold ${
                                urgency === 'rose' ? 'text-rose-700 dark:text-rose-200'
                                : urgency === 'amber' ? 'text-amber-700 dark:text-amber-200'
                                : 'text-brand-700 dark:text-brand-200'
                            }`}>
                                {dRemaining > 0 ? t('study_plan.d_minus', { n: dRemaining }) : t('study_plan.d_day')}
                            </div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                                {t('study_plan.remaining_label')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-white">{t('study_plan.today_title')}</h2>
                    <div className="mb-2 flex items-baseline justify-between">
                        <span className="text-sm text-ink-500">
                            {t('study_plan.progress_today')}
                        </span>
                        <span className="font-mono text-lg font-bold text-ink-900 dark:text-white">
                            {progress.answered_today} / {progress.target_today}
                        </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                        <div
                            className={`h-full transition-all ${progress.pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-iris-500'}`}
                            style={{ width: `${progress.pct}%` }}
                        />
                    </div>
                    {plan.today_focus && (
                        <div className="mt-4 rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 text-sm">
                            <strong className="text-brand-700 dark:text-brand-200">{t('study_plan.today_focus')}</strong>{' '}
                            {focusLabel(t, plan.today_focus)}
                        </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={route('certifications.exam', plan.certification.slug)} className="btn-primary">
                            <Icon.ArrowRight className="h-4 w-4" />
                            {t('study_plan.cta_start_session')}
                        </Link>
                        {plan.today_focus && plan.today_focus !== 'exam' && (
                            <Link
                                href={route('exam.practice', [plan.certification.slug, plan.today_focus])}
                                method="post"
                                as="button"
                                className="btn-secondary"
                            >
                                <Icon.Bolt className="h-4 w-4" />
                                {t('study_plan.cta_practice', { focus: focusLabel(t, plan.today_focus) })}
                            </Link>
                        )}
                    </div>
                </div>

                {plan.weekday_focus && Object.values(plan.weekday_focus).some(Boolean) && (
                    <div className="card p-6">
                        <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-white">{t('study_plan.weekday_focus_title')}</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {DAY_KEYS.map((key) => {
                                const focus = plan.weekday_focus[key];
                                return (
                                    <div key={key} className={`flex items-center justify-between rounded-lg border p-3 ${
                                        focus ? 'border-brand-500/30 bg-brand-500/5' : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40'
                                    }`}>
                                        <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{t(`study_plan.day_${key}`)}</span>
                                        <span className={`text-xs ${focus ? 'font-semibold text-brand-700 dark:text-brand-200' : 'text-ink-400'}`}>
                                            {focus ? focusLabel(t, focus) : t('study_plan.focus_free')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="card p-6">
                    <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-white">{t('study_plan.calendar_title')}</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <div className="font-medium text-ink-900 dark:text-white">{t('study_plan.ical_title')}</div>
                                <div className="text-xs text-ink-500">{t('study_plan.ical_desc')}</div>
                            </div>
                            <a href={plan.ics_url} className="btn-secondary !py-1.5 !text-xs">
                                <Icon.ArrowDown className="h-3.5 w-3.5" />
                                .ics
                            </a>
                        </div>
                        <div className="text-xs text-ink-500">
                            {t('study_plan.email_reminder_prefix')} <strong className={plan.email_daily_reminder ? 'text-emerald-600' : 'text-ink-400'}>{plan.email_daily_reminder ? t('study_plan.enabled') : t('study_plan.disabled')}</strong>
                            {' · '}
                            {t('study_plan.email_digest_prefix')} <strong className={plan.email_weekly_digest ? 'text-emerald-600' : 'text-ink-400'}>{plan.email_weekly_digest ? t('study_plan.enabled') : t('study_plan.disabled')}</strong>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end border-t border-ink-200 pt-4 dark:border-ink-800">
                        <button type="button" onClick={del} className="text-xs text-rose-500 hover:text-rose-600">
                            {t('study_plan.delete_plan')}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
