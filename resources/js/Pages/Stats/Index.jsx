import AppLayout from '@/Layouts/AppLayout';
import EvolutionChart from '@/Components/EvolutionChart';
import Icon from '@/Components/Icons';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link, usePage } from '@inertiajs/react';

function formatDate(iso, locale) {
    if (!iso) return '-';
    const tag = locale === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(iso).toLocaleString(tag, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDuration(seconds) {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

function KPI({ label, value, sub, accent = 'brand' }) {
    const accents = {
        brand: 'from-brand-500 to-iris-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
        rose: 'from-rose-500 to-pink-500',
    };
    return (
        <div className="card relative overflow-hidden p-5">
            <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10 blur-2xl`} />
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</div>
            <div className="mt-2 font-mono text-3xl font-extrabold text-ink-900 dark:text-white">
                {value}
            </div>
            {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
        </div>
    );
}

function EvolutionCard({ evolution }) {
    const t = useT();
    const { certification, points, passing_percentage, stats } = evolution;
    const trend = stats.delta;

    return (
        <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200/60 px-5 py-4 dark:border-ink-800/60">
                <div className="flex items-center gap-3">
                    {certification.logo_path ? (
                        <img src={`/storage/${certification.logo_path}`} alt="" className="h-10 w-10 object-contain" />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 text-xs font-bold text-white">
                            {certification.title.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="text-sm font-semibold text-ink-900 dark:text-white">{certification.title}</div>
                        <div className="text-xs text-ink-500">
                            {t('stats.evolution_attempts', { n: stats.total, best: stats.best, avg: stats.average })}
                        </div>
                    </div>
                </div>
                <div
                    className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold ${
                        trend > 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            : trend < 0
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
                            : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                    }`}
                >
                    {trend > 0 ? <Icon.ArrowUp className="h-3 w-3" /> : trend < 0 ? <Icon.ArrowDown className="h-3 w-3" /> : <Icon.Equal className="h-3 w-3" />}
                    <span className="font-mono">
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="hidden sm:inline text-ink-500 font-normal">{t('stats.evolution_since_first')}</span>
                </div>
            </div>
            <div className="p-4 text-ink-900 dark:text-ink-100">
                <EvolutionChart points={points} passingPercentage={passing_percentage} />
            </div>
            <div className="grid grid-cols-4 gap-2 border-t border-ink-200/60 p-3 text-center text-xs dark:border-ink-800/60">
                <MiniStat label={t('stats.evolution_best')} value={`${stats.best}%`} tone="emerald" />
                <MiniStat label={t('stats.evolution_average')} value={`${stats.average}%`} />
                <MiniStat label={t('stats.evolution_passed')} value={`${stats.passed}/${stats.total}`} />
                <MiniStat label={t('stats.evolution_best_time')} value={stats.best_time_seconds ? formatDuration(stats.best_time_seconds) : '-'} />
            </div>
        </div>
    );
}

function MiniStat({ label, value, tone = 'default' }) {
    const tones = {
        default: 'text-ink-900 dark:text-white',
        emerald: 'text-emerald-600 dark:text-emerald-300',
    };
    return (
        <div>
            <div className={`font-mono text-sm font-bold ${tones[tone]}`}>{value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
        </div>
    );
}

export default function Index({ attempts, summary, evolutions = [], evolution_min_attempts = 5, badges = [], certificates = [] }) {
    const t = useT();
    const locale = useLocale();
    const gam = usePage().props.auth?.user?.gamification;
    const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-US';
    const badgeTotal = 9;
    return (
        <AppLayout>
            <Head title={t('stats.page_title')} />
            <div className="mx-auto max-w-6xl space-y-8">
                <header>
                    <div className="badge-brand">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        {t('stats.header_kicker')}
                    </div>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        {t('stats.header_title')}
                    </h1>
                    <p className="mt-2 text-ink-600 dark:text-ink-400">
                        {t('stats.header_subtitle')}
                    </p>
                </header>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <KPI label={t('stats.kpi_attempts')} value={summary.total_attempts} accent="brand" />
                    <KPI label={t('stats.kpi_passed')} value={summary.passed_attempts} sub={t('stats.kpi_passed_sub', { n: summary.total_attempts })} accent="emerald" />
                    <KPI label={t('stats.kpi_best')} value={`${summary.best_percentage}%`} accent="amber" />
                    <KPI label={t('stats.kpi_average')} value={`${summary.average_percentage}%`} accent="rose" />
                </div>

                {certificates.length > 0 && (
                    <section className="card p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-ink-900 dark:text-white">{t('stats.certificates_title')}</h2>
                            <p className="mt-0.5 text-sm text-ink-500">
                                {t('stats.certificates_subtitle')}
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {certificates.map((c) => (
                                <div key={c.token} className="rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/5 to-white p-4 dark:from-brand-500/10 dark:to-ink-900/40">
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">
                                                {t('stats.certificate_badge')}
                                            </div>
                                            <div className="mt-0.5 truncate text-base font-bold text-ink-900 dark:text-white">
                                                {c.certification?.title ?? t('stats.certificate_fallback_title')}
                                            </div>
                                            <div className="mt-1 text-xs text-ink-500">
                                                {t('stats.certificate_stats', { pct: c.mastery_pct, best: c.best_score, total: c.total_questions, date: c.awarded_date })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <a href={c.public_url} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 !text-xs">
                                            {t('stats.certificate_view')}
                                        </a>
                                        <a href={c.pdf_url} className="btn-secondary !py-1.5 !text-xs">
                                            {t('stats.certificate_pdf')}
                                        </a>
                                        <a
                                            href={c.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004182]"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                                                <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3v9zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66L19 19z" />
                                            </svg>
                                            {t('stats.certificate_share')}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {gam && (
                    <section className="card p-6">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-ink-900 dark:text-white">{t('stats.gamification_title')}</h2>
                                <p className="mt-0.5 text-sm text-ink-500">
                                    {t('stats.gamification_subtitle')}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-300">{t('stats.streak_label')}</div>
                                <div className="mt-1 font-mono text-3xl font-extrabold text-orange-700 dark:text-orange-200">{gam.current_streak}</div>
                                <div className="mt-0.5 text-xs text-orange-600/70">{gam.current_streak > 1 ? t('stats.streak_unit_many') : t('stats.streak_unit_one')}</div>
                                <div className="mt-2 text-[10px] text-ink-500">{gam.longest_streak > 1 ? t('stats.streak_record_many', { n: gam.longest_streak }) : t('stats.streak_record', { n: gam.longest_streak })}</div>
                            </div>
                            <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">{t('stats.xp_label')}</div>
                                <div className="mt-1 font-mono text-3xl font-extrabold text-brand-700 dark:text-brand-200">{gam.total_xp.toLocaleString(numberLocale)}</div>
                                <div className="mt-0.5 text-xs text-brand-600/70">{t('stats.xp_unit')}</div>
                                <div className="mt-2 text-[10px] text-ink-500">{t('stats.xp_rules')}</div>
                            </div>
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-300">{t('stats.badges_label')}</div>
                                <div className="mt-1 font-mono text-3xl font-extrabold text-amber-700 dark:text-amber-200">{gam.badges_count}</div>
                                <div className="mt-0.5 text-xs text-amber-600/70">{t('stats.badges_available', { n: badgeTotal })}</div>
                            </div>
                        </div>

                        {badges.length > 0 && (
                            <div className="mt-6">
                                <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">{t('stats.badges_earned_title')}</h3>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {badges.map((b) => (
                                        <div key={`${b.key}-${b.certification?.slug ?? 'x'}`} className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900/40">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-glow">
                                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                                                    <path d="M17 4h3v2a3 3 0 0 1-3 3M7 4H4v2a3 3 0 0 0 3 3" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                                    {b.label}
                                                    {b.certification && (
                                                        <span className="ml-1.5 text-xs font-normal text-ink-500">· {b.certification.title}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-ink-500">{b.description}</div>
                                                {b.earned_at && (
                                                    <div className="mt-0.5 font-mono text-[10px] text-ink-400">
                                                        {new Date(b.earned_at).toLocaleDateString(numberLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {evolutions.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-baseline justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                                    {t('stats.evolution_title')}
                                </h2>
                                <p className="mt-0.5 text-sm text-ink-500">
                                    {t('stats.evolution_subtitle', { n: evolution_min_attempts })}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-6 xl:grid-cols-2">
                            {evolutions.map((ev) => (
                                <EvolutionCard key={ev.certification.id} evolution={ev} />
                            ))}
                        </div>
                    </section>
                )}

                <div className="card overflow-hidden">
                    <div className="border-b border-ink-200/60 px-5 py-4 dark:border-ink-800/60">
                        <h2 className="font-semibold text-ink-900 dark:text-white">{t('stats.attempts_title')}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500 dark:bg-ink-900/40">
                                <tr>
                                    <th className="px-5 py-3">{t('stats.col_certification')}</th>
                                    <th className="px-5 py-3">{t('stats.col_score')}</th>
                                    <th className="px-5 py-3">{t('stats.col_percent')}</th>
                                    <th className="px-5 py-3">{t('stats.col_status')}</th>
                                    <th className="px-5 py-3">{t('stats.col_duration')}</th>
                                    <th className="px-5 py-3">{t('stats.col_date')}</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
                                {attempts.map((a) => (
                                    <tr key={a.id} className="transition hover:bg-ink-50 dark:hover:bg-ink-900/30">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                {a.certification.logo_path ? (
                                                    <img src={`/storage/${a.certification.logo_path}`} alt="" className="h-8 w-8 object-contain" />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 text-[10px] font-bold text-white">
                                                        {a.certification.title.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-medium text-ink-900 dark:text-white">
                                                    {a.certification.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 font-mono">{a.score}/{a.total_questions}</td>
                                        <td className="px-5 py-3 font-mono font-bold">{a.percentage}%</td>
                                        <td className="px-5 py-3">
                                            {a.passed ? (
                                                <span className="badge-success">{t('stats.status_passed')}</span>
                                            ) : (
                                                <span className="badge-danger">{t('stats.status_failed')}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 font-mono text-ink-500">{formatDuration(a.duration_seconds)}</td>
                                        <td className="px-5 py-3 text-ink-500">{formatDate(a.completed_at, locale)}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Link
                                                href={route('exam.result', a.id)}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-400"
                                            >
                                                {t('stats.action_view')}
                                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {attempts.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-ink-500">
                                            {t('stats.empty_no_attempts')}{' '}
                                            <Link href={route('home')} className="text-brand-500 hover:underline">
                                                {t('stats.empty_pick_exam')}
                                            </Link>.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
