import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register({ redirect_to }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const loginHref = redirect_to
        ? `${route('login')}?redirect_to=${encodeURIComponent(redirect_to)}`
        : route('login');

    return (
        <GuestLayout
            title="Commence maintenant"
            subtitle="C'est gratuit, c'est immédiat, et tes progrès sont enregistrés."
        >
            <Head title="Inscription" />

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="field-label" htmlFor="name">Nom</label>
                    <input
                        id="name"
                        name="name"
                        value={data.name}
                        autoComplete="name"
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        className="field"
                        placeholder="Ton prénom ou pseudo"
                        required
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-rose-500">{errors.name}</p>}
                </div>

                <div>
                    <label className="field-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        className="field"
                        placeholder="toi@exemple.com"
                        required
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="field-label" htmlFor="password">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            className="field"
                            placeholder="8 caractères min."
                            required
                        />
                        {errors.password && <p className="mt-1.5 text-xs text-rose-500">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="field-label" htmlFor="password_confirmation">Confirmation</label>
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="field"
                            placeholder="Répète-le"
                            required
                        />
                    </div>
                </div>

                <button type="submit" disabled={processing} className="btn-primary w-full !py-3 text-base">
                    {processing ? 'Un instant…' : 'Commencer gratuitement'}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <p className="text-center text-sm text-ink-500 dark:text-ink-400">
                    Déjà inscrit ?{' '}
                    <Link href={loginHref} className="font-semibold text-brand-500 hover:text-brand-400">
                        Se connecter
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
