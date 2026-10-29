import React, { useState, useEffect } from 'react';
import { Zap, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(55), 180);
    const timer2 = setTimeout(() => setProgress(88), 360);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(onLoaded, 140);
    }, 550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onLoaded]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950 p-6 text-white select-none">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Animated Icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 shadow-xl shadow-amber-500/10">
          <Zap className="h-8 w-8 animate-pulse" />
        </div>

        <h3 className="mt-4 font-mono text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-indigo-300">
          PRE-WARMING TRACKS
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Compiling 3D subway shaders & warming object pools...
        </p>

        {/* Progress Bar */}
        <div className="mt-5 w-full">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5 font-bold">
            <span>READYING RUNNER</span>
            <span className="text-amber-300">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-sky-400 to-amber-300 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pro Tip */}
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-300">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-[11px]">Tip: Double-tap or press SHIFT for an emergency Skateboard extra life!</span>
        </div>
      </div>
    </div>
  );
};
