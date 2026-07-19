<?php

namespace Database\Seeders;

use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use Illuminate\Database\Seeder;

class ItilFoundationSeeder extends Seeder
{
    public function run(): void
    {
        $cert = Certification::updateOrCreate(
            ['slug' => 'itil-foundation-v5'],
            [
                'title' => 'ITIL Foundation v5',
                'description' => 'Le référentiel mondial de la gestion des services IT.',
                'long_description' => "ITIL est le framework le plus adopté au monde pour structurer la gestion des services IT. La certification Foundation valide ta compréhension du système de valeur ITIL, des sept principes directeurs, des quatre dimensions, du modèle d'amélioration continue et des principales pratiques (gestion des incidents, des problèmes, des changements, des demandes, des niveaux de service). C'est le socle indispensable avant de viser ITIL Practitioner, Managing Professional ou Strategic Leader.",
                'importance' => "Prérequis explicite ou implicite dans la majorité des offres d'encadrement ITSM en France, en Belgique et au Canada. On la retrouve dans les fiches de poste 'Service Manager', 'Change Manager', 'Problem Manager', 'Chef de projet SI' ou 'Product Owner IT'. Elle apparaît comme un critère de sélection dans les grilles RH des grands comptes (banques, telco, secteur public).",
                'target_roles' => [
                    'IT Service Manager',
                    'Service Desk Manager',
                    'Change Manager',
                    'Problem Manager',
                    'ITSM Analyst',
                    'Chef de projet SI',
                    'Product Owner IT',
                    'Consultant ITSM',
                ],
                'logo_path' => null,
                'duration_minutes' => 60,
                'passing_score' => 26,
                'total_questions' => 40,
                'validity_months' => 36,
                'validity_note' => "Depuis la modification de la politique de renouvellement PeopleCert, ITIL Foundation v5 est valide 3 ans à partir de la date de réussite. Pour la maintenir active, trois options avant expiration : accumuler des points CPD via PeopleCert Plus sur 3 ans, réussir une autre certification ITIL, ou repasser le même examen. Les badges officiels délivrés en 2026 portent d'ailleurs une date d'expiration en 2029, ce qui confirme la durée de 3 ans.",
                'version_retires_at' => null,
                'questions_updated_at' => now(),
                'is_active' => true,
            ]
        );

        // Nettoyage : ancienne version si présente
        Certification::where('slug', 'itil-foundation-v4')->delete();

        $cert->questions()->delete();

        foreach ($this->questions() as $index => $q) {
            $question = Question::create([
                'certification_id' => $cert->id,
                'position' => $index + 1,
                'topic' => $q['topic'],
                'scenario' => $q['scenario'],
                'question_text' => $q['question'],
            ]);

            foreach ($q['answers'] as $letter => $answer) {
                Answer::create([
                    'question_id' => $question->id,
                    'letter' => $letter,
                    'answer_text' => $answer['text'],
                    'is_correct' => $answer['correct'],
                ]);
            }
        }
    }

