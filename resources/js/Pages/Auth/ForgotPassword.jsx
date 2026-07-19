import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Mot de passe oublié ?"
            subtitle="Renseigne ton email, on t'envoie un lien de réinitialisation."
        >
            <Head title="Mot de passe oublié" />

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
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        className="field"
                        placeholder="toi@exemple.com"
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email}</p>}
                </div>

                <button type="submit" disabled={processing} className="btn-primary w-full !py-3">
                    {processing ? 'Envoi…' : 'Envoyer le lien'}
                </button>

                <p className="text-center text-sm text-ink-500 dark:text-ink-400">
                    <Link href={route('login')} className="inline-flex items-center gap-1.5 font-semibold text-brand-500 hover:text-brand-400">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
                        Retour à la connexion
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
