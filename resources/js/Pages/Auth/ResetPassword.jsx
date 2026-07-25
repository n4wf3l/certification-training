import GuestLayout from '@/Layouts/GuestLayout';
import { useT } from '@/lib/i18n';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const t = useT();
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
            title={t('auth_reset.title')}
            subtitle={t('auth_reset.subtitle')}
        >
            <Head title={t('auth_reset.page_title')} />

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="field-label" htmlFor="email">{t('auth.field_email')}</label>
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
                    <label className="field-label" htmlFor="password">{t('auth.field_password')}</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoFocus
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        className="field"
                        placeholder={t('auth.field_password_new_placeholder')}
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-rose-500">{errors.password}</p>}
                </div>
                <div>
                    <label className="field-label" htmlFor="password_confirmation">{t('auth.field_password_confirm')}</label>
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
                    {processing ? t('auth_reset.submit_loading') : t('auth_reset.submit')}
                </button>
            </form>
        </GuestLayout>
    );
}
