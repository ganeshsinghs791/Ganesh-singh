import * as THREE from 'three';

/**
 * Creates High-Contrast Orange/White Chevron Hazard Texture for Barricades
 */
export function createHazardChevronTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = '#f97316';
  const width = 32;
  for (let x = -128; x < 384; x += width * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + width, 0);
    ctx.lineTo(x + width - 64, 128);
    ctx.lineTo(x - 64, 128);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#c2410c';
  ctx.fillRect(0, 0, 256, 6);
  ctx.fillRect(0, 122, 256, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates Detailed Concrete Wall Texture with Seams and Rivets
 */
export function createConcreteWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 50; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const rw = 20 + Math.random() * 50;
    const rh = 15 + Math.random() * 35;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(71, 85, 105, 0.3)';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates Authentic Subway Ground / Track Bed Canvas Texture
 */
export function createRoadCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181b22';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 160; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    const gr = 2 + Math.random() * 3;
    ctx.fillStyle = Math.random() > 0.5 ? '#242933' : '#111318';
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
  }

  const sleeperCount = 16;
  const sleeperGap = 512 / sleeperCount;
  ctx.fillStyle = '#2d2218';
  for (let s = 0; s < sleeperCount; s++) {
    const sy = s * sleeperGap;
    ctx.fillRect(12, sy + 6, 488, 14);

    ctx.fillStyle = '#475569';
    const railXPositions = [55, 115, 225, 285, 395, 455];
    railXPositions.forEach(rx => {
      ctx.fillRect(rx - 5, sy + 4, 10, 18);
    });
    ctx.fillStyle = '#2d2218';
  }

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(170, 0);
  ctx.lineTo(170, 512);
  ctx.moveTo(342, 0);
  ctx.lineTo(342, 512);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 12, 512);
  ctx.fillRect(500, 0, 12, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}

export function createCoinCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 5, 32, 32, 32);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.7, '#eab308');
  grad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(32, 32, 23, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fef9c3';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createExclamationTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(32, 32, 29, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(32, 32, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Global Cached Textures
const roadTexture = createRoadCanvasTexture();
const hazardChevronTexture = createHazardChevronTexture();
const concreteWallTexture = createConcreteWallTexture();
const coinTexture = createCoinCanvasTexture();
const exclamationTexture = createExclamationTexture();

// --- SHARED SINGLETON GEOMETRIES & OPTIMIZED MATERIALS ---
// Coins (Lightweight MeshLambertMaterial, no shadows)
const sharedCoinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 10);
const sharedCoinMat = new THREE.MeshLambertMaterial({
  map: coinTexture,
  color: 0xffd700,
});

// Warning Signs & Boost Pads
const sharedWarningBaseGeo = new THREE.PlaneGeometry(2.2, 3.5);
const sharedWarningBaseMat = new THREE.MeshBasicMaterial({
  color: 0xef4444,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const sharedWarningSignGeo = new THREE.PlaneGeometry(1.2, 1.2);
const sharedWarningSignMat = new THREE.MeshBasicMaterial({
  map: exclamationTexture,
  transparent: true,
  side: THREE.DoubleSide,
});

const sharedBoostPadGeo = new THREE.PlaneGeometry(2.1, 3.8);
const sharedBoostPadMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
const sharedBoostArrowGeo = new THREE.ConeGeometry(0.45, 0.8, 3);
const sharedBoostArrowMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });

// --- SHARED 3D TRAIN ASSETS (Lightweight MeshLambertMaterial & MeshBasicMaterial, NO shadows) ---
const sharedTrainBodyMat = new THREE.MeshLambertMaterial({
  color: 0x1d4ed8,
});

const sharedTrainNoseMat = new THREE.MeshLambertMaterial({
  color: 0x2563eb,
});

const sharedTrainRoofMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
const sharedTrainChassisMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
const sharedTrainWheelMat = new THREE.MeshLambertMaterial({ color: 0x334155 });

const sharedTrainWindowMat = new THREE.MeshLambertMaterial({
  color: 0x050811,
});

const sharedTrainStripeMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
const sharedHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const sharedTaillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

const sharedTrainBodyGeo = new THREE.BoxGeometry(2.42, 2.6, 34.0);
const sharedTrainNoseGeo = new THREE.BoxGeometry(2.40, 2.1, 2.0);
const sharedTrainWindshieldGeo = new THREE.BoxGeometry(2.06, 0.85, 0.15);
const sharedTrainWindowGeo = new THREE.BoxGeometry(0.04, 0.75, 1.5);
const sharedTrainRoofGeo = new THREE.BoxGeometry(2.46, 0.35, 35.6);
const sharedTrainAcGeo = new THREE.BoxGeometry(1.65, 0.26, 2.4);
const sharedTrainStripeGeo = new THREE.BoxGeometry(2.48, 0.32, 35.0);
const sharedTrainChassisGeo = new THREE.BoxGeometry(2.16, 0.45, 34.6);
const sharedTrainWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.14, 8);
const sharedCowcatcherGeo = new THREE.BoxGeometry(2.46, 0.45, 0.55);
const sharedHeadlightGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 8);
const sharedTaillightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8);

// --- SHARED OBSTACLES (Using fast MeshLambertMaterial, NO shadows) ---
const sharedBarricadeBoardGeo = new THREE.BoxGeometry(2.25, 0.48, 0.1);
const sharedHazardChevronMat = new THREE.MeshLambertMaterial({ map: hazardChevronTexture });
const sharedTubularMetalMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
const sharedBarricadeLegGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6);
const sharedBarricadeFootGeo = new THREE.BoxGeometry(0.12, 0.06, 0.7);
const sharedHazardLightGeo = new THREE.DodecahedronGeometry(0.14, 0);
const sharedHazardLightMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

