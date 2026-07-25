import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import Select from '@/Components/Select';
import { useT } from '@/lib/i18n';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Create({ certifications, existing_plan_cert_ids = [] }) {
    const t = useT();
    const focusOptions = [
        { value: '', label: t('study_plan.focus_placeholder') },
        { value: 'foundations', label: t('study_plan.focus_foundations') },
        { value: 'guiding-principles', label: t('study_plan.focus_guiding_principles') },
        { value: 'four-dimensions', label: t('study_plan.focus_four_dimensions') },
        { value: 'itil-value-system', label: t('study_plan.focus_value_system') },
        { value: 'lifecycle-activities', label: t('study_plan.focus_lifecycle') },
        { value: 'practices', label: t('study_plan.focus_practices') },
        { value: 'continual-improvement', label: t('study_plan.focus_continual') },
        { value: 'digital-ai-innovation', label: t('study_plan.focus_digital_ai') },
        { value: 'exam', label: t('study_plan.focus_exam') },
    ];
    const availableCerts = useMemo(
        () => certifications.filter((c) => !existing_plan_cert_ids.includes(c.id)),
        [certifications, existing_plan_cert_ids]
    );

    const { data, setData, post, processing, errors } = useForm({
        certification_id: availableCerts[0]?.id ?? '',
        exam_date: '',
        daily_target: 20,
        weekday_focus: {},
        email_daily_reminder: true,
        email_weekly_digest: true,
    });

    const suggestion = useMemo(() => {
        if (!data.exam_date) return null;
        const days = Math.max(1, Math.ceil((new Date(data.exam_date) - new Date()) / 86400000));
        return { days, per_day: Math.max(10, Math.min(40, Math.ceil(120 / Math.max(1, days / 7)))) };
    }, [data.exam_date]);

    const submit = (e) => {
        e.preventDefault();
        post(route('study-plans.store'));
    };

    return (
        <AppLayout>
            <Head title={t('study_plan.create_page_title')} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('study-plans.index')} className="hover:text-brand-500">{t('study_plan.breadcrumb')}</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">{t('study_plan.create_breadcrumb_new')}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                        {t('study_plan.create_page_title')}
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                        {t('study_plan.create_subtitle')}
                    </p>
                </div>

                {availableCerts.length === 0 ? (
                    <div className="card p-8 text-center">
                        <p className="text-ink-500">{t('study_plan.create_no_certs')}</p>
                        <Link href={route('study-plans.index')} className="btn-secondary mt-4 !inline-flex">{t('study_plan.create_back')}</Link>
                    </div>
                ) : (
                    <form onSubmit={submit} className="card space-y-6 p-6">
                        <div>
                            <label className="field-label">{t('study_plan.field_certification')}</label>
                            <Select
                                value={data.certification_id}
                                onChange={(v) => setData('certification_id', v)}
                                options={availableCerts.map((c) => ({ value: c.id, label: c.title, logo: c }))}
                                placeholder={t('study_plan.field_cert_placeholder')}
                            />
                            {errors.certification_id && <p className="mt-1 text-xs text-rose-500">{errors.certification_id}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="field-label" htmlFor="exam_date">{t('study_plan.field_exam_date')}</label>
                                <input
                                    id="exam_date"
                                    type="date"
                                    className="field"
                                    value={data.exam_date}
                                    onChange={(e) => setData('exam_date', e.target.value)}
                                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                                />
                                {suggestion && (
                                    <p className="mt-1 text-xs text-ink-500">
                                        {t('study_plan.suggestion_prefix', { days: suggestion.days, n: suggestion.per_day })}
                                    </p>
                                )}
                                {errors.exam_date && <p className="mt-1 text-xs text-rose-500">{errors.exam_date}</p>}
                            </div>
                            <div>
                                <label className="field-label" htmlFor="daily_target">{t('study_plan.field_daily_target')}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="daily_target"
                                        type="number"
                                        min="1"
                                        max="200"
                                        className="field flex-1"
                                        value={data.daily_target}
                                        onChange={(e) => setData('daily_target', parseInt(e.target.value) || 0)}
                                    />
                                    <span className="text-sm text-ink-500">{t('study_plan.daily_target_unit')}</span>
                                </div>
                                {suggestion && (
                                    <button
                                        type="button"
                                        onClick={() => setData('daily_target', suggestion.per_day)}
                                        className="mt-1 text-xs text-brand-600 underline underline-offset-2 hover:text-brand-500"
                                    >
                                        {t('study_plan.suggestion_use', { n: suggestion.per_day })}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="field-label">{t('study_plan.weekday_optional_label')}</label>
                            <p className="mb-3 text-xs text-ink-500">
                                {t('study_plan.weekday_hint')}
                            </p>
                            <div className="space-y-2">
                                {WEEKDAYS.map((key) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="w-24 text-sm font-medium text-ink-700 dark:text-ink-200">{t(`study_plan.day_${key}`)}</span>
                                        <div className="flex-1">
                                            <Select
                                                value={data.weekday_focus[key] ?? ''}
                                                onChange={(v) => setData('weekday_focus', { ...data.weekday_focus, [key]: v })}
                                                options={focusOptions}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-ink-200 pt-4 dark:border-ink-800">
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.email_daily_reminder}
                                    onChange={(e) => setData('email_daily_reminder', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded"
                                />
                                <div>
                                    <div className="text-sm font-semibold text-ink-900 dark:text-white">{t('study_plan.reminder_daily_title')}</div>
                                    <div className="text-xs text-ink-500">{t('study_plan.reminder_daily_desc')}</div>
                                </div>
                            </label>
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.email_weekly_digest}
                                    onChange={(e) => setData('email_weekly_digest', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded"
                                />
                                <div>
                                    <div className="text-sm font-semibold text-ink-900 dark:text-white">{t('study_plan.reminder_digest_title')}</div>
                                    <div className="text-xs text-ink-500">{t('study_plan.reminder_digest_desc')}</div>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-ink-200 pt-4 dark:border-ink-800">
                            <Link href={route('study-plans.index')} className="btn-secondary">{t('study_plan.cancel')}</Link>
                            <button type="submit" disabled={processing || !data.certification_id || !data.exam_date} className="btn-primary">
                                {processing ? t('study_plan.submit_creating') : t('study_plan.submit_create')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
