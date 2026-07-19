import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function CertLogo({ certification, size = 'md' }) {
    const dims = {
        sm: 'h-6 w-6 text-[9px]',
        md: 'h-12 w-12 text-sm',
        lg: 'h-16 w-16 text-base',
    }[size];
    if (certification?.logo_path) {
        return (
            <img
                src={`/storage/${certification.logo_path}`}
                alt={certification.title}
                className={`${dims} shrink-0 object-contain`}
            />
        );
    }
    const initials = (certification?.title || '?')
        .replace(/[^A-Za-z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 3)
        .join('')
        .toUpperCase();
    return (
        <div className={`${dims} flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 font-mono font-bold tracking-tighter text-white`}>
            {initials}
        </div>
    );
}

function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = window.localStorage.getItem(key);
            if (stored !== null) return JSON.parse(stored);
        } catch { /* ignore */ }
        return defaultValue;
    });
    useEffect(() => {
        try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    }, [key, value]);
    return [value, setValue];
}

export default function Index({ certifications, selected_certification_id, questions }) {
    const [query, setQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [viewMode, setViewMode] = useLocalStorage('admin.qa.viewMode', 'paginated');
    const [pageSize, setPageSize] = useLocalStorage('admin.qa.pageSize', 25);
    const [page, setPage] = useState(1);

    const selectedCert = certifications.find((c) => c.id === selected_certification_id);

    const filtered = useMemo(() => {
        if (!query.trim()) return questions;
        const q = query.toLowerCase();
        return questions.filter(
            (x) =>
                x.question_text.toLowerCase().includes(q) ||
                (x.topic ?? '').toLowerCase().includes(q) ||
                (x.scenario ?? '').toLowerCase().includes(q)
        );
    }, [query, questions]);

    useEffect(() => { setPage(1); }, [query, selected_certification_id, pageSize, viewMode]);

    const totalPages = viewMode === 'full' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const visible = viewMode === 'full'
        ? filtered
        : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, filtered.length);

    const changeFilter = (v) => {
        router.get(route('admin.questions.index'), v ? { certification_id: v } : {}, {
            preserveState: false,
        });
    };

    const doDelete = (id) => {
        router.delete(route('admin.questions.destroy', id), {
            onFinish: () => setConfirmDelete(null),
        });
    };

    return (
        <AppLayout>
            <Head title="Admin — Questions" />

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">Dashboard</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">Questions</span>
                        {selectedCert && (
                            <>
                                <span>/</span>
                                <span className="badge-brand !py-0">{selectedCert.title}</span>
                            </>
                        )}
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {selectedCert && <CertLogo certification={selectedCert} size="lg" />}
                            <div>
                                {selectedCert && (
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                                        Questions & réponses
                                    </div>
                                )}
                                <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                    {selectedCert ? selectedCert.title : 'Questions & réponses'}
                                </h1>
                                <p className="mt-1 text-sm text-ink-500">
                                    <span className="font-mono font-semibold text-ink-900 dark:text-white">
                                        {questions.length}
                                    </span>
                                    {' '}question{questions.length > 1 ? 's' : ''}
                                    {!selectedCert && ' au total, toutes certifications confondues'}
                                    {query && filtered.length !== questions.length && (
                                        <> — <span className="font-mono">{filtered.length}</span> après filtre</>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedCert && (
                                <a
                                    href={route('admin.certifications.export', selectedCert.id)}
                                    download
                                    className="btn-secondary"
                                    title="Télécharger toutes les Q&A de cette certification en JSON"
                                >
                                    <IconDownload className="h-4 w-4" />
                                    Export JSON
                                </a>
                            )}
                            <Link
                                href={
                                    selected_certification_id
                                        ? `${route('admin.questions.import')}?certification_id=${selected_certification_id}`
                                        : route('admin.questions.import')
                                }
                                className="btn-secondary"
                                title="Générer des questions via ChatGPT et importer le JSON"
                            >
                                <Icon.Bolt className="h-4 w-4" />
                                Import ChatGPT
                            </Link>
                            <Link
                                href={
                                    selected_certification_id
                                        ? `${route('admin.questions.create')}?certification_id=${selected_certification_id}`
                                        : route('admin.questions.create')
                                }
                                className="btn-primary"
                            >
                                <Icon.Sparkles className="h-4 w-4" />
                                Nouvelle question
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="card p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[220px]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400">
                                <circle cx="11" cy="11" r="7" />
                                <path d="M21 21l-4.3-4.3" />
                            </svg>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher dans les questions, thèmes, scénarios…"
                                className="field pl-9"
                            />
                        </div>
                        <div className="min-w-[240px]">
                            <Select
                                value={selected_certification_id ?? ''}
                                onChange={changeFilter}
                                options={[
                                    { value: '', label: 'Toutes les certifications' },
                                    ...certifications.map((c) => ({
                                        value: c.id,
                                        label: c.title,
                                        logo: c,
                                    })),
                                ]}
                                placeholder="Filtrer par certif…"
                            />
                        </div>
                        {(query || selectedCert) && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    if (selectedCert) router.get(route('admin.questions.index'));
                                }}
                                className="btn-ghost !py-2"
                            >
                                <Icon.Close className="h-4 w-4" />
                                Réinitialiser
                            </button>
                        )}
                    </div>

                    {/* View mode + page size */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-200/60 pt-3 dark:border-ink-800/60">
                        <div className="inline-flex overflow-hidden rounded-lg border border-ink-200 bg-white p-0.5 dark:border-ink-800 dark:bg-ink-900">
                            <button
                                type="button"
                                onClick={() => setViewMode('paginated')}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                                    viewMode === 'paginated'
                                        ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                                        : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'
                                }`}
                            >
                                Paginé
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('full')}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                                    viewMode === 'full'
                                        ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                                        : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'
                                }`}
                            >
                                Tout afficher
                            </button>
                        </div>

                        {viewMode === 'paginated' && (
                            <div className="inline-flex items-center gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">Par page</span>
                                <div className="inline-flex overflow-hidden rounded-lg border border-ink-200 bg-white p-0.5 dark:border-ink-800 dark:bg-ink-900">
                                    {[25, 50, 100].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setPageSize(n)}
                                            className={`rounded-md px-2.5 py-1 font-mono text-xs transition ${
                                                pageSize === n
                                                    ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                                                    : 'text-ink-500 hover:text-ink-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filtered.length > 0 && (
                            <div className="ml-auto font-mono text-[11px] text-ink-500">
                                {viewMode === 'full'
                                    ? `Toutes les ${filtered.length} affichées`
                                    : `${rangeStart}–${rangeEnd} sur ${filtered.length}`}
                            </div>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="card overflow-hidden">
                    {filtered.length === 0 ? (
                        <EmptyState
                            hasQuery={!!query}
                            selectedCert={selectedCert}
                            selectedCertId={selected_certification_id}
                        />
                    ) : (
                        <ul className="divide-y divide-ink-200/60 dark:divide-ink-800/60">
                            {visible.map((q) => {
                                const expanded = expandedId === q.id;
                                return (
                                    <li key={q.id} className="group">
                                        <div
                                            className={`flex items-start gap-4 px-4 py-3 transition sm:px-6 ${
                                                expanded
                                                    ? 'bg-ink-50/50 dark:bg-ink-900/40'
                                                    : 'hover:bg-ink-50/50 dark:hover:bg-ink-900/30'
                                            }`}
                                        >
                                            {/* Position */}
                                            <div className="hidden w-10 shrink-0 pt-1 sm:block">
                                                <span className="font-mono text-xs text-ink-400">
                                                    #{String(q.position).padStart(2, '0')}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <button
                                                type="button"
                                                onClick={() => setExpandedId(expanded ? null : q.id)}
                                                className="flex-1 min-w-0 text-left"
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {!selectedCert && (
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <CertLogo certification={q.certification} size="sm" />
                                                            <span className="badge-muted !py-0 text-[10px]">
                                                                {q.certification.title}
                                                            </span>
                                                        </span>
                                                    )}
                                                    {q.topic && (
                                                        <span className="badge-brand !py-0 text-[10px]">
                                                            {q.topic}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-ink-500">
                                                        <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                                                            {q.correct_letter ?? '?'}
                                                        </span>
                                                        {q.answers_count} réponses
                                                    </span>
                                                </div>
                                                <p className={`mt-1.5 text-sm text-ink-900 dark:text-ink-100 ${expanded ? '' : 'line-clamp-2'}`}>
                                                    {q.question_text}
                                                </p>
                                            </button>

                                            {/* Actions */}
                                            <div className="flex shrink-0 items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(expanded ? null : q.id)}
                                                    className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
                                                    title={expanded ? 'Réduire' : 'Voir la question complète'}
                                                >
                                                    <Icon.ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                <Link
                                                    href={route('admin.questions.edit', q.id)}
                                                    className="rounded-lg p-2 text-ink-400 transition hover:bg-brand-500/10 hover:text-brand-500"
                                                    title="Éditer"
                                                >
                                                    <IconPencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDelete(q)}
                                                    className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                                                    title="Supprimer"
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded content */}
                                        {expanded && (
                                            <div className="animate-fade-up border-t border-ink-200/60 bg-ink-50/30 px-4 py-4 sm:px-6 dark:border-ink-800/60 dark:bg-ink-900/40">
                                                {q.scenario && (
                                                    <div className="mb-4 rounded-lg border-l-4 border-brand-500 bg-brand-500/5 p-3 text-sm text-ink-700 dark:text-ink-200">
                                                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                                                            Contexte
                                                        </div>
                                                        {q.scenario}
                                                    </div>
                                                )}
                                                <ul className="space-y-1.5">
                                                    {q.answers?.map((a) => (
                                                        <li
                                                            key={a.letter}
                                                            className={`flex items-start gap-3 rounded-lg border p-2.5 text-sm ${
                                                                a.is_correct
                                                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                                                                    : 'border-ink-200 bg-white text-ink-600 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${
                                                                    a.is_correct
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                                                                }`}
                                                            >
                                                                {a.letter}
                                                            </span>
                                                            <span className="flex-1">{a.text}</span>
                                                            {a.is_correct && (
                                                                <Icon.Check className="mt-1 h-4 w-4 text-emerald-500" />
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-4 flex justify-end gap-2">
                                                    <Link
                                                        href={route('admin.questions.edit', q.id)}
                                                        className="btn-secondary !py-1.5 !text-xs"
                                                    >
                                                        <IconPencil className="h-3.5 w-3.5" />
                                                        Éditer cette question
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {viewMode === 'paginated' && totalPages > 1 && filtered.length > 0 && (
                        <div className="flex items-center justify-between gap-3 border-t border-ink-200/60 px-4 py-3 sm:px-6 dark:border-ink-800/60">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="btn-secondary !py-1.5 !text-xs disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Icon.ArrowLeft className="h-3.5 w-3.5" />
                                Précédent
                            </button>
                            <div className="font-mono text-xs text-ink-500">
                                Page <span className="font-semibold text-ink-900 dark:text-white">{currentPage}</span> / {totalPages}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="btn-secondary !py-1.5 !text-xs disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Suivant
                                <Icon.ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom delete confirm modal */}
            {confirmDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in"
                    onClick={() => setConfirmDelete(null)}
                >
                    <div
                        className="card w-full max-w-md animate-scale-in p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                                <IconTrash className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-ink-900 dark:text-white">
                                    Supprimer cette question ?
                                </h3>
                                <p className="text-xs text-ink-500">Action irréversible.</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-3 text-sm text-ink-700 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                                Q{confirmDelete.position} · {confirmDelete.certification.title}
                            </div>
                            <p className="mt-1 line-clamp-2">{confirmDelete.question_text}</p>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={() => setConfirmDelete(null)} className="btn-secondary">
                                Annuler
                            </button>
                            <button
                                onClick={() => doDelete(confirmDelete.id)}
                                className="btn bg-rose-500 text-white hover:bg-rose-600"
                            >
                                <IconTrash className="h-4 w-4" />
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function EmptyState({ hasQuery, selectedCert, selectedCertId }) {
    return (
        <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
                {hasQuery ? 'Aucune correspondance' : 'Aucune question'}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                {hasQuery
                    ? 'Essaie un autre mot-clé ou change de certification.'
                    : selectedCert
                    ? `Aucune question pour ${selectedCert.title}. Commence par en créer une.`
                    : 'Choisis une certification puis crée ta première question.'}
            </p>
            {!hasQuery && (
                <Link
                    href={
                        selectedCertId
                            ? `${route('admin.questions.create')}?certification_id=${selectedCertId}`
                            : route('admin.questions.create')
                    }
                    className="btn-primary mt-5 !inline-flex"
                >
                    <Icon.Sparkles className="h-4 w-4" />
                    Nouvelle question
                </Link>
            )}
        </div>
    );
}

function IconPencil({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    );
}

function IconTrash({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
        </svg>
    );
}

function IconDownload({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
    );
}
