import Icon from '@/Components/Icons';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const LS_QUESTIONS = 'hero_quiz.questions';
const LS_PICKS = 'hero_quiz.picks';
const LS_INDEX = 'hero_quiz.index';

function readLS(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}
function writeLS(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

/**
 * Teaser Q/R interactif affiché aux visiteurs guest dans le hero.
 * Après 3 questions, propose de créer un compte pour continuer.
 * L'état (questions choisies, réponses, index) est persisté en localStorage :
 * refresh la page ne redonne pas de nouvelles questions et ne remet pas à zéro
 * les réponses — il faut vraiment se créer un compte pour continuer.
 */
export default function HeroQuizTeaser({ questions: initialQuestions }) {
    // Lock les questions en localStorage : refresh = mêmes questions
    const [questions] = useState(() => {
        const cached = readLS(LS_QUESTIONS, null);
        if (Array.isArray(cached) && cached.length > 0) return cached;
        writeLS(LS_QUESTIONS, initialQuestions);
        return initialQuestions;
    });
    const total = questions.length;
    const [index, setIndex] = useState(() => Math.min(readLS(LS_INDEX, 0), total - 1));
    const [picks, setPicks] = useState(() => readLS(LS_PICKS, {})); // questionId -> letter

    useEffect(() => { writeLS(LS_PICKS, picks); }, [picks]);
    useEffect(() => { writeLS(LS_INDEX, index); }, [index]);

    const question = questions[index];
    const currentPick = question ? picks[question.id] : null;
    const answered = !!currentPick;
    const correctAnswer = useMemo(
        () => question?.answers.find((a) => a.is_correct),
        [question]
    );

    const rightCount = questions.reduce((sum, q) => {
        const chosen = picks[q.id];
        return sum + (chosen && q.answers.find((a) => a.letter === chosen)?.is_correct ? 1 : 0);
    }, 0);
    const answeredCount = Object.keys(picks).length;
    const done = answeredCount >= total;

    const pick = (letter) => {
        if (answered) return;
        setPicks((p) => ({ ...p, [question.id]: letter }));
    };

    const next = () => setIndex((i) => Math.min(total - 1, i + 1));
    const prev = () => setIndex((i) => Math.max(0, i - 1));

    if (!question) return null;

    return (
        <div className="flex flex-col gap-4">
            {/* Top CTA */}
            <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-iris-500/5 to-transparent p-4">
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                    </span>
                    Essai gratuit — {total} questions
                </div>
                <p className="text-sm text-ink-700 dark:text-ink-200">
                    Toutes les questions ci-dessous sont réelles.
                    <br />
                    <Link href={route('register')} className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-500 dark:text-brand-300">
                        Crée ton compte gratuit
                    </Link>
                    {' '}pour continuer et débloquer les examens blancs complets.
                </p>
            </div>

            {/* Card */}
            <div key={question.id} className="card animate-fade-up flex-1 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-ink-200/60 px-4 py-2.5 dark:border-ink-800/60">
                    <div className="flex items-center gap-2 min-w-0">
                        {question.certification.logo_path ? (
                            <img
                                src={`/storage/${question.certification.logo_path}`}
                                alt=""
                                className="h-6 w-6 shrink-0 object-contain"
                            />
                        ) : (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-brand-500 to-iris-500 text-[9px] font-bold text-white">
                                {question.certification.title.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span className="truncate text-xs font-semibold text-ink-700 dark:text-ink-200">
                            {question.certification.title}
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-ink-500">
                        {index + 1} / {total}
                    </span>
                </div>

                {/* Question + answers */}
                <div className="p-4">
                    {question.topic && (
                        <div className="mb-2 inline-flex rounded-full border border-ink-200/60 bg-ink-50 px-2 py-0.5 text-[10px] font-medium text-ink-500 dark:border-ink-800/60 dark:bg-ink-900/40">
                            {question.topic}
                        </div>
                    )}
                    {question.scenario && (
                        <div className="mb-3 rounded-lg border-l-2 border-brand-500 bg-brand-500/5 p-2.5 text-xs italic leading-relaxed text-ink-600 dark:text-ink-300">
                            {question.scenario}
                        </div>
                    )}
                    <p className="text-sm font-semibold leading-snug text-ink-900 dark:text-white">
                        {question.question_text}
                    </p>

                    <ul className="mt-3 space-y-1.5">
                        {question.answers.map((a) => {
                            const isChosen = currentPick === a.letter;
                            const isRight = a.is_correct;
                            let style = 'border-ink-200 bg-white hover:border-brand-500/40 hover:bg-brand-500/5 text-ink-800 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-200 dark:hover:bg-ink-800/60';
                            if (answered) {
                                if (isRight) {
                                    style = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
                                } else if (isChosen) {
                                    style = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-200';
                                } else {
                                    style = 'border-ink-200 bg-white text-ink-400 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-500';
                                }
                            }
                            return (
                                <li key={a.letter}>
                                    <button
                                        type="button"
                                        onClick={() => pick(a.letter)}
                                        disabled={answered}
                                        className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left text-sm transition ${style}`}
                                    >
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold ${
                                                answered && isRight
                                                    ? 'bg-emerald-500 text-white'
                                                    : answered && isChosen
                                                    ? 'bg-rose-500 text-white'
                                                    : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
                                            }`}
                                        >
                                            {a.letter}
                                        </span>
                                        <span className="flex-1 leading-snug">{a.text}</span>
                                        {answered && isRight && <Icon.Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
                                        {answered && isChosen && !isRight && <Icon.Close className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {answered && (
                        <div
                            className={`mt-3 rounded-lg border-l-2 p-2.5 text-xs ${
                                correctAnswer && currentPick === correctAnswer.letter
                                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200'
                                    : 'border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-200'
                            }`}
                        >
                            {correctAnswer && currentPick === correctAnswer.letter
                                ? 'Bonne réponse.'
                                : `La bonne réponse était ${correctAnswer?.letter}.`}
                        </div>
                    )}
                </div>

                {/* Footer nav */}
                <div className="flex items-center justify-between border-t border-ink-200/60 bg-ink-50/50 px-4 py-2.5 dark:border-ink-800/60 dark:bg-ink-900/30">
                    <button
                        onClick={prev}
                        disabled={index === 0}
                        className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800 disabled:opacity-30 dark:hover:text-white"
                    >
                        <Icon.ArrowLeft className="h-3 w-3" />
                        Précédent
                    </button>
                    <div className="font-mono text-[10px] text-ink-500">
                        {answeredCount > 0 && `${rightCount}/${answeredCount} bonnes`}
                    </div>
                    {index < total - 1 ? (
                        <button
                            onClick={next}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-300"
                        >
                            Suivant
                            <Icon.ArrowRight className="h-3 w-3" />
                        </button>
                    ) : (
                        <span className="font-mono text-[10px] text-ink-500">Fin</span>
                    )}
                </div>
            </div>

            {/* End CTA (visible dès la 3e réponse) */}
            {done && (
                <Link
                    href={route('register')}
                    className="btn-primary animate-fade-up justify-center !py-3"
                >
                    <Icon.Sparkles className="h-4 w-4" />
                    Continuer gratuitement — {rightCount}/{total} sans effort
                </Link>
            )}
        </div>
    );
}
