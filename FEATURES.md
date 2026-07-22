# CertifLoop — À quoi sert la plateforme et ce qui est implémenté

## 1. À quoi sert la plateforme

CertifLoop est un outil d'**entraînement adaptatif aux certifications IT** (ITIL Foundation, CCNA, CompTIA A+, AWS Cloud Practitioner, ouvert à d'autres). L'idée : trois modes complémentaires (cours structuré, flashcards, examen blanc), un algorithme qui insiste sur les questions ratées jusqu'à maîtrise, et une expérience aussi proche que possible du vrai jour J (timer, seuil officiel, sélection aléatoire dans un pool). Le tout est **gratuit pour les 10 000 premiers utilisateurs**, sans carte bancaire ni essai limité.

### Publics cibles

- Junior IT / reconversion qui n'a pas le budget pour un outil premium type Whizlabs.
- Étudiant ou apprenti tech qui veut sortir avec une certif reconnue en plus du diplôme.
- Chef de projet / product manager / avant-vente qui doit dialoguer avec des équipes techniques.
- Consultant ITSM ou ingénieur en évolution qui veut un échauffement quotidien avant le vrai examen.

### Limites assumées (à date)

Les questions et cours sont produits par IA sur base de prompts durcis (recherche web obligatoire, respect du blueprint, refus de "à peu près"). Ils sont utiles en **complément** de la doc officielle, mais ne remplacent pas un manuel PeopleCert / Cisco / CompTIA / AWS.

---

## 2. Fonctionnalités — vue guest (non connecté)

### Home publique

- **Hero** avec titre gradient, sous-titre expliquant la promesse, badge "Méthode — Répétition adaptative".
- **Bloc de stats live** : nombre de certifications, nombre total de questions, date de dernière mise à jour, mention "Gratuit".
- **CTA "Voir la liste des certifications"** avec smooth scroll vers la grille.
- **Colonne droite du hero — teaser interactif Q/R** (guest uniquement) :
  - 3 vraies questions tirées de la DB (une par certif quand possible pour la diversité).
  - Affiche scénario + énoncé + 4 réponses cliquables.
  - Feedback immédiat au clic (vert / rouge, bonne réponse révélée).
  - Progression persistée en `localStorage` — refresh = mêmes questions, mêmes réponses (impossible de contourner par F5).
  - Une fois les 3 questions jouées, gros CTA "Continuer gratuitement" vers l'inscription.
- **Section "Nos promesses"** — bloc plein sur la home, version compacte sur les pages détail (cours gratuits, examens blancs réels, répétition adaptative, toujours à jour).
- **Grille des certifications** avec cards :
  - Logo (uploadé ou initiales en gradient).
  - Badge "Prêt" / "Bientôt".
  - Description courte.
  - Ligne d'infos : `à jour · date` + `valide N ans` + `retrait YYYY` (colorée en orange/rouge selon proximité).
  - Trois stats mono : questions, durée, seuil.
  - Animation stagger à l'apparition.
- **Section "Comment ça marche"** — trois étapes numérotées.
- **Footer** avec liens plateforme, compte, CTA, badge "Tous systèmes opérationnels", nom de marque dynamique.

### Certification hub `/certifications/{slug}`

- URL propre basée sur le slug (`itil-foundation-v5` au lieu de `5`).
- Header avec logo, badges (`X questions`, `Questions à jour · date`, `Valide N ans`, `Retrait le X` avec urgence, `Gratuit`).
- Barre de progression maîtrise (si user connecté avec historique).
- Bloc **"À quoi sert cette certification"** (long_description).
- Encart accentué **"Pourquoi la passer"** (importance carrière).
- Sidebar **"Postes ciblés"** (liste des rôles).
- Bloc **"Durée de validité"** (validity_months + note officielle sur renouvellement).
- Bloc **"Retrait de version"** avec 4 états visuels selon proximité :
  - `> 18 mois` — carte verte, "aucune urgence"
  - `6-18 mois` — carte orange, "retrait programmé"
  - `< 6 mois` — carte rouge pulsante, "encore N jours"
  - `passée` — carte rouge foncé, "version retirée"
- **Trois cartes de mode** en grille (stagger animation) :
  - **Cours** — actif si `course_blocks` non vide, sinon "Bientôt".
  - **Flashcards** — actif dès qu'il y a des questions.
  - **Examen blanc** — actif dès qu'il y a des questions.
