import * as THREE from 'three';
import {
  Lane,
  LANE_WIDTH,
  BASE_RUN_SPEED,
  MAX_RUN_SPEED,
  JUMP_HEIGHT,
  JUMP_DURATION,
  SLIDE_DURATION,
  TRAIN_ROOF_HEIGHT,
  PowerUpType,
  WeatherType,
  ActivePowerUp,
  GameStats,
  Character,
  Mission,
  EnvironmentTheme,
  PowerUpUpgrades,
  DEFAULT_UPGRADES,
  PlayerSkin,
  InGameMission,
} from '../types/game';
import {
  PoolManager,
  PoolableObstacle,
  PoolableWarningLight,
  PoolableCoin,
  PoolablePowerUp,
  PoolableBoostPad,
} from './poolManager';
import {
  createProceduralCharacter,
  CharacterRig,
  createInspectorCharacter,
  InspectorRig,
  createPoliceDog,
  DogRig,
} from './proceduralAssets';
import { soundSynth } from '../audio/soundSynth';
import { haptics } from '../utils/haptics';

const _vec3 = new THREE.Vector3();

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onPowerUpsUpdate: (powerUps: ActivePowerUp[]) => void;
  onGameOver: (finalStats: GameStats) => void;
  onMissionProgress: (type: Mission['type'], delta: number) => void;
  onComboMessage: (text: string) => void;
  onNearMiss?: (text: string) => void;
  onThemeChange?: (theme: EnvironmentTheme, themeName: string) => void;
  onChaseStart?: () => void;
  onScreenFade?: (fadeBlack: boolean) => void;
  onInGameMissionComplete?: (title: string, newBonusMultiplier: number) => void;
}

const MINI_MISSION_TEMPLATES: Array<{ title: string; type: InGameMission['type']; target: number }> = [
  { title: 'Collect 30 coins', type: 'COINS', target: 30 },
  { title: 'Jump over 5 obstacles', type: 'JUMPS', target: 5 },
  { title: 'Dodge 3 trains', type: 'TRAINS', target: 3 },
  { title: 'Collect 20 coins', type: 'COINS', target: 20 },
  { title: 'Jump 5 times', type: 'JUMPS', target: 5 },
];

export class GameEngine {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  private isLowEndDevice: boolean = false;
  private poolManager: PoolManager;

  // Character, Skin & Player State
  private characterRig: CharacterRig | null = null;
  private selectedCharacter: Character;
  private activeSkin: PlayerSkin | null = null;
  private has24hMultiplier: boolean = false;
  private currentLane: Lane = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private verticalVelocity: number = 0;
  private isOnTrainRoof: boolean = false;
  private smoothedRoofFactor: number = 0;
  private smoothedLookAtY: number = 1.45;
  private smoothedLookAtZ: number = -10;
  private currentTrainUnderPlayer: PoolableObstacle | null = null;
  private roofLandingRollTimer: number = 0;
  private isJumping: boolean = false;
  private jumpTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private hasDoubleJumped: boolean = false;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private isStumbling: boolean = false;
  private isChaseSequence: boolean = false;
  private chaseTimer: number = 0;
  private hasTriggeredGotcha: boolean = false;
  private hasTriggeredFadeOut: boolean = false;
  private inspectorRig: InspectorRig | null = null;
  private dogRig: DogRig | null = null;
  private footstepTimer: number = 0;
  private coinsSinceLastSurge: number = 0;

  // Track & Endless Spawning System (Pooled)
  private activeChunks: THREE.Group[] = [];
  private activeObstacles: PoolableObstacle[] = [];
  private activeWarnings: PoolableWarningLight[] = [];
  private activeCoins: PoolableCoin[] = [];
  private activePowerUps: PoolablePowerUp[] = [];
  private activeBoostPads: PoolableBoostPad[] = [];
  private furthestSpawnZ: number = -60;

  // Dynamic Theme System
  private currentTheme: EnvironmentTheme = 'JUNGLE_RUINS';
  private currentWeather: WeatherType = 'CLEAR';

  // Game Loop & Physics State
  private isRunning: boolean = false;
  private animationFrameId: number = 0;
  private currentSpeed: number = BASE_RUN_SPEED;
  private runAnimPhase: number = 0;
  private distanceTraveled: number = 0;
  private score: number = 0;
  private coinsCollected: number = 0;
  private comboCount: number = 0;
  private maxComboCount: number = 0;
  private comboTimer: number = 0;
  private powerUpsCollectedCount: number = 0;
  private nearMissesCount: number = 0;
  private boostPadTimer: number = 0;

  // In-Game Mini-Mission State (Requirement 5)
  private currentInGameMission: InGameMission | null = null;
  private runMultiplierBonus: number = 0;
  private nextMiniMissionTimer: number = 0;
  private miniMissionIndex: number = 0;

  // Upgrades & Active Power-ups
  private upgrades: PowerUpUpgrades;
  private activePowerUpsMap: Map<PowerUpType, number> = new Map();

  private screenShakeTime: number = 0;
  private screenShakeIntensity: number = 0.5;
  private slowMoTimer: number = 0;

  // Environment Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Ghost Multiplayer System
  private ghostFrames: {
    dist: number;
    x: number;
    y: number;
    rx: number;
    ry: number;
    rz: number;
    laX: number;
    raX: number;
    llX: number;
    rlX: number;
  }[] = [];
  private currentRunFrames: {
    dist: number;
    x: number;
    y: number;
    rx: number;
    ry: number;
    rz: number;
    laX: number;
    raX: number;
    llX: number;
    rlX: number;
  }[] = [];
  private ghostRecordTimer: number = 0;
  private ghostPlaybackTimer: number = 0;
  private ghostRig: CharacterRig | null = null;
  private ghostDistanceDiff: number | null = null;
  private hasOvertakenGhost: boolean = false;

  // Online Real-Time Multiplayer System
  private opponentRig: CharacterRig | null = null;
  private opponentData: {
    x: number;
    y: number;
    dist: number;
    anim: string;
    score: number;
    name: string;
    crashed: boolean;
    rotZ?: number;
  } | null = null;
  public onMultiplayerUpdate?: (data: {
    x: number;
    y: number;
    dist: number;
    anim: string;
    score: number;
    rotZ: number;
  }) => void;
  public onMultiplayerCrash?: (dist: number, score: number) => void;
  private mpSyncTimer: number = 0;
  private seededRng: (() => number) | null = null;

  private callbacks: GameEngineCallbacks;

