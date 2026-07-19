import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function Intro({ certification, mastery }) {
    const user = usePage().props.auth?.user;

    const start = () => {
        router.post(route('exam.start', certification.id));
    };

    return (
        <AppLayout>
            <Head title={certification.title} />
            <div className="mx-auto max-w-3xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col items-center gap-6 border-b border-slate-200 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-8 dark:border-slate-800">
                        {certification.logo_path ? (
                            <img
                                src={`/storage/${certification.logo_path}`}
                                alt={certification.title}
                                className="h-32 w-32 object-contain"
                            />
                        ) : (
                            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-4xl font-bold text-white shadow-lg">
                                {certification.title
                                    .split(' ')
                                    .map((w) => w[0])
                                    .slice(0, 3)
                                    .join('')
                                    .toUpperCase()}
                            </div>
                        )}
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {certification.title}
                            </h1>
                            {certification.description && (
                                <p className="mt-2 text-slate-600 dark:text-slate-400">
                                    {certification.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                        <Stat label="Durée" value={`${certification.duration_minutes} min`} />
                        <Stat
                            label="Questions"
                            value={
                                certification.available_questions > certification.sample_size
                                    ? `${certification.sample_size} tirées sur ${certification.available_questions}`
                                    : certification.sample_size
                            }
                        />
                        <Stat label="Barème officiel" value={`${certification.passing_score}/${certification.total_questions}`} />
                        <Stat
                            label="Requis pour valider"
                            value={`${certification.scaled_passing_score}/${certification.sample_size}`}
                        />
                    </div>
                    {mastery && mastery.total > 0 && (
                        <div className="border-t border-slate-200 p-6 dark:border-slate-800">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    Ta progression sur cet examen
                                </span>
                                <span className="text-slate-500">
                                    {mastery.mastered} maîtrisées / {mastery.total}
                                </span>
                            </div>
                            <MasteryBar mastery={mastery} />
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                <Chip color="emerald" label="Maîtrisées" value={mastery.mastered} />
                                <Chip color="amber" label="En progrès" value={mastery.in_progress} />
                                <Chip color="rose" label="À revoir" value={mastery.to_review} />
                                <Chip color="slate" label="Jamais vues" value={mastery.never_seen} />
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                Les questions ratées auparavant reviennent en priorité dans la sélection.
                            </p>
                        </div>
                    )}
                    <div className="border-t border-slate-200 p-6 text-center dark:border-slate-800">
                        {user ? (
                            certification.available_questions > 0 ? (
                                <button
                                    onClick={start}
                                    className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-500"
                                >
                                    Démarrer l'examen
                                </button>
                            ) : (
                                <div className="rounded-xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                                    Aucune question configurée pour le moment.
                                </div>
                            )
                        ) : (
                            <div className="space-y-3">
                                <p className="text-slate-600 dark:text-slate-400">
                                    Connecte-toi pour démarrer l'examen — tu reviendras ici automatiquement.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <Link
                                        href={`${route('login')}?redirect_to=${encodeURIComponent(`/certifications/${certification.id}`)}`}
                                        className="rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500"
                                    >
                                        Se connecter et démarrer
                                    </Link>
                                    <Link
                                        href={`${route('register')}?redirect_to=${encodeURIComponent(`/certifications/${certification.id}`)}`}
                                        className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Créer un compte
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        </div>
    );
}

function MasteryBar({ mastery }) {
    const t = mastery.total || 1;
    const pct = (n) => `${Math.round((n / t) * 100)}%`;
    return (
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="bg-emerald-500" style={{ width: pct(mastery.mastered) }} />
            <div className="bg-amber-500" style={{ width: pct(mastery.in_progress) }} />
            <div className="bg-rose-500" style={{ width: pct(mastery.to_review) }} />
        </div>
    );
}

function Chip({ color, label, value }) {
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
