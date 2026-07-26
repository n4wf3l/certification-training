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
        $cert = $this->plan->certification?->title ?? __('emails.plan_reminder.subject_cert_fallback');
        return new Envelope(
            subject: __('emails.plan_reminder.subject', [
                'cert' => $cert,
                'days' => $this->daysSinceLastActivity,
            ]),
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
