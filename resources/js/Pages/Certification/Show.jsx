import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import PlatformPromise from '@/Components/PlatformPromise';
import { Head, Link } from '@inertiajs/react';

function Logo({ certification, size = 'lg' }) {
    if (certification.logo_path) {
        return (
            <img
                src={`/storage/${certification.logo_path}`}
                alt={certification.title}
                className={`${size === 'lg' ? 'h-24 w-24' : 'h-14 w-14'} object-contain`}
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
        <div className={`${size === 'lg' ? 'h-24 w-24 text-2xl' : 'h-14 w-14 text-lg'} flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-iris-500 font-bold text-white shadow-glow`}>
            {initials}
        </div>
    );
}

function ModeCard({ href, disabled, IconComp, title, description, meta, accent, badge }) {
    const accents = {
        brand: 'from-brand-500 to-iris-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
    };
    const Wrapper = disabled ? 'div' : Link;
    const wrapperProps = disabled ? {} : { href };

    return (
        <Wrapper
            {...wrapperProps}
            className={`card group relative flex flex-col overflow-hidden p-6 transition-all ${
                disabled
                    ? 'cursor-not-allowed opacity-70'
                    : 'card-lift hover:border-brand-500/40'
            }`}
        >
            {/* Glow accent */}
            <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10 blur-2xl transition group-hover:opacity-30`} />

            <div className="mb-5 flex items-start justify-between">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[accent]} text-white shadow-glow`}>
                    <IconComp className="h-6 w-6" />
                </div>
                {badge && <span className="badge-warn">{badge}</span>}
            </div>

            <h3 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white">
                {title}
            </h3>
            <p className="mt-2 flex-1 text-sm text-ink-500 dark:text-ink-400">
                {description}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-ink-200/60 pt-4 dark:border-ink-800/60">
                <span className="text-xs font-medium text-ink-500">{meta}</span>
                {!disabled && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition group-hover:bg-gradient-to-br group-hover:from-brand-500 group-hover:to-iris-500 group-hover:text-white dark:bg-ink-800 dark:text-ink-300">
                        <Icon.ArrowRight className="h-4 w-4" />
                    </span>
                )}
            </div>
        </Wrapper>
    );
}

function MasteryBar({ mastery }) {
    const t = mastery.total || 1;
    const pct = (n) => `${(n / t) * 100}%`;
    return (
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div className="bg-emerald-500" style={{ width: pct(mastery.mastered) }} />
            <div className="bg-amber-500" style={{ width: pct(mastery.in_progress) }} />
            <div className="bg-rose-500" style={{ width: pct(mastery.to_review) }} />
        </div>
    );
}

function RetirementCard({ label, days, urgency }) {
    const themes = {
        past: {
            accent: 'from-rose-600 to-red-600',
            ring: 'bg-rose-500',
            title: "Version retirée par l'éditeur",
            main: `Depuis ${label}`,
            note: "Cet examen n'est plus proposé par l'organisme officiel. Les candidats qui l'avaient déjà passé restent certifiés, mais on ne peut plus s'y inscrire.",
        },
        critical: {
            accent: 'from-rose-500 to-orange-500',
            ring: 'bg-rose-500',
            title: 'Version retirée bientôt',
            main: `Encore ${days} jour${days > 1 ? 's' : ''}`,
            note: `L'éditeur retire cette version le ${label}. Passe l'examen avant cette date pour rester sur cette version.`,
        },
        warning: {
            accent: 'from-amber-500 to-orange-500',
            ring: 'bg-amber-500',
            title: 'Retrait de version programmé',
            main: `Le ${label}`,
            note: `Il te reste environ ${Math.round(days / 30)} mois pour passer cette version avant qu'elle soit remplacée par la suivante.`,
        },
        ok: {
            accent: 'from-emerald-500 to-teal-500',
            ring: 'bg-emerald-500',
            title: 'Retrait de version annoncé',
            main: `Le ${label}`,
            note: `Cette version restera proposée pendant encore ${Math.round(days / 30)} mois. Aucune urgence à s'y prendre à l'avance.`,
        },
    };
    const t = themes[urgency] || themes.ok;

    return (
        <div className="card relative overflow-hidden p-5">
            <div className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full ${t.ring} opacity-10 blur-2xl`} />
            <div className="relative flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.accent} text-white shadow-glow`}>
                    <Icon.Timer className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                        {t.title}
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-ink-900 dark:text-white">
                        {t.main}
                    </div>
                    <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                        {t.note}
                    </p>
                </div>
            </div>
        </div>
    );
}

