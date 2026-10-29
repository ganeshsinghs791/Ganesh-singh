import React from 'react';
import { Gift, Coins, Sparkles, Check, Lock, X, Shield, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyRewardDay {
  day: number;
  coins: number;
  label: string;
  bonus?: string;
  isGrandPrize?: boolean;
}

const REWARDS: DailyRewardDay[] = [
  { day: 1, coins: 150, label: 'Day 1' },
  { day: 2, coins: 300, label: 'Day 2' },
  { day: 3, coins: 500, label: 'Day 3', bonus: '+1 Shield' },
  { day: 4, coins: 750, label: 'Day 4' },
  { day: 5, coins: 1000, label: 'Day 5', bonus: '+1 Skateboard' },
  { day: 6, coins: 1500, label: 'Day 6' },
  { day: 7, coins: 3000, label: 'Day 7', bonus: 'Grand Spin!', isGrandPrize: true },
];

interface DailyBonusModalProps {
  currentStreak: number; // 1 to 7
  canClaimToday: boolean;
  onClaim: (rewardCoins: number, bonusType?: string) => void;
  onClose: () => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  currentStreak,
  canClaimToday,
  onClaim,
  onClose,
}) => {
  const activeDayIndex = Math.min(Math.max(currentStreak - 1, 0), 6);
  const activeReward = REWARDS[activeDayIndex];

  const handleClaimClick = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    onClaim(activeReward.coins, activeReward.bonus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-xl flex-col rounded-3xl border border-amber-500/40 bg-slate-900/95 p-6 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 shadow-lg shadow-amber-500/10">
            <Gift className="h-7 w-7" />
          </div>
          <h2 className="mt-3 font-mono text-2xl font-black text-amber-300 sm:text-3xl">
            7-DAY LOGIN STREAK
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Log in daily to claim escalating coin bundles & unlock the Day 7 Grand Prize!
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>CURRENT STREAK: DAY {currentStreak} OF 7</span>
          </div>
        </div>

        {/* 7-Day Calendar Grid */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {REWARDS.map(r => {
            const isClaimed = canClaimToday ? r.day < currentStreak : r.day <= currentStreak;
            const isToday = r.day === currentStreak && canClaimToday;
            const isLocked = r.day > currentStreak;

            return (
              <div
                key={r.day}
                className={`relative flex flex-col items-center justify-between rounded-2xl border p-3 text-center transition ${
                  r.isGrandPrize
                    ? 'col-span-2 sm:col-span-1 border-amber-400/80 bg-gradient-to-b from-amber-500/25 to-orange-500/10 shadow-md shadow-amber-500/20'
                    : isToday
                    ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/50 shadow-md'
                    : isClaimed
                    ? 'border-emerald-500/40 bg-emerald-950/30'
                    : 'border-slate-800 bg-slate-800/40 opacity-70'
                }`}
              >
                {/* Day Tag */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                    {r.label}
                  </span>
                  {isClaimed ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : isLocked ? (
                    <Lock className="h-3 w-3 text-slate-500" />
                  ) : (
                    <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-black">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Reward Center */}
                <div className="my-2 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-300 font-mono font-black text-base">
                    <Coins className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>+{r.coins}</span>
                  </div>
                  {r.bonus && (
                    <span className="mt-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-sky-300">
                      {r.bonus}
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                <span
                  className={`text-[10px] font-bold tracking-tight uppercase ${
                    isClaimed
                      ? 'text-emerald-400'
                      : isToday
                      ? 'text-amber-300 font-black'
                      : 'text-slate-500'
                  }`}
                >
                  {isClaimed ? 'Claimed' : isToday ? 'Ready' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          {canClaimToday ? (
            <button
              onClick={handleClaimClick}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 py-3.5 font-mono text-base font-black text-black shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="h-5 w-5 fill-black" />
              CLAIM DAY {currentStreak} REWARD (+{activeReward.coins} COINS)
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/80 py-3 text-center">
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="h-4 w-4" /> TODAY'S REWARD CLAIMED
              </span>
              <span className="text-[11px] text-slate-400">
                Come back tomorrow to claim Day {(currentStreak % 7) + 1} reward!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
