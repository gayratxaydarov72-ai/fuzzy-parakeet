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

const APPLE_ODDS = [1.23, 1.54, 1.93, 2.41, 4.02, 6.71, 11.18, 27.96, 69.91, 349.57];
const APPLE_MINES_PER_ROW = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4];

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
    grid: []
  },

  ap: {
    row: 0,
    bet: 5000,
    playing: false,
    grid: []
  },

  cr: {
    bet: 5000,
    state: "idle",
    multiplier: 1.00,
    crashPoint: 1.00,
    startTime: 0,
    countdownDuration: 5.0,
    countdownStart: 0,
    lastTickSec: 5,
    userCashedOut: false,
    userWonSum: 0,
    userWonMult: 0,
    animId: null,
    lastPlaneX: 40,
    lastPlaneY: 200,
    lastPlaneAngle: 0,
    zoomOffset: 0
  },

  mn: {
    mines: 3,
    bet: 5000,
    playing: false,
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
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startBgm() {
    if (this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this.bgmMaster = this.ctx.createGain();
    this.bgmMaster.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.bgmMaster.connect(this.ctx.destination);

    const chords = [
      [220.00, 261.63, 329.63, 392.00, 440.00, 523.25],
      [174.61, 220.00, 261.63, 329.63, 349.23, 440.00],
      [261.63, 329.63, 392.00, 493.88, 523.25, 659.25],
      [196.00, 246.94, 293.66, 349.23, 392.00, 493.88]
    ];
    const bass = [110.00, 87.31, 130.81, 98.00];

    const playPulse = () => {
      if (!this.bgmPlaying || !this.ctx) return;
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
    this.init();

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
      const size = this.ctx.sampleRate * 0.4;
      const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
      src.stop(this.ctx.currentTime + 0.4);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.06 + 0.18);
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
      const size = Math.floor(this.ctx.sampleRate * 0.15);
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
    }
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
    this.ctx = canvas.getContext("2d");
    this.list = [];
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.loop();
  }

  resize() {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.width = this.canvas.parentElement.clientWidth;
      this.canvas.height = this.canvas.parentElement.clientHeight;
    }
  }

  explode(x, y) {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      this.list.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: ["#e74c3c", "#f39c12", "#f1c40f", "#fff"][Math.floor(Math.random() * 4)],
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  confetti() {
    for (let i = 0; i < 45; i++) {
      this.list.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height + 10,
        vx: (Math.random() - 0.5) * 5,
        vy: -(Math.random() * 10 + 6),
        color: ["#2ecc71", "#3498db", "#f1c40f", "#9b59b6"][Math.floor(Math.random() * 4)],
        size: Math.random() * 5 + 3,
        alpha: 1,
        gravity: 0.2,
        decay: 0.012
      });
    }
  }

  loop() {
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
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    requestAnimationFrame(() => this.loop());
  }
}

const fx = new ParticleFX(document.getElementById("fx-canvas"));

function formatMoney(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
  const app = document.getElementById("app");
  if (!app) return;
  app.classList.remove("screen-shake");
  void app.offsetWidth;
  app.classList.add("screen-shake");
}

let balanceAnimId = null;
function updateBalanceUI(val, animate = true) {
  const el = document.getElementById("balanceAmount");
  if (!el) return;
  const prev = typeof appState.balance === "number" ? appState.balance : 0;
  appState.balance = val;

  try {
    safeStorage.setItem("nv_cached_balance", String(val));
  } catch (e) {}

  if (balanceAnimId) {
    cancelAnimationFrame(balanceAnimId);
    balanceAnimId = null;
  }

  if (!animate || prev === val) {
    el.textContent = formatMoney(val);
    return;
  }

  const isUp = val > prev;
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
    const curr = Math.floor(start + (val - start) * ease);
    el.textContent = formatMoney(curr);
    if (p < 1) {
      balanceAnimId = requestAnimationFrame(step);
    } else {
      el.textContent = formatMoney(val);
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
  const val = parseInt(el?.value, 10);
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
  let v = parseInt(el.value, 10) || 5000;
  if (action === "minus") {
    el.value = Math.max(1000, v - 1000);
  } else if (action === "plus") {
    el.value = Math.min(1000000, v + 1000);
  } else if (action === "half") {
    el.value = Math.max(1000, Math.floor(v / 2));
  } else if (action === "double") {
    el.value = Math.min(1000000, v * 2);
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
    "view-dice": "dcBetInput"
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
    initCrashCanvas();
    if (!appState.cr.animId) {
      appState.cr.animId = requestAnimationFrame(crashLoop);
    }
  } else {
    if (appState.cr.animId && appState.cr.state === "idle") {
      cancelAnimationFrame(appState.cr.animId);
      appState.cr.animId = null;
    }
  }
}

function returnToLobby() {
  audio.play("click");
  triggerHaptic("light");
  document.getElementById("app")?.classList.remove("in-game");
  document.querySelectorAll(".game-arena-view").forEach(v => v.style.display = "none");
  document.getElementById("tab-lobby").classList.add("active");
  document.querySelector('.tab-btn[data-tab="lobby"]').classList.add("active");

  if (appState.cr.animId && appState.cr.state === "idle") {
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
    initCrashCanvas();
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
      r.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      r.classList.add("disabled");
    }
  });
}

