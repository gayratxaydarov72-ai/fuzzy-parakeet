const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();
    if (tg.requestFullscreen) tg.requestFullscreen();
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    if (tg.setHeaderColor) tg.setHeaderColor('#183150');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#0a1420');
  } catch (e) {}
}

let crashCanvas = null;
let crashCtx = null;

function syncViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  try {
    tg?.expand?.();
  } catch (e) {}
  const cc = document.getElementById("crashCanvas");
  if (cc && cc.parentElement) {
    cc.width = cc.parentElement.clientWidth;
    cc.height = cc.parentElement.clientHeight;
  }
}
window.addEventListener("resize", syncViewportHeight);
window.addEventListener("orientationchange", syncViewportHeight);
syncViewportHeight();

const safeStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, String(v)); } catch(e) {} }
};

const urlParams = new URLSearchParams(window.location.search);
let initialUid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
if (!initialUid || isNaN(parseInt(initialUid, 10))) {
  initialUid = urlParams.get("uid");
}
if (!initialUid || initialUid === "undefined" || initialUid === "null" || isNaN(parseInt(initialUid, 10))) {
  initialUid = safeStorage.getItem("nv_user_id");
}
if (!initialUid || isNaN(parseInt(initialUid, 10))) {
  initialUid = "999999";
}
safeStorage.setItem("nv_user_id", String(initialUid));
const USER_ID = parseInt(initialUid, 10);
const FIRST_NAME = tg?.initDataUnsafe?.user?.first_name || urlParams.get("name") || "O'yinchi";
const USERNAME = tg?.initDataUnsafe?.user?.username || urlParams.get("user") || "";

const KM_MODELS = {
  idle: `<div class="km-idle-box"><svg viewBox="0 0 32 32" class="km-radar-svg"><circle cx="16" cy="16" r="14" fill="none" stroke="rgba(33, 133, 235, 0.35)" stroke-width="1.2"/><circle cx="16" cy="16" r="8" fill="none" stroke="rgba(33, 133, 235, 0.2)" stroke-width="1"/><line x1="16" y1="2" x2="16" y2="30" stroke="rgba(33, 133, 235, 0.25)" stroke-width="1"/><line x1="2" y1="16" x2="30" y2="16" stroke="rgba(33, 133, 235, 0.25)" stroke-width="1"/><path d="M16 6 L20 15 L26 17 L21 19 L20 26 L16 23 L12 26 L11 19 L6 17 L12 15 Z" fill="rgba(80, 175, 255, 0.85)"/><circle cx="16" cy="16" r="2.2" fill="#2ed573"/></svg></div>`,
  safe: `<div class="km-safe-box anim-pop"><div class="km-star-aura"></div><svg viewBox="0 0 36 36" class="km-star-svg"><defs><linearGradient id="kmGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff8cc"/><stop offset="40%" stop-color="#ffd700"/><stop offset="85%" stop-color="#ff9900"/><stop offset="100%" stop-color="#e67e22"/></linearGradient><linearGradient id="kmShineGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient></defs><polygon points="18,2 22.8,12.5 34.5,13.8 25.8,21.8 28.2,33.2 18,27.5 7.8,33.2 10.2,21.8 1.5,13.8 13.2,12.5" fill="url(#kmGoldGrad)" stroke="#c27803" stroke-width="1"/><polygon points="18,6 21.5,13.5 29.5,14.5 23.5,20.2 25.2,28.2 18,24 10.8,28.2 12.5,20.2 6.5,14.5 14.5,13.5" fill="url(#kmShineGrad)" opacity="0.45"/><circle cx="18" cy="18" r="4.5" fill="#ffeaa7" stroke="#d68910" stroke-width="0.8"/></svg></div>`,
  bomb: `<div class="km-bomb-box anim-explode"><svg viewBox="0 0 36 36" class="km-mine-svg"><defs><radialGradient id="mineMetal" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#718093"/><stop offset="45%" stop-color="#2f3640"/><stop offset="100%" stop-color="#12171f"/></radialGradient><radialGradient id="sensorRed" cx="45%" cy="45%" r="55%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="70%" stop-color="#e74c3c"/><stop offset="100%" stop-color="#962d22"/></radialGradient></defs><g stroke="#3d4957" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="3" x2="18" y2="33"/><line x1="3" y1="18" x2="33" y2="18"/><line x1="7.4" y1="7.4" x2="28.6" y2="28.6"/><line x1="7.4" y1="28.6" x2="28.6" y2="7.4"/></g><g fill="#ff3838"><circle cx="18" cy="3.5" r="1.8"/><circle cx="18" cy="32.5" r="1.8"/><circle cx="3.5" cy="18" r="1.8"/><circle cx="32.5" cy="18" r="1.8"/><circle cx="8" cy="8" r="1.6"/><circle cx="28" cy="28" r="1.6"/><circle cx="8" cy="28" r="1.6"/><circle cx="28" cy="8" r="1.6"/></g><circle cx="18" cy="18" r="10.5" fill="url(#mineMetal)" stroke="#1a202c" stroke-width="1.2"/><circle cx="18" cy="18" r="4.2" fill="url(#sensorRed)" class="km-sensor-blink"/></svg></div>`
};

const APPLE_MODELS = {
  idle: `<div class="ap-barrel-box"><svg viewBox="0 0 36 36" class="ap-barrel-svg"><defs><linearGradient id="apWoodGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#4e2712"/><stop offset="25%" stop-color="#8a4d22"/><stop offset="50%" stop-color="#a8612f"/><stop offset="75%" stop-color="#8a4d22"/><stop offset="100%" stop-color="#3d1d0c"/></linearGradient><linearGradient id="apBandGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#a67c1e"/><stop offset="50%" stop-color="#ffd700"/><stop offset="100%" stop-color="#805b10"/></linearGradient></defs><rect x="6" y="4" width="24" height="28" rx="5" fill="url(#apWoodGrad)"/><line x1="12" y1="4" x2="12" y2="32" stroke="#2b1408" stroke-width="1"/><line x1="18" y1="4" x2="18" y2="32" stroke="#2b1408" stroke-width="1"/><line x1="24" y1="4" x2="24" y2="32" stroke="#2b1408" stroke-width="1"/><rect x="5.5" y="7" width="25" height="3.8" rx="1.5" fill="url(#apBandGrad)"/><rect x="5.5" y="25.2" width="25" height="3.8" rx="1.5" fill="url(#apBandGrad)"/><circle cx="18" cy="18" r="3.2" fill="#ffd700" stroke="#52390a" stroke-width="0.8"/><circle cx="18" cy="18" r="1.2" fill="#2b1408"/></svg></div>`,
  safe: `<div class="ap-apple-box anim-pop"><div class="ap-apple-glow"></div><svg viewBox="0 0 36 36" class="ap-apple-svg"><defs><radialGradient id="apRedGrad" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ff6b81"/><stop offset="35%" stop-color="#ee5253"/><stop offset="80%" stop-color="#b31217"/><stop offset="100%" stop-color="#4d0004"/></radialGradient><linearGradient id="apLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7bed9f"/><stop offset="100%" stop-color="#2ed573"/></linearGradient></defs><path d="M17 9 Q19 3 23 2 Q22 5 20 8 Z" fill="#6d4c41"/><path d="M19 5 Q27 3 28 8 Q23 10 19 5 Z" fill="url(#apLeafGrad)"/><path d="M18 10 C15 6, 7 7, 7 16 C7 26, 14 32, 18 32 C22 32, 29 26, 29 16 C29 7, 21 6, 18 10 Z" fill="url(#apRedGrad)"/><ellipse cx="14" cy="15" rx="3.5" ry="6.5" transform="rotate(-25 14 15)" fill="#ffffff" opacity="0.35"/></svg></div>`,
  bomb: `<div class="ap-rotten-box anim-shake"><div class="ap-toxic-fume"></div><svg viewBox="0 0 36 36" class="ap-rotten-svg"><defs><radialGradient id="apRottenGrad" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#c5e1a5"/><stop offset="35%" stop-color="#7cb342"/><stop offset="75%" stop-color="#2e4d0e"/><stop offset="100%" stop-color="#0d1803"/></radialGradient></defs><path d="M17 9 Q19 3 23 2" stroke="#424242" stroke-width="1.8" fill="none"/><path d="M18 10 C15 6, 7 7, 7 16 C7 26, 14 32, 18 32 C22 32, 29 26, 29 16 C29 7, 21 6, 18 10 Z" fill="url(#apRottenGrad)"/><path d="M25 13 C22 16, 22 21, 26 23 C28 19, 28 16, 25 13 Z" fill="#132304"/><g fill="#ffffff" opacity="0.88" transform="translate(13, 14) scale(0.65)"><circle cx="5" cy="5" r="1.6" fill="#0d1803"/><circle cx="11" cy="5" r="1.6" fill="#0d1803"/><line x1="6" y1="10" x2="10" y2="10" stroke="#0d1803" stroke-width="1.2"/><line x1="8" y1="8.5" x2="8" y2="11.5" stroke="#0d1803" stroke-width="1.2"/></g></svg></div>`
};

const KAMIKAZE_ODDS = {
  1: [1.23, 1.54, 1.93, 2.41, 3.02, 3.78, 4.73, 5.91, 7.39, 9.24],
  2: [1.63, 2.72, 4.54, 7.57, 12.62, 21.03, 35.05, 58.42, 97.37, 162.29],
  3: [2.45, 6.12, 15.31, 38.28, 95.70, 239.25, 598.14, 1495.37, 3738.44, 9346.10]
};

const APPLE_ODDS = [1.23, 1.54, 1.93, 2.41, 4.02, 6.71, 11.18, 27.96, 69.90, 349.50];

const appState = {
  balance: 10000,
  user: null,
  sound: safeStorage.getItem("one_sound") !== "false",
  lastHash: "SHA-256 Kripto himoya yoqilgan",
  evilMode: false,
  aviatorRngEnabled: false,
  aviatorTarget: 1.00,

  km: {
    mines: 1,
    row: 0,
    bet: 5000,
    playing: false,
    busy: false,
    grid: []
  },

  ap: {
    row: 0,
    bet: 5000,
    playing: false,
    busy: false,
    grid: []
  },

  cr: {
    mode: "online",
    bet: 5000,
    state: "idle",
    multiplier: 1.00,
    crashPoint: 1.00,
    startTime: 0,
    countdownDuration: 2.0,
    countdownStart: 0,
    lastTickSec: 2,
    userCashedOut: false,
    userWonSum: 0,
    userWonMult: 0,
    animId: null,
    lastPlaneX: 40,
    lastPlaneY: 200,
    lastPlaneAngle: 0,
    zoomOffset: 0,
    onlinePolling: null,
    roundId: 2001,
    onlinePhase: "waiting",
    myBetPlaced: false
  },

  mn: {
    mines: 3,
    bet: 5000,
    playing: false,
    busy: false,
    grid: [],
    revealed: [],
    openedCount: 0,
    currentMult: 1.00
  },

  th: {
    mode: 1,
    bet: 5000,
    playing: false,
    shuffling: false,
    ballPositions: [0],
    selectedCup: null
  },

  dc: {
    bet: 5000,
    choice: "exact",
    rolling: false,
    dice1: 1,
    dice2: 6
  },

  wh: {
    bet: 5000,
    spinning: false,
    angle: 0,
    history: [25.0, 2.0, 3.0, 0, 1.5],
    animId: null
  },

  cf: {
    mode: "online",
    choice: "heads",
    bet: 5000,
    flipping: false,
    roundId: 1001,
    phase: "betting",
    myBetPlaced: false,
    pollTimer: null,
    rotationDeg: 0,
    resultNotified: false
  },

  rl: {
    roundId: 5001,
    phase: "betting",
    timeLeft: 15.0,
    bet: 5000,
    selectedChoice: "red",
    selectedLabel: "🔴 QIZIL (x2.0)",
    winningNumber: 0,
    winningColor: "green",
    history: [],
    myBetPlaced: false,
    pollTimer: null,
    animId: null,
    wheelAngle: 0,
    targetWheelAngle: 0,
    wheelSpeed: 0.003,
    ballAngle: -Math.PI / 2,
    ballRadius: 112,
    lastBetsSignature: "",
    lastHistorySignature: "",
    resultHandledRound: 0,
    spinStartTime: 0
  }
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmMaster = null;
  }

  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  startBgm() {
    if (this.bgmPlaying) return;
    this.init();
    if (!this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;
    try {
      this.bgmMaster = this.ctx.createGain();
      this.bgmMaster.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.bgmMaster.connect(this.ctx.destination);
    } catch (e) {
      return;
    }

    const chords = [
      [220.00, 261.63, 329.63, 392.00, 440.00, 523.25],
      [174.61, 220.00, 261.63, 329.63, 349.23, 440.00],
      [261.63, 329.63, 392.00, 493.88, 523.25, 659.25],
      [196.00, 246.94, 293.66, 349.23, 392.00, 493.88]
    ];
    const bass = [110.00, 87.31, 130.81, 98.00];

    const playPulse = () => {
      if (!this.bgmPlaying || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const chordIdx = Math.floor(this.bgmStep / 8) % chords.length;
        const noteIdx = this.bgmStep % chords[chordIdx].length;
        const f = chords[chordIdx][noteIdx];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.bgmMaster);
        osc.start(t);
        osc.stop(t + 0.23);

        if (this.bgmStep % 8 === 0) {
          const bOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          bOsc.type = "triangle";
          bOsc.frequency.setValueAtTime(bass[chordIdx], t);
          bGain.gain.setValueAtTime(0.09, t);
          bGain.gain.exponentialRampToValueAtTime(0.002, t + 1.2);
          bOsc.connect(bGain);
          bGain.connect(this.bgmMaster);
          bOsc.start(t);
          bOsc.stop(t + 1.2);
        }

        if (this.bgmStep % 2 === 0) {
          const nOsc = this.ctx.createOscillator();
          const nGain = this.ctx.createGain();
          nOsc.type = "sine";
          nOsc.frequency.setValueAtTime(1400, t);
          nGain.gain.setValueAtTime(0.007, t);
          nGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.04);
          nOsc.connect(nGain);
          nGain.connect(this.bgmMaster);
          nOsc.start(t);
          nOsc.stop(t + 0.04);
        }
      } catch (e) {}

      this.bgmStep++;
      this.bgmTimer = setTimeout(playPulse, 180);
    };
    playPulse();
  }

  stopBgm() {
    this.bgmPlaying = false;
    clearTimeout(this.bgmTimer);
    if (this.bgmMaster && this.ctx) {
      try {
        this.bgmMaster.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
  }

  toggleBgm() {
    this.init();
    if (this.bgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  play(type, freqParam = 0) {
    if (!appState.sound) return;
    try {
      this.init();
      if (!this.ctx) return;

      if (type === "click") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      } else if (type === "step") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const f = 450 + freqParam * 45;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(f * 1.4, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      } else if (type === "boom") {
        const size = Math.floor(Math.min(24000, this.ctx.sampleRate * 0.25));
        const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
        src.stop(this.ctx.currentTime + 0.3);
      } else if (type === "win") {
        [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.06);
          osc.stop(this.ctx.currentTime + idx * 0.06 + 0.18);
        });
      } else if (type === "takeoff") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      } else if (type === "tick") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } else if (type === "gem") {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc2.type = "triangle";
        const baseF = 880 + freqParam * 35;
        osc.frequency.setValueAtTime(baseF, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(baseF * 1.5, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc2.start();
        osc.stop(this.ctx.currentTime + 0.28);
        osc2.stop(this.ctx.currentTime + 0.28);
      } else if (type === "dice") {
        for (let i = 0; i < 4; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const t = this.ctx.currentTime + i * 0.07;
          osc.frequency.setValueAtTime(280 + Math.random() * 200, t);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.05);
        }
      } else if (type === "shuffle") {
        const size = Math.floor(Math.min(24000, this.ctx.sampleRate * 0.15));
        const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / size);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
      } else if (type === "coin") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }
    } catch (e) {}
  }
}

const audio = new AudioEngine();

function triggerHaptic(type) {
  if (tg?.HapticFeedback) {
    try {
      if (type === "light") tg.HapticFeedback.impactOccurred("light");
      else if (type === "medium") tg.HapticFeedback.impactOccurred("medium");
      else if (type === "success") tg.HapticFeedback.notificationOccurred("success");
      else if (type === "error") tg.HapticFeedback.notificationOccurred("error");
    } catch (e) {}
  }
}

class ParticleFX {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.list = [];
    this.running = false;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    try {
      if (this.canvas && this.canvas.parentElement) {
        const w = this.canvas.parentElement.clientWidth;
        const h = this.canvas.parentElement.clientHeight;
        if (w > 0 && h > 0) {
          this.canvas.width = w;
          this.canvas.height = h;
        }
      }
    } catch (e) {}
  }

  explode(x, y) {
    if (!this.ctx || !this.canvas) return;
    const cw = this.canvas.width || 360;
    const ch = this.canvas.height || 640;
    const px = typeof x === "number" && !isNaN(x) ? x : cw / 2;
    const py = typeof y === "number" && !isNaN(y) ? y : ch / 2;

    for (let i = 0; i < 26; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 2;
      this.list.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: ["#e74c3c", "#f39c12", "#f1c40f", "#ffffff"][Math.floor(Math.random() * 4)],
        size: Math.max(1, Math.random() * 3.5 + 1.5),
        alpha: 1,
        decay: Math.random() * 0.035 + 0.025
      });
    }
    this.startLoop();
  }

  confetti() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width || window.innerWidth || 360;
    const h = this.canvas.height || window.innerHeight || 640;
    for (let i = 0; i < 35; i++) {
      this.list.push({
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 4.5,
        vy: -(Math.random() * 9 + 5),
        color: ["#2ecc71", "#3498db", "#f1c40f", "#9b59b6", "#e74c3c"][Math.floor(Math.random() * 5)],
        size: Math.max(1.5, Math.random() * 4 + 2),
        alpha: 1,
        gravity: 0.22,
        decay: 0.015
      });
    }
    this.startLoop();
  }

  startLoop() {
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(() => this.loop());
    }
  }

  loop() {
    if (!this.ctx || !this.canvas) {
      this.running = false;
      return;
    }
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.list.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    } catch (e) {}

    if (this.list.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.running = false;
    }
  }
}

const fx = new ParticleFX(document.getElementById("fx-canvas"));
const particleFx = fx;
window.particleFx = fx;

function formatMoney(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

(function restoreCachedBalance() {
  try {
    const cached = safeStorage.getItem("nv_cached_balance");
    if (cached !== null && !isNaN(parseInt(cached, 10))) {
      const bVal = parseInt(cached, 10);
      appState.balance = bVal;
      const el = document.getElementById("balanceAmount");
      if (el) el.textContent = formatMoney(bVal);
    }
  } catch (e) {}
})();

let toastTimer = null;
function showToast(msg, isSuccess = true) {
  const t = document.getElementById("toastMsg");
  if (!t) return;
  t.textContent = msg;
  t.style.borderColor = isSuccess ? "var(--one-green-glow)" : "var(--one-red)";
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 2400);
}

function triggerScreenShake() {
  const activeArena = document.querySelector('.game-arena-view:not([style*="display: none"])');
  const target = activeArena?.querySelector('.board-scroll-wrap, .cf-coin-stage, .wheel-canvas-container, .crash-stage-wrapper') || activeArena;
  if (!target) return;
  target.classList.remove("screen-shake");
  void target.offsetWidth;
  target.classList.add("screen-shake");
  setTimeout(() => target?.classList.remove("screen-shake"), 360);
}

let balanceAnimId = null;
function updateBalanceUI(val, animate = true) {
  const el = document.getElementById("balanceAmount");
  if (!el) return;
  const numVal = Math.max(0, typeof val === "number" ? Math.floor(val) : (parseInt(val, 10) || 0));
  const prev = typeof appState.balance === "number" ? appState.balance : 0;
  appState.balance = numVal;

  try {
    safeStorage.setItem("nv_cached_balance", String(numVal));
  } catch (e) {}

  if (balanceAnimId) {
    cancelAnimationFrame(balanceAnimId);
    balanceAnimId = null;
  }

  // 🛑 Agar 0 bo'lsa yoki animatsiya talab etilmasa darhol 0 ga tenglashtirish (hech qanday kechikishsiz)
  if (!animate || numVal === 0 || prev === numVal) {
    el.textContent = formatMoney(numVal);
    if (numVal === 0) {
      const container = document.querySelector(".balance-container");
      if (container) {
        container.classList.remove("balance-glow-up");
        container.classList.add("balance-glow-down");
        setTimeout(() => container.classList.remove("balance-glow-down"), 800);
      }
    }
    return;
  }

  const isUp = numVal > prev;
  const container = document.querySelector(".balance-container");
  if (container) {
    container.classList.remove("balance-glow-up", "balance-glow-down");
    void container.offsetWidth;
    container.classList.add(isUp ? "balance-glow-up" : "balance-glow-down");
    setTimeout(() => container.classList.remove("balance-glow-up", "balance-glow-down"), 800);
  }

  const start = prev;
  const startTime = performance.now();
  const dur = 400;

  function step(now) {
    const p = Math.min((now - startTime) / dur, 1);
    const ease = p * (2 - p);
    const curr = Math.floor(start + (numVal - start) * ease);
    el.textContent = formatMoney(curr);
    if (p < 1) {
      balanceAnimId = requestAnimationFrame(step);
    } else {
      el.textContent = formatMoney(numVal);
      balanceAnimId = null;
    }
  }
  balanceAnimId = requestAnimationFrame(step);
}

