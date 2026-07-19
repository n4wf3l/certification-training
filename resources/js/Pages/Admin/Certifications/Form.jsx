import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Form({ certification }) {
    const editing = !!certification;

    const { data, setData, post, processing, errors, progress } = useForm({
        title: certification?.title ?? '',
        slug: certification?.slug ?? '',
        description: certification?.description ?? '',
        duration_minutes: certification?.duration_minutes ?? 60,
        passing_score: certification?.passing_score ?? 26,
        total_questions: certification?.total_questions ?? 40,
        is_active: certification?.is_active ?? true,
        logo: null,
        _method: editing ? 'put' : 'post',
    });

    const submit = (e) => {
        e.preventDefault();
        const url = editing
            ? route('admin.certifications.update', certification.id)
            : route('admin.certifications.store');
        post(url, { forceFormData: true });
    };

    return (
        <AppLayout>
            <Head title={editing ? `Éditer ${certification.title}` : 'Nouvelle certification'} />
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {editing ? `Éditer ${certification.title}` : 'Nouvelle certification'}
                    </h1>
                    <Link
                        href={route('admin.certifications.index')}
                        className="text-sm text-slate-500 hover:underline"
                    >
                        ← Retour
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <Field label="Titre" error={errors.title}>
                        <input
                            className="input"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                    </Field>
                    <Field label="Slug (laisser vide pour auto)" error={errors.slug}>
                        <input
                            className="input"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                        />
                    </Field>
                    <Field label="Description" error={errors.description}>
                        <textarea
                            className="input"
                            rows={3}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="Durée (minutes)" error={errors.duration_minutes}>
                            <input
                                type="number"
                                min="1"
                                className="input"
                                value={data.duration_minutes}
                                onChange={(e) => setData('duration_minutes', +e.target.value)}
                            />
                        </Field>
                        <Field label="Score requis" error={errors.passing_score}>
                            <input
                                type="number"
                                min="1"
                                className="input"
                                value={data.passing_score}
                                onChange={(e) => setData('passing_score', +e.target.value)}
                            />
                        </Field>
                        <Field label="Nombre de questions cible" error={errors.total_questions}>
                            <input
                                type="number"
                                min="1"
                                className="input"
                                value={data.total_questions}
                                onChange={(e) => setData('total_questions', +e.target.value)}
                            />
                        </Field>
                    </div>
                    <Field label="Logo (PNG/JPG/SVG, max 2 Mo)" error={errors.logo}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                        />
                        {progress && (
                            <div className="mt-2 h-1 w-full rounded bg-slate-200">
                                <div
                                    className="h-1 rounded bg-indigo-500"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        )}
                        {editing && certification.logo_path && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                Actuel :
                                <img
                                    src={`/storage/${certification.logo_path}`}
                                    alt=""
                                    className="h-10 w-10 object-contain"
                                />
                            </div>
                        )}
                    </Field>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={!!data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                        />
                        Visible sur la page d'accueil
                    </label>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
                        >
                            {editing ? 'Mettre à jour' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.5rem;
                    border: 1px solid rgb(203 213 225);
                    background: white;
                    color: rgb(15 23 42);
                }
                .dark .input {
                    background: rgb(15 23 42);
                    border-color: rgb(51 65 85);
                    color: rgb(226 232 240);
                }
            `}</style>
        </AppLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {label}
            </label>
            {children}
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        </div>
    );
}