- Bandeau compact "100 % gratuit jusqu'à 10 000 utilisateurs" en bas.

### Cours `/certifications/{slug}/cours`

- Rendu lecture longue avec **sommaire sticky à gauche** (IntersectionObserver → highlight de la section active).
- 10 types de blocs supportés (heading, paragraph, list, callout, key_terms, steps, comparison, example, code, summary).
- Date de mise à jour affichée en tête.
- Fallback élégant si aucun cours importé ("bientôt disponible").

### Flashcards `/certifications/{slug}/flashcards`

- Deck mélangé à chaque session.
- Animation 3D flip sur clic / Espace / Entrée.
- Boutons **"Je savais"** / **"À revoir"** avec compteurs live.
- Raccourcis clavier : flèches (naviguer), Espace (retourner), 1/2 (marquer).
- Bouton "Mélanger" pour reset.
- Fin de session avec récap + CTA vers l'examen blanc.

### Auth

- Layout **split-screen** : panneau brand à gauche (features, comptes de test), formulaire épuré à droite.
- Login avec :
  - Champs email + password stylés.
  - Case "Se souvenir de moi".
  - Séparateur "ou".
  - **Bloc dev** avec cartes cliquables pour les comptes admin/user (auto-remplissage des champs).
- Register avec titre "Commence maintenant", bouton "Commencer gratuitement".
- Mot de passe oublié + reset avec le même design.
- **Redirect_to préservé** : cliquer "Se connecter et démarrer" depuis un examen renvoie vers cet examen après auth (via session `url.intended`).

---

## 3. Fonctionnalités — vue utilisateur connecté

### Examen blanc (`/certifications/{slug}/examen`)

- **Page intro** — logo, badges de fraîcheur, 4 stats (durée, questions tirées sur pool, barème officiel, requis pour valider).
- **Barre de maîtrise** (si historique) — répartition maîtrisées / en progrès / à revoir / jamais vues, avec chips colorées.
- **Sélecteur de mode de réponse** avant démarrage :
  - "Sélection puis Suivant" (classique)
  - "Auto-suivant" (avance automatique 320 ms après le clic)
  - Choix persisté en `localStorage`.
- Bouton "Démarrer l'examen" en gros CTA.
- Warning "quitter la page = examen perdu".

### Passage d'examen

- **Top bar sticky** : logo, titre, compteur `répondues/total`, badge mode auto-suivant, timer.
- **Timer** monospace tabular-nums, passe en rouge pulsant sous 60 s, auto-submit à zéro.
- **Barre de progression** fine sous la topbar.
- **Question courante** : badge "Question X/Y", topic pill, scénario en encart brand, énoncé grand format, 4 réponses en cards cliquables.
- **Sélection** : bordure brand + shadow-glow, badge lettre passe en gradient.
- **Auto-suivant** : après clic, badge flash puis avance vers Q suivante automatiquement (300 ms).
- **Navigateur latéral** : grille de boutons carrés colorés (blanc = non répondue, vert = répondue, gradient = en cours). Cliquable pour sauter.
- **Raccourcis clavier** : flèches gauche/droite (naviguer), 1-9 (sélectionner réponse).
- **Boutons Précédent / Suivant / Terminer**.

### Garde-fou de sortie

- **beforeunload** : prompt navigateur natif si fermeture d'onglet / refresh.
- **Interception Inertia** (`router.on('before')`) : montre une **modale custom** au clic sur un lien interne.
- La modale explique les trois conséquences :
  - Avancement perdu (X réponses non enregistrées)
  - Prochaine tentative aura de nouvelles questions dans un ordre différent
  - Cet examen sera comptabilisé comme abandonné
- Boutons "Continuer l'examen" (primary) / "Quitter et perdre" (rouge).
- Garde-fou désactivé automatiquement au submit.

### Page résultat

- **Ring de progression SVG animé** avec pourcentage central, "Réussi" vert / "Échoué" rouge.
- Badges statut et 4 stats (Score, Requis, Écart, Temps).
- Boutons "Recommencer" / "Mes stats" / "Autres examens".
- **Bloc comparaison** (à partir de la 2ᵉ tentative) :
  - Temps (± vs précédente, ↓ vert plus rapide / ↑ rouge plus lent)
  - Score (± en points)
  - Progression % (± en points de pourcentage)
  - Badges "Nouveau record temps" / "Nouveau record score"
  - Rappel des records antérieurs.
