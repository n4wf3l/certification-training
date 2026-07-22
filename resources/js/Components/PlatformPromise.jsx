import Icon from '@/Components/Icons';

const FREE_UNTIL_USERS = 10000;

const PROMISES = [
    {
        Icon: Icon.Timer,
        title: 'Gestion du temps',
        desc: "Timer réel, barème officiel, tirage aléatoire dans le pool — tu apprends à gérer les 40 questions dans la durée imposée.",
    },
    {
        Icon: Icon.Refresh,
        title: 'Ancrage du vocabulaire',
        desc: "Répétition adaptative sur tes erreurs, avec explication de la bonne réponse et rationale des distracteurs. Le lexique officiel rentre en mémoire long terme.",
    },
    {
        Icon: Icon.Book,
        title: 'Cours & flashcards',
        desc: "Résumés structurés, définitions à mémoriser — pensés en complément de la doc officielle, pas en remplacement.",
    },
    {
        Icon: Icon.Target,
        title: 'Progrès mesurables',
        desc: "Score, taux de réussite, courbe d'évolution, meilleur temps par certif. Tu vois si tu es prêt le jour J.",
    },
];

export default function PlatformPromise({ compact = false }) {
    if (compact) {
        return (
            <div className="card relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-30" />
                <div className="relative flex flex-wrap items-center gap-3">
                    <span className="badge-brand font-semibold">
                        <Icon.Sparkles className="h-3.5 w-3.5" />
                        Outil d'entraînement complémentaire
                    </span>
                    <span className="text-sm text-ink-700 dark:text-ink-200">
                        Gratuit jusqu'aux{' '}
                        <span className="font-mono font-bold text-ink-900 dark:text-white">{FREE_UNTIL_USERS.toLocaleString('fr-FR')}</span>{' '}
                        premiers inscrits — à utiliser avec la doc officielle PeopleCert / Cisco / CompTIA / AWS.
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
                        <div className="badge-brand">
                            <Icon.Sparkles className="h-3.5 w-3.5" />
                            Outil d'entraînement complémentaire
                        </div>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                            Pour <span className="gradient-text">tester la gestion du temps</span> et ancrer le vocabulaire officiel.
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
                            CertifLoop ne remplace pas les manuels officiels PeopleCert / Cisco / CompTIA / AWS.
                            La plateforme est faite pour <span className="font-semibold text-ink-900 dark:text-white">la dernière ligne droite</span>
                            {' '}: enchaîner des sessions timées, identifier les zones faibles, et consolider les définitions par répétition espacée.
                            Gratuit jusqu'aux <span className="font-semibold text-ink-900 dark:text-white">{FREE_UNTIL_USERS.toLocaleString('fr-FR')} premiers inscrits</span>.
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
