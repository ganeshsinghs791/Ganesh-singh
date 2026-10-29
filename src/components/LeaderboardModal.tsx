import React, { useState } from 'react';
import { LeaderboardEntry } from '../types/game';
import { Trophy, Medal, X, Coins, Play, User, Check, Edit3 } from 'lucide-react';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  highScore: number;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onPlayAgain?: () => void;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  highScore,
  playerName,
  onUpdatePlayerName,
  onPlayAgain,
  onClose,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const handleSaveName = () => {
    const trimmed = nameInput.trim() || 'Runner';
    onUpdatePlayerName(trimmed);
    setNameInput(trimmed);
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative flex w-full max-w-lg flex-col rounded-3xl border border-amber-500/30 bg-slate-900/95 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-mono text-2xl font-black text-amber-300">LEADERBOARD</h2>
              <p className="text-xs text-slate-400">Top 5 Highest Scores & Coins Collected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Player Name + Personal Best Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-2xl border border-sky-500/30 bg-sky-950/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <User className="h-5 w-5 text-sky-400 shrink-0" />
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nameInput}
                  maxLength={14}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                  className="w-32 rounded-lg border border-sky-400 bg-slate-950 px-2.5 py-1 text-xs font-bold text-white outline-none"
                  placeholder="Your Name"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    PLAYER NAME
                  </span>
                  <span className="font-mono text-sm font-black text-white">{playerName}</span>
                </div>
                <button
                  onClick={() => {
                    setNameInput(playerName);
                    setIsEditingName(true);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:text-white"
                  title="Edit Player Name"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:border-l sm:border-slate-700/60 sm:pl-4">
            <Medal className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                YOUR BEST SCORE
              </span>
              <span className="font-mono text-base font-black text-amber-300">
                {highScore.toLocaleString()} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Sleek Top 5 Table: Rank, Player Name, Score, Coins Collected */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          {/* Table Header */}
          <div className="grid grid-cols-12 items-center border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <div className="col-span-2">Rank</div>
            <div className="col-span-4">Player Name</div>
            <div className="col-span-3 text-right">Score</div>
            <div className="col-span-3 text-right">Coins</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-800/70">
            {entries.slice(0, 5).map((entry, index) => {
              const isCurrentUser =
                entry.isCurrentPlayer ||
                entry.playerName.toLowerCase() === playerName.toLowerCase() ||
                entry.playerName === 'You';

              return (
                <div
                  key={entry.id || index}
                  className={`grid grid-cols-12 items-center px-4 py-3 transition ${
                    isCurrentUser
                      ? 'bg-emerald-500/15 border-l-4 border-l-emerald-400'
                      : index === 0
                      ? 'bg-amber-500/10'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-black ${
                        index === 0
                          ? 'bg-amber-400 text-black shadow'
                          : index === 1
                          ? 'bg-slate-300 text-black'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </div>

                  {/* Player Name */}
                  <div className="col-span-4 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold text-sm truncate ${
                          isCurrentUser ? 'text-emerald-300' : 'text-white'
                        }`}
                      >
                        {entry.playerName}
                      </span>
                      {isCurrentUser && (
                        <span className="rounded bg-emerald-500/25 border border-emerald-400/40 px-1.5 py-0.2 font-mono text-[9px] font-black text-emerald-300">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {entry.characterName} · {entry.distance}m
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-3 text-right font-mono text-sm font-black text-amber-300 tabular-nums">
                    {entry.score.toLocaleString()}
                  </div>

                  {/* Coins Collected */}
                  <div className="col-span-3 flex items-center justify-end gap-1 font-mono text-xs font-bold text-amber-200 tabular-nums">
                    <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{entry.coins.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex gap-2">
          {onPlayAgain && (
            <button
              onClick={() => {
                onClose();
                onPlayAgain();
              }}
              className="flex items-center justify-center gap-2 flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 font-mono text-sm font-black text-black shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] active:scale-95"
            >
              <Play className="h-4 w-4 fill-black" />
              START RUN
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 flex-1 rounded-2xl border border-slate-700 bg-slate-800 py-3 font-bold text-sm text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
