import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { TLSocketRoom, type RoomSnapshot } from '@tldraw/sync-core';
import { createTLSchema, type TLRecord } from '@tldraw/tlschema';
import { createClient } from '@supabase/supabase-js';

const PORT = 5858;

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

async function getOrCreateRoom(roomId: string): Promise<TLSocketRoom<TLRecord>> {
    let room = rooms.get(roomId);
    if (!room) {
        const initialSnapshot = await loadSnapshot(roomId);

        room = new TLSocketRoom({
            schema: createTLSchema(),
            initialSnapshot,
            onSessionRemoved: (r, { numSessionsRemaining }) => {
                if (numSessionsRemaining === 0) {
                    console.log(`Room ${roomId} vide, sauvegarde puis fermeture.`);
                    saveSnapshot(roomId, r.getCurrentSnapshot()).finally(() => {
                        r.close();
                        rooms.delete(roomId);
                    });
                }
            },
        });
        rooms.set(roomId, room);
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