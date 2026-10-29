import React, { useState, useEffect } from 'react';
import { Mission } from '../types/game';
import { X, Check, Target, Coins, RefreshCw, Sparkles, Clock, Flame, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../audio/soundSynth';

interface MissionsModalProps {
  missions: Mission[];
  onClaimReward: (missionId: string) => void;
  onRefreshMissions: () => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  onClaimReward,
  onRefreshMissions,
  onClose,
}) => {
  // Calculate remaining time until next midnight reset
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeftStr(`${hours}h ${mins}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = missions.filter(m => m.completed).length;

  const handleClaim = (missionId: string) => {
    onClaimReward(missionId);
    soundSynth.playPowerUp();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-lg flex-col rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="font-mono text-xl font-black text-emerald-300">DAILY QUESTS</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>Resets in: <strong className="text-amber-300 font-mono">{timeLeftStr}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshMissions}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
              title="Reroll Quests"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Daily Special Event Banner */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-3 shadow-inner">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-amber-300">
                DAILY EVENT
              </span>
              <span className="font-mono text-xs font-bold text-white">TRAIN DODGE MAYHEM</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Complete daily quests to earn double XP, huge coin caches & bonus spins!
            </p>
          </div>
        </div>

        {/* Quests Completion Meter */}
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-xs text-slate-400">
            Today's Progress: <strong className="text-white font-mono">{completedCount} of {missions.length}</strong>
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-300 font-mono">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            {completedCount === missions.length ? 'ALL QUESTS CLEARED! 🎉' : `${missions.length - completedCount} REMAINING`}
          </span>
        </div>

        {/* Quests List */}
        <div className="mt-3 flex flex-col gap-2.5 max-h-[52vh] overflow-y-auto pr-1">
          {missions.map(mission => {
            const pct = Math.min(100, Math.floor((mission.current / mission.target) * 100));

            return (
              <div
                key={mission.id}
                className={`flex flex-col gap-2 rounded-2xl border p-4 transition ${
                  mission.completed
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {mission.title}
                      {mission.completed && <Check className="h-4 w-4 text-emerald-400 inline" />}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{mission.description}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 font-mono">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    <span>+{mission.rewardCoins}</span>
                  </div>
                </div>

                {/* Progress Bar & Claim Button */}
                <div className="mt-1 flex items-center gap-3">
                  <div className="relative flex-1 h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {Math.floor(mission.current)}/{mission.target}
                  </span>

                  {mission.completed && !mission.claimed ? (
                    <button
                      onClick={() => handleClaim(mission.id)}
                      className="animate-pulse rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-3.5 py-1.5 font-mono text-xs font-black text-black shadow-md hover:bg-amber-300 transition"
                    >
                      CLAIM
                    </button>
                  ) : mission.claimed ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 font-mono">
                      <Check className="h-4 w-4" /> CLAIMED
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
