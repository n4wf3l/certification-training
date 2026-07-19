<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attempt;
use App\Models\Certification;
use App\Models\Question;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'certifications' => Certification::count(),
                'questions' => Question::count(),
                'users' => User::count(),
                'attempts' => Attempt::whereNotNull('completed_at')->count(),
            ],
        ]);
    }
}
