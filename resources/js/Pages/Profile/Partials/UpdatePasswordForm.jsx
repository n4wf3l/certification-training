import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <div className={className}>
            <p className="mb-5 text-sm text-ink-500">
                Utilise un mot de passe long et unique.
            </p>
            <form onSubmit={updatePassword} className="space-y-5">
                <div>
                    <label className="field-label" htmlFor="current_password">Mot de passe actuel</label>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        className="field"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />
                    {errors.current_password && <p className="mt-1.5 text-xs text-rose-500">{errors.current_password}</p>}
                </div>
                <div>
                    <label className="field-label" htmlFor="password">Nouveau mot de passe</label>
                    <input
                        id="password"
                        ref={passwordInput}
                        type="password"
                        className="field"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-rose-500">{errors.password}</p>}
                </div>
                <div>
                    <label className="field-label" htmlFor="password_confirmation">Confirmation</label>
                    <input
                        id="password_confirmation"
                        type="password"
                        className="field"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && <p className="mt-1.5 text-xs text-rose-500">{errors.password_confirmation}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    {recentlySuccessful && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-300 animate-fade-in">
                            Mot de passe mis à jour.
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
