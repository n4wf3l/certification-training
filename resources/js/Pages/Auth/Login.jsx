import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const DEMO_ACCOUNTS = [
    { role: 'Admin', email: 'admin@example.com', password: 'password', badge: 'brand' },
    { role: 'Utilisateur', email: 'user@example.com', password: 'password', badge: 'muted' },
];

export default function Login({ status, canResetPassword, redirect_to }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const fill = (account) => {
        setData({ ...data, email: account.email, password: account.password });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const registerHref = redirect_to
        ? `${route('register')}?redirect_to=${encodeURIComponent(redirect_to)}`
        : route('register');

    return (
        <GuestLayout
            title="Content de te revoir"
            subtitle="Reprends là où tu t'étais arrêté et continue à progresser."
        >
            <Head title="Connexion" />

            {status && (
                <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="field-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        className="field"
                        placeholder="toi@exemple.com"
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email}</p>}
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="field-label !mb-0" htmlFor="password">Mot de passe</label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-medium text-brand-500 hover:text-brand-400"
                            >
                                Oublié ?
                            </Link>
                        )}
                    </div>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        className="field"
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-rose-500">{errors.password}</p>}
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="h-4 w-4 rounded border-ink-300 bg-white text-brand-500 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-900"
                    />
                    Se souvenir de moi
                </label>

                <button type="submit" disabled={processing} className="btn-primary w-full !py-3 text-base">
                    {processing ? 'Connexion…' : 'Se connecter'}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-ink-200 dark:border-ink-800" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-xs uppercase tracking-wider text-ink-400 dark:bg-ink-950">
                            ou
                        </span>
                    </div>
                </div>

                <Link href={registerHref} className="btn-secondary w-full !py-3">
                    Commencer
                </Link>
            </form>

            <p className="mt-6 text-center text-xs text-ink-500 dark:text-ink-500">
                En te connectant tu acceptes que tes réponses soient utilisées pour améliorer ton parcours.
            </p>

            {/* Dev-only : comptes de test */}
            <div className="mt-8 rounded-2xl border border-dashed border-brand-500/30 bg-brand-500/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                    <span className="badge-brand">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        Environnement de dev
                    </span>
                    <span className="text-xs text-ink-500">Clique pour remplir le formulaire</span>
                </div>
                <div className="space-y-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                        <button
                            key={acc.email}
                            type="button"
                            onClick={() => fill(acc)}
                            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white/60 p-3 text-left transition hover:border-brand-500 hover:bg-white dark:border-ink-800 dark:bg-ink-900/40 dark:hover:border-brand-500 dark:hover:bg-ink-900"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`badge-${acc.badge === 'brand' ? 'brand' : 'muted'}`}>
                                        {acc.role}
                                    </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                    <span className="font-mono text-ink-700 dark:text-ink-200">
                                        {acc.email}
                                    </span>
                                    <span className="text-ink-400">·</span>
                                    <span className="font-mono text-ink-500">
                                        mdp : <span className="text-ink-700 dark:text-ink-200">{acc.password}</span>
                                    </span>
                                </div>
                            </div>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition group-hover:bg-gradient-to-br group-hover:from-brand-500 group-hover:to-iris-500 group-hover:text-white dark:bg-ink-800 dark:text-ink-300">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </GuestLayout>
    );
}
