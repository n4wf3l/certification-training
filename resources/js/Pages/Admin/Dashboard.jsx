import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
    const t = useT();
    const pendingReports = stats.pending_reports > 0;
    const reportsTitle = pendingReports
        ? t('admin.dashboard.action_reports_title_pending', { count: stats.pending_reports })
        : t('admin.dashboard.action_reports_title');
    const reportsDesc = pendingReports
        ? (stats.pending_reports > 1
            ? t('admin.dashboard.action_reports_desc_pending_plural', { count: stats.pending_reports })
            : t('admin.dashboard.action_reports_desc_pending_singular', { count: stats.pending_reports }))
        : t('admin.dashboard.action_reports_desc_empty');

    return (
        <AppLayout>
            <Head title={t('admin.dashboard.head_title')} />
            <div className="mx-auto max-w-7xl space-y-10">
                {/* Header */}
                <div>
                    <div className="badge-brand">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        {t('admin.dashboard.badge')}
                    </div>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        {t('admin.dashboard.title')}
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                        {t('admin.dashboard.subtitle')}
                    </p>
                </div>

                {/* KPIs - 2 cliquables (drill-down existant), 2 informationnels (Users/Attempts
                    n'ont pas encore de page de gestion, on ne veut pas promettre un clic qui
                    ne mene nulle part). Style visuellement distinct pour signaler la difference. */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Kpi
                        label={t('admin.dashboard.kpi_certifications')}
                        value={stats.certifications}
                        IconComp={Icon.Book}
                        accent="brand"
                        href={route('admin.certifications.index')}
                    />
                    <Kpi
                        label={t('admin.dashboard.kpi_questions')}
                        value={stats.questions}
                        IconComp={Icon.Cards}
                        accent="emerald"
                        href={route('admin.questions.index')}
                    />
                    <Kpi
                        label={t('admin.dashboard.kpi_users')}
                        value={stats.users}
                        IconComp={Icon.User}
                        accent="amber"
                        href={route('admin.users.index')}
                    />
                    <Kpi
                        label={t('admin.dashboard.kpi_attempts')}
                        value={stats.attempts}
                        IconComp={Icon.Chart}
                        accent="rose"
                    />
                </div>

                {/* CONTENT section - 4 cards : gestion + import de certifs/Q&A. Regroupe
                    tout ce qui produit ou modifie du contenu pedagogique. */}
                <QuickSection title={t('admin.dashboard.section_content')}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <ActionCard
                            href={route('admin.certifications.index')}
                            IconComp={Icon.Book}
                            accent="brand"
                            title={t('admin.dashboard.action_certs_title')}
                            description={t('admin.dashboard.action_certs_desc')}
                        />
                        <ActionCard
                            href={route('admin.questions.index')}
                            IconComp={Icon.Cards}
                            accent="emerald"
                            title={t('admin.dashboard.action_questions_title')}
                            description={t('admin.dashboard.action_questions_desc')}
                        />
                        <ActionCard
                            href={route('admin.questions.import')}
                            IconComp={Icon.Bolt}
                            accent="brand"
                            title={t('admin.dashboard.action_import_questions_title')}
                            description={t('admin.dashboard.action_import_questions_desc')}
                        />
                        <ActionCard
                            href={route('admin.certifications.course-import')}
                            IconComp={Icon.Book}
                            accent="emerald"
                            title={t('admin.dashboard.action_import_course_title')}
                            description={t('admin.dashboard.action_import_course_desc')}
                        />
                    </div>
                </QuickSection>

                {/* OPERATIONS section - moderation user (Reports) + gestion users + config
                    plateforme. Reports affiche un badge pending pour attirer l'attention si
                    actionnable. */}
                <QuickSection title={t('admin.dashboard.section_operations')}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <ActionCard
                            href={route('admin.users.index')}
                            IconComp={Icon.User}
                            accent="brand"
                            title={t('admin.dashboard.action_users_title')}
                            description={t('admin.dashboard.action_users_desc')}
                        />
                        <ActionCard
                            href={route('admin.reports.index')}
                            IconComp={Icon.Shield}
                            accent="brand"
                            title={reportsTitle}
                            description={reportsDesc}
                            badge={pendingReports ? String(stats.pending_reports) : null}
                            badgeTone="rose"
                        />
                        <ActionCard
                            href={route('admin.settings.edit')}
                            IconComp={Icon.Shield}
                            accent="emerald"
                            title={t('admin.dashboard.action_settings_title')}
                            description={t('admin.dashboard.action_settings_desc')}
                        />
                    </div>
                </QuickSection>
            </div>
        </AppLayout>
    );
}

function QuickSection({ title, children }) {
    return (
        <div>
            <h2 className="mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400">
                <span className="h-px w-6 bg-ink-400 dark:bg-ink-600" />
                {title}
            </h2>
            {children}
        </div>
    );
}

function Kpi({ label, value, IconComp, accent, href }) {
    const t = useT();
    const accents = {
        brand: 'from-brand-500 to-iris-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
        rose: 'from-rose-500 to-pink-500',
    };
    // Interactif => `card-lift` (hover shadow + cursor pointer via <Link>) + affordance
    // "Open ->" au survol. Informationnel => simple `card`, pas de hover trompeur.
    const wrapperClass = href
        ? 'card-lift group relative overflow-hidden p-5'
        : 'card relative overflow-hidden p-5';
    const content = (
        <div className={wrapperClass}>
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
                    {t('admin.dashboard.open')} <Icon.ArrowRight className="h-3 w-3" />
                </div>
            )}
        </div>
    );
    return href ? <Link href={href}>{content}</Link> : content;
}

function ActionCard({ href, IconComp, accent, title, description, badge = null, badgeTone = 'brand' }) {
    const accents = {
        brand: 'from-brand-500 to-iris-500',
        emerald: 'from-emerald-500 to-teal-500',
    };
    const badgeTones = {
        brand: 'bg-brand-500 text-white',
        rose: 'bg-rose-500 text-white',
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
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink-900 dark:text-white">{title}</h3>
                    {badge && (
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${badgeTones[badgeTone]}`}>
                            {badge}
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-ink-500">{description}</p>
            </div>
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition group-hover:bg-gradient-to-br group-hover:from-brand-500 group-hover:to-iris-500 group-hover:text-white dark:bg-ink-800 dark:text-ink-300">
                <Icon.ArrowRight className="h-4 w-4" />
            </div>
        </Link>
    );
}
