<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\UserCertificate;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    /**
     * Vue publique du certificat par token (pour partage LinkedIn / preview OpenGraph).
     * Aucune auth requise - c'est le principe du certificat public.
     */
    public function show(string $token): Response
    {
        $cert = UserCertificate::where('token', $token)
            ->with(['user:id,name', 'certification:id,title,slug,logo_path,description'])
            ->firstOrFail();

        $brandName = Setting::get('brand_name') ?: 'CertifLoop';
        $publicUrl = route('certificate.show', $token);

        return Inertia::render('Certificate/Show', [
            'certificate' => [
                'token' => $cert->token,
                'awarded_at' => $cert->awarded_at?->toIso8601String(),
                'awarded_date' => $cert->awarded_at?->translatedFormat('d F Y'),
                'best_score' => $cert->best_score,
                'total_questions' => $cert->total_questions,
                'mastery_pct' => $cert->mastery_pct,
                'user_name' => $cert->user?->name ?? 'Candidat',
                'certification' => [
                    'title' => $cert->certification?->title,
                    'logo_path' => $cert->certification?->logo_path,
                    'description' => $cert->certification?->description,
                ],
            ],
            'brand_name' => $brandName,
            'public_url' => $publicUrl,
            'linkedin_share_url' => 'https://www.linkedin.com/sharing/share-offsite/?url=' . urlencode($publicUrl),
            // Meta OpenGraph pour previews sociaux
            'og' => [
                'title' => "Certificat {$brandName} - {$cert->certification?->title}",
                'description' => "{$cert->user?->name} a atteint {$cert->mastery_pct}% de maitrise sur {$cert->certification?->title}",
                'url' => $publicUrl,
            ],
        ]);
    }

    /**
     * Telechargement PDF du certificat.
     */
    public function pdf(string $token)
    {
        $cert = UserCertificate::where('token', $token)
            ->with(['user:id,name', 'certification:id,title,slug'])
            ->firstOrFail();

        $brandName = Setting::get('brand_name') ?: 'CertifLoop';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.certificate', [
            'user_name' => $cert->user?->name ?? 'Candidat',
            'certification_title' => $cert->certification?->title ?? '',
            'mastery_pct' => $cert->mastery_pct,
            'best_score' => $cert->best_score,
            'total_questions' => $cert->total_questions,
            'awarded_date' => $cert->awarded_at?->translatedFormat('d F Y'),
            'brand_name' => $brandName,
            'token' => $cert->token,
        ])->setPaper('a4', 'landscape');

        $filename = sprintf(
            'certificat-%s-%s.pdf',
            $cert->certification?->slug ?? 'certif',
            $cert->awarded_at?->format('Y-m-d') ?? 'now'
        );

        return $pdf->download($filename);
    }
}
