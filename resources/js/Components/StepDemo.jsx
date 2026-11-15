import { useEffect, useRef, useState } from 'react';

/**
 * Courte video muette en boucle (facon GIF) qui montre une etape du parcours.
 * - Ne charge et ne lit la video que lorsqu'elle est visible (economise la bande passante).
 * - prefers-reduced-motion : pas de lecture automatique, l'image fixe reste avec des controles.
 * Les videos sont generees depuis l'app en local (public/media/how-it-works).
 */
export default function StepDemo({ src, poster, label }) {
    const ref = useRef(null);
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        setReduced(Boolean(media?.matches));
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
    }, [reduced]);

    return (
        <div className="mt-5 overflow-hidden rounded-xl border border-ink-200 bg-ink-950 shadow-sm dark:border-ink-800">
            <video
                ref={ref}
                src={src}
                poster={poster}
                muted
                loop
                playsInline
                preload="none"
                controls={reduced}
                aria-label={label}
                className="block aspect-[8/5] w-full object-cover"
            />
        </div>
    );
}
