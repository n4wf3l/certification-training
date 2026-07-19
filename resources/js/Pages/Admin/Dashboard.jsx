import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
    return (
        <AppLayout>
            <Head title="Dashboard admin" />
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div>
                    <div className="badge-brand">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        Console d'administration
                    </div>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Vue d'ensemble de la plateforme et raccourcis vers les principales actions.
                    </p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Kpi
                        label="Certifications"
                        value={stats.certifications}
                        IconComp={Icon.Book}
                        accent="brand"
                        href={route('admin.certifications.index')}
                    />
                    <Kpi
                        label="Questions"
                        value={stats.questions}
                        IconComp={Icon.Cards}
                        accent="emerald"
                        href={route('admin.questions.index')}
                    />
                    <Kpi
                        label="Utilisateurs"
                        value={stats.users}
                        IconComp={Icon.User}
                        accent="amber"
                    />
                    <Kpi
                        label="Tentatives"
                        value={stats.attempts}
                        IconComp={Icon.Chart}
                        accent="rose"
                    />
                </div>

                {/* Quick actions */}
                <div>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">
                        Actions rapides
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <ActionCard
                            href={route('admin.certifications.index')}
                            IconComp={Icon.Book}
                            accent="brand"
                            title="Gérer les certifications"
                            description="Créer, éditer, uploader un logo, fixer le score requis et la validité."
                        />
                        <ActionCard
                            href={route('admin.questions.index')}
                            IconComp={Icon.Cards}
                            accent="emerald"
                            title="Gérer les Q/R"
                            description="Ajouter des questions, corriger les réponses, réviser le contenu."
                        />
                        <ActionCard
                            href={route('admin.questions.import')}
                            IconComp={Icon.Bolt}
                            accent="brand"
                            title="Import Q/R via ChatGPT"
                            description="Prompt prêt à l'emploi, colle le JSON, importe des dizaines de Q/R d'un coup."
                        />
                        <ActionCard
                            href={route('admin.certifications.course-import')}
                            IconComp={Icon.Book}
                            accent="emerald"
                            title="Import cours via ChatGPT"
                            description="Recherche web à jour, blocs JSON structurés, cours complet publié en un import."
                        />
                        <ActionCard
                            href={route('admin.settings.edit')}
                            IconComp={Icon.Shield}
                            accent="brand"
                            title="Paramètres plateforme"
                            description="Change le nom et le logo de la marque affichés dans toute l'application."
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Kpi({ label, value, IconComp, accent, href }) {
    const accents = {
        brand: 'from-brand-500 to-iris-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
        rose: 'from-rose-500 to-pink-500',
    };
    const content = (
        <div className="card-lift group relative overflow-hidden p-5">
            <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10 blur-2xl`} />
            <div className="relative flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                        {label}
                    </div>
                    <div className="mt-2 font-mono text-3xl font-extrabold text-ink-900 dark:text-white">
                        {value}
                    </div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]} text-white shadow-glow`}>
                    <IconComp className="h-5 w-5" />
                </div>
            </div>
            {href && (
                <div className="relative mt-4 flex items-center gap-1 text-xs font-medium text-brand-500 opacity-0 transition group-hover:opacity-100">
                    Ouvrir <Icon.ArrowRight className="h-3 w-3" />
                </div>
            )}
        </div>
    );
    return href ? <Link href={href}>{content}</Link> : content;
}

function ActionCard({ href, IconComp, accent, title, description }) {
    const accents = {
        brand: 'from-brand-500 to-iris-500',
        emerald: 'from-emerald-500 to-teal-500',
    };
    return (
        <Link
            href={href}
            className="card-lift group relative flex items-start gap-4 overflow-hidden p-5"
        >
            <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10 blur-2xl transition group-hover:opacity-30`} />
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[accent]} text-white shadow-glow`}>
                <IconComp className="h-6 w-6" />
            </div>
            <div className="flex-1">
                <h3 className="text-base font-bold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-ink-500">{description}</p>
            </div>
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition group-hover:bg-gradient-to-br group-hover:from-brand-500 group-hover:to-iris-500 group-hover:text-white dark:bg-ink-800 dark:text-ink-300">
                <Icon.ArrowRight className="h-4 w-4" />
            </div>
        </Link>
    );
}
