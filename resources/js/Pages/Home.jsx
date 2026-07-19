import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

function CertificationCard({ certification }) {
    return (
        <Link
            href={route('certifications.show', certification.id)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="mb-4 flex items-center justify-center">
                {certification.logo_path ? (
                    <img
                        src={`/storage/${certification.logo_path}`}
                        alt={certification.title}
                        className="h-24 w-24 object-contain"
                    />
                ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-inner">
                        {certification.title
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 3)
                            .join('')
                            .toUpperCase()}
                    </div>
                )}
            </div>
            <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white">
                {certification.title}
            </h3>
            {certification.description && (
                <p className="mt-2 line-clamp-3 text-center text-sm text-slate-600 dark:text-slate-400">
                    {certification.description}
                </p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white">
                        {certification.duration_minutes}
                    </div>
                    <div className="text-slate-500">min</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white">
                        {certification.available_questions}
                    </div>
                    <div className="text-slate-500">questions</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white">
                        {certification.passing_score}
                    </div>
                    <div className="text-slate-500">pour valider</div>
                </div>
            </div>
            <div className="mt-4 text-center">
                {certification.ready ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Prêt à démarrer
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Bientôt disponible
                    </span>
                )}
            </div>
        </Link>
    );
}

export default function Home({ certifications }) {
    return (
        <AppLayout>
            <Head title="Certifications" />
            <div className="mx-auto mb-10 max-w-3xl text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                    Prépare ta prochaine certification
                </h1>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                    Choisis un examen ci-dessous, réponds aux questions en conditions réelles,
                    obtiens un score et recommence autant que tu veux.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {certifications.map((c) => (
                    <CertificationCard key={c.id} certification={c} />
                ))}
            </div>
            {certifications.length === 0 && (
                <div className="mt-16 text-center text-slate-500">
                    Aucune certification disponible pour le moment.
                </div>
            )}
        </AppLayout>
    );
}
