import { expect, test } from '@playwright/test';
import { createBoard, login, requireTestCredentials } from './helpers';

// Ce test aurait détecté directement les deux régressions qu'on a chassées
// à la main récemment : la course accessToken vide au premier rendu, et la
// boucle de reconnexion WebSocket (message "connect" perdu pendant la
// vérification du rôle). Les deux se traduisaient exactement par le même
// symptôme ici : le canvas tldraw n'apparaît jamais.
test('un tableau nouvellement créé charge et affiche le canvas', async ({ page }) => {
    const { email, password } = requireTestCredentials();

    await login(page, email, password);
    await createBoard(page);

    // .tl-canvas est l'élément que tldraw monte une fois le store prêt
    // (status 'synced-remote' ou 'synced-local'). Tant que la connexion de
    // sync n'a pas abouti, seul le petit spinner de chargement de l'app est
    // visible et cet élément n'existe pas encore dans le DOM.
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15_000 });

    // Vérifie que ça reste stable : pas de nouvelle bascule en chargement
    // dans les secondes qui suivent (signature de la boucle reconnect/close
    // qu'on a corrigée — le canvas disparaîtrait et le spinner reviendrait).
    await page.waitForTimeout(3_000);
    await expect(page.locator('.tl-canvas')).toBeVisible();
});

test("un tableau existant recharge correctement après un F5", async ({ page }) => {
    const { email, password } = requireTestCredentials();

    await login(page, email, password);
    const boardUrl = await createBoard(page);
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15_000 });

    await page.goto(boardUrl);
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15_000 });
});
