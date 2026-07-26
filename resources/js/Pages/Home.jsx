import AppLayout from '@/Layouts/AppLayout';
import HeroQuizTeaser from '@/Components/HeroQuizTeaser';
import Icon from '@/Components/Icons';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link, usePage } from '@inertiajs/react';

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
    const t = useT();
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
                                {t('home.soon_badge')}
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
                        {t('home.row_col_questions')}
                    </div>
                </div>
                <div>
                    <div className="text-[15px] font-medium text-ink-900 dark:text-white">
                        {certification.duration_minutes}
                        <span className="text-ink-400"> min</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-400">
                        {t('home.row_col_duration')}
                    </div>
                </div>
                <div>
                    <div className="text-[15px] font-medium text-ink-900 dark:text-white">
                        {certification.passing_score}
                        <span className="text-ink-400">/{certification.total_questions}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-400">
                        {t('home.row_col_threshold')}
                    </div>
                </div>
            </div>

            <div className="col-span-6 flex items-center justify-end gap-3 sm:col-span-2">
                {retire !== null && retire < 540 && retire > 0 && (
                    <span className={`hidden font-mono text-[10px] uppercase tracking-widest sm:inline ${retire < 180 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {t('home.row_retire', { year: retireYear })}
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

function LogoCarousel({ certifications }) {
    // Uniquement les certifs qui ont un vrai fichier logo uploadé
    const withLogo = certifications.filter((c) => c.logo_path);
    if (withLogo.length === 0) return null;

    // Duplique la liste pour un défilement infini fluide
    const loop = [...withLogo, ...withLogo];
    // Vitesse : ~5s par logo, défilement doux
    const duration = Math.max(24, withLogo.length * 5);

    return (
        <div className="marquee-mask-v marquee-pause relative h-[420px] overflow-hidden xl:h-[480px]">
            <div className="marquee-v" style={{ '--marquee-duration': `${duration}s` }}>
                {loop.map((c, i) => (
                    <div
                        key={`${c.id}-${i}`}
                        className="flex h-24 shrink-0 items-center justify-center px-4"
                        title={c.title}
                        aria-label={c.title}
                    >
                        <img
                            src={`/storage/${c.logo_path}`}
                            alt=""
                            className="max-h-14 w-auto max-w-[220px] object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Home({ certifications, teaser_questions = null }) {
    const user = usePage().props.auth?.user;
    const t = useT();
    const locale = useLocale();
    const ready = certifications.filter((c) => c.ready);
    const soon = certifications.filter((c) => !c.ready);
    const showTeaser = !user && teaser_questions && teaser_questions.length > 0;
    const totalQuestions = certifications.reduce((sum, c) => sum + (c.available_questions || 0), 0);
    const lastUpdate = certifications
        .map((c) => c.questions_updated_at)
        .filter(Boolean)
        .sort()
        .pop();
    // Format date selon la locale UI (en-US, fr-FR, etc.) pour "01 Aug" vs "1 août"
    const dateLocaleTag = locale === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <AppLayout ambient={false}>
            <Head title={t('home.page_title')} />

            {/* HERO */}
            <section className="border-b border-ink-200 pb-16 pt-6 dark:border-ink-800 sm:pt-10">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div>
                        <SectionLabel>{t('home.hero_kicker')}</SectionLabel>

                        <h1 className="mt-8 text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900 dark:text-white sm:text-[68px]">
                            {t('home.hero_title_1')}<br />
                            <span className="text-ink-400 dark:text-ink-500">{t('home.hero_title_2')}</span> {t('home.hero_title_3')}
                        </h1>

                        {/* Tagline poetique gardee comme signature rythmique sous le H1 :
                            plus explicite qu'un titre, ca fait respirer et re-imprime
                            la promesse (vocabulaire / timing / passage) avant le body. */}
                        <p className="mt-6 max-w-2xl text-lg font-medium leading-snug text-ink-700 dark:text-ink-200 sm:text-xl">
                            {t('home.hero_tagline')}
                        </p>

                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-600 dark:text-ink-300 sm:text-lg">
                            {t('home.hero_subtitle_pre')} <span className="font-semibold text-ink-900 dark:text-white">{t('home.hero_subtitle_strong_1')}</span>
                            {t('home.hero_subtitle_mid')} <span className="font-semibold text-ink-900 dark:text-white">{t('home.hero_subtitle_strong_2')}</span>
                            {t('home.hero_subtitle_post')}
                        </p>

                        <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6">
                            <div>
                                <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                                    {ready.length}
                                </div>
                                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                    {t('home.stat_certifications')}
                                </div>
                            </div>
                            <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
                            <div>
                                <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                                    {totalQuestions}
                                </div>
                                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                    {t('home.stat_questions')}
                                </div>
                            </div>
                            <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
                            <div>
                                <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                                    {lastUpdate ? new Date(lastUpdate).toLocaleDateString(dateLocaleTag, { day: '2-digit', month: 'short' }) : '-'}
                                </div>
                                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                    {t('home.stat_last_update')}
                                </div>
                            </div>
                            <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
                            <div>
                                <div className="font-mono text-3xl font-medium text-ink-900 dark:text-white">
                                    {t('home.stat_free')}
                                </div>
                                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                    {t('home.stat_no_credit_card')}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <a
                                href="#certifications"
                                className="inline-flex items-center gap-2 border-b border-ink-900 pb-1 text-sm font-medium text-ink-900 transition hover:gap-3 dark:border-white dark:text-white"
                            >
                                {t('home.cta_see_list')}
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Colonne droite : teaser Q/R (guest) ou carrousel logos (user connecté) */}
                    <div className="hidden lg:block">
                        {showTeaser ? (
                            <HeroQuizTeaser questions={teaser_questions} />
                        ) : (
                            <LogoCarousel certifications={certifications} />
                        )}
                    </div>
                </div>
            </section>

            {/* METHOD */}
            <section id="how-it-works" className="border-b border-ink-200 py-20 dark:border-ink-800">
                <SectionLabel>{t('home.method_kicker')}</SectionLabel>
                <h2 className="mt-6 max-w-2xl text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                    {t('home.method_title')}
                </h2>

                <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
                    <div>
                        <div className="font-mono text-xs font-medium text-ink-400">01</div>
                        <div className="mt-3 h-px w-8 bg-ink-900 dark:bg-white" />
                        <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">
                            {t('home.step1_title')}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                            {t('home.step1_body')}
                        </p>
                    </div>
                    <div>
                        <div className="font-mono text-xs font-medium text-ink-400">02</div>
                        <div className="mt-3 h-px w-8 bg-ink-900 dark:bg-white" />
                        <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">
                            {t('home.step2_title')}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                            {t('home.step2_body')}
                        </p>
                    </div>
                    <div>
                        <div className="font-mono text-xs font-medium text-ink-400">03</div>
                        <div className="mt-3 h-px w-8 bg-ink-900 dark:bg-white" />
                        <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">
                            {t('home.step3_title')}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                            {t('home.step3_body')}
                        </p>
                    </div>
                </div>

                {/* Certificate mechanic callout : explains the 3-perfect-runs rule
                    and positions the CertifLoop certificate as proof of readiness
                    rather than a participation trophy. */}
                <div className="mt-16 rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 via-iris-500/5 to-transparent p-8 sm:p-10">
                    <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-brand-600 dark:text-brand-300">
                                <Icon.Shield className="h-3.5 w-3.5" />
                                {t('home_cert_callout.kicker')}
                            </div>
                            <h3 className="mt-4 text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                                {t('home_cert_callout.title')}
                            </h3>
                            <p className="mt-4 text-sm leading-relaxed text-ink-700 dark:text-ink-300 sm:text-base">
                                {t('home_cert_callout.body_1')}
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-400 sm:text-base">
                                {t('home_cert_callout.body_2')}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            {['1', '2', '3'].map((n) => (
                                <div
                                    key={n}
                                    className="rounded-2xl border border-brand-500/20 bg-white/60 p-4 text-center backdrop-blur-sm dark:border-ink-800 dark:bg-ink-900/40"
                                >
                                    <div className="bg-gradient-to-br from-brand-500 to-iris-500 bg-clip-text font-mono text-4xl font-bold text-transparent">
                                        {t(`home_cert_callout.stat_${n}_value`)}
                                    </div>
                                    <div className="mt-2 text-[10px] font-medium uppercase leading-tight tracking-wider text-ink-500 dark:text-ink-400">
                                        {t(`home_cert_callout.stat_${n}_label`)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CERTIFICATIONS */}
            <section id="certifications" className="py-20">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <SectionLabel>{t('home.list_kicker')}</SectionLabel>
                        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                            {t('home.list_online', { n: ready.length })}
                            {soon.length > 0 && (
                                <span className="text-ink-400"> · {t('home.list_coming', { n: soon.length })}</span>
                            )}
                        </h2>
                    </div>
                    <div className="font-mono text-xs text-ink-400">
                        {t('home.list_hint')}
                    </div>
                </div>

                {certifications.length === 0 ? (
                    <div className="mt-10 border-y border-ink-200 py-16 text-center font-mono text-sm text-ink-500 dark:border-ink-800">
                        {t('home.list_empty')}
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