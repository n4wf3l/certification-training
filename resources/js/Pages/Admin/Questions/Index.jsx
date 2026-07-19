import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ certifications, selected_certification_id, questions }) {
    const destroy = (id) => {
        if (confirm('Supprimer cette question ?')) {
            router.delete(route('admin.questions.destroy', id));
        }
    };

    const changeFilter = (e) => {
        const v = e.target.value;
        router.get(route('admin.questions.index'), v ? { certification_id: v } : {}, {
            preserveState: false,
        });
    };

    return (
        <AppLayout>
            <Head title="Admin — Questions" />
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Questions
                    </h1>
                    <div className="flex gap-2">
                        <select
                            value={selected_certification_id ?? ''}
                            onChange={changeFilter}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                            <option value="">Toutes les certifications</option>
                            {certifications.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                        <Link
                            href={
                                selected_certification_id
                                    ? `${route('admin.questions.create')}?certification_id=${selected_certification_id}`
                                    : route('admin.questions.create')
                            }
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            + Nouvelle question
                        </Link>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Certification</th>
                                <th className="px-4 py-3">Topic</th>
                                <th className="px-4 py-3">Question</th>
                                <th className="px-4 py-3">Réponses</th>
                                <th className="px-4 py-3">Correcte</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {questions.map((q) => (
                                <tr key={q.id}>
                                    <td className="px-4 py-3 text-slate-500">{q.position}</td>
                                    <td className="px-4 py-3">{q.certification.title}</td>
                                    <td className="px-4 py-3 text-slate-500">{q.topic || '—'}</td>
                                    <td className="px-4 py-3 max-w-xl truncate text-slate-900 dark:text-white">
                                        {q.question_text}
                                    </td>
                                    <td className="px-4 py-3">{q.answers_count}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                            {q.correct_letter ?? '?'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route('admin.questions.edit', q.id)}
                                            className="mr-2 text-indigo-600 hover:underline"
                                        >
                                            Éditer
                                        </Link>
                                        <button
                                            onClick={() => destroy(q.id)}
                                            className="text-rose-600 hover:underline"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {questions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        Aucune question.
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
