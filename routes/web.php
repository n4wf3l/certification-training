<?php

use App\Http\Controllers\Admin\CertificationController as AdminCertificationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\QuestionController as AdminQuestionController;
use App\Http\Controllers\Admin\ReportsController as AdminReportsController;
use App\Http\Controllers\AiExplanationController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificationController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuestionReportController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\StudyPlanController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

// Bascule UI locale (LocaleSwitcher navbar / footer). Accepte guest + user.
Route::post('/locale', [\App\Http\Controllers\LocaleController::class, 'update'])->name('locale.update');

// Page CGU + politique de confidentialite (statique, publique, no-auth).
// Rassemble la promesse "gratuit 12 mois" + inventaire RGPD des donnees traitees.
// L'email de contact est injecte depuis config('mail.from.address') pour eviter
// le hardcode dans les strings i18n.
Route::get('/legal', fn () => Inertia\Inertia::render('Legal', [
    'contact_email' => config('mail.from.address') ?: 'contact@example.com',
]))->name('legal');

// Fallback offline (utilise par le service worker quand aucun cache ni reseau)
Route::get('/offline', fn () => Inertia\Inertia::render('Offline'))->name('offline');

// Vue offline-review : liste des questions cachees en local
Route::get('/offline-review', fn () => Inertia\Inertia::render('OfflineReview'))->name('offline.review');

// Certificats publics par token (partage LinkedIn / preview OG) - aucune auth
Route::get('/certificate/{token}', [CertificateController::class, 'show'])->name('certificate.show');
Route::get('/certificate/{token}/pdf', [CertificateController::class, 'pdf'])->name('certificate.pdf');

Route::prefix('certifications/{certification:slug}')->group(function () {
    Route::get('/', [CertificationController::class, 'show'])->name('certifications.show');
    Route::get('/cours', [CertificationController::class, 'course'])->name('certifications.course');
    Route::get('/flashcards', [CertificationController::class, 'flashcards'])->name('certifications.flashcards');
    Route::get('/examen', [ExamController::class, 'show'])->name('certifications.exam');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/certifications/{certification:slug}/start', [ExamController::class, 'start'])
        ->name('exam.start');
    Route::post('/certifications/{certification:slug}/practice/{domain}', [ExamController::class, 'practiceStart'])
        ->name('exam.practice');
    Route::get('/exam/{attempt}', [ExamController::class, 'take'])->name('exam.take');
    Route::post('/exam/{attempt}/submit', [ExamController::class, 'submit'])->name('exam.submit');
    Route::post('/exam/{attempt}/abandon', [ExamController::class, 'abandon'])->name('exam.abandon');
    Route::get('/exam/{attempt}/result', [ExamController::class, 'result'])->name('exam.result');
    Route::get('/exam/{attempt}/result/pdf', [ExamController::class, 'downloadResult'])->name('exam.result.pdf');

    Route::get('/stats', [StatsController::class, 'index'])->name('stats.index');

    // Study plans (revision organisee jusqu'a une date d'examen precise)
    Route::get('/study-plans', [StudyPlanController::class, 'index'])->name('study-plans.index');
    Route::get('/study-plans/create', [StudyPlanController::class, 'create'])->name('study-plans.create');
    Route::post('/study-plans', [StudyPlanController::class, 'store'])->name('study-plans.store');
    Route::get('/study-plans/{studyPlan}', [StudyPlanController::class, 'show'])->name('study-plans.show');
    Route::delete('/study-plans/{studyPlan}', [StudyPlanController::class, 'destroy'])->name('study-plans.destroy');
    Route::get('/study-plans/{studyPlan}/calendar.ics', [StudyPlanController::class, 'ics'])->name('study-plans.ics');

    Route::post('/questions/{question}/report', [QuestionReportController::class, 'store'])->name('questions.report');
    Route::post('/questions/{question}/explain-me-better', [AiExplanationController::class, 'explain'])->name('questions.explain');

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
    Route::get('certifications/{certification}/certificate-preview', [AdminCertificationController::class, 'certificatePreview'])
        ->name('certifications.certificate-preview');
    Route::get('certifications/course-import', [AdminCertificationController::class, 'courseImportForm'])
        ->name('certifications.course-import');
    Route::post('certifications/course-import', [AdminCertificationController::class, 'courseImportStore'])
        ->name('certifications.course-import.store');
    Route::resource('certifications', AdminCertificationController::class)->except(['show']);
    Route::get('questions/import', [AdminQuestionController::class, 'importForm'])->name('questions.import');
    Route::post('questions/import', [AdminQuestionController::class, 'importStore'])->name('questions.import.store');
    Route::resource('questions', AdminQuestionController::class)->except(['show']);

    Route::get('reports', [AdminReportsController::class, 'index'])->name('reports.index');
    Route::patch('reports/{report}', [AdminReportsController::class, 'update'])->name('reports.update');
});

require __DIR__.'/auth.php';
