import GuestLayout from '@/Layouts/GuestLayout';
import { useT } from '@/lib/i18n';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register({ redirect_to }) {
    const t = useT();
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
            title={t('auth.register_title')}
            subtitle={t('auth.register_subtitle')}
        >
            <Head title={t('auth.register_page_title')} />

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="field-label" htmlFor="name">{t('auth.field_name')}</label>
                    <input
                        id="name"
                        name="name"
                        value={data.name}
                        autoComplete="name"
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        className="field"
                        placeholder={t('auth.field_name_placeholder')}
                        required
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-rose-500">{errors.name}</p>}
                </div>

                <div>
                    <label className="field-label" htmlFor="email">{t('auth.field_email')}</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        className="field"
                        placeholder={t('auth.field_email_placeholder')}
                        required
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="field-label" htmlFor="password">{t('auth.field_password')}</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            className="field"
                            placeholder={t('auth.field_password_new_placeholder')}
                            required
                        />
                        {errors.password && <p className="mt-1.5 text-xs text-rose-500">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="field-label" htmlFor="password_confirmation">{t('auth.field_password_confirm')}</label>
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="field"
                            placeholder={t('auth.field_password_confirm_placeholder')}
                            required
                        />
                    </div>
                </div>

                <button type="submit" disabled={processing} className="btn-primary w-full !py-3 text-base">
                    {processing ? t('auth.submit_register_loading') : t('auth.submit_register')}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <p className="text-center text-xs text-ink-500 dark:text-ink-400">
                    {t('auth.register_perks')}
                </p>

                <p className="text-center text-sm text-ink-500 dark:text-ink-400">
                    {t('auth.already_registered')}{' '}
                    <Link href={loginHref} className="font-semibold text-brand-500 hover:text-brand-400">
                        {t('auth.already_registered_action')}
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
