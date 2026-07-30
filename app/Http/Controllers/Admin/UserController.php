<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attempt;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gestion admin des utilisateurs : liste, recherche par email/name, filtre role,
 * promotion/demotion admin, suppression. Volontairement pas d'edit complet des
 * champs user (email + name doivent rester modifiables par l'user lui-meme depuis
 * son profil pour respecter la souverainete des donnees personnelles).
 *
 * Les stats affichees a cote de chaque user sont calculees en une seule query
 * agregee (join sur attempts) pour eviter N+1 sur une page qui va grossir vite.
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $roleFilter = $request->query('role');

        $query = User::query()->select(['id', 'name', 'email', 'role', 'email_verified_at', 'last_activity_date', 'total_xp', 'current_streak', 'created_at']);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('email', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%");
            });
        }

        if (in_array($roleFilter, ['admin', 'user'], true)) {
            $query->where('role', $roleFilter);
        }

        $users = $query->orderByDesc('created_at')->limit(200)->get();

        // Aggregation attempts (count + last completed) en 1 query - evite N+1.
        $attemptStats = Attempt::select('user_id', DB::raw('COUNT(*) as attempts_count'), DB::raw('MAX(completed_at) as last_completed_at'))
            ->whereIn('user_id', $users->pluck('id'))
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        $rows = $users->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'is_admin' => $u->role === 'admin',
            'email_verified' => (bool) $u->email_verified_at,
            'last_activity_date' => $u->last_activity_date?->toDateString(),
            'total_xp' => $u->total_xp,
            'current_streak' => $u->current_streak,
            'created_at' => $u->created_at?->toIso8601String(),
            'attempts_count' => (int) ($attemptStats->get($u->id)?->attempts_count ?? 0),
            'last_completed_at' => $attemptStats->get($u->id)?->last_completed_at,
        ])->all();

        return Inertia::render('Admin/Users/Index', [
            'users' => $rows,
            'filters' => [
                'q' => $q,
                'role' => $roleFilter,
            ],
            'totals' => [
                'all' => User::count(),
                'admins' => User::where('role', 'admin')->count(),
            ],
        ]);
    }

    /**
     * Toggle du role admin. Garde-fou : impossible de se retirer soi-meme
     * les droits admin (evite un lock-out accidentel s'il n'y a qu'un admin).
     */
    public function toggleRole(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', __('flash.admin_users_cannot_change_own_role'));
        }

        $user->role = $user->role === 'admin' ? 'user' : 'admin';
        $user->save();

        return back()->with('success', __('flash.admin_users_role_updated', ['email' => $user->email, 'role' => $user->role]));
    }

    /**
     * Suppression permanente d'un compte. Le user_id sur les tables enfants
     * cascade delete (foreignId->cascadeOnDelete dans les migrations), donc
     * attempts / bookmarks / study_plans / certificates sont supprimes aussi.
     * Impossible de se supprimer soi-meme depuis l'admin (utilise /profile).
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', __('flash.admin_users_cannot_delete_self'));
        }

        $email = $user->email;
        $user->delete();

        return back()->with('success', __('flash.admin_users_deleted', ['email' => $email]));
    }
}
