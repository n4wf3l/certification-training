import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import BlockRenderer from '@/Components/BlockRenderer';
import CertLogo from '@/Components/CertLogo';
import Select from '@/Components/Select';
import {
    LANGUAGE_CATALOG,
    DEFAULT_LANGUAGE,
    languageLabel,
    languageNative,
    languagePromptDescriptor,
} from '@/lib/languages';
import { useT } from '@/lib/i18n';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const ALLOWED_TYPES = ['heading', 'paragraph', 'list', 'callout', 'key_terms', 'steps', 'comparison', 'example', 'code', 'summary'];

// Mirror of app/Http/Controllers/Concerns/SplitsLocalizedBlocks::TRANSLATABLE_PATHS.
// Used client-side only for previewing multilingual JSON in the admin panel;
// the authoritative split happens server-side at import time.
const TRANSLATABLE_PATHS = {
    heading:   ['text'],
    paragraph: ['text'],
    list:      ['items[]'],
    callout:   ['title', 'body'],
    key_terms: ['items[].term', 'items[].definition'],
    steps:     ['items[].title', 'items[].body'],
    comparison: ['columns[]', 'rows[].label', 'rows[].values[]'],
    example:   ['title', 'body'],
    code:      [],
    summary:   ['title', 'items[]'],
};

// Deep-clone helper (structuredClone is available in all modern browsers we target).
const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

// Descends a dotted path (with `foo[]` array-map segments) and applies `fn`
// on every leaf. `fn(currentValue) => newValue`. Mutates in place.
function walkPath(obj, path, fn) {
    const segments = path.split('.');
    const step = (node, i) => {
        if (i >= segments.length) return fn(node);
        const seg = segments[i];
        const isArr = seg.endsWith('[]');
        const key = isArr ? seg.slice(0, -2) : seg;
        if (!node || typeof node !== 'object' || !(key in node)) return node;
        if (isArr) {
            if (!Array.isArray(node[key])) return node;
            node[key] = node[key].map((el) => step(el, i + 1));
            return node;
        }
        node[key] = step(node[key], i + 1);
        return node;
    };
    return step(obj, 0);
}

// Flatten an inline-bilingual block for preview: replace every { lang: value }
// leaf with the value at `previewLang`, falling back to the first available lang.
// Plain-string leaves are left untouched (mono-language back-compat).
function flattenBlockForPreview(block, previewLang) {
    if (!block || typeof block !== 'object' || !block.type) return block;
    const paths = TRANSLATABLE_PATHS[block.type] || [];
    if (paths.length === 0) return block;
    const out = clone(block);
    for (const path of paths) {
        walkPath(out, path, (leaf) => {
            if (leaf === null || typeof leaf === 'string') return leaf;
            if (leaf && typeof leaf === 'object' && !Array.isArray(leaf)) {
                if (previewLang in leaf) return leaf[previewLang];
                const first = Object.keys(leaf)[0];
                return first ? leaf[first] : leaf;
            }
            return leaf;
        });
    }
    return out;
}