async function apiFetch(endpoint, method = "GET", body = null) {
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(endpoint, opts);
    const json = await res.json();
    if (json?.banned) {
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:24px;text-align:center;background:#0d1117;color:#fff;font-family:sans-serif;">
          <div style="font-size:64px;margin-bottom:16px;">🚫</div>
          <h2 style="color:#ff4757;margin-bottom:12px;">HISOBINGIZ BLOKLANGAN</h2>
          <p style="font-size:15px;color:#a4b0be;line-height:1.6;max-width:320px;">${json.error || "Administrator tomonidan bloklangan"}</p>
        </div>
      `;
    }
    return json;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const TASK_ICONS = {
  login_daily: "🎁",
  play_games: "🎮",
  play_kamikaze: "🛩",
  play_mines: "💎",
  play_aviator: "🚀",
  play_apple: "🍏",
  play_thimbles: "🪚",
  play_dice: "🎲",
  play_wheel: "🎡",
  play_coinflip: "🪙",
  reach_multiplier: "⚡",
  win_games: "🏆",
  high_stake: "💰",
  invite_friend: "👥"
};

let tasksTimerInterval = null;
let serverSecondsLeft = 0;

function updateAllTimerDisplays(str) {
  const el = document.getElementById("taskResetTimer");
  if (el) el.textContent = str;
  const bEl = document.getElementById("taskBottomTimer");
  if (bEl) bEl.textContent = str;
  const cEl = document.getElementById("compCountdownTimer");
  if (cEl) cEl.textContent = str;
}

function startTasksCountdownTimer(initialSeconds) {
  if (tasksTimerInterval) clearInterval(tasksTimerInterval);
  if (typeof initialSeconds === "number" && initialSeconds > 0) {
    serverSecondsLeft = initialSeconds;
  } else {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    serverSecondsLeft = Math.max(0, Math.floor((midnight - now) / 1000));
  }

  function tick() {
    if (serverSecondsLeft <= 0) {
      updateAllTimerDisplays("00:00:00");
      clearInterval(tasksTimerInterval);
      setTimeout(async () => {
        const data = await apiFetch(`/api/tasks?user_id=${USER_ID}`);
        if (data?.ok) {
          renderTasksList(data.tasks || []);
          startTasksCountdownTimer(data.seconds_left);
          showToast("🔄 Yangi 24 soatlik vazifalar boshlandi!", true);
        }
      }, 1000);
      return;
    }

    const h = Math.floor(serverSecondsLeft / 3600);
    const m = Math.floor((serverSecondsLeft % 3600) / 60);
    const s = serverSecondsLeft % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    updateAllTimerDisplays(`${hh}:${mm}:${ss}`);
    serverSecondsLeft--;
  }

  tick();
  tasksTimerInterval = setInterval(tick, 1000);
}

async function syncGameSettings() {
  try {
    const res = await apiFetch("/api/game-settings");
    if (res?.ok) {
      appState.evilMode = Boolean(res.evil_mode);
      appState.aviatorRngEnabled = Boolean(res.aviator_rng_enabled);
      appState.aviatorTarget = typeof res.aviator_target === "number" ? res.aviator_target : (res.aviator_target ? parseFloat(res.aviator_target) : 1.00);
    }
  } catch (e) {}
}

setInterval(syncGameSettings, 5000);

async function initAppData() {
  const data = await apiFetch(`/api/user?user_id=${USER_ID}&first_name=${encodeURIComponent(FIRST_NAME)}&username=${encodeURIComponent(USERNAME)}`);
  if (data?.ok && data.user) {
    appState.user = data.user;
    if (typeof data.evil_mode !== "undefined") {
      appState.evilMode = Boolean(data.evil_mode);
    }
    if (typeof data.aviator_rng_enabled !== "undefined") {
      appState.aviatorRngEnabled = Boolean(data.aviator_rng_enabled);
    }
    if (typeof data.aviator_target !== "undefined") {
      appState.aviatorTarget = typeof data.aviator_target === "number" ? data.aviator_target : (data.aviator_target ? parseFloat(data.aviator_target) : 1.00);
    }
    updateBalanceUI(data.user.balance);

    document.getElementById("refCount").textContent = data.user.invited_count || 0;
    document.getElementById("refTotal").textContent = `${formatMoney(data.user.total_earned_ref || 0)} UZS`;

    const botName = tg?.initDataUnsafe?.bot_username || "xBauntyBot";
    const refLink = `https://t.me/${botName}?start=ref_${USER_ID}`;
    document.getElementById("refLinkInput").value = refLink;

    renderTasksList(data.tasks || []);
    startTasksCountdownTimer(data.seconds_left);
  }
}

function renderTasksList(tasks) {
  const container = document.getElementById("tasksList");
  if (!container) return;
  container.innerHTML = "";
  let claimableCount = 0;
  let doneCount = 0;
  let totalReward = 0;

  tasks.forEach(t => {
    totalReward += t.reward;
    if (t.completed) doneCount++;
    if (t.completed && !t.claimed) claimableCount++;

    const div = document.createElement("div");
    div.className = `task-item ${t.claimed ? "claimed" : (t.completed ? "ready" : "")}`;
    const pct = Math.min(100, Math.round((t.current_val / t.target_val) * 100));
    const icon = TASK_ICONS[t.task_key] || "🎯";

    div.innerHTML = `
      <div class="task-icon-box">${icon}</div>
      <div class="task-body">
        <div class="t-top-row">
          <span class="t-title">${t.title}</span>
          <span class="t-reward">+${formatMoney(t.reward)} UZS</span>
        </div>
        <div class="t-bar-wrap">
          <div class="t-bar ${t.completed ? 'complete' : ''}" style="width: ${pct}%"></div>
        </div>
        <div class="t-meta-row">
          <span class="t-prog-lbl">${t.current_val} / ${t.target_val}</span>
          <span class="t-pct-lbl">${pct}%</span>
        </div>
      </div>
      <div class="task-action">
        ${t.claimed ? 
          `<button class="t-btn btn-claimed" disabled>✅ OLINDI</button>` : 
          (t.completed ? 
            `<button class="t-btn btn-claim-ready" data-key="${t.task_key}">⚡ YIG'ISH</button>` : 
            `<button class="t-btn btn-in-progress" disabled>⏳ ${pct}%</button>`
          )
        }
      </div>
    `;

    const btn = div.querySelector(".btn-claim-ready");
    if (btn) {
      btn.addEventListener("click", () => claimTaskReward(t.task_key));
    }

    container.appendChild(div);
  });

  const doneCountEl = document.getElementById("tasksDoneCount");
  if (doneCountEl) doneCountEl.textContent = `${doneCount} / ${tasks.length}`;

  const totalRewardEl = document.getElementById("tasksTotalReward");
  if (totalRewardEl) totalRewardEl.textContent = `${formatMoney(totalReward)} UZS`;

  const claimAllBtn = document.getElementById("claimAllTasksBtn");
  if (claimAllBtn) {
    if (claimableCount > 1) {
      claimAllBtn.style.display = "inline-block";
      claimAllBtn.textContent = `BARCHASINI YIG'ISH (${claimableCount})`;
    } else {
      claimAllBtn.style.display = "none";
    }
  }

  const badge = document.getElementById("tasksBadge");
  if (badge) {
    badge.textContent = claimableCount;
    badge.style.display = claimableCount > 0 ? "inline-block" : "none";
  }

  const allClaimed = tasks.length > 0 && tasks.every(t => t.claimed === 1 || t.claimed === true);
  const doneBanner = document.getElementById("allTasksDoneBanner");
  if (doneBanner) {
    doneBanner.style.display = allClaimed ? "flex" : "none";
  }
}

document.getElementById("claimAllTasksBtn")?.addEventListener("click", async () => {
  audio.play("win");
  triggerHaptic("success");
  fx.confetti();

  const res = await apiFetch("/api/claim-all-tasks", "POST", { user_id: USER_ID });
  if (res?.ok) {
    updateBalanceUI(res.balance);
    renderTasksList(res.tasks || []);
    if (res.seconds_left) startTasksCountdownTimer(res.seconds_left);
    showToast(`🎉 Barcha mukofotlar olindi: +${formatMoney(res.reward)} UZS!`, true);
  }
});

async function claimTaskReward(taskKey) {
  audio.play("win");
  triggerHaptic("success");
  fx.confetti();

  const res = await apiFetch("/api/claim-task", "POST", { user_id: USER_ID, task_key: taskKey });
  if (res?.ok) {
    updateBalanceUI(res.balance);
    renderTasksList(res.tasks || []);
    if (res.seconds_left) startTasksCountdownTimer(res.seconds_left);
    showToast(`🎉 +${formatMoney(res.reward)} UZS hisobingizga qo'shildi!`, true);
  } else {
    showToast(`❌ ${res.error || "Xatolik"}`, false);
  }
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    audio.play("click");
    stopCoinFlipPolling();
    stopAviatorOnlinePolling();
    document.getElementById("app")?.classList.remove("in-game");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.querySelectorAll(".game-arena-view").forEach(v => v.style.display = "none");

    if (appState.cr.animId && appState.cr.state === "idle") {
      cancelAnimationFrame(appState.cr.animId);
      appState.cr.animId = null;
    }

    btn.classList.add("active");
    const tabId = `tab-${btn.dataset.tab}`;
    const target = document.getElementById(tabId);
    if (target) target.classList.add("active");
  });
});

function getValidatedBet(inputElId) {
  const el = document.getElementById(inputElId);
  const rawStr = String(el?.value || "").replace(/\s+/g, "").replace(/,/g, "").replace(/_/g, "");
  const val = parseInt(rawStr, 10);
  if (isNaN(val) || val < 1000) {
    showToast("⚠️ Minimal stavka: 1 000 UZS!", false);
    triggerHaptic("error");
    return null;
  }
  if (val > appState.balance) {
    if (appState.balance <= 0) {
      showToast("❌ Balansingiz 0 UZS! Yuqoridagi (+) tugmasini bosib hisobni to'ldiring.", false);
    } else {
      showToast(`❌ Mablag' yetarli emas! Sizda ${formatMoney(appState.balance)} UZS bor.`, false);
    }
    const topup = document.getElementById("topupBtn");
    if (topup) {
      topup.classList.add("pulse-attention");
      setTimeout(() => topup.classList.remove("pulse-attention"), 1500);
    }
    triggerHaptic("error");
    return null;
  }
  return val;
}

function adjustBetInput(inputId, action) {
  const el = document.getElementById(inputId);
  if (!el) return;
  audio.play("click");
  triggerHaptic("light");
  const rawStr = String(el.value || "").replace(/\s+/g, "").replace(/,/g, "").replace(/_/g, "");
  let v = parseInt(rawStr, 10) || 5000;
  const maxLimit = Math.max(appState.balance || 0, 1_000_000_000_000);
  if (action === "minus") {
    el.value = Math.max(1000, v - 1000);
  } else if (action === "plus") {
    el.value = Math.min(maxLimit, v + 1000);
  } else if (action === "half") {
    el.value = Math.max(1000, Math.floor(v / 2));
  } else if (action === "double") {
    el.value = Math.min(maxLimit, v * 2);
  } else if (action === "max") {
    el.value = Math.max(1000, appState.balance > 0 ? appState.balance : 50000);
  }
}

function setBetChip(inputId, value) {
  const el = document.getElementById(inputId);
  if (!el) return;
  audio.play("click");
  triggerHaptic("light");
  el.value = value;
}

function openGameView(viewId) {
  audio.play("click");
  triggerHaptic("medium");
  document.getElementById("app")?.classList.add("in-game");
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".game-arena-view").forEach(v => v.style.display = "none");

  const view = document.getElementById(viewId);
  if (view) view.style.display = "flex";

  const betInputMap = {
    "view-kamikaze": "kmBetInput",
    "view-apple": "apBetInput",
    "view-crash": "crBetInput",
    "view-mines": "mnBetInput",
    "view-thimbles": "thBetInput",
    "view-dice": "dcBetInput",
    "view-wheel": "whBetInput",
    "view-coinflip": "cfBetInput",
    "view-roulette": "rlBetInput"
  };
  const inputId = betInputMap[viewId];
  if (inputId) {
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
      const cur = parseInt(inputEl.value, 10) || 5000;
      if (appState.balance > 0 && cur > appState.balance) {
        inputEl.value = Math.max(1000, Math.min(5000, appState.balance));
      }
    }
  }

  if (viewId === "view-crash") {
    initCrashGame();
  } else {
    stopAviatorOnlinePolling();
    if (appState.cr.animId) {
      cancelAnimationFrame(appState.cr.animId);
      appState.cr.animId = null;
    }
  }

  if (viewId === "view-roulette") {
    initRouletteGame();
  } else {
    stopRoulettePolling();
  }
}

function returnToLobby() {
  audio.play("click");
  triggerHaptic("light");
  stopCoinFlipPolling();
  stopAviatorOnlinePolling();
  stopRoulettePolling();
  document.getElementById("app")?.classList.remove("in-game");
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".game-arena-view").forEach(v => v.style.display = "none");
  document.getElementById("tab-lobby").classList.add("active");
  document.querySelector('.tab-btn[data-tab="lobby"]').classList.add("active");

  if (appState.cr.animId) {
    cancelAnimationFrame(appState.cr.animId);
    appState.cr.animId = null;
  }
}

document.getElementById("homeLogoBtn").addEventListener("click", returnToLobby);
document.getElementById("backFromKamikaze").addEventListener("click", returnToLobby);
document.getElementById("backFromApple").addEventListener("click", returnToLobby);
document.getElementById("backFromCrash").addEventListener("click", returnToLobby);
document.getElementById("backFromMines")?.addEventListener("click", returnToLobby);
document.getElementById("backFromThimbles")?.addEventListener("click", returnToLobby);
document.getElementById("backFromDice")?.addEventListener("click", returnToLobby);
document.getElementById("backFromWheel")?.addEventListener("click", returnToLobby);
document.getElementById("backFromCoinflip")?.addEventListener("click", returnToLobby);
document.getElementById("backFromRoulette")?.addEventListener("click", returnToLobby);

document.getElementById("bannerRefBtn").addEventListener("click", () => {
  document.querySelector('.tab-btn[data-tab="referral"]').click();
});

document.querySelectorAll('.game-card[data-game="kamikaze"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-kamikaze");
    renderKamikazeBoard();
  });
});

document.querySelectorAll('.game-card[data-game="apple"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-apple");
    renderAppleBoard();
  });
});

document.querySelectorAll('.game-card[data-game="crash"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-crash");
  });
});

document.querySelectorAll('.game-card[data-game="mines"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-mines");
    renderMinesBoard();
  });
});

document.querySelectorAll('.game-card[data-game="thimbles"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-thimbles");
    resetThimblesUI();
  });
});

document.querySelectorAll('.game-card[data-game="dice"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-dice");
    renderDicePips(1, 6);
  });
});

document.querySelectorAll('.game-card[data-game="wheel"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-wheel");
    initWheelGame();
  });
});

document.querySelectorAll('.game-card[data-game="coinflip"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-coinflip");
    initCoinFlipGame();
  });
});

document.querySelectorAll('.game-card[data-game="roulette"]').forEach(c => {
  c.addEventListener("click", () => {
    openGameView("view-roulette");
    initRouletteGame();
  });
});

function renderKamikazeBoard() {
  const container = document.getElementById("kamikazeBoard");
  container.innerHTML = "";
  const odds = KAMIKAZE_ODDS[appState.km.mines];

  for (let r = 0; r < 10; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "board-row disabled";
    rowDiv.dataset.r = r;

    const multBox = document.createElement("div");
    multBox.className = "row-mult-badge";
    multBox.innerHTML = `
      <span class="r-num">Q ${r + 1}</span>
      <span class="r-mult">x${odds[r].toFixed(2)}</span>
    `;

    const cellsDiv = document.createElement("div");
    cellsDiv.className = "row-cells-group";

    for (let c = 0; c < 5; c++) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.dataset.c = c;
      cell.innerHTML = KM_MODELS.idle;
      cell.addEventListener("click", (e) => onKamikazeClick(r, c, e));
      cellsDiv.appendChild(cell);
    }

    rowDiv.appendChild(multBox);
    rowDiv.appendChild(cellsDiv);
    container.appendChild(rowDiv);
  }
}

function updateKamikazeActiveRows() {
  const rows = document.querySelectorAll("#kamikazeBoard .board-row");
  rows.forEach(r => {
    const idx = parseInt(r.dataset.r, 10);
    r.classList.remove("active", "passed", "disabled");

    if (!appState.km.playing) {
      r.classList.add("disabled");
    } else if (idx < appState.km.row) {
      r.classList.add("passed");
    } else if (idx === appState.km.row) {
      r.classList.add("active");
      const scrollParent = r.closest(".board-scroll-wrap");
      if (scrollParent) {
        const targetTop = r.offsetTop - scrollParent.clientHeight / 2 + r.clientHeight / 2;
        scrollParent.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      }
    } else {
      r.classList.add("disabled");
    }
  });
}

let kmResetTimer = null;
function startKamikazeGame() {
  if (appState.km.playing || appState.km.busy) return;
  clearTimeout(kmResetTimer);
  const betVal = getValidatedBet("kmBetInput");
  if (!betVal) return;

  appState.km.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.km.busy = false;
  appState.km.playing = true;
  appState.km.row = 0;

  appState.km.grid = [];
  for (let r = 0; r < 10; r++) {
    const row = new Array(5).fill(false);
    let p = 0;
    while (p < appState.km.mines) {
      const idx = Math.floor(Math.random() * 5);
      if (!row[idx]) {
        row[idx] = true;
        p++;
      }
    }
    appState.km.grid.push(row);
  }

  renderKamikazeBoard();
  updateKamikazeActiveRows();

  const betBox = document.getElementById("kmBettingBox");
  if (betBox) betBox.style.display = "none";
  const cashBox = document.getElementById("kmCashoutBox");
  if (cashBox) cashBox.style.display = "block";
  const cashBtn = document.getElementById("kmCashoutBtn");
  if (cashBtn) cashBtn.disabled = true;
  const cashSum = document.getElementById("kmCashoutSum");
  if (cashSum) cashSum.textContent = "1-qatordan tanlang";

  triggerHaptic("medium");
}

function onKamikazeClick(r, c, ev) {
  if (!appState.km.playing || appState.km.busy || r !== appState.km.row) return;
  appState.km.busy = true;

  // Smart house edge: Ko'p pul tikilganda mergelar kamroq bo'lishi uchun xavf oshadi
  let kmTrapChance = appState.evilMode ? 0.85 : 0.0;
  if (!appState.evilMode) {
    if (appState.km.bet >= 50000000) kmTrapChance = 0.85;
    else if (appState.km.bet >= 5000000) kmTrapChance = 0.70;
    else if (appState.km.bet >= 500000) kmTrapChance = 0.55;
    else if (appState.km.bet >= 50000) kmTrapChance = 0.40;
  }
  if (Math.random() < kmTrapChance && appState.km.grid && appState.km.grid[r]) {
    if (!appState.km.grid[r][c]) {
      const bombCols = [];
      for (let col = 0; col < 5; col++) {
        if (appState.km.grid[r][col]) bombCols.push(col);
      }
      if (bombCols.length > 0) {
        const swapCol = bombCols[Math.floor(Math.random() * bombCols.length)];
        appState.km.grid[r][c] = true;
        appState.km.grid[r][swapCol] = false;
      }
    }
  }

  const isBomb = Boolean(appState.km.grid && appState.km.grid[r] && appState.km.grid[r][c]);
  const rowEl = document.querySelector(`#kamikazeBoard .board-row[data-r="${r}"]`);
  if (!rowEl) {
    appState.km.busy = false;
    return;
  }
  const cellEl = rowEl.querySelector(`.cell[data-c="${c}"]`);
  if (!cellEl) {
    appState.km.busy = false;
    return;
  }
  const rect = cellEl.getBoundingClientRect();

  if (isBomb) {
    appState.km.playing = false;
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");
    fx.explode(rect.left + rect.width / 2, rect.top + rect.height / 2);

    cellEl.classList.add("revealed-bomb");
    cellEl.innerHTML = KM_MODELS.bomb;

    revealKamikazeBombs();
    finishKamikazeGame(false);
  } else {
    audio.play("step", r);
    triggerHaptic("medium");

    cellEl.classList.add("revealed-safe");
    cellEl.innerHTML = KM_MODELS.safe;

    const mult = KAMIKAZE_ODDS[appState.km.mines][r];
    const currentWin = Math.floor(appState.km.bet * mult);

    const cashBtn = document.getElementById("kmCashoutBtn");
    if (cashBtn) cashBtn.disabled = false;
    const cashSum = document.getElementById("kmCashoutSum");
    if (cashSum) cashSum.textContent = `${formatMoney(currentWin)} UZS (${mult.toFixed(2)}x)`;

    if (r === 9) {
      appState.km.row = 10;
      appState.km.busy = false;
      cashoutKamikaze();
    } else {
      // Dinamik bombalar: har bir to'g'ri topilganda keyingi qatorlardagi bombalar joyi o'zgaradi
      for (let nextR = r + 1; nextR < 10; nextR++) {
        const newRow = new Array(5).fill(false);
        let p = 0;
        while (p < appState.km.mines) {
          const idx = Math.floor(Math.random() * 5);
          if (!newRow[idx]) {
            newRow[idx] = true;
            p++;
          }
        }
        appState.km.grid[nextR] = newRow;
      }
      appState.km.row++;
      updateKamikazeActiveRows();
      appState.km.busy = false;
    }
  }
}