const sharedTrussPoleGeo = new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6);
const sharedOverheadBeamGeo = new THREE.BoxGeometry(2.35, 0.12, 0.12);
const sharedOverheadSignGeo = new THREE.BoxGeometry(2.32, 0.95, 0.12);

const sharedConcreteBarrierGeo = new THREE.BoxGeometry(2.3, 1.4, 1.1);
const sharedConcreteBarrierMat = new THREE.MeshLambertMaterial({ map: concreteWallTexture });
const sharedUpperHazardPanelGeo = new THREE.BoxGeometry(2.32, 1.2, 0.28);
const sharedTrafficConeGeo = new THREE.ConeGeometry(0.22, 0.7, 6);
const sharedTrafficConeMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });

// --- SHARED TRACK & BACKGROUND BUILDING ASSETS (Requirement 5: Fast MeshLambertMaterial, NO shadows except road receiveShadow) ---
const sharedWallGeo = new THREE.BoxGeometry(0.8, 3.8, 60);
const sharedWallMat = new THREE.MeshLambertMaterial({ map: concreteWallTexture });
const sharedRailGeo = new THREE.BoxGeometry(0.08, 0.08, 60);
const sharedRailMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

const sharedStreetlightPoleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.8, 6);
const sharedStreetlightArmGeo = new THREE.BoxGeometry(0.9, 0.08, 0.08);
const sharedStreetlightLampGeo = new THREE.BoxGeometry(0.4, 0.16, 0.4);
const sharedStreetlightBulbGeo = new THREE.SphereGeometry(0.14, 6, 6);
const sharedStreetlightPoleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
const sharedStreetlightBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

// Background Buildings using fast MeshLambertMaterial (Opaque, no transparency)
const sharedBuildingGeo = new THREE.BoxGeometry(3.8, 1, 4.2);
const sharedBuildingWindowGeo = new THREE.BoxGeometry(0.06, 0.65, 0.85);
const sharedBuildingMats = [
  new THREE.MeshLambertMaterial({ color: 0x1e293b }),
  new THREE.MeshLambertMaterial({ color: 0x334155 }),
  new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
  new THREE.MeshLambertMaterial({ color: 0x312e81 }),
];
const sharedLitWindowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

export interface CharacterRig {
  group: THREE.Group;
  head: THREE.Object3D;
  torso: THREE.Object3D;
  leftArm: THREE.Object3D;
  leftForearm: THREE.Object3D;
  rightArm: THREE.Object3D;
  rightForearm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftKnee: THREE.Object3D;
  rightKnee: THREE.Object3D;
  jetpackMesh: THREE.Group;
  shieldMesh: THREE.Mesh;
  magnetAuraMesh: THREE.Object3D;
  skateboardMesh: THREE.Group;
  wheels: THREE.Object3D[];
}

/**
 * Creates Detailed Player Character (Kept MeshStandardMaterial & castShadow = true on core limbs)
 */
