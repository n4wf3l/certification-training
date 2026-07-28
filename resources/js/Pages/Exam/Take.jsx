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

export default function Take({ attempt, certification, questions, cert_progress = null }) {
    const t = useT();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [answerMode, setAnswerMode] = useState('manual');
    const [pendingLeave, setPendingLeave] = useState(null);
    const [justPicked, setJustPicked] = useState(null);
    const submittingRef = useRef(false);
    const allowLeaveRef = useRef(false);

    // Mode de navigation propre a la certif :
    //  'free'              : nav libre, retour possible, grille visible (ITIL-like)
    //  'sequential_locked' : pas de retour, pas de grille, skip autorise (CCNA-like)
    const isLockedNav = certification.navigation_mode === 'sequential_locked';
    // Une fois qu'on est passe a la question N, les questions < N sont
    // definitivement inaccessibles en mode locked. On track la plus haute
    // question atteinte pour empecher les setCurrent regressifs.
    const maxReachedRef = useRef(0);
    useEffect(() => {
        if (current > maxReachedRef.current) maxReachedRef.current = current;
    }, [current]);
    // Wrapper defensif : en mode locked, refuse tout setCurrent < maxReached.
    const safeSetCurrent = (updater) => {
        setCurrent((c) => {
            const next = typeof updater === 'function' ? updater(c) : updater;
            if (isLockedNav && next < maxReachedRef.current) return c;
            return next;
        });
    };

    // Tier de warning affiche dans la modal de sortie :
    //  0 = warning basique (aucun streak en jeu OU practice)
    //  1 = streak >= 1 ET budget quit restant (1er quit "gratuit")
    //  2 = streak >= 1 ET budget quit epuise (2e quit = reset streak)
    const exitTier = (() => {
        if (!cert_progress || cert_progress.perfect_runs === 0) return 0;
        if (cert_progress.quits_left > 0) return 1;
        return 2;
    })();

    const feedbackMode = attempt.feedback_mode || 'deferred';
    const isInstant = feedbackMode === 'instant';

    const totalSeconds = attempt.duration_minutes * 60;
    const startedAt = useMemo(() => new Date(attempt.started_at).getTime(), [attempt.started_at]);
    const [remaining, setRemaining] = useState(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        return Math.max(0, totalSeconds - elapsed);
    });

    // Intro cinematic : au chargement de l'examen on plonge la page dans le
    // noir en gardant seulement le compteur qui tourne, puis on fond vers le
    // layout normal. Skippe si l'utilisateur reprend un examen deja commence
    // (elapsed > 3 s = ce n'est pas le vrai debut, ex: reload).
    // phases : 'lock' (plein ecran noir + timer) -> 'reveal' (fade) -> 'done'
    const [introPhase, setIntroPhase] = useState(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        return elapsed > 3 ? 'done' : 'lock';
    });
    useEffect(() => {
        if (introPhase !== 'lock') return;
        const t1 = setTimeout(() => setIntroPhase('reveal'), 500);
        const t2 = setTimeout(() => setIntroPhase('done'), 1200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [introPhase]);

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
            if (e.key === 'ArrowLeft') safeSetCurrent((c) => Math.max(0, c - 1));
            if (e.key === 'ArrowRight') safeSetCurrent((c) => Math.min(questions.length - 1, c + 1));
            const q = questions[current];
            // Matching questions : keyboard shortcuts disabled (click-based UI)
            if (q && q.question_type !== 'matching' && /^[1-9]$/.test(e.key)) {
                const idx = parseInt(e.key, 10) - 1;
                if (q.answers[idx]) {
                    q.is_multi_select
                        ? toggleMulti(q.id, q.answers[idx].id)
                        : pick(q.id, q.answers[idx].id);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, questions, answerMode]);

    useEffect(() => {
        const beforeUnload = (e) => {
            if (submittingRef.current || allowLeaveRef.current) return;
            // Best-effort abandon signal for tab close / navigator kill.
            // sendBeacon est le seul appel HTTP autorise durant beforeunload.
            // On envoie un FormData vide - le controller ne lit pas de body.
            try {
                const url = route('exam.abandon', attempt.id);
                const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const fd = new FormData();
                if (csrf) fd.append('_token', csrf);
                navigator.sendBeacon?.(url, fd);
            } catch { /* silent - beforeunload doesn't allow throwing */ }
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

        // Bouton Back du navigateur : par defaut il quitte l'examen sans
        // declencher le "before" Inertia. On empile un state sentinelle a
        // l'arrivee sur la page et, a chaque popstate, on le re-empile pour
        // rester sur l'URL de l'examen tout en ouvrant le modal de sortie.
        const examUrl = window.location.href;
        window.history.pushState({ examSentinel: true }, '', examUrl);
        const onPopState = () => {
            if (submittingRef.current || allowLeaveRef.current) return;
            // Re-empile pour bloquer le prochain Back tant que le modal n'est
            // pas confirme (sinon la barre d'URL "recule" et l'utilisateur voit
            // deux URL differentes selon qu'il clique Continuer ou Confirmer).
            window.history.pushState({ examSentinel: true }, '', examUrl);
            setPendingLeave({
                url: route('certifications.exam', { certification: certification.slug }),
                method: 'get',
            });
        };
        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            window.removeEventListener('popstate', onPopState);
            removeBefore();
        };
    }, []);

    const q = questions[current];
    const totalQuestions = questions.length;

    // "Answered" detection : depends on question type
    //  - single-choice : truthy scalar
    //  - multi-select  : non-empty array
    //  - matching      : object with at least one key mapped
    const isAnswered = (qq, val) => {
        if (val === null || val === undefined) return false;
        if (qq?.question_type === 'matching') return typeof val === 'object' && Object.keys(val).length > 0;
        if (qq?.is_multi_select) return Array.isArray(val) && val.length > 0;
        return !!val;
    };
    const answeredCount = questions.filter((qq) => isAnswered(qq, answers[qq.id])).length;
    const progressPct = (answeredCount / totalQuestions) * 100;

    // Single-choice pick : single answer_id, with auto-advance if enabled.
    const pick = (questionId, answerId) => {
        if (isInstant && answers[questionId]) return;
        setAnswers((a) => ({ ...a, [questionId]: answerId }));
        if (answerMode === 'auto' && !isInstant) {
            setJustPicked(questionId);
            const idx = questions.findIndex((qq) => qq.id === questionId);
            if (idx >= 0 && idx < questions.length - 1) {
                setTimeout(() => {
                    safeSetCurrent((c) => (c === idx ? idx + 1 : c));
                    setJustPicked(null);
                }, 320);
            } else {
                setTimeout(() => setJustPicked(null), 500);
            }
        }
    };

    // Multi-select toggle : add/remove from the array. No auto-advance (user
    // needs to pick multiple items and click Next themselves).
    const toggleMulti = (questionId, answerId) => {
        if (isInstant && Array.isArray(answers[questionId]) && answers[questionId].length > 0) return;
        setAnswers((a) => {
            const current = Array.isArray(a[questionId]) ? a[questionId] : [];
            const has = current.includes(answerId);
            const next = has ? current.filter((x) => x !== answerId) : [...current, answerId];
            return { ...a, [questionId]: next };
        });
    };

    // Matching : record left -> right mapping.
    const setMatchingPair = (questionId, leftKey, rightKey) => {
        setAnswers((a) => ({
            ...a,
            [questionId]: {
                ...(typeof a[questionId] === 'object' && a[questionId] !== null ? a[questionId] : {}),
                [leftKey]: rightKey,
            },
        }));
    };
    const clearMatchingPair = (questionId, leftKey) => {
        setAnswers((a) => {
            const bucket = { ...(typeof a[questionId] === 'object' && a[questionId] !== null ? a[questionId] : {}) };
            delete bucket[leftKey];
            return { ...a, [questionId]: bucket };
        });
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

    const confirmLeave = async () => {
        allowLeaveRef.current = true;
        const target = pendingLeave;
        setPendingLeave(null);
        // Marque l'attempt comme abandonne cote serveur avant de naviguer.
        // fetch (avec keepalive) est plus fiable que router.post ici car on
        // veut naviguer immediatement sans attendre le round-trip Inertia.
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch(route('exam.abandon', attempt.id), {
                method: 'POST',
                keepalive: true,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                },
            });
        } catch { /* on navigue meme si l'abandon POST echoue - le sendBeacon prend le relais */ }
        if (target) {
            if ((target.method || 'get').toLowerCase() === 'get') {
                router.visit(target.url);
            } else {
                window.location.href = target.url;
            }
        }
    };

    const cancelLeave = () => setPendingLeave(null);

    const prevQ = () => safeSetCurrent((c) => Math.max(0, c - 1));
    const nextQ = () => safeSetCurrent((c) => Math.min(totalQuestions - 1, c + 1));
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
                            className={`relative rounded-xl border px-4 py-2 font-mono text-lg font-bold tabular-nums ${
                                timeCritical
                                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 animate-pulse'
                                    : 'border-brand-500/20 bg-brand-500/5 text-brand-600 dark:text-brand-300'
                            } ${introPhase !== 'done' ? 'z-[70]' : ''}`}
                            style={{
                                boxShadow: introPhase === 'lock'
                                    ? '0 0 0 100vmax rgba(3,7,18,0.75), 0 0 44px 8px rgba(122,132,255,0.55)'
                                    : introPhase === 'reveal'
                                        ? '0 0 0 100vmax rgba(3,7,18,0), 0 0 0 0 rgba(122,132,255,0)'
                                        : undefined,
                                transition: 'box-shadow 700ms ease-out, border-color 200ms ease-out, color 200ms ease-out',
                            }}
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
                        <h2 className="mb-4 text-2xl font-bold leading-snug text-ink-900 dark:text-white sm:text-3xl">
                            {q.question_text}
                        </h2>
                        {q.question_type === 'matching' ? (
                            <p className="mb-6 rounded-xl border-l-4 border-brand-500 bg-brand-500/5 p-3 text-sm text-ink-700 dark:text-ink-200">
                                {t('exam_take.matching_hint')}
                            </p>
                        ) : q.is_multi_select ? (
                            <p className="mb-6 rounded-xl border-l-4 border-amber-500 bg-amber-500/5 p-3 text-sm font-medium text-amber-800 dark:text-amber-200">
                                {t('exam_take.multi_select_hint', { n: q.answers.filter((a) => a.is_correct === true).length || 2 })}
                            </p>
                        ) : null}

                        {q.question_type === 'matching' && q.matching ? (
                            <MatchingBoard
                                question={q}
                                answer={answers[q.id]}
                                onSet={(l, r) => setMatchingPair(q.id, l, r)}
                                onClear={(l) => clearMatchingPair(q.id, l)}
                                isInstant={isInstant}
                                t={t}
                            />
                        ) : (
                        <div className="space-y-3">
                            {q.answers.map((a, idx) => {
                                const pickedArr = Array.isArray(answers[q.id]) ? answers[q.id] : null;
                                const selected = q.is_multi_select
                                    ? (pickedArr?.includes(a.id) ?? false)
                                    : answers[q.id] === a.id;
                                const answeredNow = q.is_multi_select
                                    ? (pickedArr?.length ?? 0) > 0
                                    : !!answers[q.id];
                                const flashing = justPicked === q.id && selected && answerMode === 'auto' && !q.is_multi_select;
                                const revealed = isInstant && answeredNow;
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
                                        onClick={() => q.is_multi_select ? toggleMulti(q.id, a.id) : pick(q.id, a.id)}
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
                        )}

                        {isInstant && isAnswered(q, answers[q.id]) && q.explanation && (
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
                            {isLockedNav ? (
                                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                                    {t('exam_take.locked_nav_hint')}
                                </span>
                            ) : (
                                <button
                                    onClick={prevQ}
                                    disabled={current === 0}
                                    className="btn-secondary"
                                >
                                    <Icon.ArrowLeft className="h-4 w-4" />
                                    {t('exam_take.prev')}
                                </button>
                            )}
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
                        {isLockedNav ? (
                            <div className="card p-4">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                                    {t('exam_take.locked_nav_label')}
                                </div>
                                <div className="mb-3 flex items-baseline justify-between font-mono">
                                    <span className="text-3xl font-bold text-ink-900 dark:text-white tabular-nums">
                                        {current + 1}
                                        <span className="text-lg text-ink-400"> / {totalQuestions}</span>
                                    </span>
                                    <span className="text-xs text-ink-500">{answeredCount} {t('exam_take.locked_nav_answered_short')}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                                    {t('exam_take.locked_nav_help')}
                                </p>
                            </div>
                        ) : (
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
                                                onClick={() => safeSetCurrent(idx)}
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
                        )}
                        <button
                            onClick={submit}
                            disabled={submitting}
                            className="btn-primary w-full bg-gradient-to-r from-emerald-500 to-teal-500 !py-3"
                        >
                            {submitting ? t('exam_take.submitting') : t('exam_take.finish')}
                        </button>
                        {!isLockedNav && (
                            <div className="rounded-xl border border-ink-200 bg-white/50 p-3 text-xs text-ink-500 dark:border-ink-800 dark:bg-ink-900/30">
                                <div className="mb-1 font-semibold text-ink-700 dark:text-ink-300">{t('exam_take.shortcuts_title')}</div>
                                <div>{t('exam_take.shortcut_arrows')}</div>
                                <div>{t('exam_take.shortcut_numbers')}</div>
                            </div>
                        )}
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
                        {exitTier === 1 && cert_progress && (
                            <div className="mb-4 rounded-xl border-l-4 border-amber-500 bg-amber-500/10 p-4 text-sm">
                                <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                                    <Icon.Bolt className="h-3.5 w-3.5" />
                                    {t('exam_take.exit_cert_tier1_kicker')}
                                </div>
                                <p className="text-ink-800 dark:text-ink-100">
                                    {t('exam_take.exit_cert_tier1_body', {
                                        perfect: cert_progress.perfect_runs,
                                        budget: cert_progress.quit_budget,
                                    })}
                                </p>
                            </div>
                        )}
                        {exitTier === 2 && cert_progress && (
                            <div className="mb-4 rounded-xl border-2 border-rose-500 bg-rose-500/15 p-4 text-sm shadow-glow">
                                <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-rose-700 dark:text-rose-300">
                                    <Icon.Bolt className="h-3.5 w-3.5" />
                                    {t('exam_take.exit_cert_tier2_kicker')}
                                </div>
                                <p className="font-medium text-ink-900 dark:text-white">
                                    {t('exam_take.exit_cert_tier2_body', {
                                        perfect: cert_progress.perfect_runs,
                                        required: cert_progress.required,
                                    })}
                                </p>
                            </div>
                        )}

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

/**
 * MatchingBoard : click-based pair-matching UI.
 * Left column shows the fixed left items. Right column shows the shuffled right
 * items. Click a left item to select, then click a right item to pair. Click a
 * left item that already has a pair to clear it. Two-column layout keeps it
 * simple and reliable across mobile/desktop (no drag lib required).
 */
function MatchingBoard({ question, answer, onSet, onClear, isInstant, t }) {
    const lefts = question.matching?.lefts ?? [];
    const rights = question.matching?.rights ?? [];
    const picks = typeof answer === 'object' && answer !== null ? answer : {};
    const [selectedLeft, setSelectedLeft] = useState(null);

    // Locked once we're in instant-feedback mode and the answer is committed
    const locked = isInstant && Object.keys(picks).length >= lefts.length;

    // right -> array of leftKeys that map to it (usually 1, but flexibly display all)
    const rightToLefts = Object.entries(picks).reduce((acc, [l, r]) => {
        if (!r) return acc;
        acc[r] = [...(acc[r] || []), l];
        return acc;
    }, {});

    const onLeftClick = (l) => {
        if (locked) return;
        if (picks[l]) {
            onClear(l);
            setSelectedLeft(null);
            return;
        }
        setSelectedLeft(selectedLeft === l ? null : l);
    };
    const onRightClick = (r) => {
        if (locked) return;
        if (!selectedLeft) return;
        onSet(selectedLeft, r);
        setSelectedLeft(null);
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2">
            <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    {t('exam_take.matching_left')}
                </div>
                <ul className="space-y-2">
                    {lefts.map((l) => {
                        const paired = picks[l];
                        const isSelected = selectedLeft === l;
                        return (
                            <li key={l}>
                                <button
                                    type="button"
                                    onClick={() => onLeftClick(l)}
                                    disabled={locked}
                                    className={`w-full rounded-xl border-2 p-3 text-left text-sm transition ${
                                        paired
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : isSelected
                                                ? 'border-brand-500 bg-brand-500/10 shadow-glow'
                                                : 'border-ink-200 bg-white hover:border-brand-500/40 dark:border-ink-800 dark:bg-ink-900/40'
                                    }`}
                                >
                                    <div className="font-medium text-ink-900 dark:text-white">{l}</div>
                                    {paired && (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                                            <Icon.ArrowRight className="h-3 w-3" />
                                            <span>{paired}</span>
                                            <span className="ml-auto text-[10px] opacity-70">{t('exam_take.matching_click_to_clear')}</span>
                                        </div>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    {t('exam_take.matching_right')}
                </div>
                <ul className="space-y-2">
                    {rights.map((r) => {
                        const usedBy = rightToLefts[r] ?? [];
                        const available = usedBy.length === 0;
                        return (
                            <li key={r}>
                                <button
                                    type="button"
                                    onClick={() => onRightClick(r)}
                                    disabled={locked || !selectedLeft}
                                    className={`w-full rounded-xl border-2 p-3 text-left text-sm transition ${
                                        !available
                                            ? 'border-emerald-500/60 bg-emerald-500/5 opacity-70'
                                            : selectedLeft
                                                ? 'border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10'
                                                : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40'
                                    } ${!selectedLeft && available ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                    <div className="font-medium text-ink-900 dark:text-white">{r}</div>
                                    {!available && (
                                        <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                            ← {usedBy.join(', ')}
                                        </div>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