- **Bloc maîtrise** — barre 3 couleurs + chips (Maîtrisées / En progrès / À revoir / Jamais vues).
- **Correction** :
  - Par défaut : **uniquement les erreurs**, auto-dépliées.
  - Toggle "Voir tout" / "Erreurs seulement".
  - Cas sans-faute : bloc vert "Sans-faute — bravo".
  - Chaque erreur : scénario, énoncé, ta réponse (rouge) + bonne réponse (verte).

### Statistiques (`/stats`)

- Cachée dans la nav tant que `has_attempts = false` (via `HandleInertiaRequests`).
- **KPIs colorés** : Examens tentés / Réussis / Meilleur score / Moyenne.
- **Graphiques d'évolution par certification** (débloqués à ≥ 5 tentatives) :
  - Composant SVG maison, aucune dépendance externe.
  - Ligne dégradée brand → iris, aire remplie en dégradé.
  - Grille Y à 0/25/50/75/100 %.
  - Ligne de seuil pointillée ambre.
  - Points colorés (vert = réussi, rouge = échoué).
  - Tooltip au survol : `#tentative`, `%`, statut, date.
  - Badge tendance ↑/↓/= depuis la 1ʳᵉ tentative.
  - 4 mini-stats : Meilleur / Moyenne / Réussies / Meilleur temps.
- **Table historique** — toutes les tentatives triées, logo, score, %, statut, durée, date + lien "Voir".

### Profil (`/profile`)

- Header avec avatar généré (initiales gradient), nom, email, badge admin.
- Section **Informations** — nom + email avec toast de confirmation.
- Section **Mot de passe** — courant + nouveau + confirmation.
- Section **Zone dangereuse** — bouton "Supprimer mon compte" avec **modale custom** de confirmation par mot de passe.

---

## 4. Fonctionnalités — administration

Accès réservé aux users avec `role='admin'` via middleware `admin`.

### Dashboard (`/admin`)

- 4 KPI cliquables : Certifications / Questions / Utilisateurs / Tentatives.
- **Actions rapides** :
  - Gérer les certifications
  - Gérer les Q/R
  - Import Q/R via ChatGPT
  - Import cours via ChatGPT
  - Paramètres plateforme

### Certifications (`/admin/certifications`)

- Grille de **cards** avec logo, titre, slug, badges (actif/masqué), stats (questions, durée, requis), **barre de progression "prêt à publier"** (questions_count / total_questions).
- Actions par card : **Questions** (raccourci filtré), **Export JSON**, **Éditer**, **Supprimer** (modale custom).
- Recherche live par titre ou slug.
- Bouton "+ Nouvelle certification".

### Édition d'une certification

- Structure en sections :
  1. **Identité** — titre, slug (auto si vide), description courte.
  2. **Contenu marketing** — description longue, importance, postes ciblés (un par ligne, parsé en JSON).
  3. **Paramètres d'examen** — durée, score requis, questions cible.
  4. **Fraîcheur & validité** — date de dernière vérif des questions, validity_months + note libre, date de retrait de version.
  5. **Cours importé** — carte verte avec compteur de blocs + bouton **"Vider le cours"** (case à cocher qui bascule visuellement en rouge, action au submit) ; carte vide avec raccourci "Importer un cours" sinon.
  6. **Logo & visibilité** — preview du logo, upload avec barre de progression, checkbox "Visible sur la home".
- Barre de submit sticky en bas.

### Questions (`/admin/questions`)

- **Header** avec fil d'ariane, compteur, logo de la cert filtrée en grand.
- **Toolbar** : recherche live (énoncé / topic / scénario), select certification (custom `<Select>` avec logos), bouton "Réinitialiser".
- Boutons "Export JSON", "Import ChatGPT", "+ Nouvelle question".
- **Liste** dense (pas de tableau brut) :
  - Position mono, badges cert/topic/correcte, énoncé tronqué 2 lignes.
  - Actions en icônes (chevron, crayon, poubelle).
  - **Clic expand** : affiche scénario + 4 réponses avec la bonne en vert.
- Pagination avec choix taille de page + toggle "Tout afficher".
- **Modale custom de suppression** avec preview.

### Édition d'une question

