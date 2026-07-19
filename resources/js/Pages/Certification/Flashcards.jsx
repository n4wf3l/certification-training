import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function Flashcards({ certification, cards: initialCards }) {
    const [deck, setDeck] = useState(() => shuffle(initialCards));
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [marks, setMarks] = useState({}); // id => 'knew' | 'review'

    const card = deck[index];
    const total = deck.length;
    const known = Object.values(marks).filter((v) => v === 'knew').length;
    const toReview = Object.values(marks).filter((v) => v === 'review').length;
    const correctAnswer = useMemo(() => card?.answers.find((a) => a.is_correct), [card]);

    const next = () => {
        setFlipped(false);
        setIndex((i) => Math.min(total - 1, i + 1));
    };
    const prev = () => {
        setFlipped(false);
        setIndex((i) => Math.max(0, i - 1));
    };
    const mark = (verdict) => {
        setMarks((m) => ({ ...m, [card.id]: verdict }));
        if (index < total - 1) next();
    };
    const reshuffle = () => {
        setDeck(shuffle(initialCards));
        setIndex(0);
        setFlipped(false);
        setMarks({});
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFlipped((f) => !f);
            }
            if (e.key === '1') mark('review');
            if (e.key === '2') mark('knew');
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [card, index, total]);

    if (!card) {
        return (
            <AppLayout>
                <Head title={`Flashcards — ${certification.title}`} />
                <div className="mx-auto max-w-2xl text-center">
                    <div className="card p-10">
                        <p className="text-ink-500">Aucune carte disponible pour cette certification.</p>
                        <Link href={route('certifications.show', certification.slug)} className="btn-secondary mt-4">
                            Retour
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={`Flashcards — ${certification.title}`} />
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={route('certifications.show', certification.slug)}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-500"
                    >
                        <Icon.ArrowLeft className="h-3.5 w-3.5" />
                        {certification.title}
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="badge-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {known} connues
                        </span>
                        <span className="badge-danger">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {toReview} à revoir
                        </span>
                    </div>
                </div>

                {/* Progress */}
                <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-ink-500">
                        <span>Carte {index + 1} / {total}</span>
                        <button onClick={reshuffle} className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-400">
                            <Icon.Shuffle className="h-3.5 w-3.5" /> Mélanger
                        </button>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                        <div
                            className="h-full bg-gradient-to-r from-brand-500 to-iris-500 transition-all"
                            style={{ width: `${((index + 1) / total) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Flashcard */}
                <div
                    className="relative min-h-[380px] cursor-pointer"
                    onClick={() => setFlipped((f) => !f)}
                    style={{ perspective: '1200px' }}
                >
                    <div
                        className="relative h-full w-full transition-transform duration-500"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            minHeight: '380px',
                        }}
                    >
                        {/* Front */}
                        <div
                            className="card absolute inset-0 flex flex-col justify-between p-8"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="badge-brand">
                                    Question <span className="font-mono ml-1">{card.position}</span>
                                </span>
                                {card.topic && <span className="badge-muted">{card.topic}</span>}
                            </div>
                            <div className="my-6 flex-1">
                                {card.scenario && (
                                    <div className="mb-4 rounded-xl border-l-4 border-brand-500 bg-brand-500/5 p-3 text-sm text-ink-600 dark:text-ink-300">
                                        {card.scenario}
                                    </div>
                                )}
                                <p className="text-2xl font-bold leading-snug text-ink-900 dark:text-white sm:text-3xl">
                                    {card.question_text}
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-ink-500">
                                <span>Clique la carte ou appuie sur Espace pour la retourner</span>
                                <span className="badge-muted">Question</span>
                            </div>
                        </div>

                        {/* Back */}
                        <div
                            className="card absolute inset-0 flex flex-col justify-between overflow-hidden p-8"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <div className="pointer-events-none absolute inset-0 bg-emerald-500/5" />
                            <div className="relative flex items-center justify-between">
                                <span className="badge-success">Réponse</span>
                                {card.topic && <span className="badge-muted">{card.topic}</span>}
                            </div>
                            <div className="relative my-6 flex-1">
                                <p className="mb-4 text-sm text-ink-500">{card.question_text}</p>
                                {correctAnswer && (
                                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                                                {correctAnswer.letter}
                                            </span>
                                            Bonne réponse
                                        </div>
                                        <p className="text-lg font-bold leading-snug text-ink-900 dark:text-white">
                                            {correctAnswer.answer_text}
                                        </p>
                                    </div>
                                )}
                                <details className="mt-4 rounded-xl border border-ink-200 bg-white/50 p-3 text-sm dark:border-ink-800 dark:bg-ink-900/40">
                                    <summary className="cursor-pointer text-xs font-medium text-ink-500 hover:text-brand-500">
                                        Voir toutes les options
                                    </summary>
                                    <ul className="mt-3 space-y-2">
                                        {card.answers.map((a) => (
                                            <li
                                                key={a.letter}
                                                className={`flex gap-2 rounded-lg p-2 ${
                                                    a.is_correct
                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                        : 'text-ink-600 dark:text-ink-400'
                                                }`}
                                            >
                                                <span className="font-mono font-bold">{a.letter}.</span>
                                                <span>{a.answer_text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            </div>
                            <div className="relative text-center text-xs text-ink-500">
                                Comment as-tu réagi ?
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => mark('review')}
                        className="btn rounded-xl border border-rose-500/30 bg-rose-500/10 py-4 text-rose-600 hover:bg-rose-500/20 dark:text-rose-300"
                    >
                        <Icon.Close className="h-5 w-5" /> À revoir <span className="ml-2 text-xs text-ink-400">1</span>
                    </button>
                    <button
                        onClick={() => mark('knew')}
                        className="btn rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-4 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
                    >
                        <Icon.Check className="h-5 w-5" /> Je savais <span className="ml-2 text-xs text-ink-400">2</span>
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <button onClick={prev} disabled={index === 0} className="btn-secondary">
                        <Icon.ArrowLeft className="h-4 w-4" />
                        Précédent
                    </button>
                    <span className="text-xs text-ink-500">
                        Espace : retourner · flèches : naviguer
                    </span>
                    <button onClick={next} disabled={index === total - 1} className="btn-secondary">
                        Suivant
                        <Icon.ArrowRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Fin de session */}
                {Object.keys(marks).length === total && (
                    <div className="card p-6 text-center">
                        <h3 className="text-xl font-bold text-ink-900 dark:text-white">Session terminée</h3>
                        <p className="mt-2 text-ink-500">
                            Tu as marqué <span className="font-mono text-emerald-500">{known}</span> cartes connues et <span className="font-mono text-rose-500">{toReview}</span> à revoir.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <button onClick={reshuffle} className="btn-primary">
                                <Icon.Refresh className="h-4 w-4" /> Recommencer
                            </button>
                            <Link href={route('certifications.exam', certification.slug)} className="btn-secondary">
                                Passer à l'examen blanc
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
