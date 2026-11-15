<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InactiveAccountWarningMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $brandName = 'CertifLoop', public int $days = 7)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('emails.inactive.subject', ['days' => $this->days]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inactive-account-warning',
            with: [
                'user' => $this->user,
                'brandName' => $this->brandName,
                'days' => $this->days,
            ],
        );
    }
}
