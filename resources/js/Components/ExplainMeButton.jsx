import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

export default function ExplainMeButton({ questionId, wrongAnswerId = null }) {
    const t = useT();
    const { features } = usePage().props;
    const aiEnabled = !!features?.ai_explain;

    const [state, setState] = useState('idle'); // idle | loading | success | error | unavailable
    const [explanation, setExplanation] = useState('');
    const [error, setError] = useState('');
    const [cached, setCached] = useState(false);

    if (!aiEnabled) {
        return (
            <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-brand-500/30 bg-brand-500/5 px-3 py-2 text-xs font-semibold text-brand-600/80 dark:text-brand-300/80">
                <Icon.Sparkles className="h-3.5 w-3.5" />
                {t('explain_me.cta')}
                <span className="ml-1 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                    {t('explain_me.soon_badge')}
                </span>
            </div>
        );
    }

    const fetchExplanation = async () => {
        setState('loading');
        setError('');
        try {
            const res = await axios.post(
                route('questions.explain', questionId),
                { wrong_answer_id: wrongAnswerId }
            );
            setExplanation(res.data.explanation);
            setCached(!!res.data.cached);
            setState('success');
        } catch (e) {
            const status = e.response?.status;
            const msg = e.response?.data?.error || t('explain_me.error_unknown');
            if (status === 503) {
                setState('unavailable');
                return;
            }
            setError(msg);
            setState('error');
        }
    };

    if (state === 'success') {
        return (
            <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">
                    <Icon.Sparkles className="h-3.5 w-3.5" />
                    {t('explain_me.heading')}
                    {cached && (
                        <span className="ml-1 rounded bg-ink-200 px-1.5 py-0.5 text-[9px] normal-case text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                            {t('explain_me.cache_badge')}
                        </span>
                    )}
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-800 dark:text-ink-100">
                    {explanation}
                </p>
            </div>
        );
    }

    if (state === 'unavailable') {
        return (
            <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-brand-500/30 bg-brand-500/5 px-3 py-2 text-xs font-semibold text-brand-600/80 dark:text-brand-300/80">
                <Icon.Sparkles className="h-3.5 w-3.5" />
                {t('explain_me.cta')}
                <span className="ml-1 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                    {t('explain_me.soon_badge')}
                </span>
            </div>
        );
    }

    if (state === 'error') {
        return (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
                <div className="mb-1 font-semibold">{t('explain_me.error_heading')}</div>
                {error}
                <button type="button" onClick={fetchExplanation} className="mt-2 text-xs underline underline-offset-2">
                    {t('explain_me.retry')}
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={fetchExplanation}
            disabled={state === 'loading'}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/5 px-3 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-500/10 disabled:opacity-60 dark:text-brand-300"
        >
            {state === 'loading' ? (
                <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                    </svg>
                    {t('explain_me.generating')}
                </>
            ) : (
                <>
                    <Icon.Sparkles className="h-3.5 w-3.5" />
                    {t('explain_me.cta')}
                </>
            )}
        </button>
    );
}
