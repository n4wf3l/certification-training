import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import CertLogo from '@/Components/CertLogo';
import { useT } from '@/lib/i18n';
import { Head, Link, router } from '@inertiajs/react';

/**
 * Page /bookmarks : liste des questions marquees en favoris par le user, avec
 * option de retirer et lien vers la certif d'origine. Pas d'enonce complet ici,
 * juste l'accroche (topic + question_text) : le detail est disponible dans
 * l'app de la certif.
 */
export default function Index({ bookmarks = [] }) {
    const t = useT();

    const remove = (bookmarkId) => {
        router.delete(route('bookmarks.destroy', bookmarkId), { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title={t('bookmarks.page_title')} />
            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        <span className="h-px w-6 bg-ink-400 dark:bg-ink-600" />
                        {t('bookmarks.kicker')}
                    </div>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        {t('bookmarks.title')}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-ink-500 dark:text-ink-400">
                        {t('bookmarks.subtitle')}
                    </p>
                </div>

                {bookmarks.length === 0 ? (
                    <div className="card p-8 text-center">
                        <Icon.Sparkles className="mx-auto mb-3 h-8 w-8 text-ink-400" />
                        <h2 className="text-lg font-semibold text-ink-900 dark:text-white">
                            {t('bookmarks.empty_title')}
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
                            {t('bookmarks.empty_body')}
                        </p>
                    </div>
                ) : (
                    <div className="card divide-y divide-ink-200/60 dark:divide-ink-800/60">
                        {bookmarks.map((b) => (
                            <div key={b.id} className="flex items-start gap-4 p-5">
                                <CertLogo certification={b.certification} size="md" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-ink-500">
                                        {b.certification && (
                                            <Link
                                                href={route('certifications.show', b.certification.slug)}
                                                className="hover:text-ink-900 dark:hover:text-white"
                                            >
                                                {b.certification.title}
                                            </Link>
                                        )}
                                        {b.question?.topic && (
                                            <>
                                                <span className="text-ink-300">·</span>
                                                <span className="normal-case tracking-normal text-ink-400">
                                                    {b.question.topic}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <p className="mt-1.5 line-clamp-2 text-sm font-medium text-ink-800 dark:text-ink-100">
                                        {b.question?.question_text || t('bookmarks.deleted_question')}
                                    </p>
                                    {b.note && (
                                        <p className="mt-2 rounded-lg border-l-2 border-amber-500 bg-amber-500/5 px-2 py-1 text-xs italic text-ink-700 dark:text-ink-200">
                                            {b.note}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => remove(b.id)}
                                    className="shrink-0 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-500 hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-rose-600 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-400"
                                >
                                    <Icon.Close className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
