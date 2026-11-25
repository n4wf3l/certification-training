// Base dediee aux tests de parcours, recreee a chaque lancement :
// toutes les questions et les comptes de demo (seeder en environnement local).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { E2E_ENV } from '../../playwright.config.js';

export default function globalSetup() {
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(E2E_ENV.DB_DATABASE + suffix, { force: true });
    fs.writeFileSync(E2E_ENV.DB_DATABASE, '');
    execFileSync('php', ['artisan', 'migrate:fresh', '--seed', '--force'], {
        env: { ...process.env, ...E2E_ENV },
        stdio: 'inherit',
    });
}
