import GuestLayout from '@/Layouts/GuestLayout';
import { useT } from '@/lib/i18n';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const t = useT();
    const email = usePage().props.auth?.user?.email;
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout title={t('auth.verify_title')} subtitle={t('auth.verify_subtitle')}>
            <Head title={t('auth.verify_page_title')} />

            <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {t('auth.verify_body', { email: email || '' })}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                {t('auth.verify_spam_hint')}
            </p>

            {status === 'verification-link-sent' && (
                <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status">
                    {t('auth.verify_link_sent')}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <button type="submit" disabled={processing} className="btn-primary">
                    {t('auth.verify_resend')}
                </button>
                <div className="flex items-center gap-4 text-sm">
                    <Link href={route('profile.edit')} className="text-ink-600 underline underline-offset-2 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                        {t('auth.verify_change_email')}
                    </Link>
                    <Link href={route('logout')} method="post" as="button" className="text-ink-600 underline underline-offset-2 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                        {t('auth.verify_logout')}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
