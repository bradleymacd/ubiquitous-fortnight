let audioCtx = null;
let isUnlocked = false;

function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function ensureAudioUnlocked() {
  const ctx = getCtx();
  if (!ctx) return false;
  if (isUnlocked) return true;

  // iOS Safari: unlock requires user gesture + an actual graph start.
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.frequency.value = 440;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  osc.start(now);
  osc.stop(now + 0.005);

  isUnlocked = true;
  return true;
}

function playTone({ frequencyHz, durationMs, gain = 0.12, type = "sine" }) {
  const ctx = getCtx();
  if (!ctx) return;

  // If the context got suspended (mobile), try to resume; it still requires
  // a prior user gesture to have unlocked successfully.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequencyHz;

  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export function playCountdownBeep() {
  playTone({ frequencyHz: 880, durationMs: 100, gain: 0.14, type: "square" });
}

export function playWorkStart() {
  playTone({ frequencyHz: 660, durationMs: 400, gain: 0.14, type: "sine" });
}

export function playRestStart() {
  playTone({ frequencyHz: 440, durationMs: 400, gain: 0.14, type: "sine" });
}

export function playWorkoutComplete() {
  // Ascending 523 → 659 → 784, ~150ms each
  playTone({ frequencyHz: 523, durationMs: 150, gain: 0.14, type: "sine" });
  setTimeout(() => playTone({ frequencyHz: 659, durationMs: 150, gain: 0.14, type: "sine" }), 170);
  setTimeout(() => playTone({ frequencyHz: 784, durationMs: 150, gain: 0.14, type: "sine" }), 340);
}