export function createProceduralCharacter(
  charId: string,
  skinOverride?: { bodyHex: number; accentHex: number; pantsHex: number } | null
): CharacterRig {
  const group = new THREE.Group();
  group.name = `CHARACTER_${charId}`;
  // Face forward (-Z) down the track, away from the camera
  group.rotation.y = Math.PI;

  const colorsMap: Record<string, { body: number; accent: number; skin: number; hair: number; pants: number }> = {
    roy: { body: 0x2563eb, accent: 0xf59e0b, skin: 0xe0ac69, hair: 0x38240b, pants: 0x1e293b },
    maya: { body: 0xdc2626, accent: 0xffffff, skin: 0x8d5524, hair: 0x171717, pants: 0x18181b },
    kenji: { body: 0x059669, accent: 0xa855f7, skin: 0xf1c27d, hair: 0x0f172a, pants: 0x0f172a },
    nova: { body: 0x0891b2, accent: 0xf43f5e, skin: 0xffdbac, hair: 0x38bdf8, pants: 0x0f172a },
    aria: { body: 0xd97706, accent: 0xffffff, skin: 0xc68642, hair: 0xfacc15, pants: 0x334155 },
    santa: { body: 0xb91c1c, accent: 0xf8fafc, skin: 0xffdbac, hair: 0xffffff, pants: 0x991b1b },
    diwali: { body: 0xf59e0b, accent: 0xec4899, skin: 0x8d5524, hair: 0x171717, pants: 0x78350f },
  };

  const basePalette = colorsMap[charId] || colorsMap.roy;
  const palette = skinOverride
    ? {
        ...basePalette,
        body: skinOverride.bodyHex,
        accent: skinOverride.accentHex,
        pants: skinOverride.pantsHex,
      }
    : basePalette;

  const matBody = new THREE.MeshLambertMaterial({
    color: palette.body,
  });
  const matAccent = new THREE.MeshLambertMaterial({
    color: palette.accent,
  });
  const matSkin = new THREE.MeshLambertMaterial({ color: palette.skin });
  const matHair = new THREE.MeshLambertMaterial({ color: palette.hair });
  const matPants = new THREE.MeshLambertMaterial({ color: palette.pants });

  // 1. Torso
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.05;

  const chestGeo = new THREE.BoxGeometry(0.62, 0.72, 0.38);
  const chestMesh = new THREE.Mesh(chestGeo, matBody);
  chestMesh.position.y = 0.15;
  torsoGroup.add(chestMesh);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.12), matAccent);
  collar.position.set(0, 0.42, 0.17);
  torsoGroup.add(collar);

  const backHood = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.16), matAccent);
  backHood.position.set(0, 0.44, -0.18);
  torsoGroup.add(backHood);

  const backStripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.04), matAccent);
  backStripe.position.set(0, 0.18, -0.19);
  torsoGroup.add(backStripe);

  group.add(torsoGroup);

  // 2. Head & Hair
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 8), matSkin);
  neck.position.set(0, 0.56, 0);
  torsoGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.78, 0);

  const headMeshGeo = new THREE.SphereGeometry(0.23, 10, 10);
  headMeshGeo.scale(1, 1.12, 0.95);
  const headMesh = new THREE.Mesh(headMeshGeo, matSkin);
  headGroup.add(headMesh);

  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.44), matHair);
  hairTop.position.set(0, 0.20, -0.02);
  headGroup.add(hairTop);

  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.22), matHair);
  hairBack.position.set(0, 0.04, -0.14);
  headGroup.add(hairBack);

  torsoGroup.add(headGroup);

  // 3. Arms
  const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.36, 6);
  const lowerArmGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.34, 6);
  const handGeo = new THREE.SphereGeometry(0.065, 6, 6);

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.38, 0.42, 0);
  const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, matBody);
  leftUpperArmMesh.position.y = -0.18;
  leftArmGroup.add(leftUpperArmMesh);

  const leftForearmGroup = new THREE.Group();
  leftForearmGroup.position.set(0, -0.36, 0);
  const leftLowerArmMesh = new THREE.Mesh(lowerArmGeo, matSkin);
  leftLowerArmMesh.position.y = -0.17;
  leftForearmGroup.add(leftLowerArmMesh);
  const leftHand = new THREE.Mesh(handGeo, matSkin);
  leftHand.position.y = -0.34;
  leftForearmGroup.add(leftHand);
  leftArmGroup.add(leftForearmGroup);
  torsoGroup.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.38, 0.42, 0);
  const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, matBody);
  rightUpperArmMesh.position.y = -0.18;
  rightArmGroup.add(rightUpperArmMesh);

  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.set(0, -0.36, 0);
  const rightLowerArmMesh = new THREE.Mesh(lowerArmGeo, matSkin);
  rightLowerArmMesh.position.y = -0.17;
  rightForearmGroup.add(rightLowerArmMesh);
  const rightHand = new THREE.Mesh(handGeo, matSkin);
  rightHand.position.y = -0.34;
  rightForearmGroup.add(rightHand);
  rightArmGroup.add(rightForearmGroup);
  torsoGroup.add(rightArmGroup);

  // 4. Legs
  const thighGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.42, 6);
  const calfGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.40, 6);
  const soleGeo = new THREE.BoxGeometry(0.22, 0.08, 0.42);
  const soleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const shoeUpperGeo = new THREE.BoxGeometry(0.20, 0.14, 0.38);

  function createSneakerMesh(): THREE.Group {
    const sGroup = new THREE.Group();
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.y = -0.04;
    sGroup.add(sole);
    const shoeUpper = new THREE.Mesh(shoeUpperGeo, matAccent);
    shoeUpper.position.set(0, 0.07, 0.02);
    sGroup.add(shoeUpper);
    return sGroup;
  }

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.18, 0.70, 0);
  const leftThigh = new THREE.Mesh(thighGeo, matPants);
  leftThigh.position.y = -0.21;
  leftLegGroup.add(leftThigh);

  const leftKneeGroup = new THREE.Group();
  leftKneeGroup.position.set(0, -0.42, 0);
  const leftCalf = new THREE.Mesh(calfGeo, matPants);
  leftCalf.position.y = -0.20;
  leftKneeGroup.add(leftCalf);
  const leftShoe = createSneakerMesh();
  leftShoe.position.set(0, -0.40, 0.08);
  leftKneeGroup.add(leftShoe);
  leftLegGroup.add(leftKneeGroup);
  group.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.18, 0.70, 0);
  const rightThigh = new THREE.Mesh(thighGeo, matPants);
  rightThigh.position.y = -0.21;
  rightLegGroup.add(rightThigh);

  const rightKneeGroup = new THREE.Group();
  rightKneeGroup.position.set(0, -0.42, 0);
  const rightCalf = new THREE.Mesh(calfGeo, matPants);
  rightCalf.position.y = -0.20;
  rightKneeGroup.add(rightCalf);
  const rightShoe = createSneakerMesh();
  rightShoe.position.set(0, -0.40, 0.08);
  rightKneeGroup.add(rightShoe);
  rightLegGroup.add(rightKneeGroup);
  group.add(rightLegGroup);

  // Jetpack Attachment
  const jetpackGroup = new THREE.Group();
  const rocketGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.65, 6);
  const rocketMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
  const leftRocket = new THREE.Mesh(rocketGeo, rocketMat);
  leftRocket.position.set(-0.22, 0.1, -0.28);
  jetpackGroup.add(leftRocket);
  const rightRocket = new THREE.Mesh(rocketGeo, rocketMat);
  rightRocket.position.set(0.22, 0.1, -0.28);
  jetpackGroup.add(rightRocket);
  jetpackGroup.visible = false;
  torsoGroup.add(jetpackGroup);

  // Subtle Thin Shield Shell
  const shieldMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    })
  );
  shieldMesh.position.y = 0.95;
  shieldMesh.visible = false;
  group.add(shieldMesh);

  // Subtle Thin Magnet Ring
  const magnetAuraGroup = new THREE.Group();
  const auraRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.015, 6, 24),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    })
  );
  auraRing1.rotation.x = Math.PI / 2;
  magnetAuraGroup.add(auraRing1);
  magnetAuraGroup.position.y = 0.85;
  magnetAuraGroup.visible = false;
  group.add(magnetAuraGroup);

  // 3D Skateboard
  const skateboardGroup = new THREE.Group();
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.08, 1.8),
    new THREE.MeshLambertMaterial({ color: 0xe11d48 })
  );
  deck.position.y = 0.05;
  skateboardGroup.add(deck);

  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 6);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
  const wheels: THREE.Object3D[] = [];
  const wheelPositions = [
    [-0.28, 0.02, 0.6],
    [0.28, 0.02, 0.6],
    [-0.28, 0.02, -0.6],
    [0.28, 0.02, -0.6],
  ];
  wheelPositions.forEach(pos => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(pos[0], pos[1], pos[2]);
    skateboardGroup.add(w);
    wheels.push(w);
  });

  skateboardGroup.visible = false;
  group.add(skateboardGroup);

  return {
    group,
    head: headGroup,
    torso: torsoGroup,
    leftArm: leftArmGroup,
    leftForearm: leftForearmGroup,
    rightArm: rightArmGroup,
    rightForearm: rightForearmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    leftKnee: leftKneeGroup,
    rightKnee: rightKneeGroup,
    jetpackMesh: jetpackGroup,
    shieldMesh,
    magnetAuraMesh: magnetAuraGroup,
    skateboardMesh: skateboardGroup,
    wheels,
  };
}

