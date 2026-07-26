import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import ReportQuestionButton from '@/Components/ReportQuestionButton';
import ExplainMeButton from '@/Components/ExplainMeButton';
import { saveExamToCache } from '@/lib/offlineCache';
import { useT } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function formatDuration(seconds) {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatDelta(seconds) {
    if (seconds == null) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m${String(s).padStart(2, '0')}s`;
}

const DOMAIN_KEY_MAP = {
    foundations: 'domain_foundations',
    'guiding-principles': 'domain_guiding_principles',
    'four-dimensions': 'domain_four_dimensions',
    'itil-value-system': 'domain_value_system',
    'lifecycle-activities': 'domain_lifecycle',
    practices: 'domain_practices',
    'continual-improvement': 'domain_continual',
    'digital-ai-innovation': 'domain_digital_ai',
};

function ProgressRing({ percentage, passed, size = 180 }) {
    const t = useT();
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="transparent" className="text-ink-200 dark:text-ink-800" />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#ring-grad)" strokeWidth={stroke} strokeLinecap="round" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                <defs>
                    <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={passed ? '#10b981' : '#f43f5e'} />
                        <stop offset="100%" stopColor={passed ? '#22d3ee' : '#f59e0b'} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-mono text-4xl font-extrabold text-ink-900 dark:text-white">
                    {percentage}%
                </div>
                <div className={`mt-1 text-xs font-semibold uppercase tracking-wider ${passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {passed ? t('exam_result.badge_passed') : t('exam_result.badge_failed')}
                </div>
            </div>
        </div>
    );
}

function ResultStat({ label, value, sub }) {
    return (
        <div className="rounded-xl border border-ink-200 bg-white/60 p-4 text-center backdrop-blur dark:border-ink-800/60 dark:bg-ink-900/40">
            <div className="font-mono text-2xl font-bold text-ink-900 dark:text-white">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-ink-500">{label}</div>
            {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
        </div>
    );
}

function attemptOrdinal(t, n) {
    if (n === 1) return t('exam_result.attempt_ordinal_1');
    if (n === 2) return t('exam_result.attempt_ordinal_2');
    if (n === 3) return t('exam_result.attempt_ordinal_3');
    return t('exam_result.attempt_ordinal_n', { n });
}

function ComparisonCard({ comparison, currentDuration }) {
    const t = useT();
    if (!comparison.previous) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-iris-500 text-white shadow-glow">
                        <Icon.Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-ink-900 dark:text-white">{t('exam_result.first_attempt_title')}</h3>
                        <p className="text-sm text-ink-500">
                            {t('exam_result.first_attempt_body')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const dSec = comparison.delta_seconds;
    const dScore = comparison.delta_score;
    const dPct = comparison.delta_percentage;
    const faster = dSec !== null && dSec < 0;
    const slower = dSec !== null && dSec > 0;
    const better = dScore > 0;
    const worse = dScore < 0;

    return (
        <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink-900 dark:text-white">
                            {t('exam_result.nth_attempt_title', { n: attemptOrdinal(t, comparison.attempt_number) })}
                        </h3>
                        {comparison.is_new_best_time && (
                            <span className="badge-warn">
                                <Icon.Trophy className="h-3.5 w-3.5" />
                                {t('exam_result.new_time_record')}
                            </span>
                        )}
                        {comparison.is_new_best_score && (
                            <span className="badge-success">
                                <Icon.Target className="h-3.5 w-3.5" />
                                {t('exam_result.new_score_record')}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                        {t('exam_result.comparison_subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-ink-200 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{t('exam_result.col_time')}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-ink-900 dark:text-white">
                            {formatDuration(currentDuration)}
                        </span>
                        {dSec !== null && (
                            <span className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${faster ? 'text-emerald-500' : slower ? 'text-rose-500' : 'text-ink-400'}`}>
                                {faster ? <Icon.ArrowDown className="h-3.5 w-3.5" /> : slower ? <Icon.ArrowUp className="h-3.5 w-3.5" /> : <Icon.Equal className="h-3.5 w-3.5" />}
                                {formatDelta(Math.abs(dSec))}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                        {faster && t('exam_result.faster_than_before', { delta: formatDelta(Math.abs(dSec)) })}
                        {slower && t('exam_result.slower_than_before', { delta: formatDelta(Math.abs(dSec)) })}
                        {!faster && !slower && t('exam_result.previous_time', { time: formatDuration(comparison.previous.duration_seconds) })}
                    </div>
                </div>

                <div className="rounded-xl border border-ink-200 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{t('exam_result.col_score')}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-ink-900 dark:text-white">
                            {comparison.previous.score + dScore}
                        </span>
                        <span className={`font-mono text-sm font-semibold ${better ? 'text-emerald-500' : worse ? 'text-rose-500' : 'text-ink-400'}`}>
                            {better ? '+' : ''}{dScore}
                        </span>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                        {t('exam_result.previous_score', { score: `${comparison.previous.score}/${comparison.previous.total}` })}
                    </div>
                </div>

                <div className="rounded-xl border border-ink-200 bg-white/60 p-4 dark:border-ink-800/60 dark:bg-ink-900/40">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{t('exam_result.col_progression')}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-ink-900 dark:text-white">
                            {comparison.previous.percentage + dPct}%
                        </span>
                        <span className={`font-mono text-sm font-semibold ${dPct > 0 ? 'text-emerald-500' : dPct < 0 ? 'text-rose-500' : 'text-ink-400'}`}>
                            {dPct > 0 ? '+' : ''}{dPct}%
                        </span>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                        {t('exam_result.previous_pct', { pct: comparison.previous.percentage })}
                    </div>
                </div>
            </div>

            {(comparison.best_time_before !== null || comparison.best_score_before !== null) && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-ink-200/60 bg-ink-50/50 px-4 py-3 text-xs dark:border-ink-800/60 dark:bg-ink-900/30">
                    <span className="text-ink-500">{t('exam_result.prior_records_label')}</span>
                    {comparison.best_time_before !== null && (
                        <span className="badge-muted">
                            <Icon.Timer className="h-3.5 w-3.5" />
                            {t('exam_result.best_time_label')} <span className="font-mono ml-1">{formatDuration(comparison.best_time_before)}</span>
                        </span>
                    )}
                    {comparison.best_score_before !== null && (
                        <span className="badge-muted">
                            <Icon.Target className="h-3.5 w-3.5" />
                            {t('exam_result.best_score_label')} <span className="font-mono ml-1">{comparison.best_score_before}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function DomainBreakdownCard({ breakdown, certificationSlug }) {
    const t = useT();
    const weakest = breakdown.filter((d) => d.pct < 70);
    return (
        <div className="card p-6">
            <div className="mb-4">
                <h3 className="font-semibold text-ink-900 dark:text-white">{t('exam_result.domain_title')}</h3>
                <p className="mt-0.5 text-xs text-ink-500">
                    {t('exam_result.domain_subtitle')}
                </p>
            </div>
            <div className="space-y-2">
                {breakdown.map((d) => {
                    const dictKey = DOMAIN_KEY_MAP[d.domain];
                    const label = dictKey ? t(`exam_result.${dictKey}`) : d.domain;
                    const color = d.pct >= 70 ? 'emerald' : d.pct >= 40 ? 'amber' : 'rose';
                    const canPractice = d.pct < 100;
                    return (
                        <div key={d.domain} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                            color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5'
                            : color === 'amber' ? 'border-amber-500/30 bg-amber-500/5'
                            : 'border-rose-500/30 bg-rose-500/5'
                        }`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${
                                        color === 'emerald' ? 'text-emerald-700 dark:text-emerald-200'
                                        : color === 'amber' ? 'text-amber-700 dark:text-amber-200'
                                        : 'text-rose-700 dark:text-rose-200'
                                    }`}>
                                        {label}
                                    </span>
                                    <span className="font-mono text-xs text-ink-500">
                                        {d.correct}/{d.seen} · {d.pct}%
                                    </span>
                                </div>
                                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                                    <div className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${d.pct}%` }} />
                                </div>
                            </div>
                            {canPractice && (
                                <Link
                                    href={route('exam.practice', [certificationSlug, d.domain])}
                                    method="post"
                                    as="button"
                                    className="btn-secondary !py-1.5 !text-xs"
                                    title={t('exam_result.domain_review_title', { label })}
                                >
                                    <Icon.Refresh className="h-3.5 w-3.5" />
                                    {t('exam_result.domain_review_cta')}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
            {weakest.length === 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-300">
                    <Icon.Check className="h-3.5 w-3.5" />
                    {t('exam_result.domain_all_good')}
                </p>
            )}
        </div>
    );
}

function Chip({ color, label, value }) {
    const colors = {
        emerald: 'text-emerald-600 dark:text-emerald-300',
        amber: 'text-amber-600 dark:text-amber-300',
        rose: 'text-rose-600 dark:text-rose-300',
        slate: 'text-ink-500 dark:text-ink-400',
    };
    const dots = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        slate: 'bg-ink-400',
    };
    return (
        <div className="flex items-center justify-between rounded-lg border border-ink-200 bg-white px-3 py-2 dark:border-ink-800/60 dark:bg-ink-900/40">
            <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dots[color]}`} />
                <span className={`text-xs ${colors[color]}`}>{label}</span>
            </div>
            <span className="font-mono text-sm font-bold text-ink-900 dark:text-white">{value}</span>
        </div>
    );
}

// Banner that appears after a perfect run to reinforce the 3-of-3 certification
// mechanic. Only rendered when the attempt hit 100% AND is a full mock exam
// (practice sessions carry `cert_progress = null` server-side, so they never
// trigger a banner here).
function CertProgressBanner({ progress }) {
    const t = useT();
    if (!progress || !progress.this_attempt_perfect) return null;

    if (progress.just_awarded && progress.awarded_token) {
        return (
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-500/15 via-brand-500/10 to-iris-500/10 p-6 shadow-glow-lg">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-iris-500/20 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-500 text-white shadow-glow">
                        <Icon.Shield className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                            {t('result_cert_banner.perfect_3_title')}
                        </div>
                        <p className="mt-1 text-base leading-relaxed text-ink-800 dark:text-ink-100">
                            {t('result_cert_banner.perfect_3_body')}
                        </p>
                    </div>
                    <Link
                        href={route('certificate.show', progress.awarded_token)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                    >
                        <Icon.Sparkles className="h-4 w-4" />
                        {t('result_cert_banner.perfect_3_cta')}
                    </Link>
                </div>
            </div>
        );
    }

    const step = progress.perfect_runs; // 1 or 2 after a perfect run pre-award
    if (step !== 1 && step !== 2) return null;

    return (
        <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 to-transparent p-5">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
                    <Icon.Shield className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                        {t(`result_cert_banner.perfect_${step}_title`)}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                        {t(`result_cert_banner.perfect_${step}_body`)}
                    </p>
                    <div className="mt-3 flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-8 rounded-full transition ${
                                    i < step
                                        ? 'bg-gradient-to-r from-brand-500 to-iris-500 shadow-glow'
                                        : 'bg-ink-200 dark:bg-ink-800'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Result({ attempt, certification, details, mastery, comparison, domain_breakdown = [], cert_progress = null }) {
    const t = useT();
    const passed = attempt.passed;
    const wrong = details.filter((d) => !d.is_correct);
    const rightCount = details.length - wrong.length;
    const [showAll, setShowAll] = useState(wrong.length === 0);
    const [confirmRestart, setConfirmRestart] = useState(false);
    const shownDetails = showAll ? details : wrong;
    const [currentIdx, setCurrentIdx] = useState(0);
    const currentDetail = shownDetails[currentIdx] ?? null;

    useEffect(() => {
        if (details?.length > 0 && certification) {
            saveExamToCache(details, certification);
        }
    }, [details, certification]);

    useEffect(() => {
        setCurrentIdx(0);
    }, [showAll]);

    useEffect(() => {
        if (shownDetails.length <= 1 || confirmRestart) return;
        const handler = (e) => {
            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setCurrentIdx((i) => Math.min(shownDetails.length - 1, i + 1));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentIdx((i) => Math.max(0, i - 1));
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [shownDetails.length, confirmRestart]);

    return (
        <AppLayout>
            <Head title={t('exam_result.page_title', { title: certification.title })} />
            <div className="mx-auto max-w-4xl space-y-6">
                <div className={`card relative overflow-hidden p-8`}>
                    <div className={`absolute inset-0 opacity-20 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ maskImage: 'radial-gradient(closest-side at top, black, transparent)' }} />
                    <div className="relative grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
                        <ProgressRing percentage={attempt.percentage} passed={passed} />
                        <div>
                            <div className={`badge ${passed ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300'}`}>
                                {passed ? <Icon.Check className="h-3.5 w-3.5" /> : <Icon.Close className="h-3.5 w-3.5" />}
                                {passed ? t('exam_result.badge_cert_validated') : t('exam_result.badge_below_threshold')}
                            </div>
                            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {certification.title}
                            </h1>
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <ResultStat label={t('exam_result.stat_score')} value={`${attempt.score}/${attempt.total_questions}`} />
                                <ResultStat label={t('exam_result.stat_required')} value={`${attempt.passing_score}`} sub={t('exam_result.stat_required_sub', { n: attempt.total_questions })} />
                                <ResultStat label={t('exam_result.stat_delta')} value={`${attempt.score - attempt.passing_score > 0 ? '+' : ''}${attempt.score - attempt.passing_score}`} />
                                <ResultStat label={t('exam_result.stat_time')} value={formatDuration(attempt.duration_seconds)} />
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button type="button" onClick={() => setConfirmRestart(true)} className="btn-primary">
                                    {t('exam_result.cta_restart')}
                                    <Icon.Refresh className="h-4 w-4" />
                                </button>
                                <a
                                    href={route('exam.result.pdf', attempt.id)}
                                    className="btn-secondary"
                                    title={t('exam_result.cta_pdf_title')}
                                >
                                    <Icon.ArrowDown className="h-4 w-4" />
                                    {t('exam_result.cta_pdf')}
                                </a>
                                <Link href={route('stats.index')} className="btn-secondary">{t('exam_result.cta_my_stats')}</Link>
                                <Link href={route('home')} className="btn-ghost">{t('exam_result.cta_other_exams')}</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <CertProgressBanner progress={cert_progress} />

                {comparison && (
                    <ComparisonCard comparison={comparison} currentDuration={attempt.duration_seconds} />
                )}

                {!attempt.practice_domain && domain_breakdown.length > 0 && (
                    <DomainBreakdownCard breakdown={domain_breakdown} certificationSlug={certification.slug} />
                )}

                {mastery && mastery.total > 0 && (
                    <div className="card p-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-ink-900 dark:text-white">{t('exam_result.mastery_title')}</h3>
                                <p className="text-xs text-ink-500">
                                    {t('exam_result.mastery_subtitle')}
                                </p>
                            </div>
                            <span className="font-mono text-sm text-ink-500">
                                {mastery.mastered}/{mastery.total}
                            </span>
                        </div>
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                            <div className="bg-emerald-500" style={{ width: `${(mastery.mastered / mastery.total) * 100}%` }} />
                            <div className="bg-amber-500" style={{ width: `${(mastery.in_progress / mastery.total) * 100}%` }} />
                            <div className="bg-rose-500" style={{ width: `${(mastery.to_review / mastery.total) * 100}%` }} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Chip color="emerald" label={t('exam_result.mastery_mastered')} value={mastery.mastered} />
                            <Chip color="amber" label={t('exam_result.mastery_in_progress')} value={mastery.in_progress} />
                            <Chip color="rose" label={t('exam_result.mastery_to_review')} value={mastery.to_review} />
                            <Chip color="slate" label={t('exam_result.mastery_never_seen')} value={mastery.never_seen} />
                        </div>
                    </div>
                )}

                <div className="card p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                                {showAll ? t('exam_result.correction_title_all') : t('exam_result.correction_title_wrong')}
                            </h2>
                            <p className="mt-0.5 text-xs text-ink-500">
                                {showAll
                                    ? t('exam_result.correction_subtitle_all')
                                    : wrong.length === 0
                                        ? t('exam_result.correction_subtitle_none')
                                        : t('exam_result.correction_subtitle_wrong', { n: wrong.length })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-2 text-xs">
                                <span className="badge-success">
                                    {t('exam_result.badge_correct', { n: rightCount })}
                                </span>
                                <span className="badge-danger">
                                    {t('exam_result.badge_incorrect', { n: wrong.length })}
                                </span>
                            </div>
                            {wrong.length > 0 && (
                                <button
                                    onClick={() => setShowAll((v) => !v)}
                                    className="btn-secondary !py-1.5 !text-xs"
                                >
                                    {showAll ? t('exam_result.toggle_wrong_only') : t('exam_result.toggle_show_all')}
                                </button>
                            )}
                        </div>
                    </div>

                    {wrong.length === 0 && !showAll && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                <Icon.Check className="h-5 w-5" />
                            </span>
                            <div>
                                <div className="font-semibold text-emerald-700 dark:text-emerald-200">
                                    {t('exam_result.perfect_title')}
                                </div>
                                <div className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
                                    {t('exam_result.perfect_body')}
                                </div>
                            </div>
                        </div>
                    )}

                    {shownDetails.length > 0 && currentDetail && (
                        <>
                            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50/60 px-3 py-2 dark:border-ink-800 dark:bg-ink-900/40">
                                <button
                                    type="button"
                                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                                    disabled={currentIdx === 0}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                                    aria-label={t('exam_result.nav_prev')}
                                >
                                    <Icon.ArrowLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center gap-2 font-mono text-xs text-ink-500">
                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded ${
                                        currentDetail.is_correct ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                    }`}>
                                        {currentDetail.is_correct ? <Icon.Check className="h-3 w-3" /> : <Icon.Close className="h-3 w-3" />}
                                    </span>
                                    <span className="font-semibold text-ink-900 dark:text-white">{currentIdx + 1}</span>
                                    <span className="text-ink-400">/</span>
                                    <span>{shownDetails.length}</span>
                                    <span className="hidden text-ink-400 sm:inline">·</span>
                                    <span className="hidden text-ink-500 sm:inline">
                                        Q{currentDetail.position}{currentDetail.topic ? ` · ${currentDetail.topic}` : ''}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentIdx((i) => Math.min(shownDetails.length - 1, i + 1))}
                                    disabled={currentIdx >= shownDetails.length - 1}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                                    aria-label={t('exam_result.nav_next')}
                                >
                                    <Icon.ArrowRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div key={currentDetail.position} className={`rounded-xl border animate-fade-in ${
                                currentDetail.is_correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
                            }`}>
                                <div className="flex items-center gap-3 border-b border-ink-200/60 p-4 dark:border-ink-800/60">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                        currentDetail.is_correct ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                    }`}>
                                        {currentDetail.is_correct ? <Icon.Check className="h-4 w-4" /> : <Icon.Close className="h-4 w-4" />}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                            Q{currentDetail.position} {currentDetail.topic && `· ${currentDetail.topic}`}
                                        </div>
                                        <div className="truncate text-sm font-medium text-ink-900 dark:text-white">
                                            {currentDetail.question_text}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    {currentDetail.scenario && (
                                        <p className="mb-3 rounded-lg bg-white/50 p-3 text-sm italic text-ink-600 dark:bg-ink-900/40 dark:text-ink-400">
                                            {currentDetail.scenario}
                                        </p>
                                    )}
                                    <p className="mb-3 text-sm font-medium text-ink-900 dark:text-white">{currentDetail.question_text}</p>

                                    <div className="space-y-2 text-sm">
                                        <div className={`rounded-lg border p-3 ${
                                            currentDetail.is_correct
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                                                : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                                        }`}>
                                            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                                                {t('exam_result.your_answer_label')}
                                            </div>
                                            <div className="mt-1">
                                                {currentDetail.chosen ? `${currentDetail.chosen.letter}. ${currentDetail.chosen.text}` : t('exam_result.not_answered')}
                                            </div>
                                            {currentDetail.chosen?.rationale && (
                                                <div className="mt-2 text-xs italic opacity-90">
                                                    {currentDetail.chosen.rationale}
                                                </div>
                                            )}
                                        </div>

                                        {!currentDetail.is_correct && currentDetail.correct && (
                                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-200">
                                                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                                                    {t('exam_result.correct_answer_label')}
                                                </div>
                                                <div className="mt-1">
                                                    {currentDetail.correct.letter}. {currentDetail.correct.text}
                                                </div>
                                                {currentDetail.correct.rationale && (
                                                    <div className="mt-2 text-xs italic opacity-90">
                                                        {currentDetail.correct.rationale}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {currentDetail.explanation && (
                                            <div className="rounded-lg border-l-4 border-brand-500 bg-brand-500/5 p-3">
                                                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                                                    <Icon.Sparkles className="h-3 w-3" />
                                                    {t('exam_result.pedagogy_label')}
                                                </div>
                                                <p className="text-sm text-ink-700 dark:text-ink-200">
                                                    {currentDetail.explanation}
                                                </p>
                                            </div>
                                        )}

                                        {!currentDetail.is_correct && (
                                            <div>
                                                <ExplainMeButton
                                                    questionId={currentDetail.question_id}
                                                    wrongAnswerId={currentDetail.chosen?.id ?? null}
                                                />
                                            </div>
                                        )}

                                        {currentDetail.crowd && (
                                            <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/40">
                                                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                                                    <Icon.Chart className="h-3 w-3" />
                                                    {t('exam_result.crowd_label', { n: currentDetail.crowd.total_seen })}
                                                </div>
                                                <p className="text-xs text-ink-700 dark:text-ink-200">
                                                    <span className={`font-semibold ${currentDetail.crowd.correct_rate >= 70 ? 'text-emerald-600 dark:text-emerald-300' : currentDetail.crowd.correct_rate >= 40 ? 'text-amber-600 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300'}`}>
                                                        {currentDetail.crowd.correct_rate}%
                                                    </span>{' '}
                                                    {t('exam_result.crowd_body')}
                                                    {currentDetail.crowd.top_wrong && currentDetail.crowd.top_wrong.pct >= 15 && (
                                                        t('exam_result.crowd_top_wrong', { letter: currentDetail.crowd.top_wrong.letter, pct: currentDetail.crowd.top_wrong.pct })
                                                    )}
                                                    .
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-2">
                                            <ReportQuestionButton
                                                questionId={currentDetail.question_id}
                                                attemptId={attempt.id}
                                                chosenAnswerId={currentDetail.chosen?.id ?? null}
                                                compact
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {shownDetails.length > 1 && (
                                <div className="mt-4">
                                    <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-400">
                                        <span>{t('exam_result.strip_kicker')}</span>
                                        <span className="hidden sm:inline">{t('exam_result.strip_hint')}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {shownDetails.map((d, idx) => {
                                            const active = idx === currentIdx;
                                            return (
                                                <button
                                                    key={d.position}
                                                    type="button"
                                                    onClick={() => setCurrentIdx(idx)}
                                                    title={`Q${d.position}${d.topic ? ` · ${d.topic}` : ''}`}
                                                    className={`h-7 min-w-[2rem] rounded-md border px-2 font-mono text-[11px] font-semibold transition ${
                                                        active
                                                            ? d.is_correct
                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                : 'border-rose-500 bg-rose-500 text-white'
                                                            : d.is_correct
                                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300'
                                                                : 'border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300'
                                                    }`}
                                                >
                                                    Q{d.position}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {confirmRestart && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in"
                    onClick={() => setConfirmRestart(false)}
                >
                    <div
                        className="w-full max-w-lg animate-scale-in rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl dark:border-ink-800 dark:bg-ink-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/15 text-brand-500">
                                <Icon.Refresh className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-ink-900 dark:text-white">
                                    {t('exam_result.restart_title')}
                                </h3>
                                <p className="text-xs text-ink-500">
                                    {t('exam_result.restart_subtitle')}
                                </p>
                            </div>
                        </div>
                        <ul className="space-y-2 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-ink-800 dark:text-ink-200">
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                <span>{t('exam_result.restart_reason_1')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                <span>{t('exam_result.restart_reason_2')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                <span>{t('exam_result.restart_reason_3')}</span>
                            </li>
                        </ul>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmRestart(false)}
                                className="btn-secondary"
                            >
                                {t('exam_result.restart_cancel')}
                            </button>
                            <Link
                                href={route('certifications.exam', certification.slug)}
                                className="btn-primary"
                            >
                                {t('exam_result.restart_confirm')}
                                <Icon.ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </AppLayout>
    );
}
