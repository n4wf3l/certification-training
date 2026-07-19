import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

function formatDuration(seconds) {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function Result({ attempt, certification, details, mastery }) {
    const passed = attempt.passed;

    return (
        <AppLayout>
            <Head title={`Résultat — ${certification.title}`} />
            <div className="mx-auto max-w-4xl space-y-8">
                <div
                    className={`overflow-hidden rounded-2xl border p-8 text-center shadow-sm ${
                        passed
                            ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-900/30 dark:to-teal-900/30'
                            : 'border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 dark:border-rose-800 dark:from-rose-900/30 dark:to-orange-900/30'
                    }`}
                >
                    <div
                        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold ${
                            passed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                        }`}
                    >
                        {passed ? '✓' : '✗'}
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                        {passed ? 'Réussi !' : 'Non validé'}
                    </h1>
                    <p className="mt-2 text-slate-700 dark:text-slate-300">
                        {certification.title}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-6">
                        <ResultStat
                            label="Score"
                            value={`${attempt.score} / ${attempt.total_questions}`}
                        />
                        <ResultStat label="Pourcentage" value={`${attempt.percentage} %`} />
                        <ResultStat
                            label="Requis"
                            value={`${attempt.passing_score} / ${attempt.total_questions}`}
                        />
                        <ResultStat label="Temps" value={formatDuration(attempt.duration_seconds)} />
                    </div>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            href={route('certifications.show', certification.id)}
                            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
                        >
                            Recommencer
                        </Link>
                        <Link
                            href={route('stats.index')}
                            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Voir mes stats
                        </Link>
                        <Link
                            href={route('home')}
                            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Autres examens
                        </Link>
                    </div>
                </div>

                {mastery && mastery.total > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Ta maîtrise du pool
                            </h2>
                            <span className="text-sm text-slate-500">
                                {mastery.mastered} / {mastery.total} maîtrisées
                            </span>
                        </div>
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div className="bg-emerald-500" style={{ width: `${(mastery.mastered / mastery.total) * 100}%` }} />
                            <div className="bg-amber-500" style={{ width: `${(mastery.in_progress / mastery.total) * 100}%` }} />
                            <div className="bg-rose-500" style={{ width: `${(mastery.to_review / mastery.total) * 100}%` }} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                            <ChipR color="emerald" label="Maîtrisées" value={mastery.mastered} />
                            <ChipR color="amber" label="En progrès" value={mastery.in_progress} />
                            <ChipR color="rose" label="À revoir" value={mastery.to_review} />
                            <ChipR color="slate" label="Jamais vues" value={mastery.never_seen} />
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            Une question est marquée maîtrisée après 2 bonnes réponses consécutives. Les erreurs remontent en priorité dans la sélection.
                        </p>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
                        Correction détaillée
                    </h2>
                    <div className="space-y-4">
                        {details.map((d) => (
                            <div
                                key={d.position}
                                className={`rounded-xl border-l-4 border p-4 ${
                                    d.is_correct
                                        ? 'border-l-emerald-500 border-slate-200 bg-emerald-50/40 dark:border-slate-800 dark:bg-emerald-900/10'
                                        : 'border-l-rose-500 border-slate-200 bg-rose-50/40 dark:border-slate-800 dark:bg-rose-900/10'
                                }`}
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-500">
                                        Question {d.position}
                                        {d.topic && ` — ${d.topic}`}
                                    </div>
                                    <div
                                        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                                            d.is_correct
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                        }`}
                                    >
                                        {d.is_correct ? 'Correct' : 'Incorrect'}
                                    </div>
                                </div>
                                {d.scenario && (
                                    <p className="mb-2 text-sm italic text-slate-600 dark:text-slate-400">
                                        {d.scenario}
                                    </p>
                                )}
                                <p className="mb-3 font-medium text-slate-900 dark:text-slate-100">
                                    {d.question_text}
                                </p>
                                <div className="space-y-1 text-sm">
                                    <div className="text-slate-700 dark:text-slate-300">
                                        <span className="font-semibold">Ta réponse :</span>{' '}
                                        {d.chosen ? `${d.chosen.letter}. ${d.chosen.text}` : 'Non répondue'}
                                    </div>
                                    <div className="text-emerald-700 dark:text-emerald-300">
                                        <span className="font-semibold">Bonne réponse :</span>{' '}
                                        {d.correct ? `${d.correct.letter}. ${d.correct.text}` : '—'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ResultStat({ label, value }) {
    return (
        <div className="text-center">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        </div>
    );
}

function ChipR({ color, label, value }) {
    const colors = {
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
    return (
        <div className={`rounded-lg px-2 py-1 text-center ${colors[color]}`}>
            <div className="font-bold">{value}</div>
            <div>{label}</div>
        </div>
    );
}