- Sections **Contexte** (cert + position + topic), **Énoncé** (scénario optionnel + question), **Réponses**.
- Éditeur de réponses réinventé :
  - Badge lettre auto (A/B/C/D…) — non éditable, se re-numérote au réordonnement.
  - Clic sur le badge = marque cette réponse comme correcte (badge devient vert + check icon, bordure verte, glow).
  - Boutons monter / descendre / retirer par réponse.
  - De 2 à 6 réponses possibles.
- Barre de submit sticky avec récap "4 réponses · B marquée comme bonne".

### Import ChatGPT — Questions

- Wizard 3 étapes : choisis certif → copie prompt → colle JSON.
- **Prompt durci** :
  - Étape préliminaire OBLIGATOIRE de recherche web (version en vigueur, syllabus officiel, poids des domaines, évolutions récentes, forums retours candidats).
  - Interdictions absolues (pas de générique, pas de hors-programme, pas de recopiage protégé, pas de "à peu près").
  - Cadre "chaque question est réfléchie" (domaine, objectif d'apprentissage, piège pédagogique identifiés).
  - Fallback strict : si recherche infructueuse → `[]`.
- Aperçu live à droite pendant que tu colles.
- **Extracteur JSON robuste** — trouve le premier `[` et le `]` qui referme le tableau racine, ignore les footnotes `[1]: https://…` et toute prose ajoutée après.
- Prise en compte des questions déjà en base pour éviter les doublons dans le prompt.

### Import ChatGPT — Cours

- Même pattern que Questions.
- Format en blocs typés (heading, paragraph, list, callout, key_terms, steps, comparison, example, code, summary).
- Aperçu rendu via `BlockRenderer`.
- Même prompt durci avec recherche web et refus d'inventer.

### Export

- Bouton "Export JSON" sur chaque card et dans la toolbar admin/questions.
- Endpoint `GET /admin/certifications/{id}/export`.
- Fichier téléchargeable `certif-{slug}-{date}.json` en UTF-8 pretty-printé.
- Contient toutes les métadonnées de la certif + toutes les questions/réponses avec `correct_letter`.
- Sans prompt embarqué — l'admin colle le JSON dans ChatGPT avec son propre prompt (audit, complétude, propositions).

### Paramètres plateforme (`/admin/settings`)

- Nom de marque personnalisable (60 char max, fallback "CertifLoop").
- Upload de logo (PNG/SVG/JPG, 2 Mo max, preview live, bouton "Retirer").
- Appliqué automatiquement :
  - Nav (desktop + mobile + dropdown user)
  - Footer (bloc marque + copyright)
  - **Favicon** du navigateur
  - **Balise `<title>`** des onglets (via `window.__BRAND_NAME__`)
- Nom splitté automatiquement en CamelCase pour le gradient (Certif + Loop).

---

## 5. Moteur d'apprentissage adaptatif

Table `user_question_stats` : par user × question, on stocke `times_seen`, `times_correct`, `times_wrong`, `correct_streak`, `last_result`, `last_seen_at`.

### Algorithme de sélection au start d'examen

1. **Toutes les questions actuellement ratées** (`last_result = 'wrong'`), triées par `times_wrong` desc puis mélangées dans chaque niveau.
2. Complétées par les **jamais vues** (shuffled).
3. Puis les **en progrès** (`correct_streak = 1`).
4. Puis les **maîtrisées** (`correct_streak ≥ 2`) — dernier recours.
5. Ordre final aléatoire.

Résultat vérifié : si tu rates 10 questions, à la session suivante les 10 reviennent (dans un ordre différent). Une question maîtrisée sort de la rotation active.

### Enregistrement au submit

Après soumission, chaque `AttemptAnswer` met à jour le stat correspondant (`times_seen++`, `is_correct` → `times_correct++` + `correct_streak++`, sinon `times_wrong++` + `correct_streak = 0`, `last_result` maj, `last_seen_at = now`).

---

## 6. Système de brand & UI

- **Design system** dans `resources/css/app.css` : fonts Inter + JetBrains Mono, palette `ink` (10 nuances) + `brand` (10 nuances teal) + `iris` (accent secondaire).
- Utilitaires `.btn-primary/secondary/ghost`, `.card`, `.card-lift`, `.field`, `.field-label`, `.badge-*`, `.gradient-text`, `.glass-nav`, `.divider-dot`.
- Dark mode par défaut (via `class`), fond `#0b0f17`.
- **Aucun emoji** dans le codebase — tous les pictogrammes passent par le composant `<Icon />` (`resources/js/Components/Icons.jsx`), lui-même SVG inline (30+ icônes : Check, Close, ArrowLeft/Right/Up/Down, Refresh, Book, Cards, Timer, Trophy, Target, Sparkles, Bolt, Hand, Shuffle, ChevronDown, Menu, Logo, User, LogOut, Chart, Sun, Moon, Shield, Heart, Mail, Github, Equal).
- **Animations** dans Tailwind config : `fade-up`, `fade-in`, `scale-in`, `stagger-in`, `toast-in/out/progress`, `shimmer`, `float`, `marquee-scroll`, `marquee-scroll-v`.
- **Transitions de page** : `<main key={page.url} className="animate-fade-up">` dans les layouts — chaque nav Inertia rejoue une entrée en fade-up.
- **Toaster** (`resources/js/Components/Toaster.jsx`) : notifications bottom-right, slide-in animé, barre de progression de dismiss, 3 variants (success/error/info), écoute automatique des flash Laravel.
- **Smooth scroll** global (`scroll-behavior: smooth`) + `scroll-margin-top: 6rem` sur toutes les sections pour ne pas passer sous la navbar sticky.
- **`prefers-reduced-motion`** respecté : toutes les animations passent en 0.01ms.

---

## 7. Infrastructure technique

- **Backend** : Laravel 11, Inertia, SQLite (dev), PHP 8.2+.
- **Frontend** : React 18, Vite, Tailwind CSS 3, `@inertiajs/react`.
- **Auth** : Laravel Breeze (React stack).
- **Route model binding par slug** pour toutes les routes publiques certif.
- **Middleware `admin`** — alias enregistré dans `bootstrap/app.php`, refuse 403 si `user.role !== 'admin'`.
- **HandleInertiaRequests** partage globalement : `auth.user` (avec `has_attempts`), `settings` (brand_name, brand_logo_path), `flash` (success/error).
- **AppServiceProvider** partage `brandName` + `brandLogoUrl` à toutes les vues Blade via `View::composer('*', ...)` → utilisé pour `<title>` et `<link rel="icon">`.
- **Cache** : settings mis en cache forever, invalidé sur `saved`/`deleted`.
- **Trait `ExtractsJsonArray`** partagé entre les controllers admin d'import — parseur robuste qui isole le premier tableau JSON de haut niveau.

### Migrations (chronologiques)

- `create_users_table` (Breeze de base) + `add_role_to_users_table`
- `create_certifications_table` (+ `add_content_fields`, `add_validity`, `add_version_retires_at`, `add_course_blocks`)
- `create_questions_table`
- `create_answers_table`
- `create_attempts_table` (+ `add_position_to_attempt_answers`)
- `create_attempt_answers_table`
- `create_user_question_stats_table`
- `create_settings_table`

### Seeders

- `AdminUserSeeder` — admin + user de démo (`password`).
- `SettingSeeder` — restaure brand_name + brand_logo_path depuis `database/seeders/data/settings.json`, recopie le logo dans `storage/app/public/brand/`.
- `CertificationSeeder` — **snapshot restore** depuis `database/seeders/data/certifications.json` et `questions.json`, recopie les logos dans `storage/app/public/logos/`, purge et réinsère toutes les questions.
- `ItilFoundationSeeder` — no-op (absorbé dans le snapshot).

`php artisan migrate:fresh --seed` restaure à l'identique : 4 certifs, 170 questions, 680 réponses, 2 users, 2 settings, 3 fichiers logo.

### Endpoints principaux

| Méthode | URL | Fonction |
|---|---|---|
| GET | `/` | Home publique + teaser guest |
| GET | `/certifications/{slug}` | Hub 3 modes |
| GET | `/certifications/{slug}/cours` | Cours |
| GET | `/certifications/{slug}/flashcards` | Flashcards |
| GET | `/certifications/{slug}/examen` | Intro examen |
| POST | `/certifications/{slug}/start` | Créer une tentative (auth) |
| GET | `/exam/{attempt}` | Passer l'examen |
| POST | `/exam/{attempt}/submit` | Soumettre |
| GET | `/exam/{attempt}/result` | Résultat |
| GET | `/stats` | Statistiques user (auth) |
| — | `/admin/*` | Console admin (auth + role admin) |
| GET | `/admin/certifications/{id}/export` | Export JSON Q/R |
| GET/POST | `/admin/settings` | Brand name + logo |
