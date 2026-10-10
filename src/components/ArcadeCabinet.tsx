import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Zap, Sparkles, ChevronLeft, ChevronRight, Pause, Award } from 'lucide-react';
import { synthEngine } from '../audio/synthEngine';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'WAVE_CLEARED' | 'GAME_OVER';

export interface HighScoreEntry {
  initials: string;
  score: number;
  wave: number;
  date: string;
}

const STORAGE_HIGH_SCORE_KEY = 'vaporwave_invaders_high_score';
const STORAGE_LEADERBOARD_KEY = 'vaporwave_invaders_leaderboard';

// Invader pixel matrix designs (1 = pixel filled, 0 = empty)
const SQUID_SPRITE = [
  // Frame 0
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1]
  ],
  // Frame 1
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,0,0,0,1,0],
    [1,0,0,1,1,0,0,1],
    [0,1,0,0,0,0,1,0]
  ]
];

const CRAB_SPRITE = [
  // Frame 0
  [
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,1,0,1,1,0,0,0]
  ],
  // Frame 1
  [
    [0,0,1,0,0,0,0,0,1,0,0],
    [1,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,1,1,0,1,1,1,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,1,0]
  ]
];

const OCTOPUS_SPRITE = [
  // Frame 0
  [
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,1,1,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,1,0,1,1,0,1,1,0,0],
    [1,1,0,0,0,0,0,0,0,0,1,1]
  ],
  // Frame 1
  [
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,1,1,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,1,0,0,1,1,1,1,0,0,1,0],
    [0,0,1,0,0,0,0,0,0,1,0,0]
  ]
];

const UFO_SPRITE = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0]
];

const PLAYER_SPRITE = [
  [0,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,1,1]
];

interface Invader {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'squid' | 'crab' | 'octopus';
  points: number;
  alive: boolean;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'twin' | 'rapid' | 'shield' | 'nuke';
  color: string;
  label: string;
  vy: number;
}

interface BunkerBlock {
  x: number;
  y: number;
  size: number;
  hp: number; // 2 = solid, 1 = cracked, 0 = destroyed
}

