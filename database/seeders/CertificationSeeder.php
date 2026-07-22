<?php

namespace Database\Seeders;

use App\Models\Answer;
use App\Models\Certification;
use App\Models\Question;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class CertificationSeeder extends Seeder
{
    public function run(): void
    {
        $dataDir = database_path('seeders/data');
        $certsFile = $dataDir . '/certifications.json';
        $questionsFile = $dataDir . '/questions.json';

        if (! File::exists($certsFile) || ! File::exists($questionsFile)) {
            $this->command?->warn('Aucun snapshot database/seeders/data — seeder ignoré.');
            return;
        }

        $certs = json_decode(File::get($certsFile), true) ?: [];
        $questionsBySlug = json_decode(File::get($questionsFile), true) ?: [];

        // Assure que le disque public existe (via `php artisan storage:link` normalement)
        Storage::disk('public')->makeDirectory('logos');

        foreach ($certs as $data) {
            // Restaure le logo si un fichier source correspondant existe dans data/logos
            $logoPath = $data['logo_path'] ?? null;
            if ($logoPath) {
                $srcLogo = $dataDir . '/logos/' . basename($logoPath);
                if (File::exists($srcLogo) && ! Storage::disk('public')->exists($logoPath)) {
                    Storage::disk('public')->put($logoPath, File::get($srcLogo));
                }
            }

            $cert = Certification::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'title' => $data['title'],
                    'logo_path' => $logoPath,
                    'description' => $data['description'] ?? null,
                    'long_description' => $data['long_description'] ?? null,
                    'importance' => $data['importance'] ?? null,
                    'target_roles' => $data['target_roles'] ?? null,
                    'duration_minutes' => $data['duration_minutes'] ?? 60,
                    'passing_score' => $data['passing_score'] ?? 26,
                    'total_questions' => $data['total_questions'] ?? 40,
                    'validity_months' => $data['validity_months'] ?? null,
                    'validity_note' => $data['validity_note'] ?? null,
                    'version_retires_at' => $data['version_retires_at'] ?? null,
                    'questions_updated_at' => $data['questions_updated_at'] ?? null,
                    'course_blocks' => $data['course_blocks'] ?? null,
                    'course_updated_at' => $data['course_updated_at'] ?? null,
                    'is_active' => $data['is_active'] ?? true,
                ]
            );

            // Réinjecte les questions du snapshot pour cette certif (idempotent)
            $snapshot = $questionsBySlug[$data['slug']] ?? [];
            if (empty($snapshot)) {
                continue;
            }

            // Purge puis réinsère — évite d'accumuler des doublons quand on re-seed
            $cert->questions()->delete();
            foreach ($snapshot as $qData) {
                $question = Question::create([
                    'certification_id' => $cert->id,
                    'position' => $qData['position'] ?? 1,
                    'topic' => $qData['topic'] ?? null,
                    'scenario' => $qData['scenario'] ?? null,
                    'question_text' => $qData['question_text'],
                    'explanation' => $qData['explanation'] ?? null,
                ]);
                foreach ($qData['answers'] as $aData) {
                    Answer::create([
                        'question_id' => $question->id,
                        'letter' => $aData['letter'],
                        'answer_text' => $aData['answer_text'],
                        'rationale' => $aData['rationale'] ?? null,
                        'is_correct' => (bool) $aData['is_correct'],
                    ]);
                }
            }
        }

        $this->command?->info(sprintf(
            'Snapshot restauré : %d certifications, %d questions.',
            count($certs),
            Question::count()
        ));
    }
}
