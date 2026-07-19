import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
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
    return `${m}m ${s}s`;
}

export default function Index({ attempts, summary }) {
    return (
        <AppLayout>
            <Head title="Mes statistiques" />
            <div className="mx-auto max-w-6xl space-y-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Mes statistiques
                </h1>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <SummaryCard label="Examens tentés" value={summary.total_attempts} />
                    <SummaryCard label="Examens réussis" value={summary.passed_attempts} />
                    <SummaryCard label="Meilleur score" value={`${summary.best_percentage} %`} />
                    <SummaryCard label="Moyenne" value={`${summary.average_percentage} %`} />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Certification</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">%</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Durée</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {attempts.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        {a.certification.title}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                        {a.score} / {a.total_questions}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                        {a.percentage} %
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                                                a.passed
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                            }`}
                                        >
                                            {a.passed ? 'Réussi' : 'Échoué'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                        {formatDuration(a.duration_seconds)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {formatDate(a.completed_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route('exam.result', a.id)}
                                            className="text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            Voir
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {attempts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        Aucune tentative pour le moment.{' '}
                                        <Link href={route('home')} className="text-indigo-600 hover:underline">
                                            Choisis un examen
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
                {value}
            </div>
        </div>
    );
}
