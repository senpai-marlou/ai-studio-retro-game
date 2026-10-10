import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio, Disc3, Activity, ListMusic } from 'lucide-react';
import { synthEngine, TRACKS, TrackInfo } from '../audio/synthEngine';

export const VaporwaveMusicPlayer: React.FC = () => {
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playbackState, setPlaybackState] = useState(() => synthEngine.getPlaybackState());
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave'>('bars');
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);

  // Subscribe to synth engine updates
  useEffect(() => {
    const unsubscribe = synthEngine.subscribe(() => {
      setPlaybackState(synthEngine.getPlaybackState());
    });
    return () => unsubscribe();
  }, []);

  // Real-time Visualizer Canvas Animation
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const analyser = synthEngine.getAnalyser();
      const W = canvas.width;
      const H = canvas.height;

      // Dark background
      ctx.fillStyle = '#100522';
      ctx.fillRect(0, 0, W, H);

      if (!analyser || !playbackState.isPlaying) {
        // Idle ambient subtle vaporwave pulse line
        ctx.strokeStyle = 'rgba(255, 42, 133, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const midY = H / 2;
        for (let x = 0; x < W; x += 4) {
          const y = midY + Math.sin(x * 0.05 + Date.now() * 0.003) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        animId = requestAnimationFrame(render);
        return;
      }

      if (visualizerMode === 'bars') {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = 36;
        const barWidth = (W / barCount) - 2;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor(i * (bufferLength / barCount) * 0.65);
          const val = dataArray[dataIndex] || 0;
          const barHeight = Math.max(3, (val / 255) * (H - 8));
          const x = i * (barWidth + 2);
          const y = H - barHeight;

          // Gradient from deep violet to hot pink to cyan
          const grad = ctx.createLinearGradient(0, H, 0, y);
          grad.addColorStop(0, '#7928ca');
          grad.addColorStop(0.5, '#ff2a85');
          grad.addColorStop(1, '#00f0ff');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Top phosphor peak
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(x, Math.max(0, y - 2), barWidth, 2);
        }
      } else {
        // Oscilloscope Waveform Mode
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = W / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * H) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.lineTo(W, H / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [playbackState.isPlaying, visualizerMode]);

  const handlePlayPause = () => {
    synthEngine.togglePlay();
  };

  const handleNext = () => {
    synthEngine.nextTrack();
  };

  const handlePrev = () => {
    synthEngine.prevTrack();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted) setIsMuted(false);
    synthEngine.setMusicVolume(val);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      synthEngine.setMusicVolume(volume);
    } else {
      setIsMuted(true);
      synthEngine.setMusicVolume(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const { currentTrack, elapsedSeconds, isPlaying } = playbackState;
  const progressPercent = Math.min(100, (elapsedSeconds / currentTrack.duration) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-gradient-to-b from-[#190634] to-[#0f0322] border-2 border-pink-500/50 rounded-xl p-4 sm:p-6 shadow-[0_0_30px_rgba(157,78,221,0.25)]">
      {/* Deck Top Header: Cassette Brand & Specs */}
      <div className="flex items-center justify-between border-b border-purple-800/80 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="font-synth text-sm text-pink-300 font-bold tracking-wider">
              SYNTHWAVE CASSETTE DECK · MODEL-1984
            </h3>
            <p className="text-[11px] text-purple-400">
              Analog WebAudio Synthesis · High-Fidelity Tape Deck
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Visualizer Mode Toggle */}
          <button
            onClick={() => setVisualizerMode(visualizerMode === 'bars' ? 'wave' : 'bars')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-purple-950/80 hover:bg-purple-900 text-xs font-synth text-cyan-300 border border-cyan-500/40 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{visualizerMode === 'bars' ? 'SPECTRUM' : 'OSCILLOSCOPE'}</span>
          </button>

          {/* Playlist Drawer Toggle */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-synth border transition-colors ${
              showPlaylist
                ? 'bg-pink-600/30 border-pink-400 text-pink-300'
                : 'bg-purple-950/80 hover:bg-purple-900 border-purple-700 text-purple-300'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>TRACKS (3)</span>
          </button>
        </div>
      </div>

      {/* Center Console: Cassette Graphic & Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch mb-5">
        {/* Cassette Tape Simulation (Left 7 cols) */}
        <div className="md:col-span-7 bg-[#140428] border-2 border-purple-900 rounded-lg p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
          {/* Cassette Label Header */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-800/50">
            <span className="text-[10px] font-arcade text-pink-400 tracking-wider">SIDE A · STEREO</span>
            <span className="text-[10px] font-arcade text-cyan-300 tabular-nums">
              BPM: {currentTrack.bpm}
            </span>
          </div>

          {/* Tape Body & Spinning Reels */}
          <div className="my-3 py-4 px-6 bg-gradient-to-r from-purple-950 via-[#1c0836] to-purple-950 rounded-md border border-purple-700/60 flex items-center justify-around relative">
            {/* Left Reel */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-14 h-14 rounded-full border-4 border-dashed border-cyan-400/80 bg-purple-950 flex items-center justify-center ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_8px_#ff2a85]" />
              </div>
            </div>

            {/* Center Tape Window & Magnetic Tape Strip */}
            <div className="w-28 h-10 bg-black/80 rounded border border-purple-700 flex flex-col justify-center items-center px-2">
              <div className="w-full h-2 bg-[#2d124d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[9px] font-arcade text-purple-400 mt-1 tabular-nums">
                {formatTime(elapsedSeconds)} / {formatTime(currentTrack.duration)}
              </span>
            </div>

            {/* Right Reel */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-14 h-14 rounded-full border-4 border-dashed border-pink-400/80 bg-purple-950 flex items-center justify-center ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              </div>
            </div>
          </div>

          {/* Now Playing Title & Description */}
          <div className="mt-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="font-synth text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-300 truncate">
                {currentTrack.title}
              </h4>
              <span className="text-xs text-purple-300 font-synth whitespace-nowrap">
                {currentTrack.artist}
              </span>
            </div>
            <p className="text-[11px] text-purple-400/90 truncate mt-0.5">
              {currentTrack.description}
            </p>
          </div>
        </div>

        {/* Real-time Spectrum/Waveform Canvas (Right 5 cols) */}
        <div className="md:col-span-5 bg-[#140428] border-2 border-purple-900 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-synth text-cyan-400 mb-2">
            <span>REAL-TIME ANALYZER</span>
            <span className="text-pink-400 font-arcade text-[9px]">
              {isPlaying ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="w-full h-32 rounded bg-[#0b001a] border border-purple-800/80 overflow-hidden relative">
            <canvas
              ref={visualizerCanvasRef}
              width={280}
              height={128}
              className="w-full h-full block"
            />
          </div>

          <div className="mt-2 text-[10px] text-purple-400 flex justify-between">
            <span>20 Hz</span>
            <span>1 kHz</span>
            <span>16 kHz</span>
          </div>
        </div>
      </div>

      {/* Playlist Selector Dropdown / Drawer */}
      {showPlaylist && (
        <div className="mb-4 bg-[#140428] border border-pink-500/40 rounded-lg p-3">
          <div className="text-xs font-synth text-pink-300 mb-2 font-semibold">
            AVAILABLE SOUNDTRACKS:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TRACKS.map((track, idx) => {
              const isSelected = playbackState.currentTrackIndex === idx;
              return (
                <button
                  key={track.id}
                  onClick={() => synthEngine.selectTrack(idx)}
                  className={`p-2.5 rounded text-left border transition-all ${
                    isSelected
                      ? 'bg-purple-900/80 border-pink-400 text-white shadow-[0_0_10px_rgba(255,42,133,0.3)]'
                      : 'bg-purple-950/40 border-purple-800/70 text-purple-300 hover:bg-purple-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-arcade text-cyan-300">
                      0{idx + 1}. {track.bpm} BPM
                    </span>
                    {isSelected && isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                    )}
                  </div>
                  <div className="font-synth text-xs font-bold truncate text-pink-200">
                    {track.title}
                  </div>
                  <div className="text-[10px] text-purple-400 truncate mt-0.5">
                    {track.genre}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Audio Transport Controls (Play, Pause, Skip, Progress, Volume) */}
      <div className="bg-[#120324] border border-purple-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-purple-950 hover:bg-purple-900 text-pink-300 border border-purple-700 transition-colors"
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-synth font-bold text-sm border border-pink-400 shadow-[0_0_15px_rgba(255,42,133,0.5)] flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-purple-950 hover:bg-purple-900 text-pink-300 border border-purple-700 transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar with Timestamp */}
        <div className="flex-1 min-w-[200px] flex items-center gap-3">
          <span className="text-[11px] font-arcade text-purple-400 tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
          <div className="flex-1 h-2 bg-purple-950 rounded-full overflow-hidden border border-purple-800">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-arcade text-purple-400 tabular-nums">
            {formatTime(currentTrack.duration)}
          </span>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded hover:bg-purple-900 text-pink-400 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-purple-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 accent-pink-500 cursor-pointer h-1.5 bg-purple-950 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
