/**
 * Cache local des questions vues pour la revision offline.
 * Utilise localStorage (simple, universel, ~5-10Mo suffisent pour 200 questions).
 * IndexedDB serait plus scalable mais overkill pour ce volume.
 *
 * Format stocke : {
 *   updated_at: ISO,
 *   items: [{ question_id, position, topic, question_text, scenario, explanation,
 *             answers: [{id, letter, text, is_correct, rationale}],
 *             certification: { title, slug } }]
 * }
 * Max 40 items (les plus recents).
 */

const KEY = 'certifloop.offline_questions';
const MAX_ITEMS = 40;

export function saveExamToCache(details, certification) {
    try {
        const existing = loadCache();
        // On ajoute les details qui ont a la fois question, chosen (ou pas) et correct (visible depuis Result)
        const enriched = (details || []).map((d) => ({
            question_id: d.question_id,
            position: d.position,
            topic: d.topic,
            question_text: d.question_text,
            scenario: d.scenario,
            explanation: d.explanation,
            answers: [
                d.chosen && { letter: d.chosen.letter, text: d.chosen.text, is_chosen: true, is_correct: d.is_correct, rationale: d.chosen.rationale },
                !d.is_correct && d.correct && { letter: d.correct.letter, text: d.correct.text, is_correct: true, rationale: d.correct.rationale },
            ].filter(Boolean),
            certification: { title: certification?.title, slug: certification?.slug },
            cached_at: new Date().toISOString(),
        }));

        // Merge : questions_id est unique, on garde la version la plus recente
        const map = new Map();
        for (const item of existing.items || []) map.set(item.question_id, item);
        for (const item of enriched) map.set(item.question_id, item);

        // Garde les MAX_ITEMS plus recents (tri par cached_at desc)
        const items = [...map.values()]
            .sort((a, b) => new Date(b.cached_at) - new Date(a.cached_at))
            .slice(0, MAX_ITEMS);

        window.localStorage.setItem(KEY, JSON.stringify({
            updated_at: new Date().toISOString(),
            items,
        }));
        return items.length;
    } catch (e) {
        console.warn('Cache offline en echec', e);
        return 0;
    }
}

export function loadCache() {
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return { updated_at: null, items: [] };
        return JSON.parse(raw);
    } catch {
        return { updated_at: null, items: [] };
    }
}

export function clearCache() {
    try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
}
