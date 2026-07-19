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
                'duration_minutes' => 120,
                'passing_score' => 82,
                'total_questions' => 100,
                'is_active' => true,
            ],
            [
                'title' => 'CompTIA A+',
                'slug' => 'comptia-a-plus',
                'logo_path' => null,
                'description' => 'Certification d’entrée en support IT : matériel, OS, réseaux, sécurité.',
                'duration_minutes' => 90,
                'passing_score' => 70,
                'total_questions' => 90,
                'is_active' => true,
            ],
            [
                'title' => 'AWS Cloud Practitioner',
                'slug' => 'aws-cloud-practitioner',
                'logo_path' => null,
                'description' => 'Fondamentaux AWS : services, tarification, sécurité et cloud.',
                'duration_minutes' => 90,
                'passing_score' => 70,
                'total_questions' => 65,
                'is_active' => true,
            ],
        ];

        foreach ($items as $item) {
            Certification::updateOrCreate(['slug' => $item['slug']], $item);
        }
    }
}
