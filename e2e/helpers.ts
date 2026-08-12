import { type Page, test } from '@playwright/test';

/**
 * Identifiants d'un compte de test réel (voir e2e/README.md pour la mise en
 * place). Les specs appellent `requireTestCredentials()` en premier pour
 * SKIP proprement si les variables ne sont pas définies, plutôt que
 * d'échouer bruyamment sans contexte utile.
 */
export function requireTestCredentials() {
    const email = process.env.SOLAIVE_TEST_EMAIL;
    const password = process.env.SOLAIVE_TEST_PASSWORD;
    test.skip(!email || !password, 'SOLAIVE_TEST_EMAIL / SOLAIVE_TEST_PASSWORD non définies — voir e2e/README.md');
    return { email: email!, password: password! };
}

export async function login(page: Page, email: string, password: string) {
    await page.goto('/connexion');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL('**/tableau-de-bord', { timeout: 15_000 });
}

/**
 * Crée un tableau depuis le tableau de bord et navigue dessus. Renvoie son
 * URL. Le bouton "Nouveau tableau" n'ouvre pas directement un tableau : il
 * ouvre une boîte de dialogue (TemplatePickerDialog) où il faut d'abord
 * saisir un titre (les boutons de choix sont désactivés tant que le champ
 * est vide), puis choisir "Tableau vierge".
 */
export async function createBoard(page: Page, titre = `Test e2e ${Date.now()}`) {
    await page.getByRole('button', { name: /Nouveau tableau/ }).click();
    await page.getByPlaceholder('Ex. Sprint planning Q3').fill(titre);
    await page.getByRole('button', { name: 'Tableau vierge' }).click();
    await page.waitForURL('**/tableau/**', { timeout: 15_000 });
    return page.url();
}