function revealKamikazeBombs() {
  if (!Array.isArray(appState.km.grid)) return;
  for (let r = 0; r < 10; r++) {
    const rowEl = document.querySelector(`#kamikazeBoard .board-row[data-r="${r}"]`);
    if (!rowEl) continue;
    for (let c = 0; c < 5; c++) {
      const cell = rowEl.querySelector(`.cell[data-c="${c}"]`);
      if (!cell) continue;
      if (cell.classList.contains("revealed-safe") || cell.classList.contains("revealed-bomb")) continue;
      const isBomb = appState.km.grid[r] && appState.km.grid[r][c];
      if (isBomb) {
        cell.classList.add("ghost-bomb");
        cell.innerHTML = KM_MODELS.bomb;
      } else {
        cell.classList.add("ghost-safe");
        cell.innerHTML = KM_MODELS.safe;
      }
    }
  }
}

function cashoutKamikaze() {
  if (!appState.km.playing || appState.km.busy) return;
  const cashBtn = document.getElementById("kmCashoutBtn");
  if (cashBtn && cashBtn.disabled) return;
  if (cashBtn) cashBtn.disabled = true;
  appState.km.busy = true;
  appState.km.playing = false;

  const earnedRow = Math.max(0, appState.km.row === 10 ? 9 : appState.km.row - 1);
  const mult = KAMIKAZE_ODDS[appState.km.mines][earnedRow];
  const winSum = Math.floor(appState.km.bet * mult);

  audio.play("win");
  triggerHaptic("success");
  fx.confetti();

  revealKamikazeBombs();
  finishKamikazeGame(true, winSum, mult);
}

async function finishKamikazeGame(win, winSum = 0, mult = 0) {
  appState.km.playing = false;

  const cashBox = document.getElementById("kmCashoutBox");
  if (cashBox) cashBox.style.display = "none";
  const betBox = document.getElementById("kmBettingBox");
  if (betBox) betBox.style.display = "flex";

  if (win) {
    updateBalanceUI(appState.balance + winSum, true);
    showToast(`🎉 +${formatMoney(winSum)} UZS (${mult.toFixed(2)}x) YUTUQ!`, true);
  } else {
    showToast(`💥 Samolyot portladi! (-${formatMoney(appState.km.bet)} UZS)`, false);
  }

  try {
    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "Kamikaze",
      bet: appState.km.bet,
      win: win ? winSum : 0,
      multiplier: win ? mult : 0
    });

    if (res?.ok && typeof res.balance === "number") {
      updateBalanceUI(res.balance, false);
      if (res.provably_hash) {
        appState.lastHash = res.provably_hash;
        const ph = document.getElementById("lastProvablyHash");
        if (ph) ph.textContent = res.provably_hash;
      }
      if (res.tasks) renderTasksList(res.tasks);
    }
  } catch (e) {
  } finally {
    appState.km.busy = false;
  }

  clearTimeout(kmResetTimer);
  kmResetTimer = setTimeout(() => {
    if (!appState.km.playing) {
      renderKamikazeBoard();
      updateKamikazeActiveRows();
    }
  }, 1400);
}

document.querySelectorAll("#view-kamikaze .pill").forEach(p => {
  p.addEventListener("click", () => {
    if (appState.km.playing) return;
    audio.play("click");
    document.querySelectorAll("#view-kamikaze .pill").forEach(b => b.classList.remove("active"));
    p.classList.add("active");
    appState.km.mines = parseInt(p.dataset.km, 10);
    renderKamikazeBoard();
  });
});

document.getElementById("kmStartBtn").addEventListener("click", startKamikazeGame);
document.getElementById("kmCashoutBtn").addEventListener("click", cashoutKamikaze);

document.querySelectorAll("#view-kamikaze .b-chip").forEach(c => {
  c.addEventListener("click", () => {
    if (appState.km.playing) return;
    setBetChip("kmBetInput", c.dataset.v);
  });
});

document.getElementById("kmMinus").addEventListener("click", () => {
  if (appState.km.playing) return;
  adjustBetInput("kmBetInput", "minus");
});

document.getElementById("kmPlus").addEventListener("click", () => {
  if (appState.km.playing) return;
  adjustBetInput("kmBetInput", "plus");
});

document.getElementById("kmHalf").addEventListener("click", () => {
  if (appState.km.playing) return;
  adjustBetInput("kmBetInput", "half");
});

document.getElementById("kmDouble").addEventListener("click", () => {
  if (appState.km.playing) return;
  adjustBetInput("kmBetInput", "double");
});

document.getElementById("kmMax").addEventListener("click", () => {
  if (appState.km.playing) return;
  adjustBetInput("kmBetInput", "max");
});

function renderAppleBoard() {
  const container = document.getElementById("appleBoard");
  container.innerHTML = "";

  for (let r = 0; r < 10; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "board-row disabled";
    rowDiv.dataset.r = r;

    const multBox = document.createElement("div");
    multBox.className = "row-mult-badge";
    multBox.innerHTML = `
      <span class="r-num">Q ${r + 1}</span>
      <span class="r-mult">x${APPLE_ODDS[r].toFixed(2)}</span>
    `;

    const cellsDiv = document.createElement("div");
    cellsDiv.className = "row-cells-group";

    // 4 ta olma har qatorda: 2 ta to'g'ri, 2 ta noto'g'ri
    for (let c = 0; c < 4; c++) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.dataset.c = c;
      cell.innerHTML = APPLE_MODELS.idle;
      cell.addEventListener("click", (e) => onAppleClick(r, c, e));
      cellsDiv.appendChild(cell);
    }

    rowDiv.appendChild(multBox);
    rowDiv.appendChild(cellsDiv);
    container.appendChild(rowDiv);
  }
}

function updateAppleActiveRows() {
  const rows = document.querySelectorAll("#appleBoard .board-row");
  rows.forEach(r => {
    const idx = parseInt(r.dataset.r, 10);
    r.classList.remove("active", "passed", "disabled");

    if (!appState.ap.playing) {
      r.classList.add("disabled");
    } else if (idx < appState.ap.row) {
      r.classList.add("passed");
    } else if (idx === appState.ap.row) {
      r.classList.add("active");
      const scrollParent = r.closest(".board-scroll-wrap");
      if (scrollParent) {
        const targetTop = r.offsetTop - scrollParent.clientHeight / 2 + r.clientHeight / 2;
        scrollParent.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      }
    } else {
      r.classList.add("disabled");
    }
  });
}

let apResetTimer = null;
function startAppleGame() {
  if (appState.ap.playing || appState.ap.busy) return;
  clearTimeout(apResetTimer);
  const betVal = getValidatedBet("apBetInput");
  if (!betVal) return;

  appState.ap.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.ap.busy = false;
  appState.ap.playing = true;
  appState.ap.row = 0;

  // Har bir qatorda aniq 2 ta to'g'ri olma, 2 ta noto'g'ri (chirigan) olma
  appState.ap.grid = [];
  for (let r = 0; r < 10; r++) {
    const row = [true, true, false, false];
    for (let i = row.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [row[i], row[j]] = [row[j], row[i]];
    }
    appState.ap.grid.push(row);
  }

  renderAppleBoard();
  updateAppleActiveRows();

  const betBox = document.getElementById("appleBettingBox");
  if (betBox) betBox.style.display = "none";
  const cashBox = document.getElementById("appleCashoutBox");
  if (cashBox) cashBox.style.display = "block";
  const cashBtn = document.getElementById("appleCashoutBtn");
  if (cashBtn) cashBtn.disabled = true;
  const cashSum = document.getElementById("appleCashoutSum");
  if (cashSum) cashSum.textContent = "1-qatordan olma tanlang";

  triggerHaptic("medium");
}

function onAppleClick(r, c, ev) {
  if (!appState.ap.playing || appState.ap.busy || r !== appState.ap.row) return;
  appState.ap.busy = true;

  // Smart house edge: Ko'p pul tikilganda mergelar kamroq bo'lishi uchun xavf oshadi
  let apTrapChance = appState.evilMode ? 0.85 : 0.0;
  if (!appState.evilMode) {
    if (appState.ap.bet >= 50000000) apTrapChance = 0.85;
    else if (appState.ap.bet >= 5000000) apTrapChance = 0.70;
    else if (appState.ap.bet >= 500000) apTrapChance = 0.55;
    else if (appState.ap.bet >= 50000) apTrapChance = 0.40;
  }
  if (Math.random() < apTrapChance && appState.ap.grid && appState.ap.grid[r]) {
    if (!appState.ap.grid[r][c]) {
      const rottenCols = [];
      for (let col = 0; col < 4; col++) {
        if (appState.ap.grid[r][col]) rottenCols.push(col);
      }
      if (rottenCols.length > 0) {
        const swapCol = rottenCols[Math.floor(Math.random() * rottenCols.length)];
        appState.ap.grid[r][c] = true;
        appState.ap.grid[r][swapCol] = false;
      }
    }
  }

  const isRotten = Boolean(appState.ap.grid && appState.ap.grid[r] && appState.ap.grid[r][c]);
  const rowEl = document.querySelector(`#appleBoard .board-row[data-r="${r}"]`);
  if (!rowEl) {
    appState.ap.busy = false;
    return;
  }
  const cellEl = rowEl.querySelector(`.cell[data-c="${c}"]`);
  if (!cellEl) {
    appState.ap.busy = false;
    return;
  }
  const rect = cellEl.getBoundingClientRect();

  if (isRotten) {
    appState.ap.playing = false;
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");
    fx.explode(rect.left + rect.width / 2, rect.top + rect.height / 2);

    cellEl.classList.add("revealed-bomb");
    cellEl.innerHTML = APPLE_MODELS.bomb;

    revealAppleMines();
    finishAppleGame(false);
  } else {
    audio.play("step", r);
    triggerHaptic("medium");

    cellEl.classList.add("revealed-safe");
    cellEl.innerHTML = APPLE_MODELS.safe;

    const mult = APPLE_ODDS[r];
    const currentWin = Math.floor(appState.ap.bet * mult);

    const cashBtn = document.getElementById("appleCashoutBtn");
    if (cashBtn) cashBtn.disabled = false;
    const cashSum = document.getElementById("appleCashoutSum");
    if (cashSum) cashSum.textContent = `${formatMoney(currentWin)} UZS (${mult.toFixed(2)}x)`;

    if (r === 9) {
      appState.ap.row = 10;
      appState.ap.busy = false;
      cashoutApple();
    } else {
      // 1xBet kabi: har 1 ta to'g'ri olma topilganda, keyingi barcha qatorlardagi noto'g'ri olmalar joyi dinamik o'zgaradi!
      for (let nextR = r + 1; nextR < 10; nextR++) {
        const newRow = [true, true, false, false];
        for (let i = newRow.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newRow[i], newRow[j]] = [newRow[j], newRow[i]];
        }
        appState.ap.grid[nextR] = newRow;
      }
      appState.ap.row++;
      updateAppleActiveRows();
      appState.ap.busy = false;
    }
  }
}

function revealAppleMines() {
  if (!Array.isArray(appState.ap.grid)) return;
  for (let r = 0; r < 10; r++) {
    const rowEl = document.querySelector(`#appleBoard .board-row[data-r="${r}"]`);
    if (!rowEl) continue;
    for (let c = 0; c < 4; c++) {
      const cell = rowEl.querySelector(`.cell[data-c="${c}"]`);
      if (!cell) continue;
      if (cell.classList.contains("revealed-safe") || cell.classList.contains("revealed-bomb")) continue;
      const isBomb = appState.ap.grid[r] && appState.ap.grid[r][c];
      if (isBomb) {
        cell.classList.add("ghost-bomb");
        cell.innerHTML = APPLE_MODELS.bomb;
      } else {
        cell.classList.add("ghost-safe");
        cell.innerHTML = APPLE_MODELS.safe;
      }
    }
  }
}

function cashoutApple() {
  if (!appState.ap.playing || appState.ap.busy) return;
  const cashBtn = document.getElementById("appleCashoutBtn");
  if (cashBtn && cashBtn.disabled) return;
  if (cashBtn) cashBtn.disabled = true;
  appState.ap.busy = true;
  appState.ap.playing = false;

  const earnedRow = Math.max(0, appState.ap.row === 10 ? 9 : appState.ap.row - 1);
  const mult = APPLE_ODDS[earnedRow];
  const winSum = Math.floor(appState.ap.bet * mult);

  audio.play("win");
  triggerHaptic("success");
  fx.confetti();

  revealAppleMines();
  finishAppleGame(true, winSum, mult);
}

async function finishAppleGame(win, winSum = 0, mult = 0) {
  appState.ap.playing = false;

  const cashBox = document.getElementById("appleCashoutBox");
  if (cashBox) cashBox.style.display = "none";
  const betBox = document.getElementById("appleBettingBox");
  if (betBox) betBox.style.display = "flex";

  if (win) {
    updateBalanceUI(appState.balance + winSum, true);
    showToast(`🍎 +${formatMoney(winSum)} UZS (${mult.toFixed(2)}x) YUTUQ!`, true);
  } else {
    showToast(`🍏 Zaharli olma chiqdi! (-${formatMoney(appState.ap.bet)} UZS)`, false);
  }

  try {
    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "Apple of Fortune",
      bet: appState.ap.bet,
      win: win ? winSum : 0,
      multiplier: win ? mult : 0
    });

    if (res?.ok && typeof res.balance === "number") {
      updateBalanceUI(res.balance, false);
      if (res.provably_hash) {
        appState.lastHash = res.provably_hash;
        const ph = document.getElementById("lastProvablyHash");
        if (ph) ph.textContent = res.provably_hash;
      }
      if (res.tasks) renderTasksList(res.tasks);
    }
  } catch (e) {
  } finally {
    appState.ap.busy = false;
  }

  clearTimeout(apResetTimer);
  apResetTimer = setTimeout(() => {
    if (!appState.ap.playing) {
      renderAppleBoard();
      updateAppleActiveRows();
    }
  }, 1400);
}

document.getElementById("apStartBtn").addEventListener("click", startAppleGame);
document.getElementById("appleCashoutBtn").addEventListener("click", cashoutApple);

document.querySelectorAll("#view-apple .b-chip").forEach(c => {
  c.addEventListener("click", () => {
    if (appState.ap.playing) return;
    setBetChip("apBetInput", c.dataset.v);
  });
});

document.getElementById("apMinus").addEventListener("click", () => {
  if (appState.ap.playing) return;
  adjustBetInput("apBetInput", "minus");
});

document.getElementById("apPlus").addEventListener("click", () => {
  if (appState.ap.playing) return;
  adjustBetInput("apBetInput", "plus");
});

document.getElementById("apHalf").addEventListener("click", () => {
  if (appState.ap.playing) return;
  adjustBetInput("apBetInput", "half");
});

document.getElementById("apDouble").addEventListener("click", () => {
  if (appState.ap.playing) return;
  adjustBetInput("apBetInput", "double");
});

document.getElementById("apMax").addEventListener("click", () => {
  if (appState.ap.playing) return;
  adjustBetInput("apBetInput", "max");
});

function resizeCrashCanvas() {
  if (!crashCanvas) crashCanvas = document.getElementById("crashCanvas");
  if (!crashCanvas) return;
  const parent = crashCanvas.parentElement;
  const w = parent && parent.clientWidth > 20 ? parent.clientWidth : 360;
  const h = parent && parent.clientHeight > 20 ? parent.clientHeight : 220;
  if (crashCanvas.width !== w || crashCanvas.height !== h) {
    crashCanvas.width = w;
    crashCanvas.height = h;
  }
}
window.addEventListener("resize", resizeCrashCanvas);

function initCrashCanvas() {
  crashCanvas = document.getElementById("crashCanvas");
  if (!crashCanvas) return;
  crashCtx = crashCanvas.getContext("2d");
  resizeCrashCanvas();
}

function drawAviatorPlane(ctx, x, y, angle, isCrashed, time) {
  try {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (!isCrashed) {
      // Jet Engine Afterburner Flame
      const flicker1 = Math.sin(time * 45) * 4;
      const flicker2 = Math.cos(time * 38) * 3;
      const flameLen = 22 + flicker1;

      const flameGrad = ctx.createLinearGradient(-flameLen - 12, 0, -10, 0);
      flameGrad.addColorStop(0, "rgba(255, 69, 0, 0)");
      flameGrad.addColorStop(0.3, "rgba(255, 120, 0, 0.75)");
      flameGrad.addColorStop(0.7, "rgba(255, 220, 0, 0.95)");
      flameGrad.addColorStop(1, "rgba(0, 240, 255, 1)");

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-flameLen - 12, -2 + flicker2 * 0.4);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();

      // Hot inner flame core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-flameLen * 0.5 - 10, 0);
      ctx.lineTo(-10, 2);
      ctx.closePath();
      ctx.fill();

      // Supersonic Mach Shock Rings (safe radii)
      const shockPulse = Math.abs((time * 8) % 1);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 0.4 * (1 - shockPulse))})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const rx = Math.max(1, 4 + shockPulse * 6);
      const ry = Math.max(1, 8 + shockPulse * 10);
      ctx.ellipse(-18 - shockPulse * 16, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Red Fuselage Body
    ctx.fillStyle = "#e02020";
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(8, -7);
    ctx.lineTo(-18, -6);
    ctx.lineTo(-24, -3);
    ctx.lineTo(-24, 3);
    ctx.lineTo(-18, 6);
    ctx.lineTo(8, 7);
    ctx.closePath();
    ctx.fill();

    // White Speed Stripe
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(6, 1.5);
    ctx.lineTo(-16, 1.5);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fill();

    // Main Wing Top
    ctx.fillStyle = "#a81313";
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.lineTo(-10, -26);
    ctx.lineTo(-18, -26);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fill();

    // Wing Tip White Decal
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-10, -26);
    ctx.lineTo(-18, -26);
    ctx.lineTo(-16, -22);
    ctx.lineTo(-8, -22);
    ctx.closePath();
    ctx.fill();

    // Wing Bottom
    ctx.fillStyle = "#7a0c0c";
    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.lineTo(-8, 18);
    ctx.lineTo(-15, 18);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    // Tail Fin
    ctx.fillStyle = "#b81616";
    ctx.beginPath();
    ctx.moveTo(-14, -5);
    ctx.lineTo(-24, -16);
    ctx.lineTo(-28, -16);
    ctx.lineTo(-22, -5);
    ctx.closePath();
    ctx.fill();

    // Cockpit Tinted Canopy Glass
    const canopyGrad = ctx.createLinearGradient(8, -6, 20, 0);
    canopyGrad.addColorStop(0, "rgba(0, 240, 255, 0.9)");
    canopyGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    canopyGrad.addColorStop(1, "rgba(10, 50, 90, 0.8)");
    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.lineTo(20, -1);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  } catch (err) {
    try { ctx.restore(); } catch (e) {}
  }
}

function drawCrashGrid(w, h) {
  crashCtx.strokeStyle = "rgba(33, 133, 235, 0.12)";
  crashCtx.lineWidth = 1;
  for (let x = 30; x < w; x += 45) {
    crashCtx.beginPath();
    crashCtx.moveTo(x, 0);
    crashCtx.lineTo(x, h - 30);
    crashCtx.stroke();
  }
  for (let y = 20; y < h - 30; y += 35) {
    crashCtx.beginPath();
    crashCtx.moveTo(30, y);
    crashCtx.lineTo(w, y);
    crashCtx.stroke();
  }

  crashCtx.strokeStyle = "rgba(33, 133, 235, 0.35)";
  crashCtx.lineWidth = 2;
  crashCtx.beginPath();
  crashCtx.moveTo(25, h - 30);
  crashCtx.lineTo(w - 10, h - 30);
  crashCtx.stroke();
}

