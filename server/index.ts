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

async function getOrCreateRoom(roomId: string): Promise<TLSocketRoom<TLRecord>> {
    let room = rooms.get(roomId);
    if (!room) {
        const initialSnapshot = await loadSnapshot(roomId);

        room = new TLSocketRoom({
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
    } else {
        // Une nouvelle session rejoint une room existante : annule toute
        // fermeture programmée, la room n'est plus considérée comme vide.
        const existingTimer = closeTimers.get(roomId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            closeTimers.delete(roomId);
            console.log(`Room ${roomId} : nouvelle connexion, fermeture annulée.`);
        }
    }
    return room;
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