import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Take({ attempt, certification, questions }) {
    const t = useT();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [answerMode, setAnswerMode] = useState('manual');
    const [pendingLeave, setPendingLeave] = useState(null);
    const [justPicked, setJustPicked] = useState(null);
    const submittingRef = useRef(false);
    const allowLeaveRef = useRef(false);

    const feedbackMode = attempt.feedback_mode || 'deferred';
    const isInstant = feedbackMode === 'instant';

    const totalSeconds = attempt.duration_minutes * 60;
    const startedAt = useMemo(() => new Date(attempt.started_at).getTime(), [attempt.started_at]);
    const [remaining, setRemaining] = useState(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        return Math.max(0, totalSeconds - elapsed);
    });

    useEffect(() => {
        try {
            const m = window.localStorage.getItem('exam.answer_mode');
            if (m === 'auto' || m === 'manual') setAnswerMode(m);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const rem = Math.max(0, totalSeconds - elapsed);
            setRemaining(rem);
            if (rem <= 0) {
                clearInterval(timer);
                submit();
            }
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(0, c - 1));
            if (e.key === 'ArrowRight') setCurrent((c) => Math.min(questions.length - 1, c + 1));
            const q = questions[current];
            if (q && /^[1-9]$/.test(e.key)) {
                const idx = parseInt(e.key, 10) - 1;
                if (q.answers[idx]) pick(q.id, q.answers[idx].id);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, questions, answerMode]);

    useEffect(() => {
        const beforeUnload = (e) => {
            if (submittingRef.current || allowLeaveRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', beforeUnload);

        const removeBefore = router.on('before', (event) => {
            if (submittingRef.current || allowLeaveRef.current) return;
            event.preventDefault();
            const visit = event.detail?.visit;
            if (visit) {
                setPendingLeave({
                    url: visit.url?.toString() || visit.href || '/',
                    method: visit.method || 'get',
                });
            }
        });

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            removeBefore();
        };
    }, []);

    const q = questions[current];
    const totalQuestions = questions.length;
    const answeredCount = Object.values(answers).filter(Boolean).length;
    const progressPct = (answeredCount / totalQuestions) * 100;

    const pick = (questionId, answerId) => {
        if (isInstant && answers[questionId]) return;
        setAnswers((a) => ({ ...a, [questionId]: answerId }));
        if (answerMode === 'auto' && !isInstant) {
            setJustPicked(questionId);
            const idx = questions.findIndex((qq) => qq.id === questionId);
            if (idx >= 0 && idx < questions.length - 1) {
                setTimeout(() => {
                    setCurrent((c) => (c === idx ? idx + 1 : c));
                    setJustPicked(null);
                }, 320);
            } else {
                setTimeout(() => setJustPicked(null), 500);
            }
        }
    };

    const submit = () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        router.post(
            route('exam.submit', attempt.id),
            { answers },
            { onFinish: () => setSubmitting(false) }
        );
    };

    const confirmLeave = () => {
        allowLeaveRef.current = true;
        const target = pendingLeave;
        setPendingLeave(null);
        if (target) {
            if ((target.method || 'get').toLowerCase() === 'get') {
                router.visit(target.url);
            } else {
                window.location.href = target.url;
            }
        }
    };

    const cancelLeave = () => setPendingLeave(null);

    const prevQ = () => setCurrent((c) => Math.max(0, c - 1));
    const nextQ = () => setCurrent((c) => Math.min(totalQuestions - 1, c + 1));
    const timeCritical = remaining < 60;

    return (
        <AppLayout full>
            <Head title={t('exam_take.page_title', { title: certification.title })} />

            <div className="glass-nav border-b-0">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        {certification.logo_path ? (
                            <img src={`/storage/${certification.logo_path}`} alt="" className="h-9 w-9 object-contain" />
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 text-xs font-bold text-white">
                                {certification.title.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="text-xs text-ink-500">
                                {attempt.practice_domain ? t('exam_take.practice_session', { domain: attempt.practice_domain }) : t('exam_take.exam_in_progress')}
                            </div>
                            <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                {certification.title}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden text-right sm:block">
                            <div className="text-xs text-ink-500">{t('exam_take.answered_label')}</div>
                            <div className="font-mono text-sm font-bold text-ink-900 dark:text-white">
                                {answeredCount}/{totalQuestions}
                            </div>
                        </div>
                        {isInstant && (
                            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300 sm:inline-flex">
                                <Icon.Sparkles className="h-3 w-3" />
                                {t('exam_take.badge_training')}
                            </span>
                        )}
                        {answerMode === 'auto' && !isInstant && (
                            <span className="hidden items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300 sm:inline-flex">
                                <Icon.Bolt className="h-3 w-3" />
                                {t('exam_take.badge_auto_next')}
                            </span>
                        )}
                        <div
                            className={`rounded-xl border px-4 py-2 font-mono text-lg font-bold tabular-nums transition ${
                                timeCritical
                                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 animate-pulse'
                                    : 'border-brand-500/20 bg-brand-500/5 text-brand-600 dark:text-brand-300'
                            }`}
                        >
                            {formatTime(remaining)}
                        </div>
                    </div>
                </div>
                <div className="h-0.5 w-full bg-ink-100 dark:bg-ink-800">
                    <div
                        className="h-full bg-gradient-to-r from-brand-500 to-iris-500 transition-all"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
                    <div className="card p-6 sm:p-10 animate-fade-up" key={q.id}>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="badge-brand">
                                {t('exam_take.question_progress', { n: q.position, total: totalQuestions })}
                            </div>
                            {q.topic && (
                                <span className="badge-muted">{q.topic}</span>
                            )}
                        </div>
                        {q.scenario && (
                            <div className="mb-6 rounded-xl border-l-4 border-brand-500 bg-brand-500/5 p-4 text-ink-700 dark:text-ink-200">
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-500">{t('exam_take.context_label')}</div>
                                {q.scenario}
                            </div>
                        )}
                        <h2 className="mb-8 text-2xl font-bold leading-snug text-ink-900 dark:text-white sm:text-3xl">
                            {q.question_text}
                        </h2>
                        <div className="space-y-3">
                            {q.answers.map((a, idx) => {
                                const selected = answers[q.id] === a.id;
                                const flashing = justPicked === q.id && selected && answerMode === 'auto';
                                const revealed = isInstant && !!answers[q.id];
                                const isCorrect = a.is_correct === true;
                                const isSelectedWrong = selected && revealed && !isCorrect;

                                let className = 'group flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ';
                                let letterBg = 'bg-ink-100 text-ink-700 group-hover:bg-brand-500/20 group-hover:text-brand-600 dark:bg-ink-800 dark:text-ink-200';

                                if (revealed) {
                                    if (isCorrect) {
                                        className += 'border-emerald-500 bg-emerald-500/10';
                                        letterBg = 'bg-emerald-500 text-white shadow-glow';
                                    } else if (isSelectedWrong) {
                                        className += 'border-rose-500 bg-rose-500/10';
                                        letterBg = 'bg-rose-500 text-white';
                                    } else {
                                        className += 'border-ink-200 bg-white opacity-60 dark:border-ink-800 dark:bg-ink-900/40';
                                    }
                                } else if (selected) {
                                    className += `border-brand-500 bg-brand-500/10 shadow-glow ${flashing ? 'scale-[0.99]' : ''}`;
                                    letterBg = 'bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow';
                                } else {
                                    className += 'border-ink-200 bg-white hover:border-brand-500/40 hover:bg-brand-500/5 dark:border-ink-800 dark:bg-ink-900/40 dark:hover:bg-ink-800/60';
                                }

                                return (
                                    <button
                                        key={a.id}
                                        type="button"
                                        onClick={() => pick(q.id, a.id)}
                                        disabled={revealed}
                                        className={`${className} ${revealed ? 'cursor-default' : ''}`}
                                    >
                                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition ${letterBg}`}>
                                            {revealed && isCorrect ? (
                                                <Icon.Check className="h-5 w-5" />
                                            ) : revealed && isSelectedWrong ? (
                                                <Icon.Close className="h-5 w-5" />
                                            ) : (
                                                a.letter
                                            )}
                                        </span>
                                        <div className="flex-1">
                                            <div className="pt-2 text-base text-ink-900 dark:text-ink-100 sm:text-lg">
                                                {a.answer_text}
                                            </div>
                                            {revealed && (isCorrect || isSelectedWrong) && a.rationale && (
                                                <div className={`mt-2 rounded-lg border-l-2 py-1.5 pl-3 pr-2 text-sm ${
                                                    isCorrect
                                                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200'
                                                        : 'border-rose-500 bg-rose-500/5 text-rose-800 dark:text-rose-200'
                                                }`}>
                                                    {a.rationale}
                                                </div>
                                            )}
                                        </div>
                                        <span className="hidden shrink-0 self-center rounded border border-ink-200 px-1.5 py-0.5 text-[10px] font-mono text-ink-400 dark:border-ink-800 sm:inline">
                                            {idx + 1}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {isInstant && answers[q.id] && q.explanation && (
                            <div className="mt-6 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4">
                                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">
                                    <Icon.Sparkles className="h-3.5 w-3.5" />
                                    {t('exam_take.explanation_label')}
                                </div>
                                <div className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                                    {q.explanation}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex items-center justify-between">
                            <button
                                onClick={prevQ}
                                disabled={current === 0}
                                className="btn-secondary"
                            >
                                <Icon.ArrowLeft className="h-4 w-4" />
                                {t('exam_take.prev')}
                            </button>
                            {current < totalQuestions - 1 ? (
                                <button onClick={nextQ} className="btn-primary">
                                    {t('exam_take.next')}
                                    <Icon.ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button onClick={submit} disabled={submitting} className="btn-primary bg-gradient-to-r from-emerald-500 to-teal-500">
                                    {submitting ? t('exam_take.submitting') : t('exam_take.finish_exam')}
                                    <Icon.Check className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
                        <div className="card p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                    {t('exam_take.nav_label')}
                                </div>
                                <div className="text-xs font-mono text-ink-500">
                                    {answeredCount}/{totalQuestions}
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
                                {questions.map((qq, idx) => {
                                    const answered = !!answers[qq.id];
                                    const isCurrent = idx === current;
                                    return (
                                        <button
                                            key={qq.id}
                                            onClick={() => setCurrent(idx)}
                                            title={t('exam_take.nav_question_title', { n: qq.position })}
                                            className={`aspect-square rounded-lg text-xs font-mono font-semibold transition ${
                                                isCurrent
                                                    ? 'bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow ring-2 ring-brand-500/50'
                                                    : answered
                                                    ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-300'
                                                    : 'bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-400 dark:hover:bg-ink-700'
                                            }`}
                                        >
                                            {qq.position}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <button
                            onClick={submit}
                            disabled={submitting}
                            className="btn-primary w-full bg-gradient-to-r from-emerald-500 to-teal-500 !py-3"
                        >
                            {submitting ? t('exam_take.submitting') : t('exam_take.finish')}
                        </button>
                        <div className="rounded-xl border border-ink-200 bg-white/50 p-3 text-xs text-ink-500 dark:border-ink-800 dark:bg-ink-900/30">
                            <div className="mb-1 font-semibold text-ink-700 dark:text-ink-300">{t('exam_take.shortcuts_title')}</div>
                            <div>{t('exam_take.shortcut_arrows')}</div>
                            <div>{t('exam_take.shortcut_numbers')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {pendingLeave && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in"
                    onClick={cancelLeave}
                >
                    <div
                        className="card w-full max-w-md animate-scale-in p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                                <Icon.Close className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-ink-900 dark:text-white">
                                    {t('exam_take.exit_title')}
                                </h3>
                                <p className="text-xs text-ink-500">{t('exam_take.exit_subtitle')}</p>
                            </div>
                        </div>
                        <ul className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-ink-800 dark:text-ink-200">
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                <span>
                                    {t('exam_take.exit_reason_progress', { n: answeredCount }).split(':strong').map((chunk, i, arr) => (
                                        <span key={i}>
                                            {chunk}
                                            {i < arr.length - 1 && <strong>{t('exam_take.exit_reason_progress_strong')}</strong>}
                                        </span>
                                    ))}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                <span>
                                    {t('exam_take.exit_reason_next')
                                        .replace(':strong_questions', ` q `)
                                        .replace(':strong_order', ` o `)
                                        .split(' ')
                                        .map((chunk, i) => {
                                            if (chunk === 'q') return <strong key={i}>{t('exam_take.exit_reason_next_strong_questions')}</strong>;
                                            if (chunk === 'o') return <strong key={i}>{t('exam_take.exit_reason_next_strong_order')}</strong>;
                                            return <span key={i}>{chunk}</span>;
                                        })}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                <span>
                                    {t('exam_take.exit_reason_abandoned').split(':strong').map((chunk, i, arr) => (
                                        <span key={i}>
                                            {chunk}
                                            {i < arr.length - 1 && <strong>{t('exam_take.exit_reason_abandoned_strong')}</strong>}
                                        </span>
                                    ))}
                                </span>
                            </li>
                        </ul>
                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={cancelLeave} className="btn-primary">
                                <Icon.Check className="h-4 w-4" />
                                {t('exam_take.exit_continue')}
                            </button>
                            <button
                                onClick={confirmLeave}
                                className="btn border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-300"
                            >
                                {t('exam_take.exit_quit')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </AppLayout>
    );
}