function crashLoop(now) {
  if (!crashCtx) return;
  const crashView = document.getElementById("view-crash");
  // Immediately stop animation if view is not visible
  if (!crashView || crashView.style.display === "none") {
    if (appState.cr.animId) {
      cancelAnimationFrame(appState.cr.animId);
      appState.cr.animId = null;
    }
    return;
  }

  // Ensure canvas dimensions match parent container
  if (crashCanvas.width <= 20 || crashCanvas.height <= 20) {
    resizeCrashCanvas();
  }

  const w = crashCanvas.width;
  const h = crashCanvas.height;
  crashCtx.clearRect(0, 0, w, h);

  drawCrashGrid(w, h);

  const multText = document.getElementById("crashMultText");
  const actionBtn = document.getElementById("crashActionBtn");

  if (appState.cr.state === "idle") {
    if (multText) {
      multText.style.display = "block";
      multText.className = "crash-multiplier-center";
      multText.textContent = "1.00x";
    }

    const planeY = (h - 30) - 10 + Math.sin(now * 0.0035) * 2;
    drawAviatorPlane(crashCtx, 60, planeY, 0, false, now * 0.001);
  } else if (appState.cr.state === "countdown") {
    if (multText) multText.style.display = "none";
    const elapsedCd = (now - appState.cr.countdownStart) / 1000;
    const remaining = Math.max(0, appState.cr.countdownDuration - elapsedCd);

    const secInt = Math.ceil(remaining);
    if (secInt !== appState.cr.lastTickSec && secInt > 0) {
      appState.cr.lastTickSec = secInt;
      audio.play("tick");
      triggerHaptic("light");
    }

    if (actionBtn) {
      actionBtn.className = "btn-crash-action btn-cancel-mode";
      actionBtn.textContent = `BEKOR QILISH (${remaining.toFixed(1)}s)`;
    }

    const planeY = (h - 30) - 10 + Math.sin(now * 0.0035) * 2;
    drawAviatorPlane(crashCtx, 60, planeY, 0, false, now * 0.001);

    const centerX = w / 2;
    const centerY = h / 2 - 12;
    const radius = Math.min(w * 0.16, 50);
    const progress = remaining / appState.cr.countdownDuration;

    crashCtx.beginPath();
    crashCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    crashCtx.fillStyle = "rgba(10, 22, 36, 0.85)";
    crashCtx.fill();
    crashCtx.lineWidth = 4;
    crashCtx.strokeStyle = "rgba(33, 133, 235, 0.25)";
    crashCtx.stroke();

    crashCtx.beginPath();
    crashCtx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2, false);
    crashCtx.strokeStyle = "#ffc700";
    crashCtx.lineWidth = 5;
    crashCtx.stroke();

    crashCtx.fillStyle = "#ffffff";
    crashCtx.font = "bold 24px Oswald, Roboto, sans-serif";
    crashCtx.textAlign = "center";
    crashCtx.textBaseline = "middle";
    crashCtx.fillText(`${remaining.toFixed(1)}s`, centerX, centerY);

    crashCtx.font = "bold 11px Roboto, sans-serif";
    crashCtx.fillStyle = "#8fa5bf";
    crashCtx.fillText("PARVOZ BOSHLANISHIGA", centerX, centerY + radius + 18);

    if (remaining <= 0) {
      launchCrashFlight();
    }
  } else if (appState.cr.state === "flying") {
    if (multText) multText.style.display = "block";
    let currentMult = 1.00;

    const elapsed = appState.cr.mode === "online"
      ? Math.max(0, (now - (appState.cr.flightStartTime || now)) / 1000)
      : Math.max(0, (now - appState.cr.startTime) / 1000);

    currentMult = Math.max(1.00, Math.exp(0.06 * elapsed));
    appState.cr.multiplier = currentMult;

    if (multText) {
      multText.className = "crash-multiplier-center";
      multText.textContent = `${currentMult.toFixed(2)}x`;
    }

    if (actionBtn) {
      if (appState.cr.mode === "online") {
        if (appState.cr.myBetPlaced && !appState.cr.userCashedOut) {
          const curWin = Math.floor(appState.cr.myBetAmount * currentMult);
          actionBtn.className = "btn-crash-action btn-cashout-mode";
          actionBtn.textContent = `YUTUQNI OLISH (${formatMoney(curWin)} UZS)`;
        } else if (appState.cr.myBetPlaced && appState.cr.userCashedOut) {
          actionBtn.className = "btn-crash-action btn-cashed-mode";
          actionBtn.textContent = `YUTUQ OLINDI! (+${formatMoney(appState.cr.userWonSum || 0)} UZS)`;
        }
      } else {
        if (!appState.cr.userCashedOut) {
          const curWin = Math.floor(appState.cr.bet * currentMult);
          actionBtn.className = "btn-crash-action btn-cashout-mode";
          actionBtn.textContent = `YUTUQNI OLISH (${formatMoney(curWin)} UZS)`;
        }
      }
    }

    // Continuous, buttery-smooth aerodynamic flight path
    const x0 = 35;
    const y0 = h - 30;
    const maxX = w * 0.76;
    const minY = h * 0.22;

    const progress = Math.min(1.0, 1.0 - Math.exp(-0.075 * elapsed));
    const px = x0 + (maxX - x0) * progress;
    const baseY = y0 - (y0 - minY) * Math.pow(progress, 0.82);
    const floatOffset = Math.sin(now * 0.0028) * 3.5 * progress;
    const py = baseY + floatOffset;

    const climbAngle = -0.42 + 0.18 * progress;
    const floatAngle = Math.cos(now * 0.0028) * 0.03 * progress;
    const angle = climbAngle + floatAngle;

    appState.cr.lastPlaneX = px;
    appState.cr.lastPlaneY = py;
    appState.cr.lastPlaneAngle = angle;

    const cpx = x0 + (px - x0) * 0.52;
    const cpy = y0;

    // Glowing gradient below trajectory
    const grad = crashCtx.createLinearGradient(0, py, 0, y0);
    grad.addColorStop(0, "rgba(255, 71, 87, 0.32)");
    grad.addColorStop(0.65, "rgba(255, 71, 87, 0.06)");
    grad.addColorStop(1, "rgba(255, 71, 87, 0.0)");

    crashCtx.beginPath();
    crashCtx.moveTo(x0, y0);
    crashCtx.quadraticCurveTo(cpx, cpy, px, py);
    crashCtx.lineTo(px, y0);
    crashCtx.closePath();
    crashCtx.fillStyle = grad;
    crashCtx.fill();

    // Laser glowing trajectory line
    crashCtx.beginPath();
    crashCtx.moveTo(x0, y0);
    crashCtx.quadraticCurveTo(cpx, cpy, px, py);
    crashCtx.lineWidth = 5;
    crashCtx.strokeStyle = "rgba(255, 71, 87, 0.25)";
    crashCtx.stroke();

    crashCtx.lineWidth = 2.5;
    crashCtx.strokeStyle = "#ff4757";
    crashCtx.stroke();

    // High performance exhaust particles
    if (!appState.cr.particles) appState.cr.particles = [];
    if (appState.cr.particles.length < 18) {
      const exX = px - 20 * Math.cos(angle);
      const exY = py - 20 * Math.sin(angle);
      appState.cr.particles.push({
        x: exX,
        y: exY,
        vx: -Math.cos(angle) * (3.0 + Math.random() * 2.0) + (Math.random() - 0.5) * 1.0,
        vy: -Math.sin(angle) * (3.0 + Math.random() * 2.0) + (Math.random() - 0.5) * 1.0,
        r: 2.0 + Math.random() * 2.0,
        alpha: 0.85,
        decay: 0.045 + Math.random() * 0.02
      });
    }

    if (appState.cr.particles.length > 0) {
      crashCtx.save();
      crashCtx.globalCompositeOperation = "lighter";
      crashCtx.fillStyle = "#ff6348";
      for (let i = appState.cr.particles.length - 1; i >= 0; i--) {
        const pt = appState.cr.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) {
          appState.cr.particles.splice(i, 1);
          continue;
        }
        crashCtx.globalAlpha = Math.max(0, Math.min(1, pt.alpha));
        crashCtx.beginPath();
        crashCtx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        crashCtx.fill();
      }
      crashCtx.restore();
    }

    drawAviatorPlane(crashCtx, px, py, angle, false, now * 0.001);

    if (appState.cr.mode === "offline" && currentMult >= appState.cr.crashPoint) {
      endCrashRound(false);
    }
  } else if (appState.cr.state === "crashed") {
    if (multText) multText.style.display = "block";
    const x0 = 35;
    const y0 = h - 30;
    const px = appState.cr.lastPlaneX || (w * 0.70);
    const py = appState.cr.lastPlaneY || (h * 0.30);
    const cpx = x0 + (px - x0) * 0.52;
    const cpy = y0;

    // Dashed trajectory of completed flight
    crashCtx.save();
    crashCtx.setLineDash([5, 5]);
    crashCtx.beginPath();
    crashCtx.moveTo(x0, y0);
    crashCtx.quadraticCurveTo(cpx, cpy, px, py);
    crashCtx.lineWidth = 2;
    crashCtx.strokeStyle = "rgba(231, 76, 60, 0.4)";
    crashCtx.stroke();
    crashCtx.restore();

    appState.cr.zoomOffset = (appState.cr.zoomOffset || 0) + 14;
    const flyX = px + appState.cr.zoomOffset;
    const flyY = py - appState.cr.zoomOffset * 0.85;

    if (flyX < w + 100 && flyY > -100) {
      drawAviatorPlane(crashCtx, flyX, flyY, -0.72, true, now * 0.001);
    }
  }

  appState.cr.animId = requestAnimationFrame(crashLoop);
}

function renderAviatorLiveBets(bets, currentUserBet) {
  const table = document.getElementById("crLiveBetsTable");
  if (!table) return;

  const totalPlayersEl = document.getElementById("crTotalPlayers");
  const totalPoolEl = document.getElementById("crTotalPool");

  const safeBets = Array.isArray(bets) ? bets : [];
  if (totalPlayersEl) totalPlayersEl.textContent = safeBets.length;
  let pool = 0;
  safeBets.forEach(b => pool += (b.bet || 0));
  if (totalPoolEl) totalPoolEl.textContent = `BANK: ${formatMoney(pool)} UZS`;

  // Signature check: do NOT touch DOM if bets didn't change
  const sig = JSON.stringify(safeBets.map(b => [b.user_id, b.bet, b.status, b.win, b.cashout_mult]));
  if (sig === appState.cr.lastBetsSignature) return;
  appState.cr.lastBetsSignature = sig;

  if (safeBets.length === 0) {
    table.innerHTML = `
      <div class="cr-empty-bets">
        <div class="cr-empty-icon">👥</div>
        <div class="cr-empty-title">Hozircha hech kim stavka qilmadi</div>
        <div class="cr-empty-desc">Ushbu raundda birinchi bo'lib stavka qiling!</div>
      </div>
    `;
    return;
  }

  table.innerHTML = safeBets.map(b => {
    const isMe = b.user_id === USER_ID;
    const initial = (b.name || "O")[0].toUpperCase();
    const uname = b.username ? `@${b.username}` : (b.name || "O'yinchi");
    let rowClass = "cf-bet-row cr-bet-row";
    let badgeHtml = "";

    if (b.status === "won") {
      rowClass += " winner";
      const mText = b.cashout_mult ? `${b.cashout_mult.toFixed(2)}x` : "";
      badgeHtml = `<span class="cf-p-badge win">+${formatMoney(b.win)} UZS (${mText})</span>`;
    } else if (b.status === "lost") {
      rowClass += " loser";
      badgeHtml = `<span class="cf-p-badge lose">-${formatMoney(b.bet)} UZS</span>`;
    } else {
      badgeHtml = `<span class="cf-p-badge pending">Uchmoqda... 🚀</span>`;
    }

    if (isMe) rowClass += " me";

    return `
      <div class="${rowClass}">
        <div class="cf-p-info">
          <div class="cf-p-avatar">${initial}</div>
          <span class="cf-p-name">${isMe ? '⭐ Siz' : uname}</span>
        </div>
        <div class="cf-p-right" style="display:flex;align-items:center;gap:6px;">
          <span class="cf-p-amount">${formatMoney(b.bet)} UZS</span>
          ${badgeHtml}
        </div>
      </div>
    `;
  }).join("");
}

let crOnlinePollTimer = null;
function startAviatorOnlinePolling() {
  if (crOnlinePollTimer) return;
  fetchAviatorOnlineStatus();
  crOnlinePollTimer = setInterval(fetchAviatorOnlineStatus, 450);
}

function stopAviatorOnlinePolling() {
  if (crOnlinePollTimer) {
    clearInterval(crOnlinePollTimer);
    crOnlinePollTimer = null;
  }
}

async function fetchAviatorOnlineStatus() {
  if (appState.cr.mode !== "online") return;
  const crashView = document.getElementById("view-crash");
  if (!crashView || crashView.style.display === "none") return;

  try {
    const data = await apiFetch(`/api/aviator/status?user_id=${USER_ID}`);
    // Check mode again in case user switched while waiting for response
    if (appState.cr.mode !== "online" || !data?.ok) return;

    appState.cr.roundId = data.round_id;
    appState.cr.onlinePhase = data.phase;
    appState.cr.myBetPlaced = Boolean(data.user_bet);

    const roundTag = document.getElementById("crRoundTag");
    if (roundTag) roundTag.textContent = `RAUND #${data.round_id}`;

    // Update history badges only when changed
    const histSig = JSON.stringify(data.history || []);
    if (histSig !== appState.cr.lastHistorySignature) {
      appState.cr.lastHistorySignature = histSig;
      const histEl = document.getElementById("crHistoryStrip");
      if (histEl && data.history) {
        histEl.innerHTML = data.history.map(m => {
          let cls = "mult-low";
          if (m >= 10.0) cls = "mult-epic";
          else if (m >= 3.0) cls = "mult-high";
          else if (m >= 1.5) cls = "mult-mid";
          return `<span class="cr-h-badge ${cls}">${m.toFixed(2)}x</span>`;
        }).join("");
      }
    }

    renderAviatorLiveBets(data.bets || [], data.user_bet);

    const timerText = document.getElementById("crTimerText");
    const phaseText = document.getElementById("crPhaseText");
    const multText = document.getElementById("crashMultText");
    const actionBtn = document.getElementById("crashActionBtn");

    if (data.phase === "waiting") {
      appState.cr.state = "idle";
      appState.cr.multiplier = 1.00;
      appState.cr.userCashedOut = false;
      appState.cr.particles = [];
      appState.cr.zoomOffset = 0;
      if (timerText) timerText.textContent = `${data.time_left.toFixed(1)}s`;
      if (phaseText) phaseText.textContent = "STAVKALAR QABUL QILINMOQDA";
      if (multText) {
        multText.className = "crash-multiplier-center";
        multText.textContent = "1.00x";
      }

      if (actionBtn) {
        if (data.user_bet) {
          actionBtn.className = "btn-crash-action btn-danger-mode";
          actionBtn.textContent = `STAVKANI BEKOR QILISH (-${formatMoney(data.user_bet.bet)} UZS)`;
        } else {
          actionBtn.className = "btn-crash-action btn-ready";
          actionBtn.textContent = "STAVKA QILISH (ONLINE)";
        }
      }
    } else if (data.phase === "flying") {
      const serverNow = typeof data.server_time === "number" ? data.server_time : (Date.now() / 1000);
      const serverStart = typeof data.flight_start_time === "number" ? data.flight_start_time : serverNow;
      const serverElapsed = Math.max(0, serverNow - serverStart);
      const targetFlightStartTime = performance.now() - (serverElapsed * 1000);

      if (appState.cr.state !== "flying") {
        appState.cr.state = "flying";
        appState.cr.flightStartTime = targetFlightStartTime;
        audio.play("takeoff");
        triggerHaptic("medium");
        appState.cr.particles = [];
        appState.cr.zoomOffset = 0;
      } else if (Math.abs((appState.cr.flightStartTime || 0) - targetFlightStartTime) > 600) {
        // Soft sync if clock drift exceeds 600ms without abrupt jumping
        appState.cr.flightStartTime += (targetFlightStartTime - appState.cr.flightStartTime) * 0.15;
      }
      appState.cr.targetMultiplier = data.multiplier;
      appState.cr.crashPoint = data.crash_point;
      if (data.user_bet) {
        appState.cr.myBetPlaced = true;
        appState.cr.myBetAmount = data.user_bet.bet;
        appState.cr.userCashedOut = Boolean(data.user_bet.cashed_out);
      } else {
        appState.cr.myBetPlaced = false;
      }

      if (timerText) timerText.textContent = "PARVOZDA! 🚀";
      if (phaseText) phaseText.textContent = "SAMOLYOT HAVODA";

      if (actionBtn) {
        if (data.user_bet && !data.user_bet.cashed_out) {
          const curWin = Math.floor(data.user_bet.bet * (appState.cr.multiplier || data.multiplier));
          actionBtn.className = "btn-crash-action btn-cashout-mode";
          actionBtn.textContent = `YUTUQNI OLISH (${formatMoney(curWin)} UZS)`;
        } else if (data.user_bet && data.user_bet.cashed_out) {
          actionBtn.className = "btn-crash-action btn-cashed-mode";
          actionBtn.textContent = `YUTUQ OLINDI! (+${formatMoney(data.user_bet.win)} UZS)`;
        } else {
          actionBtn.className = "btn-crash-action btn-ready";
          actionBtn.textContent = "RAUND DAVOM ETMOQDA...";
        }
      }
    } else if (data.phase === "crashed") {
      if (appState.cr.state !== "crashed") {
        triggerScreenShake();
        audio.play("boom");
        triggerHaptic("error");
        if (data.user_bet && !data.user_bet.cashed_out) {
          showToast(`💥 Samolyot ${(data.crash_point || data.multiplier).toFixed(2)}x da uchib ketdi! (-${formatMoney(data.user_bet.bet)} UZS)`, false);
        }
      }
      if (typeof data.balance === "number") {
        updateBalanceUI(data.balance, false);
      }
      appState.cr.state = "crashed";
      appState.cr.crashPoint = data.crash_point || data.multiplier;
      if (timerText) timerText.textContent = "PORTLASH! 💥";
      if (phaseText) phaseText.textContent = "KEYINGI RAUND KUTILMOQDA...";
      if (multText) {
        multText.className = "crash-multiplier-center crashed";
        multText.textContent = `${(data.crash_point || data.multiplier).toFixed(2)}x UCHIB KETDI!`;
      }
      if (actionBtn) {
        actionBtn.className = "btn-crash-action btn-ready";
        actionBtn.textContent = "PORTLASH! (KUTILMOQDA)";
      }
    }
  } catch (e) {}
}

function setCrashMode(mode) {
  appState.cr.mode = mode;
  audio.play("click");
  triggerHaptic("light");
  const btnOn = document.getElementById("crTabOnline");
  const btnOff = document.getElementById("crTabOffline");
  const bar = document.getElementById("crOnlineBar");
  const liveCard = document.getElementById("crLiveBetsCard");

  if (mode === "online") {
    btnOn?.classList.add("active");
    btnOff?.classList.remove("active");
    if (bar) bar.style.display = "flex";
    if (liveCard) liveCard.style.display = "flex";
    startAviatorOnlinePolling();
  } else {
    btnOff?.classList.add("active");
    btnOn?.classList.remove("active");
    if (bar) bar.style.display = "none";
    if (liveCard) liveCard.style.display = "none";
    stopAviatorOnlinePolling();
    appState.cr.state = "idle";
    appState.cr.multiplier = 1.00;
    appState.cr.particles = [];
    appState.cr.zoomOffset = 0;
    const actionBtn = document.getElementById("crashActionBtn");
    if (actionBtn) {
      actionBtn.className = "btn-crash-action btn-ready";
      actionBtn.textContent = "PARVOZNI BOSHLASH (OFFLINE)";
    }
    const multText = document.getElementById("crashMultText");
    if (multText) {
      multText.className = "crash-multiplier-center";
      multText.textContent = "1.00x";
    }
  }
}

let crashTabsBound = false;
function initCrashGame() {
  initCrashCanvas();
  if (appState.cr.animId) {
    cancelAnimationFrame(appState.cr.animId);
    appState.cr.animId = null;
  }
  appState.cr.animId = requestAnimationFrame(crashLoop);
  if (!crashTabsBound) {
    document.getElementById("crTabOnline")?.addEventListener("click", () => setCrashMode("online"));
    document.getElementById("crTabOffline")?.addEventListener("click", () => setCrashMode("offline"));
    crashTabsBound = true;
  }
  setCrashMode(appState.cr.mode || "online");
}

function startCrashRound() {
  if (appState.cr.state === "countdown" || appState.cr.state === "flying") return;
  const betVal = getValidatedBet("crBetInput");
  if (!betVal) return;

  appState.cr.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.cr.state = "countdown";
  appState.cr.countdownDuration = 2.0;
  appState.cr.countdownStart = performance.now();
  appState.cr.lastTickSec = 2;
  appState.cr.userCashedOut = false;
  appState.cr.userWonSum = 0;
  appState.cr.userWonMult = 0;
  appState.cr.zoomOffset = 0;
  appState.cr.particles = [];

  audio.play("tick");
  triggerHaptic("light");
}

function cancelCrashCountdown() {
  if (appState.cr.state !== "countdown") return;
  audio.play("click");
  updateBalanceUI(appState.balance + appState.cr.bet);
  appState.cr.state = "idle";
  appState.cr.particles = [];
  appState.cr.zoomOffset = 0;

  const actionBtn = document.getElementById("crashActionBtn");
  if (actionBtn) {
    actionBtn.className = "btn-crash-action btn-ready";
    actionBtn.textContent = "PARVOZNI BOSHLASH (OFFLINE)";
  }

  const multText = document.getElementById("crashMultText");
  if (multText) {
    multText.style.display = "block";
    multText.className = "crash-multiplier-center";
    multText.textContent = "1.00x";
  }

  showToast("Stavka bekor qilindi, mablag' qaytarildi", true);
}

function generateOfflineCrashPoint(bet = 0) {
  if (appState.aviatorRngEnabled && appState.aviatorTarget !== null) {
    return Math.max(1.00, appState.aviatorTarget);
  }
  if (appState.evilMode) {
    const r = Math.random();
    if (r < 0.50) return 1.00;
    if (r < 0.85) return Number((1.01 + Math.random() * 0.20).toFixed(2));
    return Number((1.20 + Math.random() * 0.35).toFixed(2));
  }

  const b = typeof bet === "number" && bet > 0 ? bet : (appState.cr.bet || 0);

  // 🚀 Ko'p pul tikilganda mergelar sezilarli darajada kamroq (past) bo'ladi
  if (b >= 500000000) { // >= 500 mln (masalan 700 mln)
    const r = Math.random();
    if (r < 0.40) return 1.00;
    if (r < 0.80) return Number((1.01 + Math.random() * 0.05).toFixed(2));
    return Number((1.06 + Math.random() * 0.06).toFixed(2));
  } else if (b >= 50000000) { // >= 50 mln
    const r = Math.random();
    if (r < 0.30) return 1.00;
    if (r < 0.75) return Number((1.01 + Math.random() * 0.12).toFixed(2));
    return Number((1.13 + Math.random() * 0.12).toFixed(2));
  } else if (b >= 5000000) { // >= 5 mln
    const r = Math.random();
    if (r < 0.20) return 1.00;
    if (r < 0.70) return Number((1.02 + Math.random() * 0.25).toFixed(2));
    return Number((1.27 + Math.random() * 0.23).toFixed(2));
  } else if (b >= 500000) { // >= 500k
    const r = Math.random();
    if (r < 0.15) return 1.00;
    if (r < 0.65) return Number((1.05 + Math.random() * 0.35).toFixed(2));
    return Number((1.40 + Math.random() * 0.35).toFixed(2));
  } else if (b >= 50000) { // >= 50k
    const r = Math.random();
    if (r < 0.10) return 1.00;
    if (r < 0.60) return Number((1.10 + Math.random() * 0.45).toFixed(2));
    return Number((1.55 + Math.random() * 0.55).toFixed(2));
  }

  // 1xBet Crash RNG taqsimoti
  const r = Math.random();
  if (r < 0.05) {
    return 1.00;
  } else if (r < 0.25) {
    return Number((1.01 + Math.random() * 0.34).toFixed(2));
  } else if (r < 0.60) {
    return Number((1.35 + Math.random() * 1.15).toFixed(2));
  } else if (r < 0.85) {
    return Number((2.50 + Math.random() * 3.50).toFixed(2));
  } else if (r < 0.96) {
    return Number((6.00 + Math.random() * 14.00).toFixed(2));
  } else {
    return Number((20.00 + Math.random() * 80.00).toFixed(2));
  }
}

