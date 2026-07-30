import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

function formatDate(iso, locale) {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
}

/**
 * Page /admin/users : liste des inscrits, recherche par email/name, filtre role,
 * bouton toggle admin, bouton suppression avec confirmation. Volontairement pas
 * d'edit inline des champs email/name (respect de la souverainete user - il modifie
 * ces champs lui-meme depuis /profile).
 */
export default function Index({ users = [], filters = {}, totals = {} }) {
    const t = useT();
    const currentUserId = usePage().props.auth?.user?.id;
    const [q, setQ] = useState(filters.q ?? '');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { q, role: filters.role || undefined }, { preserveState: true, preserveScroll: true });
    };

    const filterRole = (role) => {
        router.get(route('admin.users.index'), { q: filters.q || undefined, role: role || undefined }, { preserveState: true, preserveScroll: true });
    };

    const toggleRole = (user) => {
        router.patch(route('admin.users.toggleRole', user.id), {}, { preserveScroll: true });
    };

    const doDelete = (user) => {
        router.delete(route('admin.users.destroy', user.id), {
            preserveScroll: true,
            onFinish: () => setConfirmDelete(null),
        });
    };

    return (
        <AppLayout>
            <Head title={t('admin.users.head_title')} />

            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                            <span className="h-px w-6 bg-ink-400 dark:bg-ink-600" />
                            <Link href={route('admin.dashboard')} className="hover:text-ink-900 dark:hover:text-white">
                                {t('admin.common.dashboard_breadcrumb')}
                            </Link>
                            <span className="text-ink-300">/</span>
                            <span className="text-ink-900 dark:text-white">{t('admin.users.breadcrumb')}</span>
                        </div>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                            {t('admin.users.title')}
                        </h1>
                        <p className="mt-1 text-sm text-ink-500">
                            {t('admin.users.subtitle', { total: totals.all ?? 0, admins: totals.admins ?? 0 })}
                        </p>
                    </div>
                </div>

                {/* Search + filters */}
                <div className="card p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2">
                            <input
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder={t('admin.users.search_placeholder')}
                                className="field flex-1"
                            />
                            <button type="submit" className="btn-secondary shrink-0">
                                {t('admin.users.search_submit')}
                            </button>
                        </form>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => filterRole(null)}
                                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                    !filters.role
                                        ? 'border-brand-500 bg-brand-500 text-white'
                                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300'
                                }`}
                            >
                                {t('admin.users.filter_all')}
                            </button>
                            <button
                                onClick={() => filterRole('admin')}
                                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                    filters.role === 'admin'
                                        ? 'border-brand-500 bg-brand-500 text-white'
                                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300'
                                }`}
                            >
                                {t('admin.users.filter_admins')}
                            </button>
                            <button
                                onClick={() => filterRole('user')}
                                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                    filters.role === 'user'
                                        ? 'border-brand-500 bg-brand-500 text-white'
                                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300'
                                }`}
                            >
                                {t('admin.users.filter_users')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                {users.length === 0 ? (
                    <div className="card p-8 text-center text-sm text-ink-500">
                        {t('admin.users.empty')}
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="hidden grid-cols-12 gap-4 border-b border-ink-200 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 md:grid">
                            <div className="col-span-4">{t('admin.users.col_user')}</div>
                            <div className="col-span-2">{t('admin.users.col_role')}</div>
                            <div className="col-span-2 text-right">{t('admin.users.col_attempts')}</div>
                            <div className="col-span-2">{t('admin.users.col_activity')}</div>
                            <div className="col-span-2 text-right">{t('admin.users.col_actions')}</div>
                        </div>
                        <ul className="divide-y divide-ink-200/60 dark:divide-ink-800/60">
                            {users.map((u) => {
                                const isSelf = u.id === currentUserId;
                                return (
                                    <li key={u.id} className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-12 md:items-center md:gap-4">
                                        <div className="col-span-4 min-w-0">
                                            <div className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                                                {u.name}
                                                {isSelf && (
                                                    <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-brand-600 dark:text-brand-300">
                                                        {t('admin.users.you')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="truncate text-xs text-ink-500">{u.email}</div>
                                            {!u.email_verified && (
                                                <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-300">
                                                    <Icon.Close className="h-3 w-3" />
                                                    {t('admin.users.unverified')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                u.is_admin
                                                    ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300'
                                                    : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
                                            }`}>
                                                {u.is_admin ? t('admin.users.role_admin') : t('admin.users.role_user')}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-right font-mono text-sm text-ink-800 dark:text-ink-100">
                                            {u.attempts_count}
                                        </div>
                                        <div className="col-span-2 text-xs text-ink-500">
                                            {u.last_activity_date
                                                ? t('admin.users.last_activity', { date: formatDate(u.last_activity_date, 'fr') })
                                                : t('admin.users.no_activity')}
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => toggleRole(u)}
                                                disabled={isSelf}
                                                title={isSelf ? t('admin.users.cannot_change_own_role') : ''}
                                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                                                    isSelf
                                                        ? 'cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400 dark:border-ink-800 dark:bg-ink-900/20 dark:text-ink-600'
                                                        : 'border-ink-200 bg-white text-ink-600 hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-brand-600 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300'
                                                }`}
                                            >
                                                {u.is_admin ? t('admin.users.demote') : t('admin.users.promote')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => !isSelf && setConfirmDelete(u)}
                                                disabled={isSelf}
                                                title={isSelf ? t('admin.users.cannot_delete_self') : ''}
                                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                                                    isSelf
                                                        ? 'cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400 dark:border-ink-800 dark:bg-ink-900/20 dark:text-ink-600'
                                                        : 'border-rose-500/30 bg-white text-rose-600 hover:bg-rose-500/10 dark:border-rose-500/40 dark:bg-ink-900/40 dark:text-rose-300'
                                                }`}
                                            >
                                                <Icon.Close className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {/* Delete confirmation modal - rendu inline (pas de portal necessaire ici). */}
            {confirmDelete && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm"
                    onClick={() => setConfirmDelete(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="card w-full max-w-md p-6"
                    >
                        <h3 className="text-lg font-bold text-ink-900 dark:text-white">
                            {t('admin.users.confirm_delete_title')}
                        </h3>
                        <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                            {t('admin.users.confirm_delete_body', { email: confirmDelete.email })}
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="btn-secondary"
                            >
                                {t('admin.common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={() => doDelete(confirmDelete)}
                                className="btn bg-rose-500 text-white hover:bg-rose-600"
                            >
                                {t('admin.users.confirm_delete_submit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
