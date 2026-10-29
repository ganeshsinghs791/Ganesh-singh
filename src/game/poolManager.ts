import * as THREE from 'three';
import {
  createTrackChunk,
  createLowBarrier,
  createHighBarrier,
  createFullBlocker,
  createOncomingTrain,
  createLowTunnelBridge,
  createWarningLight,
  createCoinMesh,
  createPowerUpMesh,
  createBoostPad,
} from './proceduralAssets';
import { PowerUpType } from '../types/game';

export interface PoolableBoostPad {
  group: THREE.Group;
  lane: number;
  active: boolean;
}

export interface PoolableObstacle {
  group: THREE.Group;
  type: 'LOW' | 'HIGH' | 'BLOCK' | 'TRAIN' | 'BRIDGE';
  lane: number;
  active: boolean;
  isOncomingTrain: boolean;
  isStationaryTrain: boolean;
  trainSpeed: number;
  isRooftopObstacle: boolean;
  parentTrain: PoolableObstacle | null;
  zOffsetOnTrain: number;
}

export interface PoolableWarningLight {
  group: THREE.Group;
  lane: number;
  active: boolean;
  timer: number;
}

export interface PoolableCoin {
  mesh: THREE.Mesh;
  lane: number;
  active: boolean;
}

export interface PoolablePowerUp {
  group: THREE.Group;
  type: PowerUpType;
  lane: number;
  active: boolean;
}

export class PoolManager {
  private trackPool: THREE.Group[] = [];
  private obstaclePool: PoolableObstacle[] = [];
  private warningPool: PoolableWarningLight[] = [];
  private coinPool: PoolableCoin[] = [];
  private powerUpPool: PoolablePowerUp[] = [];
  private boostPadPool: PoolableBoostPad[] = [];

  constructor(scene: THREE.Scene) {
    // 1. Pre-instantiate 5 Track Chunks at startup (reused via object pooling)
    for (let i = 0; i < 5; i++) {
      const chunk = createTrackChunk(60);
      chunk.visible = false;
      scene.add(chunk);
      this.trackPool.push(chunk);
    }

    // 2. Pre-instantiate Obstacles, Trains & Low Bridges (56 items strictly reused, including 24 Trains for multi-train parkour)
    const types: ('LOW' | 'HIGH' | 'BLOCK' | 'TRAIN' | 'BRIDGE')[] = [
      'TRAIN',
      'TRAIN',
      'TRAIN',
      'LOW',
      'HIGH',
      'BLOCK',
      'BRIDGE',
    ];
    for (let i = 0; i < 56; i++) {
      const type = types[i % types.length];
      let group: THREE.Group;
      if (type === 'LOW') group = createLowBarrier();
      else if (type === 'HIGH') group = createHighBarrier();
      else if (type === 'BLOCK') group = createFullBlocker();
      else if (type === 'BRIDGE') group = createLowTunnelBridge();
      else group = createOncomingTrain();

      group.visible = false;
      scene.add(group);
      this.obstaclePool.push({
        group,
        type,
        lane: 0,
        active: false,
        isOncomingTrain: false,
        isStationaryTrain: false,
        trainSpeed: 0,
        isRooftopObstacle: false,
        parentTrain: null,
        zOffsetOnTrain: 0,
      });
    }

    // 3. Pre-instantiate Warning Lights (8 items)
    for (let i = 0; i < 8; i++) {
      const group = createWarningLight();
      group.visible = false;
      scene.add(group);
      this.warningPool.push({
        group,
        lane: 0,
        active: false,
        timer: 0,
      });
    }

    // 4. Pre-instantiate Coins (160 coins strictly pooled & reused for long train roofs)
    for (let i = 0; i < 160; i++) {
      const coin = createCoinMesh();
      coin.visible = false;
      scene.add(coin);
      this.coinPool.push({
        mesh: coin,
        lane: 0,
        active: false,
      });
    }

    // 5. Pre-instantiate Power-ups (12 items)
    const powerTypes: PowerUpType[] = ['MAGNET', 'JETPACK', 'SHIELD', 'MULTIPLIER'];
    for (let i = 0; i < 12; i++) {
      const pType = powerTypes[i % powerTypes.length];
      const pGroup = createPowerUpMesh(pType);
      pGroup.visible = false;
      scene.add(pGroup);
      this.powerUpPool.push({
        group: pGroup,
        type: pType,
        lane: 0,
        active: false,
      });
    }

    // 6. Pre-instantiate Boost Pads (6 items)
    for (let i = 0; i < 6; i++) {
      const bPad = createBoostPad();
      bPad.visible = false;
      scene.add(bPad);
      this.boostPadPool.push({
        group: bPad,
        lane: 0,
        active: false,
      });
    }
  }

