# Tests e2e (Playwright)

Ces tests pilotent un vrai navigateur contre une instance réelle de Solaive
(Next.js + serveur de sync), avec un vrai compte Supabase. Ils ne tournent
pas dans un environnement CI sans base de données — il faut un compte de
test.

## Mise en place (une seule fois)

1. Crée un compte de test dans ton projet Supabase (via `/inscription` en
   local, par exemple `test-e2e@solaive.local`).
2. Installe les navigateurs Playwright (une seule fois) :
   ```bash
   npx playwright install chromium
   ```
3. Ajoute ces variables à `.env.local` (elles ne sont lues que par les
   tests, jamais par l'app elle-même) :
   ```
   SOLAIVE_TEST_EMAIL=test-e2e@solaive.local
   SOLAIVE_TEST_PASSWORD=un-mot-de-passe-de-test
   ```

Sans ces deux variables, les tests se `skip` proprement (pas d'échec
bruyant) — pratique si quelqu'un clone le repo sans vouloir lancer les e2e
tout de suite.

## Lancer les tests

Dans un premier terminal :
```bash
npm run dev
```

Dans un second terminal, une fois que `http://localhost:3000` répond :
```bash
npm run test:e2e
```

Pour déboguer visuellement (navigateur visible, pas de reprise auto) :
```bash
npx playwright test --headed --debug
```

## Ce qui est couvert

- `board-loads.spec.ts` — un tableau nouvellement créé (et un tableau
  rechargé) doit afficher le canvas tldraw sans rester bloqué en
  chargement. Ce test aurait détecté immédiatement les deux bugs de
  connexion qu'on a corrigés récemment (accessToken vide au premier rendu,
  message "connect" perdu pendant la vérification du rôle).
- `multi-client-sync.spec.ts` — un trait dessiné par un client doit
  apparaître en temps réel chez un second client connecté au même tableau,
  sans reload (cœur du produit, cahier des charges 2.3).

## Ce qui n'est pas couvert (volontairement, pour l'instant)

- Permissions multi-comptes (lecture seule vs édition) — nécessiterait un
  second compte de test invité et une gestion d'invitation automatisée ;
  pour l'instant la logique de résolution de rôle est couverte côté unitaire
  (`server/__tests__/access-control.test.ts`), qui suffit à vérifier la
  logique sans dépendre du navigateur.
- Minuteur, sondage, mode présentateur — bons candidats pour de prochains
  tests e2e une fois les deux specs actuelles stabilisées en usage réel.
