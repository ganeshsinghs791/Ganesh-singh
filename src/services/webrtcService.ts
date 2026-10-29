import Peer, { DataConnection } from 'peerjs';
import { io, Socket } from 'socket.io-client';

export interface PeerPlayerInfo {
  name: string;
  charId: string;
}

export interface PeerSyncPacket {
  type: 'GAME_SYNC';
  x: number;
  y: number;
  dist: number;
  anim: string;
  score: number;
  rotZ?: number;
}

export interface PeerInitPacket {
  type: 'INIT_RACE';
  seed: number;
  hostName: string;
  hostCharId: string;
}

export interface PeerReadyPacket {
  type: 'READY_RACE';
  clientName: string;
  clientCharId: string;
}

export interface PeerCrashPacket {
  type: 'CRASH';
  dist: number;
  score: number;
}

export interface PeerRematchPacket {
  type: 'REMATCH_REQUEST';
  seed: number;
}

export type WebRTCPacket =
  | PeerSyncPacket
  | PeerInitPacket
  | PeerReadyPacket
  | PeerCrashPacket
  | PeerRematchPacket;

export interface LanRoomInfo {
  roomCode: string;
  hostName: string;
  charId: string;
}

export interface WebRTCCallbacks {
  onHostCodeGenerated?: (code: string) => void;
  onLanRoomsUpdated?: (rooms: LanRoomInfo[]) => void;
  onOpponentConnected?: (opponent: PeerPlayerInfo, isHost: boolean) => void;
  onRaceStart?: (seed: number) => void;
  onOpponentUpdate?: (data: { x: number; y: number; dist: number; anim: string; score: number; rotZ?: number }) => void;
  onOpponentCrashed?: (data: { dist: number; score: number }) => void;
  onConnectionLost?: (reason: string) => void;
  onError?: (err: string) => void;
}

const PEER_PREFIX = 'sd3d-room-';
const CONNECTION_TIMEOUT_MS = 10000;
const TIMEOUT_ERROR_MSG =
  'Connection failed. Please ensure both devices are on the same WiFi and try a new code.';

