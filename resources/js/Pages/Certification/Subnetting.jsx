import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { generate, LEVELS } from '@/lib/subnetting';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Familles d'exercices, activables separement.
const FAMILIES = {
    addresses: ['network', 'broadcast', 'first', 'last', 'same_subnet'],
    masks: ['mask', 'prefix_from_mask', 'wildcard'],
    sizing: ['hosts', 'prefix_for_hosts', 'subnets_count'],
};
const ADDRESS_TYPES = FAMILIES.addresses;
const STORE = 'subnetting.best';

const readBest = () => {
    try { return Number(window.localStorage.getItem(STORE)) || 0; } catch { return 0; }
};
const writeBest = (n) => {
    try { window.localStorage.setItem(STORE, String(n)); } catch { /* stockage indisponible */ }
};

function Explanation({ q }) {
    const t = useT();
    const e = q.explain;
    const params = { ...e, octetName: e.octet ? t(`subnetting.octet_${e.octet}`) : '', bitsInOctet: e.prefix !== undefined ? e.prefix - 8 * Math.min(3, Math.floor(e.prefix / 8)) : '' };
    const parts = [];
    if (ADDRESS_TYPES.includes(q.type)) {
        parts.push(t('subnetting.ex_address', params));
        if (q.type === 'first') parts.push(t('subnetting.ex_first', params));
        if (q.type === 'last') parts.push(t('subnetting.ex_last', params));
        if (q.type === 'same_subnet') parts.push(t('subnetting.ex_same_subnet', params));
    } else {
        parts.push(t(`subnetting.ex_${q.type}`, params));
    }
    return (
        <div className="space-y-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
            {parts.map((p) => <p key={p}>{p}</p>)}
        </div>
    );
}

