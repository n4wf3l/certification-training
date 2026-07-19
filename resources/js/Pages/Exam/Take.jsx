import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Take({ attempt, certification, questions }) {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const totalSeconds = attempt.duration_minutes * 60;
    const startedAt = useMemo(() => new Date(attempt.started_at).getTime(), [attempt.started_at]);
    const [remaining, setRemaining] = useState(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        return Math.max(0, totalSeconds - elapsed);
    });

    useEffect(() => {
        const t = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const rem = Math.max(0, totalSeconds - elapsed);
            setRemaining(rem);
            if (rem <= 0) {
                clearInterval(t);
                submit();
            }
        }, 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const q = questions[current];
    const totalQuestions = questions.length;
    const answeredCount = Object.values(answers).filter(Boolean).length;

    const pick = (questionId, answerId) => {
        setAnswers((a) => ({ ...a, [questionId]: answerId }));
    };

    const submit = () => {
        if (submitting) return;
        setSubmitting(true);
        router.post(route('exam.submit', attempt.id), { answers }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const prevQ = () => setCurrent((c) => Math.max(0, c - 1));
    const nextQ = () => setCurrent((c) => Math.min(totalQuestions - 1, c + 1));

    return (
        <AppLayout>
            <Head title={`Examen — ${certification.title}`} />
            <div className="mx-auto max-w-5xl">
                {/* Top bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        {certification.logo_path ? (
                            <img
                                src={`/storage/${certification.logo_path}`}
                                alt=""
                                className="h-10 w-10 object-contain"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                                {certification.title.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="text-sm font-medium text-slate-500">Examen</div>
                            <div className="font-bold text-slate-900 dark:text-white">
                                {certification.title}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">
                            Répondues <span className="font-bold text-slate-900 dark:text-white">{answeredCount}</span> / {totalQuestions}
                        </div>
                        <div
                            className={`rounded-lg px-4 py-2 font-mono text-lg font-bold tabular-nums ${
                                remaining < 60
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                            }`}
                        >
                            {formatTime(remaining)}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
                    {/* Main question */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                Question {q.position} / {totalQuestions}
                            </div>
                            {q.topic && (
                                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {q.topic}
                                </div>
                            )}
                        </div>
                        {q.scenario && (
                            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-slate-700 dark:border-indigo-900 dark:bg-indigo-900/20 dark:text-slate-200">
                                {q.scenario}
                            </div>
                        )}
                        <h2 className="mb-6 text-2xl font-bold leading-snug text-slate-900 dark:text-white sm:text-3xl">
                            {q.question_text}
                        </h2>
                        <div className="space-y-3">
                            {q.answers.map((a) => {
                                const selected = answers[q.id] === a.id;
                                return (
                                    <button
                                        key={a.id}
                                        type="button"
                                        onClick={() => pick(q.id, a.id)}
                                        className={`flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left text-lg transition ${
                                            selected
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                                                selected
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            {a.letter}
                                        </span>
                                        <span className="pt-1 text-slate-900 dark:text-slate-100">
                                            {a.answer_text}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                            <button
                                onClick={prevQ}
                                disabled={current === 0}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                            >
                                ← Précédent
                            </button>
                            {current < totalQuestions - 1 ? (
                                <button
                                    onClick={nextQ}
                                    className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-500"
                                >
                                    Suivant →
                                </button>
                            ) : (
                                <button
                                    onClick={submit}
                                    disabled={submitting}
                                    className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                                >
                                    {submitting ? 'Envoi...' : 'Terminer l’examen'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navigator */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Navigation
                        </div>
                        <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
                            {questions.map((qq, idx) => {
                                const answered = !!answers[qq.id];
                                const isCurrent = idx === current;
                                return (
                                    <button
                                        key={qq.id}
                                        onClick={() => setCurrent(idx)}
                                        className={`h-10 rounded-lg text-sm font-semibold ${
                                            isCurrent
                                                ? 'bg-indigo-600 text-white'
                                                : answered
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                        }`}
                                    >
                                        {qq.position}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={submit}
                            disabled={submitting}
                            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                        >
                            Terminer l’examen
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
