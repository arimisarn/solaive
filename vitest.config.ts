import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['server/**/*.test.ts', 'lib/**/*.test.ts'],
        // e2e/ est réservé à Playwright, jamais ramassé ici.
        exclude: ['node_modules', 'e2e', '.next'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
