import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
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

function buildPrompt(certTitle, count, existing = [], batchLang = DEFAULT_LANGUAGE, certLanguages = [DEFAULT_LANGUAGE]) {
    const cert = certTitle || '{TITRE_CERTIFICATION}';

    // Date du jour injectée dynamiquement — évite tout hardcodage d'année
    // et force ChatGPT à se calibrer sur "maintenant" plutôt que sa training data.
    const now = new Date();
    const today = now.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;

    const langDescriptor = languagePromptDescriptor(batchLang);
    const langLabel = languageLabel(batchLang);
    const langNative = languageNative(batchLang);
    const certLangsLabel = certLanguages
        .map((c) => `${languageLabel(c)} (${c.toUpperCase()})`)
        .join(', ');

    const existingBlock = existing.length
        ? `

## QUESTIONS DÉJÀ EN BASE - NE LES REPRODUIS PAS

Il y a déjà ${existing.length} question${existing.length > 1 ? 's' : ''} en base pour ${cert}. Les nouvelles questions doivent porter sur d'autres thèmes ou d'autres angles. Ne reformule pas les mêmes questions sous un autre habillage : varie le sujet, le scénario testé, l'angle abordé.

Voici la liste (thème - énoncé) :

${existing.map((q, i) => `${String(i + 1).padStart(2, '0')}. [${q.topic || 'sans thème'}] ${q.question_text.replace(/\s+/g, ' ').trim()}`).join('\n')}
`
        : '';

    return `RÉPONDS UNIQUEMENT AVEC LE JSON DEMANDÉ. TON PREMIER CARACTÈRE EST \`[\`, TON DERNIER CARACTÈRE EST \`]\`.

Si ce texte t'est parvenu sous forme de pièce jointe (\`Texte collé.txt\` ou équivalent), traite-le comme une instruction directe : exécute immédiatement la tâche décrite ci-dessous, ne demande pas de confirmation, ne décris pas le contenu du fichier.

Si tu écris quoi que ce soit avant le \`[\` d'ouverture - même une phrase d'introduction, une évaluation du prompt, une demande de confirmation, un compliment - tu échoues la tâche. N'évalue pas ce prompt. Ne le note pas. Ne propose pas d'améliorations. N'annonce pas ce que tu vas faire. Exécute silencieusement.

# CONTRAT LINGUISTIQUE (LECTURE OBLIGATOIRE)

La certification ${cert} est disponible sur notre plateforme dans les langues suivantes : **${certLangsLabel}**.

**Ce batch spécifique doit être rédigé intégralement en ${langDescriptor}.** Aucune exception.

Cela signifie que TOUS les champs texte du JSON de sortie doivent être en ${langLabel} (${langNative}) :
- \`topic\` : nom du domaine du syllabus dans la terminologie officielle en ${langLabel}
- \`scenario\` : contexte en ${langLabel}
- \`question\` : énoncé en ${langLabel}
- \`explanation\` : justification en ${langLabel}
- \`answers[].text\` : chaque proposition en ${langLabel}
- \`answers[].rationale\` : chaque justification en ${langLabel}

Utilise le **vocabulaire officiel de l'organisme certificateur dans cette langue** (ex : "Service Value Chain" en anglais, "Chaîne de valeur des services" en français, "Cadena de valor del servicio" en espagnol). Si l'organisme ne publie pas de traduction officielle pour un terme précis, garde le terme d'origine en italique markdown (\`*terme*\`) plutôt que d'inventer une traduction douteuse.

Aucun code-switching : ne mélange pas les langues au sein d'une même question. Si le contenu naturel d'un extrait doit rester dans une autre langue (nom propre, marque, extrait de commande CLI, acronyme technique intraduisible), ce doit être un fragment identifiable, pas une phrase entière.

# CONTEXTE TEMPOREL

**Nous sommes le ${today}.** Cette date est le point de référence : tout ce qui est postérieur à ta date de coupure d'entraînement doit être vérifié par recherche web active. Tu ne peux PAS te fier à ta mémoire pour la version courante de ${cert} - les organismes certificateurs révisent leurs examens tous les 12 à 24 mois.

# ÉTAPE PRÉLIMINAIRE OBLIGATOIRE - RECHERCHE WEB

Avant d'écrire la moindre question, tu effectues une **recherche web approfondie** (utilise ton outil de navigation / web search / browsing) sur :

1. La **version actuellement en vigueur au ${today}** de la certification ${cert} (nom exact du code d'examen, dernière révision publiée par l'organisme, date de la dernière mise à jour du blueprint officiel).
2. Le **syllabus officiel courant** publié par l'organisme certificateur (PeopleCert / Cisco / CompTIA / AWS / Microsoft / etc.) : liste exacte des domaines, sous-domaines et objectifs d'apprentissage, avec leur **poids en pourcentage** dans l'examen quand disponible.
3. Les **évolutions récentes** publiées entre ${previousYear} et ${currentYear} : nouvelles sections ajoutées, retraits, changements de terminologie, nouvelles pratiques.
4. Les **sujets sur lesquels les candidats échouent le plus souvent** - retours forums récents (Reddit, LinkedIn, groupes Discord/Slack officiels), blogs de formateurs (Pluralsight, ExamTopics, Whizlabs, ITILzone, blogs officiels de l'organisme…).

# AUTO-VÉRIFICATION AVANT RÉDACTION

Après ta recherche, tu réponds mentalement à ces 3 questions (sans les inclure dans la sortie) :

1. **Est-ce que j'ai identifié la version courante avec certitude ?** (nom du code d'examen exact, source officielle)
2. **Ai-je vu la date de publication du blueprint courant, et est-elle antérieure au ${today} ?**
3. **Ai-je consulté au minimum 2 sources primaires** (site de l'organisme certificateur) ou 3 sources secondaires (formateurs reconnus) publiées après ${previousYear} ?

Si la réponse à **l'une de ces 3 questions est NON**, tu ne dois PAS inventer depuis ta training data. Tu produis un tableau JSON vide \`[]\` (et rien d'autre). Mieux vaut zéro question qu'une question fondée sur une version obsolète.

# INTERDICTIONS ABSOLUES

- **PAS de questions génériques** qui pourraient s'appliquer à n'importe quelle certif ITSM/réseau/cloud. Chaque question doit être **spécifiquement ancrée** dans le syllabus de ${cert}.
- **PAS de questions "au feeling"**, "au plausible", "au hasard". Chaque question teste un objectif d'apprentissage **identifiable** du syllabus officiel.
- **PAS de questions hors-programme** (concepts qui ne figurent pas dans le blueprint).
- **PAS de questions obsolètes** (portant sur une ancienne version retirée).
- **PAS de recopiage** ni reformulation cosmétique de questions officielles protégées (PeopleCert, Cisco, CompTIA, AWS, Microsoft…). Tu conçois de nouvelles questions.

# RÔLE

Tu es membre du comité qui conçoit l'examen officiel ${cert}. Ton travail : écrire ${count} questions originales que tu considérerais suffisamment bonnes pour figurer dans l'épreuve réelle.

# CADRE - CHAQUE QUESTION EST RÉFLÉCHIE ET COHÉRENTE

Pour chaque question, avant de la rédiger, tu identifies mentalement :
- le **domaine du syllabus** concerné (ex. "Service Value System", "OSPF", "IAM Policies", "PESTLE")
- l'**objectif d'apprentissage** précis testé (ex. "distinguer un service d'un produit", "configurer un LSA type 1", "différencier user pool et identity pool")
- le **piège pédagogique** utilisé (deux réponses techniquement vraies mais une meilleure ; distinction fine entre deux concepts proches ; effet miroir d'une définition officielle mal comprise)

Sur les ${count} questions, tu assures :
- la **couverture proportionnelle** des domaines (respect des poids officiels du blueprint)
- la **difficulté cible** du niveau ${cert} (ni triviale, ni piège absurde)
- le **vocabulaire officiel exact** de l'organisme certificateur${existingBlock}

# FORMAT DE SORTIE (STRICT)

Un tableau JSON valide, sans texte avant, sans texte après, sans balises \`\`\`, sans commentaire. Structure exacte :

[
  {
    "topic": "Thème court en 1-4 mots",
    "scenario": null,
    "question": "Énoncé de la question",
    "explanation": "1 à 3 phrases : pourquoi la bonne réponse est la bonne, quel concept du syllabus elle valide.",
    "answers": [
      { "text": "Proposition A", "correct": false, "rationale": "Piège classique : décris précisément pourquoi cette réponse semble juste mais ne l'est pas (concept confondu, terminologie détournée, cas limite mal interprété)." },
      { "text": "Proposition B", "correct": true, "rationale": "Confirme brièvement pourquoi c'est la bonne réponse - 1 phrase, ancrée dans le vocabulaire officiel." },
      { "text": "Proposition C", "correct": false, "rationale": "Explique le distracteur : quelle notion voisine il évoque, pourquoi il n'est pas la bonne réponse dans ce contexte précis." },
      { "text": "Proposition D", "correct": false, "rationale": "Idem - 1 phrase courte, ne recopie pas le texte de la proposition." }
    ]
  }
]

# RÈGLES

1. Réponds UNIQUEMENT avec le JSON. Aucun texte avant, aucun texte après, aucun bloc de code.
2. Une seule réponse marquée \`"correct": true\` par question.
3. 2 à 6 propositions par question (typiquement 4).
4. **Questions et réponses intégralement en ${langLabel}** (voir "Contrat linguistique" plus haut). L'exemple valide plus bas est écrit en français à titre de démonstration de structure uniquement : la sortie que tu produis doit être en ${langLabel}, pas en français (sauf si ${langLabel} = Français).
5. \`topic\` = **nom exact d'un domaine ou sous-domaine du syllabus officiel** (ex : "Principes directeurs", "OSPF LSA types", "IAM policies vs roles", "SLA & OLA"). Pas d'invention de thème hors syllabus.
6. \`scenario\` = \`null\` pour les questions directes ; sinon 1 à 3 phrases décrivant un contexte **réaliste et propre au métier** ciblé par ${cert} (pas de scénario générique interchangeable).
7. Ne pas préfixer les propositions par des lettres (A, B, C…). L'ordre du tableau suffit.
8. Ne pas inclure d'explications, ni de références, ni de rubriques supplémentaires (le JSON reste strict et minimal).
9. **Distracteurs plausibles** : les mauvaises réponses doivent être proches de la bonne, crédibles pour un candidat mal préparé, et utiliser le même vocabulaire officiel. Pas de fausses réponses évidentes ou absurdes - c'est ce qui rend le vrai examen difficile.
10. **Diversité des compétences testées** : sur les ${count} questions, aucune paire ne doit tester exactement le même concept ou la même distinction. Vise la couverture maximale du syllabus. Si un thème manque de variété, privilégie des scénarios originaux plutôt que d'empiler des questions de définition.
11. **Répartition selon le blueprint** : si l'organisme publie les poids des domaines (ex. Cisco publie le % de chaque domaine dans CCNA), respecte cette proportion sur les ${count} questions.
12. **Cohérence version** : n'utilise que les concepts, termes et pratiques de la **version actuellement en vigueur** identifiée à l'étape de recherche. Pas de mélange avec des versions retirées.
13. **Échappement JSON** : si une string contient un guillemet double, une accolade JSON, un extrait de code ou une commande CLI, tu **échappes chaque guillemet interne** avec un antislash (\`\\"\`). Exemple valide : \`"text": "{\\"key\\": \\"value\\"}"\`. Une string mal échappée casse tout le tableau - vérifie mentalement chaque \`text\`, \`question\` et \`scenario\` avant de renvoyer le JSON.
14. **\`explanation\` obligatoire** - 1 à 3 phrases qui expliquent **pourquoi** la bonne réponse est la meilleure, avec référence au concept exact du syllabus. Ne recopie pas l'énoncé, ne dis pas juste "c'est la bonne réponse".
15. **\`rationale\` obligatoire sur chaque proposition** - 1 phrase par distracteur qui explique **pourquoi ce n'est pas la bonne réponse** (concept voisin confondu, terminologie détournée, cas limite). Sur la bonne réponse, \`rationale\` confirme brièvement pourquoi elle l'emporte. C'est ce qui transforme le quiz en apprentissage réel.
16. **INTERDIT : tiret cadratin (—, U+2014)** dans TOUS les champs (\`topic\`, \`scenario\`, \`question\`, \`answers[].text\`, \`rationale\`, \`explanation\`). Le tiret cadratin est une signature typique de contenu généré par IA et rend la plateforme robotique. Utilise à la place : le tiret standard (\`-\`), la virgule, les deux-points, les parenthèses ou une phrase complète. Exemple : au lieu de \`"Principe — Focus on Value"\` écris \`"Principe : Focus on Value"\` ou \`"Principe Focus on Value"\`. Au lieu de \`"il est rapide — presque instantané"\` écris \`"il est rapide, presque instantané"\`.

# TYPES À DISTRIBUER ÉQUITABLEMENT

- **Directes** : "Quelle affirmation est correcte ?" avec 4 propositions.
- **QCM classiques** : "Parmi les propositions suivantes, laquelle décrit le mieux X ?"
- **Scénarios** : contexte concret (utilisateur, incident, service…) + question ciblée. Remplis alors \`scenario\`.

# EXEMPLE VALIDE

[
  {
    "topic": "Principes directeurs",
    "scenario": null,
    "question": "Quel principe directeur ITIL recommande de ne pas repartir de zéro et de tirer parti de ce qui existe déjà ?",
    "explanation": "Le principe 'Commencer là où vous êtes' invite à évaluer l'existant (processus, outils, capacités) avant toute transformation. Il évite l'effet 'table rase' qui gaspille des investissements passés et masque des points forts.",
    "answers": [
      { "text": "Progresser par itération avec des retours", "correct": false, "rationale": "Ce principe concerne le rythme du changement (petites étapes + feedback), pas la valorisation de l'existant." },
      { "text": "Se concentrer sur la valeur", "correct": false, "rationale": "Ce principe cible la finalité (valeur pour le consommateur), pas la posture initiale d'analyse de l'état courant." },
      { "text": "Commencer là où vous êtes", "correct": true, "rationale": "Formulation exacte du principe qui prône l'inventaire de l'existant avant toute refonte." },
      { "text": "Optimiser et automatiser", "correct": false, "rationale": "Ce principe vient plus tard dans la démarche (optimiser puis automatiser), il ne parle pas du point de départ." }
    ]
  },
  {
    "topic": "Gestion des incidents",
    "scenario": "Un utilisateur signale que son application métier est très lente depuis 30 minutes. Plusieurs collègues du même service sont concernés.",
    "question": "Quelle pratique ITIL est la plus adaptée en priorité ?",
    "explanation": "L'objectif immédiat est de restaurer le fonctionnement normal du service. C'est la définition exacte du but de la gestion des incidents - trouver la cause racine viendra ensuite via la gestion des problèmes.",
    "answers": [
      { "text": "Gestion des changements", "correct": false, "rationale": "Pratique déclenchée pour introduire une modification contrôlée, pas pour réagir à une dégradation subie." },
      { "text": "Gestion des incidents", "correct": true, "rationale": "Confirme : la restauration rapide du service en cas de dégradation est le cœur de cette pratique." },
      { "text": "Gestion des mises en production", "correct": false, "rationale": "Cette pratique orchestre les déploiements - hors sujet quand il s'agit de rétablir un service existant." },
      { "text": "Gestion des demandes de service", "correct": false, "rationale": "Elle traite des requêtes standard planifiées (nouveau compte, nouvel équipement), pas des incidents non planifiés." }
    ]
  }
]

# EXÉCUTION

Étapes dans l'ordre, silencieusement (aucun de ces intermédiaires ne doit apparaître dans ta réponse) :

1. Recherche web sur la version en vigueur de ${cert}, le syllabus officiel et les évolutions récentes.
2. Établis mentalement la liste des domaines et leur poids.
3. Répartis ${count} questions selon ces poids en assurant qu'aucun angle du programme n'est doublonné.
4. Pour chaque question : identifie l'objectif d'apprentissage, choisis un piège pédagogique, rédige un énoncé et 4 propositions dont 3 distracteurs crédibles.
5. Produis le JSON final.

Rédige maintenant ${count} questions **en ${langLabel} (${langNative})** que tu jugerais dignes de figurer dans l'examen officiel ${cert}, réparties entre directes, QCM et scénarios, chacune spécifiquement ancrée dans un objectif du syllabus courant. Style, difficulté et vocabulaire de l'épreuve - toutes tes propres créations.${existing.length ? ` RAPPEL : aucune des questions générées ne doit reprendre - même reformulée - une question de la liste ci-dessus.` : ''}

Si ta recherche web ne t'a pas permis d'identifier avec certitude le syllabus courant de ${cert}, réponds \`[]\` - mieux vaut zéro question qu'une question inventée.

Commence ta réponse par \`[\`. Aucun texte, aucune balise, aucun mot avant.`;
}

