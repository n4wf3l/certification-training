import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            title="Nouveau mot de passe"
            subtitle="Choisis un mot de passe fort et unique."
        >
            <Head title="Nouveau mot de passe" />

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="field-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="field"
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email}</p>}
                </div>
                <div>
                    <label className="field-label" htmlFor="password">Mot de passe</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoFocus
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        className="field"
                        placeholder="8 caractères min."
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-rose-500">{errors.password}</p>}
                </div>
                <div>
                    <label className="field-label" htmlFor="password_confirmation">Confirmation</label>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="field"
                    />
                </div>
                <button type="submit" disabled={processing} className="btn-primary w-full !py-3">
                    {processing ? 'Réinitialisation…' : 'Réinitialiser'}
                </button>
            </form>
        </GuestLayout>
    );
}
