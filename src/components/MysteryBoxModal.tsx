import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Gift,
  Coins,
  Shield,
  Magnet,
  Flame,
  Award,
  CheckCircle2,
  HeartPulse,
  Zap,
  Palette,
  Package,
} from 'lucide-react';
import { soundSynth } from '../audio/soundSynth';
import { PlayerInventory } from '../types/game';

export interface MysteryBoxModalProps {
  totalCoins: number;
  inventory?: PlayerInventory;
  onRewardCoins: (amount: number) => void;
  onRewardBonus: (rewardType: string) => void;
  onDeductCoins: (amount: number) => boolean;
  onUnlockRandomCharacter?: () => string | null;
  onUnlockRareSkin?: () => string | null;
  onGrant24hMultiplier?: () => void;
  onGrantFreeRevive?: () => void;
  onClose: () => void;
}

export interface WheelSegment {
  label: string;
  sublabel: string;
  color: string;
  textColor: string;
  type: 'COINS' | 'SHIELD' | 'MAGNET' | 'SKATEBOARD' | 'RARE_SKIN';
  amount: number;
  iconName: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    label: '100',
    sublabel: 'COINS',
    color: '#0284c7',
    textColor: '#ffffff',
    type: 'COINS',
    amount: 100,
    iconName: 'Coins',
  },
  {
    label: '1000',
    sublabel: 'MEGA COINS!',
    color: '#f59e0b',
    textColor: '#000000',
    type: 'COINS',
    amount: 1000,
    iconName: 'Coins',
  },
  {
    label: 'SHIELD',
    sublabel: 'FREE GUARD',
    color: '#3b82f6',
    textColor: '#ffffff',
    type: 'SHIELD',
    amount: 1,
    iconName: 'Shield',
  },
  {
    label: 'MAGNET',
    sublabel: 'COIN VACUUM',
    color: '#06b6d4',
    textColor: '#ffffff',
    type: 'MAGNET',
    amount: 1,
    iconName: 'Magnet',
  },
  {
    label: '500',
    sublabel: 'MONEY BACK',
    color: '#10b981',
    textColor: '#ffffff',
    type: 'COINS',
    amount: 500,
    iconName: 'Coins',
  },
  {
    label: 'SKATE',
    sublabel: '+3 BOARDS',
    color: '#ec4899',
    textColor: '#ffffff',
    type: 'SKATEBOARD',
    amount: 3,
    iconName: 'Flame',
  },
  {
    label: 'RARE SKIN',
    sublabel: 'HERO UNLOCK',
    color: '#8b5cf6',
    textColor: '#ffffff',
    type: 'RARE_SKIN',
    amount: 2500,
    iconName: 'Award',
  },
  {
    label: '250',
    sublabel: 'COINS',
    color: '#eab308',
    textColor: '#000000',
    type: 'COINS',
    amount: 250,
    iconName: 'Coins',
  },
];

const MYSTERY_BOX_COST = 1000;
const SPIN_COST = 500;
const NUM_LEDS = 24;

type MysteryRewardType = 'COINS_500' | 'RARE_SKIN' | 'MULTIPLIER_24H' | 'FREE_REVIVE';

