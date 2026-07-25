import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import Select from '@/Components/Select';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const CATEGORY_COLORS = {
    wrong_answer: 'rose',
    contradictory_rationale: 'amber',
    outdated: 'amber',
    unclear: 'brand',
    typo: 'ink',
    other: 'ink',
};

const STATUS_COLOR = {
    pending: 'text-rose-600 bg-rose-500/10 border-rose-500/30',
    reviewed: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
    resolved: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30',
    dismissed: 'text-ink-500 bg-ink-100 border-ink-300 dark:bg-ink-800 dark:border-ink-700',
};

function ReportCard({ report }) {
    const t = useT();
    const locale = useLocale();
    const [editing, setEditing] = useState(false);
    const { data, setData, patch, processing } = useForm({
        status: report.status,
        admin_note: report.admin_note ?? '',
    });

    const STATUS_LABEL = {
        pending: t('admin.reports.status_pending'),
        reviewed: t('admin.reports.status_reviewed'),
        resolved: t('admin.reports.status_resolved'),
        dismissed: t('admin.reports.status_dismissed'),
    };

    const save = () => {
        patch(route('admin.reports.update', report.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    return (
        <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900/40">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wider ${STATUS_COLOR[report.status] || STATUS_COLOR.pending}`}>
                            {STATUS_LABEL[report.status] || report.status}
                        </span>
                        <span className="font-mono text-ink-500">
                            {report.question?.certification?.title ?? '—'} · Q{report.question?.position ?? '?'}
                        </span>
                        <span className="text-ink-400">·</span>
                        <span className="text-ink-500">
                            {report.user?.name ?? t('admin.reports.user_deleted')} ({report.user?.email ?? '—'})
                        </span>
                        <span className="text-ink-400">·</span>
                        <span className="text-ink-500">
                            {new Date(report.created_at).toLocaleDateString(
                                locale === 'fr' ? 'fr-FR' : 'en-US',
                                { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                            )}
                        </span>
                    </div>
                    <div className="text-sm font-semibold text-ink-900 dark:text-white">
                        {report.category_label}
                    </div>
                </div>
                {report.question?.certification?.slug && (
                    <Link
                        href={`${route('admin.questions.index')}?certification_id=${report.question.certification.id}`}
                        className="btn-ghost !py-1 !text-xs"
                        title={t('admin.reports.open_in_admin_title')}
                    >
                        {t('admin.reports.open_in_admin')}
                    </Link>
                )}
            </div>

            {report.question && (
                <div className="mb-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/40">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                        {t('admin.reports.reported_question')} {report.question.topic ?? t('admin.reports.no_topic')}
                    </div>
                    <div className="text-sm text-ink-800 dark:text-ink-200">{report.question.text}</div>
                </div>
            )}

            {report.chosen_answer && (
                <div className="mb-3 text-xs text-ink-600 dark:text-ink-300">
                    <span className="font-semibold">{t('admin.reports.chosen_answer')}</span>{' '}
                    <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono dark:bg-ink-800">{report.chosen_answer.letter}</span>{' '}
                    {report.chosen_answer.text}
                </div>
            )}

            {report.message && (
                <div className="mb-3 rounded-lg border-l-4 border-brand-500 bg-brand-500/5 p-3 text-sm text-ink-700 dark:text-ink-200">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">
                        {t('admin.reports.user_message')}
                    </div>
                    « {report.message} »
                </div>
            )}

            {/* Admin actions */}
            {editing ? (
                <div className="space-y-3 rounded-xl border border-ink-200 bg-ink-50/40 p-4 dark:border-ink-800 dark:bg-ink-950/30">
                    <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                            {t('admin.reports.status_label')}
                        </label>
                        <Select
                            value={data.status}
                            onChange={(v) => setData('status', v)}
                            options={[
                                { value: 'pending', label: t('admin.reports.status_pending_full') },
                                { value: 'reviewed', label: t('admin.reports.status_reviewed_full') },
                                { value: 'resolved', label: t('admin.reports.status_resolved_full') },
                                { value: 'dismissed', label: t('admin.reports.status_dismissed_full') },
                            ]}
                            size="sm"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                            {t('admin.reports.admin_note_label')}
                        </label>
                        <textarea
                            value={data.admin_note}
                            onChange={(e) => setData('admin_note', e.target.value)}
                            rows={2}
                            maxLength={2000}
                            placeholder={t('admin.reports.admin_note_placeholder')}
                            className="field resize-none text-xs"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(false)} className="btn-secondary !py-1.5 !text-xs">
                            {t('admin.reports.cancel')}
                        </button>
                        <button type="button" onClick={save} disabled={processing} className="btn-primary !py-1.5 !text-xs">
                            {processing ? t('admin.reports.saving') : t('admin.reports.save')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-3 border-t border-ink-200 pt-3 dark:border-ink-800">
                    {report.admin_note ? (
                        <div className="text-xs text-ink-600 dark:text-ink-400">
                            <span className="font-semibold">{t('admin.reports.admin_note_prefix')}</span> {report.admin_note}
                        </div>
                    ) : <div />}
                    <button type="button" onClick={() => setEditing(true)} className="btn-ghost !py-1 !text-xs">
                        <Icon.Sparkles className="h-3 w-3" />
                        {t('admin.reports.handle')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Index({ reports, counts, filter }) {
    const t = useT();
    const setFilter = (status) => {
        router.get(route('admin.reports.index'), status === 'pending' ? {} : { status }, { preserveScroll: false });
    };

    const FILTERS = [
        { key: 'pending', label: t('admin.reports.filter_pending'), count: counts.pending },
        { key: 'reviewed', label: t('admin.reports.filter_reviewed'), count: counts.reviewed },
        { key: 'resolved', label: t('admin.reports.filter_resolved'), count: counts.resolved },
        { key: 'dismissed', label: t('admin.reports.filter_dismissed'), count: counts.dismissed },
        { key: 'all', label: t('admin.reports.filter_all'), count: counts.all },
    ];

    return (
        <AppLayout>
            <Head title={t('admin.reports.head_title')} />
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">{t('admin.common.dashboard_breadcrumb')}</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">{t('admin.reports.breadcrumb')}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        {t('admin.reports.title')}
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                        {t('admin.reports.subtitle')}
                    </p>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => {
                        const active = f.key === filter;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                    active
                                        ? 'border-brand-500 bg-brand-500 text-white'
                                        : 'border-ink-200 bg-white text-ink-700 hover:border-brand-500/40 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-200'
                                }`}
                            >
                                {f.label}
                                <span className={`rounded-full px-1.5 text-[10px] font-mono ${active ? 'bg-white/20' : 'bg-ink-100 dark:bg-ink-800'}`}>
                                    {f.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Liste */}
                {reports.length === 0 ? (
                    <div className="rounded-2xl border border-ink-200 bg-white p-12 text-center dark:border-ink-800 dark:bg-ink-900/40">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
                            <Icon.Check className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-ink-900 dark:text-white">{t('admin.reports.empty_title')}</h3>
                        <p className="mt-1 text-sm text-ink-500">{t('admin.reports.empty_desc')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((r) => <ReportCard key={r.id} report={r} />)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
