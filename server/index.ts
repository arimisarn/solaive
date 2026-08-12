import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { WebSocketServer } from 'ws';
import { TLSocketRoom, type RoomSnapshot } from '@tldraw/sync-core';
import { createTLSchema, type TLRecord } from '@tldraw/tlschema';
import { createClient } from '@supabase/supabase-js';
import { getUserRoleForBoard as resolveUserRoleForBoard, type SupabaseLike } from './access-control';

const PORT = 5858;
const SAVE_INTERVAL_MS = 20_000;
// Intervalle d'archivage dans l'historique des versions : volontairement plus
// espacé que SAVE_INTERVAL_MS (qui ne fait que persister l'état courant).
// Avec la purge à 20 versions/tableau côté SQL, 20s donnerait à peine 6-7min
// d'historique ; 5min donne ~1h40 d'historique glissant.
const VERSION_INTERVAL_MS = 5 * 60_000;
// Délai de grâce avant de considérer une room vraiment vide : absorbe les
// micro-déconnexions/reconnexions (Strict Mode en dev, refresh de page,
// changement d'onglet bref) qui ne doivent PAS déclencher une fermeture
// + sauvegarde prématurée d'un snapshot potentiellement incomplet.
const EMPTY_ROOM_GRACE_MS = 10_000;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function loadSnapshot(roomId: string): Promise<RoomSnapshot | undefined> {
    const { data } = await supabase
        .from('tableaux')
        .select('snapshot')
        .eq('id', roomId)
        .maybeSingle();

    return (data?.snapshot as RoomSnapshot | null) ?? undefined;
}

async function saveSnapshot(roomId: string, snapshot: RoomSnapshot) {
    const { error } = await supabase
        .from('tableaux')
        .update({ snapshot })
        .eq('id', roomId);

    if (error) console.error(`Échec sauvegarde room ${roomId}:`, error.message);
}

// Mémorise le dernier snapshot archivé par room (sérialisé) pour éviter
// d'empiler des versions identiques dans l'historique quand personne ne
// modifie rien pendant plusieurs cycles de VERSION_INTERVAL_MS.
const lastArchivedSnapshots = new Map<string, string>();

async function archiveVersion(roomId: string, snapshot: RoomSnapshot) {
    const serialized = JSON.stringify(snapshot);
    if (lastArchivedSnapshots.get(roomId) === serialized) return;

    const { error } = await supabase.from('tableau_versions').insert({
        tableau_id: roomId,
        snapshot,
    });

    if (error) {
        console.error(`Échec archivage version room ${roomId}:`, error.message);
        return;
    }
    lastArchivedSnapshots.set(roomId, serialized);
}

// Réplique en JS la logique de la fonction SQL `tableau_est_accessible` :
// on tourne avec la clé service_role (qui contourne RLS), donc l'accès doit
// être vérifié à la main avant toute opération sensible côté serveur.
//
// Renvoie le rôle effectif ('admin' pour le owner, sinon le rôle stocké sur
// tableau_membres) ou null si aucun accès. Remplace l'ancien booléen
// userCanAccessBoard : on a maintenant besoin de savoir PAS SEULEMENT si
// l'utilisateur a accès, mais avec quel niveau (lecture seule ou non).
//
// La logique elle-même vit dans server/access-control.ts (client Supabase
// injecté) pour pouvoir être testée avec Vitest sans base de données réelle
// — voir server/__tests__/access-control.test.ts. Ce wrapper se contente de
// brancher le client réel et de logger toute erreur Postgres (colonne
// manquante si une migration SQL n'a pas été exécutée, etc.) qui, avant,
// était silencieusement avalée.
async function getUserRoleForBoard(roomId: string, userId: string): Promise<'lecture' | 'edition' | 'admin' | null> {
    // Cast explicite : passer le vrai SupabaseClient (type très générique,
    // avec plusieurs niveaux de paramètres) directement en tant que
    // SupabaseLike fait exploser l'inférence TypeScript ("Type instantiation
    // is excessively deep"). SupabaseLike ne décrit que la toute petite
    // surface réellement utilisée (from/select/eq), donc ce cast est sûr.
    const { role, error } = await resolveUserRoleForBoard(supabase as unknown as SupabaseLike, roomId, userId);
    if (error) {
        console.error(`Erreur lecture rôle pour ${roomId}/${userId}:`, error);
    }
    return role;
}

function readJsonBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1_000_000) {
                reject(new Error('Corps de requête trop volumineux.'));
                req.destroy();
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error('JSON invalide.'));
            }
        });
        req.on('error', reject);
    });
}

// POST /restore/:roomId  { versionId }
// Restaure une ancienne version : non-destructif, ça archive une NOUVELLE
// version (copie du snapshot restauré) plutôt que d'écraser l'historique.
// Si la room est actuellement chargée en mémoire (des clients dessus),
// room.loadSnapshot() remplace son état et déconnecte proprement les
// sessions actives, qui se reconnectent aussitôt côté client (comportement
// natif du provider @tldraw/sync) et reçoivent donc le nouvel état — c'est
// le point qui nécessitait de toucher directement la room active plutôt
// qu'un simple UPDATE SQL.
async function handleRestore(req: IncomingMessage, res: ServerResponse, roomId: string) {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        res.writeHead(401).end('Non authentifié.');
        return;
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
        res.writeHead(401).end('Session invalide.');
        return;
    }

    let body: { versionId?: string };
    try {
        body = await readJsonBody(req);
    } catch {
        res.writeHead(400).end('Corps de requête invalide.');
        return;
    }

    if (!body.versionId) {
        res.writeHead(400).end('versionId manquant.');
        return;
    }

    const role = await getUserRoleForBoard(roomId, userData.user.id);
    if (!role) {
        res.writeHead(403).end('Accès refusé à ce tableau.');
        return;
    }
    if (role === 'lecture') {
        res.writeHead(403).end('Lecture seule : restauration non autorisée.');
        return;
    }

    const { data: version, error: versionError } = await supabase
        .from('tableau_versions')
        .select('snapshot, created_at')
        .eq('id', body.versionId)
        .eq('tableau_id', roomId)
        .maybeSingle();

    if (versionError || !version) {
        res.writeHead(404).end('Version introuvable.');
        return;
    }

    const snapshot = version.snapshot as RoomSnapshot;
    const restoredFromDate = new Date(version.created_at).toLocaleString('fr-FR');

    // Persiste l'état courant + archive une nouvelle entrée d'historique
    // marquée comme restauration, avant de toucher la room en mémoire.
    const { error: insertError } = await supabase.from('tableau_versions').insert({
        tableau_id: roomId,
        snapshot,
        label: `Restauration depuis la version du ${restoredFromDate}`,
    });
    if (insertError) {
        res.writeHead(500).end("Échec de l'enregistrement de la restauration.");
        return;
    }

    await saveSnapshot(roomId, snapshot);
    lastArchivedSnapshots.set(roomId, JSON.stringify(snapshot));

    const activeRoom = rooms.get(roomId);
    if (activeRoom) {
        activeRoom.loadSnapshot(snapshot);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));
}

const rooms = new Map<string, TLSocketRoom<TLRecord>>();
const saveIntervals = new Map<string, NodeJS.Timeout>();
const versionIntervals = new Map<string, NodeJS.Timeout>();
const closeTimers = new Map<string, NodeJS.Timeout>();
// Empêche la race condition : si deux connexions arrivent pour le même
// roomId pendant que loadSnapshot() est encore en vol (await), les deux
// devaient auparavant créer chacune leur propre TLSocketRoom (rooms.get()
// renvoie undefined pour les deux tant que la première création n'est pas
// allée jusqu'au bout). La seconde écrasait la référence de la première
// dans `rooms`, alors qu'un client restait connecté à la première room —
// et son sauvegarde périodique finissait par écraser les vraies données
// avec un snapshot vide. On mémorise donc la PROMESSE de création elle-même :
// tout appel concurrent attend la même création au lieu d'en lancer une autre.
const roomCreationPromises = new Map<string, Promise<TLSocketRoom<TLRecord>>>();

