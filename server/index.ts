import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { TLSocketRoom } from '@tldraw/sync-core';
import { createTLSchema, type TLRecord } from '@tldraw/tlschema';

const PORT = 5858;

// Une room par tableau, gardée en mémoire pour l'instant (persistance à l'étape suivante).
const rooms = new Map<string, TLSocketRoom<TLRecord>>();

function getOrCreateRoom(roomId: string): TLSocketRoom<TLRecord> {
    let room = rooms.get(roomId);
    if (!room) {
        room = new TLSocketRoom({
            schema: createTLSchema(),
            onSessionRemoved: (r, { numSessionsRemaining }) => {
                if (numSessionsRemaining === 0) {
                    console.log(`Room ${roomId} vide, fermeture.`);
                    r.close();
                    rooms.delete(roomId);
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

wss.on('connection', (socket, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const match = url.pathname.match(/^\/connect\/(.+)$/);
    const sessionId = url.searchParams.get('sessionId');

    if (!match || !sessionId) {
        socket.close();
        return;
    }

    const roomId = match[1];
    const room = getOrCreateRoom(roomId);
    room.handleSocketConnect({ sessionId, socket });
});

httpServer.listen(PORT, () => {
    console.log(`Sync server sur http://localhost:${PORT}`);
});