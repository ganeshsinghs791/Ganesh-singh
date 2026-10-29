import React, { useEffect, useRef, useState } from 'react';
import { GameStats, ActivePowerUp, Mission, BASE_RUN_SPEED, MAX_RUN_SPEED, PowerUpType } from '../types/game';
import { RaceHUD } from './RaceHUD';
import {
  Coins,
  Pause,
  Gauge,
  Target,
  CheckCircle2,
} from 'lucide-react';

interface GameHUDProps {
  stats: GameStats;
  activePowerUps: ActivePowerUp[];
  activeMissions: Mission[];
  comboMessage: string | null;
  nearMissMessage: string | null;
  themeAlert: string | null;
  inGameMissionAlert?: string | null;
  has24hMultiplier?: boolean;
  onPause: () => void;
}

// --- Custom Crisp Inline SVG Power-Up Icons ---
const MagnetSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7v6a8 8 0 0 0 16 0V7" />
    <path d="M4 7h4v5a4 4 0 0 0 8 0V7h4" />
    <line x1="4" y1="10" x2="8" y2="10" />
    <line x1="16" y1="10" x2="20" y2="10" />
  </svg>
);

const RocketSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    <circle cx="15" cy="9" r="1.5" fill="currentColor" />
  </svg>
);

const ShieldSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const MultiplierSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <text
      x="12"
      y="14.5"
      textAnchor="middle"
      fill="currentColor"
      fontSize="7.5"
      fontWeight="900"
      fontFamily="monospace"
    >
      x2
    </text>
  </svg>
);

const SkateboardSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10c1.5 2 3.5 2.5 10 2.5s8.5-.5 10-2.5" />
    <circle cx="7.5" cy="15.5" r="2" fill="currentColor" />
    <circle cx="16.5" cy="15.5" r="2" fill="currentColor" />
    <line x1="7.5" y1="12.5" x2="7.5" y2="14" />
    <line x1="16.5" y1="12.5" x2="16.5" y2="14" />
  </svg>
);

interface PowerUpConfig {
  type: PowerUpType;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  glowShadow: string;
  textClass: string;
  borderActiveClass: string;
  bgActiveClass: string;
  defaultDuration: number;
}

