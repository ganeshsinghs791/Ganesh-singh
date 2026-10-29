import express from 'express';
import { createServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

interface WaitingPlayer {
  socket: Socket;
  socketId: string;
  playerName: string;
  charId: string;
}

interface RoomPlayer {
  id: string;
  name: string;
  charId: string;
  dist: number;
  score: number;
  crashed: boolean;
  finished: boolean;
}

interface RoomState {
  id: string;
  seed: number;
  players: Record<string, RoomPlayer>;
  startTime: number;
  status: 'COUNTDOWN' | 'RACING' | 'FINISHED';
}

const waitingQueue: WaitingPlayer[] = [];
const activeRooms = new Map<string, RoomState>();
const socketToRoom = new Map<string, string>();

io.on('connection', (socket: Socket) => {
  console.log(`[Socket.io] Player connected: ${socket.id}`);

  // 1. Join Matchmaking
  socket.on('join_matchmaking', (data: { playerName: string; charId: string }) => {
    const playerName = data.playerName || 'Runner_' + socket.id.slice(0, 4);
    const charId = data.charId || 'roy';

    // Remove if already in queue
    const existingIndex = waitingQueue.findIndex(p => p.socketId === socket.id);
    if (existingIndex !== -1) {
      waitingQueue.splice(existingIndex, 1);
    }

    // Check if another player is waiting
    while (waitingQueue.length > 0) {
      const candidate = waitingQueue.shift()!;
      if (candidate.socket.connected && candidate.socketId !== socket.id) {
        // MATCH FOUND!
        const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const seed = Math.floor(Math.random() * 900000) + 100000;
        const startTime = Date.now() + 3000; // 3-second countdown

        socket.join(roomId);
        candidate.socket.join(roomId);

        socketToRoom.set(socket.id, roomId);
        socketToRoom.set(candidate.socketId, roomId);

        const roomState: RoomState = {
          id: roomId,
          seed,
          players: {
            [socket.id]: {
              id: socket.id,
              name: playerName,
              charId,
              dist: 0,
              score: 0,
              crashed: false,
              finished: false,
            },
            [candidate.socketId]: {
              id: candidate.socketId,
              name: candidate.playerName,
              charId: candidate.charId,
              dist: 0,
              score: 0,
              crashed: false,
              finished: false,
            },
          },
          startTime,
          status: 'COUNTDOWN',
        };

        activeRooms.set(roomId, roomState);

        console.log(`[Matchmaking] Room created ${roomId} between ${playerName} and ${candidate.playerName}`);

        // Notify Player 1
        socket.emit('match_found', {
          roomId,
          seed,
          countdown: 3,
          opponent: {
            id: candidate.socketId,
            name: candidate.playerName,
            charId: candidate.charId,
          },
          startTime,
        });

        // Notify Player 2
        candidate.socket.emit('match_found', {
          roomId,
          seed,
          countdown: 3,
          opponent: {
            id: socket.id,
            name: playerName,
            charId,
          },
          startTime,
        });

        return;
      }
    }

    // No opponent available yet, add to queue
    waitingQueue.push({
      socket,
      socketId: socket.id,
      playerName,
      charId,
    });

    socket.emit('waiting_for_opponent');
    console.log(`[Matchmaking] Player ${playerName} added to queue. Queue length: ${waitingQueue.length}`);
  });

  // 2. Cancel Matchmaking
  socket.on('cancel_matchmaking', () => {
    const idx = waitingQueue.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      waitingQueue.splice(idx, 1);
    }
    socket.emit('matchmaking_cancelled');
  });

  // 3. Real-time Player Position & State Update (relayed to opponent ~30 times/sec)
  socket.on('player_update', (data: {
    roomId: string;
    x: number;
    y: number;
    dist: number;
    anim: string;
    score: number;
    rotZ?: number;
  }) => {
    if (!data.roomId) return;
    socket.to(data.roomId).emit('opponent_update', {
      x: data.x,
      y: data.y,
      dist: data.dist,
      anim: data.anim,
      score: data.score,
      rotZ: data.rotZ || 0,
    });

    const room = activeRooms.get(data.roomId);
    if (room && room.players[socket.id]) {
      room.players[socket.id].dist = data.dist;
      room.players[socket.id].score = data.score;
    }
  });

  // 4. Player Crash or Finish
  socket.on('player_crashed', (data: { roomId: string; dist: number; score: number }) => {
    if (!data.roomId) return;
    const room = activeRooms.get(data.roomId);
    if (room && room.players[socket.id]) {
      room.players[socket.id].crashed = true;
      room.players[socket.id].dist = data.dist;
      room.players[socket.id].score = data.score;
    }

    socket.to(data.roomId).emit('opponent_crashed', {
      dist: data.dist,
      score: data.score,
    });
  });

  // 5. 6-Digit Room Code & Local IP LAN Signaling (for Local Area / WiFi Multiplayer)
  const broadcastOpenLanRooms = () => {
    const openRooms: { roomCode: string; hostName: string; charId: string }[] = [];
    activeRooms.forEach((room, key) => {
      if (key.startsWith('p2p_') && Object.keys(room.players).length === 1) {
        const hostPlayer = Object.values(room.players)[0];
        openRooms.push({
          roomCode: key.replace('p2p_', ''),
          hostName: hostPlayer?.name || 'Host',
          charId: hostPlayer?.charId || 'roy',
        });
      }
    });
    io.emit('lan_rooms_list', openRooms);
  };

  socket.on('get_lan_rooms', (callback?: (rooms: { roomCode: string; hostName: string; charId: string }[]) => void) => {
    const openRooms: { roomCode: string; hostName: string; charId: string }[] = [];
    activeRooms.forEach((room, key) => {
      if (key.startsWith('p2p_') && Object.keys(room.players).length === 1) {
        const hostPlayer = Object.values(room.players)[0];
        openRooms.push({
          roomCode: key.replace('p2p_', ''),
          hostName: hostPlayer?.name || 'Host',
          charId: hostPlayer?.charId || 'roy',
        });
      }
    });
    callback?.(openRooms);
  });

  socket.on('p2p_host_room', (data: { roomCode: string; hostName?: string; charId?: string }) => {
    if (!data?.roomCode) return;
    const roomId = `p2p_${data.roomCode}`;
    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);
    activeRooms.set(roomId, {
      id: roomId,
      seed: Math.floor(Math.random() * 900000) + 100000,
      players: {
        [socket.id]: {
          id: socket.id,
          name: data.hostName || 'Host',
          charId: data.charId || 'roy',
          dist: 0,
          score: 0,
          crashed: false,
          finished: false,
        },
      },
      startTime: Date.now(),
      status: 'COUNTDOWN',
    });
    console.log(`[LAN Host] Registered LAN Room Code: ${data.roomCode}`);
    broadcastOpenLanRooms();
  });

  socket.on('p2p_join_room', (data: { roomCode: string; clientName?: string; charId?: string }, callback?: (res: { ok: boolean }) => void) => {
    if (!data?.roomCode) return;
    const roomId = `p2p_${data.roomCode}`;
    const room = activeRooms.get(roomId);
    if (room) {
      socket.join(roomId);
      socketToRoom.set(socket.id, roomId);
      room.players[socket.id] = {
        id: socket.id,
        name: data.clientName || 'Client',
        charId: data.charId || 'maya',
        dist: 0,
        score: 0,
        crashed: false,
        finished: false,
      };
      socket.to(roomId).emit('p2p_client_joined', { clientId: socket.id });
      callback?.({ ok: true });
      console.log(`[LAN Client] Joined LAN Room Code: ${data.roomCode}`);
      broadcastOpenLanRooms();
    } else {
      callback?.({ ok: false });
    }
  });

  socket.on('p2p_packet', (data: { roomCode: string; packet: unknown }) => {
    if (!data?.roomCode || !data?.packet) return;
    const roomId = `p2p_${data.roomCode}`;
    socket.to(roomId).emit('p2p_packet', data.packet);
  });

  // 6. Clean Disconnect Handling
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Player disconnected: ${socket.id}`);

    // Remove from waiting queue if waiting
    const queueIdx = waitingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIdx !== -1) {
      waitingQueue.splice(queueIdx, 1);
    }

    // Handle active room cleanup
    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit('opponent_disconnected');
      socket.to(roomId).emit('p2p_peer_disconnected');
      activeRooms.delete(roomId);
      socketToRoom.delete(socket.id);
      broadcastOpenLanRooms();
    }
  });
});

// LAN Network Info API (Returns Local IP & Port for LAN Host/Client setup)
app.get('/api/lan-info', (_req, res) => {
  res.json({
    localIp: getLocalLanIp(),
    port: 3000,
  });
});

// Full-Stack Dev vs Prod Vite Integration
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Subway Dash Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
