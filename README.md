<div align="center">

# CertifLoop

**Adaptive certification training for IT — your mistakes come back first, until full mastery.**

Free, open-source practice platform for ITIL, CCNA, CompTIA, AWS and more.
Structured course, flashcards, and real-conditions mock exams with a spaced-repetition engine.

[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php&logoColor=white)](https://www.php.net)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Inertia](https://img.shields.io/badge/Inertia-2.x-9553E9)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![i18n](https://img.shields.io/badge/i18n-EN%20%2F%20FR-blueviolet)](#internationalisation)

[Report a bug](https://github.com/n4wf3l/certification-training/issues) · [Request a feature](https://github.com/n4wf3l/certification-training/issues) · [Features tour](FEATURES.md)

</div>

---

## Why CertifLoop

Most exam-prep tools are either **paywalled** (Whizlabs, ExamTopics premium), **passive** (long PDFs, no feedback loop), or **not calibrated** on the current version of the exam. CertifLoop takes a different bet:

- **Adaptive by design.** A spaced-repetition engine tracks every question you see. What you fail comes back first. What you master leaves the rotation. No more grinding cards you already know.
- **Real-conditions mock exams.** Timer, official passing score, randomised pool selection, syllabus-weighted domain distribution — the same shape as the real day.
- **Content stays current.** Content is generated with hardened LLM prompts that force live web research on the current exam version, refuse to invent, and respect the official blueprint weights.
- **Free and open source.** No paywall, no credit card, no trial. MIT-licensed so you can host, fork, extend.
- **Multilingual.** Full English & French UI. New locales pluggable through a single dictionary file.

Intended as a **complement** to official documentation (PeopleCert, Cisco, CompTIA, AWS) — not a replacement.

## Table of contents

- [Feature highlights](#feature-highlights)
- [Tech stack](#tech-stack)
- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [Environment configuration](#environment-configuration)
- [Development workflow](#development-workflow)
- [Project structure](#project-structure)
- [The adaptive engine](#the-adaptive-engine)
- [Internationalisation](#internationalisation)
- [Content pipeline](#content-pipeline)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Feature highlights

### For learners

- **Three complementary study modes** — structured course (10 block types), flip-flashcards with keyboard shortcuts, and real-conditions mock exams.
- **Adaptive question picker** — `user_question_stats` tracks seen / correct / wrong / streak per question. Failed questions come back first, mastered ones leave rotation.
- **Two feedback modes on exams** — deferred (traditional, corrections at the end) or instant (admin-gated, reveal after each answer).
- **Exit guard** — beforeunload plus custom Inertia modal that warns of lost progress before leaving mid-exam.
- **Progress dashboard** — evolution charts per certification (custom SVG, no dependency), lifetime KPIs, best-time / best-score comparators from attempt #2.
- **Public certificates** — passing an exam mints a shareable public certificate page with a QR-verifiable slug and downloadable PDF.
- **Gamification** — XP, badges, daily streaks with at-risk email reminders.
- **Study plans** — pick an exam date, get a paced daily target, weekday-focus domain rotation, iCal export, daily reminder + weekly digest emails.
- **AI-powered "explain me better"** — on wrong answers, an OpenAI-backed rationale generator with per-user daily rate limit and Redis-style caching.
- **Report a question** — six-category user feedback loop feeding an admin moderation queue.
- **PWA** — installable, offline mode with an offline-review page that flushes queued answers when back online.

### For administrators

- **Console dashboard** with 4 live KPIs and quick-actions.
- **Certification editor** with logo upload, syllabus blueprint editor, freshness metadata, retire-date urgency indicators.
- **Question editor** — reorderable answer editor with click-to-mark-correct, pedagogical fields (topic, scenario, rationale-per-distractor, explanation).
- **ChatGPT import wizard** for both Q&A and full courses — hardened prompts, robust JSON extractor that survives ChatGPT's inline footnotes and prose, live preview panel.
- **Bulk export** — JSON download per certification for audit or migration.
- **Question moderation** — dedicated Reports admin with status workflow.
- **Platform settings** — brand name and logo cascaded to nav, footer, favicon and `<title>`.

Full breakdown of every screen, badge and interaction in **[FEATURES.md](FEATURES.md)**.

## Tech stack

**Backend**
- Laravel 11 · PHP 8.2+ · SQLite (dev) / MySQL or PostgreSQL (prod-ready)
- Inertia.js 2.x for SPA-style navigation without an API layer
- Laravel Breeze for auth scaffolding
- Ziggy for named routes in JS
- `barryvdh/laravel-dompdf` for certificate + result PDFs

**Frontend**
- React 18 · Vite 6 · Tailwind CSS 3
- `@headlessui/react` for accessible primitives
- `vite-plugin-pwa` for offline install and service worker
- Home-grown SVG icon set (30+ icons, no icon-font dependency)
- Home-grown i18n helper reading Inertia shared props (no runtime library)

**Content**
- LLM-assisted authoring pipeline with hardened prompts (see [Content pipeline](#content-pipeline))
- All content editable inline via the admin console

## Screenshots

> Screenshots and a live demo will be added shortly. In the meantime, `php artisan migrate:fresh --seed` boots the app with 4 certifications, 170 questions and 2 demo accounts.

## Quick start

**Prerequisites**

- PHP 8.2 or newer
- Composer 2.x
- Node.js 18 or newer + npm
- SQLite (default) or any Laravel-supported database

**Clone and install**

```bash
git clone https://github.com/n4wf3l/certification-training.git
cd certification-training

composer install
npm install

cp .env.example .env
php artisan key:generate

# Create the SQLite file (default DB) and load schema + demo data
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan storage:link
```

**Run it**

```bash
composer dev
```

That single command uses `concurrently` under the hood to spin up:

- `php artisan serve` — HTTP server on `http://localhost:8000`
- `php artisan queue:listen` — queue worker for emails and background jobs
- `php artisan pail` — live log tailing
- `npm run dev` — Vite dev server with HMR

Open http://localhost:8000 and log in with the demo accounts:

| Role  | Email              | Password |
|-------|--------------------|----------|
| Admin | `admin@demo.test`  | `password` |
| User  | `user@demo.test`   | `password` |

## Environment configuration

CertifLoop runs out of the box with SQLite and Laravel's log-mail driver — zero external services required for local dev. Everything below is optional.

| Variable                    | Purpose                                                | Default        |
|-----------------------------|--------------------------------------------------------|----------------|
| `APP_LOCALE`                | Default UI locale (`en` or `fr`)                       | `en`           |
| `APP_FALLBACK_LOCALE`       | Fallback when a translation key is missing             | `en`           |
| `DB_CONNECTION`             | `sqlite`, `mysql` or `pgsql`                           | `sqlite`       |
| `MAIL_MAILER`               | `log`, `smtp`, `ses`, etc. for study-plan reminders    | `log`          |
| `OPENAI_API_KEY`            | Enables the "Explain me better (AI)" feature           | *(disabled)*   |
| `OPENAI_MODEL`              | Model name for AI explanations                         | `gpt-4o-mini`  |
| `AI_EXPLAIN_DAILY_LIMIT`    | Max AI calls per user per day (0 = disabled)           | `10`           |

## Development workflow

**Common commands**

```bash
# Boot everything (php + queue + logs + vite)
composer dev

# Rebuild assets for prod
npm run build

# Reset the DB with fresh demo data
php artisan migrate:fresh --seed

# Run tests
php artisan test

# Format PHP with Laravel Pint
./vendor/bin/pint
```

**Scheduled jobs**

Study-plan reminders, streak-at-risk emails and the weekly digest run via `routes/console.php` and Laravel's scheduler. In production, add a cron entry:

```
* * * * * cd /path/to/certifloop && php artisan schedule:run >> /dev/null 2>&1
```

## Project structure

```
app/
  Http/
    Controllers/          Public + admin controllers grouped by domain
    Middleware/           SetLocale (6-level resolution) + admin guard
  Models/                 Eloquent models (Certification, Question, Attempt, StudyPlan, ...)
  Services/               GamificationService, ...
  Console/Commands/       Scheduled artisan commands
  Mail/                   Study-plan reminder / digest mailables
database/
  migrations/             Chronological schema changes
  seeders/                Snapshot-restore seeders (idempotent)
  seeders/data/           JSON snapshots of certifications, questions, translations
lang/
  en/, fr/                Backend flash messages (Laravel translator)
resources/
  js/
    Components/           Reusable UI (Icons, BlockRenderer, LocaleSwitcher, ...)
    Layouts/              AppLayout, GuestLayout
    Pages/                Inertia pages (Home, Certification/*, Exam/*, Admin/*)
    i18n/                 en.js + fr.js dictionaries (1000+ keys each, perfect parity)
    lib/                  i18n helper, offlineCache, language metadata
  css/app.css             Tailwind + design tokens (ink / brand / iris palettes)
  views/
    emails/               Blade templates for transactional emails
    pdf/                  DOMPDF templates (certificate, exam result)
routes/
  web.php                 All HTTP routes (public + auth + admin)
  console.php             Scheduled commands
```

## The adaptive engine

The core insight is that a mock exam only teaches you something when the questions you see are calibrated to what you don't yet know.

Every answer submitted upserts a row in `user_question_stats`:

```
user_id · question_id · times_seen · times_correct · times_wrong
                     · correct_streak · last_result · last_seen_at
```

When you start a new attempt, the picker builds the pool in **priority buckets**, shuffled inside each bucket:

1. Questions you got wrong recently (`last_result = 'wrong'`), heaviest first.
2. Questions you have never seen.
3. Questions you got right once (`correct_streak = 1`).
4. Questions you have mastered (`correct_streak >= 2`) — last resort.

Layered on top:

- **Syllabus-weighted sampling** — if the certification has an official blueprint (per-domain weights), the picker draws from each domain proportionally.
- **Pedagogical dedup** — no more than one question per `concept_group_key` in a single attempt, so you never see two rephrasings of the same idea back-to-back.

Result: fail 10 questions today, and tomorrow's session brings those 10 back in a different order. Answer them right twice and they gracefully leave rotation.

## Internationalisation

CertifLoop ships with **English (primary)** and **French (secondary)**. Adding a new locale takes three steps:

1. Copy `resources/js/i18n/en.js` to `resources/js/i18n/xx.js` and translate the ~1000 keys.
2. Copy `lang/en/flash.php` to `lang/xx/flash.php` for backend messages.
3. Add `xx` to `SUPPORTED` in `app/Http/Middleware/SetLocale.php`.

Locale is resolved on every request via a six-level priority chain: `?lang=` query → session → `user.preferred_locale` → cookie → `Accept-Language` header → app fallback. Users can switch language from the navbar dropdown or the footer switcher.

**Content translations** (certification titles, questions, courses) are stored as JSON blobs on the model row via a `translations` column, with a `Certification::localized($locale, $field)` accessor that falls back cleanly when a translation is missing.

## Content pipeline

Rather than shipping a static question bank, CertifLoop treats content as a **living, admin-editable artefact** with an LLM-assisted authoring workflow:

- **Hardened prompts** — mandatory live web research on the current exam version, mandatory syllabus source citation, refusal to invent when confidence is low (fallback: return `[]` rather than hallucinate).
- **Robust JSON extractor** — handles ChatGPT's prose preambles, inline footnotes, code fences, and unescaped inner quotes.
- **Live preview** — the admin sees the parsed content rendered as it will appear to users, before committing.
- **Snapshot seeders** — `database/seeders/data/*.json` are the source of truth; `migrate:fresh --seed` restores a known-good state.

## Roadmap

- [x] Bilingual UI (EN + FR)
- [x] Adaptive question picker
- [x] Study plans + email reminders
- [x] Public certificates + PDF export
- [x] Gamification (XP, badges, streaks)
- [x] AI-powered explanations
- [x] PWA / offline mode
- [ ] Team / group leaderboards
- [ ] More certifications (Azure, GCP, Kubernetes, Terraform)
- [ ] Import from Anki decks
- [ ] Full-text search across courses and questions
- [ ] Public API (read-only) for consuming stats
- [ ] Automated exam-version detection with weekly refresh reminders

Ideas welcome — open an issue tagged `enhancement`.

## Contributing

Contributions of all sizes are welcome — typo fixes, translations for new locales, UI polish, new certification content, or full features.

1. Fork the repo and create a feature branch (`git checkout -b feat/my-thing`).
2. Follow the existing patterns:
   - **No emojis** anywhere in the codebase — use the `<Icon />` component instead.
   - **No comments describing *what*** the code does — reserve comments for the non-obvious *why*.
   - **Keep dictionary files in perfect key-parity** (`en.js` and `fr.js` must have the same tree).
   - Format PHP with `./vendor/bin/pint` before opening the PR.
3. Add or update tests where relevant.
4. Open a pull request against `main` with a clear description of the change.

For sizeable changes, open an issue first so we can align on the approach.

## License

Distributed under the [MIT License](LICENSE). See `LICENSE` for the full text.

## Acknowledgments

- Built on the shoulders of [Laravel](https://laravel.com), [Inertia.js](https://inertiajs.com), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com) and [Vite](https://vitejs.dev).
- Auth scaffolding by [Laravel Breeze](https://github.com/laravel/breeze).
- PDF rendering by [barryvdh/laravel-dompdf](https://github.com/barryvdh/laravel-dompdf).
- Design system inspired by the modern dark-first developer-tool aesthetic (Linear, Vercel, Railway).

---

<div align="center">

If CertifLoop saved you time or helped you pass a cert, consider **[leaving a star](https://github.com/n4wf3l/certification-training/stargazers)** — it genuinely helps others find the project.

</div>