/**
 * Creates a Detailed Track Chunk with Subway Rails, Retaining Walls, Streetlights & Background Buildings
 * Requirement 2 & 5: Road uses MeshLambertMaterial and is the ONLY mesh with receiveShadow = true.
 * Buildings, walls, rails, and streetlights use fast MeshLambertMaterial with castShadow = false.
 */
export function createTrackChunk(length = 60): THREE.Group {
  const chunk = new THREE.Group();

  // 1. Roadbed Surface (MeshLambertMaterial, no shadows)
  const roadGeo = new THREE.PlaneGeometry(8.5, length);
  const roadMat = new THREE.MeshLambertMaterial({ map: roadTexture });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  chunk.add(road);

  // 2. Dual Steel Rails along all 3 lanes (No shadow casting)
  const laneCenters = [-2.85, 0, 2.85];
  laneCenters.forEach(centerX => {
    const railL = new THREE.Mesh(sharedRailGeo, sharedRailMat);
    railL.position.set(centerX - 0.75, 0.04, 0);
    chunk.add(railL);

    const railR = new THREE.Mesh(sharedRailGeo, sharedRailMat);
    railR.position.set(centerX + 0.75, 0.04, 0);
    chunk.add(railR);
  });

  // 3. Subway Retaining Walls on Left & Right (MeshLambertMaterial, no shadows)
  const leftWall = new THREE.Mesh(sharedWallGeo, sharedWallMat);
  leftWall.position.set(-5.5, 1.9, 0);
  chunk.add(leftWall);

  const rightWall = new THREE.Mesh(sharedWallGeo, sharedWallMat);
  rightWall.position.set(5.5, 1.9, 0);
  chunk.add(rightWall);

  // 4. Background City Buildings along Left & Right Flanks (MeshLambertMaterial, no shadows)
  const buildingZOffsets = [-22, -7, 8, 23];
  buildingZOffsets.forEach((bz, idx) => {
    const hLeft = 8 + ((idx * 3) % 7);
    const bMatL = sharedBuildingMats[idx % sharedBuildingMats.length];
    const bLeft = new THREE.Mesh(sharedBuildingGeo, bMatL);
    bLeft.scale.set(1, hLeft, 1);
    bLeft.position.set(-8.2, hLeft / 2, bz);
    chunk.add(bLeft);

    const hRight = 9 + (((idx + 2) * 3) % 7);
    const bMatR = sharedBuildingMats[(idx + 2) % sharedBuildingMats.length];
    const bRight = new THREE.Mesh(sharedBuildingGeo, bMatR);
    bRight.scale.set(1, hRight, 1);
    bRight.position.set(8.2, hRight / 2, bz);
    chunk.add(bRight);

    // Lit Windows facing track
    const winL = new THREE.Mesh(sharedBuildingWindowGeo, sharedLitWindowMat);
    winL.position.set(-6.28, 5.2, bz);
    chunk.add(winL);

    const winR = new THREE.Mesh(sharedBuildingWindowGeo, sharedLitWindowMat);
    winR.position.set(6.28, 5.5, bz);
    chunk.add(winR);
  });

  // 5. Streetlights along Track Borders
  const lightZPositions = [-length / 2 + 10, -length / 2 + 30, -length / 2 + 50];
  lightZPositions.forEach((z, i) => {
    const isLeft = i % 2 === 0;
    const postX = isLeft ? -5.1 : 5.1;
    const armDirection = isLeft ? 1 : -1;

    const streetlight = new THREE.Group();
    const pole = new THREE.Mesh(sharedStreetlightPoleGeo, sharedStreetlightPoleMat);
    pole.position.y = 2.4;
    streetlight.add(pole);

    const arm = new THREE.Mesh(sharedStreetlightArmGeo, sharedStreetlightPoleMat);
    arm.position.set(armDirection * 0.45, 4.6, 0);
    streetlight.add(arm);

    const fixture = new THREE.Mesh(sharedStreetlightLampGeo, sharedStreetlightPoleMat);
    fixture.position.set(armDirection * 0.85, 4.45, 0);
    streetlight.add(fixture);

    const bulb = new THREE.Mesh(sharedStreetlightBulbGeo, sharedStreetlightBulbMat);
    bulb.position.set(armDirection * 0.85, 4.35, 0);
    streetlight.add(bulb);

    streetlight.position.set(postX, 0, z);
    chunk.add(streetlight);
  });

  return chunk;
}

