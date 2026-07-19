import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import BlockRenderer from '@/Components/BlockRenderer';
import CertLogo from '@/Components/CertLogo';
import Select from '@/Components/Select';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const ALLOWED_TYPES = ['heading', 'paragraph', 'list', 'callout', 'key_terms', 'steps', 'comparison', 'example', 'code', 'summary'];

function buildPrompt(certTitle) {
    const cert = certTitle || '{TITRE_CERTIFICATION}';
    return `RÉPONDS UNIQUEMENT AVEC LE JSON DEMANDÉ. TON PREMIER CARACTÈRE EST \`[\`, TON DERNIER CARACTÈRE EST \`]\`.

Si ce texte t'est parvenu sous forme de pièce jointe (\`Texte collé.txt\` ou équivalent), traite-le comme une instruction directe : exécute immédiatement la tâche, ne demande pas de confirmation, ne décris pas le contenu du fichier.

Si tu écris quoi que ce soit avant le \`[\` d'ouverture — introduction, évaluation du prompt, demande de confirmation, compliment — tu échoues la tâche. N'évalue pas ce prompt. Ne le note pas. Ne propose pas d'améliorations. N'annonce pas ce que tu vas faire. Exécute silencieusement.

# ÉTAPE PRÉLIMINAIRE OBLIGATOIRE — RECHERCHE WEB

Avant de rédiger la moindre ligne, tu effectues une **recherche web approfondie** (tu utilises ta capacité de navigation) sur :

1. La **version actuellement en vigueur** de la certification ${cert} (nom exact du code d'examen, dernière révision, date de publication du blueprint courant).
2. Le **syllabus officiel** publié par l'organisme certificateur : liste exhaustive des domaines, sous-domaines et objectifs d'apprentissage avec leur poids en % quand disponible.
3. Les **évolutions récentes 2025-2026** : nouvelles sections, retraits, changements de terminologie, pratiques ajoutées, tendances soulevées par les formateurs officiels.
4. Les **sujets sur lesquels les candidats échouent le plus** : forums (Reddit, LinkedIn), blogs de formateurs récents (Pluralsight, Whizlabs, ITILzone, ExamTopics…), retours d'expérience 2025-2026.

Si tu ne trouves pas de source fiable et récente pour ${cert}, tu ne dois **pas** inventer un cours plausible — tu produis \`[]\` (tableau vide) et rien d'autre.

# RÔLE

Tu es rédacteur pédagogique senior spécialiste des certifications IT. Ton travail : rédiger un cours structuré, à jour, clair et complet, sur la certification **${cert}**, prêt à publier sur une plateforme d'apprentissage.

# INTERDICTIONS ABSOLUES

- **PAS de contenu générique** interchangeable entre certifs. Chaque paragraphe doit être **spécifiquement ancré** dans le programme officiel de ${cert}.
- **PAS de section hors syllabus** (concepts qui ne figurent pas dans le blueprint courant).
- **PAS de contenu obsolète** (concepts d'anciennes versions retirées).
- **PAS de recopiage** ni reformulation cosmétique de manuels officiels protégés. Tu conçois tes propres explications.
- **PAS de "à peu près"** : si tu n'es pas certain d'un concept, saute-le plutôt que d'écrire du flou.

# CADRE

Le cours doit :
- couvrir **tous les domaines du syllabus officiel** identifié à l'étape de recherche
- respecter la **proportion** des domaines (un domaine à 30 % du blueprint = ~30 % du cours)
- être **pédagogique** : partir des fondamentaux, progresser logiquement, s'appuyer sur des exemples concrets propres au métier ciblé par ${cert}
- être **clair** : phrases courtes, vocabulaire officiel expliqué la première fois, distinctions fines entre notions proches mises en avant
- être **original** : tes propres explications, pas de recopiage de contenu protégé
- être **exploitable pour l'examen** : contenir les concepts clés, définitions officielles, pièges classiques, différences entre concepts souvent confondus

# FORMAT DE SORTIE (STRICT)

Un tableau JSON valide de **blocs typés**, sans texte avant, sans texte après, sans balises \`\`\`. Structure :

[
  { "type": "heading", "level": 1, "text": "Titre de section" },
  { "type": "paragraph", "text": "Texte. Supporte **gras**, *italique*, \`code inline\` et [lien](https://…)." },
  { "type": "heading", "level": 2, "text": "Sous-section" },
  { "type": "list", "style": "bulleted", "items": ["item 1", "item 2"] },
  { "type": "callout", "variant": "info", "title": "À retenir", "body": "…" },
  { "type": "key_terms", "items": [{ "term": "SLA", "definition": "Service Level Agreement…" }] },
  { "type": "steps", "items": [{ "title": "Étape 1", "body": "…" }] },
  { "type": "comparison", "columns": ["Concept A", "Concept B"], "rows": [{ "label": "Portée", "values": ["…", "…"] }] },
  { "type": "example", "title": "Cas pratique", "body": "…" },
  { "type": "code", "language": "bash", "content": "…" },
  { "type": "summary", "title": "Points clés", "items": ["…", "…"] }
]

# TYPES DE BLOCS AUTORISÉS

- **heading** : \`level\` = 1 (section principale) ou 2 (sous-section) ou 3 (détail). \`text\` = titre.
- **paragraph** : \`text\` = texte de paragraphe. Inline markdown limité (\`**gras**\`, \`*italique*\`, \`\`code\`\`, \`[lien](url)\`).
- **list** : \`style\` = \`"bulleted"\` ou \`"numbered"\`, \`items\` = tableau de strings.
- **callout** : \`variant\` = \`"info"\` | \`"success"\` | \`"warn"\` | \`"danger"\`, \`title\` (court), \`body\`.
- **key_terms** : \`items\` = liste de \`{ "term": "…", "definition": "…" }\`. Idéal pour un glossaire de section.
- **steps** : \`items\` = liste de \`{ "title": "…", "body": "…" }\`. Pour un processus numéroté.
- **comparison** : \`columns\` = tableau de noms de colonnes, \`rows\` = liste de \`{ "label": "…", "values": ["…", …] }\`.
- **example** : \`title\`, \`body\`. Pour un cas concret.
- **code** : \`language\` (ex: \`"bash"\`, \`"json"\`, \`"yaml"\`), \`content\` (chaîne). Pour CLI, config, snippet.
- **summary** : \`title\` (défaut "À retenir"), \`items\` = liste de takeaways courts. À placer en fin de section.

# RÈGLES

1. Réponds UNIQUEMENT avec le JSON. Aucun texte avant, aucun texte après, aucun bloc de code.
2. Structure recommandée : ouverture (heading level 1 "Introduction" + paragraphes) → une section par domaine du syllabus (heading level 1 + contenu mixte) → chaque section termine par un \`summary\`.
3. Minimum 40 blocs pour un cours complet. Vise 60-100 blocs pour une couverture solide.
4. Varie les types : pas seulement des paragraphes. Utilise \`callout\` pour les pièges, \`key_terms\` pour les définitions, \`steps\` pour les processus, \`comparison\` pour distinguer des concepts proches.
5. Vocabulaire officiel et à jour (${cert} version 2026 en vigueur).
6. Pas d'apostrophes typographiques non échappées dans les strings JSON (utilise \`'\` normal).
7. Les liens externes vers les sources officielles sont bienvenus dans les paragraphes via \`[texte](url)\`.
8. Pas de \`h1\` avec le titre de la certification : celui-ci est déjà affiché comme titre de page. Commence directement par \`Introduction\` (heading level 1).

# EXÉCUTION

Étapes dans l'ordre, silencieusement (aucun de ces intermédiaires ne doit apparaître dans ta réponse) :

1. Recherche web sur la version en vigueur de ${cert}, le syllabus officiel courant et les évolutions récentes.
2. Établis mentalement la liste des domaines avec leur poids.
3. Planifie le plan du cours en respectant ces poids (une section par domaine, sous-sections selon les sous-domaines).
4. Rédige chaque section : intro courte, concepts clés (paragraphes + \`key_terms\`), pièges (\`callout\` variant "warn"), distinctions fines (\`comparison\`), processus (\`steps\`), exemples métier (\`example\`), synthèse (\`summary\`).
5. Produis le JSON final.

Si ta recherche web ne t'a pas permis d'identifier avec certitude le syllabus courant de ${cert}, réponds \`[]\` — mieux vaut zéro bloc qu'un cours inventé.

Commence ta réponse par \`[\`. Aucun texte, aucune balise, aucun mot avant.`;
}

