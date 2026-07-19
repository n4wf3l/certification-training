import Toaster, { useFlashToasts } from '@/Components/Toaster';
import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icons';

function BrandLogo({ settings, size = 'md', className = '' }) {
    const dims = size === 'lg' ? 'h-10 w-10' : 'h-9 w-9';
    const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    const brandName = settings?.brand_name || 'CertifLoop';
    const logoUrl = settings?.brand_logo_path ? `/storage/${settings.brand_logo_path}` : null;
    const parts = /^([A-Z][a-z]+)([A-Z].*)$/.exec(brandName);
    const [head, tail] = parts ? [parts[1], parts[2]] : [brandName, ''];
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <span className={`relative flex ${dims} items-center justify-center overflow-hidden rounded-xl ${
                logoUrl ? 'bg-white shadow-sm' : 'bg-gradient-to-br from-brand-500 to-iris-500 shadow-glow-lg'
            }`}>
                {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                    <svg viewBox="0 0 24 24" className={`${iconSize} text-white`} fill="none">
                        <path d="M4 14 8 10l4 4 8-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
            <span className="text-lg font-bold tracking-tight">
                <span>{head}</span>
                {tail && <span className="gradient-text">{tail}</span>}
            </span>
        </span>
    );
}

const FEATURES = [
    {
        Icon: Icon.Refresh,
        title: 'Répétition espacée',
        desc: 'Tes erreurs reviennent en priorité, jusqu\'à maîtrise complète.',
    },
    {
        Icon: Icon.Bolt,
        title: 'Conditions réelles',
        desc: 'Timer, barème officiel, tirage aléatoire dans un vrai pool.',
    },
    {
        Icon: Icon.Target,
        title: 'Progrès mesurables',
        desc: 'Stats détaillées, correction complète, historique par examen.',
    },
];

export default function GuestLayout({ children, title, subtitle }) {
    useFlashToasts();
    const settings = usePage().props.settings;
    return (
        <div className="min-h-screen bg-white text-ink-900 dark:bg-ink-950 dark:text-ink-100">
            <div className="grid min-h-screen lg:grid-cols-2">
                {/* LEFT — Brand panel */}
                <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
                    {/* Background layers */}
                    <div className="absolute inset-0 bg-ink-950" />
                    <div className="absolute inset-0 bg-radial-brand opacity-90" />
                    <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                    />
                    {/* Orb */}
                    <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-gradient-to-br from-brand-500 to-iris-500 opacity-30 blur-3xl" />
                    <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />

                    <div className="relative">
                        <Link href={route('home')} className="text-white">
                            <BrandLogo settings={settings} size="lg" />
                        </Link>
                    </div>

                    <div className="relative max-w-lg">
                        <div className="badge border-white/10 bg-white/5 text-white/70">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Plateforme d'entraînement adaptatif
                        </div>
                        <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                            Prépare ta certif comme si tu <span className="gradient-text">passais l'examen</span>.
                        </h1>
                        <p className="mt-4 text-lg leading-relaxed text-ink-300">
                            ITIL, CCNA, CompTIA, AWS… Des questions ciblées, un algorithme qui insiste sur tes lacunes, un vrai résultat à la fin.
                        </p>

                        <ul className="mt-10 space-y-4">
                            {FEATURES.map((f) => (
                                <li key={f.title} className="flex items-start gap-3 text-white">
                                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-brand-300">
                                        <f.Icon className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <div className="font-semibold">{f.title}</div>
                                        <div className="text-sm text-ink-400">{f.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative text-xs text-ink-400">
                        Comptes de test : <span className="font-mono text-ink-200">admin@example.com</span> · <span className="font-mono text-ink-200">user@example.com</span> — mot de passe <span className="font-mono text-ink-200">password</span>
                    </div>
                </div>

                {/* RIGHT — Form panel */}
                <div className="flex items-center justify-center p-6 sm:p-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8 lg:hidden">
                            <Link href={route('home')}>
                                <BrandLogo settings={settings} size="md" />
                            </Link>
                        </div>

                        {(title || subtitle) && (
                            <div className="mb-8">
                                {title && (
                                    <h2 className="text-3xl font-bold text-ink-900 dark:text-white">{title}</h2>
                                )}
                                {subtitle && (
                                    <p className="mt-2 text-ink-500 dark:text-ink-400">{subtitle}</p>
                                )}
                            </div>
                        )}

                        <div className="animate-fade-up">{children}</div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}
