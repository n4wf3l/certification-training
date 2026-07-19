<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $certifications = Certification::query()
            ->where('is_active', true)
            ->withCount('questions')
            ->orderBy('title')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'slug' => $c->slug,
                'description' => $c->description,
                'logo_path' => $c->logo_path,
                'duration_minutes' => $c->duration_minutes,
                'passing_score' => $c->passing_score,
                'total_questions' => $c->total_questions,
                'available_questions' => $c->questions_count,
                'ready' => $c->questions_count > 0,
            ]);

        return Inertia::render('Home', [
            'certifications' => $certifications,
        ]);
    }
}
