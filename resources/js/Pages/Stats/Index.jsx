import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDuration(seconds) {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

function KPI({ label, value, sub, accent = 'brand' }) {
    const accents = {
        brand: 'from-brand-500 to-iris-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
        rose: 'from-rose-500 to-pink-500',
    };
    return (
        <div className="card relative overflow-hidden p-5">
            <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10 blur-2xl`} />
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</div>
            <div className="mt-2 font-mono text-3xl font-extrabold text-ink-900 dark:text-white">
                {value}
            </div>
            {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
        </div>
    );
}

export default function Index({ attempts, summary }) {
    return (
        <AppLayout>
            <Head title="Mes statistiques" />
            <div className="mx-auto max-w-6xl space-y-8">
                <header>
                    <div className="badge-brand">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        Historique complet
                    </div>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        Mes statistiques
                    </h1>
                    <p className="mt-2 text-ink-600 dark:text-ink-400">
                        Chaque tentative est archivée. Clique sur "Voir" pour retrouver la correction complète.
                    </p>
                </header>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <KPI label="Examens tentés" value={summary.total_attempts} accent="brand" />
                    <KPI label="Réussis" value={summary.passed_attempts} sub={`sur ${summary.total_attempts}`} accent="emerald" />
                    <KPI label="Meilleur score" value={`${summary.best_percentage}%`} accent="amber" />
                    <KPI label="Moyenne" value={`${summary.average_percentage}%`} accent="rose" />
                </div>

                <div className="card overflow-hidden">
                    <div className="border-b border-ink-200/60 px-5 py-4 dark:border-ink-800/60">
                        <h2 className="font-semibold text-ink-900 dark:text-white">Toutes tes tentatives</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500 dark:bg-ink-900/40">
                                <tr>
                                    <th className="px-5 py-3">Certification</th>
                                    <th className="px-5 py-3">Score</th>
                                    <th className="px-5 py-3">%</th>
                                    <th className="px-5 py-3">Statut</th>
                                    <th className="px-5 py-3">Durée</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
                                {attempts.map((a) => (
                                    <tr key={a.id} className="transition hover:bg-ink-50 dark:hover:bg-ink-900/30">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                {a.certification.logo_path ? (
                                                    <img src={`/storage/${a.certification.logo_path}`} alt="" className="h-8 w-8 object-contain" />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 text-[10px] font-bold text-white">
                                                        {a.certification.title.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-medium text-ink-900 dark:text-white">
                                                    {a.certification.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 font-mono">{a.score}/{a.total_questions}</td>
                                        <td className="px-5 py-3 font-mono font-bold">{a.percentage}%</td>
                                        <td className="px-5 py-3">
                                            {a.passed ? (
                                                <span className="badge-success">Réussi</span>
                                            ) : (
                                                <span className="badge-danger">Échoué</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 font-mono text-ink-500">{formatDuration(a.duration_seconds)}</td>
                                        <td className="px-5 py-3 text-ink-500">{formatDate(a.completed_at)}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Link
                                                href={route('exam.result', a.id)}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-400"
                                            >
                                                Voir
                                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {attempts.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-ink-500">
                                            Aucune tentative pour le moment.{' '}
                                            <Link href={route('home')} className="text-brand-500 hover:underline">
                                                Choisis un examen
                                            </Link>.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
