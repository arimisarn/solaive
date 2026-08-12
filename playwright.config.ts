import { existsSync, readFileSync } from 'fs';
import { defineConfig, devices } from '@playwright/test';

// Contrairement à Next.js (et à tsx watch --env-file, utilisé pour le
// serveur de sync), Playwright ne charge PAS .env.local tout seul quand on
// lance `playwright test` directement. Sans ça, SOLAIVE_TEST_EMAIL et
// SOLAIVE_TEST_PASSWORD ne sont jamais visibles dans process.env et tous
// les tests se retrouvent skip (c'est exactement ce qui vient de se
// produire). Parsing minimal fait à la main plutôt que d'ajouter une
// dépendance dotenv juste pour ça, ou de dépendre de process.loadEnvFile
// (trop récent : pas encore typé dans la version de @types/node du projet).
if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: 'list',
    timeout: 30_000,
    use: {
        baseURL: process.env.SOLAIVE_BASE_URL ?? 'http://localhost:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // On suppose que `npm run dev` tourne déjà (Next.js + serveur de sync) —
    // les deux processus sont nécessaires et `webServer` ne gère qu'une seule
    // commande proprement, donc on laisse le développeur lancer `npm run dev`
    // lui-même avant `npm run test:e2e`, comme documenté dans e2e/README.md.
});