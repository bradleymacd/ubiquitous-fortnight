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

const appEl = document.querySelector("#app");

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

const DURATION_OPTIONS = buildDurationOptions(); // [{ seconds, label }]

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

render();

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

function formatMMSS(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(clamped / 60)).padStart(2, "0");
  const ss = String(clamped % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function phaseLabel(phase) {
  if (phase === PHASE.countdown) return "GET READY";
  return phase === PHASE.work ? "WORK" : "REST";
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
  playWorkoutComplete();
  done();
  speak("Done, nice job!");
}

function advanceToNextPhase({ viaSkip }) {
  const fromPhase = state.currentPhase;
  const fromRound = state.currentRound;

  // countdown -> work (round 1)
  if (state.currentPhase === PHASE.countdown) {
    state.currentRound = 1;
    enterPhase(PHASE.work, state.workDuration);
    // Work begins here (either naturally after countdown or via skip).
    if (viaSkip) speak("Round one");
    playWorkStart();
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
    playRestStart();
    speak("Rest");
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
    if (state.currentRound === state.totalRounds) speak("Last Round");
    else speak(`Round ${state.currentRound}`);
  }
  playWorkStart();
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
    speak("Round one");
    return;
  }

  // rest -> upcoming work (unless this is final rest, which goes to done)
  if (state.currentRound >= state.totalRounds) return;
  const nextRound = state.currentRound + 1;
  lastRoundCalloutAt = key;
  if (nextRound === state.totalRounds) speak("Last Round");
  else speak(`Round ${nextRound}`);
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
    playCountdownBeep();
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
  if (!appEl) return;

  const view =
    state.status === STATUS.setup ? renderSetup() : renderRunOrDone();

  appEl.innerHTML = view;
  wireEvents();
}

function renderSetup() {
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
              ${DURATION_OPTIONS.map(
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
              ${DURATION_OPTIONS.map(
                (o) =>
                  `<option value="${o.seconds}" ${
                    o.seconds === state.restDuration ? "selected" : ""
                  }>${o.label}</option>`
              ).join("")}
            </select>
          </label>
        </div>

        <div style="height: 12px;"></div>

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
          <button class="primary" id="startBtn">Start</button>
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

