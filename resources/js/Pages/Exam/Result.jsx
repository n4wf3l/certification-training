import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

function formatDuration(seconds) {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

function ProgressRing({ percentage, passed, size = 180 }) {
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    className="text-ink-200 dark:text-ink-800"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#ring-grad)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
                <defs>
                    <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={passed ? '#10b981' : '#f43f5e'} />
                        <stop offset="100%" stopColor={passed ? '#22d3ee' : '#f59e0b'} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-mono text-4xl font-extrabold text-ink-900 dark:text-white">
                    {percentage}%
                </div>
                <div className={`mt-1 text-xs font-semibold uppercase tracking-wider ${passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {passed ? 'Réussi' : 'Échoué'}
                </div>
            </div>
        </div>
    );
}

function ResultStat({ label, value, sub }) {
    return (
        <div className="rounded-xl border border-ink-200 bg-white/60 p-4 text-center backdrop-blur dark:border-ink-800/60 dark:bg-ink-900/40">
            <div className="font-mono text-2xl font-bold text-ink-900 dark:text-white">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-ink-500">{label}</div>
            {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
        </div>
    );
}

function ComparisonCard({ comparison, currentDuration }) {
    const attemptLabel = ['1re', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e'][comparison.attempt_number - 1] || `${comparison.attempt_number}e`;

    if (!comparison.previous) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow">
                        <Icon.Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-ink-900 dark:text-white">Ta 1<sup>re</sup> tentative</h3>
                        <p className="text-sm text-ink-500">
                            Refais l'examen pour voir tes progrès en temps et en score.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const dSec = comparison.delta_seconds;
    const dScore = comparison.delta_score;
    const dPct = comparison.delta_percentage;
    const faster = dSec !== null && dSec < 0;
    const slower = dSec !== null && dSec > 0;
    const better = dScore > 0;
    const worse = dScore < 0;

    return (
        <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink-900 dark:text-white">
                            Ta {attemptLabel} tentative
                        </h3>
                        {comparison.is_new_best_time && (
                            <span className="badge-warn">
                                <Icon.Trophy className="h-3.5 w-3.5" />
                                Nouveau record temps
                            </span>
                        )}
                        {comparison.is_new_best_score && (
                            <span className="badge-success">
                                <Icon.Target className="h-3.5 w-3.5" />
                                Nouveau record score
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                        Comparaison avec ta tentative précédente sur ce même examen.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-ink-200 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Temps</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-ink-900 dark:text-white">
                            {formatDuration(currentDuration)}
                        </span>
                        {dSec !== null && (
                            <span
                                className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${
                                    faster ? 'text-emerald-500' : slower ? 'text-rose-500' : 'text-ink-400'
                                }`}
                            >
                                {faster ? <Icon.ArrowDown className="h-3.5 w-3.5" /> : slower ? <Icon.ArrowUp className="h-3.5 w-3.5" /> : <Icon.Equal className="h-3.5 w-3.5" />}
                                {formatDelta(Math.abs(dSec))}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                        {faster && `${formatDelta(Math.abs(dSec))} plus rapide qu'avant`}
                        {slower && `${formatDelta(Math.abs(dSec))} plus lent qu'avant`}
                        {!faster && !slower && `Précédente : ${formatDuration(comparison.previous.duration_seconds)}`}
                    </div>
                </div>

                <div className="rounded-xl border border-ink-200 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Score</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-ink-900 dark:text-white">
                            {comparison.previous.score + dScore}
                        </span>
                        <span
                            className={`font-mono text-sm font-semibold ${
                                better ? 'text-emerald-500' : worse ? 'text-rose-500' : 'text-ink-400'
                            }`}
                        >
                            {better ? '+' : ''}{dScore}
                        </span>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                        Précédent : <span className="font-mono">{comparison.previous.score}/{comparison.previous.total}</span>
                    </div>
                </div>

                <div className="rounded-xl border border-ink-200 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Progression %</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-ink-900 dark:text-white">
                            {comparison.previous.percentage + dPct}%
                        </span>
                        <span
                            className={`font-mono text-sm font-semibold ${
                                dPct > 0 ? 'text-emerald-500' : dPct < 0 ? 'text-rose-500' : 'text-ink-400'
                            }`}
                        >
                            {dPct > 0 ? '+' : ''}{dPct}%
                        </span>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                        Précédent : <span className="font-mono">{comparison.previous.percentage}%</span>
                    </div>
                </div>
            </div>

            {(comparison.best_time_before !== null || comparison.best_score_before !== null) && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-ink-200/60 bg-ink-50/50 px-4 py-3 text-xs dark:border-ink-800/60 dark:bg-ink-900/30">
                    <span className="text-ink-500">Records antérieurs :</span>
                    {comparison.best_time_before !== null && (
                        <span className="badge-muted">
                            <Icon.Timer className="h-3.5 w-3.5" />
                            meilleur temps <span className="font-mono ml-1">{formatDuration(comparison.best_time_before)}</span>
                        </span>
                    )}
                    {comparison.best_score_before !== null && (
                        <span className="badge-muted">
                            <Icon.Target className="h-3.5 w-3.5" />
                            meilleur score <span className="font-mono ml-1">{comparison.best_score_before}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function formatDelta(seconds) {
    if (seconds == null) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m${String(s).padStart(2, '0')}s`;
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

export default function Result({ attempt, certification, details, mastery, comparison }) {
    const passed = attempt.passed;
    const wrong = details.filter((d) => !d.is_correct);
    const rightCount = details.length - wrong.length;
    const [showAll, setShowAll] = useState(wrong.length === 0);
    const shownDetails = showAll ? details : wrong;

    return (
        <AppLayout>
            <Head title={`Résultat — ${certification.title}`} />
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Hero result */}
                <div className={`card relative overflow-hidden p-8`}>
                    <div className={`absolute inset-0 opacity-20 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ maskImage: 'radial-gradient(closest-side at top, black, transparent)' }} />
                    <div className="relative grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
                        <ProgressRing percentage={attempt.percentage} passed={passed} />
                        <div>
                            <div className={`badge ${passed ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300'}`}>
                                {passed ? <Icon.Check className="h-3.5 w-3.5" /> : <Icon.Close className="h-3.5 w-3.5" />}
                                {passed ? 'Certification validée' : 'En dessous du seuil'}
                            </div>
                            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {certification.title}
                            </h1>
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <ResultStat label="Score" value={`${attempt.score}/${attempt.total_questions}`} />
                                <ResultStat label="Requis" value={`${attempt.passing_score}`} sub={`sur ${attempt.total_questions}`} />
                                <ResultStat label="Écart" value={`${attempt.score - attempt.passing_score > 0 ? '+' : ''}${attempt.score - attempt.passing_score}`} />
                                <ResultStat label="Temps" value={formatDuration(attempt.duration_seconds)} />
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href={route('certifications.exam', certification.slug)} className="btn-primary">
                                    Recommencer
                                    <Icon.Refresh className="h-4 w-4" />
                                </Link>
                                <Link href={route('stats.index')} className="btn-secondary">Mes stats</Link>
                                <Link href={route('home')} className="btn-ghost">Autres examens</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {comparison && (
                    <ComparisonCard comparison={comparison} currentDuration={attempt.duration_seconds} />
                )}

                {mastery && mastery.total > 0 && (
                    <div className="card p-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-ink-900 dark:text-white">Ta maîtrise du pool</h3>
                                <p className="text-xs text-ink-500">
                                    Une question est maîtrisée après 2 bonnes réponses consécutives.
                                </p>
                            </div>
                            <span className="font-mono text-sm text-ink-500">
                                {mastery.mastered}/{mastery.total}
                            </span>
                        </div>
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                            <div className="bg-emerald-500" style={{ width: `${(mastery.mastered / mastery.total) * 100}%` }} />
                            <div className="bg-amber-500" style={{ width: `${(mastery.in_progress / mastery.total) * 100}%` }} />
                            <div className="bg-rose-500" style={{ width: `${(mastery.to_review / mastery.total) * 100}%` }} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Chip color="emerald" label="Maîtrisées" value={mastery.mastered} />
                            <Chip color="amber" label="En progrès" value={mastery.in_progress} />
                            <Chip color="rose" label="À revoir" value={mastery.to_review} />
                            <Chip color="slate" label="Jamais vues" value={mastery.never_seen} />
                        </div>
                    </div>
                )}

                {/* Correction */}
                <div className="card p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                                {showAll ? 'Correction complète' : 'Tes erreurs à revoir'}
                            </h2>
                            <p className="mt-0.5 text-xs text-ink-500">
                                {showAll
                                    ? 'Toutes les questions, dans l\'ordre de passage.'
                                    : wrong.length === 0
                                        ? 'Aucune erreur — tu as tout bon.'
                                        : `${wrong.length} question${wrong.length > 1 ? 's' : ''} à revoir en priorité.`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-2 text-xs">
                                <span className="badge-success">
                                    {rightCount} correctes
                                </span>
                                <span className="badge-danger">
                                    {wrong.length} incorrectes
                                </span>
                            </div>
                            {wrong.length > 0 && (
                                <button
                                    onClick={() => setShowAll((v) => !v)}
                                    className="btn-secondary !py-1.5 !text-xs"
                                >
                                    {showAll ? 'Erreurs seulement' : 'Voir tout'}
                                </button>
                            )}
                        </div>
                    </div>

                    {wrong.length === 0 && !showAll && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                <Icon.Check className="h-5 w-5" />
                            </span>
                            <div>
                                <div className="font-semibold text-emerald-700 dark:text-emerald-200">
                                    Sans-faute
                                </div>
                                <div className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
                                    Toutes les questions ont la bonne réponse — bravo. Recommence l'examen pour tomber sur d'autres questions du pool.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {shownDetails.map((d) => (
                            <details
                                key={d.position}
                                open={!showAll && !d.is_correct}
                                className={`group rounded-xl border ${
                                    d.is_correct
                                        ? 'border-emerald-500/20 bg-emerald-500/5'
                                        : 'border-rose-500/20 bg-rose-500/5'
                                }`}
                            >
                                <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                d.is_correct
                                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                            }`}
                                        >
                                            {d.is_correct ? <Icon.Check className="h-4 w-4" /> : <Icon.Close className="h-4 w-4" />}
                                        </span>
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                                Q{d.position} {d.topic && `· ${d.topic}`}
                                            </div>
                                            <div className="line-clamp-1 text-sm font-medium text-ink-900 dark:text-white">
                                                {d.question_text}
                                            </div>
                                        </div>
                                    </div>
                                    <Icon.ChevronDown className="h-4 w-4 shrink-0 text-ink-400 transition group-open:rotate-180" />
                                </summary>
                                <div className="border-t border-ink-200/60 p-4 dark:border-ink-800/60">
                                    {d.scenario && (
                                        <p className="mb-3 rounded-lg bg-white/50 p-3 text-sm italic text-ink-600 dark:bg-ink-900/40 dark:text-ink-400">
                                            {d.scenario}
                                        </p>
                                    )}
                                    <p className="mb-3 text-sm font-medium text-ink-900 dark:text-white">{d.question_text}</p>

                                    <div className="space-y-2 text-sm">
                                        {/* Réponse choisie */}
                                        <div className={`rounded-lg border p-3 ${
                                            d.is_correct
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                                                : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                                        }`}>
                                            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                                                Ta réponse
                                            </div>
                                            <div className="mt-1">
                                                {d.chosen ? `${d.chosen.letter}. ${d.chosen.text}` : 'Non répondue'}
                                            </div>
                                            {d.chosen?.rationale && (
                                                <div className="mt-2 text-xs italic opacity-90">
                                                    {d.chosen.rationale}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bonne réponse (si tu t'es trompé) */}
                                        {!d.is_correct && d.correct && (
                                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-200">
                                                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                                                    Bonne réponse
                                                </div>
                                                <div className="mt-1">
                                                    {d.correct.letter}. {d.correct.text}
                                                </div>
                                                {d.correct.rationale && (
                                                    <div className="mt-2 text-xs italic opacity-90">
                                                        {d.correct.rationale}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Explication pédagogique globale */}
                                        {d.explanation && (
                                            <div className="rounded-lg border-l-4 border-brand-500 bg-brand-500/5 p-3">
                                                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                                                    <Icon.Sparkles className="h-3 w-3" />
                                                    Pédagogie
                                                </div>
                                                <p className="text-sm text-ink-700 dark:text-ink-200">
                                                    {d.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
