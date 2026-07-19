import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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
                        <span className="badge-brand !py-0 text-[10px]">Sélectionné</span>
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

export default function Intro({ certification, mastery }) {
    const user = usePage().props.auth?.user;
    const [answerMode, setAnswerMode] = useState('manual');

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem('exam.answer_mode');
            if (stored === 'manual' || stored === 'auto') setAnswerMode(stored);
        } catch { /* ignore */ }
    }, []);

    const pickMode = (mode) => {
        setAnswerMode(mode);
        try { window.localStorage.setItem('exam.answer_mode', mode); } catch { /* ignore */ }
    };

    const start = () => {
        try { window.localStorage.setItem('exam.answer_mode', answerMode); } catch { /* ignore */ }
        router.post(route('exam.start', certification.slug));
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
                                Examen blanc
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
                            <Stat label="Durée" value={`${certification.duration_minutes} min`} />
                            <Stat
                                label="Questions"
                                value={certification.sample_size}
                                subtle={
                                    certification.available_questions > certification.sample_size
                                        ? `tirées sur ${certification.available_questions}`
                                        : null
                                }
                            />
                            <Stat label="Barème officiel" value={`${certification.passing_score}/${certification.total_questions}`} />
                            <Stat label="Requis pour valider" value={`${certification.scaled_passing_score}/${certification.sample_size}`} />
                        </div>
                    </div>
                </div>

                {/* Mastery */}
                {mastery && mastery.total > 0 && (
                    <div className="card p-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-ink-900 dark:text-white">Ta progression</h3>
                                <p className="text-xs text-ink-500">
                                    Les questions ratées reviennent en priorité dans la sélection.
                                </p>
                            </div>
                            <span className="font-mono text-sm text-ink-500">
                                {mastery.mastered}/{mastery.total} maîtrisées
                            </span>
                        </div>
                        <MasteryBar mastery={mastery} />
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Chip color="emerald" label="Maîtrisées" value={mastery.mastered} />
                            <Chip color="amber" label="En progrès" value={mastery.in_progress} />
                            <Chip color="rose" label="À revoir" value={mastery.to_review} />
                            <Chip color="slate" label="Jamais vues" value={mastery.never_seen} />
                        </div>
                    </div>
                )}

                {/* Answer mode */}
                {user && certification.available_questions > 0 && (
                    <div className="card p-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Mode de réponse</h3>
                            <p className="mt-0.5 text-xs text-ink-500">Comment tu veux enchaîner les questions.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <ModeOption
                                selected={answerMode === 'manual'}
                                onSelect={() => pickMode('manual')}
                                title="Sélection puis Suivant"
                                description="Clique une réponse, puis clique Suivant pour valider et passer à la question suivante."
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
                                title="Auto-suivant"
                                description="Un clic sur une réponse enchaîne automatiquement vers la question suivante."
                                icon={<Icon.Bolt className="h-5 w-5" />}
                            />
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="card p-6 text-center">
                    {user ? (
                        certification.available_questions > 0 ? (
                            <>
                                <button onClick={start} className="btn-primary !px-8 !py-4 text-base">
                                    Démarrer l'examen
                                    <Icon.ArrowRight className="h-5 w-5" />
                                </button>
                                <p className="mt-3 text-xs text-ink-500">
                                    Timer <span className="font-mono">{certification.duration_minutes}:00</span> · impossible de mettre en pause · quitter la page = examen perdu
                                </p>
                            </>
                        ) : (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                                Aucune question configurée pour cet examen.
                            </div>
                        )
                    ) : (
                        <div className="space-y-4">
                            <p className="text-ink-600 dark:text-ink-400">
                                Connecte-toi pour démarrer — tu reviendras ici automatiquement.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href={`${route('login')}?redirect_to=${encodeURIComponent(`/certifications/${certification.slug}/examen`)}`}
                                    className="btn-primary !px-6 !py-3"
                                >
                                    Se connecter et démarrer
                                </Link>
                                <Link
                                    href={`${route('register')}?redirect_to=${encodeURIComponent(`/certifications/${certification.slug}/examen`)}`}
                                    className="btn-secondary !px-6 !py-3"
                                >
                                    Commencer
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