    private function questions(): array
    {
        return [
            // ————————————— Questions 1 à 10 : Valeur, services, principes directeurs
            [
                'topic' => 'Résultat vs sortie',
                'scenario' => "Une équipe informatique livre une nouvelle application dans les délais et respecte toutes les spécifications. Pourtant, les utilisateurs mettent davantage de temps à accomplir leur travail qu’avec l’ancienne application.",
                'question' => "Quelle affirmation est la plus correcte ?",
                'answers' => [
                    'A' => ['text' => "La valeur a été créée puisque toutes les spécifications ont été respectées", 'correct' => false],
                    'B' => ['text' => "Une sortie a été livrée, mais le résultat attendu n’a probablement pas été atteint", 'correct' => true],
                    'C' => ['text' => "Le résultat a été atteint, mais la garantie est insuffisante", 'correct' => false],
                    'D' => ['text' => "Le produit doit automatiquement être considéré comme défectueux", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Valeur et parties prenantes',
                'scenario' => "Une entreprise réduit le prix d’un service, mais augmente fortement les délais de résolution. Certains clients restent satisfaits, tandis que d’autres considèrent le service inutilisable.",
                'question' => "Que montre principalement cette situation ?",
                'answers' => [
                    'A' => ['text' => "La valeur est identique pour toutes les parties prenantes", 'correct' => false],
                    'B' => ['text' => "La valeur dépend uniquement du prix du service", 'correct' => false],
                    'C' => ['text' => "La valeur est perçue différemment selon les parties prenantes et leur contexte", 'correct' => true],
                    'D' => ['text' => "La valeur ne peut être mesurée qu’après la fin du contrat", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Co-création de valeur',
                'scenario' => "Un fournisseur met à disposition une plateforme cloud, tandis que le client reste responsable de la configuration des comptes utilisateurs et de la sécurité de ses données.",
                'question' => "Quel concept cette situation illustre-t-elle le mieux ?",
                'answers' => [
                    'A' => ['text' => "La valeur est créée uniquement par le fournisseur", 'correct' => false],
                    'B' => ['text' => "Le consommateur participe également à la création de valeur et à la gestion des risques", 'correct' => true],
                    'C' => ['text' => "Tous les risques doivent être transférés au fournisseur", 'correct' => false],
                    'D' => ['text' => "Le client n’a aucune responsabilité lorsqu’il utilise un service", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Commencer là où vous êtes',
                'scenario' => "Une organisation prévoit de remplacer son outil de gestion des tickets. Avant de le faire, elle analyse l’outil actuel et découvre que la plupart des problèmes viennent d’une mauvaise configuration.",
                'question' => "Quel principe directeur est principalement appliqué ?",
                'answers' => [
                    'A' => ['text' => "Commencer là où vous êtes", 'correct' => true],
                    'B' => ['text' => "Privilégier la valeur", 'correct' => false],
                    'C' => ['text' => "Collaborer et promouvoir la visibilité", 'correct' => false],
                    'D' => ['text' => "Progresser par itérations avec des retours", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Optimiser et automatiser',
                'scenario' => "Une équipe automatise un processus comportant douze validations. Le processus automatisé reste lent, car dix validations n’apportent aucune valeur.",
                'question' => "Quelle approche aurait été la plus appropriée ?",
                'answers' => [
                    'A' => ['text' => "Automatiser d’abord, puis analyser le processus après plusieurs années", 'correct' => false],
                    'B' => ['text' => "Optimiser le processus avant de l’automatiser", 'correct' => true],
                    'C' => ['text' => "Ajouter davantage de validations automatisées", 'correct' => false],
                    'D' => ['text' => "Transférer le processus à une autre équipe", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Penser et travailler de manière holistique',
                'scenario' => "Une amélioration réduit le temps de traitement du service desk, mais augmente considérablement la charge des équipes réseau et sécurité.",
                'question' => "Quel principe directeur a principalement été négligé ?",
                'answers' => [
                    'A' => ['text' => "Faire simple et pratique", 'correct' => false],
                    'B' => ['text' => "Commencer là où vous êtes", 'correct' => false],
                    'C' => ['text' => "Penser et travailler de manière holistique", 'correct' => true],
                    'D' => ['text' => "Progresser par itérations avec des retours", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Progresser par itérations',
                'scenario' => "Un projet de six mois est divisé en livraisons de deux semaines. Après chaque livraison, les utilisateurs donnent leur avis et les priorités sont ajustées.",
                'question' => "Quel principe est principalement appliqué ?",
                'answers' => [
                    'A' => ['text' => "Privilégier la valeur", 'correct' => false],
                    'B' => ['text' => "Progresser par itérations avec des retours", 'correct' => true],
                    'C' => ['text' => "Optimiser et automatiser", 'correct' => false],
                    'D' => ['text' => "Faire simple et pratique", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Faire simple et pratique',
                'scenario' => "Une équipe produit chaque semaine un rapport de 80 pages. Seules deux pages sont réellement utilisées pour prendre des décisions.",
                'question' => "Quelle action correspond le mieux au principe « Faire simple et pratique » ?",
                'answers' => [
                    'A' => ['text' => "Ajouter davantage de données au rapport", 'correct' => false],
                    'B' => ['text' => "Supprimer le rapport sans consulter les utilisateurs", 'correct' => false],
                    'C' => ['text' => "Conserver les informations utiles et supprimer la complexité inutile", 'correct' => true],
                    'D' => ['text' => "Automatiser la production des 80 pages sans modifier leur contenu", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Collaborer et promouvoir la visibilité',
                'scenario' => "Une organisation veut améliorer l’onboarding informatique. Elle réunit les ressources humaines, le service desk, la sécurité et les managers afin de rendre visibles les dépendances et responsabilités.",
                'question' => "Quel principe est principalement appliqué ?",
                'answers' => [
                    'A' => ['text' => "Collaborer et promouvoir la visibilité", 'correct' => true],
                    'B' => ['text' => "Commencer là où vous êtes", 'correct' => false],
                    'C' => ['text' => "Faire simple et pratique", 'correct' => false],
                    'D' => ['text' => "Optimiser et automatiser", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Privilégier la valeur',
                'scenario' => "Avant de modifier un service, une équipe demande : « Quel bénéfice concret les utilisateurs et l’organisation doivent-ils obtenir ? »",
                'question' => "Quel principe applique-t-elle principalement ?",
                'answers' => [
                    'A' => ['text' => "Penser et travailler de manière holistique", 'correct' => false],
                    'B' => ['text' => "Privilégier la valeur", 'correct' => true],
                    'C' => ['text' => "Commencer là où vous êtes", 'correct' => false],
                    'D' => ['text' => "Progresser par itérations avec des retours", 'correct' => false],
                ],
            ],

            // ————————————— Questions 11 à 17 : Quatre dimensions et facteurs externes
            [
                'topic' => 'Dimension — Organisations et personnes',
                'scenario' => "Une entreprise étudie les compétences requises, les responsabilités, la culture et la résistance au changement avant de déployer un nouvel outil.",
                'question' => "Quelle dimension est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Information et technologie", 'correct' => false],
                    'B' => ['text' => "Organisations et personnes", 'correct' => true],
                    'C' => ['text' => "Partenaires et fournisseurs", 'correct' => false],
                    'D' => ['text' => "Flux de valeur et processus", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Dimension — Information et technologie',
                'scenario' => "Une organisation évalue la qualité des données, les intégrations, les infrastructures et la cybersécurité d’une solution.",
                'question' => "Quelle dimension est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Organisations et personnes", 'correct' => false],
                    'B' => ['text' => "Partenaires et fournisseurs", 'correct' => false],
                    'C' => ['text' => "Information et technologie", 'correct' => true],
                    'D' => ['text' => "Flux de valeur et processus", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Dimension — Flux de valeur et processus',
                'scenario' => "Une entreprise analyse les activités, transferts, délais d’attente et blocages nécessaires pour répondre à une demande utilisateur.",
                'question' => "Quelle dimension est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Flux de valeur et processus", 'correct' => true],
                    'B' => ['text' => "Organisations et personnes", 'correct' => false],
                    'C' => ['text' => "Partenaires et fournisseurs", 'correct' => false],
                    'D' => ['text' => "Information et technologie", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Dimension — Partenaires et fournisseurs',
                'scenario' => "Une organisation compare l’internalisation d’un service avec son externalisation auprès d’un prestataire spécialisé.",
                'question' => "Quelle dimension est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Information et technologie", 'correct' => false],
                    'B' => ['text' => "Partenaires et fournisseurs", 'correct' => true],
                    'C' => ['text' => "Organisations et personnes", 'correct' => false],
                    'D' => ['text' => "Flux de valeur et processus", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Approche holistique des dimensions',
                'scenario' => null,
                'question' => "Pourquoi les quatre dimensions doivent-elles être considérées ensemble ?",
                'answers' => [
                    'A' => ['text' => "Parce qu’une faiblesse dans une dimension peut affecter l’ensemble du service", 'correct' => true],
                    'B' => ['text' => "Parce que chaque dimension doit disposer du même budget", 'correct' => false],
                    'C' => ['text' => "Parce que les quatre dimensions sont toujours gérées par la même équipe", 'correct' => false],
                    'D' => ['text' => "Parce qu’elles remplacent toutes les pratiques ITIL", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Facteurs externes (PESTLE)',
                'scenario' => "Une nouvelle réglementation impose des exigences supplémentaires concernant la conservation des données.",
                'question' => "De quel type de facteur externe s’agit-il principalement ?",
                'answers' => [
                    'A' => ['text' => "Technologique", 'correct' => false],
                    'B' => ['text' => "Économique", 'correct' => false],
                    'C' => ['text' => "Légal", 'correct' => true],
                    'D' => ['text' => "Environnemental", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Facteurs externes — impact multi-dimensions',
                'scenario' => "Une pénurie mondiale de composants augmente les prix et ralentit les livraisons de matériel.",
                'question' => "Pourquoi cette situation doit-elle être prise en compte ?",
                'answers' => [
                    'A' => ['text' => "Parce que les facteurs externes peuvent influencer plusieurs dimensions du service", 'correct' => true],
                    'B' => ['text' => "Parce que seules les équipes financières sont concernées", 'correct' => false],
                    'C' => ['text' => "Parce qu’ITIL exige de changer immédiatement de fournisseur", 'correct' => false],
                    'D' => ['text' => "Parce que les facteurs externes ne peuvent pas être gérés", 'correct' => false],
                ],
            ],

            // ————————————— Questions 18 à 25 : Système de valeur, gouvernance et amélioration
            [
                'topic' => 'Système de valeur ITIL',
                'scenario' => null,
                'question' => "Quel est l’objectif principal du système de valeur ITIL ?",
                'answers' => [
                    'A' => ['text' => "Décrire uniquement les activités du service desk", 'correct' => false],
                    'B' => ['text' => "Montrer comment les composants et activités fonctionnent ensemble pour créer de la valeur", 'correct' => true],
                    'C' => ['text' => "Remplacer tous les processus existants par des procédures standard", 'correct' => false],
                    'D' => ['text' => "Séparer strictement les fournisseurs des consommateurs", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Gouvernance',
                'scenario' => "Le conseil de direction examine les résultats, fixe les orientations et vérifie que l’organisation respecte ses objectifs.",
                'question' => "Quel élément du système de valeur est décrit ?",
                'answers' => [
                    'A' => ['text' => "Gouvernance", 'correct' => true],
                    'B' => ['text' => "Chaîne de valeur des services", 'correct' => false],
                    'C' => ['text' => "Amélioration continue", 'correct' => false],
                    'D' => ['text' => "Pratiques", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Gouvernance — activités',
                'scenario' => null,
                'question' => "Quelles sont les trois activités fondamentales de la gouvernance ?",
                'answers' => [
                    'A' => ['text' => "Planifier, construire et soutenir", 'correct' => false],
                    'B' => ['text' => "Évaluer, diriger et surveiller", 'correct' => true],
                    'C' => ['text' => "Engager, obtenir et livrer", 'correct' => false],
                    'D' => ['text' => "Concevoir, tester et déployer", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratiques ITIL',
                'scenario' => null,
                'question' => "Quelle affirmation décrit le mieux une pratique ITIL ?",
                'answers' => [
                    'A' => ['text' => "Une procédure obligatoire appliquée de manière identique partout", 'correct' => false],
                    'B' => ['text' => "Un ensemble de ressources organisationnelles conçu pour accomplir un travail ou atteindre un objectif", 'correct' => true],
                    'C' => ['text' => "Une activité réalisée uniquement par les équipes techniques", 'correct' => false],
                    'D' => ['text' => "Un document décrivant les étapes d’un processus", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Amélioration continue — culture',
                'scenario' => "Une organisation crée une équipe spécialisée dans l’amélioration continue. Les autres équipes considèrent désormais que les améliorations ne relèvent plus de leur responsabilité.",
                'question' => "Quel est le principal problème ?",
                'answers' => [
                    'A' => ['text' => "L’amélioration continue doit être intégrée dans toute l’organisation", 'correct' => true],
                    'B' => ['text' => "Une équipe spécialisée est interdite par ITIL", 'correct' => false],
                    'C' => ['text' => "Les améliorations ne doivent concerner que la direction", 'correct' => false],
                    'D' => ['text' => "Toutes les améliorations doivent être réalisées par des fournisseurs", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Modèle d’amélioration continue',
                'scenario' => null,
                'question' => "Quelle est la première question du modèle d’amélioration continue ?",
                'answers' => [
                    'A' => ['text' => "Où en sommes-nous actuellement ?", 'correct' => false],
                    'B' => ['text' => "Où voulons-nous être ?", 'correct' => false],
                    'C' => ['text' => "Quelle est la vision ?", 'correct' => true],
                    'D' => ['text' => "Comment y parvenir ?", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Modèle d’amélioration continue',
                'scenario' => "Une équipe définit un objectif d’amélioration sans mesurer les performances actuelles.",
                'question' => "Quelle difficulté cela crée-t-il principalement ?",
                'answers' => [
                    'A' => ['text' => "Il sera difficile d’évaluer précisément les progrès réalisés", 'correct' => true],
                    'B' => ['text' => "L’amélioration deviendra nécessairement trop coûteuse", 'correct' => false],
                    'C' => ['text' => "Aucun changement ne pourra être implémenté", 'correct' => false],
                    'D' => ['text' => "La vision devra être abandonnée", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Amélioration continue — boucle',
                'scenario' => "Une équipe met en œuvre une amélioration et constate qu’elle n’a pas produit les résultats attendus.",
                'question' => "Quelle est la meilleure action ?",
                'answers' => [
                    'A' => ['text' => "Déclarer l’amélioration réussie puisque le changement a été déployé", 'correct' => false],
                    'B' => ['text' => "Analyser les résultats, apprendre et ajuster l’approche", 'correct' => true],
                    'C' => ['text' => "Supprimer toutes les mesures de performance", 'correct' => false],
                    'D' => ['text' => "Revenir automatiquement à l’état initial", 'correct' => false],
                ],
            ],

            // ————————————— Questions 26 à 33 : Flux de valeur et cycle de vie
            [
                'topic' => 'Flux de valeur — définition',
                'scenario' => null,
                'question' => "Qu’est-ce qu’un flux de valeur ?",
                'answers' => [
                    'A' => ['text' => "Une liste des technologies utilisées par l’organisation", 'correct' => false],
                    'B' => ['text' => "Une série d’étapes permettant de créer et fournir de la valeur", 'correct' => true],
                    'C' => ['text' => "Un contrat conclu avec un fournisseur", 'correct' => false],
                    'D' => ['text' => "Une mesure du coût total d’un service", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Cartographie du flux de valeur',
                'scenario' => null,
                'question' => "Pourquoi cartographier un flux de valeur ?",
                'answers' => [
                    'A' => ['text' => "Pour identifier les activités, délais, blocages et opportunités d’amélioration", 'correct' => true],
                    'B' => ['text' => "Pour donner un titre officiel à chaque activité", 'correct' => false],
                    'C' => ['text' => "Pour rendre toutes les équipes indépendantes", 'correct' => false],
                    'D' => ['text' => "Pour supprimer automatiquement les risques", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Flux de valeur — goulots',
                'scenario' => "Une demande de création de compte passe par huit équipes et reste plusieurs jours entre chaque transfert.",
                'question' => "Quel élément doit être examiné en priorité ?",
                'answers' => [
                    'A' => ['text' => "Les transferts et temps d’attente dans le flux de valeur", 'correct' => true],
                    'B' => ['text' => "Le nombre de logiciels utilisés par le demandeur", 'correct' => false],
                    'C' => ['text' => "Le budget annuel de chaque équipe", 'correct' => false],
                    'D' => ['text' => "L’ancienneté des employés", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Cycle de vie — Découverte',
                'scenario' => null,
                'question' => "Lors de la phase de découverte, quelle activité est la plus appropriée ?",
                'answers' => [
                    'A' => ['text' => "Comprendre les besoins, problèmes et opportunités", 'correct' => true],
                    'B' => ['text' => "Déployer immédiatement une solution complète", 'correct' => false],
                    'C' => ['text' => "Fermer les incidents liés au service", 'correct' => false],
                    'D' => ['text' => "Renouveler tous les contrats fournisseurs", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Cycle de vie — Conception',
                'scenario' => null,
                'question' => "Quel est le principal objectif de la conception d’un produit ou service ?",
                'answers' => [
                    'A' => ['text' => "Définir une solution répondant aux besoins et contraintes identifiés", 'correct' => true],
                    'B' => ['text' => "Garantir qu’aucun changement ne sera nécessaire", 'correct' => false],
                    'C' => ['text' => "Réduire le nombre de parties prenantes", 'correct' => false],
                    'D' => ['text' => "Choisir systématiquement la technologie la moins chère", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Cycle de vie — Transition / Support',
                'scenario' => null,
                'question' => "Pourquoi les équipes de support doivent-elles être impliquées avant le lancement d’un nouveau service ?",
                'answers' => [
                    'A' => ['text' => "Pour s’assurer que le service peut être exploité et soutenu efficacement", 'correct' => true],
                    'B' => ['text' => "Pour empêcher les développeurs de modifier le produit", 'correct' => false],
                    'C' => ['text' => "Pour transférer tous les risques au service desk", 'correct' => false],
                    'D' => ['text' => "Pour éliminer la nécessité de documentation", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Cycle de vie — Exploitation',
                'scenario' => "Un produit est techniquement performant, mais aucun processus n’existe pour gérer les accès, les incidents ou les mises à jour.",
                'question' => "Quel est le principal risque ?",
                'answers' => [
                    'A' => ['text' => "Le produit pourrait être difficile à exploiter et à soutenir durant son cycle de vie", 'correct' => true],
                    'B' => ['text' => "Le produit sera automatiquement considéré comme gratuit", 'correct' => false],
                    'C' => ['text' => "La technologie cessera immédiatement de fonctionner", 'correct' => false],
                    'D' => ['text' => "Les utilisateurs ne pourront jamais recevoir de formation", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Cycle de vie complet',
                'scenario' => null,
                'question' => "Pourquoi faut-il considérer l’ensemble du cycle de vie d’un produit ou service ?",
                'answers' => [
                    'A' => ['text' => "Pour tenir compte des impacts à long terme, de l’exploitation jusqu’au retrait", 'correct' => true],
                    'B' => ['text' => "Pour empêcher toute modification après la conception", 'correct' => false],
                    'C' => ['text' => "Pour garantir que le même fournisseur soit toujours utilisé", 'correct' => false],
                    'D' => ['text' => "Pour éviter de recueillir les retours des utilisateurs", 'correct' => false],
                ],
            ],

            // ————————————— Questions 34 à 40 : Mesures, pratiques et scénarios avancés
            [
                'topic' => 'Mesures — indicateurs pertinents',
                'scenario' => "L’objectif est de permettre aux nouveaux employés d’être productifs dès leur premier jour.",
                'question' => "Quel indicateur est le plus directement lié à cet objectif ?",
                'answers' => [
                    'A' => ['text' => "Nombre d’ordinateurs préparés chaque mois", 'correct' => false],
                    'B' => ['text' => "Nombre d’heures prestées par les techniciens", 'correct' => false],
                    'C' => ['text' => "Pourcentage de nouveaux employés disposant de leurs accès et outils au début du premier jour", 'correct' => true],
                    'D' => ['text' => "Nombre total de tickets créés par les ressources humaines", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Mesures — qualité vs volume',
                'scenario' => "Un service desk ferme rapidement les incidents, mais de nombreux tickets sont rouverts.",
                'question' => "Quel indicateur apporterait le plus de valeur ?",
                'answers' => [
                    'A' => ['text' => "Nombre d’incidents fermés par agent", 'correct' => false],
                    'B' => ['text' => "Taux de résolution durable ou taux de réouverture", 'correct' => true],
                    'C' => ['text' => "Nombre d’e-mails envoyés aux utilisateurs", 'correct' => false],
                    'D' => ['text' => "Temps de connexion quotidien des agents", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — Gestion des demandes de service',
                'scenario' => "Un utilisateur demande l’installation d’un logiciel standard déjà approuvé.",
                'question' => "Comment cette demande doit-elle généralement être considérée ?",
                'answers' => [
                    'A' => ['text' => "Comme une demande de service", 'correct' => true],
                    'B' => ['text' => "Comme un problème", 'correct' => false],
                    'C' => ['text' => "Comme un incident majeur", 'correct' => false],
                    'D' => ['text' => "Comme un événement de sécurité", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — Gestion des problèmes',
                'scenario' => "Plusieurs incidents similaires se produisent régulièrement. Les incidents sont résolus temporairement, mais la cause reste inconnue.",
                'question' => "Quelle pratique devrait principalement être utilisée pour réduire la probabilité de récurrence ?",
                'answers' => [
                    'A' => ['text' => "Gestion des demandes de service", 'correct' => false],
                    'B' => ['text' => "Gestion des problèmes", 'correct' => true],
                    'C' => ['text' => "Gestion des niveaux de service", 'correct' => false],
                    'D' => ['text' => "Gestion des fournisseurs", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — Gestion des incidents',
                'scenario' => "Un service critique devient indisponible. L’objectif immédiat est de restaurer son fonctionnement aussi rapidement que possible.",
                'question' => "Quelle pratique est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Gestion des incidents", 'correct' => true],
                    'B' => ['text' => "Gestion des problèmes", 'correct' => false],
                    'C' => ['text' => "Gestion des actifs informatiques", 'correct' => false],
                    'D' => ['text' => "Gestion des relations", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Automatisation et IA',
                'scenario' => "Une organisation souhaite utiliser l’intelligence artificielle pour traiter automatiquement des demandes sensibles.",
                'question' => "Quelle approche est la plus conforme à ITIL ?",
                'answers' => [
                    'A' => ['text' => "Automatiser immédiatement toutes les décisions afin de maximiser la vitesse", 'correct' => false],
                    'B' => ['text' => "Évaluer la valeur, les risques, les contrôles et l’expérience, puis déployer progressivement", 'correct' => true],
                    'C' => ['text' => "Remplacer toutes les interventions humaines dès le premier jour", 'correct' => false],
                    'D' => ['text' => "Utiliser l’IA uniquement parce que les concurrents le font", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Mesures — résultat vs contrat',
                'scenario' => "Un fournisseur respecte tous ses objectifs contractuels, mais les utilisateurs restent insatisfaits parce que le service ne soutient pas correctement leurs activités.",
                'question' => "Quelle conclusion est la plus appropriée ?",
                'answers' => [
                    'A' => ['text' => "Le service est réussi puisque les objectifs contractuels sont atteints", 'correct' => false],
                    'B' => ['text' => "Les mesures utilisées ne reflètent probablement pas suffisamment les résultats et la valeur attendus", 'correct' => true],
                    'C' => ['text' => "La satisfaction des utilisateurs n’est pas pertinente", 'correct' => false],
                    'D' => ['text' => "Les objectifs contractuels doivent toujours être supprimés", 'correct' => false],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SÉRIE 2 — Concepts de service et création de valeur (41-48)
            // ═══════════════════════════════════════════════════════════════
            [
                'topic' => 'Co-création de valeur',
                'scenario' => null,
                'question' => "Quel énoncé décrit le mieux la co-création de valeur ?",
                'answers' => [
                    'A' => ['text' => "Le fournisseur produit seul la valeur avant de livrer le service", 'correct' => false],
                    'B' => ['text' => "La valeur résulte de la collaboration entre plusieurs parties prenantes", 'correct' => true],
                    'C' => ['text' => "Le consommateur détermine seul la valeur financière du service", 'correct' => false],
                    'D' => ['text' => "La valeur existe automatiquement dès qu’un produit est livré", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Résultat — définition',
                'scenario' => null,
                'question' => "Quelle affirmation décrit le mieux un résultat ?",
                'answers' => [
                    'A' => ['text' => "Un élément tangible ou intangible produit par une activité", 'correct' => false],
                    'B' => ['text' => "Un avantage obtenu par une partie prenante grâce à une ou plusieurs sorties", 'correct' => true],
                    'C' => ['text' => "Une ressource configurée par le fournisseur", 'correct' => false],
                    'D' => ['text' => "Une mesure interne du travail accompli", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Sortie vs résultat — cas déploiement',
                'scenario' => "Une équipe déploie 300 ordinateurs dans les délais. Toutefois, la moitié des utilisateurs ne dispose pas des accès nécessaires pour travailler.",
                'question' => "Lequel constitue une sortie ?",
                'answers' => [
                    'A' => ['text' => "Les utilisateurs sont productifs dès leur arrivée", 'correct' => false],
                    'B' => ['text' => "Les 300 ordinateurs ont été déployés", 'correct' => true],
                    'C' => ['text' => "L’expérience utilisateur s’est améliorée", 'correct' => false],
                    'D' => ['text' => "Les risques opérationnels ont été réduits", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Sortie vs résultat — cas déploiement',
                'scenario' => "Une équipe déploie 300 ordinateurs dans les délais. Toutefois, la moitié des utilisateurs ne dispose pas des accès nécessaires pour travailler.",
                'question' => "Dans la même situation, lequel représente le résultat attendu ?",
                'answers' => [
                    'A' => ['text' => "Les cartons des ordinateurs ont été recyclés", 'correct' => false],
                    'B' => ['text' => "Les appareils ont été enregistrés dans l’inventaire", 'correct' => false],
                    'C' => ['text' => "Les utilisateurs peuvent travailler avec tous leurs outils et accès", 'correct' => true],
                    'D' => ['text' => "Trois techniciens ont participé au déploiement", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Valeur — composantes',
                'scenario' => null,
                'question' => "Quelle affirmation concernant la valeur est correcte ?",
                'answers' => [
                    'A' => ['text' => "Elle est déterminée uniquement par le coût", 'correct' => false],
                    'B' => ['text' => "Elle est toujours identique pour toutes les parties prenantes", 'correct' => false],
                    'C' => ['text' => "Elle dépend notamment des résultats, coûts, risques et expériences", 'correct' => true],
                    'D' => ['text' => "Elle ne peut être évaluée qu’à la fin d’un contrat", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Risque — définition',
                'scenario' => null,
                'question' => "Quel élément désigne un événement possible qui pourrait causer une perte ou rendre plus difficile l’atteinte d’un objectif ?",
                'answers' => [
                    'A' => ['text' => "Une sortie", 'correct' => false],
                    'B' => ['text' => "Un risque", 'correct' => true],
                    'C' => ['text' => "Une garantie", 'correct' => false],
                    'D' => ['text' => "Une demande", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Produit — définition',
                'scenario' => null,
                'question' => "Quelle affirmation décrit le mieux un produit ?",
                'answers' => [
                    'A' => ['text' => "Une configuration de ressources conçue pour offrir de la valeur", 'correct' => true],
                    'B' => ['text' => "Une interaction unique entre un utilisateur et le service desk", 'correct' => false],
                    'C' => ['text' => "Un résultat nécessairement financier", 'correct' => false],
                    'D' => ['text' => "Une procédure utilisée pour résoudre les incidents", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Responsabilités partagées',
                'scenario' => "Une entreprise fournit un téléphone professionnel à un employé, mais celui-ci doit respecter les règles de sécurité et signaler rapidement toute perte.",
                'question' => "Que démontre principalement cet exemple ?",
                'answers' => [
                    'A' => ['text' => "Le consommateur ne participe jamais à la gestion des risques", 'correct' => false],
                    'B' => ['text' => "La responsabilité du service appartient uniquement au fournisseur", 'correct' => false],
                    'C' => ['text' => "Fournisseur et consommateur ont chacun des responsabilités", 'correct' => true],
                    'D' => ['text' => "Tous les risques sont automatiquement supprimés par le contrat", 'correct' => false],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SÉRIE 2 — Principes directeurs (49-56)
            // ═══════════════════════════════════════════════════════════════
            [
                'topic' => 'Principe — Commencer là où vous êtes',
                'scenario' => "Une organisation doit améliorer un portail existant. Elle commence par analyser les fonctions actuellement appréciées des utilisateurs.",
                'question' => "Quel principe directeur est principalement appliqué ?",
                'answers' => [
                    'A' => ['text' => "Commencer là où vous êtes", 'correct' => true],
                    'B' => ['text' => "Optimiser et automatiser", 'correct' => false],
                    'C' => ['text' => "Faire simple et pratique", 'correct' => false],
                    'D' => ['text' => "Collaborer et promouvoir la visibilité", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Privilégier la valeur',
                'scenario' => "Une équipe propose une solution techniquement impressionnante, mais personne n’a vérifié qu’elle répond à un besoin réel.",
                'question' => "Quel principe doit être appliqué en priorité ?",
                'answers' => [
                    'A' => ['text' => "Privilégier la valeur", 'correct' => true],
                    'B' => ['text' => "Commencer là où vous êtes", 'correct' => false],
                    'C' => ['text' => "Optimiser et automatiser", 'correct' => false],
                    'D' => ['text' => "Progresser par itérations avec des retours", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Progresser par itérations',
                'scenario' => "Une entreprise déploie d’abord une nouvelle procédure auprès d’un petit groupe, analyse les retours, puis l’ajuste avant le déploiement général.",
                'question' => "Quel principe applique-t-elle principalement ?",
                'answers' => [
                    'A' => ['text' => "Penser et travailler de manière holistique", 'correct' => false],
                    'B' => ['text' => "Progresser par itérations avec des retours", 'correct' => true],
                    'C' => ['text' => "Faire simple et pratique", 'correct' => false],
                    'D' => ['text' => "Commencer là où vous êtes", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Collaborer et promouvoir la visibilité',
                'scenario' => "Des équipes publient un tableau de bord commun montrant les progrès, risques et blocages d’un programme.",
                'question' => "Quel principe est principalement appliqué ?",
                'answers' => [
                    'A' => ['text' => "Collaborer et promouvoir la visibilité", 'correct' => true],
                    'B' => ['text' => "Optimiser et automatiser", 'correct' => false],
                    'C' => ['text' => "Privilégier la valeur", 'correct' => false],
                    'D' => ['text' => "Faire simple et pratique", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Penser et travailler de manière holistique',
                'scenario' => "Une équipe améliore une application sans tenir compte de ses dépendances avec l’authentification, le réseau et le support.",
                'question' => "Quel principe a surtout été négligé ?",
                'answers' => [
                    'A' => ['text' => "Commencer là où vous êtes", 'correct' => false],
                    'B' => ['text' => "Faire simple et pratique", 'correct' => false],
                    'C' => ['text' => "Penser et travailler de manière holistique", 'correct' => true],
                    'D' => ['text' => "Progresser par itérations avec des retours", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Faire simple et pratique',
                'scenario' => "Un formulaire contient 35 champs, mais seulement 10 sont nécessaires au traitement de la demande.",
                'question' => "Quelle est la meilleure action ?",
                'answers' => [
                    'A' => ['text' => "Automatiser immédiatement les 35 champs", 'correct' => false],
                    'B' => ['text' => "Conserver uniquement les informations réellement nécessaires", 'correct' => true],
                    'C' => ['text' => "Ajouter une validation pour chaque champ", 'correct' => false],
                    'D' => ['text' => "Remplacer le formulaire par un document de 20 pages", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principe — Optimiser et automatiser',
                'scenario' => null,
                'question' => "Quel énoncé décrit le mieux le principe Optimiser et automatiser ?",
                'answers' => [
                    'A' => ['text' => "Toute activité humaine doit être supprimée", 'correct' => false],
                    'B' => ['text' => "Il faut automatiser chaque processus avant de le comprendre", 'correct' => false],
                    'C' => ['text' => "Il faut optimiser le travail, puis automatiser lorsque cela apporte de la valeur", 'correct' => true],
                    'D' => ['text' => "L’automatisation est toujours préférable à la collaboration", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Principes directeurs — usage combiné',
                'scenario' => null,
                'question' => "Pourquoi les principes directeurs ne doivent-ils pas être utilisés isolément ?",
                'answers' => [
                    'A' => ['text' => "Parce qu’ils doivent être considérés ensemble selon la situation", 'correct' => true],
                    'B' => ['text' => "Parce qu’un seul principe est applicable dans chaque organisation", 'correct' => false],
                    'C' => ['text' => "Parce qu’ils concernent uniquement la direction", 'correct' => false],
                    'D' => ['text' => "Parce qu’ils sont remplacés par les pratiques", 'correct' => false],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SÉRIE 2 — Quatre dimensions (57-63)
            // ═══════════════════════════════════════════════════════════════
            [
                'topic' => 'Dimension — Organisations et personnes',
                'scenario' => null,
                'question' => "Quelle dimension comprend principalement les compétences, les rôles, la culture et les structures organisationnelles ?",
                'answers' => [
                    'A' => ['text' => "Information et technologie", 'correct' => false],
                    'B' => ['text' => "Organisations et personnes", 'correct' => true],
                    'C' => ['text' => "Partenaires et fournisseurs", 'correct' => false],
                    'D' => ['text' => "Flux de valeur et processus", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Dimension — Information et technologie',
                'scenario' => "Une organisation analyse les bases de données, les applications, les intégrations et les exigences de sécurité.",
                'question' => "Quelle dimension est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Information et technologie", 'correct' => true],
                    'B' => ['text' => "Organisations et personnes", 'correct' => false],
                    'C' => ['text' => "Partenaires et fournisseurs", 'correct' => false],
                    'D' => ['text' => "Flux de valeur et processus", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Dimension — Partenaires et fournisseurs',
                'scenario' => "Une entreprise examine les performances de son fournisseur télécom et les obligations prévues dans le contrat.",
                'question' => "Quelle dimension est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Organisations et personnes", 'correct' => false],
                    'B' => ['text' => "Information et technologie", 'correct' => false],
                    'C' => ['text' => "Partenaires et fournisseurs", 'correct' => true],
                    'D' => ['text' => "Flux de valeur et processus", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Dimension — Flux de valeur et processus',
                'scenario' => "Une équipe cartographie toutes les étapes depuis l’arrivée d’une demande jusqu’à sa réalisation.",
                'question' => "Quelle dimension est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Information et technologie", 'correct' => false],
                    'B' => ['text' => "Flux de valeur et processus", 'correct' => true],
                    'C' => ['text' => "Organisations et personnes", 'correct' => false],
                    'D' => ['text' => "Partenaires et fournisseurs", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Quatre dimensions — équilibre',
                'scenario' => null,
                'question' => "Pourquoi faut-il équilibrer les quatre dimensions ?",
                'answers' => [
                    'A' => ['text' => "Parce qu’une décision dans une dimension peut avoir des conséquences sur les autres", 'correct' => true],
                    'B' => ['text' => "Parce que chaque dimension doit obligatoirement avoir le même responsable", 'correct' => false],
                    'C' => ['text' => "Parce que chaque dimension utilise exactement les mêmes ressources", 'correct' => false],
                    'D' => ['text' => "Parce que les dimensions ne sont pas influencées par l’environnement externe", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Facteurs externes — Légal',
                'scenario' => "Une nouvelle loi impose des restrictions sur le traitement des données personnelles.",
                'question' => "Quel facteur externe est principalement concerné ?",
                'answers' => [
                    'A' => ['text' => "Social", 'correct' => false],
                    'B' => ['text' => "Technologique", 'correct' => false],
                    'C' => ['text' => "Légal", 'correct' => true],
                    'D' => ['text' => "Environnemental", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Facteurs externes — Technologique',
                'scenario' => "De nouvelles technologies rendent possible l’automatisation de tâches auparavant manuelles.",
                'question' => "Quel facteur externe est principalement concerné ?",
                'answers' => [
                    'A' => ['text' => "Politique", 'correct' => false],
                    'B' => ['text' => "Technologique", 'correct' => true],
                    'C' => ['text' => "Légal", 'correct' => false],
                    'D' => ['text' => "Économique", 'correct' => false],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SÉRIE 2 — Système de valeur et gouvernance (64-68)
            // ═══════════════════════════════════════════════════════════════
            [
                'topic' => 'Système de valeur ITIL — objectif',
                'scenario' => null,
                'question' => "Quel est le principal objectif du système de valeur ITIL ?",
                'answers' => [
                    'A' => ['text' => "Garantir que tous les services utilisent les mêmes outils", 'correct' => false],
                    'B' => ['text' => "Faciliter la création de valeur grâce à un ensemble intégré de composants et d’activités", 'correct' => true],
                    'C' => ['text' => "Remplacer la stratégie de l’organisation", 'correct' => false],
                    'D' => ['text' => "Décrire exclusivement le traitement des incidents", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Système de valeur ITIL — composants',
                'scenario' => null,
                'question' => "Lequel des éléments suivants appartient au système de valeur ITIL ?",
                'answers' => [
                    'A' => ['text' => "Les principes directeurs", 'correct' => true],
                    'B' => ['text' => "Le modèle TCP/IP", 'correct' => false],
                    'C' => ['text' => "La structure comptable", 'correct' => false],
                    'D' => ['text' => "Le cycle de développement en cascade uniquement", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Gouvernance — rôle',
                'scenario' => null,
                'question' => "Quel est le rôle principal de la gouvernance ?",
                'answers' => [
                    'A' => ['text' => "Résoudre les incidents techniques", 'correct' => false],
                    'B' => ['text' => "Évaluer, diriger et surveiller l’organisation", 'correct' => true],
                    'C' => ['text' => "Automatiser les demandes courantes", 'correct' => false],
                    'D' => ['text' => "Développer les applications internes", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Gouvernance — Surveiller',
                'scenario' => "La direction vérifie que les investissements numériques soutiennent bien la stratégie globale.",
                'question' => "À quelle activité de gouvernance cela correspond-il principalement ?",
                'answers' => [
                    'A' => ['text' => "Surveiller", 'correct' => true],
                    'B' => ['text' => "Livrer", 'correct' => false],
                    'C' => ['text' => "Soutenir", 'correct' => false],
                    'D' => ['text' => "Obtenir", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — définition',
                'scenario' => null,
                'question' => "Quelle affirmation décrit le mieux une pratique ?",
                'answers' => [
                    'A' => ['text' => "Une procédure détaillée et obligatoire", 'correct' => false],
                    'B' => ['text' => "Un ensemble de ressources organisationnelles conçu pour accomplir un travail ou atteindre un objectif", 'correct' => true],
                    'C' => ['text' => "Un outil utilisé uniquement par le service desk", 'correct' => false],
                    'D' => ['text' => "Une activité qui appartient exclusivement au fournisseur", 'correct' => false],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SÉRIE 2 — Amélioration continue (69-73)
            // ═══════════════════════════════════════════════════════════════
            [
                'topic' => 'Modèle CIM — Vision',
                'scenario' => null,
                'question' => "Quelle question vient en premier dans le modèle d’amélioration continue ?",
                'answers' => [
                    'A' => ['text' => "Où voulons-nous être ?", 'correct' => false],
                    'B' => ['text' => "Comment y parvenir ?", 'correct' => false],
                    'C' => ['text' => "Quelle est la vision ?", 'correct' => true],
                    'D' => ['text' => "Avons-nous atteint notre objectif ?", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Modèle CIM — état actuel',
                'scenario' => null,
                'question' => "Après avoir compris la vision, quelle question doit normalement être examinée ?",
                'answers' => [
                    'A' => ['text' => "Où en sommes-nous actuellement ?", 'correct' => true],
                    'B' => ['text' => "Comment maintenir la dynamique ?", 'correct' => false],
                    'C' => ['text' => "Avons-nous atteint notre objectif ?", 'correct' => false],
                    'D' => ['text' => "Quelle technologie devons-nous acheter ?", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Modèle CIM — référentiel',
                'scenario' => null,
                'question' => "Pourquoi faut-il comprendre l’état actuel ?",
                'answers' => [
                    'A' => ['text' => "Pour disposer d’une référence permettant d’évaluer l’amélioration", 'correct' => true],
                    'B' => ['text' => "Pour empêcher toute modification importante", 'correct' => false],
                    'C' => ['text' => "Pour garantir que la vision est inutile", 'correct' => false],
                    'D' => ['text' => "Pour remplacer les mesures de résultat", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Modèle CIM — évaluation',
                'scenario' => null,
                'question' => "Une amélioration a été mise en œuvre. Quelle question aide principalement à déterminer si elle a fonctionné ?",
                'answers' => [
                    'A' => ['text' => "Quelle est la vision ?", 'correct' => false],
                    'B' => ['text' => "Où en sommes-nous actuellement ?", 'correct' => false],
                    'C' => ['text' => "Avons-nous atteint notre objectif ?", 'correct' => true],
                    'D' => ['text' => "Qui a proposé le changement ?", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Modèle CIM — maintenir la dynamique',
                'scenario' => null,
                'question' => "Quel est l’objectif de l’étape « Comment maintenir la dynamique ? »",
                'answers' => [
                    'A' => ['text' => "Éviter toute nouvelle amélioration", 'correct' => false],
                    'B' => ['text' => "Consolider les résultats et poursuivre l’amélioration", 'correct' => true],
                    'C' => ['text' => "Revenir systématiquement à la situation initiale", 'correct' => false],
                    'D' => ['text' => "Supprimer les indicateurs de performance", 'correct' => false],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SÉRIE 2 — Pratiques et mises en situation (74-80)
            // ═══════════════════════════════════════════════════════════════
            [
                'topic' => 'Pratique — Gestion des incidents',
                'scenario' => "Un utilisateur ne peut plus accéder à sa messagerie alors qu’elle fonctionnait normalement le matin.",
                'question' => "Comment cette situation doit-elle principalement être classée ?",
                'answers' => [
                    'A' => ['text' => "Une demande de service", 'correct' => false],
                    'B' => ['text' => "Un incident", 'correct' => true],
                    'C' => ['text' => "Un problème connu", 'correct' => false],
                    'D' => ['text' => "Une demande de changement stratégique", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — Gestion des problèmes',
                'scenario' => "Plusieurs utilisateurs rencontrent régulièrement la même panne. L’équipe cherche désormais la cause sous-jacente.",
                'question' => "Quelle pratique est principalement concernée ?",
                'answers' => [
                    'A' => ['text' => "Gestion des incidents", 'correct' => false],
                    'B' => ['text' => "Gestion des problèmes", 'correct' => true],
                    'C' => ['text' => "Gestion des fournisseurs", 'correct' => false],
                    'D' => ['text' => "Gestion des relations", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — Gestion des incidents — objectif',
                'scenario' => null,
                'question' => "Quel est l’objectif principal de la gestion des incidents ?",
                'answers' => [
                    'A' => ['text' => "Identifier toutes les causes profondes", 'correct' => false],
                    'B' => ['text' => "Restaurer le fonctionnement normal du service aussi rapidement que possible", 'correct' => true],
                    'C' => ['text' => "Autoriser tous les changements", 'correct' => false],
                    'D' => ['text' => "Renégocier les contrats fournisseurs", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — Gestion des demandes de service',
                'scenario' => "Un utilisateur demande un nouvel écran parmi les équipements standard déjà approuvés.",
                'question' => "Comment cette demande doit-elle généralement être traitée ?",
                'answers' => [
                    'A' => ['text' => "Comme une demande de service", 'correct' => true],
                    'B' => ['text' => "Comme un incident majeur", 'correct' => false],
                    'C' => ['text' => "Comme un problème", 'correct' => false],
                    'D' => ['text' => "Comme une défaillance de sécurité", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Pratique — Contrôle des changements',
                'scenario' => "Un changement est évalué afin de déterminer ses bénéfices, ses risques et ses impacts avant son autorisation.",
                'question' => "Quel est l’objectif principal de cette évaluation ?",
                'answers' => [
                    'A' => ['text' => "Éliminer complètement tous les changements", 'correct' => false],
                    'B' => ['text' => "Maximiser le nombre de validations", 'correct' => false],
                    'C' => ['text' => "Permettre des changements réussis en évaluant correctement les risques", 'correct' => true],
                    'D' => ['text' => "Transférer toutes les décisions au fournisseur", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Mesures — contrat vs résultat',
                'scenario' => "Un fournisseur atteint les délais prévus au contrat, mais les utilisateurs ne peuvent toujours pas atteindre leurs objectifs professionnels.",
                'question' => "Quelle est la meilleure conclusion ?",
                'answers' => [
                    'A' => ['text' => "Le service crée nécessairement de la valeur puisque le contrat est respecté", 'correct' => false],
                    'B' => ['text' => "Les mesures contractuelles ne reflètent probablement pas suffisamment les résultats recherchés", 'correct' => true],
                    'C' => ['text' => "Les résultats des utilisateurs ne sont pas liés au service", 'correct' => false],
                    'D' => ['text' => "Les mesures de performance sont toujours inutiles", 'correct' => false],
                ],
            ],
            [
                'topic' => 'Automatisation — approche progressive',
                'scenario' => "Une organisation veut automatiser la réinitialisation des mots de passe.",
                'question' => "Quelle est la meilleure approche ?",
                'answers' => [
                    'A' => ['text' => "Automatiser immédiatement, même si le processus actuel comporte des failles de sécurité", 'correct' => false],
                    'B' => ['text' => "Comprendre et optimiser le processus, évaluer les risques, puis automatiser progressivement", 'correct' => true],
                    'C' => ['text' => "Supprimer toute vérification d’identité pour gagner du temps", 'correct' => false],
                    'D' => ['text' => "Refuser toute automatisation parce qu’elle comporte toujours des risques", 'correct' => false],
                ],
            ],
        ];
    }
}
