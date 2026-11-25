import { useEffect, useRef, useState } from 'react';

const MOBILE_QUERY = '(max-width: 639px)';

/**
 * Courte video muette en boucle (facon GIF) qui montre une etape du parcours.
 * - Deux enregistrements : ordinateur (16:10) et mobile (vertical), choisis selon
 *   la largeur d'ecran pour que l'interface reste lisible sur telephone.
 * - Ne charge et ne lit la video que lorsqu'elle est visible.
 * - prefers-reduced-motion : pas de lecture automatique, image fixe + controles.
 * Les videos sont enregistrees depuis l'app en local (public/media/how-it-works).
 */
export default function StepDemo({ name, label }) {
    const ref = useRef(null);
    const [reduced, setReduced] = useState(false);
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
        setReduced(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
        const media = window.matchMedia?.(MOBILE_QUERY);
        if (!media) return undefined;
        const update = () => setMobile(media.matches);
        update();
        media.addEventListener?.('change', update);
        return () => media.removeEventListener?.('change', update);
    }, []);

    useEffect(() => {
        const video = ref.current;
        if (!video || reduced || !('IntersectionObserver' in window)) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            },
            { threshold: 0.35 },
        );
        observer.observe(video);
        return () => observer.disconnect();
    }, [reduced, mobile]);

    const base = `/media/how-it-works/${name}${mobile ? '-m' : ''}`;

    return (
        <div className={`mt-5 overflow-hidden rounded-xl border border-ink-200 bg-ink-950 shadow-sm dark:border-ink-800 ${mobile ? 'mx-auto max-w-[220px]' : ''}`}>
            <video
                key={base}
                ref={ref}
                src={`${base}.mp4`}
                poster={`${base}.jpg`}
                muted
                loop
                playsInline
                preload="none"
                controls={reduced}
                aria-label={label}
                className={`block w-full object-cover ${mobile ? 'aspect-[390/694]' : 'aspect-[8/5]'}`}
            />
        </div>
    );
}
