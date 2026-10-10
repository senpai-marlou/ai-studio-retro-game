/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ArcadeCabinet, HighScoreEntry } from './components/ArcadeCabinet';
import { VaporwaveMusicPlayer } from './components/VaporwaveMusicPlayer';
import { HallOfFameModal } from './components/HallOfFameModal';
import { HowToPlayModal } from './components/HowToPlayModal';

export default function App() {
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Default leaderboard entries (synced with ArcadeCabinet)
  const defaultLeaderboard: HighScoreEntry[] = [
    { initials: 'NEO', score: 14200, wave: 5, date: '1984.10.10' },
    { initials: 'RAD', score: 10850, wave: 4, date: '1984.10.09' },
    { initials: 'VPR', score: 7900, wave: 3, date: '1984.10.08' },
    { initials: 'SYN', score: 5600, wave: 2, date: '1984.10.07' },
    { initials: 'OUT', score: 3800, wave: 2, date: '1984.10.06' },
  ];

  const getLeaderboard = (): HighScoreEntry[] => {
    try {
      const saved = localStorage.getItem('vaporwave_invaders_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultLeaderboard;
  };

  const arcadeRef = useRef<HTMLDivElement | null>(null);
  const musicRef = useRef<HTMLDivElement | null>(null);

  const scrollToGame = () => {
    arcadeRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMusic = () => {
    musicRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090014] text-pink-50 relative flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* 80s Vaporwave Background Environment */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080012] via-[#1a0033] to-[#3a014c] opacity-90" />

        {/* Segmented 80s Vaporwave Sunset Sun */}
        <div className="absolute left-1/2 -translate-x-1/2 top-12 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-b from-[#ffe600] via-[#ff2a85] to-[#7928ca] opacity-40 blur-[1px] shadow-[0_0_80px_rgba(255,42,133,0.5)]">
          {/* Horizontal sun slices */}
          <div className="absolute inset-0 flex flex-col justify-end gap-1.5 pb-2 overflow-hidden rounded-full">
            <div className="w-full h-1 bg-[#090014]/80" />
            <div className="w-full h-1.5 bg-[#090014]/80" />
            <div className="w-full h-2 bg-[#090014]/80" />
            <div className="w-full h-2.5 bg-[#090014]/80" />
            <div className="w-full h-3 bg-[#090014]/80" />
            <div className="w-full h-4 bg-[#090014]/90" />
          </div>
        </div>

        {/* 3D Moving Perspective Wireframe Grid */}
        <div className="absolute bottom-0 inset-x-0 h-64 vapor-grid opacity-60" />

        {/* Horizon Glow Line */}
        <div className="absolute bottom-64 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 shadow-[0_0_15px_#00f0ff]" />
      </div>

      {/* Top Bar Header */}
      <Header
        onOpenHallOfFame={() => setIsHallOfFameOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onScrollToGame={scrollToGame}
        onScrollToMusic={scrollToMusic}
      />

      {/* Main Content Arena */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-3 sm:px-6 pt-4 pb-16 max-w-5xl mx-auto w-full">
        {/* Editorial Subheader Kicker */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-xs font-synth text-purple-400 mb-1">
            <span>ARCADE CABINET</span>
            <span aria-hidden="true">·</span>
            <span>SYNTHWAVE CASSETTE AUDIO</span>
            <span aria-hidden="true">·</span>
            <span>STEREO HI-FI</span>
          </div>
          <h1 className="font-synth font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-200 to-cyan-300 tracking-wider">
            SPACE INVADERS '84
          </h1>
        </div>

        {/* Center Game Window: Space Invaders Arcade Cabinet */}
        <section ref={arcadeRef} id="arcade" className="w-full mb-2">
          <ArcadeCabinet />
        </section>

        {/* Background Synthwave Music Player */}
        <section ref={musicRef} id="music-player" className="w-full">
          <VaporwaveMusicPlayer />
        </section>

        {/* Vaporwave Culture / Aesthetic Features Callout Strip */}
        <div className="w-full max-w-4xl mt-8 pt-6 border-t border-purple-900/50 flex flex-wrap items-center justify-between gap-4 text-xs font-synth text-purple-400">
          <div className="flex items-center gap-2">
            <span className="text-pink-400 font-bold">1980s SYNTH ENGINE</span>
            <span>·</span>
            <span>Sub-bass, Poly-pads, Arpeggios & Drum Synthesis</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Control Manual
            </button>
            <span>·</span>
            <button
              onClick={() => setIsHallOfFameOpen(true)}
              className="hover:text-yellow-300 transition-colors cursor-pointer"
            >
              Hall of Fame Leaderboard
            </button>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 w-full border-t border-purple-900/60 py-4 px-6 text-center text-xs text-purple-400/80 font-synth">
        <p>
          Neon Invaders · 1980s Vaporwave Space Arcade & Synthwave Audio Synthesizer
        </p>
      </footer>

      {/* Modals */}
      <HallOfFameModal
        isOpen={isHallOfFameOpen}
        onClose={() => setIsHallOfFameOpen(false)}
        entries={getLeaderboard()}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