export const ArcadeCabinet: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High score state with localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 5000;
    } catch {
      return 5000;
    }
  });

  const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LEADERBOARD_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      { initials: 'NEO', score: 14200, wave: 5, date: '1984.10.10' },
      { initials: 'RAD', score: 10850, wave: 4, date: '1984.10.09' },
      { initials: 'VPR', score: 7900, wave: 3, date: '1984.10.08' },
      { initials: 'SYN', score: 5600, wave: 2, date: '1984.10.07' },
      { initials: 'OUT', score: 3800, wave: 2, date: '1984.10.06' },
    ];
  });

  // Display and game parameters
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [scanlinesActive, setScanlinesActive] = useState<boolean>(true);
  const [crtGlow, setCrtGlow] = useState<boolean>(true);
  const [sfxMuted, setSfxMuted] = useState<boolean>(false);
  const [activePowerUpName, setActivePowerUpName] = useState<string | null>(null);

  // Initials input for game over
  const [initials, setInitials] = useState<string>('AAA');
  const [submittedScore, setSubmittedScore] = useState<boolean>(false);

  // Game internal mutable state refs
  const stateRef = useRef({
    gameState: 'TITLE_MENU' as GameState,
    score: 0,
    wave: 1,
    lives: 3,
    highScore: 5000,
    playerX: 300,
    playerY: 480,
    playerSpeed: 4.8,
    playerShootCooldown: 0,
    shootCooldownMax: 18,
    hasShield: false,
    powerUpTimer: 0,
    powerUpType: null as 'twin' | 'rapid' | 'shield' | 'nuke' | null,
    multiplier: 1,
    multiplierTimer: 0,

    // Invaders
    invaders: [] as Invader[],
    invaderDir: 1,
    invaderStepTimer: 0,
    invaderStepInterval: 45,
    invaderDropStep: false,
    invaderAnimFrame: 0,
    stepAudioCounter: 0,

    // UFO Mystery Ship
    ufo: null as { x: number; y: number; speed: number; points: number } | null,
    ufoSpawnTimer: 400,

    // Projectiles & Objects
    bullets: [] as Bullet[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    bunkers: [] as BunkerBlock[],

    // Controls
    keys: {
      left: false,
      right: false,
      fire: false,
    },

    screenShake: 0,
  });

  // Sync state ref with React states
  useEffect(() => {
    stateRef.current.highScore = highScore;
  }, [highScore]);

  // Save leaderboard to storage
  const saveLeaderboard = (newBoard: HighScoreEntry[]) => {
    setLeaderboard(newBoard);
    try {
      localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(newBoard));
    } catch {
      // ignore
    }
  };

  const handleScoreSubmission = () => {
    if (submittedScore) return;
    const cleanInitials = (initials || 'AAA').toUpperCase().slice(0, 3);
    const newEntry: HighScoreEntry = {
      initials: cleanInitials,
      score: currentScore,
      wave,
      date: new Date().toISOString().slice(0, 10).replace(/-/g, '.')
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    saveLeaderboard(updated);
    setSubmittedScore(true);
  };

  // Build destructible bunkers
  const createBunkers = useCallback((width: number) => {
    const bunkers: BunkerBlock[] = [];
    const bunkerCount = 4;
    const bunkerY = 410;
    const blockSize = 4;
    const bunkerWidthBlocks = 14;
    const bunkerHeightBlocks = 10;
    const totalBunkerPx = bunkerWidthBlocks * blockSize;
    const spacing = (width - 60 - bunkerCount * totalBunkerPx) / (bunkerCount - 1);

    for (let b = 0; b < bunkerCount; b++) {
      const startX = 30 + b * (totalBunkerPx + spacing);

      for (let r = 0; r < bunkerHeightBlocks; r++) {
        for (let c = 0; c < bunkerWidthBlocks; c++) {
          // Carve out archway at bottom center
          if (r >= 6 && c >= 4 && c <= 9) continue;
          // Carve top corner slopes
          if (r === 0 && (c < 2 || c > 11)) continue;
          if (r === 1 && (c < 1 || c > 12)) continue;

          bunkers.push({
            x: startX + c * blockSize,
            y: bunkerY + r * blockSize,
            size: blockSize,
            hp: 2,
          });
        }
      }
    }
    return bunkers;
  }, []);

  // Initialize Invader Formation
  const createInvaders = useCallback((waveNum: number) => {
    const invaders: Invader[] = [];
    const rows = 5;
    const cols = 11;
    const startX = 60;
    const startY = 65 + Math.min(30, (waveNum - 1) * 8); // Start lower on later waves
    const spacingX = 46;
    const spacingY = 32;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: 'squid' | 'crab' | 'octopus' = 'octopus';
        let points = 10;
        let color = '#b5179e';
        let w = 24;
        let h = 16;

        if (r === 0) {
          type = 'squid';
          points = 30;
          color = '#ff2a85';
          w = 20;
        } else if (r === 1 || r === 2) {
          type = 'crab';
          points = 20;
          color = '#00f0ff';
          w = 26;
        } else {
          type = 'octopus';
          points = 10;
          color = '#ffb703';
          w = 26;
        }

        invaders.push({
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          width: w,
          height: h,
          type,
          points,
          alive: true,
          color,
        });
      }
    }
    return invaders;
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    synthEngine.play(); // Auto-start background synth music if not playing!

    const s = stateRef.current;
    s.gameState = 'PLAYING';
    s.score = 0;
    s.wave = 1;
    s.lives = 3;
    s.playerX = 300;
    s.playerY = 480;
    s.playerSpeed = 4.8;
    s.bullets = [];
    s.powerUps = [];
    s.particles = [];
    s.floatingTexts = [];
    s.hasShield = false;
    s.powerUpType = null;
    s.powerUpTimer = 0;
    s.multiplier = 1;
    s.multiplierTimer = 0;
    s.invaderDir = 1;
    s.invaderStepInterval = 44;
    s.invaderStepTimer = 0;
    s.invaderAnimFrame = 0;
    s.ufo = null;
    s.ufoSpawnTimer = 500;
    s.invaders = createInvaders(1);
    s.bunkers = createBunkers(640);

    setGameState('PLAYING');
    setCurrentScore(0);
    setWave(1);
    setLives(3);
    setMultiplier(1);
    setActivePowerUpName(null);
    setSubmittedScore(false);
  }, [createInvaders, createBunkers]);

  // Next wave setup
  const advanceWave = useCallback(() => {
    const s = stateRef.current;
    s.wave += 1;
    s.gameState = 'PLAYING';
    s.playerX = 300;
    s.bullets = [];
    s.powerUps = [];
    s.particles = [];
    s.invaderDir = 1;
    // Faster baseline step per wave
    s.invaderStepInterval = Math.max(16, 44 - (s.wave - 1) * 5);
    s.invaderStepTimer = 0;
    s.ufo = null;
    s.ufoSpawnTimer = 350;
    s.invaders = createInvaders(s.wave);
    s.bunkers = createBunkers(640);

    setWave(s.wave);
    setGameState('PLAYING');
    synthEngine.playWaveClearSound();
  }, [createInvaders, createBunkers]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        s.keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        s.keys.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        s.keys.fire = true;
        if (s.gameState === 'TITLE_MENU') {
          startGame();
        }
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (s.gameState === 'PLAYING') {
          s.gameState = 'PAUSED';
          setGameState('PAUSED');
        } else if (s.gameState === 'PAUSED') {
          s.gameState = 'PLAYING';
          setGameState('PLAYING');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        s.keys.left = false;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        s.keys.right = false;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        s.keys.fire = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startGame]);

  // Main Canvas Render & Game Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Helper to draw pixel sprite matrices
    const drawPixelMatrix = (
      matrix: number[][],
      posX: number,
      posY: number,
      scale: number,
      fillColor: string,
      glow = false
    ) => {
      ctx.save();
      if (glow && crtGlow) {
        ctx.shadowColor = fillColor;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = fillColor;
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] === 1) {
            ctx.fillRect(posX + c * scale, posY + r * scale, scale, scale);
          }
        }
      }
      ctx.restore();
    };

    // Explosion particle spawner
    const spawnExplosion = (x: number, y: number, color: string, count = 16) => {
      const s = stateRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3.5;
        s.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          size: 2 + Math.random() * 2,
          life: 25 + Math.random() * 15,
        });
      }
    };

    // Update & Render loop
    const loop = () => {
      const s = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // Clear Canvas with retro deep space gradient
      ctx.save();
      if (s.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(shakeX, shakeY);
        s.screenShake *= 0.88;
        if (s.screenShake < 0.2) s.screenShake = 0;
      }

      ctx.fillStyle = '#0b001a';
      ctx.fillRect(0, 0, W, H);

      // Distant retro starfield
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 127 + Date.now() * 0.02) % W);
        const sy = (i * 91) % (H - 80);
        ctx.fillRect(sx, sy, (i % 3 === 0 ? 2 : 1), (i % 3 === 0 ? 2 : 1));
      }

      // Neon horizon bottom line
      ctx.strokeStyle = '#ff2a85';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 28);
      ctx.lineTo(W, H - 28);
      ctx.stroke();

      // State: TITLE MENU
      if (s.gameState === 'TITLE_MENU') {
        ctx.textAlign = 'center';

        // Title Logo
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff2a85';
        if (crtGlow) {
          ctx.shadowColor = '#ff2a85';
          ctx.shadowBlur = 12;
        }
        ctx.fillText('SPACE INVADERS', W / 2, 90);
        ctx.shadowBlur = 0;

        ctx.font = '11px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('— 1984 VAPORWAVE ARCADE EDITION —', W / 2, 120);

        // Score table showcase
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        const startListY = 175;

        // UFO Mystery
        drawPixelMatrix(UFO_SPRITE, W / 2 - 110, startListY, 2, '#ff007f', true);
        ctx.fillStyle = '#ff007f';
        ctx.fillText('=? MYSTERY UFO  [100-300 PTS]', W / 2 - 60, startListY + 12);

        // Squid
        drawPixelMatrix(SQUID_SPRITE[0], W / 2 - 100, startListY + 40, 2, '#ff2a85', true);
        ctx.fillStyle = '#ff2a85';
        ctx.fillText('= 30 POINTS (SQUID)', W / 2 - 60, startListY + 52);

        // Crab
        drawPixelMatrix(CRAB_SPRITE[0], W / 2 - 104, startListY + 80, 2, '#00f0ff', true);
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('= 20 POINTS (CRAB)', W / 2 - 60, startListY + 92);

        // Octopus
        drawPixelMatrix(OCTOPUS_SPRITE[0], W / 2 - 105, startListY + 120, 2, '#ffb703', true);
        ctx.fillStyle = '#ffb703';
        ctx.fillText('= 10 POINTS (OCTOPUS)', W / 2 - 60, startListY + 132);

        // Call to action
        const pulse = Math.sin(Date.now() * 0.006) * 0.4 + 0.6;
        ctx.textAlign = 'center';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
        ctx.fillText('PRESS SPACE OR CLICK START', W / 2, 395);

        ctx.font = '10px "Orbitron", sans-serif';
        ctx.fillStyle = '#9d4edd';
        ctx.fillText('CONTROLS: [A/D] OR [ARROWS] TO MOVE · [SPACE] TO SHOOT', W / 2, 435);
      }

      // State: PLAYING, PAUSED, WAVE_CLEARED, or GAME_OVER
      if (s.gameState === 'PLAYING' || s.gameState === 'PAUSED' || s.gameState === 'WAVE_CLEARED' || s.gameState === 'GAME_OVER') {
        // --- 1. Player Movement & Firing (Only if PLAYING) ---
        if (s.gameState === 'PLAYING') {
          if (s.keys.left && s.playerX > 18) {
            s.playerX -= s.playerSpeed;
          }
          if (s.keys.right && s.playerX < W - 46) {
            s.playerX += s.playerSpeed;
          }

          // Shoot Cooldown
          if (s.playerShootCooldown > 0) {
            s.playerShootCooldown--;
          }

          // Fire Laser
          if (s.keys.fire && s.playerShootCooldown <= 0) {
            synthEngine.playLaserSound();
            const isRapid = s.powerUpType === 'rapid';
            s.playerShootCooldown = isRapid ? 8 : s.shootCooldownMax;

            if (s.powerUpType === 'twin') {
              s.bullets.push({
                x: s.playerX + 4,
                y: s.playerY,
                vx: 0,
                vy: -8,
                isPlayer: true,
                color: '#00f0ff',
              });
              s.bullets.push({
                x: s.playerX + 22,
                y: s.playerY,
                vx: 0,
                vy: -8,
                isPlayer: true,
                color: '#00f0ff',
              });
            } else {
              s.bullets.push({
                x: s.playerX + 13,
                y: s.playerY,
                vx: 0,
                vy: -8,
                isPlayer: true,
                color: '#ff2a85',
              });
            }
          }

          // Multiplier decay timer
          if (s.multiplierTimer > 0) {
            s.multiplierTimer--;
            if (s.multiplierTimer === 0 && s.multiplier > 1) {
              s.multiplier = 1;
              setMultiplier(1);
            }
          }

          // Powerup duration timer
          if (s.powerUpTimer > 0) {
            s.powerUpTimer--;
            if (s.powerUpTimer === 0) {
              s.powerUpType = null;
              s.hasShield = false;
              s.playerSpeed = 4.8;
              setActivePowerUpName(null);
            }
          }

          // --- 2. Invader Step Logic ---
          const aliveInvaders = s.invaders.filter((inv) => inv.alive);
          if (aliveInvaders.length === 0 && s.gameState === 'PLAYING') {
            // Wave cleared!
            s.gameState = 'WAVE_CLEARED';
            setGameState('WAVE_CLEARED');
            synthEngine.playWaveClearSound();
          }

          // Speed scaling: as invaders decrease, interval drops
          const countAlive = aliveInvaders.length;
          const speedFactor = countAlive > 0 ? countAlive / 55 : 1;
          const currentStepInterval = Math.max(3, Math.floor(s.invaderStepInterval * speedFactor));

          s.invaderStepTimer++;
          if (s.invaderStepTimer >= currentStepInterval) {
            s.invaderStepTimer = 0;
            s.invaderAnimFrame = (s.invaderAnimFrame + 1) % 2;

            // Audio step tone
            synthEngine.playInvaderStep(s.stepAudioCounter++);

            let shiftDown = false;
            let edgeHit = false;

            // Check if formation touches boundaries
            for (const inv of aliveInvaders) {
              if (s.invaderDir === 1 && inv.x + inv.width >= W - 24) {
                edgeHit = true;
                break;
              } else if (s.invaderDir === -1 && inv.x <= 20) {
                edgeHit = true;
                break;
              }
            }

            if (edgeHit) {
              s.invaderDir *= -1;
              shiftDown = true;
            }

            // Move invaders
            for (const inv of aliveInvaders) {
              if (shiftDown) {
                inv.y += 16;
                // If invaders reached bunker/player height: Game Over!
                if (inv.y + inv.height >= 430) {
                  s.gameState = 'GAME_OVER';
                  setGameState('GAME_OVER');
                  synthEngine.playPlayerHit();
                }
              } else {
                inv.x += s.invaderDir * 10;
              }
            }

            // Invader firing chance
            if (Math.random() < 0.35 + s.wave * 0.05 && aliveInvaders.length > 0) {
              // Pick random column shooter
              const randomInvader = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
              s.bullets.push({
                x: randomInvader.x + randomInvader.width / 2,
                y: randomInvader.y + randomInvader.height,
                vx: 0,
                vy: 3.5 + s.wave * 0.3,
                isPlayer: false,
                color: '#ffb703',
              });
            }
          }

          // --- 3. UFO Mystery Ship Logic ---
          if (!s.ufo) {
            s.ufoSpawnTimer--;
            if (s.ufoSpawnTimer <= 0) {
              const ufoDirection = Math.random() < 0.5 ? 1 : -1;
              s.ufo = {
                x: ufoDirection === 1 ? -40 : W + 40,
                y: 36,
                speed: ufoDirection * 2.2,
                points: [100, 150, 200, 300][Math.floor(Math.random() * 4)],
              };
              synthEngine.startUfoSiren();
            }
          } else {
            s.ufo.x += s.ufo.speed;
            if (
              (s.ufo.speed > 0 && s.ufo.x > W + 60) ||
              (s.ufo.speed < 0 && s.ufo.x < -60)
            ) {
              s.ufo = null;
              s.ufoSpawnTimer = 450 + Math.random() * 300;
              synthEngine.stopUfoSiren();
            }
          }

          // --- 4. Bullets Movement & Collision ---
          for (let i = s.bullets.length - 1; i >= 0; i--) {
            const b = s.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // Remove bullets off screen
            if (b.y < 10 || b.y > H - 20) {
              s.bullets.splice(i, 1);
              continue;
            }

            let bulletRemoved = false;

            // Bunker Collision
            for (let bk = s.bunkers.length - 1; bk >= 0; bk--) {
              const bunker = s.bunkers[bk];
              if (
                b.x >= bunker.x &&
                b.x <= bunker.x + bunker.size &&
                b.y >= bunker.y &&
                b.y <= bunker.y + bunker.size
              ) {
                bunker.hp--;
                if (bunker.hp <= 0) {
                  s.bunkers.splice(bk, 1);
                }
                s.bullets.splice(i, 1);
                bulletRemoved = true;
                break;
              }
            }
            if (bulletRemoved) continue;

            // Player Bullet hits Invader or UFO
            if (b.isPlayer) {
              // UFO Hit
              if (
                s.ufo &&
                b.x >= s.ufo.x &&
                b.x <= s.ufo.x + 36 &&
                b.y >= s.ufo.y &&
                b.y <= s.ufo.y + 16
              ) {
                const ufoPts = s.ufo.points * s.multiplier;
                s.score += ufoPts;
                setCurrentScore(s.score);
                if (s.score > s.highScore) {
                  s.highScore = s.score;
                  setHighScore(s.score);
                  try {
                    localStorage.setItem(STORAGE_HIGH_SCORE_KEY, s.score.toString());
                  } catch {
                    // ignore
                  }
                }
                s.floatingTexts.push({
                  x: s.ufo.x + 10,
                  y: s.ufo.y,
                  text: `+${ufoPts}`,
                  color: '#ff007f',
                  alpha: 1,
                  vy: -1,
                });
                spawnExplosion(s.ufo.x + 18, s.ufo.y + 8, '#ff007f', 24);
                synthEngine.playAlienExplosion();
                synthEngine.stopUfoSiren();
                s.ufo = null;
                s.ufoSpawnTimer = 500 + Math.random() * 300;
                s.bullets.splice(i, 1);
                continue;
              }

              // Invader Hits
              for (const inv of aliveInvaders) {
                if (
                  b.x >= inv.x &&
                  b.x <= inv.x + inv.width &&
                  b.y >= inv.y &&
                  b.y <= inv.y + inv.height
                ) {
                  inv.alive = false;
                  s.bullets.splice(i, 1);

                  // Combo multiplier progression
                  s.multiplierTimer = 110;
                  if (s.multiplier < 4) {
                    s.multiplier += 1;
                    setMultiplier(s.multiplier);
                  }

                  const pts = inv.points * s.multiplier;
                  s.score += pts;
                  setCurrentScore(s.score);

                  // Update high score in real time
                  if (s.score > s.highScore) {
                    s.highScore = s.score;
                    setHighScore(s.score);
                    try {
                      localStorage.setItem(STORAGE_HIGH_SCORE_KEY, s.score.toString());
                    } catch {
                      // ignore
                    }
                  }

                  s.floatingTexts.push({
                    x: inv.x + inv.width / 2,
                    y: inv.y,
                    text: `+${pts}`,
                    color: inv.color,
                    alpha: 1,
                    vy: -1.2,
                  });

                  spawnExplosion(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color, 16);
                  synthEngine.playAlienExplosion();

                  // Chance to spawn power-up crate (8%)
                  if (Math.random() < 0.08) {
                    const powerTypes: Array<'twin' | 'rapid' | 'shield' | 'nuke'> = ['twin', 'rapid', 'shield', 'nuke'];
                    const chosen = powerTypes[Math.floor(Math.random() * powerTypes.length)];
                    const labels = {
                      twin: 'TWIN',
                      rapid: 'RAPID',
                      shield: 'SHIELD',
                      nuke: 'NUKE'
                    };
                    const colors = {
                      twin: '#00f0ff',
                      rapid: '#ff2a85',
                      shield: '#06d6a0',
                      nuke: '#ffd166'
                    };
                    s.powerUps.push({
                      x: inv.x + inv.width / 2 - 8,
                      y: inv.y,
                      type: chosen,
                      color: colors[chosen],
                      label: labels[chosen],
                      vy: 1.8,
                    });
                  }
                  break;
                }
              }
            } else {
              // Enemy Bullet hits Player
              if (
                b.x >= s.playerX &&
                b.x <= s.playerX + 26 &&
                b.y >= s.playerY &&
                b.y <= s.playerY + 16
              ) {
                s.bullets.splice(i, 1);

                if (s.hasShield) {
                  // Shield absorbs the blow!
                  s.hasShield = false;
                  s.powerUpType = null;
                  setActivePowerUpName(null);
                  spawnExplosion(s.playerX + 13, s.playerY + 8, '#06d6a0', 20);
                  synthEngine.playAlienExplosion();
                } else {
                  // Player loses a life
                  s.lives--;
                  setLives(s.lives);
                  s.screenShake = 12;
                  spawnExplosion(s.playerX + 13, s.playerY + 8, '#ff2a85', 30);
                  synthEngine.playPlayerHit();

                  if (s.lives <= 0) {
                    s.gameState = 'GAME_OVER';
                    setGameState('GAME_OVER');
                  } else {
                    // Respawn reset position
                    s.playerX = 300;
                  }
                }
              }
            }
          }

          // --- 5. Power-Up Movement & Pickup ---
          for (let pIdx = s.powerUps.length - 1; pIdx >= 0; pIdx--) {
            const pup = s.powerUps[pIdx];
            pup.y += pup.vy;

            if (pup.y > H - 30) {
              s.powerUps.splice(pIdx, 1);
              continue;
            }

            // Collect by player
            if (
              pup.x + 16 >= s.playerX &&
              pup.x <= s.playerX + 26 &&
              pup.y + 16 >= s.playerY &&
              pup.y <= s.playerY + 16
            ) {
              synthEngine.playPowerupSound();
              s.powerUpType = pup.type;
              s.powerUpTimer = 450; // ~7.5 seconds
              setActivePowerUpName(pup.label);

              if (pup.type === 'shield') {
                s.hasShield = true;
              } else if (pup.type === 'nuke') {
                // Wipe screen of enemy bullets and damage lowest row
                s.bullets = s.bullets.filter((b) => b.isPlayer);
                s.screenShake = 16;
                spawnExplosion(W / 2, 200, '#ffd166', 40);
                const survivors = s.invaders.filter((inv) => inv.alive);
                for (let k = 0; k < Math.min(6, survivors.length); k++) {
                  survivors[k].alive = false;
                  spawnExplosion(survivors[k].x, survivors[k].y, survivors[k].color, 12);
                }
              }

              s.floatingTexts.push({
                x: pup.x,
                y: pup.y - 10,
                text: `${pup.label}!`,
                color: pup.color,
                alpha: 1,
                vy: -1.4,
              });

              s.powerUps.splice(pIdx, 1);
            }
          }
        }

        // --- DRAWING GAME ELEMENTS ---

        // Bunkers
        ctx.fillStyle = '#00f0ff';
        for (const b of s.bunkers) {
          ctx.fillStyle = b.hp === 2 ? '#00f0ff' : 'rgba(0, 240, 255, 0.45)';
          ctx.fillRect(b.x, b.y, b.size, b.size);
        }

        // Invaders
        for (const inv of s.invaders) {
          if (!inv.alive) continue;
          if (inv.type === 'squid') {
            drawPixelMatrix(SQUID_SPRITE[s.invaderAnimFrame], inv.x, inv.y, 2.5, inv.color, true);
          } else if (inv.type === 'crab') {
            drawPixelMatrix(CRAB_SPRITE[s.invaderAnimFrame], inv.x, inv.y, 2.4, inv.color, true);
          } else {
            drawPixelMatrix(OCTOPUS_SPRITE[s.invaderAnimFrame], inv.x, inv.y, 2.2, inv.color, true);
          }
        }

        // UFO Mystery Ship
        if (s.ufo) {
          drawPixelMatrix(UFO_SPRITE, s.ufo.x, s.ufo.y, 2.3, '#ff007f', true);
        }

        // Player Ship
        drawPixelMatrix(PLAYER_SPRITE, s.playerX, s.playerY, 2, '#00f0ff', true);

        // Player Shield Aura
        if (s.hasShield) {
          ctx.save();
          ctx.strokeStyle = '#06d6a0';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#06d6a0';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(s.playerX + 13, s.playerY + 8, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Bullets
        for (const b of s.bullets) {
          ctx.save();
          ctx.fillStyle = b.color;
          if (crtGlow) {
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 6;
          }
          if (b.isPlayer) {
            ctx.fillRect(b.x - 1.5, b.y, 3, 10);
          } else {
            // Zig-zag alien bomb
            ctx.fillRect(b.x - 2, b.y, 4, 8);
          }
          ctx.restore();
        }

        // Power-Up Crates
        for (const pup of s.powerUps) {
          ctx.save();
          ctx.strokeStyle = pup.color;
          ctx.lineWidth = 1.5;
          ctx.fillStyle = 'rgba(11, 0, 26, 0.8)';
          ctx.fillRect(pup.x, pup.y, 20, 20);
          ctx.strokeRect(pup.x, pup.y, 20, 20);

          ctx.fillStyle = pup.color;
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(pup.label.slice(0, 1), pup.x + 10, pup.y + 14);
          ctx.restore();
        }

        // Particles
        for (let pIdx = s.particles.length - 1; pIdx >= 0; pIdx--) {
          const p = s.particles[pIdx];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 1 / p.life;

          if (p.alpha <= 0) {
            s.particles.splice(pIdx, 1);
            continue;
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.globalAlpha = 1;
        }

        // Floating Scores
        for (let ftIdx = s.floatingTexts.length - 1; ftIdx >= 0; ftIdx--) {
          const ft = s.floatingTexts[ftIdx];
          ft.y += ft.vy;
          ft.alpha -= 0.025;

          if (ft.alpha <= 0) {
            s.floatingTexts.splice(ftIdx, 1);
            continue;
          }

          ctx.save();
          ctx.font = '9px "Press Start 2P", monospace';
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = Math.max(0, ft.alpha);
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }

        // Bottom HUD: Remaining Lives Mini Ships
        ctx.fillStyle = '#00f0ff';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`LIVES:`, 20, H - 10);
        for (let l = 0; l < s.lives; l++) {
          drawPixelMatrix(PLAYER_SPRITE, 90 + l * 26, H - 19, 1.3, '#00f0ff');
        }

        // Wave text
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff2a85';
        ctx.fillText(`STAGE 0${s.wave}`, W - 20, H - 10);
      }

      // Overlays
      if (s.gameState === 'PAUSED') {
        ctx.fillStyle = 'rgba(11, 0, 26, 0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffb703';
        ctx.fillText('PAUSED', W / 2, H / 2 - 10);
        ctx.font = '10px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('PRESS [P] OR RESUME TO CONTINUE', W / 2, H / 2 + 25);
      }

      if (s.gameState === 'WAVE_CLEARED') {
        ctx.fillStyle = 'rgba(11, 0, 26, 0.8)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('WAVE COMPLETED!', W / 2, H / 2 - 30);
        ctx.font = '11px "Orbitron", sans-serif';
        ctx.fillStyle = '#ff2a85';
        ctx.fillText(`BONUS PTS AWARDED: +${s.wave * 500}`, W / 2, H / 2);
      }

      if (s.gameState === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(11, 0, 26, 0.88)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff2a85';
        if (crtGlow) {
          ctx.shadowColor = '#ff2a85';
          ctx.shadowBlur = 12;
        }
        ctx.fillText('GAME OVER', W / 2, 140);
        ctx.shadowBlur = 0;

        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`FINAL SCORE: ${s.score}`, W / 2, 190);
        ctx.fillStyle = '#ffb703';
        ctx.fillText(`WAVE REACHED: 0${s.wave}`, W / 2, 220);
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [createBunkers, createInvaders, crtGlow]);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Arcade Marquee Header Bar */}
      <div className="w-full bg-gradient-to-r from-purple-950 via-[#15042a] to-purple-950 border-2 border-pink-500/60 rounded-t-xl px-5 py-3 flex flex-wrap items-center justify-between shadow-[0_0_20px_rgba(255,42,133,0.3)]">
        {/* Score & Wave Indicators */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] font-synth tracking-widest text-pink-400">1UP SCORE</div>
            <div className="text-xl font-arcade text-pink-300 font-bold tabular-nums">
              {currentScore.toString().padStart(6, '0')}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-synth tracking-widest text-cyan-400">HIGH SCORE</div>
            <div className="text-xl font-arcade text-cyan-300 font-bold tabular-nums">
              {highScore.toString().padStart(6, '0')}
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="text-[10px] font-synth tracking-widest text-yellow-400">STAGE</div>
            <div className="text-xl font-arcade text-yellow-300 font-bold tabular-nums">
              0{wave}
            </div>
          </div>
        </div>

        {/* Combo & Active Powerup Status */}
        <div className="flex items-center gap-3">
          {multiplier > 1 && (
            <div className="px-2.5 py-1 rounded bg-yellow-500/20 border border-yellow-400 text-yellow-300 font-arcade text-xs animate-pulse">
              {multiplier}X COMBO
            </div>
          )}
          {activePowerUpName && (
            <div className="px-2.5 py-1 rounded bg-pink-500/20 border border-pink-400 text-pink-300 font-arcade text-xs">
              ⚡ {activePowerUpName}
            </div>
          )}

          {/* Audio & Scanline Toggles */}
          <div className="flex items-center gap-2 border-l border-purple-800/80 pl-3">
            <button
              onClick={() => {
                const nextMuted = !sfxMuted;
                setSfxMuted(nextMuted);
                synthEngine.setSfxVolume(nextMuted ? 0 : 0.8);
              }}
              title={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
              className="p-1.5 rounded bg-purple-900/60 hover:bg-purple-800 text-pink-300 transition-colors"
            >
              {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setScanlinesActive(!scanlinesActive)}
              className={`px-2 py-1 text-[10px] font-synth rounded border transition-colors ${
                scanlinesActive
                  ? 'border-pink-500 bg-pink-500/20 text-pink-300 shadow-[0_0_8px_rgba(255,42,133,0.4)]'
                  : 'border-purple-800 bg-purple-950/60 text-purple-400'
              }`}
            >
              SCANLINES {scanlinesActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Arcade Monitor Body */}
      <div className="relative w-full bg-[#120524] border-x-4 border-b-4 border-purple-900/80 p-3 sm:p-5 rounded-b-xl shadow-2xl">
        {/* CRT Bezel Frame */}
        <div className="relative w-full aspect-[4/3.3] sm:aspect-[4/3.2] max-h-[520px] rounded-lg overflow-hidden bg-black border-4 border-[#240d42] crt-screen">
          {/* Scanline & Vignette Layer */}
          {scanlinesActive && (
            <div className="absolute inset-0 scanlines pointer-events-none z-10" />
          )}

          {/* HTML5 Canvas Screen */}
          <canvas
            ref={canvasRef}
            width={640}
            height={520}
            className="w-full h-full object-contain block bg-[#0b001a]"
          />

          {/* Interactive UI Overlays on Game Canvas */}
          {gameState === 'TITLE_MENU' && (
            <div className="absolute inset-x-0 bottom-8 flex justify-center z-20">
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-arcade text-xs rounded border border-pink-400 shadow-[0_0_20px_rgba(255,42,133,0.6)] cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                INSERT COIN / START GAME
              </button>
            </div>
          )}

          {gameState === 'WAVE_CLEARED' && (
            <div className="absolute inset-x-0 bottom-24 flex justify-center z-20">
              <button
                onClick={advanceWave}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-arcade text-xs rounded border border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.6)] cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                ENGAGE NEXT WAVE →
              </button>
            </div>
          )}

          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 z-20">
              {!submittedScore ? (
                <div className="flex items-center gap-2 bg-[#1f0938]/90 p-3 rounded border border-pink-500/50">
                  <span className="text-[10px] font-arcade text-pink-300">ENTER INITIALS:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    className="w-16 text-center font-arcade text-cyan-300 bg-purple-950 border border-cyan-500 rounded py-1 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    onClick={handleScoreSubmission}
                    className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white font-arcade text-[10px] rounded transition-colors"
                  >
                    SAVE
                  </button>
                </div>
              ) : (
                <div className="text-[10px] font-arcade text-green-400">
                  ✓ SCORE RECORDED IN HALL OF FAME
                </div>
              )}

              <button
                onClick={startGame}
                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-arcade text-xs rounded border border-pink-400 shadow-[0_0_15px_rgba(255,42,133,0.5)] transition-transform hover:scale-105"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Arcade Control Deck (Physical Button Look) */}
        <div className="mt-4 pt-3 border-t border-purple-800/60 flex flex-wrap items-center justify-between gap-4">
          {/* Quick Keys Legend */}
          <div className="text-xs text-purple-300 flex items-center gap-3 font-synth">
            <span>Move: <strong className="text-cyan-300">A / D</strong> or <strong className="text-cyan-300">← →</strong></span>
            <span>·</span>
            <span>Fire: <strong className="text-pink-300">SPACE</strong> or <strong className="text-pink-300">↑</strong></span>
            <span>·</span>
            <span>Pause: <strong className="text-yellow-300">P</strong></span>
          </div>

          {/* On-Screen Mobile/Touch Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onMouseDown={() => (stateRef.current.keys.left = true)}
              onMouseUp={() => (stateRef.current.keys.left = false)}
              onTouchStart={() => (stateRef.current.keys.left = true)}
              onTouchEnd={() => (stateRef.current.keys.left = false)}
              className="px-4 py-2.5 bg-purple-900/80 active:bg-pink-600 hover:bg-purple-800 text-pink-300 rounded border border-pink-500/40 select-none cursor-pointer flex items-center"
              aria-label="Move Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onMouseDown={() => (stateRef.current.keys.right = true)}
              onMouseUp={() => (stateRef.current.keys.right = false)}
              onTouchStart={() => (stateRef.current.keys.right = true)}
              onTouchEnd={() => (stateRef.current.keys.right = false)}
              className="px-4 py-2.5 bg-purple-900/80 active:bg-pink-600 hover:bg-purple-800 text-pink-300 rounded border border-pink-500/40 select-none cursor-pointer flex items-center"
              aria-label="Move Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                const s = stateRef.current;
                if (s.gameState === 'TITLE_MENU') startGame();
                else if (s.gameState === 'PLAYING') {
                  s.keys.fire = true;
                  setTimeout(() => (s.keys.fire = false), 150);
                }
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-red-600 active:from-pink-700 active:to-red-700 hover:from-pink-500 hover:to-red-500 text-white font-arcade text-xs rounded border border-pink-400 select-none shadow-[0_0_12px_rgba(255,42,133,0.5)] cursor-pointer"
            >
              FIRE
            </button>

            {gameState === 'PLAYING' && (
              <button
                onClick={() => {
                  stateRef.current.gameState = 'PAUSED';
                  setGameState('PAUSED');
                }}
                className="p-2.5 bg-purple-950 hover:bg-purple-900 text-yellow-300 rounded border border-yellow-500/40"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {gameState === 'PAUSED' && (
              <button
                onClick={() => {
                  stateRef.current.gameState = 'PLAYING';
                  setGameState('PLAYING');
                }}
                className="p-2.5 bg-purple-950 hover:bg-purple-900 text-green-300 rounded border border-green-500/40"
                title="Resume"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
