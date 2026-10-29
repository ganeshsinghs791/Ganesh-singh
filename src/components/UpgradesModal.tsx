import React from 'react';
import { PowerUpUpgrades, PowerUpType } from '../types/game';
import { X, Magnet, Rocket, Shield, Sparkles, Flame, Coins, ChevronUp, Check } from 'lucide-react';
import { soundSynth } from '../audio/soundSynth';

interface UpgradesModalProps {
  upgrades: PowerUpUpgrades;
  totalCoins: number;
  onUpgrade: (type: keyof PowerUpUpgrades, cost: number) => void;
  onClose: () => void;
}

interface UpgradeItem {
  key: keyof PowerUpUpgrades;
  name: string;
  type: PowerUpType;
  description: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  baseCost: number; // Tier costs: Lvl 2: 300, Lvl 3: 700, Lvl 4: 1500, Lvl 5: 3000
}

const UPGRADE_ITEMS: UpgradeItem[] = [
  {
    key: 'magnetLevel',
    name: 'Coin Magnet',
    type: 'MAGNET',
    description: 'Increases magnet pull radius & active duration (+2s per level)',
    icon: <Magnet className="h-6 w-6" />,
    color: '#0284c7',
    glowColor: 'rgba(2, 132, 199, 0.3)',
    baseCost: 300,
  },
  {
    key: 'jetpackLevel',
    name: 'Rocket Jetpack',
    type: 'JETPACK',
    description: 'Soar higher, fly faster, and extend jetpack duration (+1.5s per level)',
    icon: <Rocket className="h-6 w-6" />,
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.3)',
    baseCost: 350,
  },
  {
    key: 'shieldLevel',
    name: 'Energy Shield',
    type: 'SHIELD',
    description: 'Enhances shield crash deflection & grants +100 bonus crash score',
    icon: <Shield className="h-6 w-6" />,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    baseCost: 250,
  },
  {
    key: 'multiplierLevel',
    name: '2X Score Multiplier',
    type: 'MULTIPLIER',
    description: 'Extends score booster duration (+2.5s per level) with combo acceleration',
    icon: <Sparkles className="h-6 w-6" />,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    baseCost: 400,
  },
  {
    key: 'skateboardLevel',
    name: 'Hover Skateboard',
    type: 'SKATEBOARD',
    description: 'Extends skateboard ride time and grants supersonic cruising speed',
    icon: <Flame className="h-6 w-6" />,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    baseCost: 300,
  },
];

const getUpgradeCost = (currentLevel: number, baseCost: number) => {
  if (currentLevel >= 5) return 0;
  // Multipliers for levels: Lvl 2: 1x, Lvl 3: 2.2x, Lvl 4: 4.5x, Lvl 5: 9x
  const multipliers = [1, 2.2, 4.5, 9];
  return Math.round(baseCost * multipliers[currentLevel - 1]);
};

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  upgrades,
  totalCoins,
  onUpgrade,
  onClose,
}) => {
  const handleUpgradeClick = (item: UpgradeItem) => {
    const curLvl = upgrades[item.key];
    if (curLvl >= 5) return;
    const cost = getUpgradeCost(curLvl, item.baseCost);
    if (totalCoins < cost) return;

    soundSynth.playPowerUp();
    onUpgrade(item.key, cost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-lg flex-col rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="font-mono text-xs font-bold tracking-widest text-sky-400 uppercase">
              WORKBENCH & LAB
            </span>
            <h2 className="font-mono text-2xl font-black text-amber-300">GADGET UPGRADES</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-amber-500/30 px-3.5 py-1.5 text-amber-300 font-mono text-sm font-bold">
              <Coins className="h-4 w-4 text-amber-400" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="mt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {UPGRADE_ITEMS.map(item => {
            const currentLvl = upgrades[item.key];
            const isMax = currentLvl >= 5;
            const cost = getUpgradeCost(currentLvl, item.baseCost);
            const canAfford = totalCoins >= cost;

            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition hover:border-slate-700"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                    <p className="text-xs text-slate-400 max-w-[200px] leading-tight mt-0.5">
                      {item.description}
                    </p>

                    {/* Level Bar Dots */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(lvl => (
                        <div
                          key={lvl}
                          className={`h-2 w-5 rounded-full transition-all ${
                            lvl <= currentLvl
                              ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                      <span className="ml-1 font-mono text-[11px] font-bold text-amber-300">
                        {isMax ? 'MAX' : `LVL ${currentLvl}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Upgrade Button */}
                <div>
                  {isMax ? (
                    <div className="flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-emerald-400 font-mono text-xs font-bold">
                      <Check className="h-4 w-4" /> MAX
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgradeClick(item)}
                      disabled={!canAfford}
                      className={`flex flex-col items-center justify-center rounded-xl px-3.5 py-2 font-mono transition ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-black">
                        <ChevronUp className="h-3.5 w-3.5" /> UPGRADE
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <Coins className="h-3 w-3" /> {cost.toLocaleString()}
                      </div>
                    </button>
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
