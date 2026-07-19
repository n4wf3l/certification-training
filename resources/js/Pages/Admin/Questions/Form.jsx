import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import Select from '@/Components/Select';
import { Head, Link, useForm } from '@inertiajs/react';

const DEFAULT_ANSWERS = [
    { letter: 'A', answer_text: '' },
    { letter: 'B', answer_text: '' },
    { letter: 'C', answer_text: '' },
    { letter: 'D', answer_text: '' },
];

const relabel = (arr) =>
    arr.map((a, i) => ({ ...a, letter: String.fromCharCode(65 + i) }));

export default function Form({ question, certifications, default_certification_id }) {
    const editing = !!question;
    const initialAnswers = question?.answers?.length
        ? relabel(question.answers.map((a) => ({ letter: a.letter, answer_text: a.answer_text ?? '' })))
        : DEFAULT_ANSWERS;

    const { data, setData, post, put, processing, errors } = useForm({
        certification_id: question?.certification_id ?? default_certification_id ?? certifications[0]?.id ?? '',
        position: question?.position ?? '',
        topic: question?.topic ?? '',
        scenario: question?.scenario ?? '',
        question_text: question?.question_text ?? '',
        answers: initialAnswers,
        correct_index: question?.correct_index ?? 0,
    });

    const cert = certifications.find((c) => c.id === +data.certification_id);

    const updateAnswerText = (idx, value) => {
        const next = data.answers.map((a, i) => (i === idx ? { ...a, answer_text: value } : a));
        setData('answers', next);
    };

    const addAnswer = () => {
        if (data.answers.length >= 6) return;
        setData('answers', relabel([...data.answers, { letter: '', answer_text: '' }]));
    };

    const removeAnswer = (idx) => {
        if (data.answers.length <= 2) return;
        const next = relabel(data.answers.filter((_, i) => i !== idx));
        setData('answers', next);
        if (data.correct_index >= next.length) setData('correct_index', 0);
        else if (data.correct_index > idx) setData('correct_index', data.correct_index - 1);
    };

    const moveAnswer = (idx, dir) => {
        const j = idx + dir;
        if (j < 0 || j >= data.answers.length) return;
        const next = [...data.answers];
        [next[idx], next[j]] = [next[j], next[idx]];
        setData('answers', relabel(next));
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
            <Head title={editing ? 'Éditer une question' : 'Nouvelle question'} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">Dashboard</Link>
                        <span>/</span>
                        <Link href={route('admin.questions.index')} className="hover:text-brand-500">Questions</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">
                            {editing ? `Q${question.position ?? ''}` : 'Nouvelle'}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {editing ? 'Éditer la question' : 'Nouvelle question'}
                            </h1>
                            {cert && (
                                <p className="mt-1 text-sm text-ink-500">
                                    Pour <span className="font-semibold text-ink-800 dark:text-ink-200">{cert.title}</span>
                                </p>
                            )}
                        </div>
                        <Link
                            href={route('admin.questions.index') + (data.certification_id ? `?certification_id=${data.certification_id}` : '')}
                            className="btn-ghost !py-2"
                        >
                            <Icon.ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Meta */}
                    <section className="card p-6">
                        <SectionHeader
                            title="Contexte"
                            description="À quelle certification cette question appartient et à quelle position dans le pool."
                        />
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label="Certification" error={errors.certification_id} className="sm:col-span-2">
                                <Select
                                    value={data.certification_id}
                                    onChange={(v) => setData('certification_id', +v)}
                                    options={certifications.map((c) => ({
                                        value: c.id,
                                        label: c.title,
                                        logo: c,
                                    }))}
                                    placeholder="Choisir une certification…"
                                />
                            </Field>
                            <Field label="Position" hint="Laisse vide = auto" error={errors.position}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field"
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                    placeholder="auto"
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Thème / sujet (optionnel)" error={errors.topic}>
                                <input
                                    className="field"
                                    value={data.topic}
                                    onChange={(e) => setData('topic', e.target.value)}
                                    placeholder="Ex. Principe — Commencer là où vous êtes"
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Question */}
                    <section className="card p-6">
                        <SectionHeader
                            title="Énoncé"
                            description="Le scénario est optionnel — utilise-le si la question a besoin d'un contexte narratif. L'énoncé est la question posée au candidat."
                        />
                        <div className="mt-4 space-y-4">
                            <Field label="Scénario / contexte (optionnel)" error={errors.scenario}>
                                <textarea
                                    rows={4}
                                    className="field resize-y"
                                    value={data.scenario ?? ''}
                                    onChange={(e) => setData('scenario', e.target.value)}
                                    placeholder="Une organisation… (description narrative de la situation)"
                                />
                            </Field>
                            <Field label="Question posée" error={errors.question_text} required>
                                <textarea
                                    rows={3}
                                    className="field resize-y"
                                    value={data.question_text}
                                    onChange={(e) => setData('question_text', e.target.value)}
                                    placeholder="Quel principe directeur est principalement appliqué ?"
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Answers */}
                    <section className="card p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <SectionHeader
                                title="Réponses"
                                description="Rédige de 2 à 6 réponses. Coche celle qui est correcte : elle sera comptée juste à l'examen."
                            />
                            <button
                                type="button"
                                onClick={addAnswer}
                                disabled={data.answers.length >= 6}
                                className="btn-secondary !py-1.5 !text-xs disabled:opacity-40"
                            >
                                <Icon.Sparkles className="h-3.5 w-3.5" />
                                Ajouter une réponse
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
                                                title={isCorrect ? 'Bonne réponse' : 'Cocher comme bonne réponse'}
                                            >
                                                {isCorrect ? <Icon.Check className="h-5 w-5" /> : a.letter}
                                            </button>

                                            {/* Answer text */}
                                            <div className="flex-1 min-w-0">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                                                        Réponse {a.letter}
                                                        {isCorrect && (
                                                            <span className="ml-2 text-emerald-500">· bonne réponse</span>
                                                        )}
                                                    </label>
                                                    <div className="flex items-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveAnswer(idx, -1)}
                                                            disabled={idx === 0}
                                                            className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-ink-800 dark:hover:text-white"
                                                            title="Monter"
                                                        >
                                                            <Icon.ArrowUp className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveAnswer(idx, 1)}
                                                            disabled={idx === data.answers.length - 1}
                                                            className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-ink-800 dark:hover:text-white"
                                                            title="Descendre"
                                                        >
                                                            <Icon.ArrowDown className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAnswer(idx)}
                                                            disabled={data.answers.length <= 2}
                                                            className="rounded p-1 text-ink-400 transition hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Retirer cette réponse"
                                                        >
                                                            <Icon.Close className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    className="field resize-y"
                                                    value={a.answer_text}
                                                    onChange={(e) => updateAnswerText(idx, e.target.value)}
                                                    placeholder={`Texte de la réponse ${a.letter}…`}
                                                />
                                                {errors[`answers.${idx}.answer_text`] && (
                                                    <div className="mt-1 text-xs text-rose-500">
                                                        {errors[`answers.${idx}.answer_text`]}
                                                    </div>
                                                )}
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
                            {data.answers.length} réponses ·{' '}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                                {data.answers[data.correct_index]?.letter ?? '—'}
                            </span>{' '}
                            marquée comme bonne
                        </div>
                        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
                            <Link
                                href={route('admin.questions.index') + (data.certification_id ? `?certification_id=${data.certification_id}` : '')}
                                className="btn-secondary"
                            >
                                Annuler
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary"
                            >
                                {processing ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer la question'}
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
