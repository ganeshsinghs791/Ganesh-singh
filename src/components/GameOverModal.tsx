import React, { useState, useEffect } from 'react';
import { GameStats } from '../types/game';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Home,
  Trophy,
  Coins,
  Zap,
  Sparkles,
  Package,
  ShoppingBag,
  HeartPulse,
  Tv,
} from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  totalCoins: number;
  canRevive: boolean;
  freeRevivesCount?: number;
  onReviveCoins: () => void;
  onReviveFree: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onOpenShop: () => void;
  onOpenMysteryBox: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  totalCoins,
  canRevive,
  freeRevivesCount = 0,
  onReviveCoins,
  onReviveFree,
  onPlayAgain,
  onMainMenu,
  onOpenShop,
  onOpenMysteryBox,
  onOpenLeaderboard,
}) => {
  const [reviveCountdown, setReviveCountdown] = useState<number>(5);
  const [showReviveCard, setShowReviveCard] = useState<boolean>(canRevive);
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);

  // Confetti on New Record
  useEffect(() => {
    if (stats.newHighScore) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
      });
    }
  }, [stats.newHighScore]);

  // 5-second countdown timer for revive chance
  useEffect(() => {
    if (!showReviveCard || isWatchingAd) return;

    const timer = setInterval(() => {
      setReviveCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowReviveCard(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showReviveCard, isWatchingAd]);

  const handleFreeReviveClick = () => {
    if (freeRevivesCount > 0) {
      onReviveFree();
      return;
    }
    setIsWatchingAd(true);
    setTimeout(() => {
      setIsWatchingAd(false);
      onReviveFree();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-md flex-col rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        {/* REVIVE COUNTDOWN BANNER (ONE-TIME CHANCE) */}
        {showReviveCard && (
          <div className="mb-4 flex flex-col rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-center">
            {isWatchingAd ? (
              <div className="flex flex-col items-center py-2">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                <span className="mt-2 text-xs font-bold text-rose-300">
                  Simulating Quick Ad... Reviving in a moment!
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <HeartPulse className="h-5 w-5 animate-pulse" />
                    <span>REVIVE CHANCE!</span>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-xs font-black text-black">
                    {reviveCountdown}s
                  </span>
                </div>

                <p className="mt-1 text-left text-xs text-slate-300">
                  Keep your current score & distance with a{' '}
                  <strong className="text-amber-300">3.5s Golden Invincibility Shield</strong>!
                </p>

                {/* Revive Options */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={onReviveCoins}
                    disabled={totalCoins < 500}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-bold transition ${
                      totalCoins >= 500
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                        : 'border-slate-800 bg-slate-800/40 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    <span>Revive (500)</span>
                  </button>

                  <button
                    onClick={handleFreeReviveClick}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-500/20 py-2 px-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    {freeRevivesCount > 0 ? (
                      <>
                        <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Use Token ({freeRevivesCount})</span>
                      </>
                    ) : (
                      <>
                        <Tv className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Free Revive</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setShowReviveCard(false)}
                  className="mt-2 text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Skip Revive & View Score
                </button>
              </>
            )}
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <span className="font-mono text-xs font-bold tracking-widest text-rose-400 uppercase">
            RUN FINISHED
          </span>
          <h2 className="mt-1 font-mono text-4xl font-black text-rose-500">GAME OVER</h2>

          {stats.newHighScore && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-1 text-xs font-bold text-amber-300 animate-bounce">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>NEW ALL-TIME HIGH SCORE RECORD!</span>
            </div>
          )}
        </div>

        {/* Score Breakdown Cards */}
        <div className="mt-4 flex flex-col gap-2.5">
          {/* Main Score Box */}
          <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-amber-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">FINAL SCORE</span>
                <p className="font-mono text-2xl font-black text-amber-300">
                  {stats.score.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase">ALL-TIME BEST</span>
              <p className="font-mono text-sm font-bold text-slate-300">
                {stats.highScore.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stats Grid: 4 items */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-800/50 p-2 text-center">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="mt-1 text-[9px] font-bold text-slate-400">COINS</span>
              <span className="font-mono text-xs font-bold text-amber-300">+{stats.coins}</span>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-800/50 p-2 text-center">
              <Zap className="h-4 w-4 text-sky-400" />
              <span className="mt-1 text-[9px] font-bold text-slate-400">DIST</span>
              <span className="font-mono text-xs font-bold text-sky-300">{stats.distance}m</span>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-800/50 p-2 text-center">
              <Sparkles className="h-4 w-4 text-rose-400" />
              <span className="mt-1 text-[9px] font-bold text-slate-400">DODGES</span>
              <span className="font-mono text-xs font-bold text-rose-300">{stats.nearMisses}</span>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-800/50 p-2 text-center">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="mt-1 text-[9px] font-bold text-slate-400">COMBO</span>
              <span className="font-mono text-xs font-bold text-purple-300">{stats.maxCombo}x</span>
            </div>
          </div>

          {/* Ghost Multiplayer Run Comparison */}
          {stats.ghostDistanceDiff !== undefined && stats.ghostDistanceDiff !== null ? (
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <span>👻 GHOST RACE:</span>
                <span>
                  {stats.ghostDistanceDiff > 0
                    ? `Finished ${stats.ghostDistanceDiff}m ahead!`
                    : stats.ghostDistanceDiff < 0
                    ? `Finished ${Math.abs(stats.ghostDistanceDiff)}m behind`
                    : 'Tied with previous record!'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-cyan-400/80">
                {stats.newHighScore ? 'NEW GHOST SAVED' : 'PERSONAL BEST'}
              </span>
            </div>
          ) : stats.newHighScore ? (
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-xs font-bold text-cyan-300">
              <span>👻 NEW GHOST BENCHMARK SET!</span>
              <span className="font-mono text-[10px] text-cyan-400">SAVED FOR NEXT RACE</span>
            </div>
          ) : null}
        </div>

        {/* Shop, Mystery Box & Leaderboard Row */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <button
            onClick={onOpenShop}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 px-2 font-mono text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/25 active:scale-95"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
            <span>SHOP</span>
          </button>
          <button
            onClick={onOpenMysteryBox}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/15 py-2.5 px-2 font-mono text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/25 active:scale-95"
          >
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <span>BOX</span>
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/40 bg-purple-500/15 py-2.5 px-2 font-mono text-[11px] font-bold text-purple-300 transition hover:bg-purple-500/25 active:scale-95"
          >
            <Trophy className="h-3.5 w-3.5 text-purple-400" />
            <span>TOP 5</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 font-mono text-lg font-black text-black shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] active:scale-95"
          >
            <RotateCcw className="h-5 w-5" /> PLAY AGAIN
          </button>
          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-700 bg-slate-800 py-2.5 font-bold text-sm text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            <Home className="h-4 w-4" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