function launchCrashFlight() {
  audio.play("takeoff");
  triggerHaptic("medium");

  appState.cr.state = "flying";
  appState.cr.startTime = performance.now();
  appState.cr.multiplier = 1.00;
  appState.cr.particles = [];
  appState.cr.zoomOffset = 0;

  appState.cr.crashPoint = generateOfflineCrashPoint(appState.cr.bet);

  const actionBtn = document.getElementById("crashActionBtn");
  if (actionBtn) {
    actionBtn.className = "btn-crash-action btn-cashout-mode";
    actionBtn.textContent = `YUTUQNI OLISH (${formatMoney(appState.cr.bet)} UZS)`;
  }

  const multText = document.getElementById("crashMultText");
  if (multText) {
    multText.style.display = "block";
    multText.className = "crash-multiplier-center";
    multText.textContent = "1.00x";
  }
}

function cashoutCrash() {
  if (appState.cr.state !== "flying" || appState.cr.userCashedOut) return;

  appState.cr.userCashedOut = true;
  const winMult = appState.cr.multiplier;
  const winSum = Math.floor(appState.cr.bet * winMult);
  appState.cr.userWonSum = winSum;
  appState.cr.userWonMult = winMult;

  updateBalanceUI(appState.balance + winSum, true);

  audio.play("win");
  triggerHaptic("success");
  fx.confetti();

  showToast(`🚀 +${formatMoney(winSum)} UZS (${winMult.toFixed(2)}x) YUTUQ!`, true);

  const actionBtn = document.getElementById("crashActionBtn");
  if (actionBtn) {
    actionBtn.className = "btn-crash-action btn-cashed-mode";
    actionBtn.textContent = `YUTUQ OLINDI! (+${formatMoney(winSum)} UZS)`;
  }

  apiFetch("/api/game-result", "POST", {
    user_id: USER_ID,
    game_name: "Aviator / Crash",
    bet: appState.cr.bet,
    win: winSum,
    multiplier: winMult
  }).then(res => {
    if (res?.ok && typeof res.balance === "number") {
      updateBalanceUI(res.balance, false);
      appState.lastHash = res.provably_hash;
      document.getElementById("lastProvablyHash").textContent = res.provably_hash;
      if (res.tasks) renderTasksList(res.tasks);
    }
  });
}

let crResetTimer = null;
async function endCrashRound(win) {
  appState.cr.state = "crashed";
  appState.cr.zoomOffset = 0;
  appState.cr.particles = [];

  const multText = document.getElementById("crashMultText");
  const actionBtn = document.getElementById("crashActionBtn");

  if (!appState.cr.userCashedOut) {
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");
    showToast(`💥 Samolyot ${appState.cr.crashPoint.toFixed(2)}x da uchib ketdi! (-${formatMoney(appState.cr.bet)} UZS)`, false);

    apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "Aviator / Crash",
      bet: appState.cr.bet,
      win: 0,
      multiplier: 0
    }).then(res => {
      if (res?.ok && typeof res.balance === "number") {
        updateBalanceUI(res.balance, false);
        appState.lastHash = res.provably_hash;
        document.getElementById("lastProvablyHash").textContent = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    });
  }

  if (multText) {
    multText.className = "crash-multiplier-center crashed";
    multText.textContent = `${appState.cr.crashPoint.toFixed(2)}x UCHIB KETDI!`;
  }

  if (actionBtn) {
    actionBtn.className = "btn-crash-action btn-ready";
    actionBtn.textContent = "PARVOZNI BOSHLASH (OFFLINE)";
  }

  clearTimeout(crResetTimer);
  crResetTimer = setTimeout(() => {
    if (appState.cr.state === "crashed") {
      appState.cr.state = "idle";
      if (multText) {
        multText.className = "crash-multiplier-center";
        multText.textContent = "1.00x";
      }
    }
  }, 1500);
}

document.getElementById("crashActionBtn")?.addEventListener("click", async () => {
  if (appState.cr.mode === "online") {
    if (appState.cr.onlinePhase === "waiting") {
      if (appState.cr.myBetPlaced) {
        const res = await apiFetch("/api/aviator/cancel", "POST", { user_id: USER_ID });
        if (res?.ok) {
          appState.cr.myBetPlaced = false;
          updateBalanceUI(res.balance);
          showToast("Stavka bekor qilindi, mablag' qaytarildi", true);
        } else {
          showToast(`❌ ${res?.error || "Xatolik"}`, false);
        }
      } else {
        const betVal = getValidatedBet("crBetInput");
        if (!betVal) return;
        const res = await apiFetch("/api/aviator/bet", "POST", {
          user_id: USER_ID,
          bet: betVal,
          first_name: FIRST_NAME,
          username: USERNAME
        });
        if (res?.ok) {
          appState.cr.myBetPlaced = true;
          updateBalanceUI(res.balance);
          showToast(`✅ ${formatMoney(betVal)} UZS stavka qabul qilindi!`, true);
          triggerHaptic("medium");
        } else {
          showToast(`❌ ${res?.error || "Xatolik"}`, false);
        }
      }
    } else if (appState.cr.onlinePhase === "flying") {
      if (appState.cr.myBetPlaced && !appState.cr.userCashedOut) {
        const res = await apiFetch("/api/aviator/cashout", "POST", { user_id: USER_ID });
        if (res?.ok) {
          appState.cr.userCashedOut = true;
          updateBalanceUI(res.balance, true);
          audio.play("win");
          triggerHaptic("success");
          fx.confetti();
          showToast(`🚀 +${formatMoney(res.win)} UZS (${res.multiplier.toFixed(2)}x) YUTUQ!`, true);
        } else {
          showToast(`❌ ${res?.error || "Xatolik"}`, false);
        }
      }
    }
  } else {
    if (appState.cr.state === "flying") {
      cashoutCrash();
    } else if (appState.cr.state === "countdown") {
      cancelCrashCountdown();
    } else if (appState.cr.state === "idle" || appState.cr.state === "crashed") {
      startCrashRound();
    }
  }
});

document.querySelectorAll("#view-crash .b-chip").forEach(c => {
  c.addEventListener("click", () => {
    if (appState.cr.state === "flying") return;
    setBetChip("crBetInput", c.dataset.v);
  });
});

document.getElementById("crMinus").addEventListener("click", () => {
  if (appState.cr.state === "flying") return;
  adjustBetInput("crBetInput", "minus");
});

document.getElementById("crPlus").addEventListener("click", () => {
  if (appState.cr.state === "flying") return;
  adjustBetInput("crBetInput", "plus");
});

document.getElementById("crHalf").addEventListener("click", () => {
  if (appState.cr.state === "flying") return;
  adjustBetInput("crBetInput", "half");
});

document.getElementById("crDouble").addEventListener("click", () => {
  if (appState.cr.state === "flying") return;
  adjustBetInput("crBetInput", "double");
});

document.getElementById("crMax").addEventListener("click", () => {
  if (appState.cr.state === "flying") return;
  adjustBetInput("crBetInput", "max");
});

function showResultModal(win, amount, desc) {
  if (win) {
    showToast(`🎉 +${formatMoney(amount)} UZS! ${desc}`, true);
  } else {
    showToast(`💥 -${formatMoney(amount)} UZS! ${desc}`, false);
  }
}

document.getElementById("continueBtn").addEventListener("click", () => {
  audio.play("click");
  document.getElementById("resultOverlay").classList.remove("active");
});

document.getElementById("promoSubmitBtn").addEventListener("click", async () => {
  audio.play("click");
  const code = document.getElementById("promoInput").value.trim();
  if (!code) return;

  const res = await apiFetch("/api/promo", "POST", { user_id: USER_ID, code });
  if (res?.ok) {
    audio.play("win");
    triggerHaptic("success");
    fx.confetti();
    updateBalanceUI(res.balance);
    showToast(`🎉 +${formatMoney(res.amount)} UZS hisobingizga qo'shildi!`, true);
    document.getElementById("promoInput").value = "";
  } else {
    audio.play("boom");
    triggerHaptic("error");
    showToast(`❌ ${res.error || "Promokod noto'g'ri"}`, false);
  }
});

document.querySelectorAll(".promo-hints .tag").forEach(tag => {
  tag.addEventListener("click", () => {
    audio.play("click");
    document.getElementById("promoInput").value = tag.dataset.code;
    showToast(`Promokod kiritildi: ${tag.dataset.code}`, true);
  });
});

document.getElementById("copyRefBtn").addEventListener("click", () => {
  audio.play("click");
  triggerHaptic("light");
  const input = document.getElementById("refLinkInput");
  input.select();
  navigator.clipboard.writeText(input.value);
  showToast("📋 Havoladan nusxa olindi! Do'stlarga yuboring.", true);
});

document.getElementById("shareTgBtn").addEventListener("click", () => {
  audio.play("click");
  const link = document.getElementById("refLinkInput").value;
  const text = encodeURIComponent("NVINDIA GAMES platformasiga qo'shiling va boshlang'ich bonus oling! 🚀💰");
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, "_blank");
  }
});

document.getElementById("topupBtn").addEventListener("click", async () => {
  audio.play("click");
  triggerHaptic("light");
  const res = await apiFetch("/api/topup", "POST", { user_id: USER_ID, amount: 10000 });
  if (res?.ok) {
    audio.play("win");
    updateBalanceUI(res.balance);
    showToast("💰 +10 000 UZS balansga qo'shildi!", true);
  }
});

const balContainer = document.querySelector(".balance-container");
if (balContainer) {
  balContainer.addEventListener("click", (e) => {
    if (e.target.id !== "topupBtn") {
      document.getElementById("topupBtn").click();
    }
  });
}

const heroBanner = document.querySelector(".hero-banner");
if (heroBanner) {
  heroBanner.addEventListener("click", (e) => {
    if (e.target.id !== "bannerRefBtn") {
      document.querySelector('.tab-btn[data-tab="referral"]').click();
    }
  });
}

document.getElementById("soundToggle").addEventListener("click", () => {
  appState.sound = !appState.sound;
  safeStorage.setItem("one_sound", appState.sound.toString());
  document.getElementById("soundToggle").textContent = appState.sound ? "🔊" : "🔇";
  triggerHaptic("light");
});
document.getElementById("soundToggle").textContent = appState.sound ? "🔊" : "🔇";

document.getElementById("provablyBtn").addEventListener("click", () => {
  audio.play("click");
  document.getElementById("lastProvablyHash").textContent = appState.lastHash;
  document.getElementById("provablyModal").classList.add("active");
});

document.getElementById("closeProvablyBtn").addEventListener("click", () => {
  audio.play("click");
  document.getElementById("provablyModal").classList.remove("active");
});

document.getElementById("provablyModal").addEventListener("click", (e) => {
  if (e.target.id === "provablyModal") {
    document.getElementById("provablyModal").classList.remove("active");
  }
});

const bgmToggle = document.getElementById("bgmToggle");
if (bgmToggle) {
  bgmToggle.addEventListener("click", () => {
    const isPlaying = audio.toggleBgm();
    bgmToggle.classList.toggle("active", isPlaying);
    bgmToggle.textContent = isPlaying ? "🎵 ON" : "🎵 OFF";
    showToast(isPlaying ? "🎶 Soundtrack yoqildi!" : "🔇 Soundtrack to'xtatildi.", true);
  });
}

const MINES_MODELS = {
  diamond: `<div class="anim-pop"><svg viewBox="0 0 36 36" style="width:28px;height:28px;"><defs><linearGradient id="diaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a8ff78"/><stop offset="50%" stop-color="#78ffd6"/><stop offset="100%" stop-color="#00bcd4"/></linearGradient></defs><polygon points="18,2 32,12 26,32 10,32 4,12" fill="url(#diaGrad)" stroke="#00e5ff" stroke-width="1.2"/><polygon points="18,6 28,13 24,28 12,28 8,13" fill="#ffffff" opacity="0.45"/><circle cx="18" cy="18" r="3.5" fill="#fff" opacity="0.8"/></svg></div>`,
  bomb: `<div class="anim-explode"><svg viewBox="0 0 36 36" style="width:28px;height:28px;"><defs><radialGradient id="mnBombGrad" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ff7675"/><stop offset="40%" stop-color="#d63031"/><stop offset="100%" stop-color="#2d3436"/></radialGradient></defs><circle cx="18" cy="18" r="10" fill="url(#mnBombGrad)" stroke="#1e272e" stroke-width="1.2"/><line x1="18" y1="2" x2="18" y2="34" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><line x1="2" y1="18" x2="34" y2="18" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><line x1="6.7" y1="6.7" x2="29.3" y2="29.3" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><line x1="6.7" y1="29.3" x2="29.3" y2="6.7" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="18" r="4" fill="#ff4757" class="km-sensor-blink"/></svg></div>`
};

function getMinesMultiplier(minesCount, openedCount) {
  if (openedCount <= 0) return 1.00;
  let prob = 1.0;
  for (let i = 0; i < openedCount; i++) {
    prob *= (25 - minesCount - i) / (25 - i);
  }
  const fair = 0.93 / prob;
  return Math.max(1.01, parseFloat(fair.toFixed(2)));
}

function updateMinesInfoDisplays() {
  document.getElementById("minesCountDisplay").textContent = appState.mn.mines;
  const nextMult = getMinesMultiplier(appState.mn.mines, appState.mn.openedCount + 1);
  document.getElementById("minesNextMultDisplay").textContent = `x${nextMult.toFixed(2)}`;
  document.getElementById("minesMultBadge").textContent = `x${appState.mn.currentMult.toFixed(2)}`;
}

function renderMinesBoard() {
  const board = document.getElementById("minesBoard");
  if (!board) return;
  board.innerHTML = "";
  for (let i = 0; i < 25; i++) {
    const tile = document.createElement("div");
    tile.className = "mine-tile";
    tile.dataset.idx = i;
    tile.addEventListener("click", () => onMineTileClick(i));
    board.appendChild(tile);
  }
  updateMinesInfoDisplays();
}

document.querySelectorAll(".mines-trap-selector .btn-trap").forEach(btn => {
  btn.addEventListener("click", () => {
    if (appState.mn.playing) return;
    audio.play("click");
    document.querySelectorAll(".mines-trap-selector .btn-trap").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    appState.mn.mines = parseInt(btn.dataset.mines, 10);
    updateMinesInfoDisplays();
  });
});

document.querySelectorAll("#view-mines .b-chip").forEach(c => {
  c.addEventListener("click", () => {
    if (appState.mn.playing) return;
    audio.play("click");
    document.getElementById("mnBetInput").value = c.dataset.v;
  });
});

document.querySelectorAll("#view-mines .b-chip").forEach(c => {
  c.addEventListener("click", () => {
    if (appState.mn.playing) return;
    setBetChip("mnBetInput", c.dataset.v);
  });
});

document.getElementById("mnMinus")?.addEventListener("click", () => {
  if (appState.mn.playing) return;
  adjustBetInput("mnBetInput", "minus");
});

document.getElementById("mnPlus")?.addEventListener("click", () => {
  if (appState.mn.playing) return;
  adjustBetInput("mnBetInput", "plus");
});

document.getElementById("mnHalf")?.addEventListener("click", () => {
  if (appState.mn.playing) return;
  adjustBetInput("mnBetInput", "half");
});

document.getElementById("mnDouble")?.addEventListener("click", () => {
  if (appState.mn.playing) return;
  adjustBetInput("mnBetInput", "double");
});

document.getElementById("mnMax")?.addEventListener("click", () => {
  if (appState.mn.playing) return;
  adjustBetInput("mnBetInput", "max");
});

document.getElementById("mnStartBtn")?.addEventListener("click", startMinesGame);
document.getElementById("minesCashoutBtn")?.addEventListener("click", cashoutMinesGame);

function startMinesGame() {
  if (appState.mn.playing || appState.mn.busy) return;
  const betVal = getValidatedBet("mnBetInput");
  if (!betVal) return;

  appState.mn.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.mn.busy = false;
  appState.mn.playing = true;
  appState.mn.openedCount = 0;
  appState.mn.currentMult = 1.00;
  appState.mn.revealed = new Array(25).fill(false);

  const grid = new Array(25).fill(false);
  let placed = 0;
  while (placed < appState.mn.mines) {
    const r = Math.floor(Math.random() * 25);
    if (!grid[r]) {
      grid[r] = true;
      placed++;
    }
  }
  appState.mn.grid = grid;

  renderMinesBoard();

  const betBox = document.getElementById("minesBettingBox");
  if (betBox) betBox.style.display = "none";
  const cashBox = document.getElementById("minesCashoutBox");
  if (cashBox) cashBox.style.display = "block";
  const cashBtn = document.getElementById("minesCashoutBtn");
  if (cashBtn) cashBtn.disabled = true;
  const cashSum = document.getElementById("minesCashoutSum");
  if (cashSum) cashSum.textContent = "Katakni tanlang";
  triggerHaptic("medium");
}

async function onMineTileClick(idx) {
  if (!appState.mn.playing || appState.mn.busy || appState.mn.revealed[idx]) return;
  appState.mn.busy = true;

  // Smart house edge: Ko'p pul tikilganda mergelar kamroq bo'lishi uchun xavf oshadi
  let mnTrapChance = appState.evilMode ? 0.85 : 0.0;
  if (!appState.evilMode) {
    if (appState.mn.bet >= 50000000) mnTrapChance = 0.85;
    else if (appState.mn.bet >= 5000000) mnTrapChance = 0.70;
    else if (appState.mn.bet >= 500000) mnTrapChance = 0.55;
    else if (appState.mn.bet >= 50000) mnTrapChance = 0.40;
  }
  if (Math.random() < mnTrapChance && (appState.mn.openedCount >= 1 || appState.evilMode) && appState.mn.grid) {
    if (!appState.mn.grid[idx]) {
      const unrevealedMineIndices = [];
      for (let i = 0; i < 25; i++) {
        if (!appState.mn.revealed[i] && appState.mn.grid[i] && i !== idx) {
          unrevealedMineIndices.push(i);
        }
      }
      if (unrevealedMineIndices.length > 0) {
        const swapIdx = unrevealedMineIndices[Math.floor(Math.random() * unrevealedMineIndices.length)];
        appState.mn.grid[idx] = true;
        appState.mn.grid[swapIdx] = false;
      }
    }
  }

  const tileEl = document.querySelector(`.mine-tile[data-idx="${idx}"]`);
  if (!tileEl) {
    appState.mn.busy = false;
    return;
  }

  appState.mn.revealed[idx] = true;
  const isMine = Boolean(appState.mn.grid && appState.mn.grid[idx]);

  if (isMine) {
    appState.mn.playing = false;
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");
    tileEl.classList.add("revealed-bomb");
    tileEl.innerHTML = MINES_MODELS.bomb;

    document.querySelectorAll(".mine-tile").forEach((t, i) => {
      if (i !== idx) {
        if (appState.mn.grid && appState.mn.grid[i]) {
          t.classList.add("ghost-bomb");
          t.innerHTML = MINES_MODELS.bomb;
        } else {
          t.classList.add("ghost-diamond");
          t.innerHTML = MINES_MODELS.diamond;
        }
      }
    });

    try {
      const res = await apiFetch("/api/game-result", "POST", {
        user_id: USER_ID,
        game_name: "mines",
        bet: appState.mn.bet,
        win: 0,
        multiplier: 0
      });
      if (res?.ok) {
        if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
        if (res.provably_hash) appState.lastHash = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    } catch (e) {}

    showToast(`💥 Mina portladi! -${formatMoney(appState.mn.bet)} UZS`, false);

    setTimeout(() => {
      const cashBox = document.getElementById("minesCashoutBox");
      if (cashBox) cashBox.style.display = "none";
      const betBox = document.getElementById("minesBettingBox");
      if (betBox) betBox.style.display = "block";
      appState.mn.currentMult = 1.00;
      updateMinesInfoDisplays();
      appState.mn.busy = false;
    }, 1800);
  } else {
    audio.play("gem", appState.mn.openedCount);
    triggerHaptic("light");
    tileEl.classList.add("revealed-diamond");
    tileEl.innerHTML = MINES_MODELS.diamond;

    appState.mn.openedCount++;
    appState.mn.currentMult = getMinesMultiplier(appState.mn.mines, appState.mn.openedCount);
    updateMinesInfoDisplays();

    const currWin = Math.floor(appState.mn.bet * appState.mn.currentMult);
    const cashoutBtn = document.getElementById("minesCashoutBtn");
    if (cashoutBtn) cashoutBtn.disabled = false;
    const cashSum = document.getElementById("minesCashoutSum");
    if (cashSum) cashSum.textContent = `${formatMoney(currWin)} UZS (x${appState.mn.currentMult.toFixed(2)})`;

    const totalSafe = 25 - appState.mn.mines;
    if (appState.mn.openedCount >= totalSafe) {
      appState.mn.busy = false;
      cashoutMinesGame();
    } else {
      appState.mn.busy = false;
    }
  }
}

async function cashoutMinesGame() {
  if (!appState.mn.playing || appState.mn.busy) return;
  const cashBtn = document.getElementById("minesCashoutBtn");
  if (cashBtn && cashBtn.disabled) return;
  if (cashBtn) cashBtn.disabled = true;
  appState.mn.busy = true;
  appState.mn.playing = false;

  const winSum = Math.floor(appState.mn.bet * appState.mn.currentMult);
  audio.play("win");
  triggerHaptic("success");
  fx.confetti();
  updateBalanceUI(appState.balance + winSum);

  document.querySelectorAll(".mine-tile").forEach((t, i) => {
    if (!appState.mn.revealed[i]) {
      if (appState.mn.grid && appState.mn.grid[i]) {
        t.classList.add("ghost-bomb");
        t.innerHTML = MINES_MODELS.bomb;
      } else {
        t.classList.add("ghost-diamond");
        t.innerHTML = MINES_MODELS.diamond;
      }
    }
  });

  try {
    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "mines",
      bet: appState.mn.bet,
      win: winSum,
      multiplier: appState.mn.currentMult
    });
    if (res?.ok) {
      if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
      if (res.provably_hash) appState.lastHash = res.provably_hash;
      if (res.tasks) renderTasksList(res.tasks);
    }
  } catch (e) {}

  showToast(`🎉 +${formatMoney(winSum)} UZS! Yutuq olindi!`, true);

  setTimeout(() => {
    const cashBox = document.getElementById("minesCashoutBox");
    if (cashBox) cashBox.style.display = "none";
    const betBox = document.getElementById("minesBettingBox");
    if (betBox) betBox.style.display = "block";
    appState.mn.currentMult = 1.00;
    renderMinesBoard();
    updateMinesInfoDisplays();
    appState.mn.busy = false;
  }, 1800);
}

