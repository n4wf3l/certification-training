import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <div className={className}>
            <p className="mb-5 text-sm text-ink-500">
                Ton nom d'affichage et ton email de connexion.
            </p>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="field-label" htmlFor="name">Nom</label>
                    <input
                        id="name"
                        type="text"
                        className="field"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-rose-500">{errors.name}</p>}
                </div>
                <div>
                    <label className="field-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="field"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                        Ton email n'est pas vérifié.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="font-semibold underline underline-offset-2 hover:text-amber-600"
                        >
                            Renvoyer le lien de vérification
                        </Link>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-emerald-600 dark:text-emerald-300">
                                Un nouveau lien a été envoyé à ton adresse.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    {recentlySuccessful && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-300 animate-fade-in">
                            Modifications enregistrées.
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
