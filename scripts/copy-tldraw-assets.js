// Copie les assets statiques de tldraw (icônes, polices, traductions) dans
// public/tldraw-assets, pour les servir depuis notre propre domaine plutôt
// que depuis cdn.tldraw.com. Nécessaire car Firefox refuse de charger un
// sprite SVG <use> cross-origin (contrairement à Chrome) — voir la doc
// tldraw sur le "self-hosting" : https://tldraw.dev/docs/assets
const fs = require('fs');
const path = require('path');

const CANDIDATE_PATHS = [
    path.join(__dirname, '..', 'node_modules', '@tldraw', 'assets'),
    path.join(__dirname, '..', 'node_modules', 'tldraw', 'node_modules', '@tldraw', 'assets'),
];
const SRC = CANDIDATE_PATHS.find((p) => fs.existsSync(p));
const DEST = path.join(__dirname, '..', 'public', 'tldraw-assets');

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

if (!SRC) {
    console.warn(
        `[copy-tldraw-assets] @tldraw/assets introuvable dans : ${CANDIDATE_PATHS.join(' ni ')}. Vérifie que @tldraw/assets est bien listé dans package.json et que npm install a tourné.`
    );
    process.exit(0);
}

// On ne copie que les dossiers d'assets réels (pas les fichiers .js d'aide
// comme imports.js, urls.js, selfHosted.js qui vivent à la racine du package).
const ASSET_DIRS = ['fonts', 'icons', 'translations', 'embed-icons'];

for (const dir of ASSET_DIRS) {
    const srcDir = path.join(SRC, dir);
    if (fs.existsSync(srcDir)) {
        copyRecursive(srcDir, path.join(DEST, dir));
    }
}

console.log(`[copy-tldraw-assets] Assets copiés vers ${DEST}`);