document.getElementById("thimMode1")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  audio.play("click");
  document.getElementById("thimMode1").classList.add("active");
  document.getElementById("thimMode2").classList.remove("active");
  appState.th.mode = 1;
  document.getElementById("thimblesModeBadge").textContent = "x3.80";
});

document.getElementById("thimMode2")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  audio.play("click");
  document.getElementById("thimMode2").classList.add("active");
  document.getElementById("thimMode1").classList.remove("active");
  appState.th.mode = 2;
  document.getElementById("thimblesModeBadge").textContent = "x1.90";
});

document.querySelectorAll("#view-thimbles .b-chip").forEach(c => {
  c.addEventListener("click", () => {
    if (appState.th.playing) return;
    setBetChip("thBetInput", c.dataset.v);
  });
});

document.getElementById("thMinus")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  adjustBetInput("thBetInput", "minus");
});

document.getElementById("thPlus")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  adjustBetInput("thBetInput", "plus");
});

document.getElementById("thHalf")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  adjustBetInput("thBetInput", "half");
});

document.getElementById("thDouble")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  adjustBetInput("thBetInput", "double");
});

document.getElementById("thMax")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  adjustBetInput("thBetInput", "max");
});

// 4 ta stakan uchun bosish hodisalari
document.getElementById("cup0")?.addEventListener("click", () => onThimbleClick(0));
document.getElementById("cup1")?.addEventListener("click", () => onThimbleClick(1));
document.getElementById("cup2")?.addEventListener("click", () => onThimbleClick(2));
document.getElementById("cup3")?.addEventListener("click", () => onThimbleClick(3));
document.getElementById("thStartBtn")?.addEventListener("click", startThimblesGame);

function resetThimblesUI() {
  document.querySelectorAll(".thimble-cup").forEach(c => c.classList.remove("lifted"));
  document.querySelectorAll(".thimble-ball").forEach(b => b.classList.remove("visible"));
  document.querySelectorAll(".thimble-slot").forEach(s => {
    s.style.transform = "none";
    s.style.zIndex = "1";
  });
  document.getElementById("thimblesMsg").textContent = "Stavka qiling va stakanlardan birini tanlang";
  const startBtn = document.getElementById("thStartBtn");
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = "STAVKA QILISH";
  }
}

function startThimblesGame() {
  if (appState.th.playing) return;
  const betVal = getValidatedBet("thBetInput");
  if (!betVal) return;

  appState.th.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.th.playing = true;
  appState.th.shuffling = true;
  const startBtn = document.getElementById("thStartBtn");
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = "ARALASHTIRILMOQDA...";
  }

  // 4 ta stakan uchun to'plarning boshlang'ich o'rni
  const initialBalls = [];
  if (appState.th.mode === 1) {
    initialBalls.push(Math.floor(Math.random() * 4));
  } else {
    const first = Math.floor(Math.random() * 4);
    initialBalls.push(first);
    let second = Math.floor(Math.random() * 4);
    while (second === first) {
      second = Math.floor(Math.random() * 4);
    }
    initialBalls.push(second);
  }

  // Dastlab to'plarni ko'rsatamiz
  document.querySelectorAll(".thimble-ball").forEach(b => b.classList.remove("visible"));
  initialBalls.forEach(idx => {
    const ballEl = document.getElementById(`ball${idx}`);
    if (ballEl) ballEl.classList.add("visible");
  });
  document.querySelectorAll(".thimble-cup").forEach(c => c.classList.add("lifted"));
  document.getElementById("thimblesMsg").textContent = "To'plar joylashuvi ko'rsatilmoqda...";

  // Xavfsizlik taymeri: hech qachon qotib qolmasligi uchun
  const safetyThimTimer = setTimeout(() => {
    if (appState.th.shuffling) {
      appState.th.shuffling = false;
      document.getElementById("thimblesMsg").textContent = "🎯 Stakanlardan birini tanlang!";
    }
  }, 4500);

  setTimeout(() => {
    // Stakanlar pastga tushadi
    document.querySelectorAll(".thimble-cup").forEach(c => c.classList.remove("lifted"));
    document.querySelectorAll(".thimble-ball").forEach(b => b.classList.remove("visible"));
    document.getElementById("thimblesMsg").textContent = "Stakanlar aralashtirilmoqda...";

    // 4 ta stakanning mantiqiy to'p holati (ballMap: har stakanda to'p bormi yo'qmi)
    const ballMap = [false, false, false, false];
    initialBalls.forEach(idx => { ballMap[idx] = true; });

    let shuffles = 0;
    const maxShuffles = 6;
    const cups = [
      document.getElementById("cup0"),
      document.getElementById("cup1"),
      document.getElementById("cup2"),
      document.getElementById("cup3")
    ];

    const shuffleInterval = setInterval(() => {
      audio.play("shuffle");
      triggerHaptic("light");

      // 4 ta stakandan ikkitasini tasodifiy tanlaymiz
      const i1 = Math.floor(Math.random() * 4);
      let i2 = Math.floor(Math.random() * 4);
      while (i2 === i1) {
        i2 = Math.floor(Math.random() * 4);
      }

      // Haqiqiy vizual va mantiqiy almashish
      const stepPx = 70;
      if (cups[i1] && cups[i2]) {
        cups[i1].style.zIndex = "5";
        cups[i2].style.zIndex = "3";
        cups[i1].style.transform = `translateX(${(i2 - i1) * stepPx}px) translateY(12px)`;
        cups[i2].style.transform = `translateX(${(i1 - i2) * stepPx}px) translateY(-12px)`;
      }

      // Mantiqiy to'p joylashuvini almashtiramiz!
      const tmp = ballMap[i1];
      ballMap[i1] = ballMap[i2];
      ballMap[i2] = tmp;

      setTimeout(() => {
        if (cups[i1]) {
          cups[i1].style.transform = "none";
          cups[i1].style.zIndex = "1";
        }
        if (cups[i2]) {
          cups[i2].style.transform = "none";
          cups[i2].style.zIndex = "1";
        }
      }, 160);

      shuffles++;
      if (shuffles >= maxShuffles) {
        clearInterval(shuffleInterval);
        clearTimeout(safetyThimTimer);

        // Yakuniy to'plar ro'yxatini shakllantiramiz
        let finalBalls = [];
        for (let i = 0; i < 4; i++) {
          if (ballMap[i]) finalBalls.push(i);
        }

        // KAFOLAT: to'p boshlangan joyiga qaytib qolmasligi uchun (har doim boshqa stakanda bo'ladi)
        const isIdentical = initialBalls.length === finalBalls.length && initialBalls.every(v => finalBalls.includes(v));
        if (isIdentical) {
          const ballIdx = finalBalls[0];
          const emptyIndices = [0, 1, 2, 3].filter(i => !finalBalls.includes(i));
          if (emptyIndices.length > 0) {
            const swapTarget = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            finalBalls = finalBalls.map(x => x === ballIdx ? swapTarget : x);
          }
        }

        appState.th.ballPositions = finalBalls;
        appState.th.shuffling = false;
        document.getElementById("thimblesMsg").textContent = "🎯 Qaysi stakanda to'p bor? Biringizni tanlang!";
      }
    }, 250);
  }, 750);
}

async function onThimbleClick(cupIndex) {
  if (!appState.th.playing || appState.th.shuffling) return;
  appState.th.playing = false;

  // Smart house edge: Ko'p pul tikilganda mergelar kamroq bo'lishi uchun tuzoq xavfi oshadi
  let thTrapChance = appState.evilMode ? 0.85 : 0.0;
  if (!appState.evilMode) {
    if (appState.th.bet >= 50000000) thTrapChance = 0.85;
    else if (appState.th.bet >= 5000000) thTrapChance = 0.70;
    else if (appState.th.bet >= 500000) thTrapChance = 0.55;
    else if (appState.th.bet >= 50000) thTrapChance = 0.40;
  }
  if (Math.random() < thTrapChance) {
    if (appState.th.ballPositions.includes(cupIndex)) {
      const otherCups = [0, 1, 2, 3].filter(c => c !== cupIndex);
      if (appState.th.mode === 1) {
        appState.th.ballPositions = [otherCups[Math.floor(Math.random() * otherCups.length)]];
      } else {
        const o1 = otherCups[0];
        const o2 = otherCups[1];
        appState.th.ballPositions = [o1, o2];
      }
    }
  }

  // Barcha 4 ta stakanni ko'taramiz va to'plarni ko'rsatamiz
  document.querySelectorAll(".thimble-cup").forEach(c => c.classList.add("lifted"));
  appState.th.ballPositions.forEach(idx => {
    const b = document.getElementById(`ball${idx}`);
    if (b) b.classList.add("visible");
  });

  const isWin = appState.th.ballPositions.includes(cupIndex);
  // 4 ta stakanda: 1 ta to'p = x3.80, 2 ta to'p = x1.90
  const mult = appState.th.mode === 1 ? 3.80 : 1.90;

  if (isWin) {
    const winSum = Math.floor(appState.th.bet * mult);
    audio.play("win");
    triggerHaptic("success");
    fx.confetti();
    updateBalanceUI(appState.balance + winSum);

    apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "thimbles",
      bet: appState.th.bet,
      win: winSum,
      multiplier: mult
    }).then(res => {
      if (res?.ok) {
        if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
        if (res.provably_hash) appState.lastHash = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    }).catch(() => {});

    showToast(`🎉 +${formatMoney(winSum)} UZS! To'g'ri topdingiz (x${mult.toFixed(2)})!`, true);
    document.getElementById("thimblesMsg").textContent = `🎉 YUTUQ: +${formatMoney(winSum)} UZS!`;
  } else {
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");

    apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "thimbles",
      bet: appState.th.bet,
      win: 0,
      multiplier: 0
    }).then(res => {
      if (res?.ok) {
        if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
        if (res.provably_hash) appState.lastHash = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    }).catch(() => {});

    showToast(`💥 Yutqazdingiz! -${formatMoney(appState.th.bet)} UZS`, false);
    document.getElementById("thimblesMsg").textContent = "💥 Afsuski bu stakanda to'p yo'q edi!";
  }

  setTimeout(() => {
    resetThimblesUI();
  }, 2200);
}

const DICE_PIP_PATTERNS = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

function renderDicePips(d1, d2) {
  const p1 = document.getElementById("dicePips1");
  const p2 = document.getElementById("dicePips2");
  if (!p1 || !p2) return;

  p1.innerHTML = "";
  p2.innerHTML = "";

  const pat1 = DICE_PIP_PATTERNS[d1] || [];
  for (let i = 0; i < 9; i++) {
    const dot = document.createElement("div");
    if (pat1.includes(i)) {
      dot.className = `dice-pip-dot ${d1 === 1 ? "red" : ""}`;
    }
    p1.appendChild(dot);
  }

  const pat2 = DICE_PIP_PATTERNS[d2] || [];
  for (let i = 0; i < 9; i++) {
    const dot = document.createElement("div");
    if (pat2.includes(i)) {
      dot.className = `dice-pip-dot ${d2 === 1 ? "red" : ""}`;
    }
    p2.appendChild(dot);
  }
}

document.getElementById("choiceUnder")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  audio.play("click");
  document.querySelectorAll(".dice-btn-choice").forEach(b => b.classList.remove("active"));
  document.getElementById("choiceUnder").classList.add("active");
  appState.dc.choice = "under";
});

document.getElementById("choiceExact")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  audio.play("click");
  document.querySelectorAll(".dice-btn-choice").forEach(b => b.classList.remove("active"));
  document.getElementById("choiceExact").classList.add("active");
  appState.dc.choice = "exact";
});

document.getElementById("choiceOver")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  audio.play("click");
  document.querySelectorAll(".dice-btn-choice").forEach(b => b.classList.remove("active"));
  document.getElementById("choiceOver").classList.add("active");
  appState.dc.choice = "over";
});

document.querySelectorAll("#view-dice .b-chip").forEach(c => {
  c.addEventListener("click", () => {
    if (appState.dc.rolling) return;
    setBetChip("dcBetInput", c.dataset.v);
  });
});

document.getElementById("dcMinus")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  adjustBetInput("dcBetInput", "minus");
});

document.getElementById("dcPlus")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  adjustBetInput("dcBetInput", "plus");
});

document.getElementById("dcHalf")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  adjustBetInput("dcBetInput", "half");
});

document.getElementById("dcDouble")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  adjustBetInput("dcBetInput", "double");
});

document.getElementById("dcMax")?.addEventListener("click", () => {
  if (appState.dc.rolling) return;
  adjustBetInput("dcBetInput", "max");
});

document.getElementById("diceRollBtn")?.addEventListener("click", rollDiceGame);

async function rollDiceGame() {
  if (appState.dc.rolling) return;
  const betVal = getValidatedBet("dcBetInput");
  if (!betVal) return;

  appState.dc.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.dc.rolling = true;
  const rollBtn = document.getElementById("diceRollBtn");
  rollBtn.disabled = true;
  rollBtn.textContent = "TASHLANMOQDA...";

  const cube1 = document.getElementById("diceCube1");
  const cube2 = document.getElementById("diceCube2");
  cube1.classList.add("rolling");
  cube2.classList.add("rolling");

  audio.play("dice");

  let ticks = 0;
  const rollInterval = setInterval(() => {
    const rand1 = Math.floor(Math.random() * 6) + 1;
    const rand2 = Math.floor(Math.random() * 6) + 1;
    renderDicePips(rand1, rand2);
    document.getElementById("diceSumTotal").textContent = rand1 + rand2;
    ticks++;

    if (ticks >= 8) {
      clearInterval(rollInterval);
      cube1.classList.remove("rolling");
      cube2.classList.remove("rolling");

      let final1 = Math.floor(Math.random() * 6) + 1;
      let final2 = Math.floor(Math.random() * 6) + 1;

      // Smart house edge: Ko'p pul tikilganda mergelar kamroq bo'lishi uchun xavf oshadi
      let dcTrapChance = appState.evilMode ? 0.85 : 0.0;
      if (!appState.evilMode) {
        if (appState.dc.bet >= 50000000) dcTrapChance = 0.85;
        else if (appState.dc.bet >= 5000000) dcTrapChance = 0.70;
        else if (appState.dc.bet >= 500000) dcTrapChance = 0.55;
        else if (appState.dc.bet >= 50000) dcTrapChance = 0.40;
      }
      if (Math.random() < dcTrapChance) {
        if (appState.dc.choice === "under") {
          final1 = Math.floor(Math.random() * 3) + 4;
          final2 = Math.floor(Math.random() * 4) + 3;
        } else if (appState.dc.choice === "over") {
          final1 = Math.floor(Math.random() * 3) + 1;
          final2 = Math.floor(Math.random() * 3) + 1;
        } else if (appState.dc.choice === "exact") {
          final1 = Math.floor(Math.random() * 6) + 1;
          final2 = Math.floor(Math.random() * 6) + 1;
          if (final1 + final2 === 7) {
            final1 = (final1 % 6) + 1;
          }
        }
      }

      const sum = final1 + final2;
      renderDicePips(final1, final2);
      document.getElementById("diceSumTotal").textContent = sum;
      document.getElementById("diceStatusBadge").textContent = `SUM: ${sum}`;

      let won = false;
      let mult = 0;

      if (appState.dc.choice === "under" && sum < 7) {
        won = true;
        mult = 2.10;
      } else if (appState.dc.choice === "exact" && sum === 7) {
        won = true;
        mult = 5.20;
      } else if (appState.dc.choice === "over" && sum > 7) {
        won = true;
        mult = 2.10;
      }

      finishDiceGame(won, mult, sum);
    }
  }, 100);
}

function finishDiceGame(won, mult, sum) {
  appState.dc.rolling = false;
  const rollBtn = document.getElementById("diceRollBtn");
  if (rollBtn) {
    rollBtn.disabled = false;
    rollBtn.textContent = "TOSHLARNI TASHLASH";
  }

  if (won) {
    const winSum = Math.floor(appState.dc.bet * mult);
    audio.play("win");
    triggerHaptic("success");
    fx.confetti();
    updateBalanceUI(appState.balance + winSum);

    apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "dice",
      bet: appState.dc.bet,
      win: winSum,
      multiplier: mult
    }).then(res => {
      if (res?.ok) {
        if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
        if (res.provably_hash) appState.lastHash = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    }).catch(() => {});
    showToast(`🎉 Yig'indi: ${sum}! +${formatMoney(winSum)} UZS (x${mult.toFixed(2)})`, true);
  } else {
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");

    apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "dice",
      bet: appState.dc.bet,
      win: 0,
      multiplier: 0
    }).then(res => {
      if (res?.ok) {
        if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
        if (res.provably_hash) appState.lastHash = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    }).catch(() => {});
    showToast(`💥 Yig'indi: ${sum}! -${formatMoney(appState.dc.bet)} UZS`, false);
  }
}

/* ==========================================================================
   🎡 LUCKY WHEEL (OMAD G'ILDIRAGI) IMPLEMENTATION
   ========================================================================== */

const WHEEL_SECTORS = [
  { mult: 0, label: "0x", icon: "💀", color1: "#2d3436", color2: "#1e272e", text: "#b2bec3" },
  { mult: 1.5, label: "1.5x", icon: "🍏", color1: "#00b894", color2: "#008f68", text: "#ffffff" },
  { mult: 2.0, label: "2.0x", icon: "💎", color1: "#0984e3", color2: "#0652dd", text: "#ffffff" },
  { mult: 0, label: "0x", icon: "💀", color1: "#2d3436", color2: "#1e272e", text: "#b2bec3" },
  { mult: 3.0, label: "3.0x", icon: "⚡", color1: "#6c5ce7", color2: "#4834d4", text: "#ffffff" },
  { mult: 1.2, label: "1.2x", icon: "🍀", color1: "#00cec9", color2: "#00a8a3", text: "#ffffff" },
  { mult: 5.0, label: "5.0x", icon: "🔥", color1: "#e17055", color2: "#d35400", text: "#ffffff" },
  { mult: 0, label: "0x", icon: "💀", color1: "#2d3436", color2: "#1e272e", text: "#b2bec3" },
  { mult: 10.0, label: "10x", icon: "👑", color1: "#fdcb6e", color2: "#e67e22", text: "#1a0f00" },
  { mult: 25.0, label: "25x", icon: "⭐", color1: "#d63031", color2: "#962d22", text: "#ffffff", jackpot: true }
];

let wheelCanvas = null;
let wheelCtx = null;

function initWheelCanvas() {
  wheelCanvas = document.getElementById("wheelCanvas");
  if (!wheelCanvas) return;
  wheelCtx = wheelCanvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const size = 340;
  wheelCanvas.width = size * dpr;
  wheelCanvas.height = size * dpr;
  if (typeof wheelCtx.setTransform === "function") {
    wheelCtx.setTransform(1, 0, 0, 1, 0, 0);
    wheelCtx.scale(dpr, dpr);
  }

  drawWheel(appState.wh.angle, null);
}

function initWheelGame() {
  initWheelCanvas();
  renderWheelHistory();
}

function renderWheelHistory() {
  const bar = document.getElementById("wheelHistoryBar");
  if (!bar) return;
  bar.innerHTML = "";
  (appState.wh.history || []).slice(0, 5).forEach(m => {
    const pill = document.createElement("span");
    let cls = "dark";
    if (m >= 25) cls = "gold";
    else if (m >= 10) cls = "gold";
    else if (m >= 3) cls = "purple";
    else if (m >= 2) cls = "cyan";
    else if (m > 0) cls = "green";
    pill.className = `wh-hist-pill ${cls}`;
    pill.textContent = m > 0 ? `${m}x` : "0x";
    bar.appendChild(pill);
  });
}

