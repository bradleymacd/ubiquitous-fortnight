import "./style.css";
import {
  ensureAudioUnlocked,
  playCountdownBeep,
  playRestStart,
  playWorkStart,
  playWorkoutComplete,
} from "./audio.js";
import {
  releaseWakeLock,
  requestWakeLockIfSupported,
} from "./wakeLock.js";
import { cancelSpeech, ensureSpeechUnlocked, speak } from "./voice.js";

function getAppRoot() {
  return document.getElementById("app");
}

const PHASE = {
  countdown: "countdown",
  work: "work",
  rest: "rest",
};

const STATUS = {
  setup: "setup",
  running: "running",
  paused: "paused",
  done: "done",
};

// Declared before boot() — synchronous boot runs render → totalWorkoutSeconds before rest of file evaluates.
function formatMMSS(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(clamped / 60)).padStart(2, "0");
  const ss = String(clamped % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function buildDurationOptions() {
  const opts = [];
  // Includes Tabata defaults (0:20 / 0:10) while keeping the list short.
  // 0:05–1:00 in 5s steps, then 1:15–5:00 in 15s steps.
  for (let seconds = 5; seconds <= 60; seconds += 5) {
    opts.push({ seconds, label: formatMMSS(seconds) });
  }
  for (let seconds = 75; seconds <= 300; seconds += 15) {
    opts.push({ seconds, label: formatMMSS(seconds) });
  }
  return opts;
}

/** Matches current app: 10s initial countdown + N×work + (N−1)×rest (no rest after final work). */
const INITIAL_COUNTDOWN_SECONDS = 10;

function totalWorkoutSeconds(workSec, restSec, rounds) {
  const n = Math.max(1, Math.floor(rounds));
  return INITIAL_COUNTDOWN_SECONDS + n * workSec + (n - 1) * restSec;
}

let durationOptionsCache = null;
function getDurationOptions() {
  if (!durationOptionsCache) {
    durationOptionsCache = buildDurationOptions();
  }
  return durationOptionsCache;
}

const state = {
  // Config (seconds / integer)
  workDuration: 20,
  restDuration: 10,
  totalRounds: 8,

  // Runtime
  timeRemaining: 20,
  isRunning: false,
  currentPhase: PHASE.work,
  currentRound: 1,
  status: STATUS.setup,

  // Audio toggles (no persistence by design)
  voiceEnabled: true,
  beepsEnabled: true,

  // Smooth progress bar timing
  phaseEndsAtMs: null,
  phaseDurationMs: null,
  pausedPhaseRemainingMs: null,
};

let intervalId = null;
let lastCountdownBeepAt = null; // string key: `${phase}:${round}:${seconds}`
let rafId = null;
let lastRoundCalloutAt = null; // `${phase}:${round}:${seconds}`
let lastTickShownSeconds = null;

function boot() {
  try {
    render();
  } catch (err) {
    console.error(err);
    const root = getAppRoot();
    if (root) {
      root.innerHTML = `
        <main class="card card--padded" aria-live="assertive">
          <h1 class="title">Could not start timer</h1>
          <p class="subtitle error-text">${String(err?.message ?? err)}</p>
          <p class="subtitle help-text">Try a hard refresh (clear cache) or run <code class="inline-code">npm run dev</code> from the project folder.</p>
        </main>
      `;
    }
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

function phaseLabel(phase) {
  if (phase === PHASE.countdown) return "GET READY";
  return phase === PHASE.work ? "WORK" : "REST";
}

function speakerOnIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14 3.23v17.54c0 1.13-1.27 1.81-2.22 1.2L7.9 19H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h2.9l3.88-3.97c.95-.61 2.22.07 2.22 1.2ZM16.5 8.5a1 1 0 0 1 1.41 0a6 6 0 0 1 0 8.49a1 1 0 1 1-1.41-1.41a4 4 0 0 0 0-5.66a1 1 0 0 1 0-1.42Zm2.83-2.83a1 1 0 0 1 1.41 0a10 10 0 0 1 0 14.14a1 1 0 1 1-1.41-1.41a8 8 0 0 0 0-11.32a1 1 0 0 1 0-1.41Z"/>
    </svg>
  `;
}

function speakerOffIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14 3.23v17.54c0 1.13-1.27 1.81-2.22 1.2L7.9 19H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h2.9l3.88-3.97c.95-.61 2.22.07 2.22 1.2Z"/>
      <path fill="currentColor" d="M17.59 8.59a1 1 0 0 1 1.41 0L21 10.59l1.99-2a1 1 0 1 1 1.42 1.42L22.41 12l2 1.99a1 1 0 0 1-1.42 1.42L21 13.41l-2 2a1 1 0 0 1-1.41-1.42L19.59 12l-2-1.99a1 1 0 0 1 0-1.42Z"/>
    </svg>
  `;
}

function bellOnIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z"/>
    </svg>
  `;
}

function bellOffIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"/>
      <path fill="currentColor" d="M4 18v1h16v-1l-2-2V11c0-1.2-.35-2.32-.95-3.27l-1.5 1.5c.29.55.45 1.18.45 1.77v5.83l1.17 1.17H6.83L6 17.83V11c0-.64.14-1.25.4-1.8L4.9 7.7A5.96 5.96 0 0 0 4 11v5l-2 2Z"/>
      <path fill="currentColor" d="M3.29 4.71a1 1 0 0 1 1.42-1.42l16 16a1 1 0 1 1-1.42 1.42l-16-16Z"/>
    </svg>
  `;
}

function stopInterval() {
  if (intervalId != null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function startInterval() {
  stopInterval();
  intervalId = setInterval(() => {
    if (!state.isRunning || state.status !== STATUS.running) return;
    tick();
  }, 1000);
  startProgressLoop();
}

function startProgressLoop() {
  if (rafId != null) return;

  const loop = () => {
    rafId = requestAnimationFrame(loop);
    if (state.status !== STATUS.running) return;

    const banner = document.querySelector("#phaseBanner");
    if (!banner) return;

    const p = computeProgressNow();
    banner.style.setProperty("--p", String(p));
  };

  rafId = requestAnimationFrame(loop);
}

function stopProgressLoop() {
  if (rafId == null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
}

function setStatus(nextStatus) {
  state.status = nextStatus;
  state.isRunning = nextStatus === STATUS.running;

  if (state.isRunning) {
    startInterval();
    requestWakeLockIfSupported();
  } else {
    stopInterval();
    stopProgressLoop();
    releaseWakeLock();
  }

  render();
}

function enterPhase(phase, durationSeconds) {
  state.currentPhase = phase;
  state.timeRemaining = durationSeconds;
  state.phaseDurationMs = durationSeconds * 1000;
  state.phaseEndsAtMs = Date.now() + state.phaseDurationMs;
  state.pausedPhaseRemainingMs = null;
  lastCountdownBeepAt = null;
  lastRoundCalloutAt = null;
}

function startWorkout() {
  state.currentRound = 1;
  enterPhase(PHASE.countdown, 10);
  setStatus(STATUS.running);
}

function pause() {
  if (state.status !== STATUS.running) return;
  cancelSpeech();
  if (state.phaseEndsAtMs != null) {
    state.pausedPhaseRemainingMs = Math.max(0, state.phaseEndsAtMs - Date.now());
  }
  setStatus(STATUS.paused);
}

function resume() {
  if (state.status !== STATUS.paused) return;
  if (state.pausedPhaseRemainingMs != null) {
    state.phaseEndsAtMs = Date.now() + state.pausedPhaseRemainingMs;
    state.pausedPhaseRemainingMs = null;
  }
  setStatus(STATUS.running);
}

function resetToSetup() {
  stopInterval();
  stopProgressLoop();
  releaseWakeLock();
  cancelSpeech();

  state.status = STATUS.setup;
  state.isRunning = false;

  // Preserve the user's selected settings; reset runtime fields.
  state.currentRound = 1;
  state.currentPhase = PHASE.work;
  state.timeRemaining = state.workDuration;
  state.phaseEndsAtMs = null;
  state.phaseDurationMs = null;
  state.pausedPhaseRemainingMs = null;

  render();
}

function done() {
  setStatus(STATUS.done);
  state.timeRemaining = 0;
  state.phaseEndsAtMs = null;
  state.phaseDurationMs = null;
  state.pausedPhaseRemainingMs = null;
  cancelSpeech();
  render();
}

function finishWorkout() {
  if (state.beepsEnabled) playWorkoutComplete();
  done();
  if (state.voiceEnabled) speak("Done, nice job!");
}

function advanceToNextPhase({ viaSkip }) {
  const fromPhase = state.currentPhase;
  const fromRound = state.currentRound;

  // countdown -> work (round 1)
  if (state.currentPhase === PHASE.countdown) {
    state.currentRound = 1;
    enterPhase(PHASE.work, state.workDuration);
    // Work begins here (either naturally after countdown or via skip).
    if (viaSkip && state.voiceEnabled) speak("Round one");
    if (state.beepsEnabled) playWorkStart();
    render();
    return {
      from: fromPhase,
      fromRound,
      next: PHASE.work,
      done: false,
      viaSkip,
    };
  }

  // work -> rest (same round), except after the final work — no rest, workout ends
  if (state.currentPhase === PHASE.work) {
    if (state.currentRound === state.totalRounds) {
      finishWorkout();
      return { next: null, done: true, viaSkip };
    }
    enterPhase(PHASE.rest, state.restDuration);
    if (state.beepsEnabled) playRestStart();
    if (state.voiceEnabled) speak("Rest");
    render();
    return {
      from: fromPhase,
      fromRound,
      next: PHASE.rest,
      done: false,
      viaSkip,
    };
  }

  // rest -> next work (final round never has a rest phase)
  state.currentRound += 1;
  enterPhase(PHASE.work, state.workDuration);
  if (viaSkip) {
    if (state.voiceEnabled) {
      if (state.currentRound === state.totalRounds) speak("Last Round");
      else speak(`Round ${state.currentRound}`);
    }
  }
  if (state.beepsEnabled) playWorkStart();
  render();
  return { next: PHASE.work, done: false, viaSkip };
}

function skipPhase() {
  if (state.status !== STATUS.running && state.status !== STATUS.paused) return;
  return advanceToNextPhase({ viaSkip: true });
}

function tick() {
  // Keep the display aligned to wall-clock time so the progress bar stays smooth.
  const prevShown = state.timeRemaining;
  if (state.phaseEndsAtMs != null) {
    const remainingMs = Math.max(0, state.phaseEndsAtMs - Date.now());
    // Avoid boundary skips when remainingMs hits an exact multiple of 1000.
    // Example seen in logs: 8001ms -> 9, then 7000ms -> 7 (skipping 8).
    const durationMs = state.phaseDurationMs ?? null;
    const boundaryBump =
      remainingMs > 0 &&
      remainingMs % 1000 === 0 &&
      durationMs != null &&
      remainingMs !== durationMs;
    const remainingSeconds = Math.ceil(remainingMs / 1000) + (boundaryBump ? 1 : 0);
    state.timeRemaining = remainingSeconds;
  }

  maybeSpeakRoundAfterBeeps(prevShown, state.timeRemaining);
  maybePlayCountdownBeepsCrossing(prevShown, state.timeRemaining);

  if (state.timeRemaining > 0) {
    render();
    return;
  }

  state.timeRemaining = 0;

  advanceToNextPhase({ viaSkip: false });
}

function maybeSpeakRoundAfterBeeps(prevShown, nowShown) {
  if (state.status !== STATUS.running) return;

  // New behavior: voice comes after the 3-2-1 beeps, right before work begins.
  // Trigger when countdown/rest hits 0 (or crosses to 0).
  if (!(state.currentPhase === PHASE.countdown || state.currentPhase === PHASE.rest))
    return;

  const crossedToZero = prevShown > 0 && nowShown <= 0;
  const atZero = nowShown === 0;
  if (!crossedToZero && !atZero) return;

  const key = `${state.currentPhase}:${state.currentRound}:to-work`;
  if (lastRoundCalloutAt === key) return;

  if (state.currentPhase === PHASE.countdown) {
    lastRoundCalloutAt = key;
    if (state.voiceEnabled) speak("Round one");
    return;
  }

  // rest -> upcoming work (unless this is final rest, which goes to done)
  if (state.currentRound >= state.totalRounds) return;
  const nextRound = state.currentRound + 1;
  lastRoundCalloutAt = key;
  if (state.voiceEnabled) {
    if (nextRound === state.totalRounds) speak("Last Round");
    else speak(`Round ${nextRound}`);
  }
}

function computeProgressNow() {
  if (state.status !== STATUS.running) return 0;
  if (!state.phaseEndsAtMs || !state.phaseDurationMs) return 0;
  const now = Date.now();
  const elapsed = state.phaseDurationMs - Math.max(0, state.phaseEndsAtMs - now);
  const p = elapsed / state.phaseDurationMs;
  return Math.max(0, Math.min(1, p));
}

function shouldPlayFinalThreeBeeps() {
  if (state.status !== STATUS.running) return false;
  if (state.timeRemaining > 3 || state.timeRemaining < 1) return false;

  // Final 3 seconds of:
  // - initial countdown
  // - every work phase
  // - every rest phase except the final round's
  if (state.currentPhase === PHASE.countdown) return true;
  if (state.currentPhase === PHASE.work) return true;
  if (state.currentPhase === PHASE.rest) {
    return state.currentRound < state.totalRounds;
  }
  return false;
}

function maybePlayCountdownBeepsCrossing(prevShown, nowShown) {
  if (state.status !== STATUS.running) return;

  // Fire beeps for 3/2/1 even if the display skips a number.
  for (const s of [3, 2, 1]) {
    const crossed = prevShown > s && nowShown <= s;
    const at = nowShown === s;
    if (!crossed && !at) continue;

    // Respect the "final rest has no beeps" rule.
    if (state.currentPhase === PHASE.rest && state.currentRound >= state.totalRounds) {
      continue;
    }

    const key = `${state.currentPhase}:${state.currentRound}:${s}`;
    if (lastCountdownBeepAt === key) continue;
    lastCountdownBeepAt = key;
    if (state.beepsEnabled) playCountdownBeep();
  }
}

function setConfigFromSetup({ workDuration, restDuration, totalRounds }) {
  state.workDuration = workDuration;
  state.restDuration = restDuration;
  state.totalRounds = totalRounds;

  // Keep runtime aligned with config while still on setup.
  if (state.status === STATUS.setup) {
    state.currentRound = 1;
    state.currentPhase = PHASE.work;
    state.timeRemaining = state.workDuration;
  }
}

function render() {
  const root = getAppRoot();
  if (!root) return;

  const view =
    state.status === STATUS.setup ? renderSetup() : renderRunOrDone();

  root.innerHTML = view;
  wireEvents();
}

function renderSetup() {
  const totalSec = totalWorkoutSeconds(
    state.workDuration,
    state.restDuration,
    state.totalRounds
  );
  const totalLabel = formatMMSS(totalSec);
  return `
    <main class="card" aria-label="Tabata timer setup">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">Stage 1 — core timer</p>
        </div>
      </div>

      <div class="content">
        <div class="row">
          <label>
            Work
            <select id="workSelect" aria-label="Work duration">
              ${getDurationOptions().map(
                (o) =>
                  `<option value="${o.seconds}" ${
                    o.seconds === state.workDuration ? "selected" : ""
                  }>${o.label}</option>`
              ).join("")}
            </select>
          </label>

          <label>
            Rest
            <select id="restSelect" aria-label="Rest duration">
              ${getDurationOptions().map(
                (o) =>
                  `<option value="${o.seconds}" ${
                    o.seconds === state.restDuration ? "selected" : ""
                  }>${o.label}</option>`
              ).join("")}
            </select>
          </label>
        </div>

        <div class="field-gap" aria-hidden="true"></div>

        <label>
          Rounds
          <select id="roundsSelect" aria-label="Number of rounds">
            ${Array.from({ length: 20 }, (_, i) => i + 1)
              .map(
                (n) =>
                  `<option value="${n}" ${
                    n === state.totalRounds ? "selected" : ""
                  }>${n}</option>`
              )
              .join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startBtn" aria-label="Start workout, total time ${totalLabel}" type="button">Start · ${totalLabel}</button>
        </div>
      </div>
    </main>
  `;
}

function renderRunOrDone() {
  const isDone = state.status === STATUS.done;
  const isCountdown = state.currentPhase === PHASE.countdown;
  const isWork = state.currentPhase === PHASE.work;
  const themeClass = isDone
    ? "doneTheme"
    : isCountdown
      ? "countdownTheme"
      : isWork
        ? "workTheme"
        : "restTheme";
  const label = isDone ? "DONE" : phaseLabel(state.currentPhase);

  const roundText = isDone
    ? `Completed ${state.totalRounds} round${state.totalRounds === 1 ? "" : "s"}`
    : isCountdown
      ? "Starting in…"
      : `Round ${state.currentRound} of ${state.totalRounds}`;

  const countdownText = isDone ? "00:00" : formatMMSS(state.timeRemaining);

  const pauseResumeText =
    state.status === STATUS.running ? "Pause" : "Resume";
  const showGoAgain = isDone;

  return `
    <main class="card" aria-label="Tabata timer running">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">${roundText}</p>
        </div>
        <div class="headerRight" aria-label="Audio controls">
          <button
            id="toggleVoiceBtn"
            class="iconBtn ${state.voiceEnabled ? "" : "isOff"}"
            type="button"
            aria-label="${state.voiceEnabled ? "Mute voice" : "Unmute voice"}"
            title="${state.voiceEnabled ? "Mute voice" : "Unmute voice"}"
          >
            ${state.voiceEnabled ? speakerOnIcon() : speakerOffIcon()}
          </button>
          <button
            id="toggleBeepsBtn"
            class="iconBtn ${state.beepsEnabled ? "" : "isOff"}"
            type="button"
            aria-label="${state.beepsEnabled ? "Mute beeps" : "Unmute beeps"}"
            title="${state.beepsEnabled ? "Mute beeps" : "Unmute beeps"}"
          >
            ${state.beepsEnabled ? bellOnIcon() : bellOffIcon()}
          </button>
        </div>
      </div>

      <div class="run">
        <section id="phaseBanner" class="phaseBanner ${themeClass}" aria-live="polite">
          <div class="phaseLabel">${label}</div>
          <div class="countdown" aria-label="Time remaining">${countdownText}</div>
          <div class="progressTrack" aria-hidden="true">
            <div class="progressFill"></div>
          </div>
        </section>

        <div class="actions">
          ${
            isDone
              ? ""
              : `<button id="pauseResumeBtn" class="primary">${pauseResumeText}</button>`
          }
          ${
            showGoAgain
              ? `<button id="goAgainBtn" class="primary">Go again</button>`
              : ""
          }
          <button id="resetBtn" class="danger">Reset</button>
        </div>
      </div>
    </main>
  `;
}

function wireEvents() {
  const startBtn = document.querySelector("#startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      ensureAudioUnlocked();
      ensureSpeechUnlocked();

      // Read current UI picks right at Start.
      const workSelect = document.querySelector("#workSelect");
      const restSelect = document.querySelector("#restSelect");
      const roundsSelect = document.querySelector("#roundsSelect");

      const workDuration = Number(workSelect?.value ?? state.workDuration);
      const restDuration = Number(restSelect?.value ?? state.restDuration);
      const totalRounds = Number(roundsSelect?.value ?? state.totalRounds);

      setConfigFromSetup({
        workDuration,
        restDuration,
        totalRounds,
      });

      startWorkout();
    });
  }

  const workSelect = document.querySelector("#workSelect");
  const restSelect = document.querySelector("#restSelect");
  const roundsSelect = document.querySelector("#roundsSelect");

  if (workSelect && restSelect && roundsSelect) {
    const onChange = () => {
      setConfigFromSetup({
        workDuration: Number(workSelect.value),
        restDuration: Number(restSelect.value),
        totalRounds: Number(roundsSelect.value),
      });
      render();
    };

    workSelect.addEventListener("change", onChange);
    restSelect.addEventListener("change", onChange);
    roundsSelect.addEventListener("change", onChange);
  }

  const pauseResumeBtn = document.querySelector("#pauseResumeBtn");
  if (pauseResumeBtn) {
    pauseResumeBtn.addEventListener("click", () => {
      if (state.status === STATUS.running) pause();
      else if (state.status === STATUS.paused) resume();
    });
  }

  const resetBtn = document.querySelector("#resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetToSetup();
    });
  }

  const toggleVoiceBtn = document.querySelector("#toggleVoiceBtn");
  if (toggleVoiceBtn) {
    toggleVoiceBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.voiceEnabled = !state.voiceEnabled;
      if (!state.voiceEnabled) cancelSpeech();
      render();
    });
  }

  const toggleBeepsBtn = document.querySelector("#toggleBeepsBtn");
  if (toggleBeepsBtn) {
    toggleBeepsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.beepsEnabled = !state.beepsEnabled;
      render();
    });
  }

  const goAgainBtn = document.querySelector("#goAgainBtn");
  if (goAgainBtn) {
    goAgainBtn.addEventListener("click", () => {
      // Re-run with the existing selected settings.
      startWorkout();
    });
  }

  const phaseBanner = document.querySelector("#phaseBanner");
  if (phaseBanner) {
    phaseBanner.addEventListener("click", () => {
      if (state.status === STATUS.done) return;
      skipPhase();
    });
  }
}

// Safety: stop timers if the tab is backgrounded or closed.
window.addEventListener("beforeunload", () => stopInterval());

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (state.status === STATUS.running) {
    requestWakeLockIfSupported();
  }
});

