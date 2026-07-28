import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import LanguageTabs from '@/Components/LanguageTabs';
import { LANGUAGE_CATALOG, DEFAULT_LANGUAGE } from '@/lib/languages';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

// Champs traduisibles (canonique <-> translations[lang]) sur le form cert.
// Le reste (slug, durees, dates, logo, blueprint, is_active) est mono-langue.
const TRANSLATABLE_FIELDS = ['title', 'description', 'long_description', 'importance', 'validity_note', 'target_roles_text'];

export default function Form({ certification, question_counts_by_domain = {} }) {
    const t = useT();
    const locale = useLocale();
    const editing = !!certification;

    const canonicalLang = certification?.default_language ?? DEFAULT_LANGUAGE;

    const { data, setData, post, processing, errors, progress } = useForm({
        title: certification?.title ?? '',
        slug: certification?.slug ?? '',
        description: certification?.description ?? '',
        long_description: certification?.long_description ?? '',
        importance: certification?.importance ?? '',
        target_roles_text: certification?.target_roles_text ?? '',
        questions_updated_at: certification?.questions_updated_at
            ? new Date(certification.questions_updated_at).toISOString().slice(0, 16)
            : '',
        duration_minutes: certification?.duration_minutes ?? 60,
        passing_score: certification?.passing_score ?? 26,
        total_questions: certification?.total_questions ?? 40,
        navigation_mode: certification?.navigation_mode ?? 'free',
        validity_months: certification?.validity_months ?? '',
        validity_note: certification?.validity_note ?? '',
        version_retires_at: certification?.version_retires_at
            ? String(certification.version_retires_at).slice(0, 10)
            : '',
        is_active: certification?.is_active ?? true,
        logo: null,
        remove_course: false,
        syllabus_blueprint: certification?.syllabus_blueprint ?? null,
        available_languages: certification?.available_languages?.length
            ? certification.available_languages
            : [DEFAULT_LANGUAGE],
        // Shadow translations : { lang: { title, description, ... } }. Hydrate
        // depuis certification.translations si edit, sinon objet vide.
        translations: certification?.translations ?? {},
        _method: editing ? 'put' : 'post',
    });

    // Onglet de langue actif dans le form multi-langue (par defaut : canonique).
    const [activeLang, setActiveLang] = useState(canonicalLang);
    const isCanonicalTab = activeLang === canonicalLang;

    // Lecture/ecriture d'un champ traduisible selon l'onglet actif.
    const getField = (name) => isCanonicalTab
        ? (data[name] ?? '')
        : (data.translations?.[activeLang]?.[name] ?? '');

    const setField = (name, value) => {
        if (isCanonicalTab) {
            setData(name, value);
            return;
        }
        setData('translations', {
            ...(data.translations ?? {}),
            [activeLang]: {
                ...(data.translations?.[activeLang] ?? {}),
                [name]: value,
            },
        });
    };

    // Locales avec au moins 1 champ traduisible non-vide (sert au badge "missing"
    // sur les onglets non-canoniques dont l'onglet est totalement vide).
    const missingLangs = useMemo(() => {
        const missing = [];
        for (const lang of data.available_languages || []) {
            if (lang === canonicalLang) continue;
            const bucket = data.translations?.[lang] ?? {};
            const hasContent = TRANSLATABLE_FIELDS.some((f) => (bucket[f] ?? '').toString().trim() !== '');
            if (!hasContent) missing.push(lang);
        }
        return missing;
    }, [data.translations, data.available_languages, canonicalLang]);

    // Si l'admin decoche l'onglet actuel, retomber sur le canonique.
    useEffect(() => {
        if (!(data.available_languages || []).includes(activeLang)) {
            setActiveLang(canonicalLang);
        }
    }, [data.available_languages, activeLang, canonicalLang]);

    const selectedLanguages = useMemo(
        () => new Set(data.available_languages || []),
        [data.available_languages]
    );

    const toggleLanguage = (code) => {
        const next = new Set(selectedLanguages);
        if (next.has(code)) {
            // Interdit de tout decocher : au moins 1 langue pour que le prompt reste utilisable.
            if (next.size <= 1) return;
            next.delete(code);
        } else {
            next.add(code);
        }
        setData('available_languages', Array.from(next));
    };

    // Blueprint editor : local rows state derived from the object.
    const [blueprintRows, setBlueprintRows] = useState(() => {
        const bp = certification?.syllabus_blueprint ?? {};
        return Object.entries(bp).map(([key, pct]) => ({ key, pct: Number(pct) }));
    });

    // Sync rows → form data whenever rows change
    useEffect(() => {
        const obj = {};
        blueprintRows.forEach(({ key, pct }) => {
            const k = (key || '').trim();
            if (k) obj[k] = Number(pct) || 0;
        });
        setData('syllabus_blueprint', Object.keys(obj).length ? obj : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blueprintRows]);

    const blueprintTotal = blueprintRows.reduce((s, r) => s + (Number(r.pct) || 0), 0);
    const examSize = Number(data.total_questions) || 40;
    const addRow = () => setBlueprintRows([...blueprintRows, { key: '', pct: 0 }]);
    const removeRow = (i) => setBlueprintRows(blueprintRows.filter((_, idx) => idx !== i));
    const updateRow = (i, patch) => setBlueprintRows(
        blueprintRows.map((r, idx) => idx === i ? { ...r, ...patch } : r)
    );

    const submit = (e) => {
        e.preventDefault();
        const url = editing
            ? route('admin.certifications.update', certification.id)
            : route('admin.certifications.store');
        post(url, { forceFormData: true });
    };

    const headTitle = editing
        ? t('admin.certs_form.head_title_edit', { title: certification.title })
        : t('admin.certs_form.head_title_new');
    const pageTitle = editing
        ? t('admin.certs_form.head_title_edit', { title: certification.title })
        : t('admin.certs_form.head_title_new');

    return (
        <AppLayout>
            <Head title={headTitle} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">{t('admin.common.dashboard_breadcrumb')}</Link>
                        <span>/</span>
                        <Link href={route('admin.certifications.index')} className="hover:text-brand-500">{t('admin.certs_index.title')}</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">
                            {editing ? certification.title : t('admin.certs_form.breadcrumb_new')}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                            {pageTitle}
                        </h1>
                        <Link
                            href={route('admin.certifications.index')}
                            className="btn-ghost !py-2"
                        >
                            <Icon.ArrowLeft className="h-4 w-4" />
                            {t('admin.common.back')}
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Language tabs : visible only if the cert has > 1 available language.
                        Switches the 6 translatable fields between canonical column and translations[lang]. */}
                    {(data.available_languages?.length ?? 0) > 1 && (
                        <section className="card overflow-hidden p-5">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-ink-900 dark:text-white">
                                        {t('admin.certs_form.content_language_title')}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-ink-500">
                                        {t('admin.certs_form.content_language_desc')}
                                    </p>
                                </div>
                            </div>
                            <LanguageTabs
                                availableLangs={data.available_languages || []}
                                canonicalLang={canonicalLang}
                                activeLang={activeLang}
                                onChange={setActiveLang}
                                missingLangs={missingLangs}
                            />
                            {!isCanonicalTab && (
                                <div className="mt-3 rounded-lg border-l-2 border-brand-500/50 bg-brand-500/5 px-3 py-2 text-xs text-ink-600 dark:text-ink-300">
                                    {t('admin.certs_form.content_language_hint', { lang: activeLang.toUpperCase() })}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Identity */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.certs_form.section_identity')}
                            description={t('admin.certs_form.section_identity_desc')}
                        />
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label={t('admin.certs_form.field_title')} required error={errors.title} className="sm:col-span-2">
                                <input
                                    className="field"
                                    value={getField('title')}
                                    onChange={(e) => setField('title', e.target.value)}
                                    placeholder={t('admin.certs_form.field_title_placeholder')}
                                />
                            </Field>
                            <Field label={t('admin.certs_form.field_slug')} hint={t('admin.certs_form.field_slug_hint')} error={errors.slug}>
                                <input
                                    className="field font-mono"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder={t('admin.certs_form.field_slug_placeholder')}
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label={t('admin.certs_form.field_description')} error={errors.description}>
                                <textarea
                                    rows={2}
                                    className="field resize-y"
                                    value={getField('description')}
                                    onChange={(e) => setField('description', e.target.value)}
                                    placeholder={t('admin.certs_form.field_description_placeholder')}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Rich content */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.certs_form.section_content')}
                            description={t('admin.certs_form.section_content_desc')}
                        />
                        <div className="mt-4 space-y-4">
                            <Field label={t('admin.certs_form.field_long_description')} error={errors.long_description}>
                                <textarea
                                    rows={5}
                                    className="field resize-y"
                                    value={getField('long_description')}
                                    onChange={(e) => setField('long_description', e.target.value)}
                                />
                            </Field>
                            <Field label={t('admin.certs_form.field_importance')} error={errors.importance}>
                                <textarea
                                    rows={4}
                                    className="field resize-y"
                                    value={getField('importance')}
                                    onChange={(e) => setField('importance', e.target.value)}
                                />
                            </Field>
                            <Field label={t('admin.certs_form.field_target_roles')} hint={t('admin.certs_form.field_target_roles_hint')} error={errors.target_roles_text}>
                                <textarea
                                    rows={5}
                                    className="field font-mono resize-y"
                                    placeholder={t('admin.certs_form.field_target_roles_placeholder')}
                                    value={getField('target_roles_text')}
                                    onChange={(e) => setField('target_roles_text', e.target.value)}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Available languages */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.certs_form.section_languages')}
                            description={t('admin.certs_form.section_languages_desc')}
                        />
                        <div className="mt-4">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                {LANGUAGE_CATALOG.map((lang) => {
                                    const active = selectedLanguages.has(lang.code);
                                    return (
                                        <label
                                            key={lang.code}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                                                active
                                                    ? 'border-brand-500 bg-brand-500/10 text-ink-900 dark:text-white'
                                                    : 'border-ink-200 bg-white hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900/40 dark:hover:border-ink-700'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={active}
                                                onChange={() => toggleLanguage(lang.code)}
                                            />
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-semibold uppercase tracking-wider ${
                                                    active
                                                        ? 'bg-brand-500 text-white'
                                                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                                                }`}
                                            >
                                                {lang.code}
                                            </span>
                                            <span className="flex flex-col leading-tight">
                                                <span className="font-semibold">{lang.label}</span>
                                                <span className="text-[11px] text-ink-500" lang={lang.code}>
                                                    {lang.native}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.available_languages && (
                                <p className="mt-2 text-xs text-rose-500">{errors.available_languages}</p>
                            )}
                            <p className="mt-3 text-xs text-ink-500">
                                {t(
                                    selectedLanguages.size > 1
                                        ? 'admin.certs_form.languages_active_plural'
                                        : 'admin.certs_form.languages_active_singular',
                                    { count: selectedLanguages.size }
                                )}
                            </p>
                        </div>
                    </section>

                    {/* Exam config */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.certs_form.section_exam')}
                            description={t('admin.certs_form.section_exam_desc')}
                        />
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label={t('admin.certs_form.field_duration')} required error={errors.duration_minutes}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field font-mono"
                                    value={data.duration_minutes}
                                    onChange={(e) => setData('duration_minutes', +e.target.value)}
                                />
                            </Field>
                            <Field label={t('admin.certs_form.field_passing_score')} required error={errors.passing_score}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field font-mono"
                                    value={data.passing_score}
                                    onChange={(e) => setData('passing_score', +e.target.value)}
                                />
                            </Field>
                            <Field label={t('admin.certs_form.field_total_questions')} required error={errors.total_questions}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field font-mono"
                                    value={data.total_questions}
                                    onChange={(e) => setData('total_questions', +e.target.value)}
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field
                                label={t('admin.certs_form.field_navigation_mode')}
                                error={errors.navigation_mode}
                            >
                                <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">
                                    {data.navigation_mode === 'sequential_locked'
                                        ? t('admin.certs_form.field_navigation_mode_help_locked')
                                        : t('admin.certs_form.field_navigation_mode_help_free')}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <label className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                                        data.navigation_mode === 'free'
                                            ? 'border-brand-500 bg-brand-500/5'
                                            : 'border-ink-200 hover:border-ink-300 dark:border-ink-800'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="navigation_mode"
                                            value="free"
                                            checked={data.navigation_mode === 'free'}
                                            onChange={() => setData('navigation_mode', 'free')}
                                            className="sr-only"
                                        />
                                        <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                            {t('admin.certs_form.field_navigation_mode_free_title')}
                                        </div>
                                        <div className="mt-1 text-xs text-ink-500">
                                            {t('admin.certs_form.field_navigation_mode_free_subtitle')}
                                        </div>
                                    </label>
                                    <label className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                                        data.navigation_mode === 'sequential_locked'
                                            ? 'border-brand-500 bg-brand-500/5'
                                            : 'border-ink-200 hover:border-ink-300 dark:border-ink-800'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="navigation_mode"
                                            value="sequential_locked"
                                            checked={data.navigation_mode === 'sequential_locked'}
                                            onChange={() => setData('navigation_mode', 'sequential_locked')}
                                            className="sr-only"
                                        />
                                        <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                            {t('admin.certs_form.field_navigation_mode_locked_title')}
                                        </div>
                                        <div className="mt-1 text-xs text-ink-500">
                                            {t('admin.certs_form.field_navigation_mode_locked_subtitle')}
                                        </div>
                                    </label>
                                </div>
                            </Field>
                        </div>
                    </section>

                    {/* Freshness + validity */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.certs_form.section_freshness')}
                            description={t('admin.certs_form.section_freshness_desc')}
                        />
                        <div className="mt-4 space-y-4">
                            <Field label={t('admin.certs_form.field_questions_updated_at')} error={errors.questions_updated_at}>
                                <input
                                    type="datetime-local"
                                    className="field"
                                    value={data.questions_updated_at}
                                    onChange={(e) => setData('questions_updated_at', e.target.value)}
                                />
                            </Field>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Field label={t('admin.certs_form.field_validity_months')} hint={t('admin.certs_form.field_validity_months_hint')} error={errors.validity_months}>
                                    <input
                                        type="number"
                                        min="1"
                                        className="field font-mono"
                                        placeholder="36"
                                        value={data.validity_months}
                                        onChange={(e) => setData('validity_months', e.target.value === '' ? '' : +e.target.value)}
                                    />
                                </Field>
                                <Field label={t('admin.certs_form.field_validity_note')} error={errors.validity_note} className="sm:col-span-2">
                                    <textarea
                                        rows={3}
                                        className="field resize-y"
                                        placeholder={t('admin.certs_form.field_validity_note_placeholder')}
                                        value={getField('validity_note')}
                                        onChange={(e) => setField('validity_note', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <Field label={t('admin.certs_form.field_version_retires_at')} hint={t('admin.certs_form.field_version_retires_at_hint')} error={errors.version_retires_at}>
                                <input
                                    type="date"
                                    className="field"
                                    value={data.version_retires_at}
                                    onChange={(e) => setData('version_retires_at', e.target.value)}
                                />
                                <p className="mt-1 text-xs text-ink-500">
                                    {t('admin.certs_form.field_version_retires_at_help')}
                                </p>
                            </Field>
                        </div>
                    </section>

                    {/* Course status */}
                    {editing && (
                        <section className="card p-6">
                            <SectionHeader
                                title={t('admin.certs_form.section_course')}
                                description={t('admin.certs_form.section_course_desc')}
                            />
                            <div className="mt-4">
                                {certification.course_blocks_count > 0 ? (
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                                <Icon.Book className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <div className="font-semibold text-ink-900 dark:text-white">
                                                    {t(
                                                        certification.course_blocks_count > 1
                                                            ? 'admin.certs_form.course_blocks_published_plural'
                                                            : 'admin.certs_form.course_blocks_published_singular',
                                                        { count: certification.course_blocks_count }
                                                    )}
                                                </div>
                                                {certification.course_updated_at && (
                                                    <div className="text-xs text-ink-500">
                                                        {t('admin.certs_form.course_updated_on', {
                                                            date: new Date(certification.course_updated_at).toLocaleDateString(
                                                                locale === 'fr' ? 'fr-FR' : 'en-US',
                                                                { day: '2-digit', month: 'long', year: 'numeric' }
                                                            ),
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <label
                                            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                                data.remove_course
                                                    ? 'border-rose-500 bg-rose-500 text-white'
                                                    : 'border-rose-500/40 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={!!data.remove_course}
                                                onChange={(e) => setData('remove_course', e.target.checked)}
                                            />
                                            <Icon.Close className="h-3.5 w-3.5" />
                                            {data.remove_course ? t('admin.certs_form.course_will_clear') : t('admin.certs_form.course_clear')}
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900/40">
                                        <div className="flex items-center gap-3 text-sm text-ink-500">
                                            <Icon.Book className="h-4 w-4" />
                                            {t('admin.certs_form.course_none')}
                                        </div>
                                        <Link
                                            href={`${route('admin.certifications.course-import')}?certification_id=${certification.id}`}
                                            className="btn-secondary !py-1.5 !text-xs"
                                        >
                                            <Icon.Bolt className="h-3.5 w-3.5" />
                                            {t('admin.certs_form.course_import_cta')}
                                        </Link>
                                    </div>
                                )}
                                {data.remove_course && certification.course_blocks_count > 0 && (
                                    <p className="mt-2 text-xs text-rose-500">
                                        {t('admin.certs_form.course_clear_warning')}
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Blueprint syllabus */}
                    {editing && (
                        <section className="card p-6">
                            <SectionHeader
                                title={t('admin.certs_form.section_blueprint')}
                                description={t('admin.certs_form.section_blueprint_desc')}
                            />
                            <div className="mt-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <div className="font-mono text-xs">
                                        <span className="text-ink-500">{t('admin.certs_form.blueprint_total')}</span>{' '}
                                        <span className={`font-semibold ${
                                            blueprintTotal === 100
                                                ? 'text-emerald-600 dark:text-emerald-300'
                                                : 'text-amber-600 dark:text-amber-300'
                                        }`}>
                                            {blueprintTotal} %
                                        </span>
                                        {blueprintTotal !== 100 && blueprintRows.length > 0 && (
                                            <span className="ml-2 text-amber-600 dark:text-amber-300">
                                                {t('admin.certs_form.blueprint_must_100')}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        className="btn-ghost !py-1.5 !text-xs"
                                    >
                                        <Icon.Sparkles className="h-3.5 w-3.5" />
                                        {t('admin.certs_form.blueprint_add_domain')}
                                    </button>
                                </div>

                                {blueprintRows.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-4 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900/40">
                                        {t('admin.certs_form.blueprint_empty')}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="hidden grid-cols-12 gap-2 px-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 sm:grid">
                                            <div className="col-span-5">{t('admin.certs_form.blueprint_col_domain')}</div>
                                            <div className="col-span-2 text-right">{t('admin.certs_form.blueprint_col_pct')}</div>
                                            <div className="col-span-4">{t('admin.certs_form.blueprint_col_coverage')}</div>
                                            <div className="col-span-1" />
                                        </div>
                                        {blueprintRows.map((row, i) => {
                                            const count = question_counts_by_domain[row.key] ?? 0;
                                            const target = Math.round((examSize * (Number(row.pct) || 0)) / 100);
                                            const insufficient = count < target;
                                            return (
                                                <div key={i} className="grid grid-cols-12 items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={row.key}
                                                        onChange={(e) => updateRow(i, { key: e.target.value })}
                                                        placeholder={t('admin.certs_form.blueprint_row_placeholder')}
                                                        className="field col-span-5 !py-2 font-mono text-xs"
                                                    />
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        value={row.pct}
                                                        onChange={(e) => updateRow(i, { pct: Number(e.target.value) })}
                                                        className="field col-span-2 !py-2 text-right font-mono text-xs"
                                                    />
                                                    <div className={`col-span-4 font-mono text-xs ${insufficient ? 'text-amber-600 dark:text-amber-300' : 'text-ink-500'}`}>
                                                        {t('admin.certs_form.blueprint_row_coverage', { count, target, size: examSize })}
                                                        {insufficient && ' !'}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(i)}
                                                        className="col-span-1 flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                                                        title={t('admin.certs_form.blueprint_delete_domain')}
                                                    >
                                                        <Icon.Close className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <p
                                    className="mt-3 text-xs text-ink-500"
                                    dangerouslySetInnerHTML={{ __html: t('admin.certs_form.blueprint_help_html') }}
                                />
                            </div>
                        </section>
                    )}

                    {/* Visuals + visibility */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.certs_form.section_logo')}
                            description={t('admin.certs_form.section_logo_desc')}
                        />
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
                            {editing && certification.logo_path ? (
                                <img
                                    src={`/storage/${certification.logo_path}`}
                                    alt=""
                                    className="h-24 w-24 rounded-2xl border border-ink-200 object-contain p-2 dark:border-ink-800"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50 text-ink-400 dark:border-ink-700 dark:bg-ink-900/40">
                                    <Icon.Book className="h-8 w-8" />
                                </div>
                            )}
                            <div>
                                <Field label={t('admin.certs_form.field_logo')} error={errors.logo}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                        className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 file:hover:bg-brand-500/20 dark:text-ink-300 dark:file:text-brand-300"
                                    />
                                    {progress && (
                                        <div className="mt-2 h-1 w-full rounded bg-ink-200 dark:bg-ink-800">
                                            <div
                                                className="h-1 rounded bg-gradient-to-r from-brand-500 to-iris-500"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                    )}
                                </Field>
                            </div>
                        </div>
                        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                            <input
                                type="checkbox"
                                checked={!!data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-ink-300 bg-white text-brand-500 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-900"
                            />
                            <div>
                                <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                    {t('admin.certs_form.visibility_title')}
                                </div>
                                <div className="text-xs text-ink-500">
                                    {t('admin.certs_form.visibility_desc')}
                                </div>
                            </div>
                        </label>
                    </section>

                    {/* Submit bar */}
                    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-2 rounded-2xl border border-ink-200/60 bg-white/90 p-3 shadow-xl backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/90">
                        <div>
                            {editing && (
                                <Link
                                    href={route('admin.certifications.certificate-preview', certification.id)}
                                    className="btn-ghost !text-xs"
                                    title={t('admin.certs_form.preview_certificate_title')}
                                >
                                    <Icon.Shield className="h-3.5 w-3.5" />
                                    {t('admin.certs_form.preview_certificate')}
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={route('admin.certifications.index')} className="btn-secondary">
                                {t('admin.common.cancel')}
                            </Link>
                            <button type="submit" disabled={processing} className="btn-primary">
                                {processing
                                    ? t('admin.common.saving')
                                    : editing
                                        ? t('admin.certs_form.submit_update')
                                        : t('admin.certs_form.submit_create')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function SectionHeader({ title, description }) {
    return (
        <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
        </div>
    );
}

function Field({ label, error, hint, required, children, className = '' }) {
    return (
        <div className={className}>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-500">
                <span>
                    {label}
                    {required && <span className="ml-0.5 text-rose-500">*</span>}
                </span>
                {hint && <span className="normal-case font-normal text-[10px] text-ink-400">{hint}</span>}
            </label>
            {children}
            {error && <div className="mt-1 text-xs text-rose-500">{error}</div>}
        </div>
    );
}