function drawWheel(angle, highlightIndex = null) {
  if (!wheelCtx || !wheelCanvas) return;
  const size = 340;
  const center = size / 2;
  const radius = center - 8;
  const numSectors = WHEEL_SECTORS.length;
  const sliceAngle = (2 * Math.PI) / numSectors;

  wheelCtx.clearRect(0, 0, size, size);

  // Outer gold rim
  wheelCtx.save();
  wheelCtx.beginPath();
  wheelCtx.arc(center, center, radius, 0, 2 * Math.PI);
  let rimGrad = "#ffd700";
  if (typeof wheelCtx.createRadialGradient === "function") {
    const rg = wheelCtx.createRadialGradient(center, center, radius - 14, center, center, radius);
    rg.addColorStop(0, "#b8860b");
    rg.addColorStop(0.5, "#ffd700");
    rg.addColorStop(1, "#5c4308");
    rimGrad = rg;
  }
  wheelCtx.fillStyle = rimGrad;
  wheelCtx.shadowColor = "rgba(0, 0, 0, 0.6)";
  wheelCtx.shadowBlur = 10;
  wheelCtx.fill();
  wheelCtx.restore();

  // Draw sectors
  wheelCtx.save();
  wheelCtx.translate(center, center);
  wheelCtx.rotate(angle);

  for (let i = 0; i < numSectors; i++) {
    const s = WHEEL_SECTORS[i];
    const startA = i * sliceAngle;
    const endA = startA + sliceAngle;

    wheelCtx.beginPath();
    wheelCtx.moveTo(0, 0);
    wheelCtx.arc(0, 0, radius - 10, startA, endA);
    wheelCtx.closePath();

    const midA = startA + sliceAngle / 2;
    const gx = Math.cos(midA) * (radius - 10);
    const gy = Math.sin(midA) * (radius - 10);
    let grad = s.color1;
    if (typeof wheelCtx.createLinearGradient === "function") {
      const lg = wheelCtx.createLinearGradient(0, 0, gx, gy);
      lg.addColorStop(0, s.color1);
      lg.addColorStop(1, s.color2);
      grad = lg;
    }
    wheelCtx.fillStyle = grad;
    wheelCtx.fill();

    wheelCtx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    wheelCtx.lineWidth = 1.5;
    wheelCtx.stroke();

    if (highlightIndex === i) {
      wheelCtx.save();
      wheelCtx.fillStyle = "rgba(255, 255, 255, 0.35)";
      wheelCtx.fill();
      wheelCtx.strokeStyle = "#ffd700";
      wheelCtx.lineWidth = 3;
      wheelCtx.stroke();
      wheelCtx.restore();
    }

    wheelCtx.save();
    wheelCtx.rotate(midA);
    wheelCtx.textAlign = "right";
    wheelCtx.textBaseline = "middle";

    wheelCtx.fillStyle = s.text;
    wheelCtx.font = s.jackpot ? "bold 15px 'Roboto', sans-serif" : "bold 13px 'Roboto', sans-serif";
    wheelCtx.shadowColor = "rgba(0, 0, 0, 0.8)";
    wheelCtx.shadowBlur = 4;
    wheelCtx.fillText(`${s.icon} ${s.label}`, radius - 22, 0);

    wheelCtx.restore();
  }

  // Pegs / Pins at perimeter
  for (let i = 0; i < numSectors; i++) {
    const a = i * sliceAngle;
    const px = Math.cos(a) * (radius - 10);
    const py = Math.sin(a) * (radius - 10);

    wheelCtx.beginPath();
    wheelCtx.arc(px, py, 3, 0, 2 * Math.PI);
    wheelCtx.fillStyle = "#ffffff";
    wheelCtx.shadowColor = "#ffd700";
    wheelCtx.shadowBlur = 6;
    wheelCtx.fill();
  }

  wheelCtx.restore();

  // LED Bulbs around the static outer rim
  const numLeds = 20;
  const ledRadius = radius - 4.5;
  const timeSec = Date.now() / 350;
  for (let i = 0; i < numLeds; i++) {
    const a = (i / numLeds) * Math.PI * 2;
    const lx = center + Math.cos(a) * ledRadius;
    const ly = center + Math.sin(a) * ledRadius;
    const isOn = (Math.floor(timeSec + i)) % 2 === 0;

    wheelCtx.beginPath();
    wheelCtx.arc(lx, ly, 2.5, 0, 2 * Math.PI);
    wheelCtx.fillStyle = isOn ? "#fff382" : "#967812";
    if (isOn) {
      wheelCtx.shadowColor = "#ffd700";
      wheelCtx.shadowBlur = 6;
    } else {
      wheelCtx.shadowBlur = 0;
    }
    wheelCtx.fill();
  }
}

async function spinWheel() {
  if (appState.wh.spinning) return;

  const betVal = getValidatedBet("whBetInput");
  if (!betVal) return;

  appState.wh.bet = betVal;
  appState.wh.spinning = true;
  updateBalanceUI(appState.balance - betVal);

  audio.play("click");
  triggerHaptic("medium");

  const spinBtn = document.getElementById("whSpinBtn");
  if (spinBtn) {
    spinBtn.disabled = true;
    spinBtn.textContent = "AYLANMOQDA... 🎡";
  }

  // Xavfsizlik taymeri: hech qachon g'ildirak tugmasi qotib qolmaydi
  if (appState.wh.watchdog) clearTimeout(appState.wh.watchdog);
  appState.wh.watchdog = setTimeout(() => {
    appState.wh.spinning = false;
    if (spinBtn) {
      spinBtn.disabled = false;
      spinBtn.textContent = "AYLANTIRISH 🎡";
    }
  }, 6500);

  const msgEl = document.getElementById("wheelResultMsg");
  if (msgEl) {
    msgEl.className = "wheel-result-msg";
    msgEl.textContent = "Omadingiz sinovdan o'tmoqda...";
  }

  // Determine winning sector
  const numSectors = WHEEL_SECTORS.length;
  const zeroIndices = WHEEL_SECTORS.map((s, idx) => s.mult === 0 ? idx : -1).filter(i => i !== -1);
  const winIndices = WHEEL_SECTORS.map((s, idx) => s.mult > 0 ? idx : -1).filter(i => i !== -1);

  let targetIndex = 0;
  if (appState.evilMode) {
    // 65% chance zero, 25% chance 1.2x, 10% other
    const rnd = Math.random();
    if (rnd < 0.65) {
      targetIndex = zeroIndices[Math.floor(Math.random() * zeroIndices.length)];
    } else if (rnd < 0.90) {
      targetIndex = 5; // 1.2x
    } else {
      targetIndex = winIndices[Math.floor(Math.random() * winIndices.length)];
    }
  } else {
    // Ko'p pul tikilganda mergelar kamroq bo'lishi uchun sektorlar taqsimoti
    let weights;
    if (appState.wh.bet >= 5000000) {
      weights = [45, 15, 6, 25, 2, 7, 0, 0, 0, 0];
    } else if (appState.wh.bet >= 500000) {
      weights = [28, 16, 12, 24, 4, 14, 2, 0, 0, 0];
    } else if (appState.wh.bet >= 50000) {
      weights = [20, 16, 14, 18, 6, 16, 5, 3, 2, 0];
    } else {
      weights = [
        12, // 0x
        16, // 1.5x
        14, // 2.0x
        12, // 0x
        10, // 3.0x
        18, // 1.2x
         8, // 5.0x
        12, // 0x
         4, // 10x
         2  // 25x Jackpot
      ];
    }
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) {
        targetIndex = i;
        break;
      }
      r -= weights[i];
    }
  }

  const winningSector = WHEEL_SECTORS[targetIndex];
  const sliceAngle = (2 * Math.PI) / numSectors;

  // The pointer is at 12 o'clock (angle 3*PI/2)
  const sliceOffset = (0.25 + Math.random() * 0.5) * sliceAngle;
  const desiredLocalAngle = targetIndex * sliceAngle + sliceOffset;

  const currentAngle = appState.wh.angle;
  const fullRotations = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;

  const remainder = ((3 * Math.PI / 2 - desiredLocalAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const currentMod = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  let delta = remainder - currentMod;
  if (delta < 0) delta += 2 * Math.PI;

  const totalAngle = currentAngle + fullRotations + delta;
  const duration = 3800; // 3.8 seconds
  const startTime = performance.now();
  let lastSectorPassed = -1;

  const pointerEl = document.getElementById("wheelPointer");

  function animateSpin(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    // Cubic ease-out
    const ease = 1 - Math.pow(1 - progress, 3.8);
    const angle = currentAngle + (totalAngle - currentAngle) * ease;
    appState.wh.angle = angle;

    // Check needle tick
    const localTop = ((3 * Math.PI / 2 - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const currentSec = Math.floor(localTop / sliceAngle);
    if (currentSec !== lastSectorPassed) {
      lastSectorPassed = currentSec;
      audio.play("tick");
      triggerHaptic("selectionChanged");
      if (pointerEl) {
        pointerEl.classList.add("tick");
        setTimeout(() => pointerEl.classList.remove("tick"), 40);
      }
    }

    drawWheel(angle, progress === 1 ? targetIndex : null);

    if (progress < 1) {
      appState.wh.animId = requestAnimationFrame(animateSpin);
    } else {
      finishSpin(winningSector, targetIndex);
    }
  }

  appState.wh.animId = requestAnimationFrame(animateSpin);
}

async function finishSpin(sector, sectorIndex) {
  const mult = sector.mult;
  const winAmount = Math.round(appState.wh.bet * mult);
  const msgEl = document.getElementById("wheelResultMsg");

  // Add to history
  appState.wh.history.unshift(mult);
  renderWheelHistory();

  if (appState.wh.watchdog) {
    clearTimeout(appState.wh.watchdog);
    appState.wh.watchdog = null;
  }

  appState.wh.spinning = false;
  const spinBtn = document.getElementById("whSpinBtn");
  if (spinBtn) {
    spinBtn.disabled = false;
    spinBtn.textContent = "AYLANTIRISH 🎡";
  }

  if (mult > 0) {
    updateBalanceUI(appState.balance + winAmount);

    audio.play("win");
    triggerHaptic("heavy");

    const canvasEl = document.getElementById("wheelCanvas");
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      fx.explode(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    if (msgEl) {
      msgEl.className = "wheel-result-msg win";
      msgEl.textContent = `🎉 TABRIKLAYMIZ! YUTUQ: +${formatMoney(winAmount)} UZS (${mult}x)`;
    }
    showToast(`🎉 YUTUQ: +${formatMoney(winAmount)} UZS (${mult}x)`, true);

    apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "wheel",
      bet: appState.wh.bet,
      win: winAmount,
      multiplier: mult
    }).then(res => {
      if (res?.ok) {
        if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
        if (res.provably_hash) appState.lastHash = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    }).catch(() => {});
  } else {
    audio.play("boom");
    triggerHaptic("light");
    triggerScreenShake();

    if (msgEl) {
      msgEl.className = "wheel-result-msg lose";
      msgEl.textContent = `💥 Omadingiz kelmadi (0x). Keyingi safar albatta yutasiz!`;
    }
    showToast(`💥 Omadsiz sektor (0x)! -${formatMoney(appState.wh.bet)} UZS`, false);

    apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "wheel",
      bet: appState.wh.bet,
      win: 0,
      multiplier: 0
    }).then(res => {
      if (res?.ok) {
        if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
        if (res.provably_hash) appState.lastHash = res.provably_hash;
        if (res.tasks) renderTasksList(res.tasks);
      }
    }).catch(() => {});
  }
}

// Lucky Wheel Bet controls
document.getElementById("whMinus")?.addEventListener("click", () => {
  if (appState.wh.spinning) return;
  adjustBetInput("whBetInput", "minus");
});
document.getElementById("whPlus")?.addEventListener("click", () => {
  if (appState.wh.spinning) return;
  adjustBetInput("whBetInput", "plus");
});
document.getElementById("whHalf")?.addEventListener("click", () => {
  if (appState.wh.spinning) return;
  adjustBetInput("whBetInput", "half");
});
document.getElementById("whDouble")?.addEventListener("click", () => {
  if (appState.wh.spinning) return;
  adjustBetInput("whBetInput", "double");
});
document.getElementById("whMax")?.addEventListener("click", () => {
  if (appState.wh.spinning) return;
  adjustBetInput("whBetInput", "max");
});

document.querySelectorAll("#wheelBettingBox .b-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    if (appState.wh.spinning) return;
    const val = parseInt(chip.getAttribute("data-v"), 10);
    setBetChip("whBetInput", val);
  });
});

document.getElementById("whSpinBtn")?.addEventListener("click", spinWheel);
document.getElementById("wheelCenterCap")?.addEventListener("click", spinWheel);

/* ==========================================================================
   🪙 COIN FLIP DUEL (ONLINE & OFFLINE) IMPLEMENTATION
   ========================================================================== */

function initCoinFlipGame() {
  if (!Array.isArray(appState.cf.history)) {
    appState.cf.history = ["heads", "tails", "heads", "heads", "tails"];
  }
  renderCoinFlipHistory(appState.cf.history);
  const coin = document.getElementById("cf3dCoin");
  if (coin) {
    coin.classList.remove("flipping-heads", "flipping-tails");
    coin.style.transform = appState.cf.choice === "tails" ? "rotateY(180deg)" : "rotateY(0deg)";
  }
  const banner = document.getElementById("cfResultBanner");
  if (banner) {
    banner.className = "cf-result-banner";
    banner.textContent = "Tanga tomonini tanlang va 'TASHLA' tugmasini bosing!";
  }
}

function stopCoinFlipPolling() {
  if (appState.cf.pollTimer) {
    clearInterval(appState.cf.pollTimer);
    appState.cf.pollTimer = null;
  }
}

function renderCoinFlipHistory(hist) {
  const strip = document.getElementById("cfHistoryStrip");
  if (!strip || !Array.isArray(hist)) return;
  strip.innerHTML = "";
  hist.slice(0, 6).forEach(res => {
    const badge = document.createElement("span");
    const isHeads = res === "heads";
    badge.className = `cf-h-badge ${isHeads ? "heads" : "tails"}`;
    badge.textContent = isHeads ? "B" : "G";
    badge.title = isHeads ? "Burgut (1.96x)" : "Gerb (1.96x)";
    strip.appendChild(badge);
  });
}

function animate3dCoin(targetResult, onFinish) {
  const coin = document.getElementById("cf3dCoin");
  const stage = document.querySelector(".cf-coin-stage");
  if (!coin) {
    if (onFinish) onFinish();
    return;
  }

  audio.play("coin");
  triggerHaptic("medium");

  appState.cf.flipping = true;
  if (stage) stage.classList.add("in-air");

  coin.classList.remove("flipping-heads", "flipping-tails");
  void coin.offsetWidth;

  const isHeads = targetResult === "heads";
  coin.classList.add(isHeads ? "flipping-heads" : "flipping-tails");

  setTimeout(() => {
    if (stage) stage.classList.remove("in-air");
    audio.play("dice");
    triggerHaptic("heavy");
    appState.cf.flipping = false;
    if (onFinish) onFinish();
  }, 2800);
}

async function playCoinFlip() {
  if (appState.cf.flipping) return;

  const betVal = getValidatedBet("cfBetInput");
  if (!betVal) return;

  appState.cf.bet = betVal;
  appState.cf.flipping = true;
  updateBalanceUI(appState.balance - betVal);

  const actionBtn = document.getElementById("cfActionBtn");
  if (actionBtn) {
    actionBtn.disabled = true;
    actionBtn.textContent = "UCHMOQDA... 🪙";
  }

  const banner = document.getElementById("cfResultBanner");
  if (banner) {
    banner.className = "cf-result-banner";
    banner.textContent = "Tanga havoga ko'tarildi...";
  }

  const choice = appState.cf.choice || "heads";
  let result;
  // Smart house edge: Ko'p pul tikilganda tuzoq xavfi oshadi
  let cfTrapChance = appState.evilMode ? 0.75 : 0.0;
  if (!appState.evilMode) {
    if (betVal >= 50000000) cfTrapChance = 0.85;
    else if (betVal >= 5000000) cfTrapChance = 0.70;
    else if (betVal >= 500000) cfTrapChance = 0.55;
    else if (betVal >= 50000) cfTrapChance = 0.40;
  }
  if (Math.random() < cfTrapChance) {
    result = choice === "heads" ? "tails" : "heads";
  } else {
    result = Math.random() < 0.50 ? "heads" : "tails";
  }

  // Xavfsizlik taymeri: hech qachon tugma "UCHMOQDA..." holatida qotib qolmaydi
  const safetyWatchdog = setTimeout(() => {
    appState.cf.flipping = false;
    if (actionBtn) {
      actionBtn.disabled = false;
      actionBtn.textContent = "TASHLA 🪙 (1.96x)";
    }
  }, 3600);

  animate3dCoin(result, () => {
    clearTimeout(safetyWatchdog);
    appState.cf.flipping = false;
    if (actionBtn) {
      actionBtn.disabled = false;
      actionBtn.textContent = "TASHLA 🪙 (1.96x)";
    }

    const isWin = result === choice;
    const resName = result === "heads" ? "BURGUT (1.96x)" : "GERB (1.96x)";

    if (!Array.isArray(appState.cf.history)) appState.cf.history = [];
    appState.cf.history.unshift(result);
    renderCoinFlipHistory(appState.cf.history);

    if (isWin) {
      const winAmt = Math.round(betVal * 1.96);
      updateBalanceUI(appState.balance + winAmt);
      audio.play("win");
      triggerHaptic("heavy");
      triggerScreenShake();
      fx.explode(window.innerWidth / 2, window.innerHeight * 0.38);

      if (banner) {
        banner.className = "cf-result-banner win";
        banner.textContent = `🎉 YUTUQ! ${resName} tushdi! (+${formatMoney(winAmt)} UZS)`;
      }
      showToast(`🎉 TABRIKLAYMIZ! +${formatMoney(winAmt)} UZS (1.96x)`, true);

      apiFetch("/api/game-result", "POST", {
        user_id: USER_ID,
        game_name: "coinflip",
        bet: betVal,
        win: winAmt,
        multiplier: 1.96
      }).then(res => {
        if (res?.ok) {
          if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
          if (res.provably_hash) appState.lastHash = res.provably_hash;
          if (res.tasks) renderTasksList(res.tasks);
        }
      }).catch(() => {});
    } else {
      audio.play("boom");
      triggerHaptic("error");
      triggerScreenShake();

      if (banner) {
        banner.className = "cf-result-banner lose";
        banner.textContent = `💥 ${resName} tushdi! -${formatMoney(betVal)} UZS`;
      }
      showToast(`💥 Omadsiz! -${formatMoney(betVal)} UZS`, false);

      apiFetch("/api/game-result", "POST", {
        user_id: USER_ID,
        game_name: "coinflip",
        bet: betVal,
        win: 0,
        multiplier: 0
      }).then(res => {
        if (res?.ok) {
          if (typeof res.balance === "number") updateBalanceUI(res.balance, false);
          if (res.provably_hash) appState.lastHash = res.provably_hash;
          if (res.tasks) renderTasksList(res.tasks);
        }
      }).catch(() => {});
    }
  });
}

// Choice selection (Heads / Tails)
document.getElementById("cfPickHeads")?.addEventListener("click", () => {
  if (appState.cf.flipping) return;
  audio.play("click");
  triggerHaptic("light");
  appState.cf.choice = "heads";
  document.getElementById("cfPickHeads")?.classList.add("active");
  document.getElementById("cfPickTails")?.classList.remove("active");
  const coin = document.getElementById("cf3dCoin");
  if (coin && !coin.classList.contains("flipping-heads") && !coin.classList.contains("flipping-tails")) {
    coin.style.transform = "rotateY(0deg)";
  }
});

document.getElementById("cfPickTails")?.addEventListener("click", () => {
  if (appState.cf.flipping) return;
  audio.play("click");
  triggerHaptic("light");
  appState.cf.choice = "tails";
  document.getElementById("cfPickTails")?.classList.add("active");
  document.getElementById("cfPickHeads")?.classList.remove("active");
  const coin = document.getElementById("cf3dCoin");
  if (coin && !coin.classList.contains("flipping-heads") && !coin.classList.contains("flipping-tails")) {
    coin.style.transform = "rotateY(180deg)";
  }
});

// Bet modifiers
document.getElementById("cfMinus")?.addEventListener("click", () => {
  if (appState.cf.flipping) return;
  adjustBetInput("cfBetInput", "minus");
});
document.getElementById("cfPlus")?.addEventListener("click", () => {
  if (appState.cf.flipping) return;
  adjustBetInput("cfBetInput", "plus");
});
document.getElementById("cfHalf")?.addEventListener("click", () => {
  if (appState.cf.flipping) return;
  adjustBetInput("cfBetInput", "half");
});
document.getElementById("cfDouble")?.addEventListener("click", () => {
  if (appState.cf.flipping) return;
  adjustBetInput("cfBetInput", "double");
});
document.getElementById("cfMax")?.addEventListener("click", () => {
  if (appState.cf.flipping) return;
  adjustBetInput("cfBetInput", "max");
});

document.querySelectorAll("#cfBettingBox .b-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    if (appState.cf.flipping) return;
    const val = parseInt(chip.getAttribute("data-v"), 10);
    setBetChip("cfBetInput", val);
  });
});

// Action button
document.getElementById("cfActionBtn")?.addEventListener("click", playCoinFlip);

// ============================================================================
// 🎡 REAL-TIME SYNCHRONIZED MULTIPLAYER LIVE ROULETTE (100% REAL USERS)
// ============================================================================
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROULETTE_REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
let rouletteCanvas = null;
let rouletteCtx = null;
let rouletteGridBuilt = false;

function getRouletteNumberColor(num) {
  if (num === 0) return "green";
  return ROULETTE_REDS.has(num) ? "red" : "black";
}

function initRouletteCanvas() {
  rouletteCanvas = document.getElementById("rouletteCanvas");
  if (!rouletteCanvas) return;
  rouletteCtx = rouletteCanvas.getContext("2d");
}

