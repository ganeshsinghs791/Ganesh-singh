import React from 'react';
import { AudioSettings } from '../types/game';
import { X, Volume2, Music, Sliders } from 'lucide-react';

interface SettingsModalProps {
  audioSettings: AudioSettings;
  onUpdateAudio: (sound: boolean, music: boolean, vol: number) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  audioSettings,
  onUpdateAudio,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="relative flex w-full max-w-md flex-col rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-6 w-6 text-purple-400" />
            <h2 className="font-mono text-xl font-black text-purple-300">SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Sound Effects</h3>
                <p className="text-xs text-slate-400">Coin, Jump, Crash audio chimes</p>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateAudio(!audioSettings.soundEnabled, audioSettings.musicEnabled, audioSettings.volume)
              }
              className={`h-7 w-12 rounded-full p-1 transition ${
                audioSettings.soundEnabled ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white transition ${
                  audioSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Music Synth Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Background Music</h3>
                <p className="text-xs text-slate-400">Chiptune arcade synth soundtrack</p>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateAudio(audioSettings.soundEnabled, !audioSettings.musicEnabled, audioSettings.volume)
              }
              className={`h-7 w-12 rounded-full p-1 transition ${
                audioSettings.musicEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white transition ${
                  audioSettings.musicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Audio Volume</span>
              <span className="font-mono text-xs text-slate-400">
                {Math.round(audioSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioSettings.volume}
              onChange={e =>
                onUpdateAudio(
                  audioSettings.soundEnabled,
                  audioSettings.musicEnabled,
                  parseFloat(e.target.value)
                )
              }
              className="h-2 w-full accent-amber-400 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
