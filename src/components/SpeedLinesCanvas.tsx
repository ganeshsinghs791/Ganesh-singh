import React, { useEffect, useRef } from 'react';

interface SpeedLinesCanvasProps {
  speedLevel: number;
  isJetpack: boolean;
}

/**
 * Subtle peripheral speed lines strictly confined to the outer screen edges
 * when running at high velocity (speedLevel >= 3 or Jetpack active), leaving
 * the center gameplay viewport 100% clear.
 */
export const SpeedLinesCanvas: React.FC<SpeedLinesCanvasProps> = ({ speedLevel, isJetpack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (speedLevel < 3 && !isJetpack) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const activeCount = isJetpack ? 16 : Math.min((speedLevel - 2) * 3, 14);
    const lines = Array.from({ length: 18 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radiusRatio: 0.72 + Math.random() * 0.25,
      speed: 0.015 + Math.random() * 0.02,
      opacity: 0.12 + Math.random() * 0.14,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.hypot(cx, cy);

      ctx.lineWidth = 1.25;

      for (let i = 0; i < activeCount; i++) {
        const l = lines[i];
        l.radiusRatio += l.speed;
        if (l.radiusRatio > 1.02) {
          l.radiusRatio = 0.72;
          l.angle = Math.random() * Math.PI * 2;
        }

        // Only draw in the outer 72%..100% edge zone so the center track is untouched
        const rStart = l.radiusRatio * maxR;
        const rEnd = Math.min(1.04, l.radiusRatio + 0.07) * maxR;

        ctx.strokeStyle = isJetpack
          ? `rgba(56, 189, 248, ${l.opacity})`
          : `rgba(255, 255, 255, ${l.opacity})`;

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(l.angle) * rStart, cy + Math.sin(l.angle) * rStart);
        ctx.lineTo(cx + Math.cos(l.angle) * rEnd, cy + Math.sin(l.angle) * rEnd);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [speedLevel, isJetpack]);

  if (speedLevel < 3 && !isJetpack) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
};