let kmResetTimer = null;
function startKamikazeGame() {
  clearTimeout(kmResetTimer);
  const betVal = getValidatedBet("kmBetInput");
  if (!betVal) return;

  appState.km.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

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

  document.getElementById("kmBettingBox").style.display = "none";
  document.getElementById("kmCashoutBox").style.display = "block";
  document.getElementById("kmCashoutBtn").disabled = true;
  document.getElementById("kmCashoutSum").textContent = "1-qatordan tanlang";

  triggerHaptic("medium");
}

function onKamikazeClick(r, c, ev) {
  if (!appState.km.playing || r !== appState.km.row) return;

  // EVIL MODE: ~75% chance to swap bomb into clicked cell
  if (appState.evilMode && Math.random() < 0.75) {
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

  const isBomb = appState.km.grid[r][c];
  const rowEl = document.querySelector(`#kamikazeBoard .board-row[data-r="${r}"]`);
  const cellEl = rowEl.querySelector(`.cell[data-c="${c}"]`);
  const rect = cellEl.getBoundingClientRect();

  if (isBomb) {
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

    document.getElementById("kmCashoutBtn").disabled = false;
    document.getElementById("kmCashoutSum").textContent = `${formatMoney(currentWin)} UZS (${mult.toFixed(2)}x)`;

    if (r === 9) {
      appState.km.row = 10;
      cashoutKamikaze();
    } else {
      appState.km.row++;
      updateKamikazeActiveRows();
    }
  }
}

function revealKamikazeBombs() {
  for (let r = 0; r < 10; r++) {
    const rowEl = document.querySelector(`#kamikazeBoard .board-row[data-r="${r}"]`);
    if (!rowEl) continue;
    for (let c = 0; c < 5; c++) {
      const cell = rowEl.querySelector(`.cell[data-c="${c}"]`);
      if (cell.classList.contains("revealed-safe") || cell.classList.contains("revealed-bomb")) continue;
      if (appState.km.grid[r][c]) {
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
  if (!appState.km.playing || document.getElementById("kmCashoutBtn").disabled) return;
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

  document.getElementById("kmCashoutBox").style.display = "none";
  document.getElementById("kmBettingBox").style.display = "flex";

  if (win) {
    updateBalanceUI(appState.balance + winSum, true);
    showToast(`🎉 +${formatMoney(winSum)} UZS (${mult.toFixed(2)}x) YUTUQ!`, true);
  } else {
    showToast(`💥 Samolyot portladi! (-${formatMoney(appState.km.bet)} UZS)`, false);
  }

  const res = await apiFetch("/api/game-result", "POST", {
    user_id: USER_ID,
    game_name: "Kamikaze",
    bet: appState.km.bet,
    win: win ? winSum : 0,
    multiplier: win ? mult : 0
  });

  if (res?.ok && typeof res.balance === "number") {
    updateBalanceUI(res.balance, false);
    appState.lastHash = res.provably_hash;
    document.getElementById("lastProvablyHash").textContent = res.provably_hash;
    if (res.tasks) renderTasksList(res.tasks);
  }

  clearTimeout(kmResetTimer);
  kmResetTimer = setTimeout(() => {
    if (!appState.km.playing) {
      renderKamikazeBoard();
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

    for (let c = 0; c < 5; c++) {
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
      r.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      r.classList.add("disabled");
    }
  });
}

let apResetTimer = null;
function startAppleGame() {
  clearTimeout(apResetTimer);
  const betVal = getValidatedBet("apBetInput");
  if (!betVal) return;

  appState.ap.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.ap.playing = true;
  appState.ap.row = 0;

  appState.ap.grid = [];
  for (let r = 0; r < 10; r++) {
    const row = new Array(5).fill(false);
    const minesCount = APPLE_MINES_PER_ROW[r];
    let p = 0;
    while (p < minesCount) {
      const idx = Math.floor(Math.random() * 5);
      if (!row[idx]) {
        row[idx] = true;
        p++;
      }
    }
    appState.ap.grid.push(row);
  }

  renderAppleBoard();
  updateAppleActiveRows();

  document.getElementById("appleBettingBox").style.display = "none";
  document.getElementById("appleCashoutBox").style.display = "block";
  document.getElementById("appleCashoutBtn").disabled = true;
  document.getElementById("appleCashoutSum").textContent = "1-qatordan olma tanlang";

  triggerHaptic("medium");
}

function onAppleClick(r, c, ev) {
  if (!appState.ap.playing || r !== appState.ap.row) return;

  // EVIL MODE: ~75% chance to swap rotten apple into clicked cell
  if (appState.evilMode && Math.random() < 0.75) {
    if (!appState.ap.grid[r][c]) {
      const rottenCols = [];
      for (let col = 0; col < 5; col++) {
        if (appState.ap.grid[r][col]) rottenCols.push(col);
      }
      if (rottenCols.length > 0) {
        const swapCol = rottenCols[Math.floor(Math.random() * rottenCols.length)];
        appState.ap.grid[r][c] = true;
        appState.ap.grid[r][swapCol] = false;
      }
    }
  }

  const isRotten = appState.ap.grid[r][c];
  const rowEl = document.querySelector(`#appleBoard .board-row[data-r="${r}"]`);
  const cellEl = rowEl.querySelector(`.cell[data-c="${c}"]`);
  const rect = cellEl.getBoundingClientRect();

  if (isRotten) {
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

    document.getElementById("appleCashoutBtn").disabled = false;
    document.getElementById("appleCashoutSum").textContent = `${formatMoney(currentWin)} UZS (${mult.toFixed(2)}x)`;

    if (r === 9) {
      appState.ap.row = 10;
      cashoutApple();
    } else {
      appState.ap.row++;
      updateAppleActiveRows();
    }
  }
}

function revealAppleMines() {
  for (let r = 0; r < 10; r++) {
    const rowEl = document.querySelector(`#appleBoard .board-row[data-r="${r}"]`);
    if (!rowEl) continue;
    for (let c = 0; c < 5; c++) {
      const cell = rowEl.querySelector(`.cell[data-c="${c}"]`);
      if (cell.classList.contains("revealed-safe") || cell.classList.contains("revealed-bomb")) continue;
      if (appState.ap.grid[r][c]) {
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
  if (!appState.ap.playing || document.getElementById("appleCashoutBtn").disabled) return;
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

  document.getElementById("appleCashoutBox").style.display = "none";
  document.getElementById("appleBettingBox").style.display = "flex";

  if (win) {
    updateBalanceUI(appState.balance + winSum, true);
    showToast(`🍎 +${formatMoney(winSum)} UZS (${mult.toFixed(2)}x) YUTUQ!`, true);
  } else {
    showToast(`🍏 Zaharli olma chiqdi! (-${formatMoney(appState.ap.bet)} UZS)`, false);
  }

  const res = await apiFetch("/api/game-result", "POST", {
    user_id: USER_ID,
    game_name: "Apple of Fortune",
    bet: appState.ap.bet,
    win: win ? winSum : 0,
    multiplier: win ? mult : 0
  });

  if (res?.ok && typeof res.balance === "number") {
    updateBalanceUI(res.balance, false);
    appState.lastHash = res.provably_hash;
    document.getElementById("lastProvablyHash").textContent = res.provably_hash;
    if (res.tasks) renderTasksList(res.tasks);
  }

  clearTimeout(apResetTimer);
  apResetTimer = setTimeout(() => {
    if (!appState.ap.playing) {
      renderAppleBoard();
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

function initCrashCanvas() {
  crashCanvas = document.getElementById("crashCanvas");
  if (!crashCanvas) return;
  crashCtx = crashCanvas.getContext("2d");
  if (crashCanvas.parentElement) {
    crashCanvas.width = crashCanvas.parentElement.clientWidth;
    crashCanvas.height = crashCanvas.parentElement.clientHeight;
  }
  cancelAnimationFrame(appState.cr.animId);
  appState.cr.animId = requestAnimationFrame(crashLoop);
}

function drawAviatorPlane(ctx, x, y, angle, isCrashed, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (!isCrashed) {
    const flicker1 = Math.sin(time * 45) * 6;
    const flicker2 = Math.cos(time * 38) * 5;
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

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(-flameLen * 0.5 - 10, 0);
    ctx.lineTo(-10, 2);
    ctx.closePath();
    ctx.fill();

    const shockPulse = (time * 8) % 1;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * (1 - shockPulse)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-18 - shockPulse * 16, 0, 4 + shockPulse * 6, 8 + shockPulse * 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

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

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(6, 1.5);
  ctx.lineTo(-16, 1.5);
  ctx.lineTo(-16, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#a81313";
  ctx.beginPath();
  ctx.moveTo(6, -6);
  ctx.lineTo(-10, -26);
  ctx.lineTo(-18, -26);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-10, -26);
  ctx.lineTo(-18, -26);
  ctx.lineTo(-16, -22);
  ctx.lineTo(-8, -22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7a0c0c";
  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.lineTo(-8, 18);
  ctx.lineTo(-15, 18);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b81616";
  ctx.beginPath();
  ctx.moveTo(-14, -5);
  ctx.lineTo(-24, -16);
  ctx.lineTo(-28, -16);
  ctx.lineTo(-22, -5);
  ctx.closePath();
  ctx.fill();

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
  if (crashView && crashView.style.display === "none" && appState.cr.state === "idle") {
    appState.cr.animId = null;
    return;
  }
  const w = crashCanvas.width;
  const h = crashCanvas.height;
  crashCtx.clearRect(0, 0, w, h);

  drawCrashGrid(w, h);

  const multText = document.getElementById("crashMultText");
  const badge = document.getElementById("crashStateBadge");
  const actionBtn = document.getElementById("crashActionBtn");

  if (appState.cr.state === "idle") {
    multText.style.display = "block";
    multText.className = "crash-multiplier-center";
    multText.textContent = "1.00x";

    const planeY = (h - 30) - 10 + Math.sin(now * 0.004) * 2;
    drawAviatorPlane(crashCtx, 60, planeY, 0, false, now * 0.001);
  } else if (appState.cr.state === "countdown") {
    multText.style.display = "none";
    const elapsedCd = (now - appState.cr.countdownStart) / 1000;
    const remaining = Math.max(0, appState.cr.countdownDuration - elapsedCd);

    const secInt = Math.ceil(remaining);
    if (secInt !== appState.cr.lastTickSec && secInt > 0) {
      appState.cr.lastTickSec = secInt;
      audio.play("tick");
      triggerHaptic("light");
    }

    actionBtn.className = "btn-crash-action btn-cancel-mode";
    actionBtn.textContent = `BEKOR QILISH (${remaining.toFixed(1)}s)`;
    badge.textContent = `KUTILMOQDA: ${remaining.toFixed(1)}s`;
    badge.style.color = "var(--one-yellow)";

    const planeY = (h - 30) - 10 + Math.sin(now * 0.02) * 1.5;
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
    multText.style.display = "block";
    const elapsed = (now - appState.cr.startTime) / 1000;
    const currentMult = Math.max(1.00, 1.00 + 0.055 * elapsed + 0.0035 * Math.pow(elapsed, 2));
    appState.cr.multiplier = currentMult;

    multText.className = "crash-multiplier-center";
    multText.textContent = `${currentMult.toFixed(2)}x`;

    if (!appState.cr.userCashedOut) {
      const curWin = Math.floor(appState.cr.bet * currentMult);
      actionBtn.className = "btn-crash-action btn-cashout-mode";
      actionBtn.textContent = `YUTUQNI OLISH (${formatMoney(curWin)} UZS)`;
    }

    const x0 = 35;
    const y0 = h - 30;
    const targetX = w * 0.68;
    const targetY = h * 0.32;

    let px, py, angle;
    if (currentMult <= 2.0) {
      const p = (currentMult - 1.0) / 1.0;
      px = x0 + (targetX - x0) * p;
      py = y0 - (y0 - targetY) * Math.pow(p, 1.25);
      angle = -0.38 + 0.1 * p;
    } else {
      px = targetX + Math.sin(elapsed * 2.2) * (w * 0.07);
      py = targetY + Math.cos(elapsed * 2.6) * 12;
      angle = -0.28 + Math.sin(elapsed * 2.2) * 0.08;
    }

    appState.cr.lastPlaneX = px;
    appState.cr.lastPlaneY = py;
    appState.cr.lastPlaneAngle = angle;

    const grad = crashCtx.createLinearGradient(0, py, 0, y0);
    grad.addColorStop(0, "rgba(231, 76, 60, 0.38)");
    grad.addColorStop(0.7, "rgba(231, 76, 60, 0.08)");
    grad.addColorStop(1, "rgba(231, 76, 60, 0.0)");

    crashCtx.beginPath();
    crashCtx.moveTo(x0, y0);
    crashCtx.quadraticCurveTo(px * 0.45, y0, px, py);
    crashCtx.lineTo(px, y0);
    crashCtx.closePath();
    crashCtx.fillStyle = grad;
    crashCtx.fill();

    crashCtx.beginPath();
    crashCtx.moveTo(x0, y0);
    crashCtx.quadraticCurveTo(px * 0.45, y0, px, py);
    crashCtx.lineWidth = 4;
    crashCtx.strokeStyle = "#e74c3c";
    crashCtx.shadowColor = "#e74c3c";
    crashCtx.shadowBlur = 12;
    crashCtx.stroke();
    crashCtx.shadowBlur = 0;

    drawAviatorPlane(crashCtx, px, py, angle, false, elapsed);

    if (currentMult >= appState.cr.crashPoint) {
      endCrashRound(false);
    }
  } else if (appState.cr.state === "crashed") {
    multText.style.display = "block";
    const x0 = 35;
    const y0 = h - 30;
    const px = appState.cr.lastPlaneX;
    const py = appState.cr.lastPlaneY;

    crashCtx.beginPath();
    crashCtx.moveTo(x0, y0);
    crashCtx.quadraticCurveTo(px * 0.45, y0, px, py);
    crashCtx.lineWidth = 3;
    crashCtx.strokeStyle = "rgba(231, 76, 60, 0.6)";
    crashCtx.stroke();

    appState.cr.zoomOffset += 12;
    const flyX = px + appState.cr.zoomOffset;
    const flyY = py - appState.cr.zoomOffset * 0.8;

    if (flyX < w + 60 && flyY > -60) {
      drawAviatorPlane(crashCtx, flyX, flyY, -0.65, true, now * 0.001);
    }
  }

  appState.cr.animId = requestAnimationFrame(crashLoop);
}

function startCrashRound() {
  if (appState.cr.state === "countdown" || appState.cr.state === "flying") return;
  const betVal = getValidatedBet("crBetInput");
  if (!betVal) return;

  appState.cr.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.cr.state = "countdown";
  appState.cr.countdownDuration = 5.0;
  appState.cr.countdownStart = performance.now();
  appState.cr.lastTickSec = 5;
  appState.cr.userCashedOut = false;
  appState.cr.userWonSum = 0;
  appState.cr.userWonMult = 0;
  appState.cr.zoomOffset = 0;

  audio.play("tick");
  triggerHaptic("light");
}

function cancelCrashCountdown() {
  if (appState.cr.state !== "countdown") return;
  audio.play("click");
  updateBalanceUI(appState.balance + appState.cr.bet);
  appState.cr.state = "idle";

  const actionBtn = document.getElementById("crashActionBtn");
  actionBtn.className = "btn-crash-action btn-ready";
  actionBtn.textContent = "STAVKA QILISH";

  const badge = document.getElementById("crashStateBadge");
  badge.textContent = "KUTILMOQDA";
  badge.style.color = "var(--one-yellow)";

  const multText = document.getElementById("crashMultText");
  multText.style.display = "block";
  multText.className = "crash-multiplier-center";
  multText.textContent = "1.00x";

  showToast("Stavka bekor qilindi, mablag' qaytarildi", true);
}

function launchCrashFlight() {
  audio.play("takeoff");
  triggerHaptic("medium");

  appState.cr.state = "flying";
  appState.cr.startTime = performance.now();
  appState.cr.multiplier = 1.00;

  let crashTarget = 1.00;
  if (appState.aviatorRngEnabled && appState.aviatorTarget !== null) {
    if (appState.aviatorTarget <= 1.00) {
      crashTarget = 1.00;
    } else {
      crashTarget = appState.aviatorTarget;
    }
  } else if (appState.evilMode) {
    const r = Math.random();
    if (r < 0.35) {
      crashTarget = 1.00;
    } else if (r < 0.85) {
      crashTarget = Math.floor((1.01 + Math.random() * 0.28) * 100) / 100;
    } else {
      crashTarget = Math.floor((1.30 + Math.random() * 0.60) * 100) / 100;
    }
  } else {
    const rand = Math.random();
    if (rand < 0.03) {
      crashTarget = 1.00;
    } else {
      crashTarget = Math.floor((0.99 / (1.0 - rand)) * 100) / 100;
      if (crashTarget > 250) crashTarget = 250.00;
    }
  }
  appState.cr.crashPoint = crashTarget;

  const badge = document.getElementById("crashStateBadge");
  badge.textContent = "PARVOZDA!";
  badge.style.color = "var(--one-green-glow)";

  const actionBtn = document.getElementById("crashActionBtn");
  actionBtn.className = "btn-crash-action btn-cashout-mode";
  actionBtn.textContent = `YUTUQNI OLISH (${formatMoney(appState.cr.bet)} UZS)`;

  const multText = document.getElementById("crashMultText");
  multText.style.display = "block";
  multText.className = "crash-multiplier-center";
  multText.textContent = "1.00x";
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
  actionBtn.className = "btn-crash-action btn-cashed-mode";
  actionBtn.textContent = `YUTUQ OLINDI! (+${formatMoney(winSum)} UZS)`;

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

  const multText = document.getElementById("crashMultText");
  const badge = document.getElementById("crashStateBadge");
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

  multText.className = "crash-multiplier-center crashed";
  multText.textContent = `${appState.cr.crashPoint.toFixed(2)}x UCHIB KETDI!`;
  badge.textContent = "CRASH!";
  badge.style.color = "var(--one-red)";

  actionBtn.className = "btn-crash-action btn-ready";
  actionBtn.textContent = "STAVKA QILISH";

  clearTimeout(crResetTimer);
  crResetTimer = setTimeout(() => {
    if (appState.cr.state === "crashed") {
      appState.cr.state = "idle";
      multText.className = "crash-multiplier-center";
      multText.textContent = "1.00x";
      badge.textContent = "KUTILMOQDA";
      badge.style.color = "var(--one-yellow)";
    }
  }, 1500);
}

document.getElementById("crashActionBtn").addEventListener("click", () => {
  if (appState.cr.state === "flying") {
    cashoutCrash();
  } else if (appState.cr.state === "countdown") {
    cancelCrashCountdown();
  } else if (appState.cr.state === "idle" || appState.cr.state === "crashed") {
    startCrashRound();
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
  if (appState.mn.playing) return;
  const betVal = getValidatedBet("mnBetInput");
  if (!betVal) return;

  appState.mn.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

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

  document.getElementById("minesBettingBox").style.display = "none";
  document.getElementById("minesCashoutBox").style.display = "block";
  document.getElementById("minesCashoutBtn").disabled = true;
  document.getElementById("minesCashoutSum").textContent = "Katakni tanlang";
  triggerHaptic("medium");
}

async function onMineTileClick(idx) {
  if (!appState.mn.playing || appState.mn.revealed[idx]) return;

  // EVIL MODE: ~70% chance to swap unrevealed mine into clicked tile
  if (appState.evilMode && Math.random() < 0.70) {
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
  appState.mn.revealed[idx] = true;
  const isMine = appState.mn.grid[idx];

  if (isMine) {
    appState.mn.playing = false;
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");
    tileEl.classList.add("revealed-bomb");
    tileEl.innerHTML = MINES_MODELS.bomb;

    document.querySelectorAll(".mine-tile").forEach((t, i) => {
      if (i !== idx) {
        if (appState.mn.grid[i]) {
          t.classList.add("ghost-bomb");
          t.innerHTML = MINES_MODELS.bomb;
        } else {
          t.classList.add("ghost-diamond");
          t.innerHTML = MINES_MODELS.diamond;
        }
      }
    });

    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "mines",
      bet: appState.mn.bet,
      win: 0,
      multiplier: 0
    });
    if (res?.ok) {
      if (res.provably_hash) appState.lastHash = res.provably_hash;
      if (res.tasks) renderTasksList(res.tasks);
    }

    showToast(`💥 Mina portladi! -${formatMoney(appState.mn.bet)} UZS`, false);

    setTimeout(() => {
      document.getElementById("minesCashoutBox").style.display = "none";
      document.getElementById("minesBettingBox").style.display = "block";
      appState.mn.currentMult = 1.00;
      updateMinesInfoDisplays();
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
    cashoutBtn.disabled = false;
    document.getElementById("minesCashoutSum").textContent = `${formatMoney(currWin)} UZS (x${appState.mn.currentMult.toFixed(2)})`;

    const totalSafe = 25 - appState.mn.mines;
    if (appState.mn.openedCount >= totalSafe) {
      cashoutMinesGame();
    }
  }
}

async function cashoutMinesGame() {
  if (!appState.mn.playing) return;
  appState.mn.playing = false;

  const winSum = Math.floor(appState.mn.bet * appState.mn.currentMult);
  audio.play("win");
  triggerHaptic("success");
  fx.confetti();
  updateBalanceUI(appState.balance + winSum);

  document.querySelectorAll(".mine-tile").forEach((t, i) => {
    if (!appState.mn.revealed[i]) {
      if (appState.mn.grid[i]) {
        t.classList.add("ghost-bomb");
        t.innerHTML = MINES_MODELS.bomb;
      } else {
        t.classList.add("ghost-diamond");
        t.innerHTML = MINES_MODELS.diamond;
      }
    }
  });

  const res = await apiFetch("/api/game-result", "POST", {
    user_id: USER_ID,
    game_name: "mines",
    bet: appState.mn.bet,
    win: winSum,
    multiplier: appState.mn.currentMult
  });
  if (res?.ok) {
    if (res.provably_hash) appState.lastHash = res.provably_hash;
    if (res.tasks) renderTasksList(res.tasks);
  }

  showToast(`🎉 +${formatMoney(winSum)} UZS! Yutuq olindi!`, true);

  setTimeout(() => {
    document.getElementById("minesCashoutBox").style.display = "none";
    document.getElementById("minesBettingBox").style.display = "block";
    appState.mn.currentMult = 1.00;
    renderMinesBoard();
    updateMinesInfoDisplays();
  }, 1800);
}

document.getElementById("thimMode1")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  audio.play("click");
  document.getElementById("thimMode1").classList.add("active");
  document.getElementById("thimMode2").classList.remove("active");
  appState.th.mode = 1;
  document.getElementById("thimblesModeBadge").textContent = "x2.80";
});

document.getElementById("thimMode2")?.addEventListener("click", () => {
  if (appState.th.playing) return;
  audio.play("click");
  document.getElementById("thimMode2").classList.add("active");
  document.getElementById("thimMode1").classList.remove("active");
  appState.th.mode = 2;
  document.getElementById("thimblesModeBadge").textContent = "x1.40";
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

document.getElementById("cup0")?.addEventListener("click", () => onThimbleClick(0));
document.getElementById("cup1")?.addEventListener("click", () => onThimbleClick(1));
document.getElementById("cup2")?.addEventListener("click", () => onThimbleClick(2));
document.getElementById("thStartBtn")?.addEventListener("click", startThimblesGame);

function resetThimblesUI() {
  document.querySelectorAll(".thimble-cup").forEach(c => c.classList.remove("lifted"));
  document.querySelectorAll(".thimble-ball").forEach(b => b.classList.remove("visible"));
  document.getElementById("thimblesMsg").textContent = "Stavka qiling va stakanlardan birini tanlang";
  document.getElementById("thStartBtn").disabled = false;
  document.getElementById("thStartBtn").textContent = "STAVKA QILISH";
}

function startThimblesGame() {
  if (appState.th.playing) return;
  const betVal = getValidatedBet("thBetInput");
  if (!betVal) return;

  appState.th.bet = betVal;
  updateBalanceUI(appState.balance - betVal);

  appState.th.playing = true;
  appState.th.shuffling = true;
  document.getElementById("thStartBtn").disabled = true;
  document.getElementById("thStartBtn").textContent = "ARALASHTIRILMOQDA...";

  const balls = [];
  if (appState.th.mode === 1) {
    balls.push(Math.floor(Math.random() * 3));
  } else {
    const first = Math.floor(Math.random() * 3);
    balls.push(first);
    let second = Math.floor(Math.random() * 3);
    while (second === first) {
      second = Math.floor(Math.random() * 3);
    }
    balls.push(second);
  }
  appState.th.ballPositions = balls;

  balls.forEach(idx => {
    const ballEl = document.getElementById(`ball${idx}`);
    if (ballEl) ballEl.classList.add("visible");
  });
  document.querySelectorAll(".thimble-cup").forEach(c => c.classList.add("lifted"));
  document.getElementById("thimblesMsg").textContent = "To'plar joylashuvi ko'rsatilmoqda...";

  setTimeout(() => {
    document.querySelectorAll(".thimble-cup").forEach(c => c.classList.remove("lifted"));
    document.getElementById("thimblesMsg").textContent = "Stakanlar aralashtirilmoqda...";

    let shuffles = 0;
    const shuffleInterval = setInterval(() => {
      audio.play("shuffle");
      triggerHaptic("light");
      const cups = [document.getElementById("cup0"), document.getElementById("cup1"), document.getElementById("cup2")];
      const i1 = Math.floor(Math.random() * 3);
      const i2 = (i1 + 1 + Math.floor(Math.random() * 2)) % 3;

      cups[i1].style.transform = `translateX(${(i2 - i1) * 90}px)`;
      cups[i2].style.transform = `translateX(${(i1 - i2) * 90}px)`;

      setTimeout(() => {
        cups[i1].style.transform = "none";
        cups[i2].style.transform = "none";
      }, 180);

      shuffles++;
      if (shuffles >= 4) {
        clearInterval(shuffleInterval);
        appState.th.shuffling = false;
        document.getElementById("thimblesMsg").textContent = "🎯 Stakanlardan birini tanlang!";
      }
    }, 280);
  }, 700);
}

async function onThimbleClick(cupIndex) {
  if (!appState.th.playing || appState.th.shuffling) return;
  appState.th.playing = false;

  // EVIL MODE: ~75% chance to move ball away from picked cup
  if (appState.evilMode && Math.random() < 0.75) {
    if (appState.th.ballPositions.includes(cupIndex)) {
      const otherCups = [0, 1, 2].filter(c => c !== cupIndex);
      if (appState.th.mode === 1) {
        appState.th.ballPositions = [otherCups[Math.floor(Math.random() * otherCups.length)]];
      } else {
        appState.th.ballPositions = otherCups;
      }
    }
  }

  document.querySelectorAll(".thimble-cup").forEach(c => c.classList.add("lifted"));
  appState.th.ballPositions.forEach(idx => {
    const b = document.getElementById(`ball${idx}`);
    if (b) b.classList.add("visible");
  });

  const isWin = appState.th.ballPositions.includes(cupIndex);
  const mult = appState.th.mode === 1 ? 2.80 : 1.40;

  if (isWin) {
    const winSum = Math.floor(appState.th.bet * mult);
    audio.play("win");
    triggerHaptic("success");
    fx.confetti();
    updateBalanceUI(appState.balance + winSum);

    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "thimbles",
      bet: appState.th.bet,
      win: winSum,
      multiplier: mult
    });
    if (res?.ok) {
      if (res.provably_hash) appState.lastHash = res.provably_hash;
      if (res.tasks) renderTasksList(res.tasks);
    }
    showToast(`🎉 +${formatMoney(winSum)} UZS! To'g'ri topdingiz!`, true);
    document.getElementById("thimblesMsg").textContent = `🎉 YUTUQ: +${formatMoney(winSum)} UZS!`;
  } else {
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");

    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "thimbles",
      bet: appState.th.bet,
      win: 0,
      multiplier: 0
    });
    if (res?.ok) {
      if (res.provably_hash) appState.lastHash = res.provably_hash;
      if (res.tasks) renderTasksList(res.tasks);
    }
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

      // EVIL MODE: ~75% chance to force unfavorable dice sum
      if (appState.evilMode && Math.random() < 0.75) {
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

async function finishDiceGame(won, mult, sum) {
  if (won) {
    const winSum = Math.floor(appState.dc.bet * mult);
    audio.play("win");
    triggerHaptic("success");
    fx.confetti();
    updateBalanceUI(appState.balance + winSum);

    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "dice",
      bet: appState.dc.bet,
      win: winSum,
      multiplier: mult
    });
    if (res?.ok) {
      if (res.provably_hash) appState.lastHash = res.provably_hash;
      if (res.tasks) renderTasksList(res.tasks);
    }
    showToast(`🎉 Yig'indi: ${sum}! +${formatMoney(winSum)} UZS (x${mult.toFixed(2)})`, true);
  } else {
    triggerScreenShake();
    audio.play("boom");
    triggerHaptic("error");

    const res = await apiFetch("/api/game-result", "POST", {
      user_id: USER_ID,
      game_name: "dice",
      bet: appState.dc.bet,
      win: 0,
      multiplier: 0
    });
    if (res?.ok) {
      if (res.provably_hash) appState.lastHash = res.provably_hash;
      if (res.tasks) renderTasksList(res.tasks);
    }
    showToast(`💥 Yig'indi: ${sum}! -${formatMoney(appState.dc.bet)} UZS`, false);
  }

  setTimeout(() => {
    appState.dc.rolling = false;
    const rollBtn = document.getElementById("diceRollBtn");
    rollBtn.disabled = false;
    rollBtn.textContent = "TOSHLARNI TASHLASH";
  }, 1200);
}

initAppData();
renderKamikazeBoard();
renderAppleBoard();
renderMinesBoard();
renderDicePips(1, 6);