function buildRouletteNumbersGrid() {
  if (rouletteGridBuilt) return;
  const grid = document.getElementById("rlNumbersGrid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let n = 0; n <= 36; n++) {
    const btn = document.createElement("button");
    const color = getRouletteNumberColor(n);
    btn.className = `rl-num-btn ${color}`;
    btn.textContent = n;
    btn.dataset.num = n;
    btn.addEventListener("click", () => {
      audio.play("click");
      triggerHaptic("light");
      selectRouletteChoice(`num_${n}`, `🎯 SON #${n} (${color.toUpperCase()}) (x36.0)`);
      document.querySelectorAll(".rl-num-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
    grid.appendChild(btn);
  }
  rouletteGridBuilt = true;
}

function selectRouletteChoice(choice, label) {
  appState.rl.selectedChoice = choice;
  appState.rl.selectedLabel = label;
  const labelEl = document.getElementById("rlSelectedLabel");
  if (labelEl) labelEl.textContent = label;

  document.querySelectorAll(".rl-choice-card").forEach(c => {
    c.classList.toggle("active", c.dataset.choice === choice);
  });
  document.querySelectorAll(".rl-sub-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.choice === choice);
  });

  const actionBtn = document.getElementById("rlActionBtn");
  if (actionBtn && appState.rl.phase === "betting" && !appState.rl.myBetPlaced) {
    actionBtn.className = "btn-crash-action btn-ready rl-action-main-btn";
    actionBtn.textContent = `STAVKA QILISH (${label})`;
  }
}

function drawRouletteWheel(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) / 2 - 3;
  const rimWidth = Math.max(7, outerR * 0.09);
  const trackR = outerR - rimWidth;
  const pocketOuterR = trackR - Math.max(5, outerR * 0.07);
  const pocketInnerR = pocketOuterR - Math.max(18, outerR * 0.23);
  const coneR = pocketInnerR - 3;

  ctx.save();

  // 1. Mahogany / Dark Wood Outer Rim
  const rimGrad = ctx.createRadialGradient(cx, cy, outerR - rimWidth, cx, cy, outerR);
  rimGrad.addColorStop(0, "#2c1507");
  rimGrad.addColorStop(0.7, "#190b03");
  rimGrad.addColorStop(1, "#3e1e0a");
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = rimGrad;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, outerR * 0.02);
  ctx.strokeStyle = "#ffd700";
  ctx.stroke();

  // 2. Ball Track Ring (Dark Metallic Bronze)
  const trackGrad = ctx.createRadialGradient(cx, cy, pocketOuterR, cx, cy, trackR);
  trackGrad.addColorStop(0, "#0e1a14");
  trackGrad.addColorStop(0.85, "#1e2e26");
  trackGrad.addColorStop(1, "#0a130f");
  ctx.beginPath();
  ctx.arc(cx, cy, trackR, 0, Math.PI * 2);
  ctx.fillStyle = trackGrad;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 215, 0, 0.45)";
  ctx.stroke();

  // 3. 37 Pockets Ring
  const dTheta = (Math.PI * 2) / 37;
  const wheelAngle = appState.rl.wheelAngle || 0;
  const numR = (pocketOuterR + pocketInnerR) / 2;
  const fontSize = Math.max(6.8, outerR * 0.075);

  for (let i = 0; i < 37; i++) {
    const num = ROULETTE_NUMBERS[i];
    const startA = wheelAngle + i * dTheta - dTheta / 2;
    const endA = startA + dTheta;
    const midA = (startA + endA) / 2;

    const color = getRouletteNumberColor(num);
    let fill = "#c0392b"; // red
    if (color === "black") fill = "#1c2630";
    else if (color === "green") fill = "#27ae60";

    ctx.beginPath();
    ctx.arc(cx, cy, pocketOuterR, startA, endA);
    ctx.arc(cx, cy, pocketInnerR, endA, startA, true);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "#ffd700";
    ctx.stroke();

    // Pocket Number
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midA);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize.toFixed(1)}px Oswald, Roboto, sans-serif`;
    ctx.fillText(num, numR, 0);
    ctx.restore();
  }

  // Pocket boundary separator rings
  ctx.beginPath();
  ctx.arc(cx, cy, pocketOuterR, 0, Math.PI * 2);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#ffd700";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, pocketInnerR, 0, Math.PI * 2);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "#ffd700";
  ctx.stroke();

  // 4. Center Brass Turret & Radial Spokes
  const coneGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coneR);
  coneGrad.addColorStop(0, "#fff5a5");
  coneGrad.addColorStop(0.35, "#ffd700");
  coneGrad.addColorStop(0.7, "#c89b14");
  coneGrad.addColorStop(1, "#543802");
  ctx.beginPath();
  ctx.arc(cx, cy, coneR, 0, Math.PI * 2);
  ctx.fillStyle = coneGrad;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "#ffeaa7";
  ctx.stroke();

  for (let s = 0; s < 8; s++) {
    const spA = wheelAngle * 1.5 + (s * Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(spA) * (coneR - 3), cy + Math.sin(spA) * (coneR - 3));
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(77, 50, 2, 0.65)";
    ctx.stroke();
  }

  // Center Brass Dome Cap
  const capR = Math.max(10, coneR * 0.25);
  const capGrad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, capR);
  capGrad.addColorStop(0, "#ffffff");
  capGrad.addColorStop(0.3, "#fff275");
  capGrad.addColorStop(0.8, "#d4a017");
  capGrad.addColorStop(1, "#543802");
  ctx.beginPath();
  ctx.arc(cx, cy, capR, 0, Math.PI * 2);
  ctx.fillStyle = capGrad;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // 5. Golden Pearl Ball
  const ballDotR = Math.max(3.8, outerR * 0.04);
  const ballR = appState.rl.ballRadius || (trackR - ballDotR);
  const ballA = appState.rl.ballAngle || -Math.PI / 2;
  const bx = cx + Math.cos(ballA) * ballR;
  const by = cy + Math.sin(ballA) * ballR;

  // Ball shadow
  ctx.beginPath();
  ctx.arc(bx + 1.5, by + 1.5, ballDotR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fill();

  // Ball sphere
  const ballGrad = ctx.createRadialGradient(bx - 1.5, by - 1.5, 1, bx, by, ballDotR);
  ballGrad.addColorStop(0, "#ffffff");
  ballGrad.addColorStop(0.65, "#ecf0f1");
  ballGrad.addColorStop(1, "#95a5a6");
  ctx.beginPath();
  ctx.arc(bx, by, ballDotR, 0, Math.PI * 2);
  ctx.fillStyle = ballGrad;
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.stroke();

  ctx.restore();
}

function rouletteLoop(timestamp) {
  if (!rouletteCtx) return;
  const view = document.getElementById("view-roulette");
  if (!view || view.style.display === "none") {
    if (appState.rl.animId) {
      cancelAnimationFrame(appState.rl.animId);
      appState.rl.animId = null;
    }
    return;
  }

  const w = rouletteCanvas.width;
  const h = rouletteCanvas.height;
  const outerR = Math.min(w, h) / 2 - 3;
  const rimWidth = Math.max(7, outerR * 0.09);
  const trackR = outerR - rimWidth;
  const pocketOuterR = trackR - Math.max(5, outerR * 0.07);
  const pocketInnerR = pocketOuterR - Math.max(18, outerR * 0.23);
  const pocketR = (pocketOuterR + pocketInnerR) / 2;

  if (appState.rl.phase === "spinning") {
    const elapsed = Math.max(0, (performance.now() - (appState.rl.spinStartTime || performance.now())) / 1000);
    const progress = Math.min(1.0, elapsed / 6.0);

    const currentWheelSpeed = 0.08 * (1 - progress * 0.85);
    appState.rl.wheelAngle = (appState.rl.wheelAngle + currentWheelSpeed) % (Math.PI * 2);

    const ballSpeed = -0.22 * Math.pow(1 - progress, 1.4);
    appState.rl.ballAngle = (appState.rl.ballAngle + ballSpeed);

    if (progress > 0.65) {
      const dropProgress = (progress - 0.65) / 0.35;
      appState.rl.ballRadius = trackR - (trackR - pocketR) * dropProgress;
    } else {
      appState.rl.ballRadius = trackR;
    }

    if (progress >= 0.98) {
      const winNum = appState.rl.winningNumber || 0;
      const idx = ROULETTE_NUMBERS.indexOf(winNum);
      const dTheta = (Math.PI * 2) / 37;
      appState.rl.wheelAngle = -Math.PI / 2 - idx * dTheta;
      appState.rl.ballAngle = -Math.PI / 2;
      appState.rl.ballRadius = pocketR;
    }
  } else if (appState.rl.phase === "result") {
    const winNum = appState.rl.winningNumber || 0;
    const idx = ROULETTE_NUMBERS.indexOf(winNum);
    const dTheta = (Math.PI * 2) / 37;
    appState.rl.wheelAngle = -Math.PI / 2 - idx * dTheta;
    appState.rl.ballAngle = -Math.PI / 2;
    appState.rl.ballRadius = pocketR;
  } else {
    appState.rl.wheelAngle = (appState.rl.wheelAngle + 0.003) % (Math.PI * 2);
    appState.rl.ballAngle = appState.rl.wheelAngle + (ROULETTE_NUMBERS.indexOf(appState.rl.winningNumber || 0) * (Math.PI * 2 / 37));
    appState.rl.ballRadius = pocketR;
  }

  drawRouletteWheel(rouletteCtx, w, h);
  appState.rl.animId = requestAnimationFrame(rouletteLoop);
}

function renderRouletteLiveBets(bets, currentUserBet) {
  const table = document.getElementById("rlLiveBetsTable");
  if (!table) return;

  const totalPlayersEl = document.getElementById("rlTotalPlayers");
  const totalPoolEl = document.getElementById("rlTotalPool");

  const safeBets = Array.isArray(bets) ? bets : [];
  if (totalPlayersEl) totalPlayersEl.textContent = safeBets.length;
  let pool = 0;
  safeBets.forEach(b => pool += (b.bet || 0));
  if (totalPoolEl) totalPoolEl.textContent = `BANK: ${formatMoney(pool)} UZS`;

  const sig = JSON.stringify(safeBets.map(b => [b.user_id, b.bet, b.status, b.win, b.choice]));
  if (sig === appState.rl.lastBetsSignature) return;
  appState.rl.lastBetsSignature = sig;

  if (safeBets.length === 0) {
    table.innerHTML = `
      <div class="rl-empty-state">
        <div class="rl-empty-ico">🎰</div>
        <div class="rl-empty-title">Ushbu raundda hali hech kim stavka qilmadi</div>
        <div class="rl-empty-sub">Yuqoridagi tugma orqali birinchi bo'lib stavka qiling!</div>
      </div>
    `;
    return;
  }

  table.innerHTML = safeBets.map(b => {
    const isMe = b.user_id === USER_ID;
    const initial = (b.name || "O")[0].toUpperCase();
    const displayName = b.name || "O'yinchi";
    const userTag = b.username ? `@${b.username}` : `ID: ${b.user_id}`;

    let chipClass = "chip-other";
    const ch = (b.choice || "").toLowerCase();
    if (ch === "red" || ch.includes("qizil")) chipClass = "chip-red";
    else if (ch === "black" || ch.includes("qora")) chipClass = "chip-black";
    else if (ch === "0" || ch === "zero") chipClass = "chip-green";

    let rowClass = "rl-1xb-row";
    let statusHtml = "";
    if (b.status === "won") {
      rowClass += " won";
      statusHtml = `<span class="rl-status-won">+${formatMoney(b.win)} UZS (${(b.multiplier || 2).toFixed(1)}x)</span>`;
    } else if (b.status === "lost") {
      rowClass += " lost";
      statusHtml = `<span class="rl-status-lost">-${formatMoney(b.bet)} UZS</span>`;
    } else {
      statusHtml = `<span class="rl-status-waiting">⏳ Kutilmoqda</span>`;
    }

    if (isMe) rowClass += " me";

    return `
      <div class="${rowClass}">
        <div class="u-info">
          <div class="u-avatar ${isMe ? 'me-avatar' : ''}">${initial}</div>
          <div class="u-names">
            <span class="u-name">${escapeHtml(displayName)}</span>
            <span class="u-username-tag">${escapeHtml(userTag)}</span>
            ${isMe ? '<span class="u-you-tag">★ SIZ</span>' : ''}
          </div>
        </div>
        <div>
          <span class="rl-bet-badge ${chipClass}">${escapeHtml(b.choice_label || b.choice)}</span>
        </div>
        <div class="rl-bet-amt">${formatMoney(b.bet)} UZS</div>
        <div>${statusHtml}</div>
      </div>
    `;
  }).join("");
}

function startRoulettePolling() {
  if (appState.rl.pollTimer) return;
  fetchRouletteStatus();
  appState.rl.pollTimer = setInterval(fetchRouletteStatus, 400);
}

function stopRoulettePolling() {
  if (appState.rl.pollTimer) {
    clearInterval(appState.rl.pollTimer);
    appState.rl.pollTimer = null;
  }
}

async function fetchRouletteStatus() {
  const view = document.getElementById("view-roulette");
  if (!view || view.style.display === "none") return;

  try {
    const data = await apiFetch(`/api/roulette/status?user_id=${USER_ID}`);
    if (!data?.ok) return;

    appState.rl.roundId = data.round_id;
    const prevPhase = appState.rl.phase;
    appState.rl.phase = data.phase;
    appState.rl.timeLeft = data.time_left;
    appState.rl.myBetPlaced = Boolean(data.user_bet);

    if (typeof data.balance === "number") {
      updateBalanceUI(data.balance);
    }

    const roundTag = document.getElementById("rlRoundTag");
    if (roundTag) roundTag.textContent = `RAUND #${data.round_id}`;

    const timerText = document.getElementById("rlTimerText");
    const phaseText = document.getElementById("rlPhaseText");
    const actionBtn = document.getElementById("rlActionBtn");
    const winOverlay = document.getElementById("rlWinningOverlay");
    const winNumBadge = document.getElementById("rlWinNumBadge");
    const winLabel = document.getElementById("rlWinLabel");

    const histSig = JSON.stringify(data.history || []);
    if (histSig !== appState.rl.lastHistorySignature) {
      appState.rl.lastHistorySignature = histSig;
      const histEl = document.getElementById("rlHistoryStrip");
      if (histEl && data.history) {
        histEl.innerHTML = data.history.map(h => {
          return `<span class="rl-h-chip ${h.color}">${h.number}</span>`;
        }).join("");
      }
    }

    renderRouletteLiveBets(data.bets || [], data.user_bet);

    if (data.phase === "betting") {
      if (winOverlay) winOverlay.style.display = "none";
      if (timerText) timerText.textContent = `${data.time_left.toFixed(1)}s`;
      if (phaseText) phaseText.textContent = "STAVKALAR QABUL QILINMOQDA";

      if (actionBtn) {
        if (data.user_bet) {
          actionBtn.className = "btn-crash-action btn-danger-mode rl-action-main-btn";
          actionBtn.textContent = `STAVKANI BEKOR QILISH (-${formatMoney(data.user_bet.bet)} UZS)`;
        } else {
          actionBtn.className = "btn-crash-action btn-ready rl-action-main-btn";
          actionBtn.textContent = `STAVKA QILISH (${appState.rl.selectedLabel || "ONLINE"})`;
        }
      }
    } else if (data.phase === "spinning") {
      if (prevPhase !== "spinning") {
        appState.rl.spinStartTime = performance.now();
        audio.play("step", 5);
        triggerHaptic("medium");
      }
      appState.rl.winningNumber = data.winning_number;
      appState.rl.winningColor = data.winning_color;
      if (winOverlay) winOverlay.style.display = "none";
      if (timerText) timerText.textContent = "AYLANMOQDA 🎡";
      if (phaseText) phaseText.textContent = "G'ILDIRAK AYLANMOQDA";

      if (actionBtn) {
        actionBtn.className = "btn-crash-action btn-cashed-mode rl-action-main-btn";
        actionBtn.textContent = "G'ILDIRAK AYLANMOQDA... 🎡";
      }
    } else if (data.phase === "result") {
      appState.rl.winningNumber = data.winning_number;
      appState.rl.winningColor = data.winning_color;

      if (winOverlay) {
        winOverlay.style.display = "flex";
        if (winNumBadge) {
          winNumBadge.className = `rl-win-num-badge ${data.winning_color}`;
          winNumBadge.textContent = data.winning_number;
        }
        if (winLabel) {
          const colName = data.winning_color === "red" ? "QIZIL" : (data.winning_color === "black" ? "QORA" : "ZERO");
          winLabel.textContent = `${colName} #${data.winning_number}`;
        }
      }

      if (timerText) timerText.textContent = `${data.time_left.toFixed(1)}s`;
      if (phaseText) phaseText.textContent = `NATIJA: #${data.winning_number} (${data.winning_color.toUpperCase()})`;

      if (appState.rl.resultHandledRound !== data.round_id) {
        appState.rl.resultHandledRound = data.round_id;
        if (data.user_bet) {
          if (data.user_bet.status === "won") {
            audio.play("win");
            triggerHaptic("success");
            fx.confetti();
            showToast(`🎉 G'ALABA! +${formatMoney(data.user_bet.win)} UZS (${(data.user_bet.multiplier || 2).toFixed(1)}x)!`, true);
          } else {
            audio.play("boom");
            triggerHaptic("error");
            showToast(`❌ Yutuq chiqmadi (-${formatMoney(data.user_bet.bet)} UZS)`, false);
          }
          if (typeof data.balance === "number") {
            updateBalanceUI(data.balance);
          }
          apiFetch(`/api/user-status?user_id=${USER_ID}`).then(u => {
            if (u?.ok && typeof u.balance === "number") updateBalanceUI(u.balance);
          });
        }
      }

      if (actionBtn) {
        if (data.user_bet && data.user_bet.status === "won") {
          actionBtn.className = "btn-crash-action btn-cashout-mode rl-action-main-btn";
          actionBtn.textContent = `YUTUQ: +${formatMoney(data.user_bet.win)} UZS 🎉`;
        } else {
          actionBtn.className = "btn-crash-action btn-ready rl-action-main-btn";
          actionBtn.textContent = "KEYINGI RAUND KUTILMOQDA...";
        }
      }
    }
  } catch (e) {}
}

function initRouletteGame() {
  initRouletteCanvas();
  buildRouletteNumbersGrid();
  selectRouletteChoice("red", "🔴 QIZIL (x2.0)");
  startRoulettePolling();

  if (appState.rl.animId) {
    cancelAnimationFrame(appState.rl.animId);
    appState.rl.animId = null;
  }
  appState.rl.animId = requestAnimationFrame(rouletteLoop);
}

document.querySelectorAll(".rl-choice-card").forEach(card => {
  card.addEventListener("click", () => {
    audio.play("click");
    triggerHaptic("light");
    selectRouletteChoice(card.dataset.choice, card.dataset.label);
    document.querySelectorAll(".rl-num-btn").forEach(b => b.classList.remove("active"));
  });
});

document.querySelectorAll(".rl-sub-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    audio.play("click");
    triggerHaptic("light");
    selectRouletteChoice(btn.dataset.choice, btn.dataset.label);
    document.querySelectorAll(".rl-num-btn").forEach(b => b.classList.remove("active"));
  });
});

document.getElementById("rlMinus")?.addEventListener("click", () => {
  adjustBetInput("rlBetInput", "minus");
});
document.getElementById("rlPlus")?.addEventListener("click", () => {
  adjustBetInput("rlBetInput", "plus");
});
document.getElementById("rlHalf")?.addEventListener("click", () => {
  adjustBetInput("rlBetInput", "half");
});
document.getElementById("rlDouble")?.addEventListener("click", () => {
  adjustBetInput("rlBetInput", "double");
});
document.getElementById("rlMax")?.addEventListener("click", () => {
  adjustBetInput("rlBetInput", "max");
});

document.querySelectorAll(".rl-bet-controller .b-chip, .rl-chips-row .b-chip, #rlBettingBox .b-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const val = parseInt(chip.getAttribute("data-v"), 10);
    setBetChip("rlBetInput", val);
  });
});

document.getElementById("rlActionBtn")?.addEventListener("click", async () => {
  if (appState.rl.phase !== "betting") {
    showToast("⚠️ Hozirda raund davom etmoqda, yangi stavkalar keyingi raundda qabul qilinadi", false);
    return;
  }

  if (appState.rl.myBetPlaced) {
    const res = await apiFetch("/api/roulette/cancel", "POST", { user_id: USER_ID });
    if (res?.ok) {
      appState.rl.myBetPlaced = false;
      updateBalanceUI(res.balance);
      showToast("Stavka bekor qilindi, mablag' qaytarildi", true);
      audio.play("click");
      fetchRouletteStatus();
    } else {
      showToast(`❌ ${res?.error || "Xatolik"}`, false);
    }
  } else {
    const betVal = getValidatedBet("rlBetInput");
    if (!betVal) return;

    const res = await apiFetch("/api/roulette/bet", "POST", {
      user_id: USER_ID,
      bet: betVal,
      choice: appState.rl.selectedChoice,
      choice_label: appState.rl.selectedLabel,
      first_name: FIRST_NAME,
      username: USERNAME
    });

    if (res?.ok) {
      appState.rl.myBetPlaced = true;
      updateBalanceUI(res.balance);
      showToast(`✅ ${formatMoney(betVal)} UZS stavka qabul qilindi! (${appState.rl.selectedLabel})`, true);
      audio.play("click");
      triggerHaptic("medium");
      fetchRouletteStatus();
    } else {
      showToast(`❌ ${res?.error || "Xatolik"}`, false);
    }
  }
});

initAppData();
renderKamikazeBoard();
renderAppleBoard();
renderMinesBoard();
renderDicePips(1, 6);
initWheelCanvas();

