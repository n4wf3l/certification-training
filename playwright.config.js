// Tests de parcours dans un vrai navigateur (npm run test:e2e).
// Deux profils : iPhone avec le moteur de Safari (WebKit) et ordinateur (Chromium).
// Le serveur Laravel tourne sur une base SQLite dediee, recreee a chaque lancement
// (tests/e2e/global-setup.js), avec les comptes de demo du seeder local.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const PORT = 8010;
export const E2E_ENV = {
    APP_ENV: 'local',
    APP_DEBUG: 'true',
    APP_URL: `http://127.0.0.1:${PORT}`,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: path.resolve('database/e2e.sqlite'),
    // Pas de limite de debit entre les parcours (le limiteur vit dans le cache).
    CACHE_STORE: 'array',
    QUEUE_CONNECTION: 'sync',
    MAIL_MAILER: 'log',
    SESSION_DRIVER: 'file',
};

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 120_000,
    expect: { timeout: 15_000 },
    // Un seul navigateur a la fois : les parcours partagent les comptes de demo.
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    globalSetup: './tests/e2e/global-setup.js',
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        locale: 'en-US',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'iphone', use: { ...devices['iPhone 13'] } },
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: `php artisan serve --host=127.0.0.1 --port=${PORT}`,
        url: `http://127.0.0.1:${PORT}/up`,
        env: { ...process.env, ...E2E_ENV, PHP_CLI_SERVER_WORKERS: '4' },
        reuseExistingServer: false,
        timeout: 60_000,
    },
});