function createRoom(roomId: string): Promise<TLSocketRoom<TLRecord>> {
    const creation = (async () => {
        const initialSnapshot = await loadSnapshot(roomId);

        const room = new TLSocketRoom({
            schema: createTLSchema(),
            initialSnapshot,
            onSessionRemoved: (r, { numSessionsRemaining }) => {
                if (numSessionsRemaining === 0) {
                    console.log(`[${new Date().toISOString()}] Room ${roomId} vide, fermeture programmée dans ${EMPTY_ROOM_GRACE_MS / 1000}s si personne ne revient.`);
                    const existingTimer = closeTimers.get(roomId);
                    if (existingTimer) clearTimeout(existingTimer);

                    const timer = setTimeout(() => {
                        closeTimers.delete(roomId);
                        // Re-vérifie qu'aucune session n'est revenue entre-temps
                        // (le compteur peut avoir changé pendant le délai de grâce).
                        if (r.getNumActiveSessions() > 0) {
                            console.log(`Room ${roomId} : quelqu'un est revenu, fermeture annulée.`);
                            return;
                        }
                        console.log(`Room ${roomId} toujours vide après le délai, sauvegarde puis fermeture.`);
                        const interval = saveIntervals.get(roomId);
                        if (interval) {
                            clearInterval(interval);
                            saveIntervals.delete(roomId);
                        }
                        const versionInterval = versionIntervals.get(roomId);
                        if (versionInterval) {
                            clearInterval(versionInterval);
                            versionIntervals.delete(roomId);
                        }
                        lastArchivedSnapshots.delete(roomId);
                        const finalSnapshot = r.getCurrentSnapshot();
                        Promise.all([
                            saveSnapshot(roomId, finalSnapshot),
                            archiveVersion(roomId, finalSnapshot),
                        ]).finally(() => {
                            r.close();
                            rooms.delete(roomId);
                        });
                    }, EMPTY_ROOM_GRACE_MS);
                    closeTimers.set(roomId, timer);
                }
            },
        });
        rooms.set(roomId, room);

        const interval = setInterval(() => {
            const currentRoom = rooms.get(roomId);
            if (!currentRoom) {
                clearInterval(interval);
                saveIntervals.delete(roomId);
                return;
            }
            saveSnapshot(roomId, currentRoom.getCurrentSnapshot());
        }, SAVE_INTERVAL_MS);
        saveIntervals.set(roomId, interval);

        const versionInterval = setInterval(() => {
            const currentRoom = rooms.get(roomId);
            if (!currentRoom) {
                clearInterval(versionInterval);
                versionIntervals.delete(roomId);
                return;
            }
            archiveVersion(roomId, currentRoom.getCurrentSnapshot());
        }, VERSION_INTERVAL_MS);
        versionIntervals.set(roomId, versionInterval);

        return room;
    })();

    // Une fois la création terminée (succès ou échec), on retire la promesse
    // du cache : un futur appel après fermeture de la room doit pouvoir en
    // recréer une nouvelle normalement.
    creation.finally(() => {
        roomCreationPromises.delete(roomId);
    });

    return creation;
}

async function getOrCreateRoom(roomId: string): Promise<TLSocketRoom<TLRecord>> {
    const existingRoom = rooms.get(roomId);
    if (existingRoom) {
        // Une nouvelle session rejoint une room existante : annule toute
        // fermeture programmée, la room n'est plus considérée comme vide.
        const existingTimer = closeTimers.get(roomId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            closeTimers.delete(roomId);
            console.log(`[${new Date().toISOString()}] Room ${roomId} : nouvelle connexion, fermeture annulée.`);
        }
        return existingRoom;
    }

    const inFlight = roomCreationPromises.get(roomId);
    if (inFlight) {
        return inFlight;
    }

    const creationPromise = createRoom(roomId);
    roomCreationPromises.set(roomId, creationPromise);
    return creationPromise;
}