  public getTrackChunk(): THREE.Group | null {
    const chunk = this.trackPool.find(c => !c.visible);
    if (chunk) {
      chunk.visible = true;
      return chunk;
    }
    return null;
  }

  public releaseTrackChunk(chunk: THREE.Group) {
    chunk.visible = false;
  }

  public spawnObstacle(
    type: 'LOW' | 'HIGH' | 'BLOCK' | 'TRAIN' | 'BRIDGE',
    laneX: number,
    posZ: number,
    isOncoming = false,
    posYOffset = 0,
    parentTrain: PoolableObstacle | null = null,
    zOffsetOnTrain = 0
  ): PoolableObstacle | null {
    const obs = this.obstaclePool.find(o => !o.active && o.type === type);
    if (obs) {
      obs.active = true;
      obs.lane = laneX;
      obs.isOncomingTrain = type === 'TRAIN' && isOncoming;
      obs.isStationaryTrain = type === 'TRAIN' && !isOncoming;
      obs.trainSpeed = obs.isOncomingTrain ? 8.5 : 0;
      obs.isRooftopObstacle = posYOffset > 1.5;
      obs.parentTrain = parentTrain;
      obs.zOffsetOnTrain = zOffsetOnTrain;

      obs.group.position.set(laneX, posYOffset, posZ);
      obs.group.visible = posZ >= -125;
      return obs;
    }
    return null;
  }

  public releaseObstacle(obs: PoolableObstacle) {
    obs.active = false;
    obs.group.visible = false;
    obs.isRooftopObstacle = false;
    obs.parentTrain = null;
    obs.zOffsetOnTrain = 0;
  }

  public spawnWarningLight(laneX: number, posZ: number, duration = 1.2): PoolableWarningLight | null {
    const w = this.warningPool.find(item => !item.active);
    if (w) {
      w.active = true;
      w.lane = laneX;
      w.timer = duration;
      w.group.position.set(laneX, 0, posZ);
      w.group.visible = posZ >= -100;
      return w;
    }
    return null;
  }

  public releaseWarningLight(w: PoolableWarningLight) {
    w.active = false;
    w.group.visible = false;
  }

  public spawnCoin(laneX: number, posZ: number, posY = 0.9): PoolableCoin | null {
    const coin = this.coinPool.find(c => !c.active);
    if (coin) {
      coin.active = true;
      coin.lane = laneX;
      coin.mesh.position.set(laneX, posY, posZ);
      coin.mesh.visible = posZ >= -100;
      return coin;
    }
    return null;
  }

  public releaseCoin(coin: PoolableCoin) {
    coin.active = false;
    coin.mesh.visible = false;
  }

  public spawnPowerUp(type: PowerUpType, laneX: number, posZ: number, posY = 1.0): PoolablePowerUp | null {
    const p = this.powerUpPool.find(item => !item.active && item.type === type);
    if (p) {
      p.active = true;
      p.lane = laneX;
      p.group.position.set(laneX, posY, posZ);
      p.group.visible = posZ >= -100;
      return p;
    }
    return null;
  }

  public releasePowerUp(p: PoolablePowerUp) {
    p.active = false;
    p.group.visible = false;
  }

  public spawnBoostPad(laneX: number, posZ: number): PoolableBoostPad | null {
    const b = this.boostPadPool.find(item => !item.active);
    if (b) {
      b.active = true;
      b.lane = laneX;
      b.group.position.set(laneX, 0, posZ);
      b.group.visible = posZ >= -100;
      return b;
    }
    return null;
  }

  public releaseBoostPad(b: PoolableBoostPad) {
    b.active = false;
    b.group.visible = false;
  }

  public resetAll() {
    this.obstaclePool.forEach(o => this.releaseObstacle(o));
    this.warningPool.forEach(w => this.releaseWarningLight(w));
    this.coinPool.forEach(c => this.releaseCoin(c));
    this.powerUpPool.forEach(p => this.releasePowerUp(p));
    this.boostPadPool.forEach(b => this.releaseBoostPad(b));
  }
}
