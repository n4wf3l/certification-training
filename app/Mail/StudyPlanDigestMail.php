<?php

namespace App\Mail;

use App\Models\StudyPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudyPlanDigestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public StudyPlan $plan,
        public array $stats,
        public string $brandName = 'CertifLoop',
    ) {}

    public function envelope(): Envelope
    {
        $cert = $this->plan->certification?->title ?? __('emails.plan_digest.subject_cert_fallback');
        return new Envelope(
            subject: __('emails.plan_digest.subject', [
                'brand' => $this->brandName,
                'cert' => $cert,
            ]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.study-plan-digest',
            with: [
                'plan' => $this->plan,
                'brandName' => $this->brandName,
                'stats' => $this->stats,
                'daysUntil' => $this->plan->daysUntilExam(),
            ],
        );
    }
}