const httpServer = createServer((req, res) => {
    // CORS : l'endpoint /restore est appelé en fetch() depuis le navigateur
    // (contrairement au websocket de sync, qui n'est pas soumis à CORS).
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
    }

    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const restoreMatch = url.pathname.match(/^\/restore\/(.+)$/);

    if (req.method === 'POST' && restoreMatch) {
        handleRestore(req, res, restoreMatch[1]).catch((err) => {
            console.error('Erreur /restore:', err);
            if (!res.headersSent) res.writeHead(500).end('Erreur serveur.');
        });
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Solaive sync server OK');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', async (socket, req) => {
    // Tampon critique : le client tldraw envoie son message "connect" DÈS
    // l'ouverture du socket, sans attendre quoi que ce soit côté serveur.
    // Or ce handler est async (vérification du token + du rôle via Supabase,
    // donc plusieurs allers-retours réseau) : pendant ce court délai,
    // room.handleSocketConnect() — qui est ce qui attache l'écouteur de
    // messages — n'a pas encore été appelé. Le message "connect" arrivait
    // donc dans le vide (aucun listener), et la session restait bloquée en
    // "attente de connexion" jusqu'à ce que tldraw l'élimine tout seul après
    // SESSION_START_WAIT_TIME (10s côté librairie) — ce qui correspond
    // exactement au cycle de reconnexion en boucle observé. On bufferise
    // donc tout message reçu avant que le listener définitif ne soit prêt,
    // puis on le rejoue dans l'ordre une fois la room disponible.
    const bufferedMessages: Array<string | Buffer | ArrayBuffer | Buffer[]> = [];
    let buffering = true;
    const bufferIncoming = (data: string | Buffer | ArrayBuffer | Buffer[]) => {
        if (buffering) bufferedMessages.push(data);
    };
    socket.on('message', bufferIncoming);

    try {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`);
        const match = url.pathname.match(/^\/connect\/(.+)$/);
        const sessionId = url.searchParams.get('sessionId');
        const accessToken = url.searchParams.get('accessToken');

        if (!match || !sessionId) {
            socket.close();
            return;
        }

        const roomId = match[1];

        // AVANT ce correctif : aucune vérification n'était faite ici — n'importe
        // quelle connexion WebSocket connaissant l'ID du tableau était acceptée
        // en écriture, RLS ou pas (ce serveur tourne avec la clé service_role,
        // qui contourne RLS). C'était le vrai trou par rapport à l'exigence 5.2
        // du cahier des charges ("validation des permissions à chaque écriture,
        // côté serveur"). Le token est vérifié ici, PAS seulement côté client.
        if (!accessToken) {
            console.warn(`Connexion refusée pour room ${roomId} : accessToken manquant.`);
            socket.close();
            return;
        }

        const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
        if (authError || !userData.user) {
            console.warn(`Connexion refusée pour room ${roomId} : token invalide ou expiré.`, authError?.message);
            socket.close();
            return;
        }

        const role = await getUserRoleForBoard(roomId, userData.user.id);
        if (!role) {
            console.warn(`Connexion refusée pour room ${roomId} : ${userData.user.id} n'a pas accès à ce tableau.`);
            socket.close();
            return;
        }

        const room = await getOrCreateRoom(roomId);
        console.log(`[${new Date().toISOString()}] Connexion acceptée room ${roomId} — user ${userData.user.id.slice(0, 8)} — session ${sessionId} — rôle ${role}`);
        // isReadonly est appliqué par tldraw AU NIVEAU DE LA SESSION SERVEUR :
        // un client en rôle "lecture" qui bricolerait son propre état local ne
        // peut de toute façon pas pousser de modification, la room les rejette.
        room.handleSocketConnect({ sessionId, socket, isReadonly: role === 'lecture' });

        // Le listener définitif est maintenant en place : on arrête de
        // bufferiser et on rejoue dans l'ordre tout ce qui est arrivé
        // pendant l'authentification (typiquement le message "connect").
        buffering = false;
        socket.off('message', bufferIncoming);
        for (const data of bufferedMessages) {
            room.handleSocketMessage(sessionId, data as any);
        }

        socket.on('close', (code, reason) => {
            console.log(`[${new Date().toISOString()}] Socket fermé room ${roomId} — session ${sessionId} — code ${code} — raison "${reason.toString()}"`);
        });
    } catch (err) {
        // Filet de sécurité critique : avant, la moindre exception ici (requête
        // Supabase qui échoue, colonne manquante, etc.) rejetait la promesse
        // sans jamais fermer le socket -> le client restait connecté au niveau
        // WebSocket brut mais ne recevait jamais la poignée de main tldraw,
        // et tournait en chargement infini SANS AUCUNE ERREUR visible. On logge
        // et on ferme systématiquement pour que le client puisse au moins
        // retenter, et que l'erreur soit visible dans le terminal du serveur.
        console.error('Erreur inattendue lors de la connexion WebSocket :', err);
        socket.off('message', bufferIncoming);
        try {
            socket.close();
        } catch {
            // socket déjà fermé/dans un état invalide, rien à faire de plus.
        }
    }
});

httpServer.listen(PORT, () => {
    console.log(`Sync server sur http://localhost:${PORT}`);
});