/**
 * Low Barricade (MeshLambertMaterial, no shadows)
 */
export function createLowBarrier(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OBSTACLE_LOW';

  const board = new THREE.Mesh(sharedBarricadeBoardGeo, sharedHazardChevronMat);
  board.position.set(0, 0.65, 0);
  group.add(board);

  const legPositions = [-1.02, 1.02];
  legPositions.forEach(x => {
    const legL = new THREE.Mesh(sharedBarricadeLegGeo, sharedTubularMetalMat);
    legL.position.set(x, 0.45, -0.15);
    legL.rotation.x = -0.18;
    group.add(legL);

    const legR = new THREE.Mesh(sharedBarricadeLegGeo, sharedTubularMetalMat);
    legR.position.set(x, 0.45, 0.15);
    legR.rotation.x = 0.18;
    group.add(legR);

    const foot = new THREE.Mesh(sharedBarricadeFootGeo, sharedTubularMetalMat);
    foot.position.set(x, 0.03, 0);
    group.add(foot);
  });

  const hazardLight = new THREE.Mesh(sharedHazardLightGeo, sharedHazardLightMat);
  hazardLight.position.set(0.9, 0.96, 0);
  group.add(hazardLight);

  return group;
}

/**
 * High Overhead Barrier (MeshLambertMaterial, no shadows)
 */
export function createHighBarrier(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OBSTACLE_HIGH';

  const signBoard = new THREE.Mesh(sharedOverheadSignGeo, sharedHazardChevronMat);
  signBoard.position.set(0, 2.45, 0);
  group.add(signBoard);

  const beam = new THREE.Mesh(sharedOverheadBeamGeo, sharedTubularMetalMat);
  beam.position.set(0, 3.02, 0);
  group.add(beam);

  const postL = new THREE.Mesh(sharedTrussPoleGeo, sharedTubularMetalMat);
  postL.position.set(-1.12, 1.6, 0);
  group.add(postL);

  const postR = new THREE.Mesh(sharedTrussPoleGeo, sharedTubularMetalMat);
  postR.position.set(1.12, 1.6, 0);
  group.add(postR);

  const lightL = new THREE.Mesh(sharedHazardLightGeo, sharedHazardLightMat);
  lightL.position.set(-1.05, 3.12, 0);
  group.add(lightL);

  const lightR = new THREE.Mesh(sharedHazardLightGeo, sharedHazardLightMat);
  lightR.position.set(1.05, 3.12, 0);
  group.add(lightR);

  return group;
}

/**
 * Full Concrete K-Rail Blocker (MeshLambertMaterial, no shadows)
 */
export function createFullBlocker(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OBSTACLE_BLOCK';

  const base = new THREE.Mesh(sharedConcreteBarrierGeo, sharedConcreteBarrierMat);
  base.position.set(0, 0.7, 0);
  group.add(base);

  const upperPanel = new THREE.Mesh(sharedUpperHazardPanelGeo, sharedHazardChevronMat);
  upperPanel.position.set(0, 1.95, 0);
  group.add(upperPanel);

  const coneL = new THREE.Mesh(sharedTrafficConeGeo, sharedTrafficConeMat);
  coneL.position.set(-0.75, 0.35, 0.65);
  group.add(coneL);

  const coneR = new THREE.Mesh(sharedTrafficConeGeo, sharedTrafficConeMat);
  coneR.position.set(0.75, 0.35, 0.65);
  group.add(coneR);

  const hazardLight = new THREE.Mesh(sharedHazardLightGeo, sharedHazardLightMat);
  hazardLight.position.set(0, 2.65, 0);
  group.add(hazardLight);

  return group;
}

/**
 * Detailed 3D Train (Clean train model with NO ladders; player jumps directly onto roof)
 */
