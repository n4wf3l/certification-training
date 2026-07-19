import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Index({ certifications }) {
    const [query, setQuery] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const filtered = useMemo(() => {
        if (!query.trim()) return certifications;
        const q = query.toLowerCase();
        return certifications.filter(
            (c) => c.title.toLowerCase().includes(q) || (c.slug ?? '').toLowerCase().includes(q)
        );
    }, [query, certifications]);

    const totals = useMemo(() => ({
        total: certifications.length,
        active: certifications.filter((c) => c.is_active).length,
        questions: certifications.reduce((sum, c) => sum + c.questions_count, 0),
    }), [certifications]);

    const doDelete = (id) => {
        router.delete(route('admin.certifications.destroy', id), {
            onFinish: () => setConfirmDelete(null),
        });
    };

    return (
        <AppLayout>
            <Head title="Admin — Certifications" />

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">Certifications</span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                Certifications
                            </h1>
                            <p className="mt-1 text-sm text-ink-500">
                                <span className="font-mono font-semibold text-ink-900 dark:text-white">{totals.total}</span> au total
                                <span className="mx-2 text-ink-300">·</span>
                                <span className="font-mono font-semibold text-emerald-500">{totals.active}</span> actives
                                <span className="mx-2 text-ink-300">·</span>
                                <span className="font-mono font-semibold text-brand-500">{totals.questions}</span> questions
                            </p>
                        </div>
                        <Link href={route('admin.certifications.create')} className="btn-primary">
                            <Icon.Sparkles className="h-4 w-4" />
                            Nouvelle certification
                        </Link>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="card p-3">
                    <div className="relative">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400">
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.3-4.3" />
                        </svg>
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher par titre ou slug…"
                            className="field pl-9"
                        />
                    </div>
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
                            <Icon.Book className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-ink-900 dark:text-white">Aucune certification</h3>
                        <p className="mt-1 text-sm text-ink-500">
                            {query ? 'Aucun résultat pour cette recherche.' : 'Commence par en créer une.'}
                        </p>
                        {!query && (
                            <Link href={route('admin.certifications.create')} className="btn-primary mt-4 !inline-flex">
                                <Icon.Sparkles className="h-4 w-4" />
                                Nouvelle certification
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((c) => (
                            <CertCard
                                key={c.id}
                                certification={c}
                                onDelete={() => setConfirmDelete(c)}
                            />
                        ))}
                    </div>
                )}
            </div>

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
                                    Supprimer cette certification ?
                                </h3>
                                <p className="text-xs text-ink-500">
                                    Toutes les questions liées seront aussi supprimées.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-3 text-sm dark:border-ink-800 dark:bg-ink-900/40">
                            <div className="font-semibold text-ink-900 dark:text-white">
                                {confirmDelete.title}
                            </div>
                            <div className="text-xs text-ink-500">
                                {confirmDelete.questions_count} questions ·{' '}
                                {confirmDelete.duration_minutes} min · slug{' '}
                                <span className="font-mono">{confirmDelete.slug}</span>
                            </div>
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

function CertCard({ certification: c, onDelete }) {
    const readiness = c.total_questions > 0 ? Math.min(100, Math.round((c.questions_count / c.total_questions) * 100)) : 0;

    return (
        <div className="card-lift group relative flex flex-col overflow-hidden">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500 opacity-10 blur-2xl" />

            <div className="relative flex items-start gap-3 p-5">
                {c.logo_path ? (
                    <img
                        src={`/storage/${c.logo_path}`}
                        alt=""
                        className="h-12 w-12 shrink-0 object-contain"
                    />
                ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-iris-500 text-sm font-bold text-white shadow-glow">
                        {c.title
                            .replace(/[^A-Za-z0-9 ]/g, '')
                            .split(' ')
                            .filter(Boolean)
                            .map((w) => w[0])
                            .slice(0, 3)
                            .join('')
                            .toUpperCase()}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        {c.is_active ? (
                            <span className="badge-success !py-0 text-[10px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Actif
                            </span>
                        ) : (
                            <span className="badge-muted !py-0 text-[10px]">Masqué</span>
                        )}
                    </div>
                    <h3 className="mt-1 truncate text-base font-bold tracking-tight text-ink-900 dark:text-white">
                        {c.title}
                    </h3>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-ink-500">{c.slug}</div>
                </div>
            </div>

            {/* Stats */}
            <div className="relative grid grid-cols-3 gap-2 border-t border-ink-200/60 px-5 py-3 dark:border-ink-800/60">
                <Stat label="Questions" value={`${c.questions_count}/${c.total_questions}`} />
                <Stat label="Durée" value={`${c.duration_minutes}min`} />
                <Stat label="Requis" value={c.passing_score} />
            </div>

            {/* Progress */}
            <div className="relative px-5 pb-3">
                <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="uppercase tracking-wider text-ink-500">Prêt à publier</span>
                    <span className="font-mono font-bold text-ink-700 dark:text-ink-300">{readiness}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <div
                        className={`h-full transition-all ${
                            readiness >= 100
                                ? 'bg-emerald-500'
                                : readiness >= 50
                                ? 'bg-gradient-to-r from-brand-500 to-iris-500'
                                : 'bg-amber-500'
                        }`}
                        style={{ width: `${readiness}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="relative flex items-center gap-1 border-t border-ink-200/60 px-3 py-2 dark:border-ink-800/60">
                <Link
                    href={`${route('admin.questions.index')}?certification_id=${c.id}`}
                    className="btn-ghost !px-3 !py-1.5 !text-xs"
                    title="Voir les questions"
                >
                    <IconList className="h-3.5 w-3.5" />
                    Questions
                </Link>
                <a
                    href={route('admin.certifications.export', c.id)}
                    download
                    className="btn-ghost !px-3 !py-1.5 !text-xs"
                    title="Exporter toutes les Q&A en JSON"
                >
                    <IconDownload className="h-3.5 w-3.5" />
                    Export JSON
                </a>
                <div className="flex-1" />
                <Link
                    href={route('admin.certifications.edit', c.id)}
                    className="rounded-lg p-2 text-ink-400 transition hover:bg-brand-500/10 hover:text-brand-500"
                    title="Éditer"
                >
                    <IconPencil className="h-4 w-4" />
                </Link>
                <button
                    onClick={onDelete}
                    className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                    title="Supprimer"
                >
                    <IconTrash className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="text-center">
            <div className="font-mono text-sm font-bold text-ink-900 dark:text-white">{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
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

function IconList({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
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
