import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Form({ certification }) {
    const editing = !!certification;

    const { data, setData, post, processing, errors, progress } = useForm({
        title: certification?.title ?? '',
        slug: certification?.slug ?? '',
        description: certification?.description ?? '',
        long_description: certification?.long_description ?? '',
        importance: certification?.importance ?? '',
        target_roles_text: certification?.target_roles_text ?? '',
        questions_updated_at: certification?.questions_updated_at
            ? new Date(certification.questions_updated_at).toISOString().slice(0, 16)
            : '',
        duration_minutes: certification?.duration_minutes ?? 60,
        passing_score: certification?.passing_score ?? 26,
        total_questions: certification?.total_questions ?? 40,
        validity_months: certification?.validity_months ?? '',
        validity_note: certification?.validity_note ?? '',
        version_retires_at: certification?.version_retires_at
            ? String(certification.version_retires_at).slice(0, 10)
            : '',
        is_active: certification?.is_active ?? true,
        logo: null,
        remove_course: false,
        _method: editing ? 'put' : 'post',
    });

    const submit = (e) => {
        e.preventDefault();
        const url = editing
            ? route('admin.certifications.update', certification.id)
            : route('admin.certifications.store');
        post(url, { forceFormData: true });
    };

    return (
        <AppLayout>
            <Head title={editing ? `Éditer ${certification.title}` : 'Nouvelle certification'} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">Dashboard</Link>
                        <span>/</span>
                        <Link href={route('admin.certifications.index')} className="hover:text-brand-500">Certifications</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">
                            {editing ? certification.title : 'Nouvelle'}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                            {editing ? `Éditer ${certification.title}` : 'Nouvelle certification'}
                        </h1>
                        <Link
                            href={route('admin.certifications.index')}
                            className="btn-ghost !py-2"
                        >
                            <Icon.ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Identity */}
                    <section className="card p-6">
                        <SectionHeader
                            title="Identité"
                            description="Titre visible sur la home, slug utilisé dans l'URL, description courte affichée sur la carte."
                        />
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label="Titre" required error={errors.title} className="sm:col-span-2">
                                <input
                                    className="field"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Ex. ITIL Foundation v5"
                                />
                            </Field>
                            <Field label="Slug" hint="auto si vide" error={errors.slug}>
                                <input
                                    className="field font-mono"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="itil-foundation-v5"
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Description courte (2 lignes max)" error={errors.description}>
                                <textarea
                                    rows={2}
                                    className="field resize-y"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Le référentiel mondial de la gestion des services IT."
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Rich content */}
                    <section className="card p-6">
                        <SectionHeader
                            title="Contenu marketing"
                            description="Ce qui aide le guest à comprendre pourquoi cette certif est intéressante et pour quels postes."
                        />
                        <div className="mt-4 space-y-4">
                            <Field label="Description longue (à quoi ça sert, ce qui est couvert)" error={errors.long_description}>
                                <textarea
                                    rows={5}
                                    className="field resize-y"
                                    value={data.long_description}
                                    onChange={(e) => setData('long_description', e.target.value)}
                                />
                            </Field>
                            <Field label="Importance (impact carrière)" error={errors.importance}>
                                <textarea
                                    rows={4}
                                    className="field resize-y"
                                    value={data.importance}
                                    onChange={(e) => setData('importance', e.target.value)}
                                />
                            </Field>
                            <Field label="Postes ciblés" hint="un par ligne" error={errors.target_roles_text}>
                                <textarea
                                    rows={5}
                                    className="field font-mono resize-y"
                                    placeholder={"IT Service Manager\nChange Manager\nProblem Manager"}
                                    value={data.target_roles_text}
                                    onChange={(e) => setData('target_roles_text', e.target.value)}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Exam config */}
                    <section className="card p-6">
                        <SectionHeader
                            title="Paramètres d'examen"
                            description="Format officiel de l'épreuve — durée, nombre de questions, score minimum pour valider."
                        />
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field label="Durée (minutes)" required error={errors.duration_minutes}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field font-mono"
                                    value={data.duration_minutes}
                                    onChange={(e) => setData('duration_minutes', +e.target.value)}
                                />
                            </Field>
                            <Field label="Score requis" required error={errors.passing_score}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field font-mono"
                                    value={data.passing_score}
                                    onChange={(e) => setData('passing_score', +e.target.value)}
                                />
                            </Field>
                            <Field label="Questions cible" required error={errors.total_questions}>
                                <input
                                    type="number"
                                    min="1"
                                    className="field font-mono"
                                    value={data.total_questions}
                                    onChange={(e) => setData('total_questions', +e.target.value)}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Freshness + validity */}
                    <section className="card p-6">
                        <SectionHeader
                            title="Fraîcheur & validité"
                            description="Quand les questions ont été vérifiées, combien de temps la certif reste valable pour un candidat, et quand la version d'examen est retirée par l'éditeur."
                        />
                        <div className="mt-4 space-y-4">
                            <Field label="Date de dernière vérification des questions" error={errors.questions_updated_at}>
                                <input
                                    type="datetime-local"
                                    className="field"
                                    value={data.questions_updated_at}
                                    onChange={(e) => setData('questions_updated_at', e.target.value)}
                                />
                            </Field>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Field label="Validité (mois)" hint="vide = sans expiration" error={errors.validity_months}>
                                    <input
                                        type="number"
                                        min="1"
                                        className="field font-mono"
                                        placeholder="36"
                                        value={data.validity_months}
                                        onChange={(e) => setData('validity_months', e.target.value === '' ? '' : +e.target.value)}
                                    />
                                </Field>
                                <Field label="Note de validité (renouvellement)" error={errors.validity_note} className="sm:col-span-2">
                                    <textarea
                                        rows={3}
                                        className="field resize-y"
                                        placeholder="Renouvelable via… / Pas d'expiration mais…"
                                        value={data.validity_note}
                                        onChange={(e) => setData('validity_note', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <Field label="Date de retrait de la version d'examen" hint="vide si non annoncée" error={errors.version_retires_at}>
                                <input
                                    type="date"
                                    className="field"
                                    value={data.version_retires_at}
                                    onChange={(e) => setData('version_retires_at', e.target.value)}
                                />
                                <p className="mt-1 text-xs text-ink-500">
                                    Différent de la validité individuelle : c'est la date à laquelle l'éditeur retire l'examen du catalogue (ex. ITIL 4 : 31 déc 2027).
                                </p>
                            </Field>
                        </div>
                    </section>

                    {/* Course status */}
                    {editing && (
                        <section className="card p-6">
                            <SectionHeader
                                title="Cours importé"
                                description="Contenu pédagogique lié à cette certification (importé via ChatGPT depuis /admin/certifications/course-import)."
                            />
                            <div className="mt-4">
                                {certification.course_blocks_count > 0 ? (
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                                <Icon.Book className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <div className="font-semibold text-ink-900 dark:text-white">
                                                    {certification.course_blocks_count} blocs de contenu publiés
                                                </div>
                                                {certification.course_updated_at && (
                                                    <div className="text-xs text-ink-500">
                                                        Mis à jour le {new Date(certification.course_updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <label
                                            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                                data.remove_course
                                                    ? 'border-rose-500 bg-rose-500 text-white'
                                                    : 'border-rose-500/40 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={!!data.remove_course}
                                                onChange={(e) => setData('remove_course', e.target.checked)}
                                            />
                                            <Icon.Close className="h-3.5 w-3.5" />
                                            {data.remove_course ? 'Sera vidé à l\'enregistrement' : 'Vider le cours'}
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900/40">
                                        <div className="flex items-center gap-3 text-sm text-ink-500">
                                            <Icon.Book className="h-4 w-4" />
                                            Aucun cours importé pour cette certification.
                                        </div>
                                        <Link
                                            href={`${route('admin.certifications.course-import')}?certification_id=${certification.id}`}
                                            className="btn-secondary !py-1.5 !text-xs"
                                        >
                                            <Icon.Bolt className="h-3.5 w-3.5" />
                                            Importer un cours
                                        </Link>
                                    </div>
                                )}
                                {data.remove_course && certification.course_blocks_count > 0 && (
                                    <p className="mt-2 text-xs text-rose-500">
                                        Attention : cette action est irréversible. Le contenu sera perdu, tu devras le réimporter.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Visuals + visibility */}
                    <section className="card p-6">
                        <SectionHeader
                            title="Logo & visibilité"
                            description="Le logo apparaît sur la carte home et sur la page détail. La visibilité contrôle l'apparition dans la liste guest."
                        />
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
                            {editing && certification.logo_path ? (
                                <img
                                    src={`/storage/${certification.logo_path}`}
                                    alt=""
                                    className="h-24 w-24 rounded-2xl border border-ink-200 object-contain p-2 dark:border-ink-800"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50 text-ink-400 dark:border-ink-700 dark:bg-ink-900/40">
                                    <Icon.Book className="h-8 w-8" />
                                </div>
                            )}
                            <div>
                                <Field label="Logo (PNG/JPG/SVG, max 2 Mo)" error={errors.logo}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                        className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 file:hover:bg-brand-500/20 dark:text-ink-300 dark:file:text-brand-300"
                                    />
                                    {progress && (
                                        <div className="mt-2 h-1 w-full rounded bg-ink-200 dark:bg-ink-800">
                                            <div
                                                className="h-1 rounded bg-gradient-to-r from-brand-500 to-iris-500"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                    )}
                                </Field>
                            </div>
                        </div>
                        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                            <input
                                type="checkbox"
                                checked={!!data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-ink-300 bg-white text-brand-500 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-900"
                            />
                            <div>
                                <div className="text-sm font-semibold text-ink-900 dark:text-white">
                                    Visible sur la page d'accueil
                                </div>
                                <div className="text-xs text-ink-500">
                                    Décoche pour masquer temporairement cette certif aux guests (utile pour la préparer).
                                </div>
                            </div>
                        </label>
                    </section>

                    {/* Submit bar */}
                    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-2xl border border-ink-200/60 bg-white/90 p-3 shadow-xl backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/90">
                        <Link href={route('admin.certifications.index')} className="btn-secondary">
                            Annuler
                        </Link>
                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer la certification'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function SectionHeader({ title, description }) {
    return (
        <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
        </div>
    );
}

function Field({ label, error, hint, required, children, className = '' }) {
    return (
        <div className={className}>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-500">
                <span>
                    {label}
                    {required && <span className="ml-0.5 text-rose-500">*</span>}
                </span>
                {hint && <span className="normal-case font-normal text-[10px] text-ink-400">{hint}</span>}
            </label>
            {children}
            {error && <div className="mt-1 text-xs text-rose-500">{error}</div>}
        </div>
    );
}
