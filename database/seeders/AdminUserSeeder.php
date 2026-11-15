<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * En local / test : comptes de demo admin@example.com et user@example.com (mot de passe "password").
     *
     * En production : aucun compte de demo. L'admin vient de ADMIN_EMAIL / ADMIN_PASSWORD
     * (12 caracteres minimum). Sans ces variables, rien n'est cree : utiliser
     * `php artisan tinker` ou relancer le seeder une fois les variables posees.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->seedProductionAdmin();

            return;
        }

        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );
    }

    private function seedProductionAdmin(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (blank($email) || blank($password)) {
            $this->command?->warn('Production : ADMIN_EMAIL / ADMIN_PASSWORD absents, aucun compte admin cree.');

            return;
        }
        if (strlen($password) < 12 || $password === 'password') {
            throw new \RuntimeException('ADMIN_PASSWORD trop faible : 12 caracteres minimum.');
        }
        if (User::where('email', $email)->exists()) {
            // Ne jamais ecraser le mot de passe d'un admin existant a chaque deploiement.
            $this->command?->info("Production : l'admin $email existe deja, inchange.");

            return;
        }

        User::create([
            'name' => 'Admin',
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        $this->command?->info("Production : admin $email cree. Retirer ADMIN_PASSWORD du .env.");
    }
}
