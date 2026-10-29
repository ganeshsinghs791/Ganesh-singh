import React, { useState } from 'react';
import { Character } from '../types/game';
import { X, Lock, Check, Coins, Zap, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import * as THREE from 'three';
import { createProceduralCharacter, CharacterRig } from '../game/proceduralAssets';
import { haptics } from '../utils/haptics';

interface CharacterSelectModalProps {
  characters: Character[];
  selectedCharacterId: string;
  totalCoins: number;
  onSelectCharacter: (charId: string) => void;
  onUnlockCharacter: (charId: string) => void;
  onClose: () => void;
}

// Dedicated 3D Turntable Preview Canvas with Swipe/Carousel Controls
const Character3DCanvas: React.FC<{
  charId: string;
  onPrev: () => void;
  onNext: () => void;
}> = ({ charId, onPrev, onNext }) => {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);
  const previousMouseXRef = React.useRef(0);
  const rotationYRef = React.useRef(0);

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 3.4);
    camera.lookAt(0, 0.95, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    dirLight.position.set(2.5, 4, 3);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    backLight.position.set(-2, 2, -3);
    scene.add(backLight);

    // Pedestal Stage
    const pedestalGeo = new THREE.CylinderGeometry(1.1, 1.2, 0.15, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.075;
    scene.add(pedestal);

    const ringGeo = new THREE.TorusGeometry(1.08, 0.03, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Rig
    const rig: CharacterRig = createProceduralCharacter(charId);
    scene.add(rig.group);

    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!isDraggingRef.current) {
        rotationYRef.current += delta * 1.1;
      }
      rig.group.rotation.y = rotationYRef.current;

      // Realistic running stride preview animation
      const elapsed = clock.getElapsedTime() * 7;
      const swing = Math.sin(elapsed) * 0.35;
      rig.leftArm.rotation.x = swing;
      rig.rightArm.rotation.x = -swing;
      rig.leftLeg.rotation.x = -swing;
      rig.rightLeg.rotation.x = swing;

      if (rig.leftForearm) rig.leftForearm.rotation.x = 0.3 + Math.abs(swing) * 0.4;
      if (rig.rightForearm) rig.rightForearm.rotation.x = 0.3 + Math.abs(swing) * 0.4;

      if (rig.leftKnee) rig.leftKnee.rotation.x = Math.max(0, Math.sin(elapsed) * 0.6);
      if (rig.rightKnee) rig.rightKnee.rotation.x = Math.max(0, Math.sin(elapsed + Math.PI) * 0.6);

      renderer.render(scene, camera);
    };

    animate();

    // Mouse & Touch Drag Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseXRef.current = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMouseXRef.current;
      rotationYRef.current += deltaX * 0.012;
      previousMouseXRef.current = e.clientX;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDraggingRef.current = true;
        previousMouseXRef.current = e.touches[0].clientX;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - previousMouseXRef.current;
      rotationYRef.current += deltaX * 0.012;
      previousMouseXRef.current = e.touches[0].clientX;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseUp);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [charId]);

  return (
    <div
      ref={mountRef}
      className="relative flex h-52 w-full cursor-grab items-center justify-center overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-950/90 shadow-2xl active:cursor-grabbing"
    >
      <div className="absolute top-2.5 left-3 rounded-full bg-slate-900/90 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-amber-300 backdrop-blur-md">
        360° TURNTABLE • SWIPE / DRAG
      </div>

      {/* Prev & Next Carousel Overlay Buttons */}
      <button
        onClick={e => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 border border-white/20 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 z-10"
        title="Previous Runner"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 border border-white/20 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 z-10"
        title="Next Runner"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  characters,
  selectedCharacterId,
  totalCoins,
  onSelectCharacter,
  onUnlockCharacter,
  onClose,
}) => {
  const [previewCharId, setPreviewCharId] = useState<string>(selectedCharacterId);

  const previewIndex = characters.findIndex(c => c.id === previewCharId);
  const previewChar = characters[previewIndex >= 0 ? previewIndex : 0] || characters[0];
  const isSelected = previewChar.id === selectedCharacterId;
  const canAfford = totalCoins >= previewChar.price;

  const handlePrev = () => {
    const nextIdx = (previewIndex - 1 + characters.length) % characters.length;
    setPreviewCharId(characters[nextIdx].id);
    haptics.click();
  };

  const handleNext = () => {
    const nextIdx = (previewIndex + 1) % characters.length;
    setPreviewCharId(characters[nextIdx].id);
    haptics.click();
  };

  const handleCharClick = (charId: string) => {
    setPreviewCharId(charId);
    haptics.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-4xl flex-col rounded-3xl border border-white/10 bg-slate-900/95 p-5 text-white shadow-2xl max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-mono text-xl sm:text-2xl font-black text-amber-300 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" /> 3D RUNNER ROSTER
            </h2>
            <p className="text-xs text-slate-400">Select realistic 3D human runners with custom stats & abilities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-amber-500/30 px-3.5 py-1.5 text-amber-300">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-mono text-sm font-bold">{totalCoins.toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                haptics.click();
                onClose();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Left 3D Stage & Right Roster Selection */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto pr-1">
          {/* Left Column: 3D Preview Stage & Ability Summary */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <Character3DCanvas charId={previewChar.id} onPrev={handlePrev} onNext={handleNext} />

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                    {previewChar.title}
                  </span>
                  <h3 className="font-mono text-lg font-bold text-white">{previewChar.name}</h3>
                </div>
                {previewChar.isHolidayEvent && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    SEASONAL
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400 leading-snug">{previewChar.description}</p>

              {/* Special Superpower Box */}
              <div className="mt-3 rounded-xl bg-slate-900 border border-amber-500/20 p-3 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{previewChar.specialAbility}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300 leading-snug">
                  {previewChar.superpowerDescription}
                </p>
              </div>

              {/* Action Button for Previewed Runner */}
              <div className="mt-4">
                {previewChar.unlocked ? (
                  isSelected ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-400 py-2.5 font-mono text-xs font-bold text-amber-300">
                      <Check className="h-4 w-4" /> CURRENTLY ACTIVE RUNNER
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        haptics.click();
                        onSelectCharacter(previewChar.id);
                      }}
                      className="w-full rounded-xl bg-sky-600 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 active:scale-98"
                    >
                      SELECT THIS RUNNER
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      haptics.click();
                      onUnlockCharacter(previewChar.id);
                    }}
                    disabled={!canAfford}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 font-mono text-xs font-bold transition active:scale-98 ${
                      canAfford
                        ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="h-4 w-4" />
                    UNLOCK FOR {previewChar.price.toLocaleString()} COINS
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Character Cards Roster */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[62vh] overflow-y-auto pr-1">
            {characters.map(char => {
              const isCharSelected = char.id === selectedCharacterId;
              const isCharPreviewed = char.id === previewCharId;

              return (
                <div
                  key={char.id}
                  onClick={() => handleCharClick(char.id)}
                  className={`relative flex flex-col justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                    isCharPreviewed
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                      : isCharSelected
                      ? 'border-sky-500/60 bg-sky-950/20'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">
                          {char.title}
                        </span>
                        <h4 className="font-bold text-sm text-white">{char.name}</h4>
                      </div>

                      <div
                        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 ${
                          !char.unlocked ? 'bg-slate-950 opacity-60' : ''
                        }`}
                        style={{ backgroundColor: char.unlocked ? char.color : '#0f172a' }}
                      >
                        {!char.unlocked ? (
                          <Lock className="h-4 w-4 text-slate-400" />
                        ) : (
                          <div
                            className="h-2.5 w-2.5 rounded-full border border-white"
                            style={{ backgroundColor: char.accentColor }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="truncate">{char.specialAbility}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    {char.unlocked ? (
                      isCharSelected ? (
                        <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-amber-400">
                          <Check className="h-3.5 w-3.5" /> ACTIVE
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-sky-400 font-bold">UNLOCKED</span>
                      )
                    ) : (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-amber-300">
                        <Coins className="h-3 w-3" /> {char.price.toLocaleString()}
                      </span>
                    )}

                    {isCharPreviewed && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                        PREVIEWING
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

