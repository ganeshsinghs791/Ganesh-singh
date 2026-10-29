import React, { useEffect, useState } from 'react';
import {
  Users,
  Zap,
  Trophy,
  Skull,
  ArrowRight,
  X,
  Swords,
  Crown,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Share2,
  PlusCircle,
  LogIn,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Character } from '../types/game';
import { soundSynth } from '../audio/soundSynth';

export type MultiplayerStage =
  | 'MENU'
  | 'HOST_WAITING'
  | 'JOIN_INPUT'
  | 'SEARCHING'
  | 'COUNTDOWN'
  | 'RESULT'
  | 'CONNECTION_LOST';

interface OpponentDetails {
  name: string;
  charId: string;
  dist: number;
  score: number;
  crashed?: boolean;
}

interface MultiplayerModalProps {
  stage: MultiplayerStage;
  countdown: number;
  roomCode?: string | null;
  sharedSeed?: number | null;
  selectedCharacter: Character;
  opponent: OpponentDetails | null;
  playerStats: {
    distance: number;
    score: number;
  };
  winner: 'PLAYER' | 'OPPONENT' | 'TIE' | null;
  winReason?: string | null;
  errorMessage?: string | null;
  isConnecting?: boolean;
  initialJoinCode?: string;
  lanRooms?: Array<{ code: string; hostName: string }>;
  onSelectCreateRoom: () => void;
  onSelectJoinRoom: () => void;
  onJoinWithCode: (code: string) => void;
  onRefreshLanRooms?: () => void;
  onBackToMpMenu: () => void;
  onCancelSearch: () => void;
  onPlayAgain: () => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  stage,
  countdown,
  roomCode,
  sharedSeed,
  selectedCharacter,
  opponent,
  playerStats,
  winner,
  winReason,
  errorMessage,
  isConnecting = false,
  initialJoinCode = '',
  lanRooms = [],
  onSelectCreateRoom,
  onSelectJoinRoom,
  onJoinWithCode,
  onRefreshLanRooms,
  onBackToMpMenu,
  onCancelSearch,
  onPlayAgain,
  onClose,
}) => {
  const [dots, setDots] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState(initialJoinCode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lanAddress, setLanAddress] = useState<string>('');

  // Fetch Host Local LAN IP address from backend (/api/lan-info)
  useEffect(() => {
    fetch('/api/lan-info')
      .then(res => res.json())
      .then(data => {
        if (data?.localIp && data.localIp !== '127.0.0.1') {
          setLanAddress(`http://${data.localIp}:${data.port || 3000}`);
        } else {
          setLanAddress(window.location.origin);
        }
      })
      .catch(() => {
        setLanAddress(window.location.origin);
      });
  }, []);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCodeInput(initialJoinCode);
    }
  }, [initialJoinCode]);

  // Animated waiting dots
  useEffect(() => {
    if (stage !== 'HOST_WAITING' && stage !== 'SEARCHING') return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [stage]);

  // Play sound on countdown tick
  useEffect(() => {
    if (stage === 'COUNTDOWN') {
      if (countdown > 0) {
        soundSynth.playCountdownBeep(false);
      } else {
        soundSynth.playCountdownBeep(true);
      }
    }
  }, [stage, countdown]);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopiedCode(true);
    soundSynth.playButtonClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareLink = () => {
    if (!roomCode) return;
    const base = lanAddress || window.location.origin;
    const url = `${base}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    soundSynth.playButtonClick();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinCodeInput.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length === 6) {
      soundSynth.playButtonClick();
      onJoinWithCode(cleaned);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans select-none bg-black/80 backdrop-blur-lg">
      {/* --- 1. MULTIPLAYER MENU: CREATE ROOM (HOST) OR JOIN ROOM (CLIENT) --- */}
      {stage === 'MENU' && (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/95 p-6 text-white shadow-2xl shadow-cyan-500/20">
          <button
            onClick={() => {
              soundSynth.playButtonClick();
              onClose();
            }}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/30">
              <Wifi className="h-7 w-7 text-white" />
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-0.5 text-[11px] font-mono font-bold text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              WEBRTC PEER-TO-PEER (LOCAL & WIFI)
            </div>

            <h2 className="mt-2 font-mono text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-indigo-300">
              LOCAL MULTIPLAYER
            </h2>
            <p className="mt-1 text-xs text-slate-400 max-w-xs">
              Race against a friend in real-time with synchronized obstacles & zero server lag!
            </p>
          </div>

          {/* Two Main Options: Create Room (Host) & Join Room (Client) */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                soundSynth.playButtonClick();
                onSelectCreateRoom();
              }}
              className="group relative flex items-center justify-between rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 p-4 text-left transition hover:border-cyan-400 hover:scale-[1.01] active:scale-95 shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-black shadow-md shadow-cyan-500/30">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-mono text-base font-black text-cyan-300 group-hover:text-white transition">
                    Create Room (Host)
                  </div>
                  <p className="text-xs text-slate-400">
                    Generate a 6-digit Room Code & invite a player
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-cyan-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => {
                soundSynth.playButtonClick();
                onSelectJoinRoom();
              }}
              className="group relative flex items-center justify-between rounded-2xl border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-950/80 via-slate-900 to-rose-950/80 p-4 text-left transition hover:border-fuchsia-400 hover:scale-[1.01] active:scale-95 shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30">
                  <LogIn className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-mono text-base font-black text-fuchsia-300 group-hover:text-white transition">
                    Join Room (Client)
                  </div>
                  <p className="text-xs text-slate-400">
                    Enter a 6-digit Room Code to connect to Host
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-fuchsia-400 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Active Runner Footer */}
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-mono text-xs font-black text-black">
                P1
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">{selectedCharacter.name}</span>
                <span className="text-[10px] text-emerald-400">Green Runner (You) vs Red Opponent</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">20+ Hz SYNC</span>
          </div>
        </div>
      )}

      {/* --- 2. HOST ROOM SCREEN: DISPLAY 6-DIGIT CODE & WAIT FOR CLIENT --- */}
      {stage === 'HOST_WAITING' && (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/95 p-6 text-white shadow-2xl shadow-cyan-500/20">
          <button
            onClick={() => {
              soundSynth.playButtonClick();
              onBackToMpMenu();
            }}
            className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              soundSynth.playButtonClick();
              onCancelSearch();
            }}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              HOSTING ROOM
            </div>

            <h2 className="mt-2 font-mono text-xl font-black text-white">
              SHARE THIS 6-DIGIT CODE
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Ask the other player to open Multiplayer → Join Room and enter:
            </p>

            {/* 6-Digit Room Code Display */}
            <div className="mt-4 flex w-full flex-col items-center rounded-2xl border-2 border-cyan-400/50 bg-slate-900/90 py-4 px-6 shadow-inner">
              {roomCode ? (
                <span className="font-mono text-4xl sm:text-5xl font-black tracking-[0.25em] text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                  {roomCode}
                </span>
              ) : (
                <div className="flex items-center gap-2 py-2 text-cyan-300">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-mono text-sm font-bold">Generating Room Code...</span>
                </div>
              )}
            </div>

            {/* Copy Code & Share Link Buttons */}
            {roomCode && (
              <div className="mt-3 grid w-full grid-cols-2 gap-2.5">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/50 py-2.5 font-mono text-xs font-bold text-cyan-200 hover:bg-cyan-900/60 active:scale-95 transition"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copiedCode ? 'COPIED CODE!' : 'COPY CODE'}
                </button>

                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/50 py-2.5 font-mono text-xs font-bold text-indigo-200 hover:bg-indigo-900/60 active:scale-95 transition"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                  {copiedLink ? 'LINK COPIED!' : 'SHARE LAN LINK'}
                </button>
              </div>
            )}

            {/* Local LAN IP Address Info */}
            {lanAddress && (
              <div className="mt-3 flex w-full items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-left">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                    HOST LOCAL LAN / WIFI URL
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-200 break-all">
                    {lanAddress}{roomCode ? `?room=${roomCode}` : ''}
                  </span>
                </div>
                <Wifi className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 w-full rounded-xl border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-xs font-bold text-rose-300">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Waiting for Opponent Indicator */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 w-full justify-center">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute h-8 w-8 rounded-full border border-cyan-400/40 animate-ping" />
                <Users className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">
                Waiting for opponent{dots}
              </span>
            </div>

            <div className="mt-4 grid w-full grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  soundSynth.playButtonClick();
                  onSelectCreateRoom();
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/40 py-2.5 font-mono text-xs font-bold text-cyan-200 hover:bg-cyan-900/50 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                New Code
              </button>

              <button
                onClick={() => {
                  soundSynth.playButtonClick();
                  onCancelSearch();
                }}
                className="rounded-2xl border border-white/15 bg-white/5 py-2.5 font-mono text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Cancel Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 3. CLIENT JOIN ROOM SCREEN: ENTER 6-DIGIT ROOM CODE OR 1-CLICK LAN ROOM --- */}
      {stage === 'JOIN_INPUT' && (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-slate-950/95 p-6 text-white shadow-2xl shadow-fuchsia-500/20">
          <button
            onClick={() => {
              soundSynth.playButtonClick();
              onBackToMpMenu();
            }}
            className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              soundSynth.playButtonClick();
              onCancelSearch();
            }}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <form onSubmit={handleJoinSubmit} className="flex flex-col items-center text-center mt-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-950/60 px-3 py-1 text-xs font-mono font-bold text-fuchsia-300">
              <LogIn className="h-3.5 w-3.5" />
              JOIN ROOM (CLIENT)
            </div>

            <h2 className="mt-2 font-mono text-xl font-black text-white">
              ENTER 6-DIGIT ROOM CODE
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Type the 6-digit code displayed on the Host's screen:
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={isConnecting}
              autoFocus
              className="mt-4 w-full rounded-2xl border-2 border-fuchsia-500/50 bg-slate-900/90 py-3.5 px-4 text-center font-mono text-3xl sm:text-4xl font-black tracking-[0.3em] text-fuchsia-300 placeholder-slate-700 focus:border-fuchsia-400 focus:outline-none disabled:opacity-50"
            />

            {/* Active LAN Rooms Discovered on Local Network */}
            {lanRooms.length > 0 && (
              <div className="mt-3 w-full rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-black text-emerald-300 uppercase flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    ACTIVE LAN ROOMS FOUND ({lanRooms.length})
                  </span>
                  {onRefreshLanRooms && (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playButtonClick();
                        onRefreshLanRooms();
                      }}
                      className="text-[10px] font-mono text-emerald-300 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Refresh
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto">
                  {lanRooms.map(r => (
                    <button
                      key={r.code}
                      type="button"
                      disabled={isConnecting}
                      onClick={() => {
                        soundSynth.playButtonClick();
                        setJoinCodeInput(r.code);
                        onJoinWithCode(r.code);
                      }}
                      className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3 py-2 text-xs font-mono hover:border-emerald-400 hover:bg-emerald-950/60 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-300 tracking-wider">#{r.code}</span>
                        <span className="text-slate-300 font-bold">Host: {r.hostName}</span>
                      </div>
                      <span className="rounded-lg bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-black">
                        1-CLICK JOIN
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 flex w-full flex-col gap-2 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs font-bold text-rose-300">
                <span>⚠️ {errorMessage}</span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playButtonClick();
                      setJoinCodeInput('');
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/10 py-1.5 font-mono text-[11px] font-bold text-white hover:bg-white/20 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try Another Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playButtonClick();
                      onSelectCreateRoom();
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-950/80 py-1.5 font-mono text-[11px] font-bold text-cyan-200 hover:bg-cyan-900 transition"
                  >
                    <PlusCircle className="h-3 w-3" />
                    Host & Get New Code
                  </button>
                </div>
              </div>
            )}

            {isConnecting ? (
              <div className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-950/40 py-3.5 font-mono text-sm font-bold text-fuchsia-200">
                <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" />
                Waiting for opponent / Connecting (10s timeout)...
              </div>
            ) : (
              <button
                type="submit"
                disabled={joinCodeInput.replace(/\D/g, '').length !== 6}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600 py-3.5 font-mono text-base font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Zap className="h-5 w-5" />
                CONNECT & START RACE
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundSynth.playButtonClick();
                onBackToMpMenu();
              }}
              className="mt-3 w-full rounded-2xl border border-white/15 bg-white/5 py-2.5 font-mono text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* --- 4. MATCH FOUND & 3-2-1 COUNTDOWN OVERLAY --- */}
      {stage === 'COUNTDOWN' && (
        <div className="relative flex flex-col items-center justify-center text-center">
          {/* Match Versus Banner */}
          <div className="flex items-center gap-4 sm:gap-8 rounded-3xl border border-indigo-500/40 bg-slate-950/90 px-6 py-4 backdrop-blur-md shadow-2xl mb-6">
            {/* Player 1 (You - Green/Cyan) */}
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-black font-mono font-black text-xl shadow-lg shadow-emerald-500/30">
                YOU
              </div>
              <span className="mt-2 font-mono text-sm font-bold text-emerald-300">
                {selectedCharacter.name}
              </span>
            </div>

            {/* VS Icon */}
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600/30 border border-rose-500 text-rose-400">
                <Swords className="h-5 w-5 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono font-extrabold text-slate-400 mt-1">
                {roomCode ? `ROOM #${roomCode}` : 'P2P LINKED'}
              </span>
              {sharedSeed && (
                <span className="text-[9px] font-mono text-cyan-400">
                  SEED #{sharedSeed}
                </span>
              )}
            </div>

            {/* Player 2 (Opponent - Red) */}
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-white font-mono font-black text-xl shadow-lg shadow-rose-500/30">
                RIVAL
              </div>
              <span className="mt-2 font-mono text-sm font-bold text-rose-300 truncate max-w-[100px]">
                {opponent?.name || 'Challenger'}
              </span>
            </div>
          </div>

          {/* Big Countdown Number */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 drop-shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-pulse">
              {countdown > 0 ? countdown : 'GO!'}
            </span>
            <span className="mt-2 font-mono text-sm font-black tracking-widest text-amber-300 uppercase">
              {countdown > 0 ? 'SYNCHRONIZING TRACK OBSTACLES...' : 'RACE STARTED!'}
            </span>
          </div>
        </div>
      )}

      {/* --- 5. CONNECTION LOST MODAL --- */}
      {stage === 'CONNECTION_LOST' && (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/40 bg-slate-950/95 p-6 text-white shadow-2xl shadow-rose-950/50 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950 border border-rose-500/50 text-rose-400">
            <WifiOff className="h-9 w-9 animate-pulse" />
          </div>

          <h2 className="mt-4 font-mono text-2xl font-black tracking-wide text-rose-400">
            CONNECTION LOST
          </h2>
          <p className="mt-2 text-xs text-slate-300">
            {errorMessage || 'The peer-to-peer connection with your opponent dropped. The game has been paused.'}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => {
                soundSynth.playButtonClick();
                onClose();
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3.5 font-mono text-sm font-black text-white shadow-lg transition hover:scale-[1.01] active:scale-95"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* --- 6. MATCH RESULT / POST-RACE MODAL --- */}
      {stage === 'RESULT' && (
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-950/95 p-6 text-white shadow-2xl">
          {/* Header Banner */}
          <div className="flex flex-col items-center text-center">
            {winner === 'PLAYER' ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 shadow-xl shadow-amber-500/30">
                  <Crown className="h-9 w-9 text-black fill-black" />
                </div>
                <h2 className="mt-3 font-mono text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                  YOU WIN! 🏆
                </h2>
                <p className="mt-1 text-xs font-bold text-amber-300">
                  {winReason || 'You out-dashed your opponent!'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-xs font-black text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                  +500 COINS VICTORY BONUS!
                </div>
              </>
            ) : winner === 'OPPONENT' ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950 border border-rose-500/50 shadow-xl shadow-rose-950/50">
                  <Skull className="h-9 w-9 text-rose-400" />
                </div>
                <h2 className="mt-3 font-mono text-3xl font-black tracking-wide text-rose-400">
                  YOU LOST! 💀
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {winReason || 'Opponent survived further down the track!'}
                </p>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-500/50 shadow-xl">
                  <Swords className="h-9 w-9 text-cyan-400" />
                </div>
                <h2 className="mt-3 font-mono text-3xl font-black tracking-wide text-cyan-300">
                  HONORABLE TIE!
                </h2>
                <p className="mt-1 text-xs text-slate-400">Both runners dashed to an equal distance!</p>
              </>
            )}
          </div>

          {/* Head to Head Comparison */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* Player Column */}
            <div
              className={`flex flex-col rounded-2xl border p-4 ${
                winner === 'PLAYER'
                  ? 'border-amber-500/50 bg-amber-950/20 shadow-md shadow-amber-950/30'
                  : 'border-white/10 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-300">YOU</span>
                {winner === 'PLAYER' && (
                  <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">
                    WINNER
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400">DISTANCE</span>
                <span className="font-mono text-xl font-black text-white">{playerStats.distance}m</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400">SCORE</span>
                <span className="font-mono text-sm font-bold text-amber-300">
                  {playerStats.score.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Opponent Column */}
            <div
              className={`flex flex-col rounded-2xl border p-4 ${
                winner === 'OPPONENT'
                  ? 'border-rose-500/50 bg-rose-950/20 shadow-md shadow-rose-950/30'
                  : 'border-white/10 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-300 truncate max-w-[90px]">
                  {opponent?.name || 'OPPONENT'}
                </span>
                {winner === 'OPPONENT' && (
                  <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                    WINNER
                  </span>
                )}
                {opponent?.crashed && (
                  <span className="rounded bg-rose-950 border border-rose-500/50 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">
                    CRASHED
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400">DISTANCE</span>
                <span className="font-mono text-xl font-black text-white">{opponent?.dist || 0}m</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400">SCORE</span>
                <span className="font-mono text-sm font-bold text-rose-300">
                  {(opponent?.score || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => {
                soundSynth.playButtonClick();
                onPlayAgain();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 py-3.5 font-mono text-base font-black text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.01] active:scale-95 transition"
            >
              <Zap className="h-5 w-5" />
              REMATCH (SAME OPPONENT)
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                soundSynth.playButtonClick();
                onClose();
              }}
              className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 font-mono text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
