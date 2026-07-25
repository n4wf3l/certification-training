import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { LANGUAGE_CATALOG } from '@/lib/languages';
import { useT } from '@/lib/i18n';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function Logo({ certification, size = 'lg' }) {
    if (certification.logo_path) {
        return (
            <img
                src={`/storage/${certification.logo_path}`}
                alt={certification.title}
                className={`${size === 'lg' ? 'h-24 w-24' : 'h-16 w-16'} object-contain`}
            />
        );
    }
    const initials = certification.title
        .replace(/[^A-Za-z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 3)
        .join('')
        .toUpperCase();
    return (
        <div className={`${size === 'lg' ? 'h-24 w-24 text-2xl' : 'h-16 w-16 text-lg'} flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-iris-500 font-bold text-white shadow-glow`}>
            {initials}
        </div>
    );
}

function ModeOption({ selected, onSelect, title, description, icon }) {
    const t = useT();
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
                selected
                    ? 'border-brand-500 bg-brand-500/5 shadow-glow'
                    : 'border-ink-200 bg-white hover:border-brand-500/40 hover:bg-brand-500/5 dark:border-ink-800 dark:bg-ink-900/40'
            }`}
        >
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                    selected
                        ? 'bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow'
                        : 'bg-ink-100 text-ink-500 group-hover:bg-brand-500/20 group-hover:text-brand-600 dark:bg-ink-800 dark:text-ink-300'
                }`}
            >
                {icon}
            </span>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className={`font-semibold ${selected ? 'text-brand-600 dark:text-brand-300' : 'text-ink-900 dark:text-white'}`}>
                        {title}
                    </span>
                    {selected && (
                        <span className="badge-brand !py-0 text-[10px]">{t('exam_intro.selected_badge')}</span>
                    )}
                </div>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{description}</p>
            </div>
        </button>
    );
}

function Stat({ label, value, subtle }) {
    return (
        <div className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
            <div className="font-mono text-2xl font-bold text-ink-900 dark:text-white">{value}</div>
            <div className="mt-0.5 text-xs uppercase tracking-wider text-ink-500">{label}</div>
            {subtle && <div className="mt-1 text-xs text-ink-400">{subtle}</div>}
        </div>
    );
}

function MasteryBar({ mastery }) {
    const t = mastery.total || 1;
    const pct = (n) => `${(n / t) * 100}%`;
    return (
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div className="bg-emerald-500" style={{ width: pct(mastery.mastered) }} />
            <div className="bg-amber-500" style={{ width: pct(mastery.in_progress) }} />
            <div className="bg-rose-500" style={{ width: pct(mastery.to_review) }} />
        </div>
    );
}

