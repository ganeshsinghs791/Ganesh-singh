import { io, Socket } from 'socket.io-client';

export interface OpponentInfo {
  id: string;
  name: string;
  charId: string;
}

export interface MatchFoundData {
  roomId: string;
  seed: number;
  countdown: number;
  opponent: OpponentInfo;
  startTime: number;
}

export interface OpponentUpdateData {
  x: number;
  y: number;
  dist: number;
  anim: string;
  score: number;
  rotZ?: number;
}

export interface MultiplayerCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onWaiting?: () => void;
  onMatchFound?: (data: MatchFoundData) => void;
  onOpponentUpdate?: (data: OpponentUpdateData) => void;
  onOpponentCrashed?: (data: { dist: number; score: number }) => void;
  onOpponentDisconnected?: () => void;
  onMatchmakingCancelled?: () => void;
  onError?: (err: Error) => void;
}

/**
 * MultiplayerService handles real-time WebSockets connection via Socket.io
 * to pair players in 1v1 rooms and stream position, distance, and animation states.
 */
class MultiplayerService {
  private socket: Socket | null = null;
  private callbacks: MultiplayerCallbacks = {};
  public currentRoomId: string | null = null;
  public isConnected: boolean = false;

  public init(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;

    if (!this.socket) {
      // Connect to the current origin or default port 3000
      const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[MultiplayerService] Connected to game server:', this.socket?.id);
        this.callbacks.onConnect?.();
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log('[MultiplayerService] Disconnected from game server. Reason:', reason);
        this.callbacks.onDisconnect?.();
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[MultiplayerService] Connection error:', error.message);
        this.callbacks.onError?.(error);
      });

      this.socket.on('waiting_for_opponent', () => {
        console.log('[MultiplayerService] In queue, waiting for opponent...');
        this.callbacks.onWaiting?.();
      });

      this.socket.on('match_found', (data: MatchFoundData) => {
        console.log('[MultiplayerService] Match found in room:', data.roomId, 'Opponent:', data.opponent.name);
        this.currentRoomId = data.roomId;
        this.callbacks.onMatchFound?.(data);
      });

      this.socket.on('opponent_update', (data: OpponentUpdateData) => {
        this.callbacks.onOpponentUpdate?.(data);
      });

      this.socket.on('opponent_crashed', (data: { dist: number; score: number }) => {
        console.log('[MultiplayerService] Opponent crashed at distance:', data.dist);
        this.callbacks.onOpponentCrashed?.(data);
      });

      this.socket.on('opponent_disconnected', () => {
        console.log('[MultiplayerService] Opponent disconnected from room');
        this.callbacks.onOpponentDisconnected?.();
      });

      this.socket.on('matchmaking_cancelled', () => {
        this.currentRoomId = null;
        this.callbacks.onMatchmakingCancelled?.();
      });
    } else {
      // If already created, update active callbacks
      if (this.socket.connected) {
        this.isConnected = true;
      }
    }
  }

  public setCallbacks(callbacks: MultiplayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public joinMatchmaking(playerName: string, charId: string) {
    if (!this.socket) {
      this.init(this.callbacks);
    }
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
    this.socket?.emit('join_matchmaking', { playerName, charId });
  }

  public cancelMatchmaking() {
    this.socket?.emit('cancel_matchmaking');
    this.currentRoomId = null;
  }

  public sendPlayerUpdate(data: {
    x: number;
    y: number;
    dist: number;
    anim: string;
    score: number;
    rotZ?: number;
  }) {
    if (!this.socket || !this.currentRoomId) return;
    this.socket.emit('player_update', {
      roomId: this.currentRoomId,
      ...data,
    });
  }

  public sendPlayerCrashed(dist: number, score: number) {
    if (!this.socket || !this.currentRoomId) return;
    this.socket.emit('player_crashed', {
      roomId: this.currentRoomId,
      dist,
      score,
    });
  }

  public leaveRoom() {
    if (this.currentRoomId && this.socket) {
      this.socket.emit('leave_room', { roomId: this.currentRoomId });
    }
    this.currentRoomId = null;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const multiplayerService = new MultiplayerService();
