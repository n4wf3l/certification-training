<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /** Champ piege invisible : un humain ne le voit pas, un robot le remplit. */
    public const HONEYPOT = 'website';

    /** Un humain met plus de 3 secondes a remplir le formulaire. */
    public const MIN_SECONDS = 3;

    public function create(Request $request): Response
    {
        if ($request->filled('redirect_to')) {
            $to = (string) $request->string('redirect_to');
            // Chemin interne seulement ("//autre-site" serait une redirection externe).
            if (str_starts_with($to, '/') && ! str_starts_with($to, '//')) {
                $request->session()->put('url.intended', url($to));
            }
        }

        $request->session()->put('register_form_at', now()->timestamp);

        return Inertia::render('Auth/Register', [
            'redirect_to' => $request->query('redirect_to'),
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $this->rejectBots($request);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Envoie le lien de confirmation (User implemente MustVerifyEmail).
        event(new Registered($user));

        Auth::login($user);

        // Les pages qui comptent (examens, stats) attendent la confirmation : on y renvoie
        // apres le clic sur le lien (url.intended est conserve).
        return redirect()->route('verification.notice');
    }

    /**
     * Honeypot rempli ou formulaire envoye trop vite : refus sans creer de compte.
     *
     * @throws ValidationException
     */
    private function rejectBots(Request $request): void
    {
        $startedAt = (int) $request->session()->get('register_form_at', 0);
        $tooFast = $startedAt === 0 || now()->timestamp - $startedAt < self::MIN_SECONDS;

        if ($request->filled(self::HONEYPOT) || $tooFast) {
            throw ValidationException::withMessages(['email' => __('flash.register_rejected')]);
        }
    }
}
