import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
    return (
        <AppLayout>
            <Head title="Admin" />
            <div className="mx-auto max-w-6xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Console admin
                    </h1>
                    <p className="text-slate-500">Gère les certifications, les questions et suis l'activité.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card label="Certifications" value={stats.certifications} />
                    <Card label="Questions" value={stats.questions} />
                    <Card label="Utilisateurs" value={stats.users} />
                    <Card label="Tentatives" value={stats.attempts} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href={route('admin.certifications.index')}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                            Certifications
                        </div>
                        <div className="text-sm text-slate-500">Créer, modifier, ajouter un logo et fixer le score requis.</div>
                    </Link>
                    <Link
                        href={route('admin.questions.index')}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="text-lg font-bold text-slate-900 dark:text-white">Questions & réponses</div>
                        <div className="text-sm text-slate-500">Gérer les Q/A par certification.</div>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}

function Card({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
                {value}
            </div>
        </div>
    );
}
