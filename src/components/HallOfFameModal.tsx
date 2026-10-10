import React from 'react';
import { Trophy, X } from 'lucide-react';
import { HighScoreEntry } from './ArcadeCabinet';

interface HallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HighScoreEntry[];
}

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#16052d] border-2 border-pink-500 rounded-xl p-6 shadow-[0_0_40px_rgba(255,42,133,0.4)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-purple-400 hover:text-pink-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 border-b border-purple-800 pb-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h2 className="font-arcade text-sm text-pink-300 tracking-wider">
            HALL OF FAME
          </h2>
        </div>

        {/* Table of High Scores */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[10px] font-synth text-purple-400 border-b border-purple-900 pb-1 px-2">
            <span>RANK · INITIALS</span>
            <span>STAGE</span>
            <span>SCORE</span>
          </div>

          {entries.map((entry, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded font-arcade text-xs border ${
                  isFirst
                    ? 'bg-yellow-500/15 border-yellow-400/60 text-yellow-300 shadow-[0_0_10px_rgba(255,183,3,0.2)]'
                    : isSecond
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-200'
                    : isThird
                    ? 'bg-pink-500/10 border-pink-400/40 text-pink-200'
                    : 'bg-purple-950/40 border-purple-900 text-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-purple-400 w-4">
                    #{idx + 1}
                  </span>
                  <span className="font-bold tracking-widest">
                    {entry.initials}
                  </span>
                </div>

                <div className="text-[10px] text-purple-300 font-synth">
                  STAGE 0{entry.wave}
                </div>

                <div className="font-bold tabular-nums">
                  {entry.score.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-arcade text-xs rounded border border-pink-400 transition-colors shadow-[0_0_15px_rgba(255,42,133,0.4)]"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
