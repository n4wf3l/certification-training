import { useT } from '@/lib/i18n';
import { Link, usePage } from '@inertiajs/react';

function Flame({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
    );
}

function Spark({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v3M12 19v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    );
}

/**
 * Petit widget affiche dans le header : streak actif + XP total.
 * Cliquable pour aller vers la page stats/profil.
 */
export default function GamificationBadge({ compact = false }) {
    const t = useT();
    const auth = usePage().props.auth;
    if (!auth?.user) return null;
    const g = auth.user.gamification;
    if (!g) return null;

    // Le streak est "vivant" si l'user a ete actif aujourd'hui ou hier
    // (sinon il est "en peril" ou brise)
    const lastActive = g.last_activity_date ? new Date(g.last_activity_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let streakStatus = 'inactive'; // pas de streak
    if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
        if (lastActive.getTime() >= today.getTime()) streakStatus = 'active';
        else if (lastActive.getTime() >= yesterday.getTime()) streakStatus = 'at_risk';
        else streakStatus = 'broken';
    }

    const showStreak = g.current_streak > 0;

    return (
        <Link
            href={route('stats.index')}
            className="group hidden items-center gap-2 rounded-full border border-ink-200/70 bg-white/60 px-2.5 py-1 text-xs shadow-sm transition hover:border-brand-500/40 hover:shadow-glow dark:border-ink-800/70 dark:bg-ink-900/50 sm:inline-flex"
            title={t('components.gamification_title', { streak: g.current_streak, xp: g.total_xp })}
        >
            {showStreak && (
                <span className={`flex items-center gap-1 font-mono font-semibold ${
                    streakStatus === 'active' ? 'text-orange-500 dark:text-orange-300'
                    : streakStatus === 'at_risk' ? 'text-amber-500 dark:text-amber-300 animate-pulse'
                    : 'text-ink-400'
                }`}>
                    <Flame className="h-3.5 w-3.5" />
                    {g.current_streak}
                </span>
            )}
            <span className="flex items-center gap-1 font-mono font-semibold text-brand-600 dark:text-brand-300">
                <Spark className="h-3.5 w-3.5" />
                {g.total_xp >= 1000 ? `${(g.total_xp / 1000).toFixed(1)}k` : g.total_xp}
            </span>
        </Link>
    );
}
