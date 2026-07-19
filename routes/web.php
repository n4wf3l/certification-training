<?php

use App\Http\Controllers\Admin\CertificationController as AdminCertificationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\QuestionController as AdminQuestionController;
use App\Http\Controllers\CertificationController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StatsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::prefix('certifications/{certification:slug}')->group(function () {
    Route::get('/', [CertificationController::class, 'show'])->name('certifications.show');
    Route::get('/cours', [CertificationController::class, 'course'])->name('certifications.course');
    Route::get('/flashcards', [CertificationController::class, 'flashcards'])->name('certifications.flashcards');
    Route::get('/examen', [ExamController::class, 'show'])->name('certifications.exam');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/certifications/{certification:slug}/start', [ExamController::class, 'start'])
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
    Route::get('settings', [\App\Http\Controllers\Admin\SettingsController::class, 'edit'])->name('settings.edit');
    Route::post('settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('settings.update');
    Route::get('certifications/{certification}/export', [AdminCertificationController::class, 'export'])
        ->name('certifications.export');
    Route::get('certifications/course-import', [AdminCertificationController::class, 'courseImportForm'])
        ->name('certifications.course-import');
    Route::post('certifications/course-import', [AdminCertificationController::class, 'courseImportStore'])
        ->name('certifications.course-import.store');
    Route::resource('certifications', AdminCertificationController::class)->except(['show']);
    Route::get('questions/import', [AdminQuestionController::class, 'importForm'])->name('questions.import');
    Route::post('questions/import', [AdminQuestionController::class, 'importStore'])->name('questions.import.store');
    Route::resource('questions', AdminQuestionController::class)->except(['show']);
});

require __DIR__.'/auth.php';
