import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { WebSocketServer } from 'ws';
import { TLSocketRoom, type RoomSnapshot } from '@tldraw/sync-core';
import { createTLSchema, type TLRecord } from '@tldraw/tlschema';
import { createClient } from '@supabase/supabase-js';

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
async function userCanAccessBoard(roomId: string, userId: string): Promise<boolean> {
    const { data: board } = await supabase
        .from('tableaux')
        .select('owner_id')
        .eq('id', roomId)
        .maybeSingle();

    if (!board) return false;
    if (board.owner_id === userId) return true;

    const { data: membre } = await supabase
        .from('tableau_membres')
        .select('id')
        .eq('tableau_id', roomId)
        .eq('user_id', userId)
        .eq('statut', 'acceptee')
        .maybeSingle();

    return !!membre;
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

    const allowed = await userCanAccessBoard(roomId, userData.user.id);
    if (!allowed) {
        res.writeHead(403).end('Accès refusé à ce tableau.');
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
                    console.log(`Room ${roomId} vide, fermeture programmée dans ${EMPTY_ROOM_GRACE_MS / 1000}s si personne ne revient.`);
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
            console.log(`Room ${roomId} : nouvelle connexion, fermeture annulée.`);
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
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const match = url.pathname.match(/^\/connect\/(.+)$/);
    const sessionId = url.searchParams.get('sessionId');

    if (!match || !sessionId) {
        socket.close();
        return;
    }

    const roomId = match[1];
    const room = await getOrCreateRoom(roomId);
    room.handleSocketConnect({ sessionId, socket });
});

httpServer.listen(PORT, () => {
    console.log(`Sync server sur http://localhost:${PORT}`);
});