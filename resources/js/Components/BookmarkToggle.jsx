import Icon from '@/Components/Icons';
import { router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * Bouton compact "ajouter/retirer des favoris" pour une question. UI optimiste :
 * toggle immediat cote client (pour du feedback instant), puis POST au backend
 * qui reflete l'etat serveur au prochain render.
 *
 * Volontairement sans confirmation modal - c'est reversible en 1 clic.
 */
export default function BookmarkToggle({ questionId, initialBookmarked = false, t }) {
    const [bookmarked, setBookmarked] = useState(!!initialBookmarked);
    const [pending, setPending] = useState(false);

    const toggle = () => {
        setPending(true);
        // Optimistic UI : bascule tout de suite, backend confirmera.
        const next = !bookmarked;
        setBookmarked(next);
        router.post(route('bookmarks.toggle', questionId), {}, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setBookmarked(!next), // rollback si le backend refuse
            onFinish: () => setPending(false),
        });
    };

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                bookmarked
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-700 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300 dark:hover:text-amber-300'
            }`}
            aria-pressed={bookmarked}
        >
            <Icon.Sparkles className={`h-3.5 w-3.5 ${bookmarked ? 'text-amber-500' : ''}`} />
            {bookmarked
                ? t('bookmarks.toggle_remove')
                : t('bookmarks.toggle_add')}
        </button>
    );
}
