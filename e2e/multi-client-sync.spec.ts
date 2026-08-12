import { expect, test } from '@playwright/test';
import { createBoard, login, requireTestCredentials } from './helpers';

// Couvre le cœur du produit (cahier des charges 2.3 : synchronisation
// instantanée des modifications entre tous les participants) avec deux
// contextes de navigateur totalement séparés (cookies/storage indépendants,
// comme deux personnes réelles), plutôt que deux onglets qui partageraient
// la session Supabase.
test('un trait dessiné par un client apparaît en temps réel chez un second client', async ({ browser }, testInfo) => {
    // Ce test fait DEUX connexions complètes (deux allers-retours réseau vers
    // Supabase Auth) plus une création de tableau plus deux vérifications de
    // canvas — mécaniquement plus long que les autres specs, qui n'en font
    // qu'une. test.slow() triple le timeout par défaut du test (au lieu de
    // relever le timeout global pour tout le monde dans playwright.config.ts,
    // ce qui masquerait un vrai blocage sur les tests plus simples).
    testInfo.slow();
    const { email, password } = requireTestCredentials();

    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await login(ownerPage, email, password);
    const boardUrl = await createBoard(ownerPage);
    await expect(ownerPage.locator('.tl-canvas')).toBeVisible({ timeout: 15_000 });

    // Deuxième client : même compte, contexte de navigateur séparé — suffit
    // à prouver la synchro réseau (le but ici n'est pas de tester les
    // permissions multi-comptes, couvertes par server/__tests__).
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await login(guestPage, email, password);
    await guestPage.goto(boardUrl);
    await expect(guestPage.locator('.tl-canvas')).toBeVisible({ timeout: 15_000 });

    // Laisse les deux sockets finir leur poignée de main initiale.
    await ownerPage.waitForTimeout(1_000);

    // Sélectionne l'outil rectangle (raccourci clavier tldraw standard) et
    // dessine une forme sur le premier client.
    await ownerPage.keyboard.press('r');
    const canvasBox = await ownerPage.locator('.tl-canvas').boundingBox();
    if (!canvasBox) throw new Error('Canvas introuvable chez le premier client.');

    await ownerPage.mouse.move(canvasBox.x + 150, canvasBox.y + 150);
    await ownerPage.mouse.down();
    await ownerPage.mouse.move(canvasBox.x + 350, canvasBox.y + 300);
    await ownerPage.mouse.up();

    // La forme doit apparaître chez le second client sans reload, dans un
    // délai raisonnable (objectif du cahier des charges : < 150ms de
    // latence de synchro, on laisse une marge large ici pour un test e2e).
    await expect(guestPage.locator('.tl-shape')).toHaveCount(1, { timeout: 5_000 });

    await ownerContext.close();
    await guestContext.close();
});