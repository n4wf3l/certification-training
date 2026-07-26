import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import LanguageTabs from '@/Components/LanguageTabs';
import Select from '@/Components/Select';
import { useT } from '@/lib/i18n';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_ANSWERS = [
    { letter: 'A', answer_text: '', rationale: '' },
    { letter: 'B', answer_text: '', rationale: '' },
    { letter: 'C', answer_text: '', rationale: '' },
    { letter: 'D', answer_text: '', rationale: '' },
];

// Champs question-level traduisibles
const Q_FIELDS = ['topic', 'scenario', 'question_text', 'explanation'];
// Champs answer-level traduisibles
const A_FIELDS = ['answer_text', 'rationale'];

const relabel = (arr) =>
    arr.map((a, i) => ({ ...a, letter: String.fromCharCode(65 + i) }));

export default function Form({ question, certifications, default_certification_id }) {
    const t = useT();
    const editing = !!question;
    const initialAnswers = question?.answers?.length
        ? relabel(question.answers.map((a) => ({
            letter: a.letter,
            answer_text: a.answer_text ?? '',
            rationale: a.rationale ?? '',
        })))
        : DEFAULT_ANSWERS;

    const { data, setData, post, put, processing, errors } = useForm({
        certification_id: question?.certification_id ?? default_certification_id ?? certifications[0]?.id ?? '',
        position: question?.position ?? '',
        topic: question?.topic ?? '',
        scenario: question?.scenario ?? '',
        question_text: question?.question_text ?? '',
        explanation: question?.explanation ?? '',
        answers: initialAnswers,
        correct_index: question?.correct_index ?? 0,
        // Shadow translations : { lang: { topic, scenario, question_text, explanation, answers: [{answer_text, rationale}, ...] } }
        translations: question?.translations ?? {},
    });

    const cert = certifications.find((c) => c.id === +data.certification_id);
    const canonicalLang = cert?.default_language ?? 'fr';
    const availableLangs = cert?.available_languages ?? [canonicalLang];

    const [activeLang, setActiveLang] = useState(canonicalLang);
    const isCanonicalTab = activeLang === canonicalLang;

    // Reset l'onglet actif si le user change de cert et que l'ancien lang n'est plus dispo
    useEffect(() => {
        if (!availableLangs.includes(activeLang)) setActiveLang(canonicalLang);
    }, [availableLangs, activeLang, canonicalLang]);

    // Lecture / ecriture d'un champ question-level (topic/scenario/question_text/explanation)
    const getQField = (name) => isCanonicalTab
        ? (data[name] ?? '')
        : (data.translations?.[activeLang]?.[name] ?? '');

    const setQField = (name, value) => {
        if (isCanonicalTab) { setData(name, value); return; }
        setData('translations', {
            ...(data.translations ?? {}),
            [activeLang]: {
                ...(data.translations?.[activeLang] ?? {}),
                [name]: value,
            },
        });
    };

    // Lecture / ecriture d'un champ answer-level (answer_text/rationale)
    const getAField = (idx, name) => {
        if (isCanonicalTab) return data.answers[idx]?.[name] ?? '';
        return data.translations?.[activeLang]?.answers?.[idx]?.[name] ?? '';
    };

    const setAField = (idx, name, value) => {
        if (isCanonicalTab) {
            const next = data.answers.map((a, i) => (i === idx ? { ...a, [name]: value } : a));
            setData('answers', next);
            return;
        }
        const bucket = data.translations?.[activeLang] ?? {};
        const existingAnswers = Array.isArray(bucket.answers) ? [...bucket.answers] : [];
        // Assure la longueur = data.answers.length pour eviter les trous
        while (existingAnswers.length < data.answers.length) {
            existingAnswers.push({ answer_text: '', rationale: '' });
        }
        existingAnswers[idx] = { ...(existingAnswers[idx] ?? {}), [name]: value };
        setData('translations', {
            ...(data.translations ?? {}),
            [activeLang]: { ...bucket, answers: existingAnswers },
        });
    };

    // Locales non-canoniques dont AUCUN champ n'est renseigne (question ou reponses)
    const missingLangs = useMemo(() => {
        const missing = [];
        for (const lang of availableLangs) {
            if (lang === canonicalLang) continue;
            const b = data.translations?.[lang] ?? {};
            const qFilled = Q_FIELDS.some((f) => (b[f] ?? '').toString().trim() !== '');
            const aFilled = Array.isArray(b.answers) && b.answers.some((a) =>
                A_FIELDS.some((f) => (a?.[f] ?? '').toString().trim() !== '')
            );
            if (!qFilled && !aFilled) missing.push(lang);
        }
        return missing;
    }, [data.translations, availableLangs, canonicalLang]);

    // Applique une transformation sur les answers de chaque langue non-canonique,
    // pour que ajout/suppression/deplacement reste synchronise entre toutes les
    // langues (les answers sont position-indexees, meme cle partout).
    const mapTranslationAnswers = (fn) => {
        const next = { ...(data.translations ?? {}) };
        for (const lang of Object.keys(next)) {
            const bucket = next[lang] ?? {};
            const currentAnswers = Array.isArray(bucket.answers) ? bucket.answers : [];
            next[lang] = { ...bucket, answers: fn(currentAnswers) };
        }
        return next;
    };

    const addAnswer = () => {
        if (data.answers.length >= 6) return;
        setData('answers', relabel([...data.answers, { letter: '', answer_text: '', rationale: '' }]));
        setData('translations', mapTranslationAnswers((arr) => [...arr, { answer_text: '', rationale: '' }]));
    };

    const removeAnswer = (idx) => {
        if (data.answers.length <= 2) return;
        const next = relabel(data.answers.filter((_, i) => i !== idx));
        setData('answers', next);
        setData('translations', mapTranslationAnswers((arr) => arr.filter((_, i) => i !== idx)));
        if (data.correct_index >= next.length) setData('correct_index', 0);
        else if (data.correct_index > idx) setData('correct_index', data.correct_index - 1);
    };

    const moveAnswer = (idx, dir) => {
        const j = idx + dir;
        if (j < 0 || j >= data.answers.length) return;
        const swap = (arr) => {
            const copy = [...arr];
            [copy[idx], copy[j]] = [copy[j], copy[idx]];
            return copy;
        };
        setData('answers', relabel(swap(data.answers)));
        setData('translations', mapTranslationAnswers(swap));
        if (data.correct_index === idx) setData('correct_index', j);
        else if (data.correct_index === j) setData('correct_index', idx);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('admin.questions.update', question.id));
        else post(route('admin.questions.store'));
    };

    return (
        <AppLayout>
            <Head title={editing ? t('admin.questions_form.head_title_edit') : t('admin.questions_form.head_title_new')} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">{t('admin.common.dashboard_breadcrumb')}</Link>
                        <span>/</span>
                        <Link href={route('admin.questions.index')} className="hover:text-brand-500">{t('admin.questions_index.title')}</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">
                            {editing ? `Q${question.position ?? ''}` : t('admin.questions_form.breadcrumb_new')}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {editing ? t('admin.questions_form.title_edit') : t('admin.questions_form.title_new')}
                            </h1>
                            {cert && (
                                <p className="mt-1 text-sm text-ink-500">
                                    {t('admin.questions_form.for')} <span className="font-semibold text-ink-800 dark:text-ink-200">{cert.title}</span>
                                </p>
                            )}
                        </div>
                        <Link
                            href={route('admin.questions.index') + (data.certification_id ? `?certification_id=${data.certification_id}` : '')}
                            className="btn-ghost !py-2"
                        >
                            <Icon.ArrowLeft className="h-4 w-4" />
                            {t('admin.common.back')}
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Language tabs : only if the selected cert has > 1 available language */}
                    {availableLangs.length > 1 && (
                        <section className="card p-5">
                            <div className="mb-3">
                                <h2 className="text-sm font-semibold text-ink-900 dark:text-white">
                                    {t('admin.certs_form.content_language_title')}
                                </h2>
                                <p className="mt-0.5 text-xs text-ink-500">
                                    {t('admin.certs_form.content_language_desc')}
                                </p>
                            </div>
                            <LanguageTabs
                                availableLangs={availableLangs}
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

                    {/* Meta */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.questions_form.section_meta')}
                            description={t('admin.questions_form.section_meta_desc')}
                        />
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label={t('admin.questions_form.field_cert')} error={errors.certification_id} className="sm:col-span-2">
                                <Select
                                    value={data.certification_id}
                                    onChange={(v) => setData('certification_id', +v)}
                                    options={certifications.map((c) => ({
                                        value: c.id,
                                        label: c.title,
                                        logo: c,
                                    }))}
                                    placeholder={t('admin.questions_form.cert_placeholder')}
                                />
                            </Field>
                            <Field label={t('admin.questions_form.field_position')} hint={t('admin.questions_form.field_position_hint')} error={errors.position}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field"
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                    placeholder={t('admin.questions_form.field_position_placeholder')}
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label={t('admin.questions_form.field_topic')} error={errors.topic}>
                                <input
                                    className="field"
                                    value={getQField('topic')}
                                    onChange={(e) => setQField('topic', e.target.value)}
                                    placeholder={t('admin.questions_form.field_topic_placeholder')}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Question */}
                    <section className="card p-6">
                        <SectionHeader
                            title={t('admin.questions_form.section_question')}
                            description={t('admin.questions_form.section_question_desc')}
                        />
                        <div className="mt-4 space-y-4">
                            <Field label={t('admin.questions_form.field_scenario')} error={errors.scenario}>
                                <textarea
                                    rows={4}
                                    className="field resize-y"
                                    value={getQField('scenario')}
                                    onChange={(e) => setQField('scenario', e.target.value)}
                                    placeholder={t('admin.questions_form.field_scenario_placeholder')}
                                />
                            </Field>
                            <Field label={t('admin.questions_form.field_question_text')} error={errors.question_text} required>
                                <textarea
                                    rows={3}
                                    className="field resize-y"
                                    value={getQField('question_text')}
                                    onChange={(e) => setQField('question_text', e.target.value)}
                                    placeholder={t('admin.questions_form.field_question_text_placeholder')}
                                />
                            </Field>
                            <Field
                                label={t('admin.questions_form.field_explanation')}
                                hint={t('admin.questions_form.field_explanation_hint')}
                                error={errors.explanation}
                            >
                                <textarea
                                    rows={3}
                                    className="field resize-y"
                                    value={getQField('explanation')}
                                    onChange={(e) => setQField('explanation', e.target.value)}
                                    placeholder={t('admin.questions_form.field_explanation_placeholder')}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Answers */}
                    <section className="card p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <SectionHeader
                                title={t('admin.questions_form.section_answers')}
                                description={t('admin.questions_form.section_answers_desc')}
                            />
                            <button
                                type="button"
                                onClick={addAnswer}
                                disabled={data.answers.length >= 6}
                                className="btn-secondary !py-1.5 !text-xs disabled:opacity-40"
                            >
                                <Icon.Sparkles className="h-3.5 w-3.5" />
                                {t('admin.questions_form.add_answer')}
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {data.answers.map((a, idx) => {
                                const isCorrect = +data.correct_index === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`rounded-2xl border-2 p-4 transition ${
                                            isCorrect
                                                ? 'border-emerald-500 bg-emerald-500/5 shadow-glow'
                                                : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Correct radio + letter badge */}
                                            <button
                                                type="button"
                                                onClick={() => setData('correct_index', idx)}
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-base font-bold transition ${
                                                    isCorrect
                                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow'
                                                        : 'bg-ink-100 text-ink-700 hover:bg-emerald-500/20 hover:text-emerald-600 dark:bg-ink-800 dark:text-ink-200'
                                                }`}
                                                title={isCorrect ? t('admin.questions_form.correct_mark_title') : t('admin.questions_form.correct_mark_untitle')}
                                            >
                                                {isCorrect ? <Icon.Check className="h-5 w-5" /> : a.letter}
                                            </button>

                                            {/* Answer text */}
                                            <div className="flex-1 min-w-0">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                                                        {t('admin.questions_form.answer_label', { letter: a.letter })}
                                                        {isCorrect && (
                                                            <span className="ml-2 text-emerald-500">{t('admin.questions_form.correct_suffix')}</span>
                                                        )}
                                                    </label>
                                                    <div className="flex items-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveAnswer(idx, -1)}
                                                            disabled={idx === 0}
                                                            className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-ink-800 dark:hover:text-white"
                                                            title={t('admin.questions_form.move_up')}
                                                        >
                                                            <Icon.ArrowUp className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveAnswer(idx, 1)}
                                                            disabled={idx === data.answers.length - 1}
                                                            className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-ink-800 dark:hover:text-white"
                                                            title={t('admin.questions_form.move_down')}
                                                        >
                                                            <Icon.ArrowDown className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAnswer(idx)}
                                                            disabled={data.answers.length <= 2}
                                                            className="rounded p-1 text-ink-400 transition hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={t('admin.questions_form.remove_answer')}
                                                        >
                                                            <Icon.Close className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    className="field resize-y"
                                                    value={getAField(idx, 'answer_text')}
                                                    onChange={(e) => setAField(idx, 'answer_text', e.target.value)}
                                                    placeholder={t('admin.questions_form.answer_placeholder', { letter: a.letter })}
                                                />
                                                {errors[`answers.${idx}.answer_text`] && (
                                                    <div className="mt-1 text-xs text-rose-500">
                                                        {errors[`answers.${idx}.answer_text`]}
                                                    </div>
                                                )}
                                                <div className="mt-2">
                                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                                                        {isCorrect ? t('admin.questions_form.rationale_correct_label') : t('admin.questions_form.rationale_wrong_label')}
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        className="field resize-y text-xs"
                                                        value={getAField(idx, 'rationale')}
                                                        onChange={(e) => setAField(idx, 'rationale', e.target.value)}
                                                        placeholder={isCorrect
                                                            ? t('admin.questions_form.rationale_correct_placeholder')
                                                            : t('admin.questions_form.rationale_wrong_placeholder')}
                                                    />
                                                    {errors[`answers.${idx}.rationale`] && (
                                                        <div className="mt-1 text-xs text-rose-500">
                                                            {errors[`answers.${idx}.rationale`]}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {errors.correct_index && (
                            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
                                {errors.correct_index}
                            </div>
                        )}
                        {errors.answers && (
                            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
                                {errors.answers}
                            </div>
                        )}
                    </section>

                    {/* Submit bar */}
                    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-ink-200/60 bg-white/90 p-3 shadow-xl backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/90">
                        <div className="hidden text-xs text-ink-500 sm:block">
                            {data.answers.length} {t('admin.questions_form.summary_answers')}{' '}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                                {data.answers[data.correct_index]?.letter ?? '-'}
                            </span>{' '}
                            {t('admin.questions_form.summary_marked')}
                        </div>
                        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
                            <Link
                                href={route('admin.questions.index') + (data.certification_id ? `?certification_id=${data.certification_id}` : '')}
                                className="btn-secondary"
                            >
                                {t('admin.common.cancel')}
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary"
                            >
                                {processing
                                    ? t('admin.common.saving')
                                    : editing
                                        ? t('admin.questions_form.submit_update')
                                        : t('admin.questions_form.submit_create')}
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
            {description && (
                <p className="mt-0.5 text-xs text-ink-500">{description}</p>
            )}
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