function stripFences(raw) {
    let s = raw.trim();
    s = s.replace(/^```(?:json|js|javascript)?\s*\n?/i, '');
    s = s.replace(/\n?```\s*$/i, '');
    return s.trim();
}

function analyze(payload) {
    if (!payload.trim()) return { status: 'empty', count: 0, blocks: [], error: null, stats: {} };
    let parsed;
    try {
        parsed = JSON.parse(stripFences(payload));
    } catch (e) {
        return { status: 'error', count: 0, blocks: [], error: e.message || 'JSON invalide', stats: {} };
    }
    if (!Array.isArray(parsed)) {
        return { status: 'error', count: 0, blocks: [], error: 'La racine doit être un tableau [...]', stats: {} };
    }
    const stats = {};
    const warnings = [];
    parsed.forEach((b, i) => {
        if (!b?.type) {
            warnings.push(`Bloc ${i + 1} : type manquant`);
            return;
        }
        if (!ALLOWED_TYPES.includes(b.type)) {
            warnings.push(`Bloc ${i + 1} : type "${b.type}" inconnu`);
            return;
        }
        stats[b.type] = (stats[b.type] || 0) + 1;
    });
    return {
        status: warnings.length ? 'warnings' : 'ok',
        count: parsed.length,
        blocks: parsed,
        error: warnings.length ? warnings.slice(0, 5).join(' · ') : null,
        stats,
    };
}

