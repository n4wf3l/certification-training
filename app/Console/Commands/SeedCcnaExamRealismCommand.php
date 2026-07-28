<?php

namespace App\Console\Commands;

use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Ajoute au CCNA 200-301 des questions matching (drag-and-drop) et
 * multi-select pour refleter le format reel de l'examen Cisco.
 *
 * Strictement IDEMPOTENT : chaque question est identifiee par son texte
 * canonique (FR). Si un texte identique existe deja on saute. Aucune
 * mise a jour, aucune suppression sur l'existant.
 *
 * Contenu : facts CCNA 200-301 verifiables (blueprint courant Cisco).
 */
class SeedCcnaExamRealismCommand extends Command
{
    protected $signature = 'certifloop:seed-ccna-realism {--dry-run : Compte sans ecrire} {--refresh : Supprime et recree matching + multi-select CCNA (pour corrections texte)}';
    protected $description = 'Ajoute 8 questions matching + 10 multi-select CCNA (idempotent).';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $refresh = (bool) $this->option('refresh');
        $cert = Certification::where('slug', 'ccna-200-301')->first();
        if (!$cert) {
            $this->error('CCNA 200-301 introuvable en base (slug ccna-200-301).');
            return self::FAILURE;
        }

        $canonical = $cert->default_language ?? 'fr';   // 'fr'
        $shadow = $canonical === 'fr' ? 'en' : 'fr';    // 'en'

        $stats = ['matching_new' => 0, 'multi_new' => 0, 'skipped' => 0, 'purged' => 0];

        DB::transaction(function () use ($cert, $canonical, $shadow, $dryRun, $refresh, &$stats) {
            if ($refresh) {
                // Cible : uniquement les questions ajoutees par cette commande.
                // Fingerprint : matching (question_type='matching') OU multi-select
                // (question_type='multiple_choice' + 2+ reponses correctes).
                // Avant cette commande le CCNA avait 0 de chaque, donc pas de risque.
                $ids = collect();
                $ids = $ids->merge(
                    Question::where('certification_id', $cert->id)
                        ->where('question_type', 'matching')
                        ->pluck('id')
                );
                $multiIds = Question::where('certification_id', $cert->id)
                    ->where('question_type', 'multiple_choice')
                    ->with('answers')
                    ->get()
                    ->filter(fn ($q) => $q->answers->where('is_correct', true)->count() > 1)
                    ->pluck('id');
                $ids = $ids->merge($multiIds)->unique();

                if ($ids->isNotEmpty() && !$dryRun) {
                    Answer::whereIn('question_id', $ids)->delete();
                    Question::whereIn('id', $ids)->delete();
                }
                $stats['purged'] = $ids->count();
            }

            foreach ($this->matchingBank() as $q) {
                if ($this->questionExists($cert->id, $q[$canonical]['question'])) {
                    $stats['skipped']++;
                    continue;
                }
                if (!$dryRun) $this->insertMatching($cert->id, $canonical, $shadow, $q);
                $stats['matching_new']++;
            }
            foreach ($this->multiSelectBank() as $q) {
                if ($this->questionExists($cert->id, $q[$canonical]['question'])) {
                    $stats['skipped']++;
                    continue;
                }
                if (!$dryRun) $this->insertMultiSelect($cert->id, $canonical, $shadow, $q);
                $stats['multi_new']++;
            }
            if (!$dryRun && ($stats['matching_new'] + $stats['multi_new'] + $stats['purged']) > 0) {
                $cert->update(['questions_updated_at' => now()]);
            }
        });

