import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Edit({ settings }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        brand_name: settings.brand_name ?? '',
        brand_logo: null,
        remove_logo: false,
        _method: 'post',
    });

    const [preview, setPreview] = useState(null);

    const onFile = (e) => {
        const file = e.target.files?.[0] ?? null;
        setData('brand_logo', file);
        setData('remove_logo', false);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const removeCurrent = () => {
        setData('remove_logo', true);
        setData('brand_logo', null);
        setPreview(null);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), { forceFormData: true });
    };

    const currentLogo = settings.brand_logo_path;
    const shownLogo = preview || (data.remove_logo ? null : currentLogo ? `/storage/${currentLogo}` : null);

    return (
        <AppLayout>
            <Head title="Paramètres de la plateforme" />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-brand-500">Dashboard</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">Paramètres</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        Paramètres de la plateforme
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Personnalise le nom et le logo affichés dans la barre du haut et sur les pages guest.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Brand */}
                    <section className="card p-6">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-ink-900 dark:text-white">Identité de la plateforme</h2>
                            <p className="mt-0.5 text-xs text-ink-500">Nom de marque et logo qui apparaissent partout.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
                            {/* Logo preview */}
                            <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Aperçu</div>
                                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900/40">
                                    {shownLogo ? (
                                        <img src={shownLogo} alt="Logo" className="h-full w-full object-contain" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-iris-500 text-white">
                                            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 14 8 10l4 4 8-8" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                {currentLogo && !data.remove_logo && !preview && (
                                    <button
                                        type="button"
                                        onClick={removeCurrent}
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-400"
                                    >
                                        <Icon.Close className="h-3 w-3" />
                                        Retirer le logo
                                    </button>
                                )}
                                {data.remove_logo && (
                                    <p className="mt-2 text-xs text-amber-500">
                                        Le logo sera supprimé après enregistrement.
                                    </p>
                                )}
                            </div>

                            {/* Inputs */}
                            <div className="space-y-5">
                                <div>
                                    <label className="field-label" htmlFor="brand_name">Nom de la plateforme</label>
                                    <input
                                        id="brand_name"
                                        type="text"
                                        className="field"
                                        value={data.brand_name}
                                        onChange={(e) => setData('brand_name', e.target.value)}
                                        placeholder="CertifLoop"
                                        maxLength={60}
                                    />
                                    <p className="mt-1 text-xs text-ink-500">
                                        Vide = utilise "CertifLoop" par défaut. Max 60 caractères.
                                    </p>
                                    {errors.brand_name && <p className="mt-1.5 text-xs text-rose-500">{errors.brand_name}</p>}
                                </div>

                                <div>
                                    <label className="field-label" htmlFor="brand_logo">
                                        Logo (PNG / SVG / JPG carré, max 2 Mo)
                                    </label>
                                    <input
                                        id="brand_logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={onFile}
                                        className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-500/20 dark:text-ink-300 dark:file:text-brand-300"
                                    />
                                    <p className="mt-1 text-xs text-ink-500">
                                        Un PNG transparent ou un SVG donnera le meilleur rendu (le logo est affiché sur fond clair et fond sombre).
                                    </p>
                                    {progress && (
                                        <div className="mt-2 h-1 w-full rounded bg-ink-200 dark:bg-ink-800">
                                            <div
                                                className="h-1 rounded bg-gradient-to-r from-brand-500 to-iris-500 transition-all"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                    )}
                                    {errors.brand_logo && <p className="mt-1.5 text-xs text-rose-500">{errors.brand_logo}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Submit bar */}
                    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-2xl border border-ink-200/60 bg-white/90 p-3 shadow-xl backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/90">
                        <Link href={route('admin.dashboard')} className="btn-secondary">
                            Annuler
                        </Link>
                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
