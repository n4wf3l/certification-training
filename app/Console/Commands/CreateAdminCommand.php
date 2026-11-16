<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Cree le premier compte admin en production, de facon interactive.
 * Le mot de passe est saisi au clavier (masque) : il ne passe ni par le .env,
 * ni par l'historique du shell. N'ecrase jamais un compte existant.
 *
 *   php artisan admin:create
 */
class CreateAdminCommand extends Command
{
    protected $signature = 'admin:create {--email= : Adresse email du compte admin} {--name=Admin : Nom affiche}';

    protected $description = 'Cree un compte administrateur (mot de passe saisi au clavier, 12 caracteres minimum)';

    public function handle(): int
    {
        $email = $this->option('email') ?: text('Email de l\'admin', required: true);
        $name = $this->option('name') ?: 'Admin';

        $check = Validator::make(['email' => $email], ['email' => 'required|email|max:255']);
        if ($check->fails()) {
            $this->error('Adresse email invalide.');

            return self::FAILURE;
        }
        if (User::where('email', $email)->exists()) {
            $this->error("Un compte $email existe deja : rien n'a ete modifie.");

            return self::FAILURE;
        }

        $password = password('Mot de passe (12 caracteres minimum)', required: true);
        if (strlen($password) < 12) {
            $this->error('Mot de passe trop court : 12 caracteres minimum.');

            return self::FAILURE;
        }
        if (password('Confirme le mot de passe', required: true) !== $password) {
            $this->error('Les deux mots de passe ne correspondent pas.');

            return self::FAILURE;
        }

        // forceFill : email_verified_at et last_seen_at ne sont pas "fillable".
        (new User)->forceFill([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
            'email_verified_at' => now(),
            'last_seen_at' => now(),
        ])->save();

        $this->info("Admin $email cree.");

        return self::SUCCESS;
    }
}
