import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { LANGUAGE_CATALOG } from '@/lib/languages';
import { useT } from '@/lib/i18n';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

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

// Row d'un reglage dans le modal : label bold sur toute la largeur, pastilles en
// dessous en ligne, description en petit dessous. Version epuree : plus de split
// label|hint qui obligeait le label a wrap sur 2 lignes dans un modal etroit.
function SettingRow({ label, children, description }) {
    return (
        <div>
            <div className="mb-2 whitespace-nowrap font-semibold text-ink-900 dark:text-white">
                {label}
            </div>
            <div className="flex flex-wrap gap-2">
                {children}
            </div>
            {description && (
                <p className="mt-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                    {description}
                </p>
            )}
        </div>
    );
}

// Pastille toggle compacte reutilisable. `sub` = texte discret a droite du label
// (ex: endonyme d'une langue "· English"). On masque sub si egal au label pour
// eviter "Francais · Francais" en UI FR.
function PillToggle({ selected, onSelect, label, sub, disabled = false, badge = null }) {
    const showSub = sub && sub.toLowerCase() !== String(label).toLowerCase();
    if (disabled) {
        return (
            <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-dashed border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-400 dark:border-ink-800 dark:bg-ink-900/20 dark:text-ink-600">
                <span className="font-semibold whitespace-nowrap">{label}</span>
                {showSub && <span className="text-[11px] whitespace-nowrap">· {sub}</span>}
                {badge}
            </span>
        );
    }
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                selected
                    ? 'border-brand-500 bg-brand-500 text-white shadow-glow'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-200 dark:hover:border-ink-700'
            }`}
        >
            <span className="font-semibold whitespace-nowrap">{label}</span>
            {showSub && (
                <span className={`text-[11px] whitespace-nowrap ${selected ? 'text-white/80' : 'text-ink-500'}`}>
                    · {sub}
                </span>
            )}
            {badge}
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

    // Modal "confirmation avant lancement" : ouvert au clic sur "Demarrer l'examen".
    // Concentre les reglages (langue / mode reponse / mode correction) en un lieu unique
    // et transforme le clic Start en moment d'engagement ("je verifie et je me lance").
    const [modalOpen, setModalOpen] = useState(false);
    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    const start = () => {
        try { window.localStorage.setItem('exam.answer_mode', answerMode); } catch { /* ignore */ }
        // Force deferred si l'admin a désactivé le mode instantané (double sécurité côté client)
        const effectiveFb = allow_instant_feedback ? feedbackMode : 'deferred';
        router.post(route('exam.start', certification.slug), {
            feedback_mode: effectiveFb,
            lang: examLang,
        });
    };

    // ESC + click backdrop pour fermer le modal (attendu par les users, pas de piege).
    useEffect(() => {
        if (!modalOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [modalOpen]);

    const canStart = !!user && currentPool.available > 0;

    return (
        <AppLayout>
            <Head title={certification.title} />
            <div className="mx-auto max-w-4xl space-y-6">
                {/* HERO CARD - le START est en top-right du header, immediatement visible
                    sans scroll. Les stats detaillees et les reglages sont en dessous
                    pour ceux qui veulent regarder / personnaliser avant de lancer. */}
                <div className="card relative overflow-hidden">
                    <div className="absolute inset-0 opacity-40 bg-radial-brand pointer-events-none" />
                    <div className="relative p-6 sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 items-start gap-5">
                                <Logo certification={certification} />
                                <div className="min-w-0">
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

                            {canStart && (
                                <div className="shrink-0 lg:pt-1">
                                    <button
                                        onClick={openModal}
                                        className="btn-primary w-full !px-8 !py-4 text-base lg:w-auto"
                                    >
                                        {t('exam_intro.start_cta')}
                                        <Icon.ArrowRight className="h-5 w-5" />
                                    </button>
                                    <p className="mt-2 max-w-[240px] text-center text-[11px] leading-relaxed text-ink-500 lg:text-right">
                                        {t('exam_intro.start_hint_modal')}
                                    </p>
                                </div>
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

                {/* Empty pool warning */}
                {user && currentPool.available === 0 && (
                    <div className="card p-6">
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                            {t('exam_intro.empty_pool')}
                        </div>
                    </div>
                )}

                {/* Mastery card - visible seulement si l'user a deja des donnees d'entrainement */}
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

                {/* Les reglages (langue / mode reponse / mode correction) sont maintenant
                    dans un modal qui s'ouvre au clic sur "Demarrer l'examen" — voir le
                    portail plus bas. La page reste propre, le clic Start devient un
                    moment de confirmation avant le lancement. */}

                {/* GUEST CTA - inchange (le user connecte passe par le modal a partir du header) */}
                {!user && (
                    <div className="card p-6 text-center">
                        <div className="space-y-4">
                            <p className="text-ink-700 dark:text-ink-300">
                                {t('exam_intro.guest_prompt')}
                            </p>
                            <Link
                                href={`${route('register')}?redirect_to=${encodeURIComponent(`/certifications/${certification.slug}/examen`)}`}
                                className="btn-primary !px-8 !py-4 text-base"
                            >
                                {t('exam_intro.guest_register_cta')}
                                <Icon.ArrowRight className="h-5 w-5" />
                            </Link>
                            <p className="text-xs text-ink-500">
                                {t('exam_intro.guest_reassurance')}
                            </p>
                            <p className="pt-2 text-sm text-ink-500 dark:text-ink-400">
                                {t('exam_intro.guest_already_prefix')}{' '}
                                <Link
                                    href={`${route('login')}?redirect_to=${encodeURIComponent(`/certifications/${certification.slug}/examen`)}`}
                                    className="font-semibold text-brand-500 underline underline-offset-2 hover:text-brand-400"
                                >
                                    {t('exam_intro.guest_login_cta')}
                                </Link>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmation pre-examen. Rendu via portal (document.body) pour
                echapper aux stacking contexts des cards. Contient les 3 axes de reglage
                (rows conditionnels) + le CTA final "Confirmer et demarrer". Le note timer
                y est aussi rappele pour un dernier avertissement avant le lancement. */}
            {modalOpen && canStart && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="exam-modal-title"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="card w-full max-w-xl animate-scale-in overflow-hidden"
                    >
                        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
                            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                                {t('exam_intro.modal_kicker')}
                            </div>
                            <h3 id="exam-modal-title" className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                                {t('exam_intro.modal_title')}
                            </h3>
                            <p className="mt-1 text-sm text-ink-500">
                                {t('exam_intro.modal_subtitle')}
                            </p>

                            <div className="mt-6 space-y-6">
                                {availableLangs.length > 1 && (
                                    <div>
                                        <SettingRow
                                            label={t('exam_intro.lang_title')}
                                            description={t('exam_intro.lang_subtitle')}
                                        >
                                            {availableLangs.map((code) => {
                                                const meta = languageMeta.get(code) || { code, label: code, native: code };
                                                const pool = certification.language_pools?.[code];
                                                const poolCount = pool?.available ?? 0;
                                                const empty = poolCount === 0;
                                                const badge = pool ? (
                                                    <span className={`ml-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                                                        empty
                                                            ? 'bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-500'
                                                            : examLang === code
                                                                ? 'bg-white/25 text-white'
                                                                : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                                                    }`}>
                                                        {t('exam_intro.lang_pool_suffix', { n: poolCount })}
                                                    </span>
                                                ) : null;
                                                return (
                                                    <PillToggle
                                                        key={code}
                                                        selected={examLang === code}
                                                        onSelect={() => pickLang(code)}
                                                        label={meta.label}
                                                        sub={meta.native}
                                                        disabled={empty}
                                                        badge={badge}
                                                    />
                                                );
                                            })}
                                        </SettingRow>
                                        {currentPool.available > 0 && currentPool.available < 40 && examLang !== certification.default_language && (
                                            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                                                {t('exam_intro.lang_partial_warning', { n: currentPool.available })}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <SettingRow
                                        label={t('exam_intro.answer_mode_title')}
                                        description={
                                            answerMode === 'auto'
                                                ? t('exam_intro.answer_mode_auto_desc')
                                                : t('exam_intro.answer_mode_manual_desc')
                                        }
                                    >
                                        <PillToggle
                                            selected={answerMode === 'manual'}
                                            onSelect={() => pickMode('manual')}
                                            label={t('exam_intro.answer_mode_manual_title')}
                                        />
                                        <PillToggle
                                            selected={answerMode === 'auto'}
                                            onSelect={() => pickMode('auto')}
                                            label={t('exam_intro.answer_mode_auto_title')}
                                        />
                                    </SettingRow>
                                </div>

                                {allow_instant_feedback && (
                                    <div>
                                        <SettingRow
                                            label={t('exam_intro.feedback_mode_title')}
                                            description={
                                                feedbackMode === 'instant'
                                                    ? t('exam_intro.feedback_mode_instant_desc')
                                                    : t('exam_intro.feedback_mode_deferred_desc')
                                            }
                                        >
                                            <PillToggle
                                                selected={feedbackMode === 'deferred'}
                                                onSelect={() => pickFeedbackMode('deferred')}
                                                label={t('exam_intro.feedback_mode_deferred_title')}
                                            />
                                            <PillToggle
                                                selected={feedbackMode === 'instant'}
                                                onSelect={() => pickFeedbackMode('instant')}
                                                label={t('exam_intro.feedback_mode_instant_title')}
                                            />
                                        </SettingRow>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                <div className="flex items-start gap-2">
                                    <Icon.Timer className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{t('exam_intro.start_note', { time: `${certification.duration_minutes}:00` })}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={start}
                                    autoFocus
                                    className="btn-primary w-full !py-3.5 text-base"
                                >
                                    {t('exam_intro.modal_confirm')}
                                    <Icon.ArrowRight className="h-5 w-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="text-center text-sm text-ink-500 underline underline-offset-2 hover:text-ink-800 dark:hover:text-white"
                                >
                                    {t('exam_intro.modal_cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </AppLayout>
    );
}