export function createOncomingTrain(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OBSTACLE_TRAIN';

  // 1. Massive 3x-Length Metallic Coach Body (spans z = -17.6 to +16.4)
  const body = new THREE.Mesh(sharedTrainBodyGeo, sharedTrainBodyMat);
  body.position.set(0, 1.62, -0.6);
  group.add(body);

  // 2. Front Engine Cab Nose (extends forward to z = +18.2)
  const nose = new THREE.Mesh(sharedTrainNoseGeo, sharedTrainNoseMat);
  nose.position.set(0, 1.38, 17.1);
  group.add(nose);

  const plow = new THREE.Mesh(sharedCowcatcherGeo, sharedTrainChassisMat);
  plow.position.set(0, 0.26, 18.05);
  group.add(plow);

  // 3. Reflective Front Windshield & Side Windows along the full 36m length
  const windshield = new THREE.Mesh(sharedTrainWindshieldGeo, sharedTrainWindowMat);
  windshield.position.set(0, 1.88, 17.55);
  windshield.rotation.x = -0.25;
  group.add(windshield);

  const windowZPositions = [
    -15.4, -13.0, -10.6, -8.2, -5.8, -3.4, -1.0,
    1.4, 3.8, 6.2, 8.6, 11.0, 13.4, 15.6,
  ];
  windowZPositions.forEach(z => {
    const winL = new THREE.Mesh(sharedTrainWindowGeo, sharedTrainWindowMat);
    winL.position.set(-1.22, 2.05, z);
    group.add(winL);

    const winR = new THREE.Mesh(sharedTrainWindowGeo, sharedTrainWindowMat);
    winR.position.set(1.22, 2.05, z);
    group.add(winR);
  });

  // 4. Long Roof & AC Pods
  const roof = new THREE.Mesh(sharedTrainRoofGeo, sharedTrainRoofMat);
  roof.position.set(0, 3.05, 0.1);
  group.add(roof);

  const acZPositions = [-12.5, -4.2, 4.2, 12.5];
  acZPositions.forEach(acZ => {
    const acPod = new THREE.Mesh(sharedTrainAcGeo, sharedTrainChassisMat);
    acPod.position.set(0, 3.28, acZ);
    group.add(acPod);
  });

  // 5. Side Racing Stripe & Chassis
  const stripe = new THREE.Mesh(sharedTrainStripeGeo, sharedTrainStripeMat);
  stripe.position.set(0, 1.32, 0.1);
  group.add(stripe);

  const chassis = new THREE.Mesh(sharedTrainChassisGeo, sharedTrainChassisMat);
  chassis.position.set(0, 0.38, 0);
  group.add(chassis);

  // 6. Wheel Bogies along the 36m length
  const wheelZPositions = [15.2, 13.8, 5.2, 3.8, -4.8, -6.2, -14.2, -15.6];
  wheelZPositions.forEach(z => {
    const wheelL = new THREE.Mesh(sharedTrainWheelGeo, sharedTrainWheelMat);
    wheelL.rotation.z = Math.PI / 2;
    wheelL.position.set(-1.12, 0.35, z);
    group.add(wheelL);

    const wheelR = new THREE.Mesh(sharedTrainWheelGeo, sharedTrainWheelMat);
    wheelR.rotation.z = Math.PI / 2;
    wheelR.position.set(1.12, 0.35, z);
    group.add(wheelR);
  });

  // 7. Headlights & Taillights
  const headlightL = new THREE.Mesh(sharedHeadlightGeo, sharedHeadlightMat);
  headlightL.rotation.x = Math.PI / 2;
  headlightL.position.set(-0.78, 1.15, 18.15);
  group.add(headlightL);

  const headlightR = new THREE.Mesh(sharedHeadlightGeo, sharedHeadlightMat);
  headlightR.rotation.x = Math.PI / 2;
  headlightR.position.set(0.78, 1.15, 18.15);
  group.add(headlightR);

  const taillightL = new THREE.Mesh(sharedTaillightGeo, sharedTaillightMat);
  taillightL.rotation.x = Math.PI / 2;
  taillightL.position.set(-0.78, 1.8, -17.65);
  group.add(taillightL);

  const taillightR = new THREE.Mesh(sharedTaillightGeo, sharedTaillightMat);
  taillightR.rotation.x = Math.PI / 2;
  taillightR.position.set(0.78, 1.8, -17.65);
  group.add(taillightR);

  // Match visual train roof height to taller TRAIN_ROOF_HEIGHT (2.35m)
  group.scale.y = 0.73;

  return group;
}

/**
 * Low Overpass Bridge / Tunnel Arch (Players on ground pass safely underneath; players on moving train roof crash into it)
 */
export function createLowTunnelBridge(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OBSTACLE_BRIDGE';

  // Concrete & Hazard Overpass Deck at roof level (y = 2.65 to 4.5)
  const bridgeBeam = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 1.85, 1.6),
    sharedConcreteBarrierMat
  );
  bridgeBeam.position.set(0, 3.65, 0);
  group.add(bridgeBeam);

  // High-contrast warning chevron strip along bottom edge of low bridge
  const hazardStrip = new THREE.Mesh(
    new THREE.BoxGeometry(2.58, 0.42, 1.64),
    sharedHazardChevronMat
  );
  hazardStrip.position.set(0, 2.72, 0);
  group.add(hazardStrip);

  // Side support pillars
  const pillarL = new THREE.Mesh(sharedTrussPoleGeo, sharedTubularMetalMat);
  pillarL.position.set(-1.18, 1.6, 0);
  group.add(pillarL);

  const pillarR = new THREE.Mesh(sharedTrussPoleGeo, sharedTubularMetalMat);
  pillarR.position.set(1.18, 1.6, 0);
  group.add(pillarR);

  return group;
}

export function createWarningLight(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WARNING_LIGHT';

  const light = new THREE.Mesh(sharedWarningBaseGeo, sharedWarningBaseMat);
  light.rotation.x = -Math.PI / 2;
  light.position.y = 0.02;
  group.add(light);

  const sign = new THREE.Mesh(sharedWarningSignGeo, sharedWarningSignMat);
  sign.position.set(0, 1.8, 0);
  group.add(sign);

  return group;
}

export function createCoinMesh(): THREE.Mesh {
  const coin = new THREE.Mesh(sharedCoinGeo, sharedCoinMat);
  coin.rotation.x = Math.PI / 2;
  coin.position.y = 0.9;
  coin.name = 'COIN';
  return coin;
}

