<?php

use App\Http\Controllers\Admin\CertificationController as AdminCertificationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\QuestionController as AdminQuestionController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StatsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/certifications/{certification}', [ExamController::class, 'show'])
    ->name('certifications.show');

Route::middleware(['auth'])->group(function () {
    Route::post('/certifications/{certification}/start', [ExamController::class, 'start'])
        ->name('exam.start');
    Route::get('/exam/{attempt}', [ExamController::class, 'take'])->name('exam.take');
    Route::post('/exam/{attempt}/submit', [ExamController::class, 'submit'])->name('exam.submit');
    Route::get('/exam/{attempt}/result', [ExamController::class, 'result'])->name('exam.result');

    Route::get('/stats', [StatsController::class, 'index'])->name('stats.index');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::resource('certifications', AdminCertificationController::class)->except(['show']);
    Route::resource('questions', AdminQuestionController::class)->except(['show']);
});

require __DIR__.'/auth.php';
