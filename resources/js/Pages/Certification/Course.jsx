import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import BlockRenderer from '@/Components/BlockRenderer';
import { useT, useLocale } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function extractToc(blocks) {
    if (!Array.isArray(blocks)) return [];
    return blocks
        .filter((b) => b?.type === 'heading' && (b.level === 1 || b.level === 2))
        .map((b, i) => ({
            id: b.id || `sec-${i}`,
            text: b.text,
            level: b.level,
        }));
}

function assignHeadingIds(blocks) {
    if (!Array.isArray(blocks)) return blocks;
    let counter = 0;
    return blocks.map((b) => {
        if (b?.type === 'heading' && (b.level === 1 || b.level === 2)) {
            return { ...b, id: b.id || `sec-${counter++}` };
        }
        return b;
    });
}

export default function Course({ certification }) {
    const t = useT();
    const locale = useLocale();
    const dateTag = locale === 'fr' ? 'fr-FR' : 'en-US';
    const blocks = certification.course_blocks;
    const withIds = useMemo(() => assignHeadingIds(blocks), [blocks]);
    const toc = useMemo(() => extractToc(withIds), [withIds]);
    const [activeId, setActiveId] = useState(toc[0]?.id ?? null);

    useEffect(() => {
        if (!toc.length) return;
        const els = toc.map((tocItem) => document.getElementById(tocItem.id)).filter(Boolean);
        const obs = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [toc]);

    const hasCourse = Array.isArray(blocks) && blocks.length > 0;
    const updatedAt = certification.course_updated_at
        ? new Date(certification.course_updated_at).toLocaleDateString(dateTag, { day: '2-digit', month: 'long', year: 'numeric' })
        : null;

    if (!hasCourse) {
        return (
            <AppLayout ambient={false}>
                <Head title={t('course.page_title', { title: certification.title })} />
                <div className="mx-auto max-w-3xl">
                    <Link
                        href={route('certifications.show', certification.slug)}
                        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white"
                    >
                        <Icon.ArrowLeft className="h-3.5 w-3.5" />
                        {certification.title}
                    </Link>
                    <div className="border-y border-ink-200 py-24 text-center dark:border-ink-800">
                        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                            {t('course.empty_kicker')}
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
                            {t('course.empty_title_pre', { title: certification.title })}<br />
                            <span className="text-ink-400">{t('course.empty_title_post')}</span>
                        </h1>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link href={route('certifications.flashcards', certification.slug)} className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 dark:hover:text-white">
                                {t('course.empty_flashcards')}
                            </Link>
                            <Link href={route('certifications.exam', certification.slug)} className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 dark:hover:text-white">
                                {t('course.empty_exam')}
                            </Link>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout ambient={false} full>
            <Head title={t('course.page_title', { title: certification.title })} />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    href={route('certifications.show', certification.slug)}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white"
                >
                    <Icon.ArrowLeft className="h-3.5 w-3.5" />
                    {certification.title}
                </Link>

                <div className="mt-6 border-b border-ink-200 pb-10 dark:border-ink-800">
                    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        <span className="h-px w-6 bg-ink-400 dark:bg-ink-600" />
                        {t('course.kicker')}
                        {updatedAt && (
                            <>
                                <span className="text-ink-300">·</span>
                                {t('course.updated_on', { date: updatedAt })}
                            </>
                        )}
                    </div>
                    <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-ink-900 dark:text-white sm:text-6xl">
                        {certification.title}
                    </h1>
                    {certification.description && (
                        <p className="mt-5 max-w-2xl text-base text-ink-600 dark:text-ink-300 sm:text-lg">
                            {certification.description}
                        </p>
                    )}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href={route('certifications.flashcards', certification.slug)} className="inline-flex items-center gap-1.5 border-b border-ink-900 pb-0.5 text-sm text-ink-900 hover:gap-2 dark:border-white dark:text-white">
                            {t('course.cta_flashcards')}
                            <Icon.ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link href={route('certifications.exam', certification.slug)} className="inline-flex items-center gap-1.5 border-b border-ink-900 pb-0.5 text-sm text-ink-900 hover:gap-2 dark:border-white dark:text-white">
                            {t('course.cta_exam')}
                            <Icon.ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>

                <div className="mt-12 grid gap-10 lg:grid-cols-12">
                    {toc.length > 0 && (
                        <aside className="lg:col-span-3">
                            <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
                                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                    {t('course.toc_label')}
                                </div>
                                <ul className="mt-4 space-y-1.5 text-sm">
                                    {toc.map((tocItem) => {
                                        const active = tocItem.id === activeId;
                                        return (
                                            <li key={tocItem.id} className={tocItem.level === 2 ? 'ml-3' : ''}>
                                                <a
                                                    href={`#${tocItem.id}`}
                                                    className={`block border-l-2 py-1 pl-3 transition ${
                                                        active
                                                            ? 'border-ink-900 font-semibold text-ink-900 dark:border-white dark:text-white'
                                                            : 'border-ink-200 text-ink-500 hover:text-ink-900 dark:border-ink-800 dark:hover:text-white'
                                                    }`}
                                                >
                                                    {tocItem.text}
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </aside>
                    )}

                    <article className={toc.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}>
                        <div className="max-w-3xl">
                            <BlockRenderer blocks={withIds} />
                        </div>
                    </article>
                </div>
            </div>
        </AppLayout>
    );
}