export function createPowerUpMesh(type: 'MAGNET' | 'JETPACK' | 'SHIELD' | 'MULTIPLIER' | 'SKATEBOARD'): THREE.Group {
  const group = new THREE.Group();
  group.name = `POWERUP_${type}`;

  const ringColor =
    type === 'MAGNET' ? 0x38bdf8 : type === 'JETPACK' ? 0xf97316 : type === 'SHIELD' ? 0xf59e0b : 0xa855f7;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.035, 8, 20),
    new THREE.MeshLambertMaterial({ color: ringColor })
  );
  ring.position.y = 1.0;
  group.add(ring);

  if (type === 'MAGNET') {
    const mag = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.07, 6, 12, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    mag.position.y = 1.0;
    group.add(mag);
  } else if (type === 'JETPACK') {
    const jet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.45, 8),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b })
    );
    jet.position.y = 1.0;
    group.add(jet);
  } else if (type === 'SHIELD') {
    const icon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    icon.position.y = 1.0;
    group.add(icon);
  } else if (type === 'MULTIPLIER') {
    const icon = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.22, 0),
      new THREE.MeshLambertMaterial({ color: 0xfef08a })
    );
    icon.position.y = 1.0;
    group.add(icon);
  }

  return group;
}

export function createBoostPad(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'BOOST_PAD';

  const mesh = new THREE.Mesh(sharedBoostPadGeo, sharedBoostPadMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.04;
  group.add(mesh);

  for (let i = -1; i <= 1; i++) {
    const arrow = new THREE.Mesh(sharedBoostArrowGeo, sharedBoostArrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = Math.PI;
    arrow.position.set(0, 0.06, i * 1.0);
    group.add(arrow);
  }

  return group;
}

/**
 * Comic-Style "GOTCHA!" Speech Bubble Texture
 */
function createGotchaBubbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 256);
  ctx.save();
  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 10;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.roundRect(28, 20, 456, 165, 36);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(220, 180);
  ctx.lineTo(256, 238);
  ctx.lineTo(295, 180);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(222, 174, 71, 12);

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(42, 34, 428, 137, 26);
  ctx.stroke();

  ctx.font = '900 72px Impact, "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('GOTCHA!', 262, 110);
  ctx.fillStyle = '#dc2626';
  ctx.fillText('GOTCHA!', 256, 104);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface InspectorRig {
  group: THREE.Group;
  head: THREE.Object3D;
  torso: THREE.Object3D;
  leftArm: THREE.Object3D;
  leftForearm: THREE.Object3D;
  rightArm: THREE.Object3D;
  rightForearm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftKnee: THREE.Object3D;
  rightKnee: THREE.Object3D;
  gotchaSprite: THREE.Sprite;
}

export function createInspectorCharacter(): InspectorRig {
  const group = new THREE.Group();
  group.name = 'INSPECTOR_CHASER';
  group.rotation.y = Math.PI;

  const matUniformShirt = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
  const matUniformPants = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const matGold = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
  const matSkin = new THREE.MeshLambertMaterial({ color: 0xe0ac69 });
  const matLeather = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const matMustache = new THREE.MeshLambertMaterial({ color: 0x451a03 });

  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.08;

  const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.78, 0.48), matUniformShirt);
  chestMesh.position.y = 0.16;
  torsoGroup.add(chestMesh);

  const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.79, 0.12, 0.50), matLeather);
  beltMesh.position.y = -0.16;
  torsoGroup.add(beltMesh);

  const buckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.52), matGold);
  buckleMesh.position.y = -0.16;
  torsoGroup.add(buckleMesh);

  const badgeFront = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), matGold);
  badgeFront.position.set(-0.18, 0.34, 0.25);
  torsoGroup.add(badgeFront);

  group.add(torsoGroup);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.82, 0);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), matSkin);
  headGroup.add(headMesh);

  const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.10), matMustache);
  mustache.position.set(0, -0.05, 0.22);
  headGroup.add(mustache);

  const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.18, 10), matUniformShirt);
  capCrown.position.set(0, 0.22, 0);
  headGroup.add(capCrown);

  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.24), matLeather);
  capVisor.position.set(0, 0.13, 0.20);
  capVisor.rotation.x = 0.15;
  headGroup.add(capVisor);

  torsoGroup.add(headGroup);

  const upperArmGeo = new THREE.CylinderGeometry(0.10, 0.09, 0.36, 6);
  const lowerArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.34, 6);

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.46, 0.44, 0);
  const leftUpper = new THREE.Mesh(upperArmGeo, matUniformShirt);
  leftUpper.position.y = -0.18;
  leftArmGroup.add(leftUpper);
  const leftForearmGroup = new THREE.Group();
  leftForearmGroup.position.set(0, -0.36, 0);
  const leftLower = new THREE.Mesh(lowerArmGeo, matSkin);
  leftLower.position.y = -0.17;
  leftForearmGroup.add(leftLower);
  leftArmGroup.add(leftForearmGroup);
  torsoGroup.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.46, 0.44, 0);
  const rightUpper = new THREE.Mesh(upperArmGeo, matUniformShirt);
  rightUpper.position.y = -0.18;
  rightArmGroup.add(rightUpper);
  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.set(0, -0.36, 0);
  const rightLower = new THREE.Mesh(lowerArmGeo, matSkin);
  rightLower.position.y = -0.17;
  rightForearmGroup.add(rightLower);

  const batonMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.52, 6), matLeather);
  batonMesh.rotation.x = Math.PI / 2;
  batonMesh.position.set(0, -0.34, 0.22);
  rightForearmGroup.add(batonMesh);

  rightArmGroup.add(rightForearmGroup);
  torsoGroup.add(rightArmGroup);

  const thighGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.42, 6);
  const calfGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.40, 6);
  const bootGeo = new THREE.BoxGeometry(0.24, 0.14, 0.42);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.20, 0.72, 0);
  const leftThigh = new THREE.Mesh(thighGeo, matUniformPants);
  leftThigh.position.y = -0.21;
  leftLegGroup.add(leftThigh);
  const leftKneeGroup = new THREE.Group();
  leftKneeGroup.position.set(0, -0.42, 0);
  const leftCalf = new THREE.Mesh(calfGeo, matUniformPants);
  leftCalf.position.y = -0.20;
  leftKneeGroup.add(leftCalf);
  const leftBoot = new THREE.Mesh(bootGeo, matLeather);
  leftBoot.position.set(0, -0.38, 0.06);
  leftKneeGroup.add(leftBoot);
  leftLegGroup.add(leftKneeGroup);
  group.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.20, 0.72, 0);
  const rightThigh = new THREE.Mesh(thighGeo, matUniformPants);
  rightThigh.position.y = -0.21;
  rightLegGroup.add(rightThigh);
  const rightKneeGroup = new THREE.Group();
  rightKneeGroup.position.set(0, -0.42, 0);
  const rightCalf = new THREE.Mesh(calfGeo, matUniformPants);
  rightCalf.position.y = -0.20;
  rightKneeGroup.add(rightCalf);
  const rightBoot = new THREE.Mesh(bootGeo, matLeather);
  rightBoot.position.set(0, -0.38, 0.06);
  rightKneeGroup.add(rightBoot);
  rightLegGroup.add(rightKneeGroup);
  group.add(rightLegGroup);

  const gotchaTex = createGotchaBubbleTexture();
  const gotchaMat = new THREE.SpriteMaterial({ map: gotchaTex, depthTest: false, transparent: true });
  const gotchaSprite = new THREE.Sprite(gotchaMat);
  gotchaSprite.position.set(0, 2.75, 0);
  gotchaSprite.scale.set(0.01, 0.01, 1);
  gotchaSprite.visible = false;
  group.add(gotchaSprite);

  return {
    group,
    head: headGroup,
    torso: torsoGroup,
    leftArm: leftArmGroup,
    leftForearm: leftForearmGroup,
    rightArm: rightArmGroup,
    rightForearm: rightForearmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    leftKnee: leftKneeGroup,
    rightKnee: rightKneeGroup,
    gotchaSprite,
  };
}

