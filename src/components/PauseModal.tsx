import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onMainMenu }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl text-center">
        <h2 className="font-mono text-3xl font-black text-sky-400">GAME PAUSED</h2>
        <p className="mt-1 text-xs text-slate-400">Take a breather and hop back in when ready!</p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-sky-500 py-3.5 font-mono text-base font-bold text-white transition hover:bg-sky-400 active:scale-95"
          >
            <Play className="h-5 w-5 fill-white" /> RESUME RUN
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-700 bg-slate-800 py-3 font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            <RotateCcw className="h-5 w-5" /> RESTART
          </button>
          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-700 bg-slate-800 py-3 font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            <Home className="h-5 w-5" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
