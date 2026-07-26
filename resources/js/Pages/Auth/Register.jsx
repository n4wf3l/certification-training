import GuestLayout from '@/Layouts/GuestLayout';
import Icon from '@/Components/Icons';
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

            {/* Promise card - answers "is it really free?" upfront to reduce mid-form dropoff.
                Placed before the fields so hesitant visitors see the commitment before typing.
                4 items = only claims verified in the codebase (see /legal for the written promise). */}
            <div className="mb-6 overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-brand-500/5">
                <div className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                        <Icon.Shield className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-ink-900 dark:text-white">
                            {t('auth.register_promise_headline')}
                        </div>
                        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-700 dark:text-ink-200">
                            <li className="flex items-start gap-2">
                                <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>{t('auth.register_promise_item_1')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>{t('auth.register_promise_item_2')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>{t('auth.register_promise_item_3')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icon.Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>{t('auth.register_promise_item_4')}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

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

                {/* RGPD Art. 13 : information au moment de la collecte. Lien vers /legal
                    avec la promesse ecrite + inventaire des donnees traitees. */}
                <p className="text-center text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                    {t('auth.register_terms_prefix')}{' '}
                    <Link href={route('legal')} className="font-semibold text-brand-500 underline underline-offset-2 hover:text-brand-400">
                        {t('auth.register_terms_link')}
                    </Link>
                    {t('auth.register_terms_suffix')}
                </p>

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