export interface DogRig {
  group: THREE.Group;
  body: THREE.Object3D;
  head: THREE.Object3D;
  tail: THREE.Object3D;
  frontLeftLeg: THREE.Object3D;
  frontRightLeg: THREE.Object3D;
  backLeftLeg: THREE.Object3D;
  backRightLeg: THREE.Object3D;
}

export function createPoliceDog(): DogRig {
  const group = new THREE.Group();
  group.name = 'POLICE_DOG';
  group.rotation.y = Math.PI;

  const matCoat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
  const matDarkFur = new THREE.MeshLambertMaterial({ color: 0x3b1806 });
  const matCollar = new THREE.MeshLambertMaterial({ color: 0xdc2626 });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.46;

  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.82), matCoat);
  bodyGroup.add(torsoMesh);

  const saddleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.56), matDarkFur);
  saddleMesh.position.set(0, 0.12, -0.04);
  bodyGroup.add(saddleMesh);

  const collarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.12), matCollar);
  collarMesh.position.set(0, 0.08, 0.38);
  bodyGroup.add(collarMesh);

  group.add(bodyGroup);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.26, 0.44);
  const skullMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.34), matCoat);
  headGroup.add(skullMesh);
  const snoutMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.28), matDarkFur);
  snoutMesh.position.set(0, -0.05, 0.24);
  headGroup.add(snoutMesh);

  const earGeo = new THREE.ConeGeometry(0.08, 0.20, 4);
  const leftEar = new THREE.Mesh(earGeo, matDarkFur);
  leftEar.position.set(-0.12, 0.24, -0.02);
  headGroup.add(leftEar);
  const rightEar = new THREE.Mesh(earGeo, matDarkFur);
  rightEar.position.set(0.12, 0.24, -0.02);
  headGroup.add(rightEar);

  bodyGroup.add(headGroup);

  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.12, -0.42);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.36, 6), matDarkFur);
  tailMesh.position.set(0, 0.12, -0.10);
  tailMesh.rotation.x = -0.6;
  tailGroup.add(tailMesh);
  bodyGroup.add(tailGroup);

  const legGeo = new THREE.BoxGeometry(0.11, 0.38, 0.11);
  const makeLeg = (x: number, z: number) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(x, 0.36, z);
    const legMesh = new THREE.Mesh(legGeo, matCoat);
    legMesh.position.y = -0.18;
    legGroup.add(legMesh);
    group.add(legGroup);
    return legGroup;
  };

  return {
    group,
    body: bodyGroup,
    head: headGroup,
    tail: tailGroup,
    frontLeftLeg: makeLeg(-0.14, 0.28),
    frontRightLeg: makeLeg(0.14, 0.28),
    backLeftLeg: makeLeg(-0.14, -0.28),
    backRightLeg: makeLeg(0.14, -0.28),
  };
}