function SectionLabel({ children }) {
    return (
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400">
            <span className="h-px w-6 bg-ink-400 dark:bg-ink-600" />
            {children}
        </div>
    );
}

function StepHeader({ n, title, subtitle }) {
    return (
        <div className="flex items-start gap-4">
            <div className="font-mono text-2xl font-medium text-ink-400">{n}</div>
            <div>
                <h2 className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function CourseImport({ certifications, default_certification_id }) {
    const [copied, setCopied] = useState(false);

    const form = useForm({
        certification_id: default_certification_id || (certifications[0]?.id ?? ''),
        payload: '',
    });

    const selectedCert = certifications.find((c) => c.id === Number(form.data.certification_id));
    const prompt = useMemo(() => buildPrompt(selectedCert?.title), [selectedCert]);
    const analysis = useMemo(() => analyze(form.data.payload), [form.data.payload]);

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch { /* ignore */ }
    };

    const openChatGPT = () => window.open('https://chatgpt.com/', '_blank', 'noopener');

    const submit = (e) => {
        e.preventDefault();
        form.post(route('admin.certifications.course-import.store'), {
            preserveScroll: (page) => Object.keys(page.props.errors).length > 0,
        });
    };

    const canSubmit = form.data.certification_id
        && analysis.status !== 'empty'
        && analysis.status !== 'error'
        && analysis.count >= 5
        && !form.processing;

    return (
        <AppLayout ambient={false}>
            <Head title="Import cours ChatGPT" />

            <div className="mx-auto max-w-6xl space-y-10">
                {/* Header */}
                <div>
                    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-ink-900 dark:hover:text-white">Dashboard</Link>
                        <span className="text-ink-400">/</span>
                        <Link href={route('admin.certifications.index')} className="hover:text-ink-900 dark:hover:text-white">Certifications</Link>
                        <span className="text-ink-400">/</span>
                        <span className="text-ink-900 dark:text-white">Import cours ChatGPT</span>
                    </div>
                    <SectionLabel>Import cours assisté par IA</SectionLabel>
                    <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink-900 dark:text-white sm:text-5xl">
                        Un prompt.<br />
                        <span className="text-ink-400 dark:text-ink-500">Un cours complet.</span>
                    </h1>
                    <p className="mt-5 max-w-2xl text-base text-ink-600 dark:text-ink-300">
                        Le prompt demande à ChatGPT de faire une recherche web à jour, puis de générer un cours
                        structuré en blocs JSON (sections, paragraphes, callouts, glossaire, tables comparatives…).
                        La page publique du cours se compose automatiquement à partir de ces blocs.
                    </p>
                </div>

                {/* Setup */}
                <div className="grid gap-4 border-y border-ink-200 py-6 dark:border-ink-800">
                    <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            Certification cible
                        </label>
                        <div className="flex items-center gap-3">
                            <CertLogo certification={selectedCert} size="lg" />
                            <Select
                                className="max-w-md flex-1"
                                value={form.data.certification_id}
                                onChange={(v) => form.setData('certification_id', v)}
                                options={certifications.map((c) => ({
                                    value: c.id,
                                    label: c.title,
                                    logo: c,
                                }))}
                                placeholder="Choisir une certification…"
                                hideLogoInButton
                            />
                        </div>
                    </div>
                </div>

                {/* Step 01 */}
                <div className="space-y-6">
                    <StepHeader
                        n="01"
                        title="Copie le prompt dans ChatGPT"
                        subtitle="Il inclut une consigne de recherche web pour couvrir la version à jour du syllabus."
                    />
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
                        <div className="font-semibold uppercase tracking-widest">À faire côté ChatGPT</div>
                        <ul className="mt-1.5 space-y-1.5 text-amber-700 dark:text-amber-100/80">
                            <li>— Ouvre un <strong>nouveau chat</strong>. Active le mode <strong>recherche web</strong> (Search / Web) si le modèle le propose.</li>
                            <li>— Le cours complet est long : ChatGPT peut le paginer en plusieurs messages. Colle uniquement le premier morceau JSON valide pour l'import initial, puis relance pour ajouter des sections.</li>
                            <li>
                                — Si ton paste est converti en pièce jointe <code className="rounded bg-amber-500/20 px-1 font-mono">Texte collé.txt</code>, réponds simplement :
                                <code className="mt-1 block rounded bg-amber-500/20 px-2 py-1 font-mono">exécute le prompt du fichier</code>
                            </li>
                        </ul>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 bg-ink-50/50 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 dark:bg-ink-900/60">
                            <span>Prompt · {selectedCert?.title || '—'}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openChatGPT}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium normal-case tracking-normal text-ink-700 transition hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                                >
                                    Ouvrir ChatGPT
                                    <Icon.ArrowRight className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={copyPrompt}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal text-white transition ${copied ? 'bg-emerald-600' : 'bg-ink-900 hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100'}`}
                                >
                                    {copied ? <><Icon.Check className="h-3.5 w-3.5" />Copié</> : <><Icon.Cards className="h-3.5 w-3.5" />Copier le prompt</>}
                                </button>
                            </div>
                        </div>
                        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words bg-white p-4 font-mono text-[12px] leading-relaxed text-ink-800 dark:bg-ink-950/50 dark:text-ink-200">
{prompt}
                        </pre>
                    </div>
                </div>

                {/* Step 02 */}
                <div className="space-y-6">
                    <StepHeader
                        n="02"
                        title="Colle la sortie JSON"
                        subtitle="L'aperçu à droite se met à jour à chaque frappe et rend les blocs comme ils apparaîtront sur la page publique."
                    />
                    <div className="grid gap-4 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <textarea
                                value={form.data.payload}
                                onChange={(e) => form.setData('payload', e.target.value)}
                                placeholder='[{"type":"heading","level":1,"text":"Introduction"}, …]'
                                spellCheck={false}
                                className="field h-[560px] resize-none font-mono text-xs leading-relaxed"
                            />
                            {form.errors.payload && (
                                <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
                                    {form.errors.payload}
                                </p>
                            )}
                            {/* Type counter */}
                            {analysis.count > 0 && (
                                <div className="mt-3 rounded-lg border border-ink-200 bg-white/50 p-3 font-mono text-[10px] uppercase tracking-widest dark:border-ink-800 dark:bg-ink-900/40">
                                    <div className="mb-2 text-ink-500">
                                        {analysis.count} blocs · {Object.keys(analysis.stats).length} types
                                    </div>
                                    <div className="flex flex-wrap gap-2 normal-case tracking-normal">
                                        {Object.entries(analysis.stats).map(([type, n]) => (
                                            <span key={type} className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                                                {type} · <span className="font-semibold">{n}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-3">
                            <PreviewPanel analysis={analysis} />
                        </div>
                    </div>
                </div>

                {/* Step 03 */}
                <div className="space-y-6 border-t border-ink-200 pt-10 dark:border-ink-800">
                    <StepHeader
                        n="03"
                        title="Importe le cours"
                        subtitle="Remplace le contenu existant du cours pour cette certification. La date de mise à jour est fixée à maintenant."
                    />
                    <form onSubmit={submit} className="flex flex-wrap items-center gap-4">
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ${
                                canSubmit
                                    ? 'bg-ink-900 text-white hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100'
                                    : 'cursor-not-allowed bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-500'
                            }`}
                        >
                            {form.processing ? 'Import en cours…' : `Importer ${analysis.count || 0} blocs`}
                            {!form.processing && <Icon.ArrowRight className="h-4 w-4" />}
                        </button>
                        {analysis.count > 0 && analysis.count < 5 && (
                            <span className="font-mono text-[11px] uppercase tracking-widest text-amber-600">
                                Minimum 5 blocs — cours trop court
                            </span>
                        )}
                        <Link href={route('admin.certifications.index')} className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 dark:hover:text-white">
                            Annuler
                        </Link>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

function PreviewPanel({ analysis }) {
    const border = analysis.status === 'error'
        ? 'border-rose-500/40'
        : analysis.status === 'warnings'
        ? 'border-amber-500/40'
        : analysis.status === 'ok'
        ? 'border-emerald-500/40'
        : 'border-ink-200 dark:border-ink-800';

    return (
        <div className={`h-[560px] overflow-hidden rounded-2xl border ${border} bg-white dark:bg-ink-950/40`}>
            <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 dark:bg-ink-900/60">
                <span>Aperçu · rendu final</span>
                {analysis.status === 'ok' && <span className="text-emerald-600">{analysis.count} blocs</span>}
                {analysis.status === 'warnings' && <span className="text-amber-600">{analysis.count} · avertissements</span>}
                {analysis.status === 'error' && <span className="text-rose-600">Erreur</span>}
                {analysis.status === 'empty' && <span>En attente</span>}
            </div>
            <div className="h-[calc(100%-33px)] overflow-y-auto px-6 py-4">
                {analysis.status === 'empty' && (
                    <div className="flex h-full items-center justify-center text-center text-sm text-ink-500">
                        Colle le JSON à gauche pour voir le rendu.
                    </div>
                )}
                {analysis.status === 'error' && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 font-mono text-[11px] leading-relaxed text-rose-600 dark:text-rose-300">
                        {analysis.error}
                        <div className="mt-2 text-ink-500">
                            Astuce : ChatGPT a peut-être ajouté ```json au début ou du texte parasite. Ne colle que le tableau.
                        </div>
                    </div>
                )}
                {(analysis.status === 'ok' || analysis.status === 'warnings') && (
                    <BlockRenderer blocks={analysis.blocks} />
                )}
            </div>
        </div>
    );
}