  constructor(
    container: HTMLDivElement,
    selectedChar: Character,
    callbacks: GameEngineCallbacks,
    upgrades: PowerUpUpgrades = DEFAULT_UPGRADES
  ) {
    this.container = container;
    this.selectedCharacter = selectedChar;
    this.callbacks = callbacks;
    this.upgrades = upgrades;

    // Detect Low-End Device (Software WebGL or <= 4 CPU cores / <= 2GB RAM) for Rain Optimization
    this.isLowEndDevice = (() => {
      try {
        const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
        const mem = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || 4 : 4;
        if (cores <= 2 || mem <= 2) return true;
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 3. DISABLE HEAVY RENDERING: antialias: false, setPixelRatio(1), shadowMap.enabled = false
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = false;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 4. Camera & Fog tuned to show full length of massive 36m trains ahead
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.5, 130);
    this.camera.position.set(0, 4.65, 8.2);
    this.camera.lookAt(0, 1.75, -15);

    this.scene.background = new THREE.Color(0x1e293b);
    this.scene.fog = new THREE.Fog(0x1e293b, 42, 126);

    // Simple, lightweight lighting (no real-time shadow casting)
    this.hemiLight = new THREE.HemisphereLight(0xfed7aa, 0x14532d, 1.5);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffedd5, 1.9);
    this.dirLight.position.set(12, 24, 14);
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // 1. STRICT OBJECT POOLING (Fixed pool created once at startup)
    this.poolManager = new PoolManager(this.scene);

    this.loadCharacter(selectedChar);
    this.initPoliceChaseActors();
    this.initGhostRunner();
    this.initTrackChunks();

    this.clock = new THREE.Clock();
    window.addEventListener('resize', this.handleResize);

    this.renderer.render(this.scene, this.camera);
    this.startMenuPreview();
  }

  public triggerScreenShake(duration: number = 0.35, intensity: number = 0.5) {
    this.screenShakeTime = Math.max(this.screenShakeTime, duration);
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
  }

  public loadCharacter(char: Character) {
    this.selectedCharacter = char;
    this.rebuildCharacterRig();
  }

  public setSkin(skin: PlayerSkin | null) {
    this.activeSkin = skin && skin.id !== 'skin_default' ? skin : null;
    this.rebuildCharacterRig();
  }

  public setHas24hMultiplier(active: boolean) {
    this.has24hMultiplier = active;
  }

  private rebuildCharacterRig() {
    if (this.characterRig) {
      this.scene.remove(this.characterRig.group);
      this.characterRig.group.traverse((node: any) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((m: any) => m.dispose());
          } else {
            node.material.dispose();
          }
        }
      });
      this.characterRig = null;
    }

    const skinOverride = this.activeSkin
      ? {
          bodyHex: this.activeSkin.bodyHex,
          accentHex: this.activeSkin.accentHex,
          pantsHex: this.activeSkin.pantsHex,
        }
      : null;

    this.characterRig = createProceduralCharacter(this.selectedCharacter.id, skinOverride);
    this.scene.add(this.characterRig.group);
    this.initGhostRunner();
  }

  private initPoliceChaseActors() {
    if (!this.inspectorRig) {
      this.inspectorRig = createInspectorCharacter();
      this.inspectorRig.group.visible = false;
      this.scene.add(this.inspectorRig.group);
    }
    if (!this.dogRig) {
      this.dogRig = createPoliceDog();
      this.dogRig.group.visible = false;
      this.scene.add(this.dogRig.group);
    }
  }

  private hidePoliceChaseActors() {
    this.isChaseSequence = false;
    this.chaseTimer = 0;
    this.hasTriggeredGotcha = false;
    this.hasTriggeredFadeOut = false;
    if (this.inspectorRig) {
      this.inspectorRig.group.visible = false;
      this.inspectorRig.gotchaSprite.visible = false;
      this.inspectorRig.gotchaSprite.scale.set(0.01, 0.01, 1);
    }
    if (this.dogRig) {
      this.dogRig.group.visible = false;
    }
  }

  private initGhostRunner() {
    try {
      const raw = localStorage.getItem('subway_dash_ghost_best_run');
      if (raw) {
        this.ghostFrames = JSON.parse(raw);
      }
    } catch {
      this.ghostFrames = [];
    }

    if (this.ghostRig) {
      this.scene.remove(this.ghostRig.group);
      this.ghostRig.group.traverse((c: any) => {
        if (c.geometry) c.geometry.dispose();
      });
      this.ghostRig = null;
    }

    if (this.ghostFrames.length > 0) {
      this.ghostRig = createProceduralCharacter(this.selectedCharacter.id);
      const ghostMat = new THREE.MeshLambertMaterial({
        color: 0x00d2ff,
        emissive: 0x0077b6,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      });

      this.ghostRig.group.traverse((child: any) => {
        if (child.isMesh) {
          child.material = ghostMat;
        }
      });

      this.ghostRig.group.visible = false;
      this.scene.add(this.ghostRig.group);
    }
  }

  public setSeed(seed: number | null) {
    if (seed === null || seed === undefined) {
      this.seededRng = null;
      return;
    }
    let s = seed >>> 0;
    this.seededRng = () => {
      let t = (s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private rng(): number {
    return this.seededRng ? this.seededRng() : Math.random();
  }

  public spawnOpponent(characterId: string, opponentName: string) {
    if (this.opponentRig) {
      this.scene.remove(this.opponentRig.group);
      this.opponentRig.group.traverse((c: any) => {
        if (c.geometry) c.geometry.dispose();
      });
      this.opponentRig = null;
    }

    this.opponentRig = createProceduralCharacter(characterId || 'maya');
    this.opponentData = {
      x: 0,
      y: 0,
      dist: 0,
      anim: 'RUN',
      score: 0,
      name: opponentName,
      crashed: false,
    };

    const rivalMat = new THREE.MeshLambertMaterial({
      color: 0xf43f5e,
      emissive: 0x9f1239,
    });

    this.opponentRig.group.traverse((child: any) => {
      if (child.isMesh) {
        child.material = rivalMat;
      }
    });

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.roundRect(8, 8, 240, 48, 12);
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ${opponentName.toUpperCase()}`, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1);
    sprite.position.set(0, 2.5, 0);
    this.opponentRig.group.add(sprite);

    this.opponentRig.group.visible = true;
    this.scene.add(this.opponentRig.group);
  }

  public updateOpponent(data: { x: number; y: number; dist: number; anim: string; score: number; rotZ?: number }) {
    if (!this.opponentData) return;
    this.opponentData.x = data.x;
    this.opponentData.y = data.y;
    this.opponentData.dist = data.dist;
    this.opponentData.anim = data.anim;
    this.opponentData.score = data.score;
    if (data.rotZ !== undefined) {
      this.opponentData.rotZ = data.rotZ;
    }
  }

  public setOpponentCrashed(dist: number, score: number) {
    if (this.opponentData) {
      this.opponentData.crashed = true;
      this.opponentData.dist = dist;
      this.opponentData.score = score;
    }
    if (this.opponentRig) {
      this.opponentRig.group.rotation.x = -0.7;
    }
  }

  public removeOpponent() {
    if (this.opponentRig) {
      this.scene.remove(this.opponentRig.group);
      this.opponentRig.group.traverse((c: any) => {
        if (c.geometry) c.geometry.dispose();
      });
      this.opponentRig = null;
    }
    this.opponentData = null;
  }

  private initTrackChunks() {
    for (let i = 0; i < 5; i++) {
      const chunk = this.poolManager.getTrackChunk();
      if (chunk) {
        chunk.position.set(0, 0, -i * 60 + 30);
        this.activeChunks.push(chunk);
      }
    }
  }

  private isMenuMode: boolean = false;
  private menuFrameId: number = 0;

  public startMenuPreview() {
    if (this.isRunning) return;
    this.hidePoliceChaseActors();
    this.isMenuMode = true;
    this.clock.start();
    this.tickMenu();
  }

  public stopMenuPreview() {
    this.isMenuMode = false;
    cancelAnimationFrame(this.menuFrameId);
  }

  private tickMenu = () => {
    if (!this.isMenuMode || this.isRunning) return;

    this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    this.camera.position.x = Math.sin(t * 0.35) * 1.5;
    this.camera.position.y = 2.6 + Math.cos(t * 0.28) * 0.25;
    this.camera.position.z = 5.8;
    this.camera.lookAt(0, 1.3, -8);

    if (this.characterRig) {
      this.characterRig.group.position.set(0, 0, 0);
      this.characterRig.group.rotation.set(0, Math.PI, 0);
      this.characterRig.torso.position.y = 1.05 + Math.sin(t * 2.2) * 0.03;
      this.characterRig.torso.rotation.x = 0.05;
      this.characterRig.leftArm.rotation.x = Math.sin(t * 1.5) * 0.08;
      this.characterRig.rightArm.rotation.x = -Math.sin(t * 1.5) * 0.08;
      if (this.characterRig.leftForearm) this.characterRig.leftForearm.rotation.x = -0.25;
      if (this.characterRig.rightForearm) this.characterRig.rightForearm.rotation.x = -0.25;
      this.characterRig.leftLeg.position.y = 0.70;
      this.characterRig.rightLeg.position.y = 0.70;
      this.characterRig.leftLeg.rotation.x = 0;
      this.characterRig.rightLeg.rotation.x = 0;
      if (this.characterRig.leftKnee) this.characterRig.leftKnee.rotation.x = 0;
      if (this.characterRig.rightKnee) this.characterRig.rightKnee.rotation.x = 0;
    }

    this.renderScene();
    this.menuFrameId = requestAnimationFrame(this.tickMenu);
  };

  public start() {
    this.stopMenuPreview();
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.camera.position.set(0, 4.65, 8.2);
    this.camera.lookAt(0, 1.75, -15);
    this.tick();
  }

  public pause() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.startMenuPreview();
  }

  public resume() {
    this.stopMenuPreview();
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.tick();
  }

  private assignNewInGameMission() {
    const template = MINI_MISSION_TEMPLATES[this.miniMissionIndex % MINI_MISSION_TEMPLATES.length];
    this.miniMissionIndex++;
    this.currentInGameMission = {
      id: `igm_${Date.now()}_${this.miniMissionIndex}`,
      title: template.title,
      type: template.type,
      target: template.target,
      current: 0,
      completed: false,
      rewardPoints: 500,
    };
  }

  private advanceInGameMission(type: InGameMission['type'], amount: number) {
    if (!this.currentInGameMission || this.currentInGameMission.completed) return;
    if (this.currentInGameMission.type !== type) return;

    this.currentInGameMission.current = Math.min(
      this.currentInGameMission.target,
      this.currentInGameMission.current + amount
    );

    if (this.currentInGameMission.current >= this.currentInGameMission.target) {
      this.currentInGameMission.completed = true;
      this.score += this.currentInGameMission.rewardPoints;
      this.runMultiplierBonus += 1;
      soundSynth.playJackpot();
      haptics.powerup();
      this.callbacks.onInGameMissionComplete?.(
        this.currentInGameMission.title,
        this.runMultiplierBonus
      );
      this.nextMiniMissionTimer = 2.4;
    }
  }

  public resetGame() {
    this.stopMenuPreview();
    this.pause();
    this.hidePoliceChaseActors();
    this.callbacks.onScreenFade?.(false);
    this.currentLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.verticalVelocity = 0;
    this.isOnTrainRoof = false;
    this.smoothedRoofFactor = 0;
    this.smoothedLookAtY = 1.45;
    this.smoothedLookAtZ = -10;
    this.currentTrainUnderPlayer = null;
    this.roofLandingRollTimer = 0;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.jumpBufferTimer = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isStumbling = false;

    this.currentSpeed = BASE_RUN_SPEED;
    this.runAnimPhase = 0;
    this.distanceTraveled = 0;
    this.score = 0;
    this.coinsCollected = 0;
    this.comboCount = 0;
    this.maxComboCount = 0;
    this.comboTimer = 0;
    this.powerUpsCollectedCount = 0;
    this.activePowerUpsMap.clear();

    // Assign initial in-game mini-mission
    this.runMultiplierBonus = 0;
    this.nextMiniMissionTimer = 0;
    this.assignNewInGameMission();

    // Reset Ghost Runner
    this.currentRunFrames = [];
    this.ghostRecordTimer = 0;
    this.ghostPlaybackTimer = 0;
    this.ghostDistanceDiff = null;
    this.hasOvertakenGhost = false;
    if (this.ghostRig) {
      this.ghostRig.group.visible = false;
      this.ghostRig.group.position.set(0, 0, 0);
    }
    try {
      const raw = localStorage.getItem('subway_dash_ghost_best_run');
      if (raw) {
        this.ghostFrames = JSON.parse(raw);
        if (!this.ghostRig && this.ghostFrames.length > 0) {
          this.initGhostRunner();
        }
      }
    } catch {
      // fallback
    }

    this.currentWeather = 'CLEAR';

    this.poolManager.resetAll();
    this.activeObstacles = [];
    this.activeWarnings = [];
    this.activeCoins = [];
    this.activePowerUps = [];
    this.activeBoostPads = [];
    this.furthestSpawnZ = -60;
    this.hasDoubleJumped = false;
    this.nearMissesCount = 0;
    this.boostPadTimer = 0;
    this.coinsSinceLastSurge = 0;
    this.currentTheme = 'JUNGLE_RUINS';
    this.scene.background = new THREE.Color(0x1e293b);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x1e293b);
    }
    this.camera.position.set(0, 4.65, 8.2);
    this.camera.lookAt(0, 1.75, -15);
    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();

    if (this.selectedCharacter.statAutoShield) {
      this.activePowerUpsMap.set('SHIELD', 999);
    }

    if (this.characterRig) {
      this.characterRig.group.position.set(0, 0, 0);
      this.characterRig.group.rotation.set(0, Math.PI, 0);
      this.characterRig.torso.position.y = 1.05;
      this.characterRig.torso.rotation.set(0, 0, 0);
    }

    this.callbacks.onStatsUpdate(this.getStats());
    this.callbacks.onPowerUpsUpdate([]);
    this.renderer.render(this.scene, this.camera);
  }

  public setUpgrades(upgrades: PowerUpUpgrades) {
    this.upgrades = upgrades;
  }

  public triggerSkateboard() {
    if (!this.isRunning || this.isStumbling) return;
    const dur = 15.0 + (this.upgrades.skateboardLevel - 1) * 5.0;
    this.activePowerUpsMap.set('SKATEBOARD', dur);
    soundSynth.playSkateboardSound();
    haptics.boost();
  }

  public revive() {
    this.hidePoliceChaseActors();
    this.callbacks.onScreenFade?.(false);
    this.isStumbling = false;
    this.currentLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.verticalVelocity = 0;
    this.isOnTrainRoof = false;
    this.smoothedRoofFactor = 0;
    this.smoothedLookAtY = 1.45;
    this.smoothedLookAtZ = -10;
    this.currentTrainUnderPlayer = null;
    this.roofLandingRollTimer = 0;
    this.isJumping = false;
    this.jumpBufferTimer = 0;
    this.isSliding = false;
    this.slowMoTimer = 0;
    this.screenShakeTime = 0;
    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();

    if (this.characterRig) {
      this.characterRig.group.rotation.set(0, Math.PI, 0);
      this.characterRig.group.position.set(0, 0, 0);
      this.characterRig.torso.position.y = 1.05;
      this.characterRig.torso.rotation.set(0, 0, 0);
    }

    this.activePowerUpsMap.set('SHIELD', 3.5);

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      if (obs.group.position.z > -25 && obs.group.position.z < 10) {
        this.poolManager.releaseObstacle(obs);
        this.activeObstacles.splice(i, 1);
      }
    }

    soundSynth.playReviveFanfare();
    haptics.revive();
    this.callbacks.onComboMessage('⭐ REVIVED! 3.5s SHIELD ACTIVE ⭐');

    this.clock.start();
    this.isRunning = true;
    this.animationFrameId = requestAnimationFrame(this.tick);
    soundSynth.startMusic();
  }

  public moveLeft() {
    if (!this.isRunning || this.isStumbling) return;
    if (this.currentLane > -1) {
      this.currentLane = (this.currentLane - 1) as Lane;
      soundSynth.playLaneChange();
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isStumbling) return;
    if (this.currentLane < 1) {
      this.currentLane = (this.currentLane + 1) as Lane;
      soundSynth.playLaneChange();
    }
  }

  private getSupportingFloorY(): number {
    if (this.isOnTrainRoof) return TRAIN_ROOF_HEIGHT;
    if (this.playerY >= TRAIN_ROOF_HEIGHT - 0.60) {
      const targetX = this.currentLane * LANE_WIDTH;
      for (let i = 0; i < this.activeObstacles.length; i++) {
        const obs = this.activeObstacles[i];
        if (obs.type !== 'TRAIN') continue;
        if (Math.abs(obs.group.position.z) > 25) continue;
        if (
          Math.abs(obs.lane - this.playerX) <= 1.48 &&
          Math.abs(obs.lane - targetX) <= 1.48
        ) {
          const trainFrontZ = obs.group.position.z + 18.2;
          const trainBackZ = obs.group.position.z - 18.0;
          if (trainBackZ <= 1.15 && trainFrontZ >= -1.35) {
            return TRAIN_ROOF_HEIGHT;
          }
        }
      }
    }
    return 0;
  }

  public jump() {
    if (!this.isRunning || this.isStumbling) return;

    const activeFloorY = this.getSupportingFloorY();
    const canInstantGroundJump =
      !this.isJumping ||
      this.isSliding ||
      this.isOnTrainRoof ||
      this.playerY <= activeFloorY + 0.45;

    if (canInstantGroundJump) {
      const isJumpFromRoof = activeFloorY >= TRAIN_ROOF_HEIGHT - 0.1;
      this.isJumping = true;
      this.isOnTrainRoof = false;
      this.jumpTimer = 0;
      this.jumpBufferTimer = 0;
      this.hasDoubleJumped = false;
      this.isSliding = false;
      this.slideTimer = 0;
      this.roofLandingRollTimer = 0;

      // Mathematically calibrated velocity for taller train roof (TRAIN_ROOF_HEIGHT = 2.35m):
      // With baseGravity = 52 (48 for LOW_GRAVITY) and v0 = 17.8 (18.4 for LOW_GRAVITY),
      // ground jump peak is Y = v0^2 / (2 * g) = 3.05m (3.52m for LOW_GRAVITY),
      // comfortably landing on the 2.35m train roof without flying into the sky.
      if (isJumpFromRoof) {
        this.verticalVelocity =
          this.selectedCharacter.superpowerType === 'LOW_GRAVITY' ? 13.8 : 12.8;
      } else {
        this.verticalVelocity =
          this.selectedCharacter.superpowerType === 'LOW_GRAVITY' ? 18.4 : 17.8;
      }

      // Leave the ground immediately on the exact frame jump is pressed
      this.playerY = Math.max(this.playerY, activeFloorY) + 0.06;
      if (this.characterRig) {
        this.characterRig.group.position.y = this.playerY;
      }
      soundSynth.playJump();
      haptics.jump();
      this.advanceInGameMission('JUMPS', 1);
    } else if (
      this.isJumping &&
      !this.hasDoubleJumped &&
      this.selectedCharacter.superpowerType === 'DOUBLE_JUMP'
    ) {
      this.hasDoubleJumped = true;
      this.isSliding = false;
      this.slideTimer = 0;
      this.jumpTimer = 0;
      this.jumpBufferTimer = 0;
      this.verticalVelocity = 12.6;
      soundSynth.playDoubleJump();
      this.advanceInGameMission('JUMPS', 1);
    } else {
      // Buffer jump input if pressed slightly before landing so it fires immediately on touchdown
      this.jumpBufferTimer = 0.14;
    }
  }

  public slide() {
    if (!this.isRunning || this.isStumbling) return;
    const activeFloorY = this.getSupportingFloorY();
    // Instantly drop to the ground or supporting train roof and slide immediately without slowing forward speed
    this.playerY = activeFloorY;
    this.isOnTrainRoof = activeFloorY >= TRAIN_ROOF_HEIGHT - 0.1;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.jumpBufferTimer = 0;
    this.hasDoubleJumped = false;
    this.isSliding = true;
    this.slideTimer = 0;
    this.roofLandingRollTimer = 0;
    if (this.characterRig) {
      this.characterRig.group.position.y = this.playerY;
      this.characterRig.torso.position.y = 0.52;
      this.characterRig.torso.rotation.x = -0.55;
    }
    soundSynth.playSlide();
    haptics.slide();
  }

  private tick = () => {
    if (!this.isRunning) return;

    const dt = this.clock.getDelta();
    let delta = dt > 0.05 ? 0.05 : dt < 0.001 ? 0.001 : dt;

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= delta;
      delta *= 0.25;
    }

    this.updateGameLogic(delta);
    this.renderScene();

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private getPowerUpDuration(type: PowerUpType): number {
    // Requirement 1 (Shop): Level 1 Magnet lasts 10s, Level 2 lasts 15s (+5s per level)
    let baseDur = 10;
    if (type === 'MAGNET') {
      baseDur = 10 + (this.upgrades.magnetLevel - 1) * 5.0;
    } else if (type === 'JETPACK') {
      baseDur = 10 + (this.upgrades.jetpackLevel - 1) * 5.0;
    } else if (type === 'SHIELD') {
      baseDur = 10 + (this.upgrades.shieldLevel - 1) * 5.0;
    } else if (type === 'MULTIPLIER') {
      baseDur = 10 + (this.upgrades.multiplierLevel - 1) * 5.0;
    } else if (type === 'SKATEBOARD') {
      baseDur = 15 + (this.upgrades.skateboardLevel - 1) * 5.0;
    }
    return baseDur + this.selectedCharacter.statPowerupBonus * 5;
  }

  private updateGameLogic(delta: number) {
    if (this.isChaseSequence) {
      this.updatePoliceChaseSequence(delta);
      return;
    }

    // Rotate to next mini-mission after completion celebration
    if (this.nextMiniMissionTimer > 0) {
      this.nextMiniMissionTimer -= delta;
      if (this.nextMiniMissionTimer <= 0) {
        this.assignNewInGameMission();
      }
    }

    const isJetpackActive = this.activePowerUpsMap.has('JETPACK');
    const isMagnetActive = this.activePowerUpsMap.has('MAGNET');
    const isShieldActive = this.activePowerUpsMap.has('SHIELD');
    const isMultiplierActive = this.activePowerUpsMap.has('MULTIPLIER');
    const isSkateboardActive = this.activePowerUpsMap.has('SKATEBOARD');

    // 1. Update Power-up Timers
    const updatedPowerUps: ActivePowerUp[] = [];
    this.activePowerUpsMap.forEach((timeLeft, type) => {
      if (type === 'SHIELD' && this.selectedCharacter.statAutoShield && timeLeft > 100) {
        updatedPowerUps.push({ type, duration: 10, timeLeft: 10 });
        return;
      }

      const newTime = timeLeft - delta;
      if (newTime <= 0) {
        this.activePowerUpsMap.delete(type);
      } else {
        this.activePowerUpsMap.set(type, newTime);
        const totalDur = this.getPowerUpDuration(type);
        updatedPowerUps.push({ type, duration: totalDur, timeLeft: newTime });
      }
    });
    this.callbacks.onPowerUpsUpdate(updatedPowerUps);

    // 2. Dynamic Theme Updates
    this.updateThemeSystem();

    // 3. Smooth & Fair Global Speed Progression
    const distMilestones = this.distanceTraveled / 650;
    const scoreMilestones = this.score / 2800;
    const progression = Math.max(distMilestones, scoreMilestones);
    const targetBaseSpeed = Math.min(BASE_RUN_SPEED + progression * 1.35, MAX_RUN_SPEED);

    this.currentSpeed = THREE.MathUtils.lerp(
      this.currentSpeed,
      targetBaseSpeed,
      Math.min(1, delta * 1.2)
    );
    this.currentSpeed = Math.min(this.currentSpeed, MAX_RUN_SPEED);

    const boostBonus = this.boostPadTimer > 0 ? 8 : 0;
    const speedBonus = (isJetpackActive ? 7 : 0) + (isSkateboardActive ? 2.5 : 0) + boostBonus;
    const actualSpeed = Math.min(this.currentSpeed + speedBonus, MAX_RUN_SPEED + 8);
    const effectiveSpeed = actualSpeed;
    const moveDist = effectiveSpeed * delta;
    const speedRatio = this.currentSpeed / BASE_RUN_SPEED;

    if (this.boostPadTimer > 0) {
      this.boostPadTimer -= delta;
    }

    // 4. Camera FOV Speed Feedback
    const speedProgress = (this.currentSpeed - BASE_RUN_SPEED) / (MAX_RUN_SPEED - BASE_RUN_SPEED);
    let targetFov = 62 + speedProgress * 16;
    if (isJetpackActive) targetFov += 6;
    if (this.boostPadTimer > 0) targetFov += 5;
    targetFov = THREE.MathUtils.clamp(targetFov, 62, 84);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, 5 * delta));
    this.camera.updateProjectionMatrix();

    soundSynth.setMusicSpeed(actualSpeed);
    soundSynth.setRocketMuffle(isJetpackActive);
    soundSynth.setWindRush(isJetpackActive || this.boostPadTimer > 0 || actualSpeed > 28);

    const totalScoreMult =
      (isMultiplierActive ? 2 : 1) *
      (this.has24hMultiplier ? 2 : 1) *
      (1 + this.runMultiplierBonus);

    this.distanceTraveled += moveDist;
    this.score += Math.floor(moveDist * totalScoreMult);

    this.callbacks.onMissionProgress('RUN_DISTANCE', moveDist);
    this.callbacks.onMissionProgress('REACH_SCORE', this.score);

    // Footsteps
    if (!this.isJumping && !this.isSliding && !isJetpackActive) {
      this.footstepTimer += delta * actualSpeed;
      if (this.footstepTimer > 4.2) {
        soundSynth.playFootstep();
        this.footstepTimer = 0;
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // 5. Player Lateral & Vertical Movement
    const baseLateralSpeed = this.selectedCharacter.superpowerType === 'HYPER_MAGNET' ? 22 : 15;
    const lerpSpeed = baseLateralSpeed * (0.85 + speedRatio * 0.25);
    const targetX = this.currentLane * LANE_WIDTH;
    this.playerX = THREE.MathUtils.lerp(this.playerX, targetX, Math.min(1, lerpSpeed * delta));

    this.dirLight.position.x = this.playerX * 0.4 + 12;
    this.dirLight.target.position.set(this.playerX * 0.4, 0, -4);

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // --- SNAPPY JUMP & DIRECT TRAIN ROOF PARKOUR PHYSICS (Delta-Time Driven) ---
    let groundY = 0;
    let supportingTrain: PoolableObstacle | null = null;
    const isElevatedForRoof =
      this.isOnTrainRoof || this.playerY >= TRAIN_ROOF_HEIGHT - 0.55;
    const lateralRoofAllowance = 1.48;

    if (isElevatedForRoof) {
      for (let i = 0; i < this.activeObstacles.length; i++) {
        const obs = this.activeObstacles[i];
        if (obs.type !== 'TRAIN') continue;
        // Check trains whose 36m body can overlap the player at Z = 0
        if (Math.abs(obs.group.position.z) > 25) continue;

        const distToPlayerX = Math.abs(obs.lane - this.playerX);
        const distToTargetX = Math.abs(obs.lane - targetX);
        const inRoofLaneRange =
          distToPlayerX <= lateralRoofAllowance && distToTargetX <= lateralRoofAllowance;
        if (!inRoofLaneRange) continue;

        const trainFrontZ = obs.group.position.z + 18.2;
        const trainBackZ = obs.group.position.z - 18.0;
        const backEdgeMargin = this.isJumping ? 1.25 : 0.45;
        const frontEdgeMargin = this.isJumping ? -1.45 : -0.85;

        if (trainBackZ <= backEdgeMargin && trainFrontZ >= frontEdgeMargin) {
          groundY = TRAIN_ROOF_HEIGHT;
          if (
            !supportingTrain ||
            Math.abs(obs.lane - targetX) < Math.abs(supportingTrain.lane - targetX)
          ) {
            supportingTrain = obs;
          }
        }
      }
    }

    // High gravity for fast, snappy ascent and descent (reaches Y = 2.65m and lands quickly)
    const baseGravity = this.selectedCharacter.superpowerType === 'LOW_GRAVITY' ? 48.0 : 52.0;
    const gravity = this.verticalVelocity < 0 ? baseGravity * 1.25 : baseGravity;
    const wasOnTrainRoof = this.isOnTrainRoof;

    if (isJetpackActive) {
      this.playerY += (6.8 - this.playerY) * 8 * delta;
      this.verticalVelocity = 0;
      this.isOnTrainRoof = false;
      this.currentTrainUnderPlayer = null;
    } else if (this.isJumping || this.playerY > groundY + 0.01) {
      this.jumpTimer += delta;
      this.playerY += this.verticalVelocity * delta;
      this.verticalVelocity -= gravity * delta;

      if (this.verticalVelocity <= 0 && this.playerY <= groundY) {
        this.playerY = groundY;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.jumpTimer = 0;
        this.hasDoubleJumped = false;

        if (groundY >= TRAIN_ROOF_HEIGHT - 0.15 && supportingTrain) {
          this.isOnTrainRoof = true;
          this.currentTrainUnderPlayer = supportingTrain;
          if (!wasOnTrainRoof && !this.isSliding) {
            this.roofLandingRollTimer = 0.20;
            soundSynth.playFootstep();
          }
        } else {
          this.isOnTrainRoof = false;
          this.currentTrainUnderPlayer = null;
        }

        if (this.jumpBufferTimer > 0) {
          this.jumpBufferTimer = 0;
          this.jump();
        }
      } else {
        if (this.playerY > TRAIN_ROOF_HEIGHT + 0.35 || !supportingTrain) {
          this.isOnTrainRoof = false;
        }
        if (supportingTrain) {
          this.currentTrainUnderPlayer = supportingTrain;
        } else if (this.playerY < TRAIN_ROOF_HEIGHT - 0.55) {
          this.currentTrainUnderPlayer = null;
        }
      }
    } else {
      // Snapped cleanly to ground or train roof
      this.playerY = groundY;
      this.verticalVelocity = 0;
      if (groundY >= TRAIN_ROOF_HEIGHT - 0.15 && supportingTrain) {
        this.isOnTrainRoof = true;
        this.currentTrainUnderPlayer = supportingTrain;
      } else {
        this.isOnTrainRoof = false;
        this.currentTrainUnderPlayer = null;
      }

      if (this.jumpBufferTimer > 0) {
        this.jumpBufferTimer = 0;
        this.jump();
      }
    }

    if (this.roofLandingRollTimer > 0) {
      this.roofLandingRollTimer = Math.max(0, this.roofLandingRollTimer - delta);
    }

    if (this.isSliding) {
      this.slideTimer += delta;
      if (this.slideTimer >= SLIDE_DURATION) {
        this.isSliding = false;
        this.slideTimer = 0;
      }
    }

    // Character Animations
    this.runAnimPhase += delta * (7.5 + actualSpeed * 0.28);
    if (this.characterRig) {
      this.characterRig.group.position.set(this.playerX, this.playerY, 0);
      this.characterRig.group.rotation.y = Math.PI;
      const laneLean = (targetX - this.playerX) * 0.08;
      if (!this.isStumbling) {
        this.characterRig.group.rotation.x = 0;
        this.characterRig.group.rotation.z = laneLean;
      }

      const elapsed = this.runAnimPhase;
      const swing = Math.sin(elapsed) * Math.min(0.68, 0.48 + speedProgress * 0.18);

      if (this.isSliding) {
        // Instant, compact slide pose
        this.characterRig.head.rotation.x = -0.15;
        this.characterRig.torso.position.y = 0.52;
        this.characterRig.torso.rotation.x = -0.55;
        this.characterRig.leftArm.rotation.x = 0.55;
        this.characterRig.rightArm.rotation.x = 0.55;
        if (this.characterRig.leftForearm) this.characterRig.leftForearm.rotation.x = -0.45;
        if (this.characterRig.rightForearm) this.characterRig.rightForearm.rotation.x = -0.45;
        this.characterRig.leftLeg.position.y = 0.30;
        this.characterRig.rightLeg.position.y = 0.30;
        this.characterRig.leftLeg.rotation.x = -1.15;
        this.characterRig.rightLeg.rotation.x = -0.85;
        if (this.characterRig.leftKnee) this.characterRig.leftKnee.rotation.x = 0.20;
        if (this.characterRig.rightKnee) this.characterRig.rightKnee.rotation.x = 0.55;
      } else if (this.isJumping || isJetpackActive) {
        this.characterRig.head.rotation.x = 0;
        this.characterRig.torso.position.y = 1.08;
        this.characterRig.torso.rotation.x = isJetpackActive ? 0.42 : 0.18;
        this.characterRig.leftArm.rotation.x = -0.65;
        this.characterRig.rightArm.rotation.x = -0.65;
        if (this.characterRig.leftForearm) this.characterRig.leftForearm.rotation.x = -0.55;
        if (this.characterRig.rightForearm) this.characterRig.rightForearm.rotation.x = -0.55;
        this.characterRig.leftLeg.position.y = 0.70;
        this.characterRig.rightLeg.position.y = 0.70;
        this.characterRig.leftLeg.rotation.x = -0.35;
        this.characterRig.rightLeg.rotation.x = 0.20;
        if (this.characterRig.leftKnee) this.characterRig.leftKnee.rotation.x = 0.75;
        if (this.characterRig.rightKnee) this.characterRig.rightKnee.rotation.x = 0.55;
      } else if (this.roofLandingRollTimer > 0) {
        this.characterRig.head.rotation.x = 0;
        const rollProgress = 1 - this.roofLandingRollTimer / 0.20;
        this.characterRig.torso.position.y = 0.72;
        this.characterRig.torso.rotation.x = rollProgress * Math.PI * 2;
        this.characterRig.leftArm.rotation.x = -0.9;
        this.characterRig.rightArm.rotation.x = -0.9;
        if (this.characterRig.leftForearm) this.characterRig.leftForearm.rotation.x = -0.8;
        if (this.characterRig.rightForearm) this.characterRig.rightForearm.rotation.x = -0.8;
        this.characterRig.leftLeg.position.y = 0.48;
        this.characterRig.rightLeg.position.y = 0.48;
        this.characterRig.leftLeg.rotation.x = -0.85;
        this.characterRig.rightLeg.rotation.x = -0.85;
        if (this.characterRig.leftKnee) this.characterRig.leftKnee.rotation.x = 1.1;
        if (this.characterRig.rightKnee) this.characterRig.rightKnee.rotation.x = 1.1;
      } else {
        this.characterRig.head.rotation.x = 0;
        this.characterRig.torso.position.y = 1.05 + Math.abs(Math.sin(elapsed)) * 0.04;
        this.characterRig.torso.rotation.x = 0.14;
        this.characterRig.leftArm.rotation.x = swing;
        this.characterRig.rightArm.rotation.x = -swing;
        this.characterRig.leftLeg.position.y = 0.70;
        this.characterRig.rightLeg.position.y = 0.70;
        this.characterRig.leftLeg.rotation.x = -swing;
        this.characterRig.rightLeg.rotation.x = swing;

        if (this.characterRig.leftForearm) this.characterRig.leftForearm.rotation.x = -0.45 - Math.abs(swing) * 0.35;
        if (this.characterRig.rightForearm) this.characterRig.rightForearm.rotation.x = -0.45 - Math.abs(swing) * 0.35;
        if (this.characterRig.leftKnee) this.characterRig.leftKnee.rotation.x = Math.max(0, Math.sin(elapsed) * 0.65);
        if (this.characterRig.rightKnee) this.characterRig.rightKnee.rotation.x = Math.max(0, Math.sin(elapsed + Math.PI) * 0.65);
      }

      if (isMagnetActive) {
        this.characterRig.magnetAuraMesh.visible = true;
        this.characterRig.magnetAuraMesh.rotation.z += 2.5 * delta;
      } else {
        this.characterRig.magnetAuraMesh.visible = false;
      }

      this.characterRig.shieldMesh.visible = isShieldActive;
      this.characterRig.jetpackMesh.visible = isJetpackActive;

      if (isSkateboardActive) {
        this.characterRig.skateboardMesh.visible = true;
        for (const wheel of this.characterRig.wheels) {
          wheel.rotation.x += actualSpeed * 1.5 * delta;
        }
      } else {
        this.characterRig.skateboardMesh.visible = false;
      }
    }

    // Ghost Recording & Playback
    this.ghostRecordTimer += delta;
    if (this.ghostRecordTimer >= 0.033) {
      this.ghostRecordTimer = 0;
      this.currentRunFrames.push({
        dist: Math.round(this.distanceTraveled * 10) / 10,
        x: parseFloat(this.playerX.toFixed(2)),
        y: parseFloat(this.playerY.toFixed(2)),
        rx: parseFloat((this.characterRig?.group.rotation.x || 0).toFixed(2)),
        ry: parseFloat((this.characterRig?.group.rotation.y || 0).toFixed(2)),
        rz: parseFloat((this.characterRig?.group.rotation.z || 0).toFixed(2)),
        laX: parseFloat((this.characterRig?.leftArm.rotation.x || 0).toFixed(2)),
        raX: parseFloat((this.characterRig?.rightArm.rotation.x || 0).toFixed(2)),
        llX: parseFloat((this.characterRig?.leftLeg.rotation.x || 0).toFixed(2)),
        rlX: parseFloat((this.characterRig?.rightLeg.rotation.x || 0).toFixed(2)),
      });
    }

    if (this.ghostRig && this.ghostFrames.length > 0) {
      this.ghostPlaybackTimer += delta;
      const targetIndex = Math.min(
        this.ghostFrames.length - 1,
        Math.floor(this.ghostPlaybackTimer / 0.033)
      );
      const frame = this.ghostFrames[targetIndex];
      const distDiff = Math.round(this.distanceTraveled - frame.dist);
      this.ghostDistanceDiff = distDiff;
      const ghostZ = distDiff;

      if (this.ghostPlaybackTimer < this.ghostFrames.length * 0.033 + 3.0 && ghostZ >= -85 && ghostZ <= 20) {
        this.ghostRig.group.visible = true;
        this.ghostRig.group.position.set(frame.x, frame.y, ghostZ);
        this.ghostRig.group.rotation.set(frame.rx, Math.PI, frame.rz);
        this.ghostRig.leftArm.rotation.x = frame.laX;
        this.ghostRig.rightArm.rotation.x = frame.raX;
        this.ghostRig.leftLeg.rotation.x = frame.llX;
        this.ghostRig.rightLeg.rotation.x = frame.rlX;

        if (!this.hasOvertakenGhost && this.distanceTraveled > 60 && ghostZ > 0.5 && ghostZ < 5.0) {
          this.hasOvertakenGhost = true;
          soundSynth.playJackpot();
        }
      } else {
        this.ghostRig.group.visible = false;
      }
    } else {
      this.ghostDistanceDiff = null;
    }

    // Online Multiplayer Real-time Sync
    if (this.onMultiplayerUpdate) {
      this.mpSyncTimer += delta;
      if (this.mpSyncTimer >= 0.033) {
        this.mpSyncTimer = 0;
        this.onMultiplayerUpdate({
          x: parseFloat(this.playerX.toFixed(2)),
          y: parseFloat(this.playerY.toFixed(2)),
          dist: Math.round(this.distanceTraveled * 10) / 10,
          anim: this.isJumping ? 'JUMP' : this.isSliding ? 'SLIDE' : 'RUN',
          score: this.score,
          rotZ: parseFloat((this.camera?.rotation.z || 0).toFixed(3)),
        });
      }
    }

    if (this.opponentRig && this.opponentData) {
      const relZ = -(this.opponentData.dist - this.distanceTraveled);
      if (relZ >= -90 && relZ <= 25) {
        this.opponentRig.group.visible = true;
        this.opponentRig.group.rotation.y = Math.PI;
        this.opponentRig.group.position.x += (this.opponentData.x - this.opponentRig.group.position.x) * 16 * delta;
        this.opponentRig.group.position.y += (this.opponentData.y - this.opponentRig.group.position.y) * 16 * delta;
        this.opponentRig.group.position.z += (relZ - this.opponentRig.group.position.z) * 14 * delta;
      } else {
        this.opponentRig.group.visible = false;
      }
    }

    // 6. Track Chunks & Draw Distance Culling
    for (let i = 0; i < this.activeChunks.length; i++) {
      const chunk = this.activeChunks[i];
      chunk.position.z += moveDist;
      if (chunk.position.z > 60) {
        chunk.position.z -= 5 * 60;
      }
      // Hide chunks whose front edge is further than 125m away
      chunk.visible = chunk.position.z + 30 >= -125;
    }

    // Endless Spawning Generator (Spawns at Z = -104m for clear visibility of massive trains)
    this.furthestSpawnZ += moveDist;
    if (this.furthestSpawnZ > -104) {
      const spawnTargetZ = -104;
      const extraTrainSpan = this.spawnPatternAt(spawnTargetZ);
      const baseGap = 25 + this.rng() * 6;
      const earlyRunEase = this.distanceTraveled < 180 ? 1.16 : 1.0;
      const speedDensityScale = 1.0 - speedProgress * 0.12;
      const post500mDensityScale = this.distanceTraveled >= 500 ? 0.86 : 1.0;
      const scaledGap = baseGap * earlyRunEase * speedDensityScale * post500mDensityScale;
      this.furthestSpawnZ = spawnTargetZ - (scaledGap + extraTrainSpan);
    }

    // Move & Check Boost Pads (Only check collisions within 20m of player)
    for (let i = this.activeBoostPads.length - 1; i >= 0; i--) {
      const bPad = this.activeBoostPads[i];
      bPad.group.position.z += moveDist;
      const padZ = bPad.group.position.z;
      bPad.group.visible = padZ >= -125;

      if (Math.abs(padZ) <= 20) {
        if (
          !isJetpackActive &&
          Math.abs(bPad.lane - this.playerX) < 1.0 &&
          Math.abs(padZ) < 1.4 &&
          this.playerY < 1.0
        ) {
          this.boostPadTimer = 3.2;
          soundSynth.playBoostPad();
          this.poolManager.releaseBoostPad(bPad);
          this.activeBoostPads.splice(i, 1);
          continue;
        }
      }

      if (padZ > 15) {
        this.poolManager.releaseBoostPad(bPad);
        this.activeBoostPads.splice(i, 1);
      }
    }

    // Update Warning Lights
    for (let i = this.activeWarnings.length - 1; i >= 0; i--) {
      const w = this.activeWarnings[i];
      w.group.position.z += moveDist;
      w.timer -= delta;
      w.group.visible = w.group.position.z >= -125;

      if (w.timer <= 0 || w.group.position.z > 15) {
        this.poolManager.releaseWarningLight(w);
        this.activeWarnings.splice(i, 1);
      }
    }

    // 7. Move Obstacles & Trains (Balanced train approach speed so player has plenty of reaction time)
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      if (obs.parentTrain && obs.parentTrain.active) {
        obs.group.position.z = obs.parentTrain.group.position.z + obs.zOffsetOnTrain;
      } else {
        // Controlled oncoming train speed multiplier (1.22x down to 1.14x at high speed) for fair reaction time
        const speedMult = obs.isOncomingTrain ? (1.22 - speedProgress * 0.08) : 1.0;
        obs.group.position.z += effectiveSpeed * speedMult * delta;
      }

      const obsZ = obs.group.position.z;
      obs.group.visible = obsZ >= -125;

      if (obs.isOncomingTrain && Math.abs(obsZ) < 18) {
        this.screenShakeTime = 0.04;
      }

      // Release after full 36m train length (back edge at obsZ - 18.0) has passed the camera
      const despawnThreshold = obs.type === 'TRAIN' ? 28 : 15;
      if (obsZ > despawnThreshold) {
        obs.group.userData.nearMissChecked = false;
        this.poolManager.releaseObstacle(obs);
        this.activeObstacles.splice(i, 1);
      }
    }

    // Only calculate collisions for objects near the player
    if (!isJetpackActive && !this.isStumbling && this.activeObstacles.length > 0) {
      for (let c = 0; c < this.activeObstacles.length; c++) {
        const obs = this.activeObstacles[c];
        const obsZ = obs.group.position.z;
        const maxRange = obs.type === 'TRAIN' ? 25 : 20;
        if (obsZ < -maxRange || obsZ > maxRange) continue;

        const checkZ = obs.type === 'TRAIN' ? obsZ + 18.0 : obsZ;

        // Near-Miss Check
        if (!obs.group.userData.nearMissChecked && Math.abs(checkZ) < 1.6) {
          const laneDist = Math.abs(obs.lane - this.playerX);
          const relY = this.playerY - obs.group.position.y;
          let triggeredNearMiss = false;
          let nearMissLabel = '⚡ NEAR MISS! +150';

          if (laneDist >= 0.82 && laneDist <= 1.85) {
            triggeredNearMiss = true;
            nearMissLabel = obs.type === 'TRAIN' ? '🚆 TRAIN GRAZE! +200' : '⚡ NEAR MISS! +150';
            if (obs.type === 'TRAIN') {
              this.callbacks.onMissionProgress('DODGE_TRAIN', 1);
              this.advanceInGameMission('TRAINS', 1);
            }
          } else if (laneDist < 0.82) {
            if (obs.type === 'LOW' && this.isJumping && relY >= 0.72 && relY <= 1.45) {
              triggeredNearMiss = true;
              nearMissLabel = '⚡ TIGHT HURDLE! +150';
            } else if (obs.type === 'HIGH' && this.isSliding && relY >= -0.2 && relY <= 0.45) {
              triggeredNearMiss = true;
              nearMissLabel = '⚡ SLICK DUCK! +150';
            }
          }

          if (triggeredNearMiss) {
            obs.group.userData.nearMissChecked = true;
            this.nearMissesCount++;
            const bonusPts = obs.type === 'TRAIN' ? 200 : 150;
            this.score += bonusPts;
            this.comboCount += 1;
            this.comboTimer = 2.5;
            soundSynth.playNearMissWhoosh();
            haptics.nearMiss();
            this.callbacks.onNearMiss?.(nearMissLabel);
            this.callbacks.onMissionProgress('NEAR_MISS', 1);
          }
        }

        const isClearingTrainFront =
          this.isJumping && this.verticalVelocity > 0 && this.playerY >= 1.35;
        const isAtRoofHeight =
          this.isOnTrainRoof ||
          this.playerY >= TRAIN_ROOF_HEIGHT - 0.55 ||
          isClearingTrainFront;
        const lateralHitThreshold =
          obs.type === 'TRAIN' && isAtRoofHeight ? 1.44 : 0.94;
        const playerInLane =
          Math.abs(obs.lane - this.playerX) < lateralHitThreshold &&
          Math.abs(obs.lane - targetX) < lateralHitThreshold;

        if (playerInLane) {
          let hit = false;
          let isDirectTrainCrash = false;

          if (obs.type === 'TRAIN') {
            const trainFrontZ = obsZ + 18.2;
            const trainBackZ = obsZ - 18.0;

            if (trainFrontZ >= -0.75 && trainBackZ <= 1.0) {
              if (isAtRoofHeight) {
                // Land directly onto the 36m train roof from ground jump or adjacent train jump
                if (
                  this.playerY <= TRAIN_ROOF_HEIGHT + 0.25 &&
                  this.verticalVelocity <= 0 &&
                  trainFrontZ <= 18.2
                ) {
                  if (!this.isOnTrainRoof && !this.isSliding) {
                    this.roofLandingRollTimer = 0.20;
                  }
                  this.playerY = TRAIN_ROOF_HEIGHT;
                  this.verticalVelocity = 0;
                  this.isJumping = false;
                  this.hasDoubleJumped = false;
                  this.isOnTrainRoof = true;
                  this.currentTrainUnderPlayer = obs;
                }
              } else if (this.currentTrainUnderPlayer !== obs) {
                // Below roof height and hitting the train body -> Crash
                hit = true;
                isDirectTrainCrash = true;
              }
            }
          } else if (obs.type === 'BRIDGE') {
            const inBridgeZ = obsZ >= -0.85 && obsZ <= 0.85;
            if (
              inBridgeZ &&
              this.playerY >= 2.05 &&
              this.currentTrainUnderPlayer &&
              this.currentTrainUnderPlayer.isOncomingTrain
            ) {
              hit = true;
            }
          } else {
            // Ground-only obstacles
            const inZRange = obsZ >= -0.72 && obsZ <= 0.80;
            if (inZRange && this.playerY < 1.95) {
              if (obs.type === 'LOW' && this.playerY < 0.72) {
                hit = true;
              } else if (obs.type === 'HIGH' && (!this.isSliding || this.playerY > 0.45)) {
                hit = true;
              } else if (obs.type === 'BLOCK' && this.playerY < 1.95) {
                hit = true;
              }
            }
          }

          if (hit) {
            this.handlePlayerCollision(isDirectTrainCrash);
            if (this.isChaseSequence) return;
          }
        }
      }
    }

    // 8. Move & Magnetize Coins (Pooled; collision only within 20m of player)
    const magRadius = Math.min(20, 15 * (1 + this.selectedCharacter.statMagnetBonus));
    for (let i = 0; i < this.activeCoins.length; i++) {
      const coin = this.activeCoins[i];
      coin.mesh.rotation.z += 4 * delta;

      if (isMagnetActive && coin.mesh.position.z > -magRadius && coin.mesh.position.z < 8) {
        const lerpFactor = Math.min(1.0, 14 * delta);
        coin.mesh.position.x += (this.playerX - coin.mesh.position.x) * lerpFactor;
        coin.mesh.position.y += (this.playerY + 0.9 - coin.mesh.position.y) * lerpFactor;
        coin.mesh.position.z += Math.max(actualSpeed * 1.35, 30) * delta;
      } else {
        coin.mesh.position.z += moveDist;
      }

      const coinZ = coin.mesh.position.z;
      coin.mesh.visible = coinZ >= -100;

      if (coinZ >= -20 && coinZ <= 20 && Math.abs(coinZ) < 3.0) {
        _vec3.set(this.playerX, this.playerY + 0.9, 0);
        if (coin.mesh.position.distanceTo(_vec3) < 1.4) {
          this.collectCoin(coin.mesh.position);
          this.poolManager.releaseCoin(coin);
          this.activeCoins.splice(i, 1);
          i--;
          continue;
        }
      }

      if (coinZ > 15) {
        this.poolManager.releaseCoin(coin);
        this.activeCoins.splice(i, 1);
        i--;
      }
    }

    // 9. Move & Collect Power-ups (Pooled; collision only within 20m of player)
    for (let i = 0; i < this.activePowerUps.length; i++) {
      const p = this.activePowerUps[i];
      p.group.position.z += moveDist;
      p.group.rotation.y += 3 * delta;
      const pZ = p.group.position.z;
      p.group.visible = pZ >= -100;

      if (pZ >= -20 && pZ <= 20 && Math.abs(pZ) < 3.0) {
        _vec3.set(this.playerX, this.playerY + 0.9, 0);
        if (p.group.position.distanceTo(_vec3) < 1.5) {
          this.collectPowerUp(p.type);
          this.poolManager.releasePowerUp(p);
          this.activePowerUps.splice(i, 1);
          i--;
          continue;
        }
      }

      if (pZ > 15) {
        this.poolManager.releasePowerUp(p);
        this.activePowerUps.splice(i, 1);
        i--;
      }
    }

    // 10. Pulled-Back & Elevated Camera for Clear View of Massive 36m Trains
    const targetRoofFactor =
      this.isOnTrainRoof || this.playerY >= TRAIN_ROOF_HEIGHT - 0.55 ? 1.0 : 0.0;
    this.smoothedRoofFactor = THREE.MathUtils.damp(
      this.smoothedRoofFactor,
      targetRoofFactor,
      6.5,
      delta
    );

    const surfaceBaseY = this.smoothedRoofFactor * TRAIN_ROOF_HEIGHT;
    const jumpAirOffset = Math.max(0, this.playerY - surfaceBaseY);
    let camTargetX = this.playerX * 0.48;
    let camTargetY =
      4.65 +
      (isJetpackActive
        ? 3.5
        : surfaceBaseY * 0.95 + this.smoothedRoofFactor * 0.75 + jumpAirOffset * 0.12);
    let camTargetZ =
      8.2 +
      (isJetpackActive ? 2.6 : 0) +
      this.smoothedRoofFactor * 1.15 +
      (this.boostPadTimer > 0 ? 1.2 : 0) +
      (actualSpeed > 22 ? (actualSpeed - 22) * 0.08 : 0);

    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= delta;
      const decay = Math.min(1.0, this.screenShakeTime / 0.35);
      const currentAmt = this.screenShakeIntensity * decay;
      camTargetX += (Math.random() - 0.5) * currentAmt * 1.2;
      camTargetY += (Math.random() - 0.5) * currentAmt * 1.2;
      camTargetZ += (Math.random() - 0.5) * currentAmt * 0.8;
    } else {
      this.screenShakeIntensity = 0.5;
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camTargetX, 8.0, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camTargetY, 5.2, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, camTargetZ, 6.5, delta);

    const targetLookAtY =
      1.65 + (isJetpackActive ? 2.5 : surfaceBaseY * 0.88 + jumpAirOffset * 0.05);
    const targetLookAtZ = -15 - this.smoothedRoofFactor * 4.0;
    this.smoothedLookAtY = THREE.MathUtils.damp(this.smoothedLookAtY, targetLookAtY, 6.0, delta);
    this.smoothedLookAtZ = THREE.MathUtils.damp(this.smoothedLookAtZ, targetLookAtZ, 5.5, delta);
    this.camera.lookAt(this.playerX * 0.3, this.smoothedLookAtY, this.smoothedLookAtZ);

    const targetRoll = (targetX - this.playerX) * -0.025;
    this.camera.rotation.z = THREE.MathUtils.damp(this.camera.rotation.z, targetRoll, 10.0, delta);

    this.callbacks.onStatsUpdate(this.getStats());
  }

  private updateThemeSystem() {
    const themeIndex = Math.floor(this.distanceTraveled / 1000) % 4;
    const themes: {
      type: EnvironmentTheme;
      title: string;
      skyColor: number;
      fogColor: number;
      fogDensity: number;
      hemiSky: number;
      hemiGround: number;
      dirColor: number;
    }[] = [
      {
        type: 'JUNGLE_RUINS',
        title: 'TROPICAL JUNGLE EXPEDITION',
        skyColor: 0xb45309,
        fogColor: 0x5a4622,
        fogDensity: 0.013,
        hemiSky: 0xfed7aa,
        hemiGround: 0x14532d,
        dirColor: 0xffedd5,
      },
      {
        type: 'SUNNY_CITY',
        title: 'SUNNY METROPOLIS',
        skyColor: 0x38bdf8,
        fogColor: 0x38bdf8,
        fogDensity: 0.009,
        hemiSky: 0xbae6fd,
        hemiGround: 0x1e293b,
        dirColor: 0xfff7ed,
      },
      {
        type: 'NEON_CYBER',
        title: 'NEON CYBERPUNK CITY',
        skyColor: 0x090514,
        fogColor: 0x150728,
        fogDensity: 0.012,
        hemiSky: 0xa855f7,
        hemiGround: 0x06b6d4,
        dirColor: 0xec4899,
      },
      {
        type: 'SNOWY_PEAKS',
        title: 'FROSTY SNOWY PEAKS',
        skyColor: 0xdbeafe,
        fogColor: 0xe0f2fe,
        fogDensity: 0.014,
        hemiSky: 0xffffff,
        hemiGround: 0x94a3b8,
        dirColor: 0xffffff,
      },
    ];

    const targetTheme = themes[themeIndex];
    if (this.currentTheme !== targetTheme.type) {
      this.currentTheme = targetTheme.type;
      soundSynth.playThemeFanfare();
      this.callbacks.onThemeChange?.(targetTheme.type, targetTheme.title);

      this.scene.background = new THREE.Color(targetTheme.skyColor);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(targetTheme.skyColor);
      }
      this.hemiLight.color.setHex(targetTheme.hemiSky);
      this.hemiLight.groundColor.setHex(targetTheme.hemiGround);
      this.dirLight.color.setHex(targetTheme.dirColor);
    }
  }

  private spawnPatternAt(spawnZ: number): number {
    const freeLanes = [-1, 0, 1];
    const isEarlyRun = this.distanceTraveled < 180;
    const isPast500m = this.distanceTraveled >= 500;
    // Balanced mix of Massive 36m Train Parkour and Ground Obstacles
    const isTrainParkourCluster = this.rng() < 0.46;
    let extraPatternSpan = 0;

    const shuffledLanes = [...freeLanes].sort(() => this.rng() - 0.5);
    // Guarantee at least one completely clear safe lane in every pattern
    const safeLane = shuffledLanes[0];

    const pickGroundHurdleType = (): 'LOW' | 'HIGH' | 'BLOCK' => {
      const r = this.rng();
      if (r < 0.44) return 'LOW';
      if (r < 0.85) return 'HIGH';
      return 'BLOCK';
    };

    if (isTrainParkourCluster) {
      extraPatternSpan = 26;
      // Pick 1 or 2 train lanes, never placing a train in safeLane so at least one lane is completely clear
      const nonSafeLanes = shuffledLanes.slice(1); // 2 lanes that are NOT safeLane
      const trainCount = !isEarlyRun && this.rng() < (isPast500m ? 0.68 : 0.52) ? 2 : 1;
      const trainLanes = nonSafeLanes.slice(0, trainCount);

      trainLanes.forEach((laneIdx, idx) => {
        const laneX = laneIdx * LANE_WIDTH;
        const zStagger = idx === 1 && this.rng() < 0.5 ? -8.0 : 0;
        // Oncoming trains spawn at a generous distance with a warning light so the player has plenty of reaction time
        const oncomingChance = isEarlyRun ? 0.15 : isPast500m ? 0.40 : 0.30;
        const isOncoming = this.rng() < oncomingChance;
        const trainZ = spawnZ + zStagger - (isOncoming ? 8.0 : 0);

        if (isOncoming) {
          soundSynth.playTrainHorn();
          const warn = this.poolManager.spawnWarningLight(laneX, trainZ + 28, 1.8);
          if (warn) {
            this.activeWarnings.push(warn);
          }
        }

        const obs = this.poolManager.spawnObstacle(
          'TRAIN',
          laneX,
          trainZ,
          isOncoming,
          0
        );
        if (obs) {
          this.activeObstacles.push(obs);

          // Line of coins along the massive 36m train roof
          for (let rZ = -14.0; rZ <= 14.0; rZ += 3.5) {
            const roofCoin = this.poolManager.spawnCoin(
              laneX,
              trainZ + rZ,
              TRAIN_ROOF_HEIGHT + 0.9
            );
            if (roofCoin) this.activeCoins.push(roofCoin);
          }
        }
      });

      // If only 1 lane has a train, optionally place a LOW or HIGH ground barrier in the second non-safe lane
      // while keeping safeLane 100% clear
      if (trainLanes.length === 1 && this.rng() < (isPast500m ? 0.72 : 0.52)) {
        const hurdleLane = nonSafeLanes[1];
        const hurdleType = this.rng() < 0.52 ? 'LOW' : 'HIGH';
        const hurdleObs = this.poolManager.spawnObstacle(
          hurdleType,
          hurdleLane * LANE_WIDTH,
          spawnZ + 8.0,
          false,
          0
        );
        if (hurdleObs) {
          this.activeObstacles.push(hurdleObs);
        }
      }

      // Optionally spawn an adjacent-lane staggered 36m Train B for side-to-side roof parkour
      const primaryLane = trainLanes[0];
      if (trainLanes.length === 1 && this.rng() < 0.65) {
        const adjacentLane = nonSafeLanes[1];
        if (adjacentLane !== primaryLane && adjacentLane !== safeLane) {
          const followLaneX = adjacentLane * LANE_WIDTH;
          const followAdjZ = spawnZ - 16.0;
          const followTrain = this.poolManager.spawnObstacle(
            'TRAIN',
            followLaneX,
            followAdjZ,
            false,
            0
          );
          if (followTrain) {
            extraPatternSpan = 38;
            this.activeObstacles.push(followTrain);
            for (let rZ = -14.0; rZ <= 14.0; rZ += 3.5) {
              const roofCoin = this.poolManager.spawnCoin(
                followLaneX,
                followAdjZ + rZ,
                TRAIN_ROOF_HEIGHT + 0.9
              );
              if (roofCoin) this.activeCoins.push(roofCoin);
            }
          }
        }
      }
    } else {
      // Ground-only obstacle pattern (LOW barriers, HIGH bars, and occasional BLOCKs)
      // Always leave safeLane (shuffledLanes[0]) completely clear so maximum 2 lanes have obstacles
      const twoLaneChance = isEarlyRun ? 0.35 : isPast500m ? 0.78 : 0.62;
      const obstacleCount = this.rng() < twoLaneChance ? 2 : 1;
      const blockedLanes = shuffledLanes.slice(1, 1 + obstacleCount);

      blockedLanes.forEach(laneIdx => {
        const chosenType = pickGroundHurdleType();
        const laneX = laneIdx * LANE_WIDTH;
        const obs = this.poolManager.spawnObstacle(
          chosenType,
          laneX,
          spawnZ,
          false,
          0
        );
        if (obs) {
          this.activeObstacles.push(obs);
        }
      });

      // Staggered follow-up ground hurdle (LOW or HIGH) 13m behind to keep jumping/sliding engaging
      // while still leaving at least 1 lane completely clear at spawnZ - 13
      const followHurdleChance = isEarlyRun ? 0.25 : isPast500m ? 0.68 : 0.48;
      if (this.rng() < followHurdleChance) {
        const followShuffled = [...freeLanes].sort(() => this.rng() - 0.5);
        const followCount = !isEarlyRun && this.rng() < (isPast500m ? 0.55 : 0.35) ? 2 : 1;
        const followBlocked = followShuffled.slice(1, 1 + followCount);
        followBlocked.forEach(laneIdx => {
          const hurdleType: 'LOW' | 'HIGH' = this.rng() < 0.52 ? 'LOW' : 'HIGH';
          const followObs = this.poolManager.spawnObstacle(
            hurdleType,
            laneIdx * LANE_WIDTH,
            spawnZ - 13.0,
            false,
            0
          );
          if (followObs) {
            this.activeObstacles.push(followObs);
          }
        });
      }
    }

    const isJetpack = this.activePowerUpsMap.has('JETPACK');
    const coinY = isJetpack ? 6.8 : 0.9;
    const formationType = Math.floor(this.rng() * 3);

    if (formationType === 0) {
      for (let cZ = 0; cZ < 7; cZ++) {
        const coin = this.poolManager.spawnCoin(safeLane * LANE_WIDTH, spawnZ + cZ * 3.0, coinY);
        if (coin) this.activeCoins.push(coin);
      }
    } else if (formationType === 1) {
      for (let cZ = 0; cZ < 6; cZ++) {
        const arcY = coinY + Math.sin((cZ / 5) * Math.PI) * 1.1;
        const coin = this.poolManager.spawnCoin(safeLane * LANE_WIDTH, spawnZ + cZ * 3.0, arcY);
        if (coin) this.activeCoins.push(coin);
      }
    } else {
      for (let cZ = 0; cZ < 6; cZ++) {
        const zLane = freeLanes[cZ % 3];
        const coin = this.poolManager.spawnCoin(zLane * LANE_WIDTH, spawnZ + cZ * 3.2, coinY);
        if (coin) this.activeCoins.push(coin);
      }
    }

    if (this.rng() < 0.2 && !isJetpack) {
      const bPad = this.poolManager.spawnBoostPad(safeLane * LANE_WIDTH, spawnZ + 12);
      if (bPad) this.activeBoostPads.push(bPad);
    }

    if (this.rng() < 0.22) {
      const powerTypes: PowerUpType[] = ['MAGNET', 'JETPACK', 'SHIELD', 'MULTIPLIER'];
      const pType = powerTypes[Math.floor(this.rng() * powerTypes.length)];
      const p = this.poolManager.spawnPowerUp(pType, safeLane * LANE_WIDTH, spawnZ - 12, coinY);
      if (p) this.activePowerUps.push(p);
    }

    return extraPatternSpan;
  }

  private handlePlayerCollision(isDirectTrainImpact = false) {
    if (!isDirectTrainImpact && this.boostPadTimer > 0) {
      soundSynth.playCrash();
      this.triggerScreenShake(0.40, 0.65);
      this.score += 250;
      return;
    }

    if (!isDirectTrainImpact && this.activePowerUpsMap.has('SKATEBOARD')) {
      this.activePowerUpsMap.delete('SKATEBOARD');
      soundSynth.playCrash();
      haptics.boost();
      this.triggerScreenShake(0.45, 0.75);
      return;
    }

    if (!isDirectTrainImpact && this.activePowerUpsMap.has('SHIELD')) {
      this.activePowerUpsMap.delete('SHIELD');
      soundSynth.playGlassShatter();
      haptics.nearMiss();
      this.triggerScreenShake(0.38, 0.60);
      const shieldBonus = (this.upgrades.shieldLevel - 1) * 150;
      if (shieldBonus > 0) {
        this.score += shieldBonus;
      }
      return;
    }

    // Subway Surfers Style Crash & Police + Dog Chase Sequence
    this.isStumbling = true;
    this.isChaseSequence = true;
    this.chaseTimer = 0;
    this.hasTriggeredGotcha = false;
    this.hasTriggeredFadeOut = false;
    this.currentSpeed = 0;
    this.slowMoTimer = 0;
    this.triggerScreenShake(0.45, 0.95);

    soundSynth.stopMusic();
    soundSynth.setWindRush(false);
    soundSynth.playCrash();
    soundSynth.playPoliceWhistle();
    soundSynth.playDogBark();
    haptics.crash(); // Requirement 4: 200ms vibration on crash

    if (this.onMultiplayerCrash) {
      this.onMultiplayerCrash(Math.round(this.distanceTraveled), this.score);
    }

    this.callbacks.onChaseStart?.();

    this.initPoliceChaseActors();
    if (this.inspectorRig) {
      this.inspectorRig.group.visible = true;
      this.inspectorRig.group.position.set(this.playerX - 0.18, 0, 7.2);
      this.inspectorRig.group.rotation.set(0, Math.PI, 0);
      this.inspectorRig.gotchaSprite.visible = false;
      this.inspectorRig.gotchaSprite.scale.set(0.01, 0.01, 1);
    }
    if (this.dogRig) {
      this.dogRig.group.visible = true;
      this.dogRig.group.position.set(this.playerX + 0.62, 0, 7.5);
      this.dogRig.group.rotation.set(0, Math.PI, 0);
    }
  }

  private updatePoliceChaseSequence(delta: number) {
    this.chaseTimer += delta;
    const t = this.chaseTimer;

    this.playerY = THREE.MathUtils.lerp(this.playerY, 0, Math.min(1, delta * 14));
    if (this.characterRig) {
      this.characterRig.group.position.x = this.playerX;
      this.characterRig.group.position.y = this.playerY;
      this.characterRig.group.position.z = THREE.MathUtils.lerp(
        this.characterRig.group.position.z,
        0.35,
        Math.min(1, delta * 10)
      );
      this.characterRig.group.rotation.y = Math.PI;
      this.characterRig.group.rotation.z = THREE.MathUtils.lerp(
        this.characterRig.group.rotation.z,
        0.18,
        Math.min(1, delta * 8)
      );
      this.characterRig.torso.position.y = THREE.MathUtils.lerp(
        this.characterRig.torso.position.y,
        0.42,
        Math.min(1, delta * 10)
      );
      this.characterRig.torso.rotation.x = THREE.MathUtils.lerp(
        this.characterRig.torso.rotation.x,
        1.22,
        Math.min(1, delta * 10)
      );
      this.characterRig.leftArm.rotation.x = -1.15;
      this.characterRig.rightArm.rotation.x = -0.85;
      this.characterRig.leftLeg.position.y = 0.28;
      this.characterRig.rightLeg.position.y = 0.28;
      this.characterRig.leftLeg.rotation.x = -1.25;
      this.characterRig.rightLeg.rotation.x = -0.95;

      this.characterRig.jetpackMesh.visible = false;
      this.characterRig.shieldMesh.visible = false;
      this.characterRig.magnetAuraMesh.visible = false;
      this.characterRig.skateboardMesh.visible = false;
    }

    const runDuration = 1.05;
    const runProgress = Math.min(1, t / runDuration);
    const easedRun = 1 - Math.pow(1 - runProgress, 2.2);

    if (this.inspectorRig) {
      this.inspectorRig.group.position.x = this.playerX - 0.18;
      this.inspectorRig.group.position.z = THREE.MathUtils.lerp(7.2, 1.25, easedRun);

      if (runProgress < 1) {
        const phase = t * 24;
        const swing = Math.sin(phase) * 0.75;
        this.inspectorRig.torso.position.y = 1.08 + Math.abs(Math.sin(phase)) * 0.06;
        this.inspectorRig.torso.rotation.x = 0.22;
        this.inspectorRig.leftArm.rotation.x = swing;
        this.inspectorRig.rightArm.rotation.x = -swing;
        this.inspectorRig.leftForearm.rotation.x = -0.55;
        this.inspectorRig.rightForearm.rotation.x = -0.55;
        this.inspectorRig.leftLeg.rotation.x = -swing;
        this.inspectorRig.rightLeg.rotation.x = swing;
        this.inspectorRig.leftKnee.rotation.x = Math.max(0, Math.sin(phase) * 0.7);
        this.inspectorRig.rightKnee.rotation.x = Math.max(0, Math.sin(phase + Math.PI) * 0.7);
      } else {
        const catchTime = t - runDuration;
        this.inspectorRig.torso.position.y = 1.08 + Math.sin(catchTime * 8) * 0.02;
        this.inspectorRig.torso.rotation.x = 0.12;
        this.inspectorRig.head.rotation.x = 0.28;
        this.inspectorRig.leftArm.rotation.x = -0.35;
        this.inspectorRig.leftForearm.rotation.x = -0.45;
        this.inspectorRig.rightArm.rotation.x = -1.85 + Math.sin(catchTime * 15) * 0.45;
        this.inspectorRig.rightForearm.rotation.x = -0.35;
        this.inspectorRig.leftLeg.rotation.x = 0;
        this.inspectorRig.rightLeg.rotation.x = 0;
        this.inspectorRig.leftKnee.rotation.x = 0;
        this.inspectorRig.rightKnee.rotation.x = 0;
      }

      if (t >= 1.0 && !this.hasTriggeredGotcha) {
        this.hasTriggeredGotcha = true;
        this.inspectorRig.gotchaSprite.visible = true;
        soundSynth.playDogBark();
      }

      if (this.hasTriggeredGotcha) {
        const bubbleAge = Math.max(0, t - 1.0);
        const popProgress = Math.min(1, bubbleAge * 5.5);
        const overshoot = popProgress < 1 ? Math.sin(popProgress * Math.PI) * 0.28 : Math.sin(bubbleAge * 8) * 0.05;
        const scaleX = 2.45 * (popProgress + overshoot);
        const scaleY = 1.22 * (popProgress + overshoot);
        this.inspectorRig.gotchaSprite.scale.set(Math.max(0.01, scaleX), Math.max(0.01, scaleY), 1);
      }
    }

    if (this.dogRig) {
      const dogProgress = Math.min(1, t / 0.95);
      const easedDog = 1 - Math.pow(1 - dogProgress, 2.2);
      this.dogRig.group.position.x = this.playerX + 0.62;
      this.dogRig.group.position.z = THREE.MathUtils.lerp(7.5, 0.92, easedDog);

      if (dogProgress < 1) {
        const dPhase = t * 28;
        const dSwing = Math.sin(dPhase) * 0.7;
        this.dogRig.body.position.y = 0.46 + Math.abs(Math.cos(dPhase)) * 0.06;
        this.dogRig.frontLeftLeg.rotation.x = dSwing;
        this.dogRig.frontRightLeg.rotation.x = Math.sin(dPhase + 0.6) * 0.7;
        this.dogRig.backLeftLeg.rotation.x = -dSwing;
        this.dogRig.backRightLeg.rotation.x = -Math.sin(dPhase + 0.6) * 0.7;
        this.dogRig.tail.rotation.z = Math.sin(t * 25) * 0.35;
      } else {
        const barkPhase = (t - 0.95) * 14;
        this.dogRig.body.position.y = 0.46 + Math.abs(Math.sin(barkPhase)) * 0.09;
        this.dogRig.head.rotation.x = -0.2 + Math.sin(barkPhase * 1.5) * 0.14;
        this.dogRig.frontLeftLeg.rotation.x = 0;
        this.dogRig.frontRightLeg.rotation.x = 0;
        this.dogRig.backLeftLeg.rotation.x = 0;
        this.dogRig.backRightLeg.rotation.x = 0;
        this.dogRig.tail.rotation.z = Math.sin(t * 28) * 0.48;
      }
    }

    let camTargetX = this.playerX * 0.75 + 0.45;
    let camTargetY = 2.35;
    let camTargetZ = 4.35;

    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= delta;
      const decay = Math.min(1.0, this.screenShakeTime / 0.45);
      const currentAmt = this.screenShakeIntensity * decay;
      camTargetX += (Math.random() - 0.5) * currentAmt * 1.1;
      camTargetY += (Math.random() - 0.5) * currentAmt * 1.1;
      camTargetZ += (Math.random() - 0.5) * currentAmt * 0.7;
    }

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camTargetX, Math.min(1, delta * 4.5));
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, camTargetY, Math.min(1, delta * 4.5));
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, camTargetZ, Math.min(1, delta * 4.5));
    this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, 0, Math.min(1, delta * 6));
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 50, Math.min(1, delta * 3.8));
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.playerX, 0.95, 0.55);

    if (t >= 2.35 && !this.hasTriggeredFadeOut) {
      this.hasTriggeredFadeOut = true;
      this.callbacks.onScreenFade?.(true);
    }

    if (t >= 2.95) {
      this.isChaseSequence = false;
      try {
        const storedHighScore = parseInt(localStorage.getItem('subway_dash_highscore') || '0', 10);
        const hasExistingGhost = localStorage.getItem('subway_dash_ghost_best_run') !== null;
        if ((this.score > storedHighScore || !hasExistingGhost) && this.currentRunFrames.length > 20) {
          localStorage.setItem(
            'subway_dash_ghost_best_run',
            JSON.stringify(this.currentRunFrames.slice(0, 4500))
          );
          localStorage.setItem('subway_dash_ghost_best_score', this.score.toString());
          this.ghostFrames = this.currentRunFrames.slice(0, 4500);
          if (!this.ghostRig) {
            this.initGhostRunner();
          }
        }
      } catch {
        // storage quota fallback
      }
      this.pause();
      this.callbacks.onGameOver(this.getStats());
    }
  }

  private collectCoin(_pos: THREE.Vector3) {
    const isMidas = this.selectedCharacter.superpowerType === 'GOLDEN_TOUCH';
    const coinValueMultiplier = isMidas ? 2 : 1;
    const extraBonus = 1 + this.selectedCharacter.statCoinBonus;
    const baseVal = Math.floor(10 * extraBonus * coinValueMultiplier * (1 + this.runMultiplierBonus));

    this.coinsCollected += 1 * coinValueMultiplier;
    this.score += baseVal;
    this.comboCount += 1;
    if (this.comboCount > this.maxComboCount) {
      this.maxComboCount = this.comboCount;
    }
    this.comboTimer = 2.5;

    this.coinsSinceLastSurge += 1 * coinValueMultiplier;
    if (this.selectedCharacter.superpowerType === 'COIN_RUSH' && this.coinsSinceLastSurge >= 30) {
      this.coinsSinceLastSurge = 0;
      this.boostPadTimer = 4.0;
      soundSynth.playBoostPad();
      haptics.boost();
      this.triggerScreenShake(0.50, 0.70);
    }

    if (this.comboCount % 5 === 0) {
      this.score += this.comboCount * 50;
    }

    soundSynth.playCoin();
    haptics.coin();

    this.advanceInGameMission('COINS', 1 * coinValueMultiplier);
    this.callbacks.onMissionProgress('COLLECT_COINS', 1 * coinValueMultiplier);
    this.callbacks.onMissionProgress('HIGH_COMBO', this.comboCount);
  }

  private collectPowerUp(type: PowerUpType) {
    const duration = this.getPowerUpDuration(type);
    this.activePowerUpsMap.set(type, duration);
    this.powerUpsCollectedCount += 1;

    haptics.powerup();

    if (type === 'JETPACK') {
      soundSynth.playRocketWhoosh();
      this.triggerScreenShake(0.55, 0.75);
    } else if (type === 'SHIELD') {
      soundSynth.playPowerUp();
      this.triggerScreenShake(0.35, 0.45);
    } else if (type === 'MAGNET') {
      soundSynth.playMagnetHum();
      this.triggerScreenShake(0.35, 0.50);
    } else {
      soundSynth.playPowerUp();
      this.triggerScreenShake(0.35, 0.50);
    }

    this.callbacks.onMissionProgress('USE_POWERUPS', 1);
  }

  public getStats(): GameStats {
    return {
      score: this.score,
      highScore: 0,
      coins: this.coinsCollected,
      totalCoins: 0,
      distance: Math.floor(this.distanceTraveled),
      speed: Math.round(this.currentSpeed * 10) / 10,
      speedLevel: Math.min(10, Math.floor((this.currentSpeed - BASE_RUN_SPEED) / 3) + 1),
      combo: this.comboCount,
      maxCombo: this.maxComboCount,
      powerUpsCollected: this.powerUpsCollectedCount,
      nearMisses: this.nearMissesCount,
      newHighScore: false,
      weather: this.currentWeather,
      theme: this.currentTheme,
      isSkateboardActive: this.activePowerUpsMap.has('SKATEBOARD'),
      ghostDistanceDiff: this.ghostFrames.length > 0 ? this.ghostDistanceDiff : null,
      hasGhostRecording: this.ghostFrames.length > 0,
      inGameMission: this.currentInGameMission ? { ...this.currentInGameMission } : null,
      runMultiplierBonus: this.runMultiplierBonus,
      multiplayer: this.opponentData
        ? {
            isMatch: true,
            opponentName: this.opponentData.name,
            opponentDist: Math.round(this.opponentData.dist),
            opponentScore: this.opponentData.score,
            opponentCrashed: this.opponentData.crashed,
            status: 'RACING',
          }
        : undefined,
    };
  }

  private renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    this.pause();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
