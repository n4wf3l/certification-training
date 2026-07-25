# Contributing to CertifLoop

Thanks for taking the time to contribute. This document is short on purpose — the goal is to get you productive fast.

## Ways to help

- **Report a bug** — open an issue with steps to reproduce, expected vs actual behaviour, and your environment.
- **Suggest a feature** — open an issue tagged `enhancement`. For non-trivial work, please align on the approach before writing code.
- **Improve content** — new certifications, better rationales, updated syllabuses. See the admin ChatGPT import wizard for the standard workflow.
- **Add a locale** — copy `resources/js/i18n/en.js` and `lang/en/flash.php`, translate, add the code to `SetLocale::SUPPORTED`.
- **Polish the UI** — micro-interactions, accessibility fixes, dark-mode edge cases.
- **Ship code** — features, refactors, tests.

## Development setup

See the [Quick start](README.md#quick-start) section of the README. In short:

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed && php artisan storage:link
composer dev
```

Log in with `admin@demo.test` / `password` for the admin console, or `user@demo.test` / `password` for the learner view.

## Coding conventions

These are non-negotiable — code that violates them will be flagged in review.

- **No emojis** anywhere in the codebase (JSX, dict files, comments, commit messages). Use the `<Icon />` component in `resources/js/Components/Icons.jsx` for pictograms.
- **Comments explain *why*, not *what***. Well-named identifiers already say what. Reserve comments for hidden constraints, subtle invariants, or workarounds — the stuff a reader could not infer from the code.
- **Dictionary key-parity is sacred.** Every key in `resources/js/i18n/en.js` must exist in `resources/js/i18n/fr.js` and vice versa. Same for `lang/en/*.php` and `lang/fr/*.php`. Run the parity check before opening a PR:

  ```bash
  node -e "const en=require('./resources/js/i18n/en.js').default;const fr=require('./resources/js/i18n/fr.js').default;const k=o=>{let r=[];for(const x in o){const v=o[x];v&&typeof v==='object'&&!Array.isArray(v)?r.push(...k(v).map(y=>x+'.'+y)):r.push(x)}return r};const e=k(en).sort(),f=k(fr).sort();console.log('en-only:',e.filter(x=>!f.includes(x)));console.log('fr-only:',f.filter(x=>!e.includes(x)))"
  ```

- **English is the primary UI language.** Write EN copy first, translate to FR second. Both must feel native, not literal.
- **Format PHP with Pint** before pushing: `./vendor/bin/pint`.
- **Small, focused PRs.** One concern per PR, one commit per logical change (or squash on merge).
- **Update `FEATURES.md`** when you add a user-visible capability.

## Commit style

Follow conventional-ish commits — the type prefix helps skim history.

```
feat: instant feedback mode on exams (admin-gated)
fix: locale switcher no longer flashes on route change
docs: add screenshot to README hero
refactor: extract question picker into a service
```

Keep the subject under 72 characters. Use the body for the *why* and the trade-offs, not the *what* (the diff shows that).

## Pull request checklist

Before requesting review:

- [ ] The app builds cleanly (`npm run build` and `composer dev` both succeed).
- [ ] Tests pass (`php artisan test`).
- [ ] Any new user-visible string is in both `en.js` and `fr.js` (or both `lang/en/*.php` and `lang/fr/*.php`).
- [ ] No emojis introduced.
- [ ] `FEATURES.md` updated if the change is user-visible.
- [ ] PR description explains the motivation and links any related issue.

## Reporting a security issue

Please do **not** open a public issue for security vulnerabilities. Email the maintainer directly instead. See the repository's contact information on the profile.

## Code of conduct

Be kind, be patient, assume good faith. Disagreement is fine — condescension, harassment, and dismissiveness are not. Maintainers reserve the right to close discussions that stop being productive.

Thanks again for contributing.
