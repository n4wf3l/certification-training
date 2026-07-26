import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { useT } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';

// Section header + body wrapper. Kept local because this page is the only
// consumer of that particular typography stack.
function Section({ title, children }) {
    return (
        <section className="mt-12 first:mt-0">
            <h2 className="mb-4 text-xl font-bold tracking-tight text-ink-900 dark:text-white">
                {title}
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                {children}
            </div>
        </section>
    );
}

export default function Legal({ contact_email = 'contact@example.com' }) {
    const t = useT();
    return (
        <AppLayout ambient={false}>
            <Head title={t('legal.page_title')} />

            <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
                <div className="mb-10">
                    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        <Link href={route('home')} className="hover:text-ink-900 dark:hover:text-white">
                            {t('legal.breadcrumb_home')}
                        </Link>
                        <span className="text-ink-400">/</span>
                        <span className="text-ink-900 dark:text-white">{t('legal.breadcrumb_current')}</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
                        {t('legal.title')}
                    </h1>
                    <p className="mt-4 text-base text-ink-500 dark:text-ink-400">
                        {t('legal.subtitle')}
                    </p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-400">
                        {t('legal.last_updated', { date: '2026-07-26' })}
                    </p>
                </div>

                {/* Promesse gratuite : mise en carte visible pour renforcer la valeur
                    contractuelle. Un utilisateur qui vient verifier la promesse doit
                    la trouver immediatement, pas noyee au milieu du texte. */}
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-brand-500/5 p-6">
                    <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                            <Icon.Shield className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                                {t('legal.promise_headline')}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-ink-800 dark:text-ink-200">
                                {t('legal.promise_body')}
                            </p>
                            <p className="mt-3 text-xs text-ink-600 dark:text-ink-300">
                                {t('legal.promise_after')}
                            </p>
                        </div>
                    </div>
                </div>

                <Section title={t('legal.who_title')}>
                    <p>{t('legal.who_body')}</p>
                </Section>

                <Section title={t('legal.data_title')}>
                    <p>{t('legal.data_intro')}</p>
                    <ul className="ml-4 list-disc space-y-1.5">
                        <li>{t('legal.data_item_1')}</li>
                        <li>{t('legal.data_item_2')}</li>
                        <li>{t('legal.data_item_3')}</li>
                        <li>{t('legal.data_item_4')}</li>
                    </ul>
                    <p>{t('legal.data_never')}</p>
                </Section>

                <Section title={t('legal.rights_title')}>
                    <p>{t('legal.rights_intro')}</p>
                    <ul className="ml-4 list-disc space-y-1.5">
                        <li>{t('legal.rights_item_access')}</li>
                        <li>{t('legal.rights_item_rectification')}</li>
                        <li>{t('legal.rights_item_delete')}</li>
                        <li>{t('legal.rights_item_portability')}</li>
                        <li>{t('legal.rights_item_opposition')}</li>
                    </ul>
                    <p>{t('legal.rights_how')}</p>
                </Section>

                <Section title={t('legal.cookies_title')}>
                    <p>{t('legal.cookies_body')}</p>
                </Section>

                <Section title={t('legal.trackers_title')}>
                    <p>{t('legal.trackers_body')}</p>
                </Section>

                <Section title={t('legal.contact_title')}>
                    <p>
                        {t('legal.contact_body_prefix')}{' '}
                        <a href={`mailto:${contact_email}`} className="font-semibold text-brand-500 underline underline-offset-2 hover:text-brand-400">
                            {contact_email}
                        </a>
                        {t('legal.contact_body_suffix')}
                    </p>
                </Section>

                <div className="mt-12 border-t border-ink-200 pt-6 text-xs text-ink-500 dark:border-ink-800">
                    {t('legal.footer_note')}
                </div>
            </div>
        </AppLayout>
    );
}
