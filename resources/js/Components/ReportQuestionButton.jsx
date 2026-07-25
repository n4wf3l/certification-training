import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function ReportQuestionButton({ questionId, attemptId = null, chosenAnswerId = null, compact = false }) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        { key: 'wrong_answer', label: t('report_question.cat_wrong_answer') },
        { key: 'contradictory_rationale', label: t('report_question.cat_contradictory') },
        { key: 'outdated', label: t('report_question.cat_outdated') },
        { key: 'unclear', label: t('report_question.cat_unclear') },
        { key: 'typo', label: t('report_question.cat_typo') },
        { key: 'other', label: t('report_question.cat_other') },
    ];

    const submit = () => {
        if (!category) return;
        setSubmitting(true);
        router.post(
            route('questions.report', questionId),
            {
                category,
                message: message || null,
                chosen_answer_id: chosenAnswerId,
                attempt_id: attemptId,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setOpen(false);
                    setCategory('');
                    setMessage('');
                },
            }
        );
    };

    const triggerClasses = compact
        ? 'inline-flex items-center gap-1 text-[11px] text-ink-400 hover:text-rose-500 transition'
        : 'inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-rose-600 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300';

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={triggerClasses} title={t('report_question.trigger_title')}>
                <Icon.Close className="h-3 w-3" />
                {t('report_question.trigger')}
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="w-full max-w-lg animate-scale-in rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl dark:border-ink-800 dark:bg-ink-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                                <Icon.Close className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-ink-900 dark:text-white">{t('report_question.title')}</h3>
                                <p className="text-xs text-ink-500">{t('report_question.subtitle')}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                                    {t('report_question.category_label')}
                                </label>
                                <div className="space-y-1">
                                    {categories.map((c) => (
                                        <label
                                            key={c.key}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                                category === c.key
                                                    ? 'border-brand-500 bg-brand-500/5 text-brand-700 dark:text-brand-200'
                                                    : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-200 dark:hover:bg-ink-800/40'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="report-category"
                                                value={c.key}
                                                checked={category === c.key}
                                                onChange={() => setCategory(c.key)}
                                                className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                                            />
                                            {c.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                                    {t('report_question.details_label')}
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={t('report_question.details_placeholder')}
                                    maxLength={1000}
                                    rows={3}
                                    className="field resize-none"
                                />
                                <div className="mt-1 text-right text-[10px] text-ink-400">{message.length}/1000</div>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="btn-secondary" disabled={submitting}>
                                {t('report_question.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={!category || submitting}
                                className={`btn-primary ${!category || submitting ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                {submitting ? t('report_question.submitting') : t('report_question.submit')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