interface MysteryBoxReward {
  type: MysteryRewardType;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

export const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({
  totalCoins,
  inventory,
  onRewardCoins,
  onRewardBonus,
  onDeductCoins,
  onUnlockRandomCharacter,
  onUnlockRareSkin,
  onGrant24hMultiplier,
  onGrantFreeRevive,
  onClose,
}) => {
  const [mode, setMode] = useState<'MYSTERY_BOX' | 'LUCKY_WHEEL'>('MYSTERY_BOX');

  // Mystery Box states
  const [isBoxShaking, setIsBoxShaking] = useState(false);
  const [boxStage, setBoxStage] = useState<'IDLE' | 'SHAKING' | 'REVEALED'>('IDLE');
  const [boxReward, setBoxReward] = useState<MysteryBoxReward | null>(null);

  // Lucky Wheel states
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<{
    segment: WheelSegment;
    unlockedHeroName?: string | null;
  } | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [activeLed, setActiveLed] = useState(0);
  const [freeDailyUsed, setFreeDailyUsed] = useState(() => {
    const lastDailySpin = localStorage.getItem('subway_dash_last_wheel_spin');
    if (!lastDailySpin) return false;
    const diff = Date.now() - parseInt(lastDailySpin, 10);
    return diff < 12 * 60 * 60 * 1000;
  });

  const numSegments = WHEEL_SEGMENTS.length;
  const segAngle = 360 / numSegments;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpinning || isBoxShaking) {
      interval = setInterval(() => {
        setActiveLed(prev => (prev + 1) % NUM_LEDS);
      }, 50);
    } else {
      interval = setInterval(() => {
        setActiveLed(prev => (prev + 1) % NUM_LEDS);
      }, 350);
    }
    return () => clearInterval(interval);
  }, [isSpinning, isBoxShaking]);

  // --- MYSTERY BOX (1,000 COINS) HANDLER ---
  const handleOpenMysteryBox = () => {
    if (isBoxShaking || totalCoins < MYSTERY_BOX_COST) return;
    const deducted = onDeductCoins(MYSTERY_BOX_COST);
    if (!deducted) return;

    setIsBoxShaking(true);
    setBoxStage('SHAKING');
    setBoxReward(null);

    // Suspenseful shaking ticks
    let tickCount = 0;
    const shakeInterval = setInterval(() => {
      soundSynth.playWheelTick();
      tickCount++;
      if (tickCount >= 14) {
        clearInterval(shakeInterval);
      }
    }, 110);

    setTimeout(() => {
      clearInterval(shakeInterval);
      setIsBoxShaking(false);
      setBoxStage('REVEALED');

      // Reveal random reward:
      // 1. 500 Coins
      // 2. Rare Skin
      // 3. 24-hour 2x Multiplier
      // 4. Free Revive
      const roll = Math.random();
      let revealed: MysteryBoxReward;

      if (roll < 0.25) {
        onRewardCoins(500);
        revealed = {
          type: 'COINS_500',
          title: '500 COINS!',
          subtitle: 'Instant Coin Rebate',
          description: '500 gold coins have been added directly to your bank!',
          color: 'from-amber-400 to-yellow-500',
        };
      } else if (roll < 0.50) {
        const skinName = onUnlockRareSkin ? onUnlockRareSkin() : null;
        if (skinName) {
          revealed = {
            type: 'RARE_SKIN',
            title: skinName.toUpperCase(),
            subtitle: 'RARE OUTFIT UNLOCKED!',
            description: `You unlocked the ${skinName} outfit! It is now equipped and saved in your Shop.`,
            color: 'from-fuchsia-500 to-purple-500',
          };
        } else {
          // Fallback if all skins already owned
          onRewardCoins(1500);
          revealed = {
            type: 'RARE_SKIN',
            title: '1,500 COINS JACKPOT!',
            subtitle: 'ALL RARE SKINS OWNED',
            description: 'You already own every Rare Skin, so you won a 1,500 Coins Mega Bonus!',
            color: 'from-fuchsia-500 to-amber-400',
          };
        }
      } else if (roll < 0.75) {
        onGrant24hMultiplier?.();
        revealed = {
          type: 'MULTIPLIER_24H',
          title: '24-HOUR 2x MULTIPLIER!',
          subtitle: 'ACTIVE FOR 24 HOURS',
          description: 'All your runs for the next 24 hours earn double score automatically!',
          color: 'from-purple-500 to-indigo-500',
        };
      } else {
        onGrantFreeRevive?.();
        revealed = {
          type: 'FREE_REVIVE',
          title: '+1 FREE REVIVE TOKEN!',
          subtitle: 'SAVED TO INVENTORY',
          description: 'Use this Free Revive token anytime you crash to continue your run!',
          color: 'from-emerald-400 to-teal-500',
        };
      }

      setBoxReward(revealed);
      soundSynth.playJackpot();
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.55 },
      });
    }, 1750);
  };

  // --- LUCKY WHEEL HANDLER ---
  const handleSpin = () => {
    if (isSpinning) return;

    if (!freeDailyUsed) {
      setFreeDailyUsed(true);
      localStorage.setItem('subway_dash_last_wheel_spin', Date.now().toString());
    } else {
      if (totalCoins < SPIN_COST) return;
      const success = onDeductCoins(SPIN_COST);
      if (!success) return;
    }

    setIsSpinning(true);
    setWonReward(null);
    setShowPrizeModal(false);

    const rand = Math.random();
    let winningIndex = 0;
    if (rand < 0.08) winningIndex = 6;
    else if (rand < 0.20) winningIndex = 1;
    else if (rand < 0.35) winningIndex = 4;
    else if (rand < 0.50) winningIndex = 2;
    else if (rand < 0.65) winningIndex = 3;
    else if (rand < 0.80) winningIndex = 5;
    else if (rand < 0.90) winningIndex = 7;
    else winningIndex = 0;

    let tickDelay = 60;
    let tickCount = 0;
    const playTicks = () => {
      soundSynth.playWheelTick();
      tickCount++;
      if (tickCount < 32) {
        tickDelay += 12;
        setTimeout(playTicks, tickDelay);
      }
    };
    playTicks();

    const targetOffset = 360 - winningIndex * segAngle - segAngle / 2;
    const finalRot = rotation + 1800 + (targetOffset - (rotation % 360));
    setRotation(finalRot);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = WHEEL_SEGMENTS[winningIndex];

      let unlockedHeroName: string | null = null;
      if (prize.type === 'RARE_SKIN' && onUnlockRandomCharacter) {
        unlockedHeroName = onUnlockRandomCharacter();
        if (!unlockedHeroName) {
          onRewardCoins(2500);
        }
      } else if (prize.type === 'COINS') {
        onRewardCoins(prize.amount);
      } else {
        onRewardBonus(prize.type);
      }

      setWonReward({ segment: prize, unlockedHeroName });
      setShowPrizeModal(true);

      if (prize.type === 'RARE_SKIN' || prize.amount >= 1000) {
        soundSynth.playJackpot();
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      } else {
        soundSynth.playPowerUp();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      }
    }, 4200);
  };

  const isFreeSpin = !freeDailyUsed;
  const has24hBoost =
    inventory && inventory.multiplier24hUntil > Date.now();
  const hoursRemaining = has24hBoost
    ? Math.max(1, Math.ceil((inventory!.multiplier24hUntil - Date.now()) / (1000 * 60 * 60)))
    : 0;

  const renderIcon = (name: string, className = 'h-4 w-4') => {
    switch (name) {
      case 'Coins':
        return <Coins className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Magnet':
        return <Magnet className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Award':
        return <Award className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <style>{`
        @keyframes mysteryShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1.05); }
          15% { transform: translate(-8px, -6px) rotate(-8deg) scale(1.1); }
          30% { transform: translate(8px, 4px) rotate(8deg) scale(1.12); }
          45% { transform: translate(-10px, 6px) rotate(-10deg) scale(1.14); }
          60% { transform: translate(10px, -4px) rotate(10deg) scale(1.12); }
          75% { transform: translate(-6px, -8px) rotate(-6deg) scale(1.15); }
          90% { transform: translate(6px, 6px) rotate(6deg) scale(1.1); }
        }
        .animate-mystery-shake {
          animation: mysteryShake 0.36s infinite ease-in-out;
        }
      `}</style>

      <div className="relative flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex w-full items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-amber-400" />
            <h2 className="font-mono text-xl font-black text-amber-300">
              {mode === 'MYSTERY_BOX' ? 'MYSTERY BOX' : 'LUCKY WHEEL'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-amber-500/30 px-3 py-1 text-amber-300 text-xs font-bold font-mono">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              disabled={isSpinning || isBoxShaking}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-3 grid w-full grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setMode('MYSTERY_BOX')}
            disabled={isSpinning || isBoxShaking}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'MYSTERY_BOX'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Mystery Box (1,000)</span>
          </button>
          <button
            onClick={() => setMode('LUCKY_WHEEL')}
            disabled={isSpinning || isBoxShaking}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'LUCKY_WHEEL'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Lucky Wheel</span>
          </button>
        </div>

        {/* Saved Inventory Bar */}
        {inventory && (
          <div className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
              <span>Free Revives: {inventory.freeRevives}</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Zap className="h-3.5 w-3.5 text-purple-400" />
              <span>
                24h 2x Multiplier: {has24hBoost ? `Active (${hoursRemaining}h)` : 'Inactive'}
              </span>
            </div>
          </div>
        )}

        {/* --- MODE 1: MYSTERY BOX (1,000 COINS) --- */}
        {mode === 'MYSTERY_BOX' ? (
          <div className="mt-4 flex w-full flex-col items-center">
            {/* Mystery Chest Visual */}
            <div className="relative flex h-52 w-full flex-col items-center justify-center rounded-2xl border border-amber-500/25 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 p-4 overflow-hidden">
              {/* Ambient Glow */}
              <div
                className={`absolute h-36 w-36 rounded-full blur-2xl transition-all duration-300 ${
                  isBoxShaking
                    ? 'bg-amber-400/50 scale-125'
                    : boxStage === 'REVEALED'
                    ? 'bg-emerald-400/40 scale-125'
                    : 'bg-purple-500/25'
                }`}
              />

              {boxStage === 'REVEALED' && boxReward ? (
                <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in duration-300">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${boxReward.color} text-black shadow-lg`}
                  >
                    {boxReward.type === 'COINS_500' && <Coins className="h-9 w-9" />}
                    {boxReward.type === 'RARE_SKIN' && <Palette className="h-9 w-9" />}
                    {boxReward.type === 'MULTIPLIER_24H' && <Zap className="h-9 w-9" />}
                    {boxReward.type === 'FREE_REVIVE' && <HeartPulse className="h-9 w-9" />}
                  </div>
                  <span className="mt-2 font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                    {boxReward.subtitle}
                  </span>
                  <h3 className="font-mono text-2xl font-black text-white mt-0.5">
                    {boxReward.title}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-slate-300">{boxReward.description}</p>
                </div>
              ) : (
                <div
                  className={`relative z-10 flex flex-col items-center ${
                    isBoxShaking ? 'animate-mystery-shake' : 'hover:scale-105 transition-transform'
                  }`}
                >
                  {/* 3D-Styled Treasure Mystery Box */}
                  <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-3xl border-4 border-amber-400 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.45)]">
                    <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-amber-300/90 border-y border-amber-900/40" />
                    <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-amber-300/90 border-x border-amber-900/40" />
                    <div className="z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 border-2 border-amber-300 text-amber-300 font-mono text-2xl font-black shadow">
                      ?
                    </div>
                  </div>
                  <span className="mt-3 font-mono text-xs font-bold text-amber-300 tracking-wider">
                    {isBoxShaking ? 'OPENING MYSTERY BOX...' : 'TAP BELOW TO UNBOX!'}
                  </span>
                </div>
              )}
            </div>

            {/* Possible Rewards Preview Grid */}
            <div className="mt-3 grid w-full grid-cols-4 gap-1.5 text-center">
              <div className="rounded-xl border border-amber-500/30 bg-slate-950/70 p-2">
                <Coins className="mx-auto h-4 w-4 text-amber-400" />
                <span className="mt-1 block font-mono text-[10px] font-bold text-white">500 Coins</span>
              </div>
              <div className="rounded-xl border border-fuchsia-500/30 bg-slate-950/70 p-2">
                <Palette className="mx-auto h-4 w-4 text-fuchsia-400" />
                <span className="mt-1 block font-mono text-[10px] font-bold text-white">Rare Skin</span>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-slate-950/70 p-2">
                <Zap className="mx-auto h-4 w-4 text-purple-400" />
                <span className="mt-1 block font-mono text-[10px] font-bold text-white">24h 2x Star</span>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-slate-950/70 p-2">
                <HeartPulse className="mx-auto h-4 w-4 text-emerald-400" />
                <span className="mt-1 block font-mono text-[10px] font-bold text-white">Free Revive</span>
              </div>
            </div>

            {/* Buy Mystery Box Button */}
            <button
              onClick={handleOpenMysteryBox}
              disabled={isBoxShaking || totalCoins < MYSTERY_BOX_COST}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-mono text-base font-black transition ${
                isBoxShaking
                  ? 'bg-amber-600 text-black cursor-wait'
                  : totalCoins >= MYSTERY_BOX_COST
                  ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400 text-black shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Gift className="h-5 w-5" />
              {isBoxShaking
                ? 'SHAKING MYSTERY BOX...'
                : boxStage === 'REVEALED'
                ? 'OPEN ANOTHER BOX (1,000 COINS)'
                : 'BUY MYSTERY BOX (1,000 COINS)'}
            </button>
          </div>
        ) : (
          /* --- MODE 2: LUCKY WHEEL --- */
          <>
            <div className="relative mt-4 flex items-center justify-center">
              <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-amber-700 to-amber-900 p-3 shadow-[0_0_40px_rgba(245,158,11,0.35)]">
                {Array.from({ length: NUM_LEDS }).map((_, i) => {
                  const angle = (i * 360) / NUM_LEDS;
                  const rad = (angle * Math.PI) / 180;
                  const r = 122;
                  const x = r * Math.sin(rad);
                  const y = -r * Math.cos(rad);
                  const isLit = i === activeLed || (i + 1) % NUM_LEDS === activeLed;

                  return (
                    <div
                      key={i}
                      className={`absolute h-2 w-2 rounded-full transition-all duration-150 ${
                        isLit
                          ? 'bg-yellow-200 shadow-[0_0_8px_#fef08a] scale-125'
                          : 'bg-amber-950/80 border border-amber-700/50'
                      }`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    />
                  );
                })}

                <div className="absolute -top-3.5 z-30 flex flex-col items-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                  <div className="h-0 w-0 border-x-8 border-x-transparent border-t-[20px] border-t-yellow-300 filter drop-shadow" />
                  <div className="h-2 w-2 rounded-full bg-white shadow-sm -mt-1" />
                </div>

                <div
                  className="relative h-full w-full rounded-full border-4 border-slate-900 overflow-hidden transition-transform ease-out"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transitionDuration: isSpinning ? '4.2s' : '0s',
                    transitionTimingFunction: 'cubic-bezier(0.12, 0.95, 0.18, 1)',
                  }}
                >
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    {WHEEL_SEGMENTS.map((seg, i) => {
                      const angle = segAngle;
                      const startAngle = i * angle;
                      const endAngle = startAngle + angle;

                      const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                      const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                      const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                      const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);

                      const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                      const midAngle = startAngle + angle / 2;
                      const tx = 50 + 33 * Math.cos((Math.PI * (midAngle - 90)) / 180);
                      const ty = 50 + 33 * Math.sin((Math.PI * (midAngle - 90)) / 180);

                      return (
                        <g key={i}>
                          <path d={d} fill={seg.color} stroke="#0f172a" strokeWidth="1.2" />
                          <text
                            x={tx}
                            y={ty}
                            fill={seg.textColor}
                            fontSize="4.4"
                            fontWeight="900"
                            fontFamily="monospace"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                          >
                            {seg.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  <div className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-yellow-400 bg-gradient-to-br from-slate-900 to-slate-950 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                    <Gift className="h-5 w-5 text-amber-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex w-full flex-col gap-2">
              <button
                onClick={handleSpin}
                disabled={isSpinning || (!isFreeSpin && totalCoins < SPIN_COST)}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-mono text-base font-black transition ${
                  isSpinning
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : isFreeSpin
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95'
                    : totalCoins >= SPIN_COST
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="h-5 w-5" />
                {isSpinning
                  ? 'SPINNING WHEEL...'
                  : isFreeSpin
                  ? 'FREE DAILY SPIN!'
                  : `SPIN FOR ${SPIN_COST} COINS`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Prize Won Modal Dialog for Wheel */}
      {showPrizeModal && wonReward && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-amber-400/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              {renderIcon(wonReward.segment.iconName, 'h-9 w-9')}
            </div>

            <span className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
              CONGRATULATIONS!
            </span>

            <h3 className="mt-1 font-mono text-3xl font-black text-white">
              {wonReward.segment.type === 'RARE_SKIN' && wonReward.unlockedHeroName
                ? wonReward.unlockedHeroName
                : `${wonReward.segment.label} ${wonReward.segment.sublabel}`}
            </h3>

            <p className="mt-2 text-xs text-slate-300">
              {wonReward.segment.type === 'RARE_SKIN'
                ? wonReward.unlockedHeroName
                  ? `You unlocked ${wonReward.unlockedHeroName}! Select them in the Shop menu.`
                  : 'All characters unlocked! You received a 2,500 Coins Mega Jackpot!'
                : wonReward.segment.type === 'COINS'
                ? `${wonReward.segment.amount} Coins have been added to your vault!`
                : `${wonReward.segment.sublabel} token collected for your next run!`}
            </p>

            <button
              onClick={() => setShowPrizeModal(false)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 font-mono text-base font-black text-black hover:bg-amber-300 transition"
            >
              <CheckCircle2 className="h-5 w-5" />
              COLLECT PRIZE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