const POWER_UP_CONFIGS: PowerUpConfig[] = [
  {
    type: 'MAGNET',
    label: 'Magnet',
    icon: MagnetSvg,
    color: '#38bdf8',
    glowShadow: '0 0 16px rgba(56, 189, 248, 0.7)',
    textClass: 'text-sky-400',
    borderActiveClass: 'border-sky-400',
    bgActiveClass: 'bg-sky-950/80',
    defaultDuration: 10,
  },
  {
    type: 'JETPACK',
    label: 'Rocket',
    icon: RocketSvg,
    color: '#f97316',
    glowShadow: '0 0 16px rgba(249, 115, 22, 0.7)',
    textClass: 'text-orange-400',
    borderActiveClass: 'border-orange-400',
    bgActiveClass: 'bg-orange-950/80',
    defaultDuration: 10,
  },
  {
    type: 'SHIELD',
    label: 'Shield',
    icon: ShieldSvg,
    color: '#fbbf24',
    glowShadow: '0 0 16px rgba(251, 191, 36, 0.7)',
    textClass: 'text-amber-400',
    borderActiveClass: 'border-amber-400',
    bgActiveClass: 'bg-amber-950/80',
    defaultDuration: 10,
  },
  {
    type: 'MULTIPLIER',
    label: 'x2 Multiplier',
    icon: MultiplierSvg,
    color: '#c084fc',
    glowShadow: '0 0 16px rgba(192, 132, 252, 0.7)',
    textClass: 'text-purple-400',
    borderActiveClass: 'border-purple-400',
    bgActiveClass: 'bg-purple-950/80',
    defaultDuration: 10,
  },
  {
    type: 'SKATEBOARD',
    label: 'Skateboard',
    icon: SkateboardSvg,
    color: '#34d399',
    glowShadow: '0 0 16px rgba(52, 211, 153, 0.7)',
    textClass: 'text-emerald-400',
    borderActiveClass: 'border-emerald-400',
    bgActiveClass: 'bg-emerald-950/80',
    defaultDuration: 15,
  },
];

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  activePowerUps,
  comboMessage,
  nearMissMessage,
  inGameMissionAlert,
  has24hMultiplier,
  onPause,
}) => {
  const [multiplierGlow, setMultiplierGlow] = useState(false);

  // Track bounce (pickup) and flash-red (expired) animation states per power-up type
  const [bouncingTypes, setBouncingTypes] = useState<Record<string, boolean>>({});
  const [expiringTypes, setExpiringTypes] = useState<Record<string, boolean>>({});
  const prevTimeLeftRef = useRef<Record<string, number>>({});

  // Subtly glow the top score multiplier text when a combo, near-miss, or mission completion occurs
  useEffect(() => {
    if (comboMessage || nearMissMessage || inGameMissionAlert || (stats.combo > 0 && stats.combo % 5 === 0)) {
      setMultiplierGlow(true);
      const timer = setTimeout(() => setMultiplierGlow(false), 650);
      return () => clearTimeout(timer);
    }
  }, [comboMessage, nearMissMessage, inGameMissionAlert, stats.combo]);

  // Detect power-up collection (bounce pop) and expiration (flash red -> fade to grey)
  useEffect(() => {
    const prevMap = prevTimeLeftRef.current;
    const nextMap: Record<string, number> = {};

    POWER_UP_CONFIGS.forEach(({ type }) => {
      const found = activePowerUps.find(p => p.type === type);
      const curTime = found && found.timeLeft > 0 ? found.timeLeft : 0;
      const prevTime = prevMap[type] || 0;
      nextMap[type] = curTime;

      if ((prevTime === 0 && curTime > 0) || curTime > prevTime + 1.0) {
        setBouncingTypes(prev => ({ ...prev, [type]: true }));
        setExpiringTypes(prev => ({ ...prev, [type]: false }));
        setTimeout(() => {
          setBouncingTypes(prev => ({ ...prev, [type]: false }));
        }, 420);
      }

      if (prevTime > 0 && curTime === 0) {
        setExpiringTypes(prev => ({ ...prev, [type]: true }));
        setTimeout(() => {
          setExpiringTypes(prev => ({ ...prev, [type]: false }));
        }, 550);
      }
    });

    prevTimeLeftRef.current = nextMap;
  }, [activePowerUps]);

  const isMultiplierPowerUp =
    activePowerUps.some(p => p.type === 'MULTIPLIER' && p.timeLeft > 0) || !!has24hMultiplier;
  const runBonus = stats.runMultiplierBonus || 0;
  const scoreMultiplier =
    (isMultiplierPowerUp ? 2 : 1) * (Math.min(5, 1 + Math.floor(stats.combo / 10)) + runBonus);

  // Speedometer calculation: 1.0x (15 u/s) up to 3.0x (45 u/s)
  const currentSpeed = Math.max(BASE_RUN_SPEED, stats.speed || BASE_RUN_SPEED);
  const speedMultiplier = (currentSpeed / BASE_RUN_SPEED).toFixed(1);
  const speedFillPct = Math.min(
    100,
    Math.max(8, ((currentSpeed - BASE_RUN_SPEED) / (MAX_RUN_SPEED - BASE_RUN_SPEED)) * 100)
  );
  const isHighSpeed = currentSpeed >= 32;

  const miniMission = stats.inGameMission;
  const missionPct = miniMission
    ? Math.min(100, Math.round((miniMission.current / miniMission.target) * 100))
    : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-4 py-3 font-sans select-none overflow-hidden">
      {/* --- TOP EDGE BAR: Clean Score, Subtle Multiplier Glow, Distance, Speedometer & Coins --- */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left Column: Score/Distance/Speed HUD + Sleek Minimal Mini-Mission Line Underneath */}
        <div className="flex flex-col items-start gap-1.5">
          <div className="flex items-center gap-3 sm:gap-4 rounded-xl border border-white/10 bg-slate-950/75 px-3.5 py-2 text-white shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white tabular-nums">
                {stats.score.toLocaleString()}
              </span>
              <span
                className={`font-mono text-xs font-bold tabular-nums transition-all duration-200 ${
                  multiplierGlow
                    ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]'
                    : stats.combo > 0 || scoreMultiplier > 1
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {scoreMultiplier}x{stats.combo > 0 ? ` · ${stats.combo}` : ''}
              </span>
            </div>

            <span className="h-4 w-px bg-white/10" aria-hidden="true" />

            <div className="flex items-baseline gap-1 font-mono text-xs text-slate-300 tabular-nums">
              <span className="text-slate-400">Dist</span>
              <span className="font-semibold text-white">{stats.distance}m</span>
            </div>

            <span className="h-4 w-px bg-white/10" aria-hidden="true" />

            {/* Progressive Speedometer Indicator */}
            <div className="flex items-center gap-2" title={`Running Speed: ${currentSpeed.toFixed(1)} u/s`}>
              <Gauge className={`h-3.5 w-3.5 shrink-0 ${isHighSpeed ? 'text-orange-400' : 'text-sky-400'}`} />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1.5 font-mono text-[10px] leading-none tabular-nums">
                  <span className="text-slate-400">Speed</span>
                  <span className={`font-bold ${isHighSpeed ? 'text-orange-300' : 'text-sky-300'}`}>
                    {speedMultiplier}x
                  </span>
                </div>
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isHighSpeed
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                        : 'bg-gradient-to-r from-sky-400 to-emerald-400'
                    }`}
                    style={{ width: `${speedFillPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sleek, Minimal Top-Left Mini Mission Line (No bulky box, never overlaps center track) */}
          {miniMission && (
            <div className="flex items-center gap-2 pl-1 opacity-80">
              {miniMission.completed ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 drop-shadow" />
              ) : (
                <Target className="h-3 w-3 text-amber-400 shrink-0 drop-shadow" />
              )}
              <span className="font-mono text-[11px] font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tabular-nums">
                {miniMission.title} ({miniMission.current}/{miniMission.target})
              </span>
              {/* Thin, small progress bar right next to the text */}
              <div className="h-1 w-14 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${missionPct}%` }}
                />
              </div>
              {inGameMissionAlert && (
                <span className="font-mono text-[10px] font-bold text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {inGameMissionAlert}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Top-Center: Live Multiplayer Race HUD (Only during active P2P match) */}
        {stats.multiplayer && stats.multiplayer.isMatch && (
          <RaceHUD
            playerDistance={stats.distance}
            playerScore={stats.score}
            multiplayer={stats.multiplayer}
            className="mx-auto"
          />
        )}

        {/* Top-Right: Coins + Pause Button */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/75 px-3.5 py-2 shadow-sm">
            <Coins className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
              {stats.coins}
            </span>
          </div>

          <button
            onClick={onPause}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/75 text-slate-200 transition hover:bg-slate-900 hover:text-white active:scale-95"
            aria-label="Pause Game"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* --- BOTTOM EDGE BAR: Pure Icon Power-Up Dock with Circular Timers, Bounce & Expiry Flash --- */}
      <div className="pointer-events-none flex justify-center pb-2 sm:pb-3">
        <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-2 shadow-lg">
          {POWER_UP_CONFIGS.map(config => {
            const activeItem = activePowerUps.find(p => p.type === config.type);
            const isActive = !!activeItem && activeItem.timeLeft > 0;
            const timeLeft = activeItem ? activeItem.timeLeft : 0;
            const duration = activeItem ? activeItem.duration || config.defaultDuration : config.defaultDuration;
            const pct = Math.max(0, Math.min(100, (timeLeft / duration) * 100));

            const isBouncing = !!bouncingTypes[config.type];
            const isLowTime = isActive && timeLeft <= 1.5;
            const isExpiringFlash = !!expiringTypes[config.type] || isLowTime;

            const radius = 19;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - pct / 100);
            const IconComponent = config.icon;

            return (
              <div
                key={config.type}
                className="relative flex flex-col items-center"
                title={config.label}
              >
                <div
                  style={{
                    boxShadow: isExpiringFlash
                      ? '0 0 16px rgba(239, 68, 68, 0.85)'
                      : isActive
                      ? config.glowShadow
                      : 'none',
                  }}
                  className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all duration-300 ${
                    isBouncing ? 'scale-125 -translate-y-1.5' : 'scale-100 translate-y-0'
                  } ${
                    isExpiringFlash
                      ? 'border-2 border-red-500 bg-red-950/90 text-red-400 opacity-100'
                      : isActive
                      ? `border ${config.borderActiveClass} ${config.bgActiveClass} ${config.textClass} opacity-100`
                      : 'border border-slate-700/60 bg-slate-900/60 text-slate-400 opacity-30 grayscale'
                  }`}
                >
                  {/* Circular Countdown Progress Ring */}
                  {isActive && (
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
                      viewBox="0 0 44 44"
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        fill="none"
                        stroke={isExpiringFlash ? '#ef4444' : config.color}
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}

                  {/* Recognizable Power-Up SVG Symbol */}
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />

                  {/* Compact Numeric Countdown Badge when Active */}
                  {isActive && (
                    <span
                      className={`absolute -bottom-1.5 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-extrabold leading-tight tabular-nums shadow ${
                        isExpiringFlash
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-950 text-white border border-white/20'
                      }`}
                    >
                      {Math.ceil(timeLeft)}s
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
