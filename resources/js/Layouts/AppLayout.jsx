import Toaster, { useFlashToasts } from '@/Components/Toaster';
import Icon from '@/Components/Icons';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function BrandMark({ size = 'sm', settings }) {
    const cfg = size === 'lg'
        ? { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-lg' }
        : { box: 'h-9 w-9', icon: 'h-[18px] w-[18px]', text: 'text-[15px]' };
    const brandName = settings?.brand_name || 'CertifLoop';
    const logoUrl = settings?.brand_logo_path ? `/storage/${settings.brand_logo_path}` : null;
    // Split "CertifLoop" style names in two if the second half starts with uppercase
    const parts = /^([A-Z][a-z]+)([A-Z].*)$/.exec(brandName);
    const [head, tail] = parts ? [parts[1], parts[2]] : [brandName, ''];

    return (
        <div className="group flex items-center gap-2.5">
            <span className={`relative flex ${cfg.box} items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                logoUrl
                    ? 'bg-white shadow-sm dark:bg-ink-900'
                    : 'bg-gradient-to-br from-brand-500 via-brand-500 to-iris-500 shadow-glow'
            }`}>
                {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                    <>
                        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 to-transparent opacity-70" />
                        <svg viewBox="0 0 24 24" className={`relative ${cfg.icon} text-white`} fill="none">
                            <path d="M4 14 8 10l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-ink-950" />
            </span>
            <span className={`${cfg.text} font-bold tracking-tight`}>
                <span className="text-ink-900 dark:text-white">{head}</span>
                {tail && <span className="gradient-text">{tail}</span>}
            </span>
        </div>
    );
}

function UserMenu({ user, isAdmin }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="group flex items-center gap-2 rounded-full border border-ink-200/70 bg-white/60 py-1 pl-1 pr-3 text-xs shadow-sm transition hover:border-brand-500/40 hover:shadow-glow dark:border-ink-800/70 dark:bg-ink-900/50"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-iris-500 text-[10px] font-bold text-white shadow-inset-line">
                    {initials}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 to-transparent" />
                </span>
                <span className="hidden font-semibold text-ink-700 dark:text-ink-200 sm:inline">{user.name}</span>
                {isAdmin && (
                    <span className="hidden rounded-full border border-brand-500/30 bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300 sm:inline">
                        Admin
                    </span>
                )}
                <Icon.ChevronDown className={`h-3.5 w-3.5 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-ink-200/70 bg-white/95 shadow-xl backdrop-blur-xl dark:border-ink-800/70 dark:bg-ink-900/95"
                >
                    <div className="border-b border-ink-200/60 bg-gradient-to-br from-brand-500/5 to-iris-500/5 px-4 py-3 dark:border-ink-800/60">
                        <div className="text-sm font-semibold text-ink-900 dark:text-white">{user.name}</div>
                        <div className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</div>
                    </div>
                    <div className="p-1.5">
                        <Link
                            href={route('profile.edit')}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800/70"
                        >
                            <Icon.User className="h-4 w-4 text-ink-500" />
                            Mon profil
                        </Link>
                        <Link
                            href={route('stats.index')}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800/70"
                        >
                            <Icon.Chart className="h-4 w-4 text-ink-500" />
                            Mes statistiques
                        </Link>
                        {isAdmin && (
                            <Link
                                href={route('admin.dashboard')}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-brand-600 transition hover:bg-brand-500/10 dark:text-brand-300"
                            >
                                <Icon.Shield className="h-4 w-4" />
                                Dashboard admin
                            </Link>
                        )}
                    </div>
                    <div className="border-t border-ink-200/60 p-1.5 dark:border-ink-800/60">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-300"
                        >
                            <Icon.LogOut className="h-4 w-4" />
                            Déconnexion
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AppLayout({ header, children, full = false, ambient = true }) {
    const page = usePage();
    const { auth, settings } = page.props;
    const user = auth?.user;
    const isAdmin = user?.is_admin;
    const [mobileOpen, setMobileOpen] = useState(false);
    useFlashToasts();

    const nav = [
        { href: route('home'), label: 'Examens', icon: Icon.Book, active: route().current('home') },
        ...(user ? [{ href: route('stats.index'), label: 'Mes stats', icon: Icon.Chart, active: route().current('stats.*') }] : []),
        ...(isAdmin ? [{ href: route('admin.dashboard'), label: 'Dashboard', icon: Icon.Shield, active: route().current('admin.*'), accent: true }] : []),
    ];

    const year = new Date().getFullYear();

    return (
        <div className="relative flex min-h-screen flex-col">
            {/* Ambient background */}
            {ambient && (
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-radial-brand opacity-70" />
                    <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
                    <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-iris-500/10 blur-3xl" />
                </div>
            )}

            {/* NAVBAR */}
            <nav className="glass-nav">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href={route('home')} className="shrink-0">
                            <BrandMark settings={settings} />
                        </Link>
                        <div className="hidden items-center gap-1 md:flex">
                            {nav.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                        item.active
                                            ? item.accent
                                                ? 'bg-gradient-to-r from-brand-500/10 to-iris-500/10 text-brand-600 ring-1 ring-brand-500/20 dark:text-brand-300'
                                                : 'bg-ink-100 text-ink-900 dark:bg-ink-800/70 dark:text-white'
                                            : item.accent
                                            ? 'text-brand-600 hover:bg-brand-500/10 dark:text-brand-300'
                                            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800/60 dark:hover:text-white'
                                    }`}
                                >
                                    <item.icon className="h-3.5 w-3.5" />
                                    {item.label}
                                    {item.active && (
                                        <span className="absolute -bottom-[13px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-iris-500" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        {user ? (
                            <UserMenu user={user} isAdmin={isAdmin} />
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-iris-500 px-4 py-1.5 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-lg hover:-translate-y-px"
                                >
                                    Commencer
                                    <Icon.ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 md:hidden dark:hover:bg-ink-800"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-label="menu"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 7h16M4 12h16M4 17h16'} />
                        </svg>
                    </button>
                </div>

                {/* Gradient underline */}
                <div className="pointer-events-none h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

                {mobileOpen && (
                    <div className="animate-fade-up border-t border-ink-200/60 bg-white/70 px-4 py-4 backdrop-blur-xl md:hidden dark:border-ink-800/60 dark:bg-ink-950/70">
                        <div className="flex flex-col gap-1">
                            {nav.map((n) => (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                                        n.active
                                            ? 'bg-ink-100 text-ink-900 dark:bg-ink-800/70 dark:text-white'
                                            : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/60'
                                    }`}
                                >
                                    <n.icon className="h-4 w-4" />
                                    {n.label}
                                </Link>
                            ))}
                        </div>
                        <div className="my-3 h-px bg-gradient-to-r from-transparent via-ink-300 to-transparent dark:via-ink-700" />
                        {user ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-brand-500/5 to-iris-500/5 px-3 py-2.5">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-iris-500 text-[11px] font-bold text-white">
                                        {user.name.slice(0, 2).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-ink-900 dark:text-white">{user.name}</div>
                                        <div className="truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</div>
                                    </div>
                                </div>
                                <Link href={route('profile.edit')} onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-ink-100 dark:hover:bg-ink-800/60">
                                    <Icon.User className="h-4 w-4 text-ink-500" />
                                    Mon profil
                                </Link>
                                <Link href={route('logout')} method="post" as="button" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-300">
                                    <Icon.LogOut className="h-4 w-4" />
                                    Déconnexion
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link href={route('login')} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800/60">
                                    Connexion
                                </Link>
                                <Link href={route('register')} onClick={() => setMobileOpen(false)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-iris-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow">
                                    Commencer
                                    <Icon.ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {header && (
                <header className="border-b border-ink-200/60 bg-white/50 backdrop-blur-sm dark:border-ink-800/60 dark:bg-ink-900/20">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main
                key={page.url}
                className={`flex-1 animate-fade-up ${full ? '' : 'mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8'}`}
            >
                {children}
            </main>

            <Toaster />

            {/* FOOTER */}
            <footer className="relative mt-24 overflow-hidden border-t border-ink-200/60 dark:border-ink-800/60">
                {/* Ambient orbs */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/5 blur-3xl" />
                    <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-iris-500/5 blur-3xl" />
                </div>
                {/* Gradient shine at top */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid gap-10 md:grid-cols-12">
                        {/* Brand block */}
                        <div className="md:col-span-5">
                            <BrandMark size="lg" settings={settings} />
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                                Entraînement adaptatif aux certifications IT. Vos erreurs reviennent en priorité, jusqu'à maîtrise complète.
                            </p>
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    </span>
                                    Tous systèmes opérationnels
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white/50 px-2.5 py-1 text-xs text-ink-500 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-400">
                                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>
                                    Français
                                </span>
                            </div>
                        </div>

                        {/* Plateforme */}
                        <div className="md:col-span-3">
                            <div className="text-xs font-semibold uppercase tracking-widest text-ink-500 dark:text-ink-400">
                                Plateforme
                            </div>
                            <ul className="mt-4 space-y-3 text-sm">
                                <li>
                                    <Link href={route('home')} className="group inline-flex items-center gap-1.5 text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                                        <span className="h-1 w-1 rounded-full bg-ink-400 transition group-hover:w-3 group-hover:bg-brand-500" />
                                        Examens
                                    </Link>
                                </li>
                                {user && (
                                    <li>
                                        <Link href={route('stats.index')} className="group inline-flex items-center gap-1.5 text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                                            <span className="h-1 w-1 rounded-full bg-ink-400 transition group-hover:w-3 group-hover:bg-brand-500" />
                                            Mes statistiques
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <a href="#comment-ca-marche" className="group inline-flex items-center gap-1.5 text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                                        <span className="h-1 w-1 rounded-full bg-ink-400 transition group-hover:w-3 group-hover:bg-brand-500" />
                                        Comment ça marche
                                    </a>
                                </li>
                                {isAdmin && (
                                    <li>
                                        <Link href={route('admin.dashboard')} className="group inline-flex items-center gap-1.5 text-brand-600 transition hover:text-brand-500 dark:text-brand-300">
                                            <span className="h-1 w-1 rounded-full bg-brand-500 transition group-hover:w-3" />
                                            Dashboard admin
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Compte */}
                        <div className="md:col-span-2">
                            <div className="text-xs font-semibold uppercase tracking-widest text-ink-500 dark:text-ink-400">
                                Compte
                            </div>
                            <ul className="mt-4 space-y-3 text-sm">
                                {user ? (
                                    <>
                                        <li>
                                            <Link href={route('profile.edit')} className="group inline-flex items-center gap-1.5 text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                                                <span className="h-1 w-1 rounded-full bg-ink-400 transition group-hover:w-3 group-hover:bg-brand-500" />
                                                Mon profil
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route('logout')} method="post" as="button" className="group inline-flex items-center gap-1.5 text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                                                <span className="h-1 w-1 rounded-full bg-ink-400 transition group-hover:w-3 group-hover:bg-brand-500" />
                                                Déconnexion
                                            </Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            <Link href={route('login')} className="group inline-flex items-center gap-1.5 text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                                                <span className="h-1 w-1 rounded-full bg-ink-400 transition group-hover:w-3 group-hover:bg-brand-500" />
                                                Connexion
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route('register')} className="group inline-flex items-center gap-1.5 text-ink-600 transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                                                <span className="h-1 w-1 rounded-full bg-ink-400 transition group-hover:w-3 group-hover:bg-brand-500" />
                                                Commencer
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* CTA card */}
                        <div className="md:col-span-2">
                            <div className="text-xs font-semibold uppercase tracking-widest text-ink-500 dark:text-ink-400">
                                Prêt à démarrer ?
                            </div>
                            <div className="mt-4 rounded-2xl border border-ink-200 bg-gradient-to-br from-brand-500/5 to-iris-500/5 p-4 dark:border-ink-800">
                                <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                                    Lance ton premier examen blanc en moins de 30 secondes.
                                </p>
                                <Link
                                    href={user ? route('stats.index') : route('register')}
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-300"
                                >
                                    {user ? 'Voir mes stats' : 'Commencer'}
                                    <Icon.ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-200/60 pt-6 text-xs text-ink-500 dark:border-ink-800/60 dark:text-ink-400 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <span>© {year} {settings?.brand_name || 'CertifLoop'}.</span>
                            <span>Tous droits réservés.</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1.5">
                                Fait avec
                                <Icon.Heart className="h-3 w-3 text-rose-500" />
                                pour les futurs certifiés
                            </span>
                            <span className="hidden h-3 w-px bg-ink-300 dark:bg-ink-700 sm:inline-block" />
                            <span className="hidden font-mono text-[11px] text-ink-400 sm:inline-block dark:text-ink-500">
                                v1.0
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}