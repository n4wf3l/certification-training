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

    // Multilingue = la certif a plusieurs langues actives. On demande alors à GPT
    // de produire chaque champ localisable comme un objet { code_langue: valeur }
    // au lieu d'une string, pour peupler questions.translations en un seul batch.
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

    const existingBlock = existing.length
        ? `

## QUESTIONS DÉJÀ EN BASE - NE LES REPRODUIS PAS

Il y a déjà ${existing.length} question${existing.length > 1 ? 's' : ''} en base pour ${cert}. Les nouvelles questions doivent porter sur d'autres thèmes ou d'autres angles. Ne reformule pas les mêmes questions sous un autre habillage : varie le sujet, le scénario testé, l'angle abordé.

Voici la liste (thème - énoncé) :

${existing.map((q, i) => `${String(i + 1).padStart(2, '0')}. [${q.topic || 'sans thème'}] ${q.question_text.replace(/\s+/g, ' ').trim()}`).join('\n')}
`
        : '';

    // En mode multilingue on demande a GPT de produire chaque champ localisable
    // comme un objet { lang: value } couvrant toutes les langues actives. En mode
    // mono-langue on garde le format string historique (retro-compat).
    const linguisticContract = isMultilingual
        ? `# CONTRAT LINGUISTIQUE MULTILINGUE (LECTURE OBLIGATOIRE)

La certification ${cert} est active sur notre plateforme dans **${certLanguages.length} langues** :
${certLangsListLines}

**Chaque question doit être produite dans TOUTES ces langues simultanément.** Un batch = ${count} questions x ${certLanguages.length} langues.

Concretement, chaque champ localisable devient un **objet JSON** dont les cles sont les codes de langue ISO 639-1 et les valeurs sont les traductions correspondantes :
- \`topic\`, \`scenario\`, \`question\`, \`explanation\` : \`{ ${certLanguages.map((c) => `"${c}": "..."`).join(', ')} }\`
- \`answers[].text\` et \`answers[].rationale\` : meme forme.
- \`scenario\` peut valoir \`null\` (question directe) - dans ce cas la valeur est \`null\` tout court, pas un objet.
- \`answers[].correct\` reste un booleen (la bonne reponse est la meme dans toutes les langues).

**Chaque champ doit contenir une valeur non vide pour CHACUNE des ${certLanguages.length} langues listees.** Manquer une langue casse l'import.

Utilise dans chaque langue le **vocabulaire officiel de l'organisme certificateur pour cette langue** (ex : "Service Value Chain" en EN, "Chaine de valeur des services" en FR, "Cadena de valor del servicio" en ES). Si l'organisme ne publie pas de traduction officielle pour un terme donne dans une langue donnee, garde le terme d'origine en italique markdown (\`*terme*\`) plutot que d'inventer une traduction douteuse.

**Fidelite inter-langues** : les traductions doivent tester exactement le meme objectif d'apprentissage avec la meme reponse correcte. L'ordre des propositions et l'index de la bonne reponse restent identiques dans toutes les langues. Aucun code-switching a l'interieur d'une meme valeur : ne melange pas les langues dans un meme string.`
        : `# CONTRAT LINGUISTIQUE (LECTURE OBLIGATOIRE)

La certification ${cert} est disponible sur notre plateforme dans les langues suivantes : **${certLangsLabel}**.

**Ce batch specifique doit etre redige integralement en ${langDescriptor}.** Aucune exception.

Cela signifie que TOUS les champs texte du JSON de sortie doivent etre en ${langLabel} (${langNative}) :
- \`topic\` : nom du domaine du syllabus dans la terminologie officielle en ${langLabel}
- \`scenario\` : contexte en ${langLabel}
- \`question\` : enonce en ${langLabel}
- \`explanation\` : justification en ${langLabel}
- \`answers[].text\` : chaque proposition en ${langLabel}
- \`answers[].rationale\` : chaque justification en ${langLabel}

Utilise le **vocabulaire officiel de l'organisme certificateur dans cette langue** (ex : "Service Value Chain" en anglais, "Chaine de valeur des services" en francais, "Cadena de valor del servicio" en espagnol). Si l'organisme ne publie pas de traduction officielle pour un terme precis, garde le terme d'origine en italique markdown (\`*terme*\`) plutot que d'inventer une traduction douteuse.

Aucun code-switching : ne melange pas les langues au sein d'une meme question. Si le contenu naturel d'un extrait doit rester dans une autre langue (nom propre, marque, extrait de commande CLI, acronyme technique intraduisible), ce doit etre un fragment identifiable, pas une phrase entiere.`;

    const langMap = (fr, en, more) => {
        const parts = [];
        if (certLanguages.includes('fr')) parts.push(`"fr": "${fr}"`);
        if (certLanguages.includes('en')) parts.push(`"en": "${en}"`);
        certLanguages
            .filter((c) => c !== 'fr' && c !== 'en')
            .forEach((c) => parts.push(`"${c}": "${more || '...'}"`));
        // fallback si ni FR ni EN n'est present : premiere langue seulement
        if (parts.length === 0 && certLanguages.length > 0) {
            parts.push(`"${certLanguages[0]}": "${fr}"`);
        }
        return `{ ${parts.join(', ')} }`;
    };

    const formatSection = isMultilingual
        ? `# FORMAT DE SORTIE (STRICT)

Un tableau JSON valide, sans texte avant, sans texte apres, sans balises \`\`\`, sans commentaire. Chaque champ localisable est un objet { code_langue: valeur } couvrant les ${certLanguages.length} langues actives.

Il existe **3 formes de questions** que tu peux produire (voir "Types de questions" plus bas). Le champ \`question_type\` est optionnel : s'il est absent, la question est traitee comme un QCM a choix unique.

## FORME 1 - Choix unique (question_type: "single_choice", ou absent)

Exactement **1 seule** proposition avec \`"correct": true\`.

{
  "question_type": "single_choice",
  "topic": ${langMap('Theme court', 'Short topic')},
  "scenario": null,
  "question": ${langMap("Enonce", 'Stem')},
  "explanation": ${langMap('Pourquoi la bonne reponse est la bonne.', 'Why the correct answer is correct.')},
  "answers": [
    { "text": ${langMap('Proposition A', 'Answer A')}, "correct": false, "rationale": ${langMap("Piege : ...", 'Trap: ...')} },
    { "text": ${langMap('Proposition B', 'Answer B')}, "correct": true, "rationale": ${langMap("Confirme la bonne reponse.", 'Confirms the correct answer.')} },
    { "text": ${langMap('Proposition C', 'Answer C')}, "correct": false, "rationale": ${langMap('Distracteur : ...', 'Distractor: ...')} },
    { "text": ${langMap('Proposition D', 'Answer D')}, "correct": false, "rationale": ${langMap('Idem', 'Same')} }
  ]
}

## FORME 2 - Choix multiples (question_type: "multi_select")

**2 ou 3** propositions avec \`"correct": true\`. Le stem DOIT indiquer combien de reponses choisir : ex. "Choisissez DEUX propositions" / "Select TWO options". Notation tout-ou-rien : le candidat doit cocher exactement le bon sous-ensemble.

{
  "question_type": "multi_select",
  "topic": ${langMap('Theme court', 'Short topic')},
  "scenario": null,
  "question": ${langMap("Choisissez DEUX affirmations correctes concernant ...", 'Select TWO correct statements about ...')},
  "explanation": ${langMap('Pourquoi ces deux reponses sont correctes ensemble.', 'Why these two answers are jointly correct.')},
  "answers": [
    { "text": ${langMap('Proposition A', 'Answer A')}, "correct": true, "rationale": ${langMap("Confirme A.", 'Confirms A.')} },
    { "text": ${langMap('Proposition B', 'Answer B')}, "correct": false, "rationale": ${langMap("Distracteur B.", 'Distractor B.')} },
    { "text": ${langMap('Proposition C', 'Answer C')}, "correct": true, "rationale": ${langMap('Confirme C.', 'Confirms C.')} },
    { "text": ${langMap('Proposition D', 'Answer D')}, "correct": false, "rationale": ${langMap('Distracteur D.', 'Distractor D.')} },
    { "text": ${langMap('Proposition E', 'Answer E')}, "correct": false, "rationale": ${langMap('Distracteur E.', 'Distractor E.')} }
  ]
}

## FORME 3 - Association (question_type: "matching")

**Pas de tableau \`answers\`.** A la place, un tableau \`matching_pairs\` de **3 a 6 paires** \`{left, right}\`. Chaque \`left\` et \`right\` est un objet { code_langue: valeur } comme les autres champs localisables. Le stem doit indiquer clairement le principe d'appariement (ex. "Associez chaque protocole a sa couche OSI").

{
  "question_type": "matching",
  "topic": ${langMap('Theme court', 'Short topic')},
  "scenario": null,
  "question": ${langMap("Associez chaque element de gauche a son element correspondant a droite.", 'Match each item on the left to its corresponding item on the right.')},
  "explanation": ${langMap('Reference au syllabus qui definit ces correspondances.', 'Reference to the syllabus that defines these mappings.')},
  "matching_pairs": [
    { "left": ${langMap('Concept 1', 'Concept 1')}, "right": ${langMap('Definition 1', 'Definition 1')} },
    { "left": ${langMap('Concept 2', 'Concept 2')}, "right": ${langMap('Definition 2', 'Definition 2')} },
    { "left": ${langMap('Concept 3', 'Concept 3')}, "right": ${langMap('Definition 3', 'Definition 3')} },
    { "left": ${langMap('Concept 4', 'Concept 4')}, "right": ${langMap('Definition 4', 'Definition 4')} }
  ]
}

**Sortie finale : un unique tableau JSON contenant ${count} questions, panachees entre les 3 formes selon la repartition demandee plus bas.**`
        : `# FORMAT DE SORTIE (STRICT)

Un tableau JSON valide, sans texte avant, sans texte apres, sans balises \`\`\`, sans commentaire.

Il existe **3 formes de questions** que tu peux produire (voir "Types de questions" plus bas). Le champ \`question_type\` est optionnel : s'il est absent, la question est traitee comme un QCM a choix unique.

## FORME 1 - Choix unique (question_type: "single_choice", ou absent)

Exactement **1 seule** proposition avec \`"correct": true\`.

{
  "question_type": "single_choice",
  "topic": "Theme court",
  "scenario": null,
  "question": "Enonce",
  "explanation": "Pourquoi la bonne reponse est la bonne.",
  "answers": [
    { "text": "Proposition A", "correct": false, "rationale": "Piege : pourquoi cette reponse semble juste mais ne l'est pas." },
    { "text": "Proposition B", "correct": true, "rationale": "Confirme brievement la bonne reponse." },
    { "text": "Proposition C", "correct": false, "rationale": "Distracteur." },
    { "text": "Proposition D", "correct": false, "rationale": "Idem." }
  ]
}

## FORME 2 - Choix multiples (question_type: "multi_select")

**2 ou 3** propositions avec \`"correct": true\`. Le stem DOIT indiquer combien de reponses choisir (ex. "Choisissez DEUX propositions"). Notation tout-ou-rien : le candidat doit cocher exactement le bon sous-ensemble.

{
  "question_type": "multi_select",
  "topic": "Theme court",
  "scenario": null,
  "question": "Choisissez DEUX affirmations correctes concernant ...",
  "explanation": "Pourquoi ces deux reponses sont correctes ensemble.",
  "answers": [
    { "text": "Proposition A", "correct": true, "rationale": "Confirme A." },
    { "text": "Proposition B", "correct": false, "rationale": "Distracteur B." },
    { "text": "Proposition C", "correct": true, "rationale": "Confirme C." },
    { "text": "Proposition D", "correct": false, "rationale": "Distracteur D." },
    { "text": "Proposition E", "correct": false, "rationale": "Distracteur E." }
  ]
}

## FORME 3 - Association (question_type: "matching")

**Pas de tableau \`answers\`.** A la place, un tableau \`matching_pairs\` de **3 a 6 paires** \`{left, right}\`. Le stem doit indiquer clairement le principe d'appariement (ex. "Associez chaque protocole a sa couche OSI").

{
  "question_type": "matching",
  "topic": "Theme court",
  "scenario": null,
  "question": "Associez chaque element de gauche a son element correspondant a droite.",
  "explanation": "Reference au syllabus qui definit ces correspondances.",
  "matching_pairs": [
    { "left": "Concept 1", "right": "Definition 1" },
    { "left": "Concept 2", "right": "Definition 2" },
    { "left": "Concept 3", "right": "Definition 3" },
    { "left": "Concept 4", "right": "Definition 4" }
  ]
}

**Sortie finale : un unique tableau JSON contenant ${count} questions, panachees entre les 3 formes selon la repartition demandee plus bas.**`;

    const rule4 = isMultilingual
        ? `4. **Chaque champ localisable est un objet { code_langue: valeur }** couvrant les ${certLanguages.length} langues actives (${certLangsLabel}). Voir "Contrat linguistique multilingue". Une langue manquante = import casse.`
        : `4. **Questions et reponses integralement en ${langLabel}** (voir "Contrat linguistique" plus haut). L'exemple valide plus bas est ecrit en francais a titre de demonstration de structure uniquement : la sortie que tu produis doit etre en ${langLabel}, pas en francais (sauf si ${langLabel} = Francais).`;

    const exampleSection = isMultilingual
        ? `# EXEMPLE VALIDE (multilingue)

L'exemple ci-dessous couvre les langues actives de la certif. Reproduis exactement cette structure pour chaque question, en fournissant une valeur pour chacune des ${certLanguages.length} langues listees.

[
  {
    "topic": ${langMap('Principes directeurs', 'Guiding principles')},
    "scenario": null,
    "question": ${langMap("Quel principe directeur ITIL recommande de ne pas repartir de zero et de tirer parti de ce qui existe deja ?", 'Which ITIL guiding principle recommends not starting from scratch and leveraging what already exists?')},
    "explanation": ${langMap("Le principe 'Commencer la ou vous etes' invite a evaluer l'existant (processus, outils, capacites) avant toute transformation. Il evite l'effet 'table rase' qui gaspille des investissements passes.", "The 'Start where you are' principle invites you to assess what exists (processes, tools, capabilities) before any transformation. It avoids the 'clean slate' effect that wastes past investments.")},
    "answers": [
      { "text": ${langMap('Progresser par iteration avec des retours', 'Progress iteratively with feedback')}, "correct": false, "rationale": ${langMap("Ce principe concerne le rythme du changement, pas la valorisation de l'existant.", 'This principle addresses the pace of change, not leveraging what exists.')} },
      { "text": ${langMap('Se concentrer sur la valeur', 'Focus on value')}, "correct": false, "rationale": ${langMap("Ce principe cible la finalite (valeur pour le consommateur), pas la posture initiale d'analyse.", 'This principle targets the outcome (value for the consumer), not the initial analytical stance.')} },
      { "text": ${langMap('Commencer la ou vous etes', 'Start where you are')}, "correct": true, "rationale": ${langMap("Formulation exacte du principe qui prone l'inventaire de l'existant avant toute refonte.", 'Exact wording of the principle that promotes taking stock of what exists before any redesign.')} },
      { "text": ${langMap('Optimiser et automatiser', 'Optimise and automate')}, "correct": false, "rationale": ${langMap('Ce principe vient plus tard dans la demarche, il ne parle pas du point de depart.', 'This principle comes later in the approach; it does not address the starting point.')} }
    ]
  }
]`
        : `# EXEMPLE VALIDE

[
  {
    "topic": "Principes directeurs",
    "scenario": null,
    "question": "Quel principe directeur ITIL recommande de ne pas repartir de zero et de tirer parti de ce qui existe deja ?",
    "explanation": "Le principe 'Commencer la ou vous etes' invite a evaluer l'existant (processus, outils, capacites) avant toute transformation. Il evite l'effet 'table rase' qui gaspille des investissements passes et masque des points forts.",
    "answers": [
      { "text": "Progresser par iteration avec des retours", "correct": false, "rationale": "Ce principe concerne le rythme du changement (petites etapes + feedback), pas la valorisation de l'existant." },
      { "text": "Se concentrer sur la valeur", "correct": false, "rationale": "Ce principe cible la finalite (valeur pour le consommateur), pas la posture initiale d'analyse de l'etat courant." },
      { "text": "Commencer la ou vous etes", "correct": true, "rationale": "Formulation exacte du principe qui prone l'inventaire de l'existant avant toute refonte." },
      { "text": "Optimiser et automatiser", "correct": false, "rationale": "Ce principe vient plus tard dans la demarche (optimiser puis automatiser), il ne parle pas du point de depart." }
    ]
  },
  {
    "topic": "Gestion des incidents",
    "scenario": "Un utilisateur signale que son application metier est tres lente depuis 30 minutes. Plusieurs collegues du meme service sont concernes.",
    "question": "Quelle pratique ITIL est la plus adaptee en priorite ?",
    "explanation": "L'objectif immediat est de restaurer le fonctionnement normal du service. C'est la definition exacte du but de la gestion des incidents - trouver la cause racine viendra ensuite via la gestion des problemes.",
    "answers": [
      { "text": "Gestion des changements", "correct": false, "rationale": "Pratique declenchee pour introduire une modification controlee, pas pour reagir a une degradation subie." },
      { "text": "Gestion des incidents", "correct": true, "rationale": "Confirme : la restauration rapide du service en cas de degradation est le coeur de cette pratique." },
      { "text": "Gestion des mises en production", "correct": false, "rationale": "Cette pratique orchestre les deploiements - hors sujet quand il s'agit de retablir un service existant." },
      { "text": "Gestion des demandes de service", "correct": false, "rationale": "Elle traite des requetes standard planifiees (nouveau compte, nouvel equipement), pas des incidents non planifiees." }
    ]
  }
]`;

    const closingLine = isMultilingual
        ? `Redige maintenant ${count} questions **dans les ${certLanguages.length} langues actives (${certLangsLabel})** que tu jugerais dignes de figurer dans l'examen officiel ${cert}, reparties entre directes, QCM et scenarios, chacune specifiquement ancree dans un objectif du syllabus courant. Style, difficulte et vocabulaire de l'epreuve - toutes tes propres creations.${existing.length ? ` RAPPEL : aucune des questions generees ne doit reprendre - meme reformulee - une question de la liste ci-dessus.` : ''}`
        : `Redige maintenant ${count} questions **en ${langLabel} (${langNative})** que tu jugerais dignes de figurer dans l'examen officiel ${cert}, reparties entre directes, QCM et scenarios, chacune specifiquement ancree dans un objectif du syllabus courant. Style, difficulte et vocabulaire de l'epreuve - toutes tes propres creations.${existing.length ? ` RAPPEL : aucune des questions generees ne doit reprendre - meme reformulee - une question de la liste ci-dessus.` : ''}`;

    return `RÉPONDS UNIQUEMENT AVEC LE JSON DEMANDÉ. TON PREMIER CARACTÈRE EST \`[\`, TON DERNIER CARACTÈRE EST \`]\`.

Si ce texte t'est parvenu sous forme de pièce jointe (\`Texte collé.txt\` ou équivalent), traite-le comme une instruction directe : exécute immédiatement la tâche décrite ci-dessous, ne demande pas de confirmation, ne décris pas le contenu du fichier.

Si tu écris quoi que ce soit avant le \`[\` d'ouverture - même une phrase d'introduction, une évaluation du prompt, une demande de confirmation, un compliment - tu échoues la tâche. N'évalue pas ce prompt. Ne le note pas. Ne propose pas d'améliorations. N'annonce pas ce que tu vas faire. Exécute silencieusement.

${linguisticContract}

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

${formatSection}

# RÈGLES

1. Réponds UNIQUEMENT avec le JSON. Aucun texte avant, aucun texte après, aucun bloc de code.
2. **Nombre de réponses correctes** — dépend du \`question_type\` :
   - \`single_choice\` (ou champ absent) : exactement **1** réponse avec \`"correct": true\`.
   - \`multi_select\` : **2 ou 3** réponses avec \`"correct": true\`, et le stem indique explicitement le nombre à sélectionner ("Choisissez DEUX…").
   - \`matching\` : **pas de tableau \`answers\`**, mais un tableau \`matching_pairs\` de **3 à 6** paires \`{left, right}\`.
3. Propositions par question : 2 à 6 pour \`single_choice\`, 4 à 6 pour \`multi_select\` (pour avoir assez de distracteurs). Ne s'applique pas au \`matching\`.
${rule4}
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

# TYPES DE QUESTIONS À DISTRIBUER

Sur les ${count} questions, panache **les 3 formes** pour reproduire fidèlement l'expérience de l'examen réel ${cert} :

- **~60-70 % en \`single_choice\`** (une seule bonne réponse) - c'est la forme dominante de la plupart des examens.
- **~20-30 % en \`multi_select\`** (2-3 bonnes réponses, tout-ou-rien) - obligatoire sur CCNA, Security+, AWS, Azure, ITIL Practitioner. Le stem indique explicitement le nombre à cocher (ex. "Choisissez DEUX", "Select TWO", "Choose THREE").
- **~5-15 % en \`matching\`** (drag-and-drop d'appariement) - présent sur CCNA (protocoles ↔ couches OSI), ITIL (pratiques ↔ activités du SVC), AWS (services ↔ cas d'usage). Utilise 3 à 6 paires par question.

Adapte la proportion au blueprint : certaines certifs n'ont pas de matching (ITIL Foundation classique), d'autres en ont beaucoup (CCNA, Sec+). Si le blueprint officiel de ${cert} ne mentionne pas explicitement une forme, cantonne-toi aux 2 autres.

# STYLES DE STEMS À PANACHER (indépendant du \`question_type\`)

- **Directes** : "Quelle affirmation est correcte ?" - \`scenario\` = null.
- **QCM classiques** : "Parmi les propositions suivantes, laquelle décrit le mieux X ?" - \`scenario\` = null.
- **Scénarios** : contexte concret (utilisateur, incident, service…) + question ciblée. Remplis alors \`scenario\`.

${exampleSection}

# EXÉCUTION

Étapes dans l'ordre, silencieusement (aucun de ces intermédiaires ne doit apparaître dans ta réponse) :

1. Recherche web sur la version en vigueur de ${cert}, le syllabus officiel et les évolutions récentes.
2. Établis mentalement la liste des domaines et leur poids.
3. Répartis ${count} questions selon ces poids en assurant qu'aucun angle du programme n'est doublonné.
4. Pour chaque question : identifie l'objectif d'apprentissage, choisis un piège pédagogique, rédige un énoncé et 4 propositions dont 3 distracteurs crédibles.
5. Produis le JSON final.

${closingLine}

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

/**
 * Extrait une valeur "prevue" d'un champ localisable. Le champ peut etre :
 * - string (mode mono-langue)
 * - object { lang: value } (mode multilingue) — on renvoie la valeur pour
 *   `preferredLang` si presente, sinon la premiere valeur non vide
 * - null / undefined / {}
 *
 * Renvoie une string vide si rien d'exploitable.
 */
function pickLocalizedString(field, preferredLang) {
    if (field == null) return '';
    if (typeof field === 'string') return field.trim();
    if (typeof field === 'object' && !Array.isArray(field)) {
        if (preferredLang && typeof field[preferredLang] === 'string' && field[preferredLang].trim()) {
            return field[preferredLang].trim();
        }
        for (const v of Object.values(field)) {
            if (typeof v === 'string' && v.trim()) return v.trim();
        }
    }
    return '';
}

/**
 * Retourne la liste des langues manquantes pour un champ multilingue attendu.
 * En mono-langue (`certLanguages.length === 1`), on accepte string OU objet.
 * En multilingue, on exige un objet contenant toutes les langues (valeurs non vides).
 * Un champ null/undefined pour un champ NON obligatoire est OK.
 */
function missingLangs(field, certLanguages, { required }) {
    if (field == null || field === '') return required ? [...certLanguages] : [];
    if (typeof field === 'string') {
        // Mode mono-langue accepte, ou GPT a livre en une seule langue :
        // pas de warning au preview, le backend acceptera.
        return [];
    }
    if (typeof field !== 'object' || Array.isArray(field)) {
        return [...certLanguages];
    }
    return certLanguages.filter((lang) => {
        const v = field[lang];
        return typeof v !== 'string' || !v.trim();
    });
}

function analyze(payload, t, certLanguages = [DEFAULT_LANGUAGE]) {
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
    const isMultilingual = certLanguages.length > 1;
    const items = parsed.map((q, i) => {
        const warnings = [];
        const preview = pickLocalizedString(q?.question, certLanguages[0]);
        if (!preview) warnings.push(t('admin.questions_import.warning_missing_question'));

        const qType = (q?.question_type === 'matching' || q?.question_type === 'multi_select')
            ? q.question_type
            : 'single_choice';

        const answers = Array.isArray(q?.answers) ? q.answers : [];
        const matchingPairs = Array.isArray(q?.matching_pairs) ? q.matching_pairs : [];

        if (qType === 'matching') {
            if (matchingPairs.length < 2 || matchingPairs.length > 8) {
                warnings.push(t('admin.questions_import.warning_matching_pairs_range', { count: matchingPairs.length }));
            }
            if (matchingPairs.some((p) => !pickLocalizedString(p?.left, certLanguages[0]) || !pickLocalizedString(p?.right, certLanguages[0]))) {
                warnings.push(t('admin.questions_import.warning_matching_empty_pair'));
            }
        } else {
            if (answers.length < 2 || answers.length > 6) warnings.push(t('admin.questions_import.warning_answers_range', { count: answers.length }));
            const correct = answers.filter((a) => a?.correct === true).length;
            if (qType === 'multi_select') {
                if (correct < 2 || correct > 3) warnings.push(t('admin.questions_import.warning_multi_correct_count', { count: correct }));
            } else {
                if (correct !== 1) warnings.push(t('admin.questions_import.warning_correct_count', { count: correct }));
            }
            if (answers.some((a) => !pickLocalizedString(a?.text, certLanguages[0]))) warnings.push(t('admin.questions_import.warning_empty_answer'));
        }

        // En mode multilingue on verifie que chaque champ contient bien
        // toutes les langues attendues.
        if (isMultilingual) {
            const missingQuestion = missingLangs(q?.question, certLanguages, { required: true });
            if (missingQuestion.length) {
                warnings.push(t('admin.questions_import.warning_missing_langs', { field: 'question', langs: missingQuestion.join(', ') }));
            }
            if (q?.scenario != null && q.scenario !== '') {
                const missingScenario = missingLangs(q.scenario, certLanguages, { required: false });
                if (missingScenario.length) {
                    warnings.push(t('admin.questions_import.warning_missing_langs', { field: 'scenario', langs: missingScenario.join(', ') }));
                }
            }
            if (q?.explanation != null && q.explanation !== '') {
                const missingExplanation = missingLangs(q.explanation, certLanguages, { required: false });
                if (missingExplanation.length) {
                    warnings.push(t('admin.questions_import.warning_missing_langs', { field: 'explanation', langs: missingExplanation.join(', ') }));
                }
            }
            answers.forEach((a, ai) => {
                const missText = missingLangs(a?.text, certLanguages, { required: true });
                if (missText.length) {
                    warnings.push(t('admin.questions_import.warning_missing_langs', { field: `answers[${ai}].text`, langs: missText.join(', ') }));
                }
            });
            matchingPairs.forEach((p, pi) => {
                const missLeft = missingLangs(p?.left, certLanguages, { required: true });
                if (missLeft.length) {
                    warnings.push(t('admin.questions_import.warning_missing_langs', { field: `matching_pairs[${pi}].left`, langs: missLeft.join(', ') }));
                }
                const missRight = missingLangs(p?.right, certLanguages, { required: true });
                if (missRight.length) {
                    warnings.push(t('admin.questions_import.warning_missing_langs', { field: `matching_pairs[${pi}].right`, langs: missRight.join(', ') }));
                }
            });
        }

        const scenarioPreview = pickLocalizedString(q?.scenario, certLanguages[0]);
        let kind;
        if (qType === 'matching') {
            kind = t('admin.questions_import.kind_matching');
        } else if (qType === 'multi_select') {
            kind = t('admin.questions_import.kind_multi');
        } else {
            kind = scenarioPreview ? t('admin.questions_import.kind_scenario') : t('admin.questions_import.kind_direct');
        }
        const topicPreview = pickLocalizedString(q?.topic, certLanguages[0]) || '-';
        return {
            index: i,
            topic: topicPreview,
            preview: preview.slice(0, 90) + (preview.length > 90 ? '…' : ''),
            answers: qType === 'matching' ? matchingPairs.length : answers.length,
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
    const isMultilingualCert = certLanguages.length > 1;
    const [batchLang, setBatchLang] = useState(certLanguages[0]);

    // Si la certif selectionnee n'autorise plus la langue actuellement choisie
    // pour le batch (ex: l'admin change de certif), on retombe sur sa 1re langue.
    // En multilingue le batchLang n'est pas utilise mais on le maintient valide
    // pour ne pas casser useMemo (et pour rebasculer proprement en mono-langue).
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
    const analysis = useMemo(
        () => analyze(form.data.payload, t, certLanguages),
        [form.data.payload, t, certLanguages]
    );

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

                    {/* Batch language selector : restreint aux langues assignees a la certif.
                        En multilingue, on masque le picker (chaque question sera produite dans
                        toutes les langues actives d'un coup) et on affiche un badge recap. */}
                    <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                            {isMultilingualCert
                                ? t('admin.questions_import.multilingual_batch_label')
                                : t('admin.questions_import.batch_language_label')}
                        </label>
                        {isMultilingualCert ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-brand-500 bg-brand-500/10 px-3 py-1.5 text-sm text-brand-700 dark:text-brand-200">
                                    <Icon.Globe className="h-4 w-4" />
                                    <span className="font-semibold">
                                        {t('admin.questions_import.multilingual_badge', { count: certLanguages.length })}
                                    </span>
                                </span>
                                {certLanguages.map((code) => {
                                    const meta = LANGUAGE_CATALOG.find((l) => l.code === code) || { code, label: code, native: code };
                                    return (
                                        <span
                                            key={code}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-600 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300"
                                        >
                                            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                                                {code}
                                            </span>
                                            <span lang={code}>{meta.native}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
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
                                <p className="ml-2 text-xs text-ink-500">
                                    {t('admin.questions_import.single_language_hint')}
                                </p>
                            </div>
                        )}
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                            {isMultilingualCert
                                ? t('admin.questions_import.multilingual_hint', { count: certLanguages.length })
                                : t('admin.questions_import.prompt_language_hint', { lang: languageLabel(batchLang) })}
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
                            <span>{t('admin.questions_import.prompt_header', {
                                title: selectedCert?.title || '-',
                                count,
                                lang: isMultilingualCert
                                    ? t('admin.questions_import.prompt_header_multi', { count: certLanguages.length })
                                    : batchLang.toUpperCase(),
                            })}</span>
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