const PEER_ICE_CONFIG = {
  'iceServers': [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class WebRTCService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private fallbackSocket: Socket | null = null;
  private callbacks: WebRTCCallbacks = {};
  public isHost: boolean = false;
  public roomCode: string | null = null;
  public isConnected: boolean = false;
  private useSocketFallback: boolean = false;
  private hasStartedRace: boolean = false;
  private pendingSeed: number | null = null;
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private retryIntervalId: ReturnType<typeof setInterval> | null = null;
  private myPlayerInfo: PeerPlayerInfo = { name: 'Player', charId: 'roy' };
  public opponentInfo: PeerPlayerInfo | null = null;

  public init(callbacks: WebRTCCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.ensureFallbackSocket();
  }

  public requestLanRooms() {
    this.ensureFallbackSocket();
    this.fallbackSocket?.emit('get_lan_rooms', (rooms: LanRoomInfo[]) => {
      if (Array.isArray(rooms)) {
        this.callbacks.onLanRoomsUpdated?.(rooms);
      }
    });
  }

  private ensureFallbackSocket() {
    if (this.fallbackSocket) return;
    const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    this.fallbackSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    this.fallbackSocket.on('connect', () => {
      // Re-register host room code if socket reconnects while hosting
      if (this.isHost && this.roomCode && !this.isConnected) {
        this.fallbackSocket?.emit('p2p_host_room', {
          roomCode: this.roomCode,
          hostName: this.myPlayerInfo.name,
          charId: this.myPlayerInfo.charId,
        });
      }
      this.requestLanRooms();
    });

    this.fallbackSocket.on('lan_rooms_list', (rooms: LanRoomInfo[]) => {
      if (Array.isArray(rooms)) {
        this.callbacks.onLanRoomsUpdated?.(rooms);
      }
    });

    this.fallbackSocket.on('p2p_client_joined', () => {
      if (this.isHost && !this.isConnected) {
        console.log('[WebRTC Fallback] Client connected via local server relay');
        this.isConnected = true;
        this.useSocketFallback = true;
        this.sendHostInitPacket();
      }
    });

    this.fallbackSocket.on('p2p_packet', (raw: unknown) => {
      this.handleIncomingPacket(raw as WebRTCPacket);
    });

    this.fallbackSocket.on('p2p_peer_disconnected', () => {
      if (this.isConnected) {
        this.isConnected = false;
        this.callbacks.onConnectionLost?.('The opponent disconnected from the race.');
      }
    });
  }

  /**
   * HOST: Create a Room with a 6-digit Room Code using Google STUN servers
   */
  public createRoom(playerInfo: PeerPlayerInfo): Promise<string> {
    this.cleanupPeerOnly();
    this.ensureFallbackSocket();
    this.isHost = true;
    this.myPlayerInfo = playerInfo;
    this.hasStartedRace = false;

    return new Promise((resolve) => {
      // Generate 6-digit Room Code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const peerId = `${PEER_PREFIX}${code}`;
      this.roomCode = code;

      // Register on local server fallback immediately
      this.fallbackSocket?.emit('p2p_host_room', {
        roomCode: code,
        hostName: playerInfo.name,
        charId: playerInfo.charId,
      });
      this.callbacks.onHostCodeGenerated?.(code);
      resolve(code);

      try {
        const peer = new Peer(peerId, {
          config: PEER_ICE_CONFIG,
        });

        this.peer = peer;

        peer.on('open', (id) => {
          console.log('[WebRTC Host] Peer registered with ID:', id, 'Room Code:', code);
        });

        peer.on('connection', (connection) => {
          console.log('[WebRTC Host] Incoming WebRTC peer connection!');
          this.conn = connection;
          this.useSocketFallback = false;
          this.setupDataConnection(connection);
        });

        peer.on('error', (err) => {
          console.warn('[WebRTC Host] PeerJS warning:', err.type, err.message);
          if (err.type === 'unavailable-id') {
            this.createRoom(playerInfo);
          }
        });
      } catch (err) {
        console.warn('[WebRTC Host] PeerJS init exception, using local WiFi fallback:', err);
      }
    });
  }

  /**
   * CLIENT: Join a Room using the 6-digit Room Code with 10-second timeout & automatic retries
   */
  public joinRoom(code: string, playerInfo: PeerPlayerInfo): Promise<void> {
    this.cleanupPeerOnly();
    this.ensureFallbackSocket();
    this.isHost = false;
    this.myPlayerInfo = playerInfo;
    this.hasStartedRace = false;
    const cleanCode = code.replace(/\D/g, '').trim();
    this.roomCode = cleanCode;

    return new Promise((resolve, reject) => {
      let settled = false;
      const targetPeerId = `${PEER_PREFIX}${cleanCode}`;

      const clearTimers = () => {
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }
        if (this.retryIntervalId) {
          clearInterval(this.retryIntervalId);
          this.retryIntervalId = null;
        }
      };

      const finishSuccess = () => {
        if (settled) return;
        settled = true;
        clearTimers();
        resolve();
      };

      const finishError = (msg: string) => {
        if (settled) return;
        settled = true;
        clearTimers();
        this.callbacks.onError?.(msg);
        reject(new Error(msg));
      };

      // 10-second connection timeout
      this.connectionTimeoutId = setTimeout(() => {
        if (!this.isConnected) {
          finishError(TIMEOUT_ERROR_MSG);
        }
      }, CONNECTION_TIMEOUT_MS);

      const attemptSocketJoin = () => {
        if (settled || this.isConnected) return;
        this.fallbackSocket?.emit('p2p_join_room', { roomCode: cleanCode }, (res: { ok: boolean }) => {
          if (res?.ok && !this.isConnected) {
            console.log('[WebRTC Client] Joined room via local server fallback!');
            this.isConnected = true;
            this.useSocketFallback = true;
            finishSuccess();
          }
        });
      };

      const attemptPeerConnect = () => {
        if (settled || this.isConnected || !this.peer || this.peer.disconnected || this.peer.destroyed) {
          return;
        }
        if (this.conn && this.conn.open) return;

        try {
          console.log('[WebRTC Client] Connecting to Host Peer:', targetPeerId);
          const connection = this.peer.connect(targetPeerId, {
            reliable: true,
            serialization: 'json',
          });
          this.conn = connection;
          this.setupDataConnection(connection, finishSuccess);
        } catch (e) {
          console.warn('[WebRTC Client] Connect attempt error:', e);
        }
      };

      // Try local socket lookup immediately
      attemptSocketJoin();

      // Initialize Peer with Google's free STUN servers
      try {
        const peer = new Peer({
          config: {
            'iceServers': [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });

        this.peer = peer;

        peer.on('open', (myId) => {
          console.log('[WebRTC Client] Peer opened:', myId);
          attemptPeerConnect();
        });

        peer.on('error', (err) => {
          console.warn('[WebRTC Client] Peer error (will retry until 10s timeout):', err.type, err.message);
        });

        // Retry every 1.5s during the 10-second window in case Host is still registering
        this.retryIntervalId = setInterval(() => {
          if (settled || this.isConnected) {
            clearTimers();
            return;
          }
          attemptSocketJoin();
          if (this.peer && !this.peer.disconnected && !this.peer.destroyed) {
            attemptPeerConnect();
          }
        }, 1500);
      } catch (err) {
        console.warn('[WebRTC Client] PeerJS exception:', err);
      }
    });
  }

  private sendHostInitPacket() {
    if (!this.pendingSeed) {
      this.pendingSeed = Math.floor(Math.random() * 900000) + 100000;
    }
    const initPacket: PeerInitPacket = {
      type: 'INIT_RACE',
      seed: this.pendingSeed,
      hostName: this.myPlayerInfo.name,
      hostCharId: this.myPlayerInfo.charId,
    };
    this.sendRawPacket(initPacket);
  }

  private sendRawPacket(packet: WebRTCPacket) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(packet);
        return;
      } catch {
        // Fallback to socket
      }
    }
    if (this.fallbackSocket && this.roomCode) {
      this.fallbackSocket.emit('p2p_packet', {
        roomCode: this.roomCode,
        packet,
      });
    }
  }

  private setupDataConnection(connection: DataConnection, onOpenCallback?: () => void) {
    connection.on('open', () => {
      console.log('[WebRTC] Direct P2P DataChannel OPEN!');
      this.isConnected = true;
      this.useSocketFallback = false;
      onOpenCallback?.();

      if (this.isHost) {
        this.sendHostInitPacket();
      }
    });

    connection.on('data', (raw: unknown) => {
      this.handleIncomingPacket(raw as WebRTCPacket);
    });

    connection.on('close', () => {
      console.warn('[WebRTC] Peer DataChannel closed');
      if (!this.useSocketFallback && this.isConnected) {
        this.isConnected = false;
        this.callbacks.onConnectionLost?.('The opponent disconnected from the race.');
      }
    });

    connection.on('error', (err) => {
      console.error('[WebRTC] DataChannel error:', err);
    });
  }

  private handleIncomingPacket(packet: WebRTCPacket) {
    if (!packet || !packet.type) return;

    switch (packet.type) {
      case 'INIT_RACE': {
        if (this.isHost) return;
        this.opponentInfo = {
          name: packet.hostName,
          charId: packet.hostCharId,
        };
        this.callbacks.onOpponentConnected?.(this.opponentInfo, false);

        const readyPacket: PeerReadyPacket = {
          type: 'READY_RACE',
          clientName: this.myPlayerInfo.name,
          clientCharId: this.myPlayerInfo.charId,
        };
        this.sendRawPacket(readyPacket);

        if (!this.hasStartedRace) {
          this.hasStartedRace = true;
          this.callbacks.onRaceStart?.(packet.seed);
        }
        break;
      }

      case 'READY_RACE': {
        if (!this.isHost) return;
        this.opponentInfo = {
          name: packet.clientName,
          charId: packet.clientCharId,
        };
        this.callbacks.onOpponentConnected?.(this.opponentInfo, true);

        if (!this.hasStartedRace && this.pendingSeed) {
          this.hasStartedRace = true;
          this.callbacks.onRaceStart?.(this.pendingSeed);
        }
        break;
      }

      case 'GAME_SYNC': {
        this.callbacks.onOpponentUpdate?.({
          x: packet.x,
          y: packet.y,
          dist: packet.dist,
          anim: packet.anim,
          score: packet.score,
          rotZ: packet.rotZ,
        });
        break;
      }

      case 'CRASH': {
        this.callbacks.onOpponentCrashed?.({
          dist: packet.dist,
          score: packet.score,
        });
        break;
      }

      case 'REMATCH_REQUEST': {
        this.hasStartedRace = true;
        this.callbacks.onRaceStart?.(packet.seed);
        break;
      }
    }
  }

  public sendPlayerUpdate(data: {
    x: number;
    y: number;
    dist: number;
    anim: string;
    score: number;
    rotZ?: number;
  }) {
    if (!this.isConnected) return;
    const packet: PeerSyncPacket = {
      type: 'GAME_SYNC',
      ...data,
    };
    this.sendRawPacket(packet);
  }

  public sendPlayerCrashed(dist: number, score: number) {
    if (!this.isConnected) return;
    const packet: PeerCrashPacket = {
      type: 'CRASH',
      dist,
      score,
    };
    this.sendRawPacket(packet);
  }

  public requestRematch() {
    if (!this.isConnected) return;
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    this.hasStartedRace = true;
    const packet: PeerRematchPacket = {
      type: 'REMATCH_REQUEST',
      seed: newSeed,
    };
    this.sendRawPacket(packet);
    this.callbacks.onRaceStart?.(newSeed);
  }

  private cleanupPeerOnly() {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
      this.retryIntervalId = null;
    }
    this.isConnected = false;
    this.useSocketFallback = false;
    this.hasStartedRace = false;
    this.pendingSeed = null;
    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
  }

  public cleanup() {
    this.cleanupPeerOnly();
    this.roomCode = null;
    this.opponentInfo = null;
  }
}

export const webrtcService = new WebRTCService();
