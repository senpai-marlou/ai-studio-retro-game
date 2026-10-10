import React from 'react';
import { HelpCircle, X, Shield, Zap, Sparkles, Crosshair } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#16052d] border-2 border-cyan-400 rounded-xl p-6 shadow-[0_0_40px_rgba(0,240,255,0.3)] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-purple-400 hover:text-cyan-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-purple-800 pb-3">
          <HelpCircle className="w-6 h-6 text-cyan-400" />
          <h2 className="font-arcade text-sm text-cyan-300 tracking-wider">
            FLIGHT INSTRUCTIONS & RULES
          </h2>
        </div>

        <div className="space-y-4 text-xs font-sans text-purple-200">
          <div>
            <h4 className="font-arcade text-[11px] text-pink-400 mb-1 flex items-center gap-2">
              <Crosshair className="w-4 h-4" /> SHIP CONTROLS
            </h4>
            <ul className="space-y-1 list-disc list-inside text-purple-300 ml-1">
              <li><strong className="text-pink-300">A / D</strong> or <strong className="text-pink-300">Arrow Left / Right</strong>: Move starfighter horizontally.</li>
              <li><strong className="text-pink-300">SPACE</strong> or <strong className="text-pink-300">Arrow Up / W</strong>: Fire neon laser cannon.</li>
              <li><strong className="text-pink-300">P / ESC</strong>: Pause simulation.</li>
              <li>Touch buttons provided below cabinet for mobile screens.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-arcade text-[11px] text-cyan-400 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4" /> ENEMIES & TARGETS
            </h4>
            <ul className="space-y-1 text-purple-300">
              <li>• <span className="text-pink-400 font-bold">Squid</span> (Top Row): 30 pts</li>
              <li>• <span className="text-cyan-400 font-bold">Crab</span> (Middle Rows): 20 pts</li>
              <li>• <span className="text-yellow-400 font-bold">Octopus</span> (Bottom Rows): 10 pts</li>
              <li>• <span className="text-red-400 font-bold">Mystery Flying Saucer</span>: 100 - 300 pts when shot down at top!</li>
            </ul>
          </div>

          <div>
            <h4 className="font-arcade text-[11px] text-yellow-400 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> POWER-UP CRATES
            </h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded bg-purple-950/60 border border-cyan-500/40">
                <span className="font-arcade text-[10px] text-cyan-300">[T] TWIN LASER</span>
                <p className="text-[11px] text-purple-300 mt-0.5">Fires two parallel lasers</p>
              </div>
              <div className="p-2 rounded bg-purple-950/60 border border-pink-500/40">
                <span className="font-arcade text-[10px] text-pink-300">[R] RAPID FIRE</span>
                <p className="text-[11px] text-purple-300 mt-0.5">Maximum firing rate</p>
              </div>
              <div className="p-2 rounded bg-purple-950/60 border border-emerald-500/40">
                <span className="font-arcade text-[10px] text-emerald-300">[S] SHIELD</span>
                <p className="text-[11px] text-purple-300 mt-0.5">Absorbs 1 direct hit</p>
              </div>
              <div className="p-2 rounded bg-purple-950/60 border border-amber-500/40">
                <span className="font-arcade text-[10px] text-amber-300">[N] MEGA NUKE</span>
                <p className="text-[11px] text-purple-300 mt-0.5">Destroys alien wave section</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-arcade text-[11px] text-purple-300 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4" /> BUNKER DEFENSE
            </h4>
            <p className="text-purple-300 text-xs">
              Take cover behind the 4 blue defense bunkers. Bunkers erode block-by-block under fire from alien bombs or player lasers.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-arcade text-xs rounded border border-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          READY FOR BATTLE
        </button>
      </div>
    </div>
  );
};
