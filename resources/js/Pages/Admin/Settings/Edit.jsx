import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Edit({ settings }) {
    const t = useT();
    const { data, setData, post, processing, errors, progress } = useForm({
        brand_name: settings.brand_name ?? '',
        brand_logo: null,
        remove_logo: false,
        allow_instant_feedback: !!settings.allow_instant_feedback,
        openai_api_key: '',
        clear_openai_key: false,
        openai_daily_limit_per_user: settings.openai_daily_limit_per_user ?? 10,
        _method: 'post',
    });

    const [preview, setPreview] = useState(null);

    const onFile = (e) => {
        const file = e.target.files?.[0] ?? null;
        setData('brand_logo', file);
        setData('remove_logo', false);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const removeCurrent = () => {
        setData('remove_logo', true);
        setData('brand_logo', null);
        setPreview(null);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), { forceFormData: true });
    };

    const currentLogo = settings.brand_logo_path;
    const shownLogo = preview || (data.remove_logo ? null : currentLogo ? `/storage/${currentLogo}` : null);

    return (
        <AppLayout>
            <Head title={t('admin.settings.head_title')} />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">{t('admin.common.dashboard_breadcrumb')}</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">{t('admin.settings.breadcrumb')}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        {t('admin.settings.title')}
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                        {t('admin.settings.subtitle')}
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Brand */}
                    <section className="card p-6">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-ink-900 dark:text-white">{t('admin.settings.section_brand')}</h2>
                            <p className="mt-0.5 text-xs text-ink-500">{t('admin.settings.section_brand_desc')}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
                            {/* Logo preview */}
                            <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">{t('admin.settings.preview_label')}</div>
                                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900/40">
                                    {shownLogo ? (
                                        <img src={shownLogo} alt={t('admin.settings.logo_alt')} className="h-full w-full object-contain" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-iris-500 text-white">
                                            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 14 8 10l4 4 8-8" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                {currentLogo && !data.remove_logo && !preview && (
                                    <button
                                        type="button"
                                        onClick={removeCurrent}
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-400"
                                    >
                                        <Icon.Close className="h-3 w-3" />
                                        {t('admin.settings.remove_logo')}
                                    </button>
                                )}
                                {data.remove_logo && (
                                    <p className="mt-2 text-xs text-amber-500">
                                        {t('admin.settings.logo_will_be_removed')}
                                    </p>
                                )}
                            </div>

                            {/* Inputs */}
                            <div className="space-y-5">
                                <div>
                                    <label className="field-label" htmlFor="brand_name">{t('admin.settings.brand_name_label')}</label>
                                    <input
                                        id="brand_name"
                                        type="text"
                                        className="field"
                                        value={data.brand_name}
                                        onChange={(e) => setData('brand_name', e.target.value)}
                                        placeholder={t('admin.settings.brand_name_placeholder')}
                                        maxLength={60}
                                    />
                                    <p className="mt-1 text-xs text-ink-500">
                                        {t('admin.settings.brand_name_help')}
                                    </p>
                                    {errors.brand_name && <p className="mt-1.5 text-xs text-rose-500">{errors.brand_name}</p>}
                                </div>

                                <div>
                                    <label className="field-label" htmlFor="brand_logo">
                                        {t('admin.settings.brand_logo_label')}
                                    </label>
                                    <input
                                        id="brand_logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={onFile}
                                        className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-500/20 dark:text-ink-300 dark:file:text-brand-300"
                                    />
                                    <p className="mt-1 text-xs text-ink-500">
                                        {t('admin.settings.brand_logo_help')}
                                    </p>
                                    {progress && (
                                        <div className="mt-2 h-1 w-full rounded bg-ink-200 dark:bg-ink-800">
                                            <div
                                                className="h-1 rounded bg-gradient-to-r from-brand-500 to-iris-500 transition-all"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                    )}
                                    {errors.brand_logo && <p className="mt-1.5 text-xs text-rose-500">{errors.brand_logo}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Exam behaviour */}
                    <section className="card p-6">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-ink-900 dark:text-white">{t('admin.settings.section_exam')}</h2>
                            <p className="mt-0.5 text-xs text-ink-500">{t('admin.settings.section_exam_desc')}</p>
                        </div>
                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4 transition hover:border-brand-500/40 dark:border-ink-800 dark:bg-ink-900/40">
                            <input
                                type="checkbox"
                                checked={!!data.allow_instant_feedback}
                                onChange={(e) => setData('allow_instant_feedback', e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                    {t('admin.settings.allow_instant_feedback_title')}
                                </div>
                                <p
                                    className="mt-1 text-xs text-ink-500 dark:text-ink-400"
                                    dangerouslySetInnerHTML={{ __html: t('admin.settings.allow_instant_feedback_desc_html') }}
                                />
                            </div>
                        </label>
                    </section>

                    {/* AI - Explique-moi mieux */}
                    <section className="card p-6">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-ink-900 dark:text-white">{t('admin.settings.section_ai')}</h2>
                            <p className="mt-0.5 text-xs text-ink-500">
                                {t('admin.settings.section_ai_desc')}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="field-label" htmlFor="openai_api_key">
                                    {t('admin.settings.openai_key_label')} {settings.openai_api_key_set ? (
                                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
                                            {t('admin.settings.openai_key_configured')}
                                        </span>
                                    ) : (
                                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                                            {t('admin.settings.openai_key_not_configured')}
                                        </span>
                                    )}
                                </label>
                                <input
                                    id="openai_api_key"
                                    type="password"
                                    className="field font-mono text-xs"
                                    value={data.openai_api_key}
                                    onChange={(e) => setData('openai_api_key', e.target.value)}
                                    placeholder={settings.openai_api_key_set ? t('admin.settings.openai_key_placeholder_set') : t('admin.settings.openai_key_placeholder_unset')}
                                    autoComplete="off"
                                />
                                <p className="mt-1 text-xs text-ink-500">
                                    {t('admin.settings.openai_key_help_prefix')}
                                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                                        platform.openai.com/api-keys
                                    </a>
                                    {t('admin.settings.openai_key_help_suffix')}
                                </p>
                                {settings.openai_api_key_set && (
                                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-rose-500">
                                        <input
                                            type="checkbox"
                                            checked={!!data.clear_openai_key}
                                            onChange={(e) => setData('clear_openai_key', e.target.checked)}
                                            className="h-3.5 w-3.5"
                                        />
                                        {t('admin.settings.openai_key_clear')}
                                    </label>
                                )}
                            </div>

                            <div>
                                <label className="field-label" htmlFor="openai_daily_limit_per_user">
                                    {t('admin.settings.openai_daily_limit_label')}
                                </label>
                                <input
                                    id="openai_daily_limit_per_user"
                                    type="number"
                                    min={0}
                                    max={1000}
                                    className="field w-32"
                                    value={data.openai_daily_limit_per_user}
                                    onChange={(e) => setData('openai_daily_limit_per_user', parseInt(e.target.value) || 0)}
                                />
                                <p className="mt-1 text-xs text-ink-500">
                                    {t('admin.settings.openai_daily_limit_help')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Submit bar */}
                    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-2xl border border-ink-200/60 bg-white/90 p-3 shadow-xl backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/90">
                        <Link href={route('admin.dashboard')} className="btn-secondary">
                            {t('admin.common.cancel')}
                        </Link>
                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? t('admin.common.saving') : t('admin.common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
