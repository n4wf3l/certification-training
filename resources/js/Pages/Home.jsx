import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

function Logo({ certification }) {
    if (certification.logo_path) {
        return (
            <img
                src={`/storage/${certification.logo_path}`}
                alt={certification.title}
                className="h-12 w-12 object-contain"
            />
        );
    }
    const initials = certification.title
        .replace(/[^A-Za-z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 3)
        .join('')
        .toUpperCase();
    return (
        <div className="flex h-12 w-12 items-center justify-center border border-ink-800 bg-ink-950 font-mono text-sm font-bold tracking-tighter text-white dark:border-ink-200 dark:bg-white dark:text-ink-950">
            {initials}
        </div>
    );
}

function CertificationRow({ certification, index }) {
    const ready = certification.ready;
    const retire = certification.version_retires_at
        ? Math.ceil((new Date(certification.version_retires_at) - new Date()) / 86400000)
        : null;
    const retireYear = certification.version_retires_at
        ? new Date(certification.version_retires_at).getFullYear()
        : null;

    return (
        <Link
            href={route('certifications.show', certification.slug)}
            className="group grid grid-cols-12 items-center gap-6 border-b border-ink-200 py-6 transition-colors hover:bg-ink-50/60 dark:border-ink-800 dark:hover:bg-ink-900/40"
        >
            <div className="col-span-1 hidden font-mono text-xs text-ink-400 sm:block">
                {String(index + 1).padStart(2, '0')}
            </div>

            <div className="col-span-12 flex items-center gap-4 sm:col-span-4">
                <Logo certification={certification} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold tracking-tight text-ink-900 dark:text-white">
                            {certification.title}
                        </h3>
                        {!ready && (
                            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                                bientôt
                            </span>
                        )}
                    </div>
                    {certification.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-500 dark:text-ink-400">
                            {certification.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="col-span-6 grid grid-cols-3 gap-4 font-mono text-xs sm:col-span-5">
                <div>
                    <div className="text-[15px] font-medium text-ink-900 dark:text-white">
                        {certification.available_questions}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-400">
                        questions
                    </div>
                </div>
                <div>
                    <div className="text-[15px] font-medium text-ink-900 dark:text-white">
                        {certification.duration_minutes}
                        <span className="text-ink-400"> min</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-400">
                        durée
                    </div>
                </div>
                <div>
                    <div className="text-[15px] font-medium text-ink-900 dark:text-white">
                        {certification.passing_score}
                        <span className="text-ink-400">/{certification.total_questions}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-400">
                        seuil
                    </div>
                </div>
            </div>

            <div className="col-span-6 flex items-center justify-end gap-3 sm:col-span-2">
                {retire !== null && retire < 540 && retire > 0 && (
                    <span className={`hidden font-mono text-[10px] uppercase tracking-widest sm:inline ${retire < 180 ? 'text-rose-500' : 'text-amber-500'}`}>
                        retrait {retireYear}
                    </span>
                )}
                <span className="text-ink-400 transition-transform group-hover:translate-x-1 group-hover:text-ink-900 dark:group-hover:text-white">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>
        </Link>
    );
}

function SectionLabel({ children }) {
    return (
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400">
            <span className="h-px w-6 bg-ink-400 dark:bg-ink-600" />
            {children}
        </div>
    );
}

export default function Home({ certifications }) {
    const ready = certifications.filter((c) => c.ready);
    const soon = certifications.filter((c) => !c.ready);
    const totalQuestions = certifications.reduce((sum, c) => sum + (c.available_questions || 0), 0);
    const lastUpdate = certifications
        .map((c) => c.questions_updated_at)
        .filter(Boolean)
        .sort()
        .pop();

    return (
        <AppLayout ambient={false}>
            <Head title="Examens" />

            {/* HERO */}
            <section className="border-b border-ink-200 pb-16 pt-6 dark:border-ink-800 sm:pt-10">
                <SectionLabel>Méthode — Répétition adaptative</SectionLabel>

                <h1 className="mt-8 max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900 dark:text-white sm:text-[68px]">
                    Prépare l'examen<br />
                    <span className="text-ink-400 dark:text-ink-500">comme ceux qui</span> l'ont eu.
                </h1>

                <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-600 dark:text-ink-300 sm:text-lg">
                    Cours structurés et examens blancs rédigés à partir de l'expérience réelle
                    des candidats. Un moteur d'entraînement qui insiste sur tes erreurs — jusqu'à
                    ce qu'elles n'en soient plus.
                </p>

                <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6">
                    <div>
                        <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                            {ready.length}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            certifications
                        </div>
                    </div>
                    <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
                    <div>
                        <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                            {totalQuestions}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            questions
                        </div>
                    </div>
                    <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
                    <div>
                        <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                            {lastUpdate ? new Date(lastUpdate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            dernière mise à jour
                        </div>
                    </div>
                    <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
                    <div>
                        <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                            Gratuit
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            sans carte, sans pub
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <a
                        href="#certifications"
                        className="inline-flex items-center gap-2 border-b border-ink-900 pb-1 text-sm font-medium text-ink-900 transition hover:gap-3 dark:border-white dark:text-white"
                    >
                        Voir la liste des certifications
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </a>
                </div>
            </section>

            {/* METHOD */}
            <section id="comment-ca-marche" className="border-b border-ink-200 py-20 dark:border-ink-800">
                <SectionLabel>Comment ça marche</SectionLabel>
                <h2 className="mt-6 max-w-2xl text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                    Trois étapes. Pas de tunnel marketing. Pas d'essai limité.
                </h2>

                <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
                    <div>
                        <div className="font-mono text-xs font-medium text-ink-400">01</div>
                        <div className="mt-3 h-px w-8 bg-ink-900 dark:bg-white" />
                        <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">
                            Choisis ta certif.
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                            ITIL, CCNA, CompTIA A+, AWS Cloud Practitioner. Cours structuré,
                            flashcards ou examen blanc — au choix, quand tu veux.
                        </p>
                    </div>
                    <div>
                        <div className="font-mono text-xs font-medium text-ink-400">02</div>
                        <div className="mt-3 h-px w-8 bg-ink-900 dark:bg-white" />
                        <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">
                            Passe l'examen.
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                            Timer réel, barème officiel, tirage aléatoire. Correction complète
                            question par question à la fin, avec les explications.
                        </p>
                    </div>
                    <div>
                        <div className="font-mono text-xs font-medium text-ink-400">03</div>
                        <div className="mt-3 h-px w-8 bg-ink-900 dark:bg-white" />
                        <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">
                            Recommence sur tes erreurs.
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                            Les questions que tu rates reviennent en priorité — pondérées par
                            la difficulté et le temps écoulé. Jusqu'à ce qu'elles cassent plus.
                        </p>
                    </div>
                </div>
            </section>

            {/* CERTIFICATIONS */}
            <section id="certifications" className="py-20">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <SectionLabel>Certifications disponibles</SectionLabel>
                        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                            {ready.length} en ligne
                            {soon.length > 0 && (
                                <span className="text-ink-400"> · {soon.length} à venir</span>
                            )}
                        </h2>
                    </div>
                    <div className="font-mono text-xs text-ink-400">
                        Cliquer une ligne pour ouvrir le cours et l'examen.
                    </div>
                </div>

                {certifications.length === 0 ? (
                    <div className="mt-10 border-y border-ink-200 py-16 text-center font-mono text-sm text-ink-500 dark:border-ink-800">
                        Aucune certification disponible pour le moment.
                    </div>
                ) : (
                    <div className="mt-10 border-t border-ink-200 dark:border-ink-800">
                        {[...ready, ...soon].map((c, idx) => (
                            <CertificationRow key={c.id} certification={c} index={idx} />
                        ))}
                    </div>
                )}
            </section>
        </AppLayout>
    );
}