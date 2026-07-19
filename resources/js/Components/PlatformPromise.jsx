import Icon from '@/Components/Icons';

const FREE_UNTIL_USERS = 10000;

const PROMISES = [
    {
        Icon: Icon.Book,
        title: 'Cours gratuits',
        desc: "Résumés structurés, schémas et exemples concrets — pensés pour comprendre, pas pour bachoter.",
    },
    {
        Icon: Icon.Timer,
        title: 'Examens blancs réels',
        desc: "Questions rédigées à partir de l'expérience réelle des candidats qui ont passé l'examen. Conditions de test authentiques.",
    },
    {
        Icon: Icon.Refresh,
        title: 'Répétition adaptative',
        desc: "Chaque erreur est enregistrée. Les questions ratées reviennent en priorité jusqu'à ce que tu les maîtrises.",
    },
    {
        Icon: Icon.Check,
        title: 'Toujours à jour',
        desc: "Les questions sont revues à chaque évolution de l'examen officiel. Date de dernière vérification affichée.",
    },
];

export default function PlatformPromise({ compact = false }) {
    if (compact) {
        return (
            <div className="card relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-30" />
                <div className="relative flex flex-wrap items-center gap-3">
                    <span className="badge-warn font-semibold">
                        <Icon.Sparkles className="h-3.5 w-3.5" />
                        100 % gratuit
                    </span>
                    <span className="text-sm text-ink-700 dark:text-ink-200">
                        Jusqu'aux <span className="font-mono font-bold text-ink-900 dark:text-white">{FREE_UNTIL_USERS.toLocaleString('fr-FR')}</span> premiers utilisateurs.
                    </span>
                    <span className="text-xs text-ink-500">
                        Ni carte bancaire, ni essai limité, ni pub.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <section className="card relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-40" />
            <div className="relative border-b border-ink-200/60 p-6 dark:border-ink-800/60">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="badge-warn">
                            <Icon.Sparkles className="h-3.5 w-3.5" />
                            Offre de lancement
                        </div>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                            100 % gratuit jusqu'à{' '}
                            <span className="gradient-text">
                                {FREE_UNTIL_USERS.toLocaleString('fr-FR')} utilisateurs
                            </span>
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
                            Pas de carte bancaire. Pas d'essai limité. Pas de publicité. On se finance ensuite
                            avec un abonnement optionnel, mais tout ce qui existe aujourd'hui restera gratuit
                            pour les premiers inscrits.
                        </p>
                    </div>
                </div>
            </div>
            <div className="relative grid gap-4 p-6 sm:grid-cols-2">
                {PROMISES.map((p) => (
                    <div
                        key={p.title}
                        className="flex items-start gap-3 rounded-xl border border-ink-200/60 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow">
                            <p.Icon className="h-4 w-4" />
                        </span>
                        <div>
                            <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                {p.title}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-400">
                                {p.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
