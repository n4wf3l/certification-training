import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ certifications }) {
    const destroy = (id) => {
        if (confirm('Supprimer cette certification et toutes ses questions ?')) {
            router.delete(route('admin.certifications.destroy', id));
        }
    };

    return (
        <AppLayout>
            <Head title="Admin — Certifications" />
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Certifications
                    </h1>
                    <Link
                        href={route('admin.certifications.create')}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        + Nouvelle
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Logo</th>
                                <th className="px-4 py-3">Titre</th>
                                <th className="px-4 py-3">Durée</th>
                                <th className="px-4 py-3">Questions</th>
                                <th className="px-4 py-3">Score requis</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {certifications.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-4 py-3">
                                        {c.logo_path ? (
                                            <img
                                                src={`/storage/${c.logo_path}`}
                                                alt=""
                                                className="h-10 w-10 object-contain"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                                                {c.title.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        {c.title}
                                        <div className="text-xs text-slate-500">{c.slug}</div>
                                    </td>
                                    <td className="px-4 py-3">{c.duration_minutes} min</td>
                                    <td className="px-4 py-3">
                                        {c.questions_count} / {c.total_questions}
                                    </td>
                                    <td className="px-4 py-3">{c.passing_score}</td>
                                    <td className="px-4 py-3">
                                        {c.is_active ? (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                Actif
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                Masqué
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route('admin.certifications.edit', c.id)}
                                            className="mr-2 text-indigo-600 hover:underline"
                                        >
                                            Éditer
                                        </Link>
                                        <button
                                            onClick={() => destroy(c.id)}
                                            className="text-rose-600 hover:underline"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {certifications.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        Aucune certification.
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
