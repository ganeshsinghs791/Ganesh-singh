import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Character,
  PlayerSkin,
  PowerUpUpgrades,
} from '../types/game';
import {
  ShoppingBag,
  Users,
  Palette,
  Wrench,
  Coins,
  Check,
  Lock,
  Sparkles,
  Magnet,
  Flame,
  Shield,
  Zap,
  Disc,
  ArrowUpCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { soundSynth } from '../audio/soundSynth';

export type ShopCategory = 'CHARACTERS' | 'SKINS' | 'UPGRADES';

interface ShopModalProps {
  initialTab?: ShopCategory;
  totalCoins: number;
  characters: Character[];
  selectedCharacterId: string;
  skins: PlayerSkin[];
  selectedSkinId: string;
  upgrades: PowerUpUpgrades;
  onSelectCharacter: (id: string) => void;
  onUnlockCharacter: (id: string) => void;
  onSelectSkin: (id: string) => void;
  onUnlockSkin: (id: string) => void;
  onUpgradePowerUp: (key: keyof PowerUpUpgrades, cost: number) => void;
  onClose: () => void;
}

const UPGRADE_COSTS = [0, 250, 500, 1000, 2000]; // Level 1->2, 2->3, 3->4, 4->5

const UPGRADE_ITEMS: {
  key: keyof PowerUpUpgrades;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  baseDuration: number;
}[] = [
  {
    key: 'magnetLevel',
    name: 'Coin Magnet',
    desc: 'Pulls all nearby coins automatically (+5s per level)',
    icon: <Magnet className="h-5 w-5 text-sky-400" />,
    color: 'border-sky-500/40 bg-sky-500/10',
    baseDuration: 10,
  },
  {
    key: 'jetpackLevel',
    name: 'Rocket Boost',
    desc: 'Fly high above trains and obstacles (+5s per level)',
    icon: <Flame className="h-5 w-5 text-orange-400" />,
    color: 'border-orange-500/40 bg-orange-500/10',
    baseDuration: 10,
  },
  {
    key: 'shieldLevel',
    name: 'Energy Shield',
    desc: 'Protects from crashing into obstacles (+5s per level)',
    icon: <Shield className="h-5 w-5 text-amber-400" />,
    color: 'border-amber-500/40 bg-amber-500/10',
    baseDuration: 10,
  },
  {
    key: 'multiplierLevel',
    name: '2x Score Star',
    desc: 'Doubles all points earned during run (+5s per level)',
    icon: <Zap className="h-5 w-5 text-purple-400" />,
    color: 'border-purple-500/40 bg-purple-500/10',
    baseDuration: 10,
  },
  {
    key: 'skateboardLevel',
    name: 'Hover Skateboard',
    desc: 'Double-tap protection board duration (+5s per level)',
    icon: <Disc className="h-5 w-5 text-emerald-400" />,
    color: 'border-emerald-500/40 bg-emerald-500/10',
    baseDuration: 10,
  },
];

export const ShopModal: React.FC<ShopModalProps> = ({
  initialTab = 'CHARACTERS',
  totalCoins,
  characters,
  selectedCharacterId,
  skins,
  selectedSkinId,
  upgrades,
  onSelectCharacter,
  onUnlockCharacter,
  onSelectSkin,
  onUnlockSkin,
  onUpgradePowerUp,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ShopCategory>(initialTab);
  const [purchasedItemAnim, setPurchasedItemAnim] = useState<string | null>(null);
  const [purchaseToast, setPurchaseToast] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);

  const triggerPurchaseFeedback = (itemId: string, title: string, subtitle: string) => {
    setPurchasedItemAnim(itemId);
    setPurchaseToast({ title, subtitle });
    soundSynth.playJackpot();
    confetti({
      particleCount: 55,
      spread: 65,
      origin: { y: 0.65 },
    });

    setTimeout(() => {
      setPurchasedItemAnim(null);
    }, 650);

    setTimeout(() => {
      setPurchaseToast(null);
    }, 2600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-2xl flex-col rounded-3xl border border-amber-500/30 bg-slate-900/95 p-6 text-white shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-mono text-2xl font-black tracking-wide text-amber-300">
                RUNNER SHOP
              </h2>
              <p className="text-xs text-slate-400">
                Spend your coins on Characters, Outfits & Power-Up Upgrades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-amber-300 font-mono font-bold text-sm">
              <Coins className="h-4 w-4 text-amber-400" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/80 p-1.5 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('CHARACTERS');
              soundSynth.playButtonClick();
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === 'CHARACTERS'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>1. Characters</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('SKINS');
              soundSynth.playButtonClick();
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === 'SKINS'
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>2. Skins</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('UPGRADES');
              soundSynth.playButtonClick();
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === 'UPGRADES'
                ? 'bg-gradient-to-r from-sky-500 to-emerald-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>3. Upgrades</span>
          </button>
        </div>

        {/* "Successfully Purchased!" Floating Toast Banner */}
        {purchaseToast && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-2.5 text-emerald-200 shadow-lg animate-bounce">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-300">
                  Successfully Purchased!
                </span>
                <p className="text-xs font-semibold text-white">
                  {purchaseToast.title} — <span className="text-emerald-200">{purchaseToast.subtitle}</span>
                </p>
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-amber-300" />
          </div>
        )}

        {/* Tab Content Body */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {/* TAB 1: CHARACTERS */}
          {activeTab === 'CHARACTERS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {characters.map(char => {
                const isSelected = char.id === selectedCharacterId;
                const canAfford = totalCoins >= char.price;
                const isAnimating = purchasedItemAnim === `char_${char.id}`;

                return (
                  <div
                    key={char.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
                      isAnimating ? 'scale-105 ring-2 ring-emerald-400' : ''
                    } ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : char.unlocked
                        ? 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 shadow-inner relative"
                        style={{ backgroundColor: char.color }}
                      >
                        <div
                          className="h-6 w-6 rounded-full border-2 border-white/60"
                          style={{ backgroundColor: char.accentColor }}
                        />
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-black shadow">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-mono text-base font-extrabold text-white">
                            {char.name}
                          </h3>
                          {char.unlocked && (
                            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              OWNED
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{char.description}</p>
                        <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <span>{char.specialAbility}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {char.unlocked ? (
                        <button
                          onClick={() => onSelectCharacter(char.id)}
                          disabled={isSelected}
                          className={`w-full rounded-xl py-2.5 text-xs font-extrabold transition ${
                            isSelected
                              ? 'bg-amber-400 text-black cursor-default'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                        >
                          {isSelected ? 'SELECTED RUNNER' : 'EQUIP RUNNER'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!canAfford) return;
                            onUnlockCharacter(char.id);
                            triggerPurchaseFeedback(
                              `char_${char.id}`,
                              char.name,
                              `Unlocked ${char.specialAbility}!`
                            );
                          }}
                          disabled={!canAfford}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:scale-[1.02] active:scale-95 shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>BUY FOR {char.price.toLocaleString()} COINS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SKINS (OUTFITS) */}
          {activeTab === 'SKINS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {skins.map(skin => {
                const isSelected = skin.id === selectedSkinId;
                const canAfford = totalCoins >= skin.price;
                const isAnimating = purchasedItemAnim === `skin_${skin.id}`;

                return (
                  <div
                    key={skin.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
                      isAnimating ? 'scale-105 ring-2 ring-fuchsia-400' : ''
                    } ${
                      isSelected
                        ? 'border-fuchsia-400 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/10'
                        : skin.unlocked
                        ? 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Dual-tone Outfit Swatch Preview */}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 shadow-inner relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${skin.previewColor} 0%, ${skin.previewAccent} 100%)`,
                        }}
                      >
                        <Palette className="h-6 w-6 text-white drop-shadow" />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-400 text-black shadow">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-mono text-base font-extrabold text-white">
                            {skin.name}
                          </h3>
                          {skin.isRare ? (
                            <span className="rounded-md bg-fuchsia-500/20 border border-fuchsia-400/40 px-2 py-0.5 text-[9px] font-black text-fuchsia-300">
                              RARE SKIN
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                              OUTFIT
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{skin.description}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {skin.unlocked ? (
                        <button
                          onClick={() => onSelectSkin(skin.id)}
                          disabled={isSelected}
                          className={`w-full rounded-xl py-2.5 text-xs font-extrabold transition ${
                            isSelected
                              ? 'bg-fuchsia-400 text-black cursor-default'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                        >
                          {isSelected ? 'EQUIPPED OUTFIT' : 'WEAR OUTFIT'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!canAfford) return;
                            onUnlockSkin(skin.id);
                            triggerPurchaseFeedback(
                              `skin_${skin.id}`,
                              skin.name,
                              'New Outfit Equipped!'
                            );
                          }}
                          disabled={!canAfford}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition ${
                            canAfford
                              ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black hover:scale-[1.02] active:scale-95 shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>BUY FOR {skin.price.toLocaleString()} COINS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: POWER-UP UPGRADES */}
          {activeTab === 'UPGRADES' && (
            <div className="flex flex-col gap-3">
              {UPGRADE_ITEMS.map(item => {
                const currentLevel = upgrades[item.key] || 1;
                const isMax = currentLevel >= 5;
                const cost = isMax ? 0 : UPGRADE_COSTS[currentLevel];
                const canAfford = totalCoins >= cost;
                const currentDuration = item.baseDuration + (currentLevel - 1) * 5;
                const nextDuration = currentDuration + 5;
                const isAnimating = purchasedItemAnim === `upg_${item.key}`;

                return (
                  <div
                    key={item.key}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all duration-300 ${
                      isAnimating ? 'scale-[1.03] ring-2 ring-sky-400' : ''
                    } ${item.color}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900/90 border border-white/10 shadow-md">
                        {item.icon}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-white">
                            {item.name}
                          </span>
                          <span className="rounded-md bg-slate-900/90 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/30">
                            LVL {currentLevel}/5
                          </span>
                          <span className="rounded-md bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                            {currentDuration}s {!isMax && `→ ${nextDuration}s`}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-300">{item.desc}</p>

                        {/* 5-Segment Level Bar */}
                        <div className="mt-2 flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(lvl => (
                            <div
                              key={lvl}
                              className={`h-1.5 w-8 rounded-full transition-all ${
                                lvl <= currentLevel
                                  ? 'bg-gradient-to-r from-amber-400 to-emerald-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Upgrade Button */}
                    <button
                      onClick={() => {
                        if (isMax || !canAfford) return;
                        onUpgradePowerUp(item.key, cost);
                        triggerPurchaseFeedback(
                          `upg_${item.key}`,
                          `${item.name} Lv.${currentLevel + 1}`,
                          `Duration increased to ${nextDuration}s!`
                        );
                      }}
                      disabled={isMax || !canAfford}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 font-mono text-xs font-black transition shrink-0 ${
                        isMax
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md hover:scale-105 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? (
                        <span>MAX LEVEL (30s)</span>
                      ) : (
                        <>
                          <ArrowUpCircle className="h-4 w-4" />
                          <span>{cost.toLocaleString()} COINS</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