function stripFences(raw) {
    let s = raw.trim();
    s = s.replace(/^```(?:json|js|javascript)?\s*\n?/i, '');
    s = s.replace(/\n?```\s*$/i, '');
    return s.trim();
}

/** Trouve le premier tableau JSON de haut niveau et ignore tout ce qui suit (footnotes, prose, refs [1]: …). */
function extractTopLevelArray(raw) {
    const s = stripFences(raw);
    const start = s.indexOf('[');
    if (start < 0) return s;
    let depth = 0, inString = false, escape = false;
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
    return s.slice(start);
}

/**
 * Cas ChatGPT courant : une valeur "text": "{"key":"value"}" contient un objet JSON
 * dont les guillemets internes n'ont pas été échappés. Cette fonction détecte ce cas
 * (pattern "clé": "{ ou "clé": "[) et échappe les guillemets internes.
 */
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
            const openerPos = i + m[1].length; // position of the opener char
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
            // j is now just past the matching closer

            if (depth === 0 && j < n && raw[j] === '"' && sawInnerQuote) {
                const inner = raw.slice(openerPos, j); // from opener to closer inclusive
                const escaped = inner.replace(/"/g, '\\"');
                out += prefix + escaped;
                i = j; // continue from the closing string quote
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
    if (!payload.trim()) {
        return { status: 'empty', count: 0, items: [], error: null, repaired: null, cleanedPayload: null };
    }
    const extracted = extractTopLevelArray(payload);
    let parsed;
    let repaired = null;
    let cleanedPayload = extracted;
    try {
        parsed = JSON.parse(extracted);
    } catch (initialError) {
        // Try auto-repair for unescaped inner quotes in JSON string values
        const attempt = repairUnescapedJsonInStrings(extracted);
        if (attempt.count > 0) {
            try {
                parsed = JSON.parse(attempt.repaired);
                repaired = attempt.count;
                cleanedPayload = attempt.repaired;
            } catch {
                return { status: 'error', count: 0, items: [], error: initialError.message || t('admin.questions_import.error_json_invalid'), repaired: null, cleanedPayload: null };
            }
        } else {
            return { status: 'error', count: 0, items: [], error: initialError.message || t('admin.questions_import.error_json_invalid'), repaired: null, cleanedPayload: null };
        }
    }
    if (!Array.isArray(parsed)) {
        return { status: 'error', count: 0, items: [], error: t('admin.questions_import.error_root_array'), repaired: null, cleanedPayload: null };
    }
    const items = parsed.map((q, i) => {
        const warnings = [];
        const question = String(q?.question || '').trim();
        if (!question) warnings.push(t('admin.questions_import.warning_missing_question'));
        const answers = Array.isArray(q?.answers) ? q.answers : [];
        if (answers.length < 2 || answers.length > 6) warnings.push(t('admin.questions_import.warning_answers_range', { count: answers.length }));
        const correct = answers.filter((a) => a?.correct === true).length;
        if (correct !== 1) warnings.push(t('admin.questions_import.warning_correct_count', { count: correct }));
        if (answers.some((a) => !String(a?.text || '').trim())) warnings.push(t('admin.questions_import.warning_empty_answer'));
        const kind = q?.scenario && String(q.scenario).trim() ? t('admin.questions_import.kind_scenario') : t('admin.questions_import.kind_direct');
        return {
            index: i,
            topic: q?.topic || '-',
            preview: question.slice(0, 90) + (question.length > 90 ? '…' : ''),
            answers: answers.length,
            kind,
            warnings,
        };
    });
    const hasError = items.some((it) => it.warnings.length > 0);
    return {
        status: hasError ? 'warnings' : 'ok',
        count: items.length,
        items,
        error: null,
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
                <h2 className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white">
                    {title}
                </h2>
                {subtitle && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function Import({ certifications, default_certification_id, existing_by_cert = {} }) {
    const t = useT();
    const [count, setCount] = useState(20);
    const [copied, setCopied] = useState(false);
    const [showExisting, setShowExisting] = useState(false);
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

    // Si la certif selectionnee n'autorise plus la langue actuellement choisie
    // pour le batch (ex: l'admin change de certif), on retombe sur sa 1re langue.
    useEffect(() => {
        if (!certLanguages.includes(batchLang)) {
            setBatchLang(certLanguages[0]);
        }
    }, [certLanguages, batchLang]);

    const existing = useMemo(
        () => existing_by_cert[form.data.certification_id] || [],
        [existing_by_cert, form.data.certification_id]
    );
    const prompt = useMemo(
        () => buildPrompt(selectedCert?.title, count, existing, batchLang, certLanguages),
        [selectedCert, count, existing, batchLang, certLanguages]
    );
    const analysis = useMemo(() => analyze(form.data.payload, t), [form.data.payload, t]);

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // fallback: select text - user can copy manually
        }
    };

    const openChatGPT = () => {
        window.open('https://chatgpt.com/', '_blank', 'noopener');
    };

    const submit = (e) => {
        e.preventDefault();
        // Use router.post directly with the (possibly auto-repaired) payload.
        setProcessing(true);
        form.clearErrors();
        router.post(
            route('admin.questions.import.store'),
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
        && analysis.count > 0
        && !analysis.items.some((it) => it.warnings.length > 0)
        && !processing;

    return (
        <AppLayout ambient={false}>
            <Head title={t('admin.questions_import.head_title')} />

            <div className="mx-auto max-w-6xl space-y-10">
                {/* Header */}
                <div>
                    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        <Link href={route('admin.dashboard')} className="hover:text-ink-900 dark:hover:text-white">{t('admin.common.dashboard_breadcrumb')}</Link>
                        <span className="text-ink-400">/</span>
                        <Link href={route('admin.questions.index')} className="hover:text-ink-900 dark:hover:text-white">{t('admin.questions_index.title')}</Link>
                        <span className="text-ink-400">/</span>
                        <span className="text-ink-900 dark:text-white">{t('admin.questions_import.breadcrumb')}</span>
                    </div>
                    <SectionLabel>{t('admin.questions_import.section_label')}</SectionLabel>
                    <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink-900 dark:text-white sm:text-5xl">
                        {t('admin.questions_import.title_1')}<br />
                        <span className="text-ink-400 dark:text-ink-500">{t('admin.questions_import.title_2')}</span> {t('admin.questions_import.title_3')}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base text-ink-600 dark:text-ink-300">
                        {t('admin.questions_import.intro')}
                    </p>
                </div>

                {/* Setup */}
                <div className="space-y-5 border-y border-ink-200 py-6 dark:border-ink-800">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                {t('admin.questions_import.target_cert_label')}
                            </label>
                            <div className="flex items-center gap-3">
                                <CertLogo certification={selectedCert} size="lg" />
                                <Select
                                    className="flex-1"
                                    value={form.data.certification_id}
                                    onChange={(v) => form.setData('certification_id', v)}
                                    options={certifications.map((c) => ({
                                        value: c.id,
                                        label: c.title,
                                        logo: c,
                                    }))}
                                    placeholder={t('admin.questions_import.cert_select_placeholder')}
                                    hideLogoInButton
                                />
                            </div>
                            {form.errors.certification_id && (
                                <p className="mt-1 text-xs text-rose-500">{form.errors.certification_id}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                {t('admin.questions_import.count_label')}
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={5}
                                    max={50}
                                    step={5}
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="flex-1 accent-ink-900 dark:accent-white"
                                />
                                <span className="w-12 text-right font-mono text-lg font-medium tabular-nums text-ink-900 dark:text-white">
                                    {count}
                                </span>
                            </div>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                                {t('admin.questions_import.count_hint')}
                            </p>
                        </div>
                    </div>

                    {/* Batch language selector : restreint aux langues assignees a la certif */}
                    <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            {t('admin.questions_import.batch_language_label')}
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
                                    {t('admin.questions_import.single_language_hint')}
                                </p>
                            )}
                        </div>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                            {t('admin.questions_import.prompt_language_hint', { lang: languageLabel(batchLang) })}
                        </p>
                    </div>
                </div>

                {/* EXISTING QUESTIONS */}
                <div className="rounded-2xl border border-ink-200 dark:border-ink-800">
                    <button
                        type="button"
                        onClick={() => setShowExisting((v) => !v)}
                        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                                {t('admin.questions_import.existing_label')}
                            </span>
                            <span className="font-mono text-lg font-medium text-ink-900 dark:text-white">
                                {existing.length}
                            </span>
                            <span className="text-sm text-ink-500">
                                {existing.length === 0
                                    ? t('admin.questions_import.existing_none')
                                    : t('admin.questions_import.existing_some')}
                            </span>
                        </div>
                        {existing.length > 0 && (
                            <Icon.ChevronDown className={`h-4 w-4 text-ink-400 transition-transform ${showExisting ? 'rotate-180' : ''}`} />
                        )}
                    </button>
                    {showExisting && existing.length > 0 && (
                        <div className="max-h-80 overflow-y-auto border-t border-ink-200 dark:border-ink-800">
                            <ul className="divide-y divide-ink-200/60 dark:divide-ink-800/60">
                                {existing.map((q, i) => (
                                    <li key={i} className="grid grid-cols-12 items-start gap-3 px-5 py-3 text-xs">
                                        <span className="col-span-1 font-mono text-ink-400">
                                            {String(q.position || i + 1).padStart(2, '0')}
                                        </span>
                                        <span className="col-span-3 truncate font-mono uppercase tracking-widest text-ink-500">
                                            {q.topic || t('admin.questions_import.existing_no_topic')}
                                        </span>
                                        <span className="col-span-8 text-ink-700 dark:text-ink-200">
                                            {q.scenario && (
                                                <span className="mr-1 text-ink-400">{t('admin.questions_import.existing_scenario')}</span>
                                            )}
                                            {q.question_text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* STEP 01 : Prompt */}
                <div className="space-y-6">
                    <StepHeader
                        n="01"
                        title={t('admin.questions_import.step_01_title')}
                        subtitle={existing.length
                            ? t('admin.questions_import.step_01_subtitle_existing', { count: existing.length })
                            : t('admin.questions_import.step_01_subtitle_empty')}
                    />
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
                        <div className="font-semibold uppercase tracking-widest">{t('admin.questions_import.chatgpt_todo')}</div>
                        <ul className="mt-1.5 space-y-1.5 text-amber-700 dark:text-amber-100/80">
                            <li dangerouslySetInnerHTML={{ __html: t('admin.questions_import.chatgpt_tip_1_html') }} />
                            <li>
                                {t('admin.questions_import.chatgpt_tip_2_prefix')}<code className="rounded bg-amber-500/20 px-1 font-mono">Texte collé.txt</code>{t('admin.questions_import.chatgpt_tip_2_infix')}
                                <code className="mt-1 block rounded bg-amber-500/20 px-2 py-1 font-mono">{t('admin.questions_import.chatgpt_tip_2_command')}</code>
                            </li>
                            <li dangerouslySetInnerHTML={{ __html: t('admin.questions_import.chatgpt_tip_3_html') }} />
                        </ul>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 bg-ink-50/50 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 dark:bg-ink-900/60">
                            <span>{t('admin.questions_import.prompt_header', { title: selectedCert?.title || '-', count, lang: batchLang.toUpperCase() })}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openChatGPT}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium normal-case tracking-normal text-ink-700 transition hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                                >
                                    {t('admin.questions_import.open_chatgpt')}
                                    <Icon.ArrowRight className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={copyPrompt}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal text-white transition ${copied ? 'bg-emerald-600' : 'bg-ink-900 hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100'}`}
                                >
                                    {copied ? (
                                        <>
                                            <Icon.Check className="h-3.5 w-3.5" />
                                            {t('admin.questions_import.copied')}
                                        </>
                                    ) : (
                                        <>
                                            <Icon.Cards className="h-3.5 w-3.5" />
                                            {t('admin.questions_import.copy_prompt')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words bg-white p-4 font-mono text-[12px] leading-relaxed text-ink-800 dark:bg-ink-950/50 dark:text-ink-200">
{prompt}
                        </pre>
                    </div>
                </div>

                {/* STEP 02 : Paste */}
                <div className="space-y-6">
                    <StepHeader
                        n="02"
                        title={t('admin.questions_import.step_02_title')}
                        subtitle={t('admin.questions_import.step_02_subtitle')}
                    />
                    <div className="grid gap-4 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <textarea
                                value={form.data.payload}
                                onChange={(e) => form.setData('payload', e.target.value)}
                                placeholder='[{"topic":"…","scenario":null,"question":"…","answers":[…]}]'
                                spellCheck={false}
                                className="field h-96 resize-none font-mono text-xs leading-relaxed"
                            />
                            {form.errors.payload && (
                                <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
                                    {form.errors.payload}
                                </p>
                            )}
                        </div>
                        <div className="lg:col-span-2">
                            <PreviewPanel analysis={analysis} />
                        </div>
                    </div>
                </div>

                {/* STEP 03 : Import */}
                <div className="space-y-6 border-t border-ink-200 pt-10 dark:border-ink-800">
                    <StepHeader
                        n="03"
                        title={t('admin.questions_import.step_03_title')}
                        subtitle={t('admin.questions_import.step_03_subtitle')}
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
                            {processing
                                ? t('admin.questions_import.importing')
                                : t(
                                    analysis.count > 1
                                        ? 'admin.questions_import.import_plural'
                                        : 'admin.questions_import.import_singular',
                                    { count: analysis.count || 0 }
                                )}
                            {!processing && <Icon.ArrowRight className="h-4 w-4" />}
                        </button>
                        {analysis.status === 'warnings' && (
                            <span className="font-mono text-[11px] uppercase tracking-widest text-amber-600">
                                {t('admin.questions_import.fix_warnings')}
                            </span>
                        )}
                        <Link
                            href={route('admin.questions.index')}
                            className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 dark:hover:text-white"
                        >
                            {t('admin.common.cancel')}
                        </Link>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

function PreviewPanel({ analysis }) {
    const t = useT();
    const border = analysis.status === 'error'
        ? 'border-rose-500/40'
        : analysis.status === 'warnings'
        ? 'border-amber-500/40'
        : analysis.status === 'ok'
        ? 'border-emerald-500/40'
        : 'border-ink-200 dark:border-ink-800';

    return (
        <div className={`h-96 overflow-hidden rounded-2xl border ${border} bg-ink-50/40 dark:bg-ink-900/40`}>
            <div className="flex items-center justify-between border-b border-ink-200 bg-white/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 dark:bg-ink-900/60">
                <span>{t('admin.questions_import.preview_label')}</span>
                {analysis.status === 'ok' && <span className="text-emerald-600">{t('admin.questions_import.preview_ok', { count: analysis.count })}</span>}
                {analysis.status === 'warnings' && <span className="text-amber-600">{t('admin.questions_import.preview_warnings', { count: analysis.count })}</span>}
                {analysis.status === 'error' && <span className="text-rose-600">{t('admin.questions_import.preview_error')}</span>}
                {analysis.status === 'empty' && <span>{t('admin.questions_import.preview_waiting')}</span>}
            </div>
            <div className="h-[calc(100%-33px)] overflow-y-auto p-3 text-xs">
                {analysis.repaired > 0 && (
                    <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                        {t(
                            analysis.repaired > 1
                                ? 'admin.questions_import.auto_repaired_plural'
                                : 'admin.questions_import.auto_repaired_singular',
                            { count: analysis.repaired }
                        )}
                    </div>
                )}
                {analysis.status === 'empty' && (
                    <div className="flex h-full items-center justify-center text-center text-ink-500">
                        {t('admin.questions_import.preview_empty')}
                    </div>
                )}
                {analysis.status === 'error' && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 font-mono text-[11px] leading-relaxed text-rose-600 dark:text-rose-300">
                        {analysis.error}
                        <div className="mt-3 space-y-1.5 text-ink-500">
                            <div className="text-[10px] font-semibold uppercase tracking-widest">{t('admin.questions_import.common_causes')}</div>
                            <div dangerouslySetInnerHTML={{ __html: t('admin.questions_import.cause_1_html') }} />
                            <div dangerouslySetInnerHTML={{ __html: t('admin.questions_import.cause_2_html') }} />
                            <div dangerouslySetInnerHTML={{ __html: t('admin.questions_import.cause_3_html') }} />
                            <div className="pt-1 text-ink-400 normal-case">{t('admin.questions_import.cause_fix')}</div>
                        </div>
                    </div>
                )}
                {(analysis.status === 'ok' || analysis.status === 'warnings') && (
                    <ul className="space-y-2">
                        {analysis.items.map((it) => (
                            <li
                                key={it.index}
                                className={`rounded-lg border p-2.5 ${it.warnings.length ? 'border-amber-500/30 bg-amber-500/5' : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950/40'}`}
                            >
                                <div className="flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                                    <span>#{String(it.index + 1).padStart(2, '0')} · {it.topic}</span>
                                    <span className="text-ink-400">{it.kind} · {it.answers} {t('admin.questions_import.answers_short')}</span>
                                </div>
                                <div className="mt-1 line-clamp-2 text-[12px] text-ink-800 dark:text-ink-200">
                                    {it.preview}
                                </div>
                                {it.warnings.length > 0 && (
                                    <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                                        <svg viewBox="0 0 24 24" className="mt-0.5 h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <path d="M12 9v4M12 17h.01" />
                                        </svg>
                                        {it.warnings.join(' · ')}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
