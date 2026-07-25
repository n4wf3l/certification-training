<?php

namespace App\Mail;

use App\Models\StudyPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudyPlanReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public StudyPlan $plan,
        public int $daysSinceLastActivity,
        public string $brandName = 'CertifLoop',
    ) {}

    public function envelope(): Envelope
    {
        $cert = $this->plan->certification?->title ?? 'ta certification';
        return new Envelope(
            subject: "Ton plan {$cert} attend depuis {$this->daysSinceLastActivity} jours",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.study-plan-reminder',
            with: [
                'plan' => $this->plan,
                'brandName' => $this->brandName,
                'daysSince' => $this->daysSinceLastActivity,
                'daysUntil' => $this->plan->daysUntilExam(),
            ],
        );
    }
}