function Chip({ color, label, value }) {
    const colors = {
        emerald: 'text-emerald-600 dark:text-emerald-300',
        amber: 'text-amber-600 dark:text-amber-300',
        rose: 'text-rose-600 dark:text-rose-300',
        slate: 'text-ink-500 dark:text-ink-400',
    };
    const dots = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        slate: 'bg-ink-400',
    };
    return (
        <div className="flex items-center justify-between rounded-lg border border-ink-200 bg-white px-3 py-2 dark:border-ink-800/60 dark:bg-ink-900/40">
            <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dots[color]}`} />
                <span className={`text-xs ${colors[color]}`}>{label}</span>
            </div>
            <span className="font-mono text-sm font-bold text-ink-900 dark:text-white">{value}</span>
        </div>
    );
}

export default function Intro({ certification, mastery, allow_instant_feedback = false }) {
    const t = useT();
    const user = usePage().props.auth?.user;
    const [answerMode, setAnswerMode] = useState('manual');
    const [feedbackMode, setFeedbackMode] = useState('deferred');

    // Langues disponibles pour CETTE certif (definies par l'admin, restreintes aux langues
    // officiellement supportees par l'organisme certificateur). default_language = langue
    // canonique des colonnes DB (fr pour le contenu existant, en pour les nouveaux imports).
    const availableLangs = certification.available_languages?.length
        ? certification.available_languages
        : [certification.default_language || 'en'];
    const [examLang, setExamLang] = useState(certification.default_language || availableLangs[0]);
    const languageMeta = useMemo(() => {
        const map = new Map();
        LANGUAGE_CATALOG.forEach((l) => map.set(l.code, l));
        return map;
    }, []);
    // Stats du pool pour la langue selectionnee (nb questions eligibles, sample size, seuil)
    const currentPool = certification.language_pools?.[examLang] ?? {
        available: certification.available_questions,
        sample_size: certification.sample_size,
        scaled_passing_score: certification.scaled_passing_score,
    };

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem('exam.answer_mode');
            if (stored === 'manual' || stored === 'auto') setAnswerMode(stored);
            const fb = window.localStorage.getItem('exam.feedback_mode');
            if (fb === 'deferred' || fb === 'instant') setFeedbackMode(fb);
            // Restaure la derniere langue choisie SI elle est dispo pour cette certif,
            // sinon on garde la default_language de la certif.
            const lang = window.localStorage.getItem('exam.lang');
            if (lang && availableLangs.includes(lang)) setExamLang(lang);
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [certification.id]);

    const pickMode = (mode) => {
        setAnswerMode(mode);
        try { window.localStorage.setItem('exam.answer_mode', mode); } catch { /* ignore */ }
    };

    const pickFeedbackMode = (mode) => {
        setFeedbackMode(mode);
        try { window.localStorage.setItem('exam.feedback_mode', mode); } catch { /* ignore */ }
    };

    const pickLang = (code) => {
        setExamLang(code);
        try { window.localStorage.setItem('exam.lang', code); } catch { /* ignore */ }
    };

    const start = () => {
        try { window.localStorage.setItem('exam.answer_mode', answerMode); } catch { /* ignore */ }
        // Force deferred si l'admin a désactivé le mode instantané (double sécurité côté client)
        const effectiveFb = allow_instant_feedback ? feedbackMode : 'deferred';
        router.post(route('exam.start', certification.slug), {
            feedback_mode: effectiveFb,
            lang: examLang,
        });
    };

    return (
        <AppLayout>
            <Head title={certification.title} />
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header card */}
                <div className="card relative overflow-hidden">
                    <div className="absolute inset-0 opacity-40 bg-radial-brand pointer-events-none" />
                    <div className="relative flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center">
                        <Logo certification={certification} />
                        <div className="flex-1">
                            <div className="badge-brand mb-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                                {t('exam_intro.kicker')}
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {certification.title}
                            </h1>
                            {certification.description && (
                                <p className="mt-2 text-ink-600 dark:text-ink-400">
                                    {certification.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="border-t border-ink-200/60 p-6 dark:border-ink-800/60">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Stat label={t('exam_intro.stat_duration')} value={`${certification.duration_minutes} min`} />
                            <Stat
                                label={t('exam_intro.stat_questions')}
                                value={currentPool.sample_size}
                                subtle={
                                    currentPool.available > currentPool.sample_size
                                        ? t('exam_intro.stat_questions_drawn', { n: currentPool.available })
                                        : null
                                }
                            />
                            <Stat label={t('exam_intro.stat_official_score')} value={`${certification.passing_score}/${certification.total_questions}`} />
                            <Stat label={t('exam_intro.stat_required')} value={`${currentPool.scaled_passing_score}/${currentPool.sample_size}`} />
                        </div>
                    </div>
                </div>

                {mastery && mastery.total > 0 && (
                    <div className="card p-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-ink-900 dark:text-white">{t('exam_intro.mastery_title')}</h3>
                                <p className="text-xs text-ink-500">
                                    {t('exam_intro.mastery_subtitle')}
                                </p>
                            </div>
                            <span className="font-mono text-sm text-ink-500">
                                {t('exam_intro.mastery_progress', { mastered: mastery.mastered, total: mastery.total })}
                            </span>
                        </div>
                        <MasteryBar mastery={mastery} />
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Chip color="emerald" label={t('exam_intro.mastery_chip_mastered')} value={mastery.mastered} />
                            <Chip color="amber" label={t('exam_intro.mastery_chip_progress')} value={mastery.in_progress} />
                            <Chip color="rose" label={t('exam_intro.mastery_chip_review')} value={mastery.to_review} />
                            <Chip color="slate" label={t('exam_intro.mastery_chip_never')} value={mastery.never_seen} />
                        </div>
                    </div>
                )}

                {user && currentPool.available > 0 && availableLangs.length > 1 && (
                    <div className="card p-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{t('exam_intro.lang_title')}</h3>
                            <p className="mt-0.5 text-xs text-ink-500">
                                {t('exam_intro.lang_subtitle')}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableLangs.map((code) => {
                                const meta = languageMeta.get(code) || { code, label: code, native: code };
                                const active = examLang === code;
                                const pool = certification.language_pools?.[code];
                                const poolCount = pool?.available ?? 0;
                                const empty = poolCount === 0;
                                return (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => pickLang(code)}
                                        disabled={empty}
                                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                            empty
                                                ? 'cursor-not-allowed border-dashed border-ink-200 bg-ink-50 text-ink-400 dark:border-ink-800 dark:bg-ink-900/20 dark:text-ink-600'
                                                : active
                                                    ? 'border-brand-500 bg-brand-500 text-white shadow-glow'
                                                    : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-200 dark:hover:border-ink-700'
                                        }`}
                                    >
                                        <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${active && !empty ? 'text-white/80' : 'text-ink-400'}`}>
                                            {code}
                                        </span>
                                        <span className="font-semibold">{meta.label}</span>
                                        <span className={`text-[11px] ${active && !empty ? 'text-white/80' : 'text-ink-500'}`} lang={code}>
                                            · {meta.native}
                                        </span>
                                        {pool && (
                                            <span className={`ml-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                                                empty
                                                    ? 'bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-500'
                                                    : active
                                                        ? 'bg-white/25 text-white'
                                                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                                            }`}>
                                                {t('exam_intro.lang_pool_suffix', { n: poolCount })}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {currentPool.available > 0 && currentPool.available < 40 && examLang !== certification.default_language && (
                            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                                {t('exam_intro.lang_partial_warning', { n: currentPool.available })}
                            </p>
                        )}
                    </div>
                )}

                {user && currentPool.available > 0 && (
                    <div className="card p-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{t('exam_intro.answer_mode_title')}</h3>
                            <p className="mt-0.5 text-xs text-ink-500">{t('exam_intro.answer_mode_subtitle')}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <ModeOption
                                selected={answerMode === 'manual'}
                                onSelect={() => pickMode('manual')}
                                title={t('exam_intro.answer_mode_manual_title')}
                                description={t('exam_intro.answer_mode_manual_desc')}
                                icon={
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <path d="M12 5v14" />
                                    </svg>
                                }
                            />
                            <ModeOption
                                selected={answerMode === 'auto'}
                                onSelect={() => pickMode('auto')}
                                title={t('exam_intro.answer_mode_auto_title')}
                                description={t('exam_intro.answer_mode_auto_desc')}
                                icon={<Icon.Bolt className="h-5 w-5" />}
                            />
                        </div>
                    </div>
                )}

                {user && allow_instant_feedback && currentPool.available > 0 && (
                    <div className="card p-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{t('exam_intro.feedback_mode_title')}</h3>
                            <p className="mt-0.5 text-xs text-ink-500">{t('exam_intro.feedback_mode_subtitle')}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <ModeOption
                                selected={feedbackMode === 'deferred'}
                                onSelect={() => pickFeedbackMode('deferred')}
                                title={t('exam_intro.feedback_mode_deferred_title')}
                                description={t('exam_intro.feedback_mode_deferred_desc')}
                                icon={<Icon.Trophy className="h-5 w-5" />}
                            />
                            <ModeOption
                                selected={feedbackMode === 'instant'}
                                onSelect={() => pickFeedbackMode('instant')}
                                title={t('exam_intro.feedback_mode_instant_title')}
                                description={t('exam_intro.feedback_mode_instant_desc')}
                                icon={<Icon.Sparkles className="h-5 w-5" />}
                            />
                        </div>
                    </div>
                )}

                <div className="card p-6 text-center">
                    {user ? (
                        currentPool.available > 0 ? (
                            <>
                                <button onClick={start} className="btn-primary !px-8 !py-4 text-base">
                                    {t('exam_intro.start_cta')}
                                    <Icon.ArrowRight className="h-5 w-5" />
                                </button>
                                <p className="mt-3 text-xs text-ink-500">
                                    {t('exam_intro.start_note', { time: `${certification.duration_minutes}:00` })}
                                </p>
                            </>
                        ) : (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                                {t('exam_intro.empty_pool')}
                            </div>
                        )
                    ) : (
                        <div className="space-y-4">
                            <p className="text-ink-600 dark:text-ink-400">
                                {t('exam_intro.guest_prompt')}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href={`${route('login')}?redirect_to=${encodeURIComponent(`/certifications/${certification.slug}/examen`)}`}
                                    className="btn-primary !px-6 !py-3"
                                >
                                    {t('exam_intro.guest_login_cta')}
                                </Link>
                                <Link
                                    href={`${route('register')}?redirect_to=${encodeURIComponent(`/certifications/${certification.slug}/examen`)}`}
                                    className="btn-secondary !px-6 !py-3"
                                >
                                    {t('exam_intro.guest_register_cta')}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
