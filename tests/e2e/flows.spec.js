// Parcours complets, joues comme un utilisateur (iPhone WebKit et ordinateur Chromium).
// Lancer : npm run test:e2e   (tests/e2e/README a la racine de playwright.config.js)
import { expect, test } from '@playwright/test';

const USER = { email: 'user@example.com', password: 'password' };
const RESULT_URL = /\/exam\/\d+\/result$/;
const TAKE_URL = /\/exam\/\d+$/;

async function login(page) {
    await page.goto('/login');
    await page.locator('input[type=email]').fill(USER.email);
    await page.locator('input[type=password]').fill(USER.password);
    await page.locator('input[type=password]').press('Enter');
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));
}

async function startSprint(page, slug) {
    await page.goto(`/certifications/${slug}`);
    await page.getByRole('button', { name: 'Start a sprint' }).click();
    await page.waitForURL(TAKE_URL);
    // Fin de l'animation d'ouverture du chrono.
    await page.waitForTimeout(1500);
}

/** Options de reponse de la question affichee : boutons dont la pastille porte A, B, C ou D. */
function answerOptions(page) {
    return page.locator('main button:has(> span:text-matches("^[A-D]$"))');
}

/** Si la confirmation « Finish now? » s'ouvre, la valider. */
async function confirmFinishIfAsked(page) {
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
        await dialog.getByRole('button', { name: 'Finish', exact: true }).click();
    }
}

/**
 * Repond (premiere option) puis passe a la suite, quel que soit le mode :
 * barre de correction (entrainement), « Next » libre ou sequentiel (CCNA).
 * Les questions sans option a cocher (association) sont passees.
 */
async function answerAndAdvance(page) {
    const options = answerOptions(page);
    if (await options.count()) {
        const first = options.first();
        if (await first.isEnabled()) await first.click();
    }
    const bar = page.getByRole('status').filter({ has: page.getByRole('button') });
    const button = (await bar.isVisible().catch(() => false))
        ? bar.getByRole('button')
        : page.locator('main').getByRole('button', { name: /^(Next|Finish the exam)$/ }).first();
    const finishing = /Finish/.test(await button.innerText());
    await button.click();
    if (finishing) {
        // Derniere question : confirmation eventuelle, puis page de resultat.
        await page.waitForTimeout(300);
        await confirmFinishIfAsked(page);
        await page.waitForURL(RESULT_URL);
    }
    return finishing;
}

async function finishAllQuestions(page, max) {
    for (let i = 0; i < max; i += 1) {
        if (await answerAndAdvance(page)) return;
    }
    throw new Error(`Aucun bouton « Finish » apres ${max} questions`);
}

test.describe('Visiteur', () => {
    test('accueil en anglais, version francaise sous /fr, anciennes adresses /en redirigees', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('h1')).toContainText('Pass your IT cert');

        await page.goto('/en/legal');
        await expect(page).toHaveURL(/\/legal$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');

        await page.goto('/legal');
        await page.locator('footer').getByTitle('French').click();
        await page.waitForURL(/\/fr\/legal$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    });

    test("inscription jusqu'a la verification de l'adresse", async ({ page }) => {
        await page.goto('/register');
        await page.locator('#name').fill('Parcours E2E');
        await page.locator('#email').fill(`e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`);
        await page.locator('#password').fill('Correct-Horse-42!');
        await page.locator('#password_confirmation').fill('Correct-Horse-42!');
        // Protection anti-robot : un formulaire envoye en moins de 3 s est refuse.
        await page.waitForTimeout(3200);
        await page.getByRole('button', { name: 'Create my free account' }).click();
        await page.waitForURL(/verify-email/);
        await expect(page.getByText('Confirm your email address')).toBeVisible();
    });
});

test.describe('Utilisateur connecte', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('examen blanc ITIL complet, de la confirmation au resultat', async ({ page }) => {
        await page.goto('/certifications/itil-foundation-v5/examen');
        await page.getByRole('button', { name: 'Start the exam' }).first().click();
        await page.getByRole('button', { name: 'Confirm and start' }).click();
        await page.waitForURL(TAKE_URL);
        await page.waitForTimeout(1500);

        await finishAllQuestions(page, 45);
        // Toutes les questions ont recu une reponse : le score n'est pas nul.
        await expect(page.getByText(/^[1-9]\d*\/40$/).first()).toBeVisible();
    });

    test("« Finish » sans aucune reponse : confirmation puis resultat a 0", async ({ page }) => {
        await startSprint(page, 'itil-foundation-v5');
        await page.getByRole('button', { name: 'Finish', exact: true }).last().click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toContainText('Unanswered questions: 10');
        await dialog.getByRole('button', { name: 'Finish', exact: true }).click();

        await page.waitForURL(RESULT_URL);
        await expect(page.getByText('0/10').first()).toBeVisible();
    });

    test('sprint ITIL avec correction immediate, puis « Another sprint »', async ({ page }) => {
        await startSprint(page, 'itil-foundation-v5');
        await finishAllQuestions(page, 12);
        await expect(page.getByText('Sprint complete')).toBeVisible();

        await page.getByRole('button', { name: 'Another sprint' }).click();
        await page.waitForURL(TAKE_URL);
    });

    test('sprint CCNA en navigation sequentielle (sans retour arriere)', async ({ page }) => {
        await startSprint(page, 'ccna-200-301');
        await expect(page.locator('main').getByRole('button', { name: 'Previous' })).toHaveCount(0);
        await finishAllQuestions(page, 12);
        await expect(page.getByText('Sprint complete')).toBeVisible();
    });

    test('chrono ecoule sans reponse : la session se termine toute seule', async ({ page }) => {
        // Horloge controlee : on avance de 16 minutes au lieu d'attendre.
        await page.clock.install();
        await startSprint(page, 'itil-foundation-v5');
        await page.clock.fastForward('16:00');
        await page.waitForURL(RESULT_URL);
        await expect(page.getByText('0/10').first()).toBeVisible();
    });
});
