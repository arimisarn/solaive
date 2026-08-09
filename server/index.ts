import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { TLSocketRoom, type RoomSnapshot } from '@tldraw/sync-core';
import { createTLSchema, type TLRecord } from '@tldraw/tlschema';
import { createClient } from '@supabase/supabase-js';

const PORT = 5858;
const SAVE_INTERVAL_MS = 20_000;
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

const rooms = new Map<string, TLSocketRoom<TLRecord>>();
const saveIntervals = new Map<string, NodeJS.Timeout>();
const closeTimers = new Map<string, NodeJS.Timeout>();
// Empêche la race condition : si deux connexions arrivent pour le même
// roomId pendant que loadSnapshot() est encore en vol (await), les deux
// devaient auparavant créer chacune leur propre TLSocketRoom (rooms.get()
// renvoie undefined pour les deux tant que la première création n'est pas
// allée jusqu'au bout). La seconde écrasait la référence de la première
// dans `rooms`, alors qu'un client restait connecté à la première room —
// et sa sauvegarde périodique finissait par écraser les vraies données
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
                        saveSnapshot(roomId, r.getCurrentSnapshot()).finally(() => {
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