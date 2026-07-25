<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StreakAtRiskMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $brandName = 'CertifLoop')
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Ton streak de {$this->user->current_streak} jours est en danger",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.streak-at-risk',
            with: [
                'user' => $this->user,
                'brandName' => $this->brandName,
                'streak' => $this->user->current_streak,
            ],
        );
    }
}
