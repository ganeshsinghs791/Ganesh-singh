import React from 'react';
import { Character, Mission, AudioSettings } from '../types/game';
import {
  Play,
  Users,
  Target,
  Settings,
  Volume2,
  VolumeX,
  Music,
  Coins,
  Trophy,
  Gift,
  ShoppingBag,
  Zap,
  Package,
} from 'lucide-react';

interface MainMenuProps {
  selectedCharacter: Character;
  highScore: number;
  totalCoins: number;
  missions: Mission[];
  audioSettings: AudioSettings;
  canClaimDaily: boolean;
  onPlay: () => void;
  onOpenMultiplayer: () => void;
  onOpenShop: () => void;
  onOpenCharacterSelect: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onOpenMysteryBox: () => void;
  onOpenUpgrades: () => void;
  onOpenLeaderboard: () => void;
  onOpenDailyStreak: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedCharacter,
  highScore,
  totalCoins,
  missions,
  audioSettings,
  canClaimDaily,
  onPlay,
  onOpenMultiplayer,
  onOpenShop,
  onOpenCharacterSelect,
  onOpenMissions,
  onOpenSettings,
  onOpenMysteryBox,
  onOpenLeaderboard,
  onOpenDailyStreak,
  onToggleSound,
  onToggleMusic,
}) => {
  const completedMissionsCount = missions.filter(m => m.completed && !m.claimed).length;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 font-sans text-white select-none">
      {/* Top Bar: Bank Coins & High Score Leaderboard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Total Coins */}
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-black/60 px-4 py-2 backdrop-blur-md shadow-lg">
            <Coins className="h-5 w-5 text-amber-400" />
            <span className="font-mono text-lg font-extrabold text-amber-300">
              {totalCoins.toLocaleString()}
            </span>
          </div>

          {/* High Score & Leaderboard Trigger */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-black/60 px-3.5 py-1.5 backdrop-blur-md shadow-lg transition hover:border-sky-400 active:scale-95 text-left"
            title="View Top 5 Leaderboard"
          >
            <Trophy className="h-5 w-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase">LEADERBOARD</span>
              <span className="font-mono text-sm font-bold text-sky-200">
                {highScore.toLocaleString()}
              </span>
            </div>
          </button>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition backdrop-blur-md ${
              audioSettings.soundEnabled
                ? 'border-sky-500/40 bg-sky-950/60 text-sky-300'
                : 'border-white/10 bg-black/50 text-slate-500'
            }`}
            title="Toggle Sound Effects"
          >
            {audioSettings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button
            onClick={onToggleMusic}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition backdrop-blur-md ${
              audioSettings.musicEnabled
                ? 'border-amber-500/40 bg-amber-950/60 text-amber-300'
                : 'border-white/10 bg-black/50 text-slate-500'
            }`}
            title="Toggle Music Synth"
          >
            <Music className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-xs font-black tracking-widest text-sky-400 uppercase drop-shadow">
          PREMIUM 3D ENDLESS RUNNER
        </span>
        <h1 className="mt-1 font-mono text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-amber-400 sm:text-6xl drop-shadow-lg">
          JUNGLE DASH
        </h1>
        <p className="mt-2 max-w-sm text-sm text-amber-100/90 drop-shadow">
          Dash through tracks, dodge oncoming trains, collect coins & unlock outfits!
        </p>

        {/* Selected Runner Tag */}
        <div className="mt-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 backdrop-blur-md shadow-lg">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-slate-300">Active Superpower:</span>
          <span className="font-bold text-amber-300">{selectedCharacter.specialAbility}</span>
        </div>
      </div>

      {/* Bottom Menu Buttons */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 pb-2">
        {/* PLAY BUTTONS: SOLO RUN & ONLINE MULTIPLAYER */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onPlay}
            className="group relative flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3.5 font-mono text-lg font-black tracking-wider text-black shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] active:scale-95"
          >
            <Play className="h-6 w-6 fill-black shrink-0" />
            SOLO RUN
          </button>

          <button
            onClick={onOpenMultiplayer}
            className="group relative flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 py-3.5 font-mono text-lg font-black tracking-wider text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02] active:scale-95 border border-cyan-300/40"
          >
            <span className="absolute -top-1 -right-1 flex h-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-pulse shadow-md">
              P2P 1v1
            </span>
            <Users className="h-6 w-6 shrink-0 text-cyan-200" />
            MULTIPLAYER
          </button>
        </div>

        {/* Secondary Row 1: SHOP, MYSTERY BOX & 7-DAY STREAK */}
        <div className="grid grid-cols-3 gap-2">
          {/* Shop Menu (Characters, Skins, Power-up Upgrades) */}
          <button
            onClick={onOpenShop}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-400/40 bg-emerald-950/60 p-2.5 transition hover:bg-emerald-900/70 active:scale-95 backdrop-blur-md shadow-md"
          >
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-extrabold text-emerald-200">Shop</span>
          </button>

          {/* Mystery Box (1,000 Coins) */}
          <button
            onClick={onOpenMysteryBox}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/40 bg-purple-950/60 p-2.5 transition hover:bg-purple-900/70 active:scale-95 backdrop-blur-md shadow-md"
          >
            <Package className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-extrabold text-purple-200">Mystery Box</span>
          </button>

          {/* Daily Streak */}
          <button
            onClick={onOpenDailyStreak}
            className="relative flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/30 bg-black/60 p-2.5 transition hover:bg-black/80 active:scale-95 backdrop-blur-md shadow-md"
          >
            {canClaimDaily && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-black">
                !
              </span>
            )}
            <Gift className="h-4 w-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-200">7-Day Bonus</span>
          </button>
        </div>

        {/* Secondary Row 2: Runners, Missions, Leaderboard, Settings */}
        <div className="grid grid-cols-4 gap-2">
          {/* Characters */}
          <button
            onClick={onOpenCharacterSelect}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/60 p-2 transition hover:bg-black/80 active:scale-95 backdrop-blur-md"
          >
            <Users className="h-4 w-4 text-sky-400" />
            <span className="text-[10px] font-bold text-slate-200">Runners</span>
          </button>

          {/* Missions */}
          <button
            onClick={onOpenMissions}
            className="relative flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/60 p-2 transition hover:bg-black/80 active:scale-95 backdrop-blur-md"
          >
            {completedMissionsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black">
                {completedMissionsCount}
              </span>
            )}
            <Target className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-200">Missions</span>
          </button>

          {/* Leaderboard Top 5 */}
          <button
            onClick={onOpenLeaderboard}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/60 p-2 transition hover:bg-black/80 active:scale-95 backdrop-blur-md"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-200">Leaderboard</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/60 p-2 transition hover:bg-black/80 active:scale-95 backdrop-blur-md"
          >
            <Settings className="h-4 w-4 text-purple-400" />
            <span className="text-[10px] font-bold text-slate-200">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