export default function Subnetting({ certification }) {
    const t = useT();
    const [level, setLevel] = useState('easy');
    const [families, setFamilies] = useState(['addresses', 'masks', 'sizing']);
    const types = useMemo(() => families.flatMap((f) => FAMILIES[f]), [families]);
    const [q, setQ] = useState(null);
    const [picked, setPicked] = useState(null);
    const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
    const [best, setBest] = useState(0);

    const next = useCallback(() => {
        setQ(generate({ level, types }));
        setPicked(null);
    }, [level, types]);

    // Nouveau tirage au chargement et quand le niveau ou les familles changent.
    useEffect(() => { next(); }, [next]);
    useEffect(() => { setBest(readBest()); }, []);

    const answer = useCallback((i) => {
        if (!q || picked !== null) return;
        setPicked(i);
        const ok = i === q.answerIndex;
        setScore((s) => {
            const streak = ok ? s.streak + 1 : 0;
            if (streak > best) { setBest(streak); writeBest(streak); }
            return { right: s.right + (ok ? 1 : 0), total: s.total + 1, streak };
        });
    }, [q, picked, best]);

    // Clavier : 1-4 pour repondre, Entree pour l'exercice suivant.
    useEffect(() => {
        const onKey = (ev) => {
            if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
            if (picked === null && ['1', '2', '3', '4'].includes(ev.key)) answer(Number(ev.key) - 1);
            else if (picked !== null && ev.key === 'Enter') next();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [picked, answer, next]);

    const toggleFamily = (f) => setFamilies((cur) => (cur.includes(f) ? (cur.length > 1 ? cur.filter((x) => x !== f) : cur) : [...cur, f]));
    const pct = score.total ? Math.round((100 * score.right) / score.total) : 0;
    const answered = picked !== null;
    const isRight = answered && picked === q.answerIndex;

    return (
        <AppLayout>
            <Head title={`${t('subnetting.page_title')} · ${certification.title}`} />
            <div className="mx-auto max-w-3xl">
                <Link href={route('certifications.show', certification.slug)} className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-brand-500">
                    <Icon.ArrowLeft className="h-3 w-3" />
                    {certification.title}
                </Link>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{t('subnetting.title')}</h1>
                <p className="mt-2 text-ink-600 dark:text-ink-300">{t('subnetting.subtitle')}</p>

                {/* Reglages */}
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">{t('subnetting.level')}</div>
                        <div className="mt-2 inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-800" role="radiogroup" aria-label={t('subnetting.level')}>
                            {Object.keys(LEVELS).map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    role="radio"
                                    aria-checked={level === l}
                                    onClick={() => setLevel(l)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${level === l ? 'bg-brand-400 text-ink-950' : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white'}`}
                                >
                                    {t(`subnetting.level_${l}`)}
                                    <span className="ml-1.5 font-mono text-[10px] opacity-70">/{LEVELS[l].minPrefix}-/{LEVELS[l].maxPrefix}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">{t('subnetting.families')}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {Object.keys(FAMILIES).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    aria-pressed={families.includes(f)}
                                    onClick={() => toggleFamily(f)}
                                    className={`rounded-md border px-3 py-1.5 text-sm transition ${families.includes(f) ? 'border-brand-500 bg-brand-500/10 text-ink-900 dark:text-white' : 'border-ink-200 text-ink-500 hover:text-ink-800 dark:border-ink-800 dark:hover:text-ink-200'}`}
                                >
                                    {t(`subnetting.family_${f}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Score */}
                <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-ink-200 py-4 dark:border-ink-800">
                    {[
                        [t('subnetting.score'), `${score.right}/${score.total}`, score.total ? `${pct} %` : ''],
                        [t('subnetting.streak'), score.streak, ''],
                        [t('subnetting.best'), best, ''],
                    ].map(([label, value, sub]) => (
                        <div key={label}>
                            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">{label}</dt>
                            <dd className="mt-1 font-mono text-2xl font-semibold text-ink-900 dark:text-white">
                                {value}
                                {sub && <span className="ml-2 text-sm font-normal text-ink-500">{sub}</span>}
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* Exercice */}
                {q && (
                    <div className="card mt-6 p-4 sm:p-6" aria-live="polite">
                        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                            {t(`subnetting.type_${q.type}`)}
                        </div>
                        <p className="mt-3 text-xl font-semibold leading-snug text-ink-900 dark:text-white">
                            {t(`subnetting.q_${q.type}`, q.prompt)}
                        </p>

                        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                            {q.options.map((o, i) => {
                                const right = i === q.answerIndex;
                                const chosen = i === picked;
                                let style = 'border-ink-200 hover:border-brand-500/50 dark:border-ink-800';
                                if (answered) {
                                    if (right) style = 'border-emerald-500 bg-emerald-500/10';
                                    else if (chosen) style = 'border-rose-500 bg-rose-500/10 answer-shake';
                                    else style = 'border-ink-200 opacity-60 dark:border-ink-800';
                                }
                                return (
                                    <li key={o}>
                                        <button
                                            type="button"
                                            onClick={() => answer(i)}
                                            disabled={answered}
                                            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${style}`}
                                        >
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${answered && (right || chosen) ? 'answer-flip' : ''} ${answered && right ? 'bg-emerald-500 text-white' : answered && chosen ? 'bg-rose-500 text-white' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'}`}>
                                                {'ABCD'[i]}
                                            </span>
                                            <span className="font-mono text-base text-ink-900 dark:text-white">{o}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {answered && (
                            <div className={`mt-5 rounded-lg border p-4 ${isRight ? 'border-emerald-500/40' : 'border-rose-500/40'}`}>
                                <div className={`mb-2 text-sm font-semibold ${isRight ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                                    {isRight ? t('subnetting.right') : t('subnetting.wrong', { answer: q.correct })}
                                </div>
                                <Explanation q={q} />
                            </div>
                        )}

                        <div className="mt-5 flex items-center justify-between gap-4">
                            <span className="hidden text-xs text-ink-500 sm:inline">{t('subnetting.keys_hint')}</span>
                            <button type="button" onClick={next} className={answered ? 'btn-primary' : 'btn-secondary'}>
                                {answered ? t('subnetting.next') : t('subnetting.skip')}
                                <Icon.ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                <p className="mt-6 text-xs leading-relaxed text-ink-500">{t('subnetting.footer')}</p>
            </div>
        </AppLayout>
    );
}
