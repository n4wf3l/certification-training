import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const DEFAULT_ANSWERS = [
    { letter: 'A', answer_text: '' },
    { letter: 'B', answer_text: '' },
    { letter: 'C', answer_text: '' },
    { letter: 'D', answer_text: '' },
];

export default function Form({ question, certifications, default_certification_id }) {
    const editing = !!question;

    const { data, setData, post, put, processing, errors } = useForm({
        certification_id: question?.certification_id ?? default_certification_id ?? certifications[0]?.id ?? '',
        position: question?.position ?? '',
        topic: question?.topic ?? '',
        scenario: question?.scenario ?? '',
        question_text: question?.question_text ?? '',
        answers: question?.answers?.length ? question.answers : DEFAULT_ANSWERS,
        correct_index: question?.correct_index ?? 0,
    });

    const updateAnswer = (idx, key, value) => {
        const next = data.answers.map((a, i) => (i === idx ? { ...a, [key]: value } : a));
        setData('answers', next);
    };

    const addAnswer = () => {
        if (data.answers.length >= 6) return;
        const nextLetter = String.fromCharCode(65 + data.answers.length);
        setData('answers', [...data.answers, { letter: nextLetter, answer_text: '' }]);
    };

    const removeAnswer = (idx) => {
        if (data.answers.length <= 2) return;
        const next = data.answers.filter((_, i) => i !== idx);
        setData('answers', next);
        if (data.correct_index >= next.length) {
            setData('correct_index', 0);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.questions.update', question.id));
        } else {
            post(route('admin.questions.store'));
        }
    };

    return (
        <AppLayout>
            <Head title={editing ? 'Éditer une question' : 'Nouvelle question'} />
            <div className="mx-auto max-w-4xl space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {editing ? 'Éditer la question' : 'Nouvelle question'}
                    </h1>
                    <Link
                        href={route('admin.questions.index')}
                        className="text-sm text-slate-500 hover:underline"
                    >
                        ← Retour
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="Certification" error={errors.certification_id} className="sm:col-span-2">
                            <select
                                className="input"
                                value={data.certification_id}
                                onChange={(e) => setData('certification_id', +e.target.value)}
                            >
                                {certifications.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Position (auto si vide)" error={errors.position}>
                            <input
                                type="number"
                                min="1"
                                className="input"
                                value={data.position}
                                onChange={(e) => setData('position', e.target.value)}
                            />
                        </Field>
                    </div>
                    <Field label="Sujet / thème (optionnel)" error={errors.topic}>
                        <input
                            className="input"
                            value={data.topic}
                            onChange={(e) => setData('topic', e.target.value)}
                        />
                    </Field>
                    <Field label="Scénario / contexte (optionnel)" error={errors.scenario}>
                        <textarea
                            rows={3}
                            className="input"
                            value={data.scenario ?? ''}
                            onChange={(e) => setData('scenario', e.target.value)}
                        />
                    </Field>
                    <Field label="Question" error={errors.question_text}>
                        <textarea
                            rows={2}
                            className="input"
                            value={data.question_text}
                            onChange={(e) => setData('question_text', e.target.value)}
                        />
                    </Field>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Réponses (coche la bonne)
                            </div>
                            <button
                                type="button"
                                onClick={addAnswer}
                                className="text-sm text-indigo-600 hover:underline"
                                disabled={data.answers.length >= 6}
                            >
                                + Ajouter
                            </button>
                        </div>
                        <div className="space-y-2">
                            {data.answers.map((a, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                                >
                                    <input
                                        type="radio"
                                        name="correct_index"
                                        checked={+data.correct_index === idx}
                                        onChange={() => setData('correct_index', idx)}
                                        className="mt-3"
                                    />
                                    <input
                                        className="input w-16"
                                        value={a.letter}
                                        onChange={(e) => updateAnswer(idx, 'letter', e.target.value)}
                                    />
                                    <textarea
                                        rows={2}
                                        className="input flex-1"
                                        value={a.answer_text}
                                        onChange={(e) => updateAnswer(idx, 'answer_text', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAnswer(idx)}
                                        disabled={data.answers.length <= 2}
                                        className="mt-2 text-sm text-rose-600 hover:underline disabled:opacity-40"
                                    >
                                        Retirer
                                    </button>
                                </div>
                            ))}
                        </div>
                        {errors.correct_index && (
                            <div className="mt-1 text-xs text-rose-600">{errors.correct_index}</div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
                        >
                            {editing ? 'Mettre à jour' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.5rem;
                    border: 1px solid rgb(203 213 225);
                    background: white;
                    color: rgb(15 23 42);
                }
                .dark .input {
                    background: rgb(15 23 42);
                    border-color: rgb(51 65 85);
                    color: rgb(226 232 240);
                }
            `}</style>
        </AppLayout>
    );
}

function Field({ label, error, children, className = '' }) {
    return (
        <div className={className}>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {label}
            </label>
            {children}
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        </div>
    );
}
