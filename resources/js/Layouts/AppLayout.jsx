import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AppLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const isAdmin = user?.is_admin;
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href={route('home')} className="text-lg font-bold text-slate-900 dark:text-white">
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                Certification Training
                            </span>
                        </Link>
                        <div className="hidden gap-6 md:flex">
                            <Link href={route('home')} className="text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-200">
                                Examens
                            </Link>
                            {user && (
                                <Link href={route('stats.index')} className="text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-200">
                                    Mes stats
                                </Link>
                            )}
                            {isAdmin && (
                                <Link href={route('admin.dashboard')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        {user ? (
                            <>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {user.name}
                                    {isAdmin && (
                                        <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                            admin
                                        </span>
                                    )}
                                </span>
                                <Link href={route('profile.edit')} className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300">
                                    Profil
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    Déconnexion
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href={route('login')} className="text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-200">
                                    Connexion
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                                >
                                    S'inscrire
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        className="md:hidden"
                        onClick={() => setOpen((v) => !v)}
                        aria-label="menu"
                    >
                        <svg className="h-6 w-6 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                        </svg>
                    </button>
                </div>
                {open && (
                    <div className="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800">
                        <div className="flex flex-col gap-3">
                            <Link href={route('home')} className="text-sm text-slate-700 dark:text-slate-200">
                                Examens
                            </Link>
                            {user && (
                                <Link href={route('stats.index')} className="text-sm text-slate-700 dark:text-slate-200">
                                    Mes stats
                                </Link>
                            )}
                            {isAdmin && (
                                <Link href={route('admin.dashboard')} className="text-sm text-indigo-600 dark:text-indigo-400">
                                    Admin
                                </Link>
                            )}
                            {user ? (
                                <>
                                    <Link href={route('profile.edit')} className="text-sm text-slate-700 dark:text-slate-200">
                                        Profil
                                    </Link>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="w-fit rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        Déconnexion
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href={route('login')} className="text-sm text-slate-700 dark:text-slate-200">
                                        Connexion
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="w-fit rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white"
                                    >
                                        S'inscrire
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {flash?.success && (
                <div className="border-b border-emerald-200 bg-emerald-50 py-2 text-center text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="border-b border-rose-200 bg-rose-50 py-2 text-center text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
                    {flash.error}
                </div>
            )}

            {header && (
                <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
    );
}
