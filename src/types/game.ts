export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type Lane = -1 | 0 | 1; // -1: Left, 0: Center, 1: Right

export type PowerUpType = 'MAGNET' | 'JETPACK' | 'SHIELD' | 'MULTIPLIER' | 'SKATEBOARD';

export type WeatherType = 'CLEAR' | 'RAIN' | 'FOG';

export type EnvironmentTheme = 'SUNNY_CITY' | 'NEON_CYBER' | 'JUNGLE_RUINS' | 'SNOWY_PEAKS';

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number; // total duration in seconds
  timeLeft: number; // remaining seconds
}

export interface PowerUpUpgrades {
  magnetLevel: number;     // 1..5
  jetpackLevel: number;    // 1..5
  shieldLevel: number;     // 1..5
  multiplierLevel: number; // 1..5
  skateboardLevel: number; // 1..5
}

export type SuperpowerType =
  | 'BALANCED'
  | 'COIN_RUSH'
  | 'HYPER_MAGNET'
  | 'DOUBLE_JUMP'
  | 'LOW_GRAVITY'
  | 'GOLDEN_TOUCH'
  | 'FESTIVE_GIFTS'
  | 'SPARKLER_AURA';

export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  unlocked: boolean;
  color: string;
  accentColor: string;
  skinColor: string;
  specialAbility: string;
  superpowerDescription: string;
  superpowerType: SuperpowerType;
  statMagnetBonus: number;
  statPowerupBonus: number;
  statCoinBonus: number;
  statAutoShield: boolean;
  isHolidayEvent?: boolean;
  modelUrl?: string; // Add this
}

export interface PlayerSkin {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  bodyHex: number;
  accentHex: number;
  pantsHex: number;
  previewColor: string;
  previewAccent: string;
  isRare?: boolean;
}

export const DEFAULT_SKINS: PlayerSkin[] = [
  {
    id: 'skin_default',
    name: 'Classic Runner',
    description: 'Signature character outfit with original street colors.',
    price: 0,
    unlocked: true,
    bodyHex: 0x2563eb,
    accentHex: 0xf59e0b,
    pantsHex: 0x1e293b,
    previewColor: '#2563eb',
    previewAccent: '#f59e0b',
  },
  {
    id: 'skin_neon_cyber',
    name: 'Neon Cyber Suit',
    description: 'Electric cyan jacket with hot magenta neon trim.',
    price: 800,
    unlocked: false,
    bodyHex: 0x06b6d4,
    accentHex: 0xec4899,
    pantsHex: 0x0f172a,
    previewColor: '#06b6d4',
    previewAccent: '#ec4899',
  },
  {
    id: 'skin_crimson_samurai',
    name: 'Crimson Blaze',
    description: 'Fiery scarlet tracksuit with bright golden stripes.',
    price: 1200,
    unlocked: false,
    bodyHex: 0xdc2626,
    accentHex: 0xfacc15,
    pantsHex: 0x18181b,
    previewColor: '#dc2626',
    previewAccent: '#facc15',
  },
  {
    id: 'skin_emerald_stealth',
    name: 'Emerald Viper',
    description: 'Tactical emerald stealth hoodie with lime accents.',
    price: 1800,
    unlocked: false,
    bodyHex: 0x059669,
    accentHex: 0xa3e635,
    pantsHex: 0x064e3b,
    previewColor: '#059669',
    previewAccent: '#a3e635',
  },
  {
    id: 'skin_royal_gold',
    name: '24K Royal Gold',
    description: 'Rare championship gold armor with diamond white trim.',
    price: 2500,
    unlocked: false,
    bodyHex: 0xf59e0b,
    accentHex: 0xffffff,
    pantsHex: 0x451a03,
    previewColor: '#f59e0b',
    previewAccent: '#ffffff',
    isRare: true,
  },
  {
    id: 'skin_galaxy_void',
    name: 'Cosmic Void',
    description: 'Rare ultraviolet nebula suit with electric cyan glow.',
    price: 3000,
    unlocked: false,
    bodyHex: 0x7c3aed,
    accentHex: 0x38bdf8,
    pantsHex: 0x1e1b4b,
    previewColor: '#7c3aed',
    previewAccent: '#38bdf8',
    isRare: true,
  },
];

export interface InGameMission {
  id: string;
  title: string;
  type: 'COINS' | 'JUMPS' | 'TRAINS';
  target: number;
  current: number;
  completed: boolean;
  rewardPoints: number;
}

export interface PlayerInventory {
  freeRevives: number;
  multiplier24hUntil: number; // timestamp in ms
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  coins: number;
  distance: number;
  characterName: string;
  date: string;
  isCurrentPlayer?: boolean;
}

