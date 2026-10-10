import React from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { synthEngine } from '../audio/synthEngine';

interface HeaderProps {
  onOpenHallOfFame: () => void;
  onOpenHowToPlay: () => void;
  onScrollToGame: () => void;
  onScrollToMusic: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHallOfFame,
  onOpenHowToPlay,
  onScrollToGame,
  onScrollToMusic,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0b001a]/90 border-b border-purple-900/60 flex items-center justify-between gap-8 px-6 py-3.5 max-w-7xl mx-auto">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={onScrollToGame}
        className="text-lg sm:text-xl font-synth font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-300 to-cyan-400 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity text-left cursor-pointer"
      >
        NEON INVADERS '84
      </button>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-synth font-medium text-purple-300">
        <button
          type="button"
          onClick={onScrollToGame}
          className="hover:text-pink-300 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 decoration-pink-500 cursor-pointer"
        >
          Arcade
        </button>
        <button
          type="button"
          onClick={onScrollToMusic}
          className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 decoration-cyan-400 cursor-pointer"
        >
          Synthwave Deck
        </button>
        <button
          type="button"
          onClick={onOpenHallOfFame}
          className="hover:text-yellow-300 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 decoration-yellow-400 cursor-pointer"
        >
          Hall of Fame
        </button>
        <button
          type="button"
          onClick={onOpenHowToPlay}
          className="hover:text-purple-100 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 decoration-purple-400 cursor-pointer"
        >
          Instructions
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            synthEngine.togglePlay();
          }}
          className="px-4 py-1.5 text-xs font-synth font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded border border-pink-400 shadow-[0_0_12px_rgba(255,42,133,0.4)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          Insert Coin / Play
        </button>
      </div>
    </header>
  );
};
