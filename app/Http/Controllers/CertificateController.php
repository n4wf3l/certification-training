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

        // Le certificat CertifLoop est un signal international destine aux
        // recruteurs / LinkedIn : on force la langue en EN quel que soit le
        // UI locale du user au moment du telechargement.
        app()->setLocale('en');

        // Verification anchor : URL publique de la page de partage + QR SVG qui
        // pointe dessus. Un recruteur scanne le QR ou visite l'URL en clair,
        // tombe sur la vue publique et confirme l'existence du certificat en DB.
        $verificationUrl = route('certificate.show', $cert->token);
        $qrDataUri = self::qrCodeDataUri($verificationUrl);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.certificate', [
            'user_name' => $cert->user?->name ?? 'Candidat',
            'certification_title' => $cert->certification?->title ?? '',
            'mastery_pct' => $cert->mastery_pct,
            'best_score' => $cert->best_score,
            'total_questions' => $cert->total_questions,
            'awarded_date' => $cert->awarded_at?->translatedFormat('d F Y'),
            'brand_name' => $brandName,
            'token' => $cert->token,
            'verification_url' => $verificationUrl,
            'qr_data_uri' => $qrDataUri,
        ])->setPaper('a4', 'landscape');

        $filename = sprintf(
            'certificat-%s-%s.pdf',
            $cert->certification?->slug ?? 'certif',
            $cert->awarded_at?->format('Y-m-d') ?? 'now'
        );

        return $pdf->download($filename);
    }

    /**
     * Genere un QR code PNG (base64 data URI) pointant sur l'URL de verification.
     * On utilise endroid/qr-code avec le PngWriter GD-based (image raster)
     * plutot que du SVG parce que DomPDF gere mal les SVG a paths complexes
     * (rendu vide dans le PDF). PNG data URI = bulletproof dans DomPDF.
     *
     * Retourne un string prêt à mettre dans src="..." d'une balise <img>.
     */
    public static function qrCodeDataUri(string $url, int $size = 300): string
    {
        $result = \Endroid\QrCode\Builder\Builder::create()
            ->writer(new \Endroid\QrCode\Writer\PngWriter())
            ->data($url)
            ->size($size)
            ->margin(4)
            ->errorCorrectionLevel(\Endroid\QrCode\ErrorCorrectionLevel::Medium)
            ->build();

        return $result->getDataUri();
    }
}