export interface DailyStreakState {
  currentStreak: number; // 1..7
  lastClaimDate: string; // YYYY-MM-DD
  claimedDays: number[]; // e.g. [1, 2]
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', playerName: 'ApexRunner', score: 28540, coins: 412, distance: 3420, characterName: 'Aria Gold', date: 'Yesterday' },
  { id: '2', playerName: 'ShadowDash', score: 21300, coins: 320, distance: 2650, characterName: 'Kenji Shadow', date: '3 days ago' },
  { id: '3', playerName: 'CyberSpeed', score: 17850, coins: 265, distance: 2140, characterName: 'Maya Swift', date: '5 days ago' },
  { id: '4', playerName: 'StreetKing', score: 14200, coins: 198, distance: 1780, characterName: 'Roy Vance', date: '1 week ago' },
  { id: '5', playerName: 'OrbitPilot', score: 9800, coins: 140, distance: 1250, characterName: 'Captain Nova', date: '2 weeks ago' },
];

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  type: 'COLLECT_COINS' | 'RUN_DISTANCE' | 'USE_POWERUPS' | 'REACH_SCORE' | 'HIGH_COMBO' | 'NEAR_MISS' | 'DODGE_TRAIN';
}

export interface GameStats {
  score: number;
  highScore: number;
  coins: number;
  totalCoins: number;
  distance: number;
  speed: number;
  speedLevel: number;
  combo: number;
  maxCombo: number;
  powerUpsCollected: number;
  nearMisses: number;
  newHighScore: boolean;
  weather: WeatherType;
  theme: EnvironmentTheme;
  isSkateboardActive: boolean;
  ghostDistanceDiff?: number | null;
  hasGhostRecording?: boolean;
  multiplayer?: MultiplayerRaceState;
  inGameMission?: InGameMission | null;
  runMultiplierBonus?: number;
}

export interface MultiplayerRaceState {
  isMatch: boolean;
  roomId?: string | null;
  opponentName: string;
  opponentDist: number;
  opponentScore: number;
  opponentCrashed: boolean;
  status: 'WAITING' | 'COUNTDOWN' | 'RACING' | 'FINISHED';
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number; // 0..1
}

export const LANE_WIDTH = 2.5;
export const BASE_RUN_SPEED = 13.5; // Balanced starting base speed (units per sec)
export const MAX_RUN_SPEED = 30;  // Smooth, fair maximum speed cap (units per sec)
export const JUMP_HEIGHT = 3.05; // Reaches Y = 3.05 (comfortably above taller train roof at Y = 2.35)
export const JUMP_DURATION = 0.60; // Fast, snappy jump (~0.6s total air time)
export const SLIDE_DURATION = 0.50; // Quick 0.5s slide then automatically stand up
export const TRAIN_ROOF_HEIGHT = 2.35; // Elevation of massive train roof surface (Y = 2.35)

