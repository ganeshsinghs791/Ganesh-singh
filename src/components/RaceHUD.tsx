import React from 'react';
import { MultiplayerRaceState } from '../types/game';
import { Trophy, Zap, AlertTriangle, Swords } from 'lucide-react';

interface RaceHUDProps {
  playerDistance: number;
  playerScore: number;
  multiplayer: MultiplayerRaceState;
  className?: string;
}

/**
 * RaceHUD: Prominent real-time head-to-head racing display
 * Comparing player and opponent distance, lead status, and relative position.
 */
export const RaceHUD: React.FC<RaceHUDProps> = ({
  playerDistance,
  playerScore,
  multiplayer,
  className = '',
}) => {
  const oppDist = Math.round(multiplayer.opponentDist);
  const myDist = Math.round(playerDistance);
  const diff = myDist - oppDist;
  const isPlayerLeading = diff > 0;
  const isOpponentLeading = diff < 0;
  const isTied = diff === 0;
  const isOpponentCrashed = multiplayer.opponentCrashed;

  // Relative progress calculation for mini-track visualizer (-50m to +50m relative range mapped to 15%..85%)
  const clampRel = Math.max(-50, Math.min(50, diff));
  // Player is centered at 50%, opponent is placed relative to player
  const playerTrackPercent = 50;
  const opponentTrackPercent = Math.max(10, Math.min(90, 50 - clampRel * 0.7));

  return (
    <div
      className={`pointer-events-auto flex flex-col items-center gap-1.5 select-none ${className}`}
      data-testid="race-hud"
    >
      {/* Main Race HUD Pill Container */}
      <div className="relative flex items-center justify-between gap-3 sm:gap-5 rounded-2xl border border-white/20 bg-slate-950/90 px-4 py-2 backdrop-blur-md shadow-2xl shadow-black/60 transition-all duration-300">
        {/* Glow border based on race position */}
        <div
          className={`absolute -inset-[1px] -z-10 rounded-2xl opacity-60 blur-sm transition-colors duration-500 ${
            isOpponentCrashed
              ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 animate-pulse'
              : isPlayerLeading
              ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500'
              : isOpponentLeading
              ? 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500'
              : 'bg-gradient-to-r from-amber-400 to-orange-400'
          }`}
        />

        {/* --- LEFT: PLAYER (YOU) --- */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 font-mono text-[11px] font-black text-black shadow-md shadow-cyan-500/30">
            YOU
            {isPlayerLeading && !isOpponentCrashed && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-300 text-[8px] font-bold text-black animate-pulse">
                👑
              </span>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-mono text-base sm:text-lg font-black tracking-tight text-cyan-300">
              {myDist}m
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-400 -mt-1">
              {playerScore.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* --- CENTER: VERSUS & REAL-TIME LEAD STATUS --- */}
        <div className="flex flex-col items-center px-1">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-black uppercase tracking-wider shadow-sm transition-all duration-300 ${
              isOpponentCrashed
                ? 'bg-emerald-500 text-black shadow-emerald-500/50 animate-bounce'
                : isPlayerLeading
                ? 'bg-cyan-400 text-black shadow-cyan-400/40'
                : isOpponentLeading
                ? 'bg-rose-500 text-white shadow-rose-500/40'
                : 'bg-amber-400 text-black'
            }`}
          >
            {isOpponentCrashed ? (
              <>
                <Trophy className="h-3 w-3 shrink-0" />
                <span>RIVAL CRASHED!</span>
              </>
            ) : isPlayerLeading ? (
              <>
                <Zap className="h-3 w-3 shrink-0" />
                <span>+{Math.abs(diff)}m AHEAD</span>
              </>
            ) : isOpponentLeading ? (
              <>
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>-{Math.abs(diff)}m BEHIND</span>
              </>
            ) : (
              <>
                <Swords className="h-3 w-3 shrink-0" />
                <span>TIED</span>
              </>
            )}
          </div>

          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase mt-0.5">
            LIVE 1v1 RACE
          </span>
        </div>

        {/* --- RIGHT: OPPONENT (RIVAL) --- */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col text-right">
            <span className="font-mono text-base sm:text-lg font-black tracking-tight text-rose-400">
              {oppDist}m
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-400 -mt-1">
              {(multiplayer.opponentScore || 0).toLocaleString()} pts
            </span>
          </div>
          <div className="relative flex h-8 max-w-[70px] sm:max-w-[90px] items-center justify-center truncate rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 px-2 font-mono text-[11px] font-black text-white shadow-md shadow-rose-500/30">
            {multiplayer.opponentName.toUpperCase()}
            {isOpponentCrashed && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 text-[8px] font-bold text-rose-400 border border-rose-500">
                ✕
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- MINI TRACK PROGRESS BAR (Visual Head-to-Head Position) --- */}
      <div className="relative flex h-2 w-full max-w-[280px] sm:max-w-[340px] items-center rounded-full bg-black/60 px-1 border border-white/10 backdrop-blur-sm overflow-visible">
        {/* Track Line */}
        <div className="absolute inset-x-2 h-[2px] bg-white/20 rounded-full" />

        {/* Middle Marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2 bg-white/30" />

        {/* Opponent Dot */}
        <div
          className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border border-rose-300 bg-rose-500 shadow-md shadow-rose-500/60 transition-all duration-300 flex items-center justify-center text-[8px] font-mono font-bold text-white z-10"
          style={{ left: `${opponentTrackPercent}%` }}
          title={`Rival: ${oppDist}m`}
        >
          {isOpponentCrashed ? '✕' : 'R'}
        </div>

        {/* Player Dot */}
        <div
          className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-cyan-400 shadow-lg shadow-cyan-400/80 transition-all duration-300 flex items-center justify-center text-[9px] font-mono font-black text-black z-20"
          style={{ left: `${playerTrackPercent}%` }}
          title={`You: ${myDist}m`}
        >
          Y
        </div>
      </div>
    </div>
  );
};
