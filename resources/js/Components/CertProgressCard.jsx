import Icon from '@/Components/Icons';
import { useT, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';

/**
 * CertProgressCard : shows the user's progression toward the CertifLoop
 * preparation certificate on a given certification page. Renders 4 distinct
 * states based on `progress` shape from the server:
 *   - null (guest) : hint to sign in
 *   - awarded : final "certified" card with view/download links
 *   - partial (0..2) : progress bar + next-milestone copy + CTA "take exam"
 */
export default function CertProgressCard({ progress, certificationSlug }) {
    const t = useT();
    const locale = useLocale();

    if (!progress) {
        return (
            <div className="card p-5">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                        <Icon.Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                            {t('cert_progress.section_title')}
                        </h3>
                        <p className="mt-1 text-xs text-ink-500">{t('cert_progress.guest_hint')}</p>
                    </div>
                </div>
            </div>
        );
    }

    const { perfect_runs, required, awarded, awarded_token, awarded_at } = progress;
    const pct = Math.min(100, Math.round((perfect_runs / required) * 100));

    if (awarded) {
        const dateTag = locale === 'fr' ? 'fr-FR' : 'en-US';
        const awardedDate = awarded_at
            ? new Date(awarded_at).toLocaleDateString(dateTag, { year: 'numeric', month: 'long', day: 'numeric' })
            : '';
        return (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-brand-500/5 to-transparent p-5 dark:border-emerald-400/40">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                        <Icon.Shield className="h-3.5 w-3.5" />
                        {t('cert_progress.section_title')}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-ink-900 dark:text-white">
                            {t('cert_progress.counter', { current: required, required })}
                        </span>
                        <Icon.Check className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">
                        {t('cert_progress.subtitle_awarded', { date: awardedDate })}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href={route('certificate.show', awarded_token)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                        >
                            <Icon.Sparkles className="h-3.5 w-3.5" />
                            {t('cert_progress.cta_view')}
                        </Link>
                        <a
                            href={route('certificate.pdf', awarded_token)}
                            download
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/10 dark:bg-ink-900/40 dark:text-emerald-300"
                        >
                            <Icon.ArrowRight className="h-3.5 w-3.5 -rotate-90" />
                            {t('cert_progress.cta_download')}
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Partial state (0..required-1)
    const milestoneKey = `cert_progress.next_milestone_${perfect_runs}`;
    return (
        <div className="card overflow-hidden p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                <Icon.Shield className="h-3.5 w-3.5" />
                {t('cert_progress.section_title')}
            </div>

            <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono text-3xl font-bold text-ink-900 dark:text-white">
                    {perfect_runs}
                    <span className="text-ink-400"> / {required}</span>
                </span>
                <span className="text-xs text-ink-500">{t('cert_progress.progress_label')}</span>
            </div>

            {/* Progress bar : segments for clarity */}
            <div className="mt-3 flex gap-1.5">
                {Array.from({ length: required }, (_, i) => (
                    <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition ${
                            i < perfect_runs
                                ? 'bg-gradient-to-r from-brand-500 to-iris-500 shadow-glow'
                                : 'bg-ink-200 dark:bg-ink-800'
                        }`}
                    />
                ))}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                {t(milestoneKey)}
            </p>

            <p className="mt-3 border-l-2 border-brand-500/40 bg-brand-500/5 py-2 pl-3 text-xs leading-relaxed text-ink-600 dark:text-ink-400">
                {t('cert_progress.why_it_matters')}
            </p>

            <Link
                href={route('certifications.exam', certificationSlug)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
            >
                {t('cert_progress.cta_start_exam')}
                <Icon.ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
}