export const CHARACTERS: Character[] = [
  {
    id: 'roy',
    name: 'Roy Vance',
    title: 'The Runner (Default)',
    description: 'Street-smart parkour runner in blue hoodie & jeans with swift reflexes.',
    price: 0,
    unlocked: true,
    color: '#2563eb', // Royal Blue
    accentColor: '#f59e0b', // Amber
    skinColor: '#e0ac69',
    specialAbility: 'Coin Rush Surge',
    superpowerDescription: 'Every 30 coins triggers a 4s Turbo Speed Boost + Invincibility!',
    superpowerType: 'COIN_RUSH',
    statMagnetBonus: 0,
    statPowerupBonus: 0,
    statCoinBonus: 0,
    statAutoShield: false,
    modelUrl: 'https://threejs.org/examples/models/gltf/Soldier.glb',
  },
  {
    id: 'maya',
    name: 'Maya Swift',
    title: 'The Athlete',
    description: 'Track athlete with a high ponytail, wearing a sports top and track pants.',
    price: 500,
    unlocked: false,
    color: '#dc2626', // Crimson Red
    accentColor: '#ffffff',
    skinColor: '#8d5524',
    specialAbility: 'Hyper Magnetism',
    superpowerDescription: '+40% Magnet Range & 15% faster lane dodge transitions!',
    superpowerType: 'HYPER_MAGNET',
    statMagnetBonus: 0.4,
    statPowerupBonus: 0.1,
    statCoinBonus: 0.1,
    statAutoShield: false,
    modelUrl: 'https://threejs.org/examples/models/gltf/Xbot.glb',
  },
  {
    id: 'kenji',
    name: 'Kenji Shadow',
    title: 'The Ninja',
    description: 'Ancient ninja in dark clothing with a mask, headband, and shadow double jump.',
    price: 1500,
    unlocked: false,
    color: '#059669', // Emerald
    accentColor: '#a855f7', // Purple
    skinColor: '#f1c27d',
    specialAbility: 'Ninja Double Jump',
    superpowerDescription: 'Can jump a SECOND time in mid-air to leap over massive trains!',
    superpowerType: 'DOUBLE_JUMP',
    statMagnetBonus: 0.1,
    statPowerupBonus: 0.15,
    statCoinBonus: 0.1,
    statAutoShield: false,
    modelUrl: 'https://threejs.org/examples/models/gltf/Soldier.glb',
  },
  {
    id: 'nova',
    name: 'Captain Nova',
    title: 'Orbital Astronaut',
    description: 'Deep-space explorer fitted with anti-gravity thrusters and pressurized suit.',
    price: 3000,
    unlocked: false,
    color: '#0891b2', // Cyan
    accentColor: '#f43f5e', // Rose
    skinColor: '#ffdbac',
    specialAbility: 'Lunar Gravity',
    superpowerDescription: 'Jumps 35% higher with floaty smooth air-hang time!',
    superpowerType: 'LOW_GRAVITY',
    statMagnetBonus: 0.2,
    statPowerupBonus: 0.25,
    statCoinBonus: 0.15,
    statAutoShield: false,
    modelUrl: 'https://threejs.org/examples/models/gltf/Xbot.glb',
  },
  {
    id: 'aria',
    name: 'Aria Gold',
    title: 'Golden Champion',
    description: 'Blinged royalty adorned in gilded diamond track armor and golden spikes.',
    price: 5000,
    unlocked: false,
    color: '#d97706', // Gold
    accentColor: '#ffffff',
    skinColor: '#c68642',
    specialAbility: 'Midas Golden Touch',
    superpowerDescription: 'Every coin collected is worth DOUBLE (2X Coin Value) + starts with 1 Shield!',
    superpowerType: 'GOLDEN_TOUCH',
    statMagnetBonus: 0.25,
    statPowerupBonus: 0.2,
    statCoinBonus: 1.0,
    statAutoShield: true,
  },
  {
    id: 'santa',
    name: 'Santa Runner',
    title: 'Festive Holiday Legend',
    description: 'Jolly gift-bearer sprinting in red coat and Santa hat with festive jingling cheer!',
    price: 3500,
    unlocked: false,
    color: '#b91c1c', // Deep Crimson
    accentColor: '#f8fafc', // Snowy White
    skinColor: '#ffdbac',
    specialAbility: 'Festive Gift Surge',
    superpowerDescription: '+50% Coin values & starts every run with a lucky Mystery Gift Box!',
    superpowerType: 'FESTIVE_GIFTS',
    statMagnetBonus: 0.35,
    statPowerupBonus: 0.3,
    statCoinBonus: 0.5,
    statAutoShield: false,
    isHolidayEvent: true,
  },
  {
    id: 'diwali',
    name: 'Diwali Spark',
    title: 'Festival of Lights Legend',
    description: 'Radiant celebration hero in golden royal sherwani with sparkling fireworks trail!',
    price: 4500,
    unlocked: false,
    color: '#f59e0b', // Radiant Amber Gold
    accentColor: '#ec4899', // Festival Magenta
    skinColor: '#8d5524',
    specialAbility: 'Sparkler Firework Trail',
    superpowerDescription: 'Blazing golden particle aura + starts with 1 Shield & 2x Combo Multiplier!',
    superpowerType: 'SPARKLER_AURA',
    statMagnetBonus: 0.35,
    statPowerupBonus: 0.35,
    statCoinBonus: 0.75,
    statAutoShield: true,
    isHolidayEvent: true,
  },
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Coin Frenzy',
    description: 'Collect 100 coins in a single run',
    target: 100,
    current: 0,
    rewardCoins: 300,
    completed: false,
    claimed: false,
    type: 'COLLECT_COINS',
  },
  {
    id: 'm2',
    title: 'Near Miss Daredevil',
    description: 'Trigger 3 Near Misses by grazing past obstacles',
    target: 3,
    current: 0,
    rewardCoins: 400,
    completed: false,
    claimed: false,
    type: 'NEAR_MISS',
  },
  {
    id: 'm3',
    title: 'Train Dodger',
    description: 'Dodge 5 oncoming or stationary subway trains',
    target: 5,
    current: 0,
    rewardCoins: 500,
    completed: false,
    claimed: false,
    type: 'DODGE_TRAIN',
  },
  {
    id: 'm4',
    title: 'Marathon Runner',
    description: 'Run 1,500 meters in a single session',
    target: 1500,
    current: 0,
    rewardCoins: 450,
    completed: false,
    claimed: false,
    type: 'RUN_DISTANCE',
  },
  {
    id: 'm5',
    title: 'Power Overload',
    description: 'Activate 4 power-up gadgets in one run',
    target: 4,
    current: 0,
    rewardCoins: 350,
    completed: false,
    claimed: false,
    type: 'USE_POWERUPS',
  },
];

export const DEFAULT_UPGRADES: PowerUpUpgrades = {
  magnetLevel: 1,
  jetpackLevel: 1,
  shieldLevel: 1,
  multiplierLevel: 1,
  skateboardLevel: 1,
};