        $verb = $dryRun ? '[dry-run]' : 'Cree';
        $this->info(sprintf(
            '%s : %d matching + %d multi-select ajoutees, %d deja en base (skip), %d purgees (--refresh).',
            $verb, $stats['matching_new'], $stats['multi_new'], $stats['skipped'], $stats['purged']
        ));
        if (!$dryRun) {
            $this->line('Pense a lancer <fg=cyan>php artisan certifloop:dump-seeders</> pour persister dans les seeders.');
        }
        return self::SUCCESS;
    }

    private function questionExists(int $certId, string $canonicalText): bool
    {
        return Question::where('certification_id', $certId)
            ->where('question_text', $canonicalText)
            ->exists();
    }

    private function nextPosition(int $certId): int
    {
        return (Question::where('certification_id', $certId)->max('position') ?? 0) + 1;
    }

    private function insertMatching(int $certId, string $canonical, string $shadow, array $q): void
    {
        $position = $this->nextPosition($certId);
        $canonicalPairs = array_map(fn ($p) => [
            'left' => $p[$canonical]['left'],
            'right' => $p[$canonical]['right'],
        ], $q['pairs']);
        $shadowPairs = array_map(fn ($p) => [
            'left' => $p[$shadow]['left'],
            'right' => $p[$shadow]['right'],
        ], $q['pairs']);

        Question::create([
            'certification_id' => $certId,
            'position' => $position,
            'question_type' => 'matching',
            'topic' => $q[$canonical]['topic'],
            'question_text' => $q[$canonical]['question'],
            'explanation' => $q[$canonical]['explanation'],
            'matching_pairs' => $canonicalPairs,
            'translations' => [
                $shadow => [
                    'topic' => $q[$shadow]['topic'],
                    'question_text' => $q[$shadow]['question'],
                    'explanation' => $q[$shadow]['explanation'],
                    'matching_pairs' => $shadowPairs,
                ],
            ],
        ]);
    }

    private function insertMultiSelect(int $certId, string $canonical, string $shadow, array $q): void
    {
        $position = $this->nextPosition($certId);
        $question = Question::create([
            'certification_id' => $certId,
            'position' => $position,
            'question_type' => 'multiple_choice',
            'topic' => $q[$canonical]['topic'],
            'question_text' => $q[$canonical]['question'],
            'explanation' => $q[$canonical]['explanation'],
            'translations' => [
                $shadow => [
                    'topic' => $q[$shadow]['topic'],
                    'question_text' => $q[$shadow]['question'],
                    'explanation' => $q[$shadow]['explanation'],
                ],
            ],
        ]);
        foreach ($q['answers'] as $ai => $a) {
            Answer::create([
                'question_id' => $question->id,
                'letter' => chr(65 + $ai),
                'answer_text' => $a[$canonical]['text'],
                'rationale' => $a[$canonical]['rationale'] ?? null,
                'is_correct' => (bool) $a['correct'],
                'translations' => [
                    $shadow => [
                        'answer_text' => $a[$shadow]['text'],
                        'rationale' => $a[$shadow]['rationale'] ?? null,
                    ],
                ],
            ]);
        }
    }

    /**
     * 8 questions matching. Facts CCNA 200-301 (blueprint courant).
     * Chaque entree : ['fr' => [topic, question, explanation], 'en' => [...],
     * 'pairs' => [ ['fr'=>['left','right'], 'en'=>['left','right']], ... ]]
     */
    private function matchingBank(): array
    {
        return [
            // 1. OSI protocol -> layer
            [
                'fr' => [
                    'topic' => 'Modèle OSI',
                    'question' => 'Associez chaque protocole à sa couche du modèle OSI.',
                    'explanation' => 'HTTP est un protocole applicatif (L7). TCP fournit un transport fiable (L4). IP assure le routage inter-réseaux (L3). Ethernet définit le format de trame et l\'adressage MAC (L2).',
                ],
                'en' => [
                    'topic' => 'OSI Model',
                    'question' => 'Match each protocol to its OSI model layer.',
                    'explanation' => 'HTTP is an application protocol (L7). TCP provides reliable transport (L4). IP handles inter-network routing (L3). Ethernet defines frame format and MAC addressing (L2).',
                ],
                'pairs' => [
                    ['fr' => ['left' => 'HTTP',     'right' => 'Couche 7 (Application)'],   'en' => ['left' => 'HTTP',     'right' => 'Layer 7 (Application)']],
                    ['fr' => ['left' => 'TCP',      'right' => 'Couche 4 (Transport)'],     'en' => ['left' => 'TCP',      'right' => 'Layer 4 (Transport)']],
                    ['fr' => ['left' => 'IP',       'right' => 'Couche 3 (Réseau)'],        'en' => ['left' => 'IP',       'right' => 'Layer 3 (Network)']],
                    ['fr' => ['left' => 'Ethernet', 'right' => 'Couche 2 (Liaison de données)'], 'en' => ['left' => 'Ethernet', 'right' => 'Layer 2 (Data Link)']],
                ],
            ],
            // 2. Well-known ports
            [
                'fr' => [
                    'topic' => 'Ports bien connus',
                    'question' => 'Associez chaque numéro de port TCP à son service standard.',
                    'explanation' => 'Les ports 0-1023 sont les "well-known ports" assignés par l\'IANA. SSH=22 (chiffré), Telnet=23 (non chiffré), DNS=53, HTTP=80, HTTPS=443.',
                ],
                'en' => [
                    'topic' => 'Well-known ports',
                    'question' => 'Match each TCP port number to its standard service.',
                    'explanation' => 'Ports 0-1023 are IANA-assigned "well-known ports". SSH=22 (encrypted), Telnet=23 (unencrypted), DNS=53, HTTP=80, HTTPS=443.',
                ],
                'pairs' => [
                    ['fr' => ['left' => '22',  'right' => 'SSH'],   'en' => ['left' => '22',  'right' => 'SSH']],
                    ['fr' => ['left' => '23',  'right' => 'Telnet'],'en' => ['left' => '23',  'right' => 'Telnet']],
                    ['fr' => ['left' => '53',  'right' => 'DNS'],   'en' => ['left' => '53',  'right' => 'DNS']],
                    ['fr' => ['left' => '80',  'right' => 'HTTP'],  'en' => ['left' => '80',  'right' => 'HTTP']],
                    ['fr' => ['left' => '443', 'right' => 'HTTPS'], 'en' => ['left' => '443', 'right' => 'HTTPS']],
                ],
            ],
            // 3. Cisco Administrative Distance
            [
                'fr' => [
                    'topic' => 'Distance administrative',
                    'question' => 'Associez chaque source de route à sa distance administrative Cisco par défaut.',
                    'explanation' => 'La distance administrative (AD) exprime la préférence entre sources de route. Valeurs Cisco par défaut : connectée=0, statique=1, eBGP=20, EIGRP interne=90, OSPF=110, RIP=120, iBGP=200.',
                ],
                'en' => [
                    'topic' => 'Administrative distance',
                    'question' => 'Match each route source to its default Cisco administrative distance.',
                    'explanation' => 'Administrative distance (AD) expresses the preference between route sources. Cisco defaults: connected=0, static=1, eBGP=20, EIGRP internal=90, OSPF=110, RIP=120, iBGP=200.',
                ],
                'pairs' => [
                    ['fr' => ['left' => 'Route directement connectée', 'right' => '0'],   'en' => ['left' => 'Directly connected route', 'right' => '0']],
                    ['fr' => ['left' => 'Route statique',              'right' => '1'],   'en' => ['left' => 'Static route',              'right' => '1']],
                    ['fr' => ['left' => 'eBGP',                        'right' => '20'],  'en' => ['left' => 'eBGP',                       'right' => '20']],
                    ['fr' => ['left' => 'OSPF',                        'right' => '110'], 'en' => ['left' => 'OSPF',                       'right' => '110']],
                    ['fr' => ['left' => 'RIP',                         'right' => '120'], 'en' => ['left' => 'RIP',                        'right' => '120']],
                ],
            ],
            // 4. IPv6 address prefixes
            [
                'fr' => [
                    'topic' => 'Adressage IPv6',
                    'question' => 'Associez chaque type d\'adresse IPv6 à son préfixe.',
                    'explanation' => 'RFC 4291 : global unicast=2000::/3, link-local=FE80::/10, unique local=FC00::/7, multicast=FF00::/8, loopback=::1/128.',
                ],
                'en' => [
                    'topic' => 'IPv6 addressing',
                    'question' => 'Match each IPv6 address type to its prefix.',
                    'explanation' => 'RFC 4291: global unicast=2000::/3, link-local=FE80::/10, unique local=FC00::/7, multicast=FF00::/8, loopback=::1/128.',
                ],
                'pairs' => [
                    ['fr' => ['left' => 'Global unicast', 'right' => '2000::/3'],  'en' => ['left' => 'Global unicast', 'right' => '2000::/3']],
                    ['fr' => ['left' => 'Link-local',     'right' => 'FE80::/10'], 'en' => ['left' => 'Link-local',     'right' => 'FE80::/10']],
                    ['fr' => ['left' => 'Unique local',   'right' => 'FC00::/7'],  'en' => ['left' => 'Unique local',   'right' => 'FC00::/7']],
                    ['fr' => ['left' => 'Multicast',      'right' => 'FF00::/8'],  'en' => ['left' => 'Multicast',      'right' => 'FF00::/8']],
                    ['fr' => ['left' => 'Loopback',       'right' => '::1/128'],   'en' => ['left' => 'Loopback',       'right' => '::1/128']],
                ],
            ],
            // 5. NAT types
            [
                'fr' => [
                    'topic' => 'NAT',
                    'question' => 'Associez chaque type de NAT à son fonctionnement.',
                    'explanation' => 'Static NAT : correspondance fixe 1:1 (souvent pour serveurs internes exposés). Dynamic NAT : mappage depuis un pool d\'adresses publiques. PAT (NAT overload) : plusieurs adresses privées partagent UNE adresse publique en distinguant les sessions par les ports source.',
                ],
                'en' => [
                    'topic' => 'NAT',
                    'question' => 'Match each NAT type to its behavior.',
                    'explanation' => 'Static NAT: fixed 1:1 mapping (often for exposed internal servers). Dynamic NAT: mapping from a pool of public addresses. PAT (NAT overload): many private addresses share ONE public address by differentiating sessions with source ports.',
                ],
                'pairs' => [
                    ['fr' => ['left' => 'Static NAT',           'right' => 'Correspondance fixe 1 pour 1'],                          'en' => ['left' => 'Static NAT',           'right' => 'Fixed 1-to-1 mapping']],
                    ['fr' => ['left' => 'Dynamic NAT',          'right' => 'Mappage depuis un pool d\'adresses publiques'],          'en' => ['left' => 'Dynamic NAT',          'right' => 'Mapping from a pool of public addresses']],
                    ['fr' => ['left' => 'PAT (NAT overload)',   'right' => 'Plusieurs adresses privées partagent UNE publique via les ports'], 'en' => ['left' => 'PAT (NAT overload)', 'right' => 'Many private addresses share ONE public address via ports']],
                ],
            ],
            // 6. Wi-Fi standards -> band
            [
                'fr' => [
                    'topic' => 'Normes 802.11',
                    'question' => 'Associez chaque norme Wi-Fi à sa (ses) bande(s) de fréquence.',
                    'explanation' => '802.11a : 5 GHz uniquement. 802.11b : 2.4 GHz uniquement. 802.11n (Wi-Fi 4) : dual-band 2.4 et 5 GHz. 802.11ac (Wi-Fi 5) : 5 GHz uniquement. 802.11ax (Wi-Fi 6) : dual-band 2.4 et 5 GHz (Wi-Fi 6E ajoute la bande 6 GHz).',
                ],
                'en' => [
                    'topic' => '802.11 standards',
                    'question' => 'Match each Wi-Fi standard to its frequency band(s).',
                    'explanation' => '802.11a: 5 GHz only. 802.11b: 2.4 GHz only. 802.11n (Wi-Fi 4): dual-band 2.4 and 5 GHz. 802.11ac (Wi-Fi 5): 5 GHz only. 802.11ax (Wi-Fi 6): dual-band 2.4 and 5 GHz (Wi-Fi 6E adds the 6 GHz band).',
                ],
                'pairs' => [
                    ['fr' => ['left' => '802.11a',           'right' => '5 GHz uniquement'],       'en' => ['left' => '802.11a',           'right' => '5 GHz only']],
                    ['fr' => ['left' => '802.11b',           'right' => '2.4 GHz uniquement'],     'en' => ['left' => '802.11b',           'right' => '2.4 GHz only']],
                    ['fr' => ['left' => '802.11n (Wi-Fi 4)', 'right' => '2.4 GHz et 5 GHz'],       'en' => ['left' => '802.11n (Wi-Fi 4)', 'right' => '2.4 GHz and 5 GHz']],
                    ['fr' => ['left' => '802.11ac (Wi-Fi 5)','right' => '5 GHz uniquement'],       'en' => ['left' => '802.11ac (Wi-Fi 5)','right' => '5 GHz only']],
                    ['fr' => ['left' => '802.11ax (Wi-Fi 6)','right' => '2.4 GHz et 5 GHz'],       'en' => ['left' => '802.11ax (Wi-Fi 6)','right' => '2.4 GHz and 5 GHz']],
                ],
            ],
            // 7. STP port states
            [
                'fr' => [
                    'topic' => 'Spanning Tree',
                    'question' => 'Associez chaque état de port STP (802.1D) à son comportement.',
                    'explanation' => 'Séquence STP classique : Blocking → Listening → Learning → Forwarding (Disabled = admin down). Le port n\'apprend les MAC et ne fait forwarding que dans les états finaux correspondants.',
                ],
                'en' => [
                    'topic' => 'Spanning Tree',
                    'question' => 'Match each STP (802.1D) port state to its behavior.',
                    'explanation' => 'Classic STP sequence: Blocking → Listening → Learning → Forwarding (Disabled = admin down). The port only learns MACs and forwards traffic in the matching final states.',
                ],
                'pairs' => [
                    ['fr' => ['left' => 'Blocking',   'right' => 'Aucun forwarding, écoute les BPDU'],           'en' => ['left' => 'Blocking',   'right' => 'No forwarding, listens to BPDUs']],
                    ['fr' => ['left' => 'Listening',  'right' => 'Prépare le forwarding, aucun apprentissage MAC'], 'en' => ['left' => 'Listening',  'right' => 'Prepares forwarding, no MAC learning']],
                    ['fr' => ['left' => 'Learning',   'right' => 'Apprend les MAC, aucun forwarding'],          'en' => ['left' => 'Learning',   'right' => 'Learns MAC addresses, no forwarding']],
                    ['fr' => ['left' => 'Forwarding', 'right' => 'Fonctionnement normal'],                      'en' => ['left' => 'Forwarding', 'right' => 'Normal operation']],
                ],
            ],
            // 8. Cable types -> use case
            [
                'fr' => [
                    'topic' => 'Câblage Ethernet',
                    'question' => 'Associez chaque type de câble à son usage typique.',
                    'explanation' => 'Straight-through relie deux équipements de type différent (PC-switch). Crossover relie deux équipements de même type (switch-switch), utile avant auto-MDIX. Rollover (câble console bleu Cisco) sert à accéder au CLI via le port console. Fibre monomode : longues distances.',
                ],
                'en' => [
                    'topic' => 'Ethernet cabling',
                    'question' => 'Match each cable type to its typical use.',
                    'explanation' => 'Straight-through connects two devices of different types (PC-switch). Crossover connects two devices of the same type (switch-switch), useful before auto-MDIX. Rollover (Cisco blue console cable) is used to access the CLI via the console port. Single-mode fiber: long distances.',
                ],
                'pairs' => [
                    ['fr' => ['left' => 'Straight-through',    'right' => 'PC vers switch'],                                  'en' => ['left' => 'Straight-through',    'right' => 'PC to switch']],
                    ['fr' => ['left' => 'Crossover',           'right' => 'Switch vers switch (avant auto-MDIX)'],            'en' => ['left' => 'Crossover',           'right' => 'Switch to switch (before auto-MDIX)']],
                    ['fr' => ['left' => 'Rollover (console)',  'right' => 'PC vers port console d\'un équipement Cisco'],     'en' => ['left' => 'Rollover (console)',  'right' => 'PC to console port on a Cisco device']],
                    ['fr' => ['left' => 'Fibre monomode',      'right' => 'Longues distances (au-delà de 2 km)'],             'en' => ['left' => 'Single-mode fiber',   'right' => 'Long distances (beyond 2 km)']],
                ],
            ],
        ];
    }

    /**
     * 10 questions multi-select (2-3 bonnes reponses, tout-ou-rien).
     * Chaque entree : ['fr' => [topic, question, explanation], 'en' => [...],
     * 'answers' => [ ['fr'=>['text','rationale'], 'en'=>[...], 'correct'=>bool], ... ]]
     */
    private function multiSelectBank(): array
    {
        return [
            // 1. Router functions
            [
                'fr' => ['topic' => 'Rôle du routeur', 'question' => 'Sélectionnez DEUX fonctions principales d\'un routeur.', 'explanation' => 'Un routeur transmet les paquets entre réseaux IP différents en s\'appuyant sur une table de routage construite par les protocoles dynamiques et les routes statiques.'],
                'en' => ['topic' => 'Router role',     'question' => 'Select TWO primary functions of a router.',              'explanation' => 'A router forwards packets between different IP networks based on a routing table built from dynamic protocols and static routes.'],
                'answers' => [
                    ['fr' => ['text' => 'Router les paquets entre réseaux IP différents',       'rationale' => 'Rôle coeur d\'un routeur (couche 3).'],                          'en' => ['text' => 'Route packets between different IP networks',            'rationale' => 'Core role of a router (Layer 3).'],                                    'correct' => true],
                    ['fr' => ['text' => 'Maintenir une table de routage',                        'rationale' => 'Base des décisions de forwarding.'],                            'en' => ['text' => 'Maintain a routing table',                                'rationale' => 'Foundation of forwarding decisions.'],                                   'correct' => true],
                    ['fr' => ['text' => 'Apprendre les adresses MAC des hôtes du LAN',           'rationale' => 'C\'est le rôle du switch (couche 2), pas du routeur.'],         'en' => ['text' => 'Learn the MAC addresses of LAN hosts',                    'rationale' => 'That is the role of a switch (Layer 2), not a router.'],                 'correct' => false],
                    ['fr' => ['text' => 'Commutation de trames Ethernet à l\'intérieur d\'un VLAN', 'rationale' => 'Fonction switching (couche 2), pas routing.'],                'en' => ['text' => 'Switch Ethernet frames within a VLAN',                    'rationale' => 'A switching function (Layer 2), not routing.'],                          'correct' => false],
                    ['fr' => ['text' => 'Attribuer dynamiquement les adresses IP via DHCP',      'rationale' => 'Optionnel via ip helper-address ou rôle DHCP intégré, pas une fonction principale.'], 'en' => ['text' => 'Dynamically assign IP addresses via DHCP',      'rationale' => 'Optional via ip helper-address or integrated DHCP role, not a primary function.'], 'correct' => false],
                ],
            ],
            // 2. Layer 2 switch characteristics
            [
                'fr' => ['topic' => 'Switch couche 2', 'question' => 'Sélectionnez DEUX caractéristiques d\'un switch de couche 2.', 'explanation' => 'Un switch L2 prend ses décisions de forwarding sur base des adresses MAC destination et crée un domaine de collision par port grâce au full-duplex commuté.'],
                'en' => ['topic' => 'Layer 2 switch',  'question' => 'Select TWO characteristics of a Layer 2 switch.',              'explanation' => 'A Layer 2 switch makes forwarding decisions based on destination MAC addresses and creates one collision domain per port through switched full-duplex operation.'],
                'answers' => [
                    ['fr' => ['text' => 'Utilise les adresses MAC pour les décisions de transmission', 'rationale' => 'Définition même de la commutation L2.'],                   'en' => ['text' => 'Uses MAC addresses for forwarding decisions',            'rationale' => 'Definition of Layer 2 switching.'],                                   'correct' => true],
                    ['fr' => ['text' => 'Chaque port constitue un domaine de collision distinct',     'rationale' => 'Conséquence du full-duplex commuté.'],                       'en' => ['text' => 'Each port is a separate collision domain',              'rationale' => 'A consequence of switched full-duplex.'],                                'correct' => true],
                    ['fr' => ['text' => 'Route les paquets entre sous-réseaux différents',            'rationale' => 'C\'est un rôle de routeur (L3), sauf pour un switch multicouche.'], 'en' => ['text' => 'Routes packets between different subnets',           'rationale' => 'That is a router (L3) function, unless it is a multilayer switch.'],     'correct' => false],
                    ['fr' => ['text' => 'Attribue des adresses IP aux hôtes',                         'rationale' => 'Rôle d\'un serveur DHCP.'],                                  'en' => ['text' => 'Assigns IP addresses to hosts',                          'rationale' => 'Role of a DHCP server.'],                                                'correct' => false],
                    ['fr' => ['text' => 'Termine les connexions TCP',                                 'rationale' => 'TCP est couche 4, hors scope d\'un switch L2 pur.'],         'en' => ['text' => 'Terminates TCP connections',                             'rationale' => 'TCP is Layer 4, outside the scope of a pure L2 switch.'],                 'correct' => false],
                ],
            ],
            // 3. DHCP delivered info
            [
                'fr' => ['topic' => 'DHCP', 'question' => 'Sélectionnez DEUX informations fournies par un serveur DHCP à un client.', 'explanation' => 'Le message DHCPOFFER/ACK typique livre au minimum l\'adresse IP, le masque, la passerelle par défaut, le(s) serveur(s) DNS et la durée du bail.'],
                'en' => ['topic' => 'DHCP', 'question' => 'Select TWO pieces of information a DHCP server provides to a client.',    'explanation' => 'The typical DHCPOFFER/ACK message delivers at minimum the IP address, subnet mask, default gateway, DNS server(s) and lease duration.'],
                'answers' => [
                    ['fr' => ['text' => 'Adresse IP',                          'rationale' => 'Information cible du bail.'],                                        'en' => ['text' => 'IP address',                          'rationale' => 'Core purpose of the lease.'],                                              'correct' => true],
                    ['fr' => ['text' => 'Passerelle par défaut',               'rationale' => 'Option DHCP 3, indispensable pour sortir du réseau.'],                'en' => ['text' => 'Default gateway',                     'rationale' => 'DHCP option 3, required to leave the local network.'],                     'correct' => true],
                    ['fr' => ['text' => 'Adresse MAC du client',               'rationale' => 'La MAC est du client, pas du serveur.'],                             'en' => ['text' => 'Client MAC address',                  'rationale' => 'The MAC belongs to the client, not the server.'],                          'correct' => false],
                    ['fr' => ['text' => 'Table de routage complète',           'rationale' => 'DHCP ne distribue pas de tables de routage.'],                       'en' => ['text' => 'Complete routing table',              'rationale' => 'DHCP does not distribute routing tables.'],                                'correct' => false],
                    ['fr' => ['text' => 'Certificat SSL/TLS du serveur',       'rationale' => 'Hors scope DHCP.'],                                                  'en' => ['text' => 'Server SSL/TLS certificate',          'rationale' => 'Outside the DHCP scope.'],                                                 'correct' => false],
                ],
            ],
            // 4. OSPF
            [
                'fr' => ['topic' => 'OSPF', 'question' => 'Sélectionnez DEUX caractéristiques d\'OSPFv2.', 'explanation' => 'OSPFv2 est un protocole à état de liens (link-state) IGP, standard ouvert (RFC 2328), qui exécute Dijkstra sur la topologie apprise via les LSA. OSPFv3 est l\'équivalent pour IPv6.'],
                'en' => ['topic' => 'OSPF', 'question' => 'Select TWO characteristics of OSPFv2.',        'explanation' => 'OSPFv2 is a link-state IGP, an open standard (RFC 2328), that runs Dijkstra over the topology learned through LSAs. OSPFv3 is the equivalent for IPv6.'],
                'answers' => [
                    ['fr' => ['text' => 'Protocole à état de liens (link-state)',           'rationale' => 'Chaque routeur diffuse ses liens via des LSA.'],                    'en' => ['text' => 'Link-state protocol',                           'rationale' => 'Each router advertises its links via LSAs.'],                              'correct' => true],
                    ['fr' => ['text' => 'Utilise l\'algorithme SPF (Dijkstra)',              'rationale' => 'Calcul du plus court chemin sur la base topologique.'],             'en' => ['text' => 'Uses the SPF (Dijkstra) algorithm',             'rationale' => 'Computes shortest path over the topological database.'],                   'correct' => true],
                    ['fr' => ['text' => 'Protocole à vecteur de distance',                   'rationale' => 'C\'est RIP/EIGRP (hybride), pas OSPF.'],                            'en' => ['text' => 'Distance-vector protocol',                       'rationale' => 'That is RIP/EIGRP (hybrid), not OSPF.'],                                    'correct' => false],
                    ['fr' => ['text' => 'Distance administrative Cisco par défaut de 90',    'rationale' => 'C\'est EIGRP interne. OSPF a une AD par défaut de 110.'],           'en' => ['text' => 'Default Cisco administrative distance of 90',   'rationale' => 'That is EIGRP internal. OSPF has a default AD of 110.'],                   'correct' => false],
                    ['fr' => ['text' => 'Support natif d\'IPv6 sans configuration additionnelle', 'rationale' => 'OSPFv2 est IPv4 seulement. IPv6 requiert OSPFv3.'],             'en' => ['text' => 'Native IPv6 support with no additional config', 'rationale' => 'OSPFv2 is IPv4-only. IPv6 requires OSPFv3.'],                              'correct' => false],
                ],
            ],
            // 5. VLANs benefits
            [
                'fr' => ['topic' => 'VLAN', 'question' => 'Sélectionnez DEUX avantages des VLAN.', 'explanation' => 'Un VLAN segmente le domaine de broadcast et isole logiquement les groupes d\'utilisateurs sur une même infrastructure physique, sans exiger de recâbler.'],
                'en' => ['topic' => 'VLAN', 'question' => 'Select TWO benefits of VLANs.',        'explanation' => 'A VLAN segments the broadcast domain and logically isolates user groups on the same physical infrastructure, without requiring re-cabling.'],
                'answers' => [
                    ['fr' => ['text' => 'Segmentation des domaines de broadcast',                     'rationale' => 'Chaque VLAN = 1 domaine de broadcast distinct.'],                   'en' => ['text' => 'Broadcast domain segmentation',                          'rationale' => 'Each VLAN = one separate broadcast domain.'],                              'correct' => true],
                    ['fr' => ['text' => 'Isolation logique du trafic entre groupes d\'utilisateurs',  'rationale' => 'Un utilisateur d\'un VLAN ne peut atteindre un autre VLAN sans routage.'], 'en' => ['text' => 'Logical traffic isolation between user groups',    'rationale' => 'A user in one VLAN cannot reach another VLAN without routing.'],           'correct' => true],
                    ['fr' => ['text' => 'Augmentation automatique de la bande passante physique',     'rationale' => 'Aucun VLAN ne change la capacité du câble.'],                       'en' => ['text' => 'Automatic increase in physical bandwidth',               'rationale' => 'No VLAN changes the physical cable capacity.'],                            'correct' => false],
                    ['fr' => ['text' => 'Suppression du besoin d\'un routeur pour l\'inter-VLAN',     'rationale' => 'Au contraire, il en faut un (ou un SVI) pour router entre VLAN.'], 'en' => ['text' => 'Removes the need for a router for inter-VLAN',           'rationale' => 'On the contrary, one (or an SVI) is required to route between VLANs.'],   'correct' => false],
                    ['fr' => ['text' => 'Attribution automatique d\'adresses IP',                     'rationale' => 'Rôle du DHCP, indépendant des VLAN.'],                              'en' => ['text' => 'Automatic IP address assignment',                        'rationale' => 'Role of DHCP, independent of VLANs.'],                                     'correct' => false],
                ],
            ],
            // 6. STP port roles
            [
                'fr' => ['topic' => 'Spanning Tree', 'question' => 'Sélectionnez DEUX rôles de ports STP.', 'explanation' => 'Les rôles STP sont : Root port (meilleur chemin vers le root bridge), Designated port (port choisi sur un segment), Alternate/Backup (RSTP). Trunk et Access sont des modes de port de commutation, pas des rôles STP.'],
                'en' => ['topic' => 'Spanning Tree', 'question' => 'Select TWO STP port roles.',            'explanation' => 'STP port roles are: Root port (best path to root bridge), Designated port (chosen port on a segment), Alternate/Backup (RSTP). Trunk and Access are switching port modes, not STP roles.'],
                'answers' => [
                    ['fr' => ['text' => 'Root port',        'rationale' => 'Port avec le coût STP le plus bas vers le root bridge.'],       'en' => ['text' => 'Root port',        'rationale' => 'Port with the lowest STP cost to the root bridge.'],                        'correct' => true],
                    ['fr' => ['text' => 'Designated port',  'rationale' => 'Port qui transmet vers un segment.'],                           'en' => ['text' => 'Designated port',  'rationale' => 'Port that forwards to a segment.'],                                          'correct' => true],
                    ['fr' => ['text' => 'Trunk port',       'rationale' => 'Mode de port qui transporte plusieurs VLAN, pas un rôle STP.'], 'en' => ['text' => 'Trunk port',       'rationale' => 'Port mode carrying multiple VLANs, not an STP role.'],                       'correct' => false],
                    ['fr' => ['text' => 'Access port',      'rationale' => 'Mode de port assigné à un seul VLAN, pas un rôle STP.'],        'en' => ['text' => 'Access port',      'rationale' => 'Port mode assigned to a single VLAN, not an STP role.'],                     'correct' => false],
                    ['fr' => ['text' => 'Uplink port',      'rationale' => 'Terme informel, pas un rôle STP standard.'],                    'en' => ['text' => 'Uplink port',      'rationale' => 'Informal term, not a standard STP role.'],                                   'correct' => false],
                ],
            ],
            // 7. PAT (NAT overload)
            [
                'fr' => ['topic' => 'PAT / NAT overload', 'question' => 'Sélectionnez DEUX affirmations vraies concernant PAT (NAT overload).', 'explanation' => 'PAT permet à plusieurs adresses privées de partager UNE adresse publique. Le routeur maintient une table de traduction indexée sur (IP interne, port interne) → (IP publique, port publique) pour distinguer les sessions.'],
                'en' => ['topic' => 'PAT / NAT overload', 'question' => 'Select TWO true statements about PAT (NAT overload).',              'explanation' => 'PAT lets many private addresses share ONE public address. The router keeps a translation table indexed on (inside IP, inside port) → (public IP, public port) to differentiate sessions.'],
                'answers' => [
                    ['fr' => ['text' => 'Traduit plusieurs adresses privées vers une seule adresse publique', 'rationale' => 'Définition du "many-to-one".'],                              'en' => ['text' => 'Translates multiple private addresses to one public address', 'rationale' => 'Definition of many-to-one.'],                                  'correct' => true],
                    ['fr' => ['text' => 'Utilise les numéros de port pour distinguer les sessions simultanées', 'rationale' => 'Le port devient la clé de démultiplexage.'],                'en' => ['text' => 'Uses port numbers to differentiate simultaneous sessions',  'rationale' => 'Ports become the demultiplexing key.'],                          'correct' => true],
                    ['fr' => ['text' => 'Nécessite un mappage fixe 1 pour 1',                                  'rationale' => 'C\'est static NAT, pas PAT.'],                                'en' => ['text' => 'Requires a fixed 1-to-1 mapping',                            'rationale' => 'That is static NAT, not PAT.'],                                  'correct' => false],
                    ['fr' => ['text' => 'N\'est pas compatible avec les connexions TCP',                       'rationale' => 'TCP est le cas d\'usage majoritaire de PAT.'],                'en' => ['text' => 'Is not compatible with TCP connections',                     'rationale' => 'TCP is the main use case of PAT.'],                              'correct' => false],
                    ['fr' => ['text' => 'Requiert un pool d\'adresses publiques équivalent au nombre de clients', 'rationale' => 'PAT permet justement d\'économiser les adresses publiques.'], 'en' => ['text' => 'Requires a public address pool equal to the number of clients', 'rationale' => 'PAT is precisely designed to save public addresses.'],           'correct' => false],
                ],
            ],
            // 8. ACL rules
            [
                'fr' => ['topic' => 'ACL', 'question' => 'Sélectionnez DEUX règles concernant l\'application des ACL Cisco.', 'explanation' => 'Règles clés Cisco : une seule ACL par direction et par interface, un "deny any" implicite ferme chaque ACL, ACL étendue placée au plus près de la source, ACL standard au plus près de la destination.'],
                'en' => ['topic' => 'ACL', 'question' => 'Select TWO rules regarding Cisco ACL application.',                'explanation' => 'Key Cisco rules: only one ACL per direction per interface, an implicit "deny any" closes every ACL, extended ACL placed closest to the source, standard ACL closest to the destination.'],
                'answers' => [
                    ['fr' => ['text' => 'Une seule ACL par direction et par interface',                                       'rationale' => 'Deux ACL "in" sur la même interface est impossible.'],                'en' => ['text' => 'Only one ACL per direction per interface',                                 'rationale' => 'Two "in" ACLs on the same interface are not possible.'],           'correct' => true],
                    ['fr' => ['text' => 'Un "deny any" implicite se trouve à la fin de chaque ACL',                            'rationale' => 'Le trafic non explicitement autorisé est rejeté.'],                    'en' => ['text' => 'An implicit "deny any" is at the end of every ACL',                        'rationale' => 'Traffic not explicitly permitted is denied.'],                     'correct' => true],
                    ['fr' => ['text' => 'Une ACL étendue doit être placée au plus près de la destination',                     'rationale' => 'Inverse : ACL étendue au plus près de la source pour filtrer tôt.'],   'en' => ['text' => 'An extended ACL should be placed closest to the destination',              'rationale' => 'Reverse: extended ACL closest to the source to filter early.'],   'correct' => false],
                    ['fr' => ['text' => 'Les ACL peuvent modifier le contenu des paquets',                                    'rationale' => 'Les ACL filtrent, elles ne modifient pas les paquets.'],               'en' => ['text' => 'ACLs can modify packet contents',                                          'rationale' => 'ACLs filter, they do not modify packets.'],                        'correct' => false],
                    ['fr' => ['text' => 'Les ACL numérotées peuvent être éditées ligne par ligne comme les ACL nommées',      'rationale' => 'C\'est justement la limite des ACL numérotées classiques.'],           'en' => ['text' => 'Numbered ACLs can be edited line-by-line like named ACLs',                'rationale' => 'That is exactly the limitation of classic numbered ACLs.'],       'correct' => false],
                ],
            ],
            // 9. Cloud IaaS
            [
                'fr' => ['topic' => 'Cloud - IaaS', 'question' => 'Sélectionnez DEUX caractéristiques du modèle IaaS.', 'explanation' => 'IaaS (Infrastructure as a Service) : le fournisseur cloud gère l\'infrastructure physique et l\'hyperviseur ; le client gère l\'OS invité, les applications, les données. PaaS ajoute le runtime, SaaS livre l\'application finie.'],
                'en' => ['topic' => 'Cloud - IaaS', 'question' => 'Select TWO characteristics of the IaaS model.',       'explanation' => 'IaaS (Infrastructure as a Service): the cloud provider manages the physical infrastructure and hypervisor; the customer manages the guest OS, applications and data. PaaS adds the runtime, SaaS delivers the finished application.'],
                'answers' => [
                    ['fr' => ['text' => 'Fournit des ressources virtualisées (VM, stockage, réseau)', 'rationale' => 'Coeur de IaaS.'],                                                  'en' => ['text' => 'Provides virtualized resources (VMs, storage, network)',    'rationale' => 'Core of IaaS.'],                                                          'correct' => true],
                    ['fr' => ['text' => 'Le client gère l\'OS invité et les applications',           'rationale' => 'Partage de responsabilité typique IaaS.'],                          'en' => ['text' => 'The customer manages the guest OS and applications',        'rationale' => 'Standard IaaS shared responsibility.'],                                   'correct' => true],
                    ['fr' => ['text' => 'Le fournisseur gère les applications de l\'utilisateur',    'rationale' => 'C\'est SaaS, pas IaaS.'],                                          'en' => ['text' => 'The provider manages the user applications',                'rationale' => 'That is SaaS, not IaaS.'],                                                'correct' => false],
                    ['fr' => ['text' => 'Se limite au stockage d\'objets',                           'rationale' => 'Le stockage objet est un service parmi d\'autres.'],                'en' => ['text' => 'Limited to object storage',                                 'rationale' => 'Object storage is one service among many.'],                              'correct' => false],
                    ['fr' => ['text' => 'Inclut nativement une plateforme de développement gérée',   'rationale' => 'C\'est PaaS.'],                                                     'en' => ['text' => 'Includes a managed development platform natively',          'rationale' => 'That is PaaS.'],                                                          'correct' => false],
                ],
            ],
            // 10. Wireless security
            [
                'fr' => ['topic' => 'Sécurité Wi-Fi', 'question' => 'Sélectionnez DEUX protocoles de sécurité Wi-Fi modernes recommandés.', 'explanation' => 'WPA2-Enterprise (802.1X + AES-CCMP) et WPA3 sont les protocoles modernes recommandés. WEP est cassé depuis 2001, WPA original (TKIP) est déprécié, Open ne fournit aucune protection.'],
                'en' => ['topic' => 'Wi-Fi security', 'question' => 'Select TWO recommended modern Wi-Fi security protocols.',              'explanation' => 'WPA2-Enterprise (802.1X + AES-CCMP) and WPA3 are the recommended modern protocols. WEP has been broken since 2001, original WPA (TKIP) is deprecated, Open provides no protection.'],
                'answers' => [
                    ['fr' => ['text' => 'WPA2-Enterprise (802.1X)', 'rationale' => 'Authentification RADIUS, chiffrement AES-CCMP.'],           'en' => ['text' => 'WPA2-Enterprise (802.1X)', 'rationale' => 'RADIUS authentication, AES-CCMP encryption.'],                'correct' => true],
                    ['fr' => ['text' => 'WPA3',                     'rationale' => 'SAE remplace le handshake WPA2, résistant offline.'],       'en' => ['text' => 'WPA3',                     'rationale' => 'SAE replaces the WPA2 handshake, offline-resistant.'],          'correct' => true],
                    ['fr' => ['text' => 'WEP',                      'rationale' => 'Vulnérabilités RC4 exploitables en minutes.'],              'en' => ['text' => 'WEP',                      'rationale' => 'RC4 vulnerabilities exploitable in minutes.'],                  'correct' => false],
                    ['fr' => ['text' => 'WPA (version originale, TKIP)', 'rationale' => 'TKIP est déprécié par la Wi-Fi Alliance.'],             'en' => ['text' => 'WPA (original version, TKIP)', 'rationale' => 'TKIP is deprecated by the Wi-Fi Alliance.'],                  'correct' => false],
                    ['fr' => ['text' => 'Open (aucune sécurité)',   'rationale' => 'Trafic en clair, interceptable par n\'importe qui à portée.'], 'en' => ['text' => 'Open (no security)',       'rationale' => 'Cleartext traffic, interceptable by anyone in range.'],         'correct' => false],
                ],
            ],
        ];
    }
}