function buildPrompt(certTitle, batchLang = DEFAULT_LANGUAGE, certLanguages = [DEFAULT_LANGUAGE]) {
    const cert = certTitle || '{TITRE_CERTIFICATION}';

    // Date du jour injectée dynamiquement — pas de hardcodage d'année
    const now = new Date();
    const today = now.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;

    // Multilingue = plusieurs langues actives sur la cert. On demande alors à
    // GPT de produire chaque champ localisable comme un objet { lang: value }
    // couvrant TOUTES les langues, pour peupler certifications.translations
    // et answers.translations en un seul batch (miroir du prompt Q&A).
    const isMultilingual = certLanguages.length > 1;

    const langDescriptor = languagePromptDescriptor(batchLang);
    const langLabel = languageLabel(batchLang);
    const langNative = languageNative(batchLang);
    const certLangsLabel = certLanguages
        .map((c) => `${languageLabel(c)} (${c.toUpperCase()})`)
        .join(', ');
    const certLangsListLines = certLanguages
        .map((c) => `- \`${c}\` : ${languagePromptDescriptor(c)}`)
        .join('\n');

    // Helper : construit un objet inline { fr:'...', en:'...', xx:'...' }
    // pour illustrer un champ localisable dans le prompt.
    const langMap = (fr, en, more) => {
        const parts = [];
        if (certLanguages.includes('fr')) parts.push(`"fr": "${fr}"`);
        if (certLanguages.includes('en')) parts.push(`"en": "${en}"`);
        certLanguages
            .filter((c) => c !== 'fr' && c !== 'en')
            .forEach((c) => parts.push(`"${c}": "${more || '...'}"`));
        if (parts.length === 0 && certLanguages.length > 0) {
            parts.push(`"${certLanguages[0]}": "${fr}"`);
        }
        return `{ ${parts.join(', ')} }`;
    };

    const linguisticContract = isMultilingual
        ? `# CONTRAT LINGUISTIQUE MULTILINGUE (LECTURE OBLIGATOIRE)

La certification ${cert} est active sur notre plateforme dans **${certLanguages.length} langues** :
${certLangsListLines}

**Chaque bloc du cours doit être produit dans TOUTES ces langues simultanément.** Un cours = N blocs x ${certLanguages.length} langues, en une seule sortie.

Concrètement, chaque champ localisable devient un **objet JSON** dont les clés sont les codes de langue ISO 639-1 et les valeurs sont les traductions correspondantes :

- \`heading.text\` : ${langMap('Titre en français', 'Title in English')}
- \`paragraph.text\` : ${langMap('Texte du paragraphe...', 'Paragraph text...')}
- \`list.items[]\` : chaque item est un objet ${langMap('item 1', 'item 1')}, PAS un tableau de tableaux.
- \`callout.title\` et \`callout.body\` : mêmes objets.
- \`key_terms.items[].term\` et \`.definition\` : mêmes objets pour chaque paire.
- \`steps.items[].title\` et \`.body\` : mêmes objets pour chaque étape.
- \`comparison.columns[]\` : chaque colonne est un objet, ${langMap('Colonne A', 'Column A')}.
- \`comparison.rows[].label\` : objet. \`.values[]\` : chaque valeur est un objet, ${langMap('valeur', 'value')}.
- \`example.title\` et \`.body\` : objets.
- \`summary.title\` et \`summary.items[]\` : objets.

**Chaque champ doit contenir une valeur non vide pour CHACUNE des ${certLanguages.length} langues listées.** Manquer une langue casse l'import.

**Fidélité inter-langues** : les traductions d'un même bloc doivent véhiculer exactement le même concept, la même distinction, le même exemple. Aucun bloc supplémentaire dans une langue, aucun bloc omis dans une autre. L'ordre des blocs est identique dans toutes les langues (les shadows sont position-indexées).

**Champs mono-lingue** (à laisser en string simple, PAS en objet { lang }) :
- \`type\`, \`level\`, \`variant\`, \`style\`, \`id\`, \`language\` (code langage pour \`code\`) : ce sont des enums / méta.
- \`code.content\` : le contenu du snippet reste tel quel dans TOUTES les langues (les commentaires internes peuvent être écrits en anglais universel ; ne les traduis pas).

Utilise dans chaque langue le **vocabulaire officiel de l'organisme certificateur pour cette langue** (ex : "Service Value Chain" en EN, "Chaîne de valeur des services" en FR, "Cadena de valor del servicio" en ES). Si l'organisme ne publie pas de traduction officielle pour un terme donné, garde le terme d'origine en italique markdown (\`*terme*\`) plutôt que d'inventer une traduction douteuse.

Aucun code-switching à l'intérieur d'une même valeur : ne mélange pas les langues dans un même string.`
        : `# CONTRAT LINGUISTIQUE (LECTURE OBLIGATOIRE)

La certification ${cert} est disponible sur notre plateforme dans les langues suivantes : **${certLangsLabel}**.

**Ce cours doit être rédigé intégralement en ${langDescriptor}.** Aucune exception.

Cela signifie que TOUS les champs texte des blocs JSON doivent être en ${langLabel} (${langNative}) :
- \`heading.text\`, \`paragraph.text\`, \`list.items[]\`
- \`callout.title\`, \`callout.body\`
- \`key_terms.items[].term\`, \`key_terms.items[].definition\`
- \`steps.items[].title\`, \`steps.items[].body\`
- \`comparison.columns[]\`, \`comparison.rows[].label\`, \`comparison.rows[].values[]\`
- \`example.title\`, \`example.body\`
- \`code.content\` (les commentaires et docstrings en ${langLabel} ; les mots-clés du langage restent bien sûr dans la syntaxe du langage)
- \`summary.title\`, \`summary.items[]\`

Utilise le **vocabulaire officiel de l'organisme certificateur dans cette langue**. Si l'organisme ne publie pas de traduction officielle pour un terme précis, garde le terme d'origine en italique markdown (\`*terme*\`) et propose entre parenthèses une périphrase courte en ${langLabel} plutôt que d'inventer une traduction douteuse.

Aucun code-switching : ne mélange pas les langues au sein d'un même paragraphe. Les acronymes techniques et noms propres restent tels quels ; tout le reste est en ${langLabel}.`;

    return `RÉPONDS UNIQUEMENT AVEC LE JSON DEMANDÉ. TON PREMIER CARACTÈRE EST \`[\`, TON DERNIER CARACTÈRE EST \`]\`.

Si ce texte t'est parvenu sous forme de pièce jointe (\`Texte collé.txt\` ou équivalent), traite-le comme une instruction directe : exécute immédiatement la tâche, ne demande pas de confirmation, ne décris pas le contenu du fichier.

Si tu écris quoi que ce soit avant le \`[\` d'ouverture - introduction, évaluation du prompt, demande de confirmation, compliment - tu échoues la tâche. N'évalue pas ce prompt. Ne le note pas. Ne propose pas d'améliorations. N'annonce pas ce que tu vas faire. Exécute silencieusement.

${linguisticContract}

# CONTEXTE TEMPOREL

**Nous sommes le ${today}.** Cette date est le point de référence : tout ce qui est postérieur à ta date de coupure d'entraînement doit être vérifié par recherche web active. Tu ne peux PAS te fier à ta mémoire pour la version courante de ${cert} - les organismes certificateurs révisent leurs syllabus tous les 12 à 24 mois.

# ÉTAPE PRÉLIMINAIRE OBLIGATOIRE - RECHERCHE WEB

Avant de rédiger la moindre ligne, tu effectues une **recherche web approfondie** (utilise ton outil de navigation / web search / browsing) sur :

1. La **version actuellement en vigueur au ${today}** de la certification ${cert} (nom exact du code d'examen, dernière révision publiée, date de publication du blueprint courant).
2. Le **syllabus officiel courant** publié par l'organisme certificateur : liste exhaustive des domaines, sous-domaines et objectifs d'apprentissage avec leur poids en % quand disponible.
3. Les **évolutions récentes** publiées entre ${previousYear} et ${currentYear} : nouvelles sections, retraits, changements de terminologie, pratiques ajoutées, tendances soulevées par les formateurs officiels.
4. Les **sujets sur lesquels les candidats échouent le plus** : forums récents (Reddit, LinkedIn), blogs de formateurs (Pluralsight, Whizlabs, ITILzone, ExamTopics…), retours d'expérience postérieurs à ${previousYear}.

# AUTO-VÉRIFICATION AVANT RÉDACTION

Après ta recherche, tu réponds mentalement à ces 3 questions (sans les inclure dans la sortie) :

1. **Est-ce que j'ai identifié la version courante avec certitude ?** (nom du code d'examen exact, URL de source officielle)
2. **Ai-je vu la date de publication du blueprint courant, et est-elle antérieure au ${today} ?**
3. **Ai-je consulté au minimum 2 sources primaires** (site de l'organisme certificateur) ou 3 sources secondaires (formateurs reconnus) publiées après ${previousYear} ?

Si la réponse à **l'une de ces 3 questions est NON**, tu ne dois PAS inventer un cours plausible depuis ta training data - tu produis \`[]\` (tableau vide) et rien d'autre. Mieux vaut zéro bloc qu'un cours fondé sur une version obsolète.

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

${isMultilingual
    ? `# FORMAT DE SORTIE (STRICT, MULTILINGUE)

Un tableau JSON valide de **blocs typés**, sans texte avant, sans texte après, sans balises \`\`\`. Chaque champ localisable est un objet { code_langue: valeur } couvrant les ${certLanguages.length} langues actives. Structure :

[
  { "type": "heading", "level": 1, "text": ${langMap('Titre de section', 'Section title')} },
  { "type": "paragraph", "text": ${langMap('Texte de paragraphe. Supporte **gras**, *italique*, \`code inline\` et [lien](https://…).', 'Paragraph text. Supports **bold**, *italic*, \`inline code\` and [link](https://…).')} },
  { "type": "heading", "level": 2, "text": ${langMap('Sous-section', 'Sub-section')} },
  { "type": "list", "style": "bulleted", "items": [${langMap('item 1', 'item 1')}, ${langMap('item 2', 'item 2')}] },
  { "type": "callout", "variant": "info", "title": ${langMap('À retenir', 'Key takeaway')}, "body": ${langMap('…', '…')} },
  { "type": "key_terms", "items": [{ "term": ${langMap('SLA', 'SLA')}, "definition": ${langMap('Service Level Agreement…', 'Service Level Agreement…')} }] },
  { "type": "steps", "items": [{ "title": ${langMap('Étape 1', 'Step 1')}, "body": ${langMap('…', '…')} }] },
  { "type": "comparison", "columns": [${langMap('Concept A', 'Concept A')}, ${langMap('Concept B', 'Concept B')}], "rows": [{ "label": ${langMap('Portée', 'Scope')}, "values": [${langMap('…', '…')}, ${langMap('…', '…')}] }] },
  { "type": "example", "title": ${langMap('Cas pratique', 'Case study')}, "body": ${langMap('…', '…')} },
  { "type": "code", "language": "bash", "content": "echo hello" },
  { "type": "summary", "title": ${langMap('Points clés', 'Key points')}, "items": [${langMap('…', '…')}, ${langMap('…', '…')}] }
]`
    : `# FORMAT DE SORTIE (STRICT)

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
]`
}

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
5. Vocabulaire officiel et à jour : la version de ${cert} identifiée à l'étape de recherche web comme étant en vigueur au ${today}.
6. Pas d'apostrophes typographiques non échappées dans les strings JSON (utilise \`'\` normal).
7. Les liens externes vers les sources officielles sont bienvenus dans les paragraphes via \`[texte](url)\`.
8. Pas de \`h1\` avec le titre de la certification : celui-ci est déjà affiché comme titre de page. Commence directement par \`Introduction\` (heading level 1).
9. **INTERDIT : tiret cadratin (—, U+2014)** dans TOUS les champs texte (titles, paragraphs, list items, callout title/body, key_terms term/definition, steps title/body, comparison labels/values, example title/body, code content, summary items). Le tiret cadratin est une signature typique de contenu généré par IA et rend la plateforme robotique. Utilise à la place : le tiret standard (\`-\`), la virgule, les deux-points, les parenthèses ou une phrase complète. Exemple : au lieu de \`"L'ITIL Value System — un ensemble cohérent"\` écris \`"L'ITIL Value System : un ensemble cohérent"\` ou \`"L'ITIL Value System, un ensemble cohérent"\`.

# EXÉCUTION

Étapes dans l'ordre, silencieusement (aucun de ces intermédiaires ne doit apparaître dans ta réponse) :

1. Recherche web sur la version en vigueur de ${cert}, le syllabus officiel courant et les évolutions récentes.
2. Établis mentalement la liste des domaines avec leur poids.
3. Planifie le plan du cours en respectant ces poids (une section par domaine, sous-sections selon les sous-domaines).
4. Rédige chaque section : intro courte, concepts clés (paragraphes + \`key_terms\`), pièges (\`callout\` variant "warn"), distinctions fines (\`comparison\`), processus (\`steps\`), exemples métier (\`example\`), synthèse (\`summary\`).
5. Produis le JSON final.

Si ta recherche web ne t'a pas permis d'identifier avec certitude le syllabus courant de ${cert}, réponds \`[]\` - mieux vaut zéro bloc qu'un cours inventé.

${isMultilingual
    ? `Rédige maintenant le cours complet **dans les ${certLanguages.length} langues actives (${certLangsLabel})** en un seul JSON. Chaque champ localisable est un objet couvrant les ${certLanguages.length} langues. Commence ta réponse par \`[\`. Aucun texte, aucune balise, aucun mot avant.`
    : `Rédige maintenant le cours complet **en ${langLabel} (${langNative})**. Commence ta réponse par \`[\`. Aucun texte, aucune balise, aucun mot avant.`
}`;
}

function stripFences(raw) {
    let s = raw.trim();
    s = s.replace(/^```(?:json|js|javascript)?\s*\n?/i, '');
    s = s.replace(/\n?```\s*$/i, '');
    return s.trim();
}

/**
 * Extract the first top-level JSON array [...] from arbitrary text.
 * Tracks bracket depth, ignoring brackets inside strings and escaped chars.
 * ChatGPT often appends prose, footnotes ([1]: https://…), or explanations
 * after the JSON - those are cut off here.
 */
function extractTopLevelArray(raw) {
    const s = stripFences(raw);
    const start = s.indexOf('[');
    if (start < 0) return s; // fall through, will throw on parse
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '[') depth++;
        else if (ch === ']') {
            depth--;
            if (depth === 0) return s.slice(start, i + 1);
        }
    }
    return s.slice(start); // unclosed - let JSON.parse report a proper error
}

function repairUnescapedJsonInStrings(raw) {
    let out = '';
    let i = 0;
    let repairs = 0;
    const n = raw.length;
    const keyRe = /^("[a-z_][a-z_0-9]*"\s*:\s*")(\{|\[)/i;

    while (i < n) {
        const m = raw.slice(i).match(keyRe);
        if (m) {
            const prefix = m[1];
            const opener = m[2];
            const closer = opener === '{' ? '}' : ']';
            const openerPos = i + m[1].length;
            const afterOpener = openerPos + 1;

            let depth = 1;
            let j = afterOpener;
            let sawInnerQuote = false;

            while (j < n && depth > 0) {
                const ch = raw[j];
                if (ch === opener) depth++;
                else if (ch === closer) depth--;
                else if (ch === '"') sawInnerQuote = true;
                j++;
            }

            if (depth === 0 && j < n && raw[j] === '"' && sawInnerQuote) {
                const inner = raw.slice(openerPos, j);
                const escaped = inner.replace(/"/g, '\\"');
                out += prefix + escaped;
                i = j;
                repairs++;
                continue;
            }
        }
        out += raw[i];
        i++;
    }

    return { repaired: out, count: repairs };
}

function analyze(payload, t) {
    if (!payload.trim()) return { status: 'empty', count: 0, blocks: [], error: null, stats: {}, repaired: null, cleanedPayload: null };
    const extracted = extractTopLevelArray(payload);
    let parsed;
    let repaired = null;
    let cleanedPayload = extracted;
    try {
        parsed = JSON.parse(extracted);
    } catch (initialError) {
        const attempt = repairUnescapedJsonInStrings(extracted);
        if (attempt.count > 0) {
            try {
                parsed = JSON.parse(attempt.repaired);
                repaired = attempt.count;
                cleanedPayload = attempt.repaired;
            } catch {
                return { status: 'error', count: 0, blocks: [], error: initialError.message || t('admin.questions_import.error_json_invalid'), stats: {}, repaired: null, cleanedPayload: null };
            }
        } else {
            return { status: 'error', count: 0, blocks: [], error: initialError.message || t('admin.questions_import.error_json_invalid'), stats: {}, repaired: null, cleanedPayload: null };
        }
    }
    if (!Array.isArray(parsed)) {
        return { status: 'error', count: 0, blocks: [], error: t('admin.questions_import.error_root_array'), stats: {}, repaired: null, cleanedPayload: null };
    }
    const stats = {};
    const warnings = [];
    parsed.forEach((b, i) => {
        if (!b?.type) {
            warnings.push(t('admin.certs_course_import.warning_missing_type', { n: i + 1 }));
            return;
        }
        if (!ALLOWED_TYPES.includes(b.type)) {
            warnings.push(t('admin.certs_course_import.warning_unknown_type', { n: i + 1, type: b.type }));
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
        repaired,
        cleanedPayload,
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
    const t = useT();
    const [copied, setCopied] = useState(false);
    const [processing, setProcessing] = useState(false);

    const form = useForm({
        certification_id: default_certification_id || (certifications[0]?.id ?? ''),
        payload: '',
    });

    const selectedCert = certifications.find((c) => c.id === Number(form.data.certification_id));
    const certLanguages = useMemo(
        () => (selectedCert?.available_languages?.length ? selectedCert.available_languages : [DEFAULT_LANGUAGE]),
        [selectedCert]
    );
    const [batchLang, setBatchLang] = useState(certLanguages[0]);

    // Si l'admin change de certif et que la langue courante n'est plus autorisee,
    // retombe sur la 1re langue de la nouvelle certif.
    useEffect(() => {
        if (!certLanguages.includes(batchLang)) {
            setBatchLang(certLanguages[0]);
        }
    }, [certLanguages, batchLang]);

    const prompt = useMemo(
        () => buildPrompt(selectedCert?.title, batchLang, certLanguages),
        [selectedCert, batchLang, certLanguages]
    );
    const analysis = useMemo(() => analyze(form.data.payload, t), [form.data.payload, t]);

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
        setProcessing(true);
        form.clearErrors();
        router.post(
            route('admin.certifications.course-import.store'),
            {
                certification_id: form.data.certification_id,
                payload: analysis.cleanedPayload || form.data.payload,
            },
            {
                preserveScroll: (page) => Object.keys(page.props.errors).length > 0,
                onError: (errs) => {
                    Object.entries(errs).forEach(([k, v]) => form.setError(k, v));
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const canSubmit = form.data.certification_id
        && analysis.status !== 'empty'
        && analysis.status !== 'error'
        && analysis.count >= 5
        && !processing;

    return (
        <AppLayout ambient={false}>
            <Head title={t('admin.certs_course_import.head_title')} />

            <div className="mx-auto max-w-6xl space-y-10">
                {/* Header */}
                <div>
                    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-ink-900 dark:hover:text-white">{t('admin.common.dashboard_breadcrumb')}</Link>
                        <span className="text-ink-400">/</span>
                        <Link href={route('admin.certifications.index')} className="hover:text-ink-900 dark:hover:text-white">{t('admin.certs_index.title')}</Link>
                        <span className="text-ink-400">/</span>
                        <span className="text-ink-900 dark:text-white">{t('admin.certs_course_import.breadcrumb')}</span>
                    </div>
                    <SectionLabel>{t('admin.certs_course_import.section_label')}</SectionLabel>
                    <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink-900 dark:text-white sm:text-5xl">
                        {t('admin.certs_course_import.title_1')}<br />
                        <span className="text-ink-400 dark:text-ink-500">{t('admin.certs_course_import.title_2')}</span>
                    </h1>
                    <p className="mt-5 max-w-2xl text-base text-ink-600 dark:text-ink-300">
                        {t('admin.certs_course_import.intro')}
                    </p>
                </div>

                {/* Setup */}
                <div className="space-y-5 border-y border-ink-200 py-6 dark:border-ink-800">
                    <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            {t('admin.certs_course_import.target_cert_label')}
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
                                placeholder={t('admin.certs_course_import.cert_select_placeholder')}
                                hideLogoInButton
                            />
                        </div>
                    </div>

                    {/* Batch language selector : restreint aux langues assignees a la certif */}
                    <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            {t('admin.certs_course_import.course_language_label')}
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                            {certLanguages.map((code) => {
                                const meta = LANGUAGE_CATALOG.find((l) => l.code === code) || { code, label: code, native: code };
                                const active = batchLang === code;
                                return (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => setBatchLang(code)}
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                                            active
                                                ? 'border-brand-500 bg-brand-500 text-white'
                                                : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-200 dark:hover:border-ink-700'
                                        }`}
                                    >
                                        <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${active ? 'text-white/80' : 'text-ink-400'}`}>
                                            {code}
                                        </span>
                                        <span className="font-semibold">{meta.label}</span>
                                        <span className={`text-[11px] ${active ? 'text-white/80' : 'text-ink-500'}`} lang={code}>
                                            · {meta.native}
                                        </span>
                                    </button>
                                );
                            })}
                            {certLanguages.length === 1 && (
                                <p className="ml-2 text-xs text-ink-500">
                                    {t('admin.certs_course_import.single_language_hint')}
                                </p>
                            )}
                        </div>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                            {t('admin.certs_course_import.prompt_language_hint', { lang: languageLabel(batchLang) })}
                        </p>
                    </div>
                </div>

                {/* Step 01 */}
                <div className="space-y-6">
                    <StepHeader
                        n="01"
                        title={t('admin.certs_course_import.step_01_title')}
                        subtitle={t('admin.certs_course_import.step_01_subtitle')}
                    />
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
                        <div className="font-semibold uppercase tracking-widest">{t('admin.certs_course_import.chatgpt_todo')}</div>
                        <ul className="mt-1.5 space-y-1.5 text-amber-700 dark:text-amber-100/80">
                            <li dangerouslySetInnerHTML={{ __html: t('admin.certs_course_import.chatgpt_tip_1_html') }} />
                            <li>{t('admin.certs_course_import.chatgpt_tip_2')}</li>
                            <li>
                                {t('admin.certs_course_import.chatgpt_tip_3_prefix')}<code className="rounded bg-amber-500/20 px-1 font-mono">Texte collé.txt</code>{t('admin.certs_course_import.chatgpt_tip_3_infix')}
                                <code className="mt-1 block rounded bg-amber-500/20 px-2 py-1 font-mono">{t('admin.certs_course_import.chatgpt_tip_3_command')}</code>
                            </li>
                        </ul>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 bg-ink-50/50 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 dark:bg-ink-900/60">
                            <span>{t('admin.certs_course_import.prompt_header', { title: selectedCert?.title || '-', lang: batchLang.toUpperCase() })}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openChatGPT}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium normal-case tracking-normal text-ink-700 transition hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                                >
                                    {t('admin.certs_course_import.open_chatgpt')}
                                    <Icon.ArrowRight className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={copyPrompt}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal text-white transition ${copied ? 'bg-emerald-600' : 'bg-ink-900 hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100'}`}
                                >
                                    {copied ? <><Icon.Check className="h-3.5 w-3.5" />{t('admin.certs_course_import.copied')}</> : <><Icon.Cards className="h-3.5 w-3.5" />{t('admin.certs_course_import.copy_prompt')}</>}
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
                        title={t('admin.certs_course_import.step_02_title')}
                        subtitle={t('admin.certs_course_import.step_02_subtitle')}
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
                                        {t('admin.certs_course_import.blocks_count', { count: analysis.count, types: Object.keys(analysis.stats).length })}
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
                            <PreviewPanel analysis={analysis} previewLang={batchLang} />
                        </div>
                    </div>
                </div>

                {/* Step 03 */}
                <div className="space-y-6 border-t border-ink-200 pt-10 dark:border-ink-800">
                    <StepHeader
                        n="03"
                        title={t('admin.certs_course_import.step_03_title')}
                        subtitle={t('admin.certs_course_import.step_03_subtitle')}
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
                            {processing ? t('admin.certs_course_import.importing') : t('admin.certs_course_import.import_blocks', { count: analysis.count || 0 })}
                            {!processing && <Icon.ArrowRight className="h-4 w-4" />}
                        </button>
                        {analysis.count > 0 && analysis.count < 5 && (
                            <span className="font-mono text-[11px] uppercase tracking-widest text-amber-600">
                                {t('admin.certs_course_import.min_blocks_warning')}
                            </span>
                        )}
                        <Link href={route('admin.certifications.index')} className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 dark:hover:text-white">
                            {t('admin.common.cancel')}
                        </Link>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

