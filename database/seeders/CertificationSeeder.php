<?php

namespace Database\Seeders;

use App\Models\Certification;
use Illuminate\Database\Seeder;

class CertificationSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'title' => 'CCNA 200-301',
                'slug' => 'ccna-200-301',
                'logo_path' => null,
                'description' => 'Cisco Certified Network Associate — routing, switching, sécurité, automatisation.',
                'long_description' => "La CCNA (Cisco Certified Network Associate) est LA porte d'entrée aux métiers du réseau. L'examen 200-301 couvre les fondamentaux : routing (statique, OSPF), switching (VLAN, STP, EtherChannel), IPv4/IPv6, sécurité (ACL, port-security, VPN de base), infrastructure sans fil, services IP (NAT, DHCP, QoS) et automatisation (Python, REST, JSON, Ansible). C'est la certification Cisco la plus reconnue au monde et le prérequis vers CCNP puis CCIE.",
                'importance' => "La CCNA est explicitement demandée dans la majorité des offres 'Network Engineer', 'NOC Analyst' ou 'Ingénieur systèmes et réseaux' en France comme à l'international. Elle valide un socle technique que les recruteurs prennent au sérieux et débloque les grilles de salaire junior→confirmé.",
                'target_roles' => [
                    'Network Engineer Junior',
                    'Support Réseau N1/N2',
                    'Administrateur infrastructure',
                    'Technicien réseau',
                    'NOC Analyst',
                    'SysAdmin polyvalent',
                ],
                'duration_minutes' => 120,
                'passing_score' => 82,
                'total_questions' => 100,
                'validity_months' => 36,
                'validity_note' => 'Valide 3 ans. Renouvellement en repassant l\'examen ou via une certification Cisco de niveau supérieur (CCNP, CCIE).',
                'questions_updated_at' => now(),
                'is_active' => true,
            ],
            [
                'title' => 'CompTIA A+',
                'slug' => 'comptia-a-plus',
                'logo_path' => null,
                'description' => "Certification vendor-neutral de référence pour débuter dans le support IT.",
                'long_description' => "La CompTIA A+ valide l'ensemble des fondamentaux du support IT : matériel PC, systèmes d'exploitation (Windows, macOS, Linux, iOS, Android), réseaux, cybersécurité de base, résolution d'incidents et procédures opérationnelles. C'est la seule certification vendor-neutral (non liée à un constructeur) universellement acceptée pour un premier poste dans le support.",
                'importance' => "Souvent exigée pour un premier job helpdesk chez les grands comptes (Dell, HP, IBM, ainsi que dans la fonction publique US et de plus en plus en Europe). Elle rassure les recruteurs sur ta capacité à intervenir sur un parc hétérogène dès ton arrivée.",
                'target_roles' => [
                    'Technicien Helpdesk',
                    'Support IT niveau 1',
                    'Field Technician',
                    'IT Support Specialist',
                    'Technicien de proximité',
                ],
                'duration_minutes' => 90,
                'passing_score' => 70,
                'total_questions' => 90,
                'validity_months' => 36,
                'validity_note' => 'Valide 3 ans. Peut être renouvelée sans repasser l\'examen via le programme CompTIA CE (Continuing Education).',
                'questions_updated_at' => now(),
                'is_active' => true,
            ],
            [
                'title' => 'AWS Cloud Practitioner',
                'slug' => 'aws-cloud-practitioner',
                'logo_path' => null,
                'description' => 'Fondamentaux AWS : services, tarification, sécurité et modèle cloud.',
                'long_description' => "L'AWS Cloud Practitioner (CLF-C02) est le point d'entrée officiel dans l'écosystème AWS. L'examen valide ta compréhension globale du cloud AWS : services principaux (EC2, S3, RDS, Lambda, VPC), modèles de tarification, modèle de responsabilité partagée, IAM, régions et zones de disponibilité, bonnes pratiques d'architecture Well-Architected. Elle ne demande pas de background technique lourd, mais une réelle compréhension du cloud.",
                'importance' => "Certification à haute valeur commerciale : elle prouve que tu comprends AWS sans être forcément développeur. Fortement recommandée pour les chefs de projet, product managers, avant-vente et consultants qui interagissent avec des équipes cloud. C'est aussi le prérequis idéal avant Solutions Architect Associate.",
                'target_roles' => [
                    'Chef de projet Cloud',
                    'Product Manager Tech',
                    'Avant-vente / Business Developer IT',
                    'Consultant IT',
                    'Développeur en reconversion cloud',
                    'Ingénieur en apprentissage',
                ],
                'duration_minutes' => 90,
                'passing_score' => 70,
                'total_questions' => 65,
                'validity_months' => 36,
                'validity_note' => 'Valide 3 ans. Renouvellement en repassant l\'examen ou via une certification AWS de niveau Associate/Professional/Specialty.',
                'questions_updated_at' => now(),
                'is_active' => true,
            ],
        ];

        foreach ($items as $item) {
            Certification::updateOrCreate(['slug' => $item['slug']], $item);
        }
    }
}