function formatValidity(months) {
    if (!months) return null;
    if (months % 12 === 0) {
        const y = months / 12;
        return `${y} an${y > 1 ? 's' : ''}`;
    }
    return `${months} mois`;
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export default function Show({ certification, mastery }) {
    const updatedAt = certification.questions_updated_at
        ? new Date(certification.questions_updated_at).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : null;
    const validity = formatValidity(certification.validity_months);
    const retiresAt = certification.version_retires_at;
    const retiresAtLabel = retiresAt
        ? new Date(retiresAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : null;
    const daysToRetire = daysUntil(retiresAt);
    const retireUrgency = daysToRetire == null
        ? null
        : daysToRetire < 0
            ? 'past'
            : daysToRetire < 180
                ? 'critical'
                : daysToRetire < 540
                    ? 'warning'
                    : 'ok';

    return (
        <AppLayout>
            <Head title={certification.title} />
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Header */}
                <div className="card relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-50" />
                    <div className="relative flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center">
                        <Logo certification={certification} />
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link href={route('home')} className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-brand-500">
                                    <Icon.ArrowLeft className="h-3 w-3" />
                                    Certifications
                                </Link>
                                <span className="divider-dot" />
                                <span className="badge-brand">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                                    {certification.available_questions} questions
                                </span>
                                {updatedAt && (
                                    <span className="badge-success">
                                        <Icon.Check className="h-3 w-3" />
                                        Questions à jour · {updatedAt}
                                    </span>
                                )}
                                <span className="badge-brand">
                                    <Icon.Timer className="h-3 w-3" />
                                    {validity ? `Valide ${validity}` : 'Sans expiration'}
                                </span>
                                {retireUrgency === 'critical' && (
                                    <span className="badge-danger">
                                        Version retirée le {retiresAtLabel}
                                    </span>
                                )}
                                {retireUrgency === 'warning' && (
                                    <span className="badge-warn">
                                        Retrait de version le {retiresAtLabel}
                                    </span>
                                )}
                                {retireUrgency === 'past' && (
                                    <span className="badge-danger">
                                        Version retirée
                                    </span>
                                )}
                                <span className="badge-warn">Gratuit</span>
                            </div>
                            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {certification.title}
                            </h1>
                            {certification.description && (
                                <p className="mt-2 text-ink-600 dark:text-ink-400">
                                    {certification.description}
                                </p>
                            )}
                        </div>
                    </div>
                    {mastery && mastery.total > 0 && (
                        <div className="relative border-t border-ink-200/60 p-6 dark:border-ink-800/60">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                    Ta progression
                                </span>
                                <span className="font-mono text-sm text-ink-500">
                                    {mastery.mastered}/{mastery.total} maîtrisées
                                </span>
                            </div>
                            <MasteryBar mastery={mastery} />
                        </div>
                    )}
                </div>

                {/* Validity + retirement blocks */}
                {(certification.validity_months || certification.validity_note || retiresAt) && (
                    <div className="grid gap-5 md:grid-cols-2">
                        {(certification.validity_months || certification.validity_note) && (
                            <div className="card relative overflow-hidden p-5">
                                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-500 opacity-10 blur-2xl" />
                                <div className="relative flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow">
                                        <Icon.Timer className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                            Ta certification (après obtention)
                                        </div>
                                        <div className="mt-1 font-mono text-2xl font-bold text-ink-900 dark:text-white">
                                            {validity ? `Valide ${validity}` : "Sans date d'expiration"}
                                        </div>
                                        {certification.validity_note && (
                                            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                                                {certification.validity_note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {retiresAt && (
                            <RetirementCard
                                label={retiresAtLabel}
                                days={daysToRetire}
                                urgency={retireUrgency}
                            />
                        )}
                    </div>
                )}

                {/* About / importance / roles */}
                {(certification.long_description || certification.importance || (certification.target_roles && certification.target_roles.length > 0)) && (
                    <div className="grid gap-5 lg:grid-cols-3">
                        {certification.long_description && (
                            <div className="card p-6 lg:col-span-2">
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-500">
                                    <Icon.Book className="h-4 w-4" />
                                    À quoi sert cette certification
                                </h3>
                                <p className="text-ink-700 leading-relaxed dark:text-ink-200">
                                    {certification.long_description}
                                </p>
                                {certification.importance && (
                                    <div className="mt-5 rounded-xl border-l-4 border-brand-500 bg-brand-500/5 p-4">
                                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
                                            <Icon.Target className="h-3.5 w-3.5" />
                                            Pourquoi la passer
                                        </div>
                                        <p className="text-sm text-ink-700 dark:text-ink-200">
                                            {certification.importance}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        {certification.target_roles && certification.target_roles.length > 0 && (
                            <div className="card p-6">
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-500">
                                    <Icon.Trophy className="h-4 w-4" />
                                    Postes ciblés
                                </h3>
                                <ul className="space-y-2">
                                    {certification.target_roles.map((role) => (
                                        <li
                                            key={role}
                                            className="flex items-start gap-2 rounded-lg border border-ink-200/60 bg-white/50 p-2.5 text-sm text-ink-700 dark:border-ink-800/60 dark:bg-ink-900/40 dark:text-ink-200"
                                        >
                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                            {role}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Modes */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                            Choisis ta méthode
                        </h2>
                        <p className="mt-1 text-sm text-ink-500">
                            Trois approches complémentaires pour préparer ton examen.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="animate-stagger-in" style={{ animationDelay: '0ms' }}>
                            <ModeCard
                                href={route('certifications.course', certification.slug)}
                                accent="amber"
                                badge={certification.has_course ? null : 'Bientôt'}
                                disabled={!certification.has_course}
                                IconComp={Icon.Book}
                                title="Cours"
                                description={
                                    certification.has_course
                                        ? "Résumés théoriques structurés, schémas et exemples pour comprendre avant de te tester."
                                        : "Résumés théoriques, schémas et exemples pour comprendre les concepts avant de te tester."
                                }
                                meta={
                                    certification.has_course
                                        ? (certification.course_updated_at
                                            ? `Mis à jour le ${new Date(certification.course_updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                            : 'Prêt à lire')
                                        : 'Modules progressifs'
                                }
                            />
                        </div>
                        <div className="animate-stagger-in" style={{ animationDelay: '80ms' }}>
                            <ModeCard
                                href={route('certifications.flashcards', certification.slug)}
                                accent="emerald"
                                IconComp={Icon.Cards}
                                title="Flashcards"
                                description="Révise sans pression : une carte à la fois, retourne pour voir la réponse. Idéal pour ancrer les définitions."
                                meta={`${certification.available_questions} cartes`}
                            />
                        </div>
                        <div className="animate-stagger-in" style={{ animationDelay: '160ms' }}>
                            <ModeCard
                                href={route('certifications.exam', certification.slug)}
                                accent="brand"
                                IconComp={Icon.Timer}
                                title="Examen blanc"
                                description="Conditions réelles : timer, tirage aléatoire de 40 questions, score final et correction complète."
                                meta={`${certification.duration_minutes} min · ${certification.passing_score}/${certification.total_questions} pour valider`}
                            />
                        </div>
                    </div>
                </div>

                {/* Platform promise (compact) */}
                <PlatformPromise compact />
            </div>
        </AppLayout>
    );
}