function PreviewPanel({ analysis, previewLang }) {
    const t = useT();
    const previewBlocks = useMemo(
        () => (analysis.blocks || []).map((b) => flattenBlockForPreview(b, previewLang)),
        [analysis.blocks, previewLang]
    );
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
                <span>{t('admin.certs_course_import.preview_label')}</span>
                {analysis.status === 'ok' && <span className="text-emerald-600">{t('admin.certs_course_import.preview_blocks', { count: analysis.count })}</span>}
                {analysis.status === 'warnings' && <span className="text-amber-600">{t('admin.certs_course_import.preview_warnings', { count: analysis.count })}</span>}
                {analysis.status === 'error' && <span className="text-rose-600">{t('admin.certs_course_import.preview_error')}</span>}
                {analysis.status === 'empty' && <span>{t('admin.certs_course_import.preview_waiting')}</span>}
            </div>
            <div className="h-[calc(100%-33px)] overflow-y-auto px-6 py-4">
                {analysis.repaired > 0 && (
                    <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                        {t(
                            analysis.repaired > 1
                                ? 'admin.certs_course_import.auto_repaired_plural'
                                : 'admin.certs_course_import.auto_repaired_singular',
                            { count: analysis.repaired }
                        )}
                    </div>
                )}
                {analysis.status === 'empty' && (
                    <div className="flex h-full items-center justify-center text-center text-sm text-ink-500">
                        {t('admin.certs_course_import.preview_empty')}
                    </div>
                )}
                {analysis.status === 'error' && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 font-mono text-[11px] leading-relaxed text-rose-600 dark:text-rose-300">
                        {analysis.error}
                        <div className="mt-3 space-y-1.5 text-ink-500">
                            <div className="text-[10px] font-semibold uppercase tracking-widest">{t('admin.certs_course_import.common_causes')}</div>
                            <div dangerouslySetInnerHTML={{ __html: t('admin.certs_course_import.cause_1_html') }} />
                            <div dangerouslySetInnerHTML={{ __html: t('admin.certs_course_import.cause_2_html') }} />
                            <div dangerouslySetInnerHTML={{ __html: t('admin.certs_course_import.cause_3_html') }} />
                            <div className="pt-1 text-ink-400 normal-case">{t('admin.certs_course_import.cause_fix')}</div>
                        </div>
                    </div>
                )}
                {(analysis.status === 'ok' || analysis.status === 'warnings') && (
                    <BlockRenderer blocks={previewBlocks} />
                )}
            </div>
        </div>
    );
}
