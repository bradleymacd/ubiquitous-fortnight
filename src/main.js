import "./style.css";
import { ensureAudioUnlocked } from "./audio.js";
import { ensureSpeechUnlocked, speak } from "./voice.js";
import { createPhaseEngine } from "./phaseEngine.js";
import {
  buildAmrapPhases,
  buildEmomPhases,
  buildTabataPhases,
  totalAmrapSeconds,
  totalEmomSeconds,
  totalTabataSeconds,
} from "./phases.js";

function getAppRoot() {
  return document.getElementById("app");
}

const VIEW = {
  home: "home",
  tabataSetup: "tabata-setup",
  emomSetup: "emom-setup",
  amrapSetup: "amrap-setup",
  running: "running",
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

let durationOptionsCache = null;
function getDurationOptions() {
  if (!durationOptionsCache) {
    durationOptionsCache = buildDurationOptions();
  }
  return durationOptionsCache;
}

function buildAmrapDurationOptions() {
  const opts = [];
  // 0:15 → 5:00 in 15s steps (20 options)
  for (let seconds = 15; seconds <= 300; seconds += 15) {
    opts.push({ seconds, label: formatMMSS(seconds) });
  }
  // 6:00 → 30:00 in 1m steps (25 options)
  for (let seconds = 360; seconds <= 1800; seconds += 60) {
    opts.push({ seconds, label: formatMMSS(seconds) });
  }
  return opts;
}

let amrapDurationOptionsCache = null;
function getAmrapDurationOptions() {
  if (!amrapDurationOptionsCache) {
    amrapDurationOptionsCache = buildAmrapDurationOptions();
  }
  return amrapDurationOptionsCache;
}

const state = {
  view: VIEW.home,
  activeFormat: null, // "tabata" | "emom" | "amrap" | null
  showCancelConfirm: false,

  // Tabata config
  tabataWorkDuration: 20,
  tabataRestDuration: 10,
  tabataTotalRounds: 8,

  // EMOM config
  emomIntervalDuration: 60,
  emomTotalRounds: 10,

  // AMRAP config
  amrapWorkDuration: 600,

  // Audio toggles (no persistence by design)
  voiceEnabled: true,
  beepsEnabled: true,
  voiceAvailable: true, // set on Start; false if speechSynthesis unavailable/blocked
  lastWorkout: null, // { format: "tabata"|"emom"|"amrap", phases: Phase[] }
};

const engine = createPhaseEngine({
  onChange: (s) => {
    if (s?.status === "done") state.view = VIEW.done;
    render();
  },
  onProgress: (p) => {
    const banner = document.querySelector("#phaseBanner");
    if (!banner) return;
    banner.style.setProperty("--p", String(p ?? 0));
  },
});

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

function backIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M15.5 5.5a1 1 0 0 1 0 1.4L10.4 12l5.1 5.1a1 1 0 1 1-1.4 1.4l-5.8-5.8a1 1 0 0 1 0-1.4l5.8-5.8a1 1 0 0 1 1.4 0Z"/>
    </svg>
  `;
}

function closeIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M18.3 5.7a1 1 0 0 1 0 1.4L13.4 12l4.9 4.9a1 1 0 1 1-1.4 1.4L12 13.4l-4.9 4.9a1 1 0 1 1-1.4-1.4l4.9-4.9L5.7 7.1a1 1 0 0 1 1.4-1.4l4.9 4.9l4.9-4.9a1 1 0 0 1 1.4 0Z"/>
    </svg>
  `;
}

function playIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M8.8 5.9c0-1.2 1.3-1.9 2.3-1.3l9.3 5.6c1 .6 1 2.1 0 2.7l-9.3 5.6c-1 .6-2.3-.1-2.3-1.3V5.9Z"/>
    </svg>
  `;
}

function pauseIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 6.5A1.5 1.5 0 0 1 8.5 5H10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 10 19H8.5A1.5 1.5 0 0 1 7 17.5v-11Zm5.5 0A1.5 1.5 0 0 1 14 5h1.5A1.5 1.5 0 0 1 17 6.5v11A1.5 1.5 0 0 1 15.5 19H14a1.5 1.5 0 0 1-1.5-1.5v-11Z"/>
    </svg>
  `;
}

function goHome() {
  engine.reset();
  state.view = VIEW.home;
  state.activeFormat = null;
  state.showCancelConfirm = false;
  render();
}

function goToTabataSetup() {
  engine.reset();
  state.view = VIEW.tabataSetup;
  state.activeFormat = "tabata";
  state.showCancelConfirm = false;
  render();
}

function goToEmomSetup() {
  engine.reset();
  state.view = VIEW.emomSetup;
  state.activeFormat = "emom";
  state.showCancelConfirm = false;
  render();
}

function goToAmrapSetup() {
  engine.reset();
  state.view = VIEW.amrapSetup;
  state.activeFormat = "amrap";
  state.showCancelConfirm = false;
  render();
}

function goBackToActiveSetup() {
  engine.reset();
  if (state.activeFormat === "tabata") state.view = VIEW.tabataSetup;
  else if (state.activeFormat === "emom") state.view = VIEW.emomSetup;
  else if (state.activeFormat === "amrap") state.view = VIEW.amrapSetup;
  else state.view = VIEW.home;
  state.showCancelConfirm = false;
  render();
}

function startTabataFromUI() {
  ensureAudioUnlocked();
  state.voiceAvailable = ensureSpeechUnlocked();
  state.showCancelConfirm = false;

  const workSelect = document.querySelector("#workSelect");
  const restSelect = document.querySelector("#restSelect");
  const roundsSelect = document.querySelector("#roundsSelect");

  state.tabataWorkDuration = Number(workSelect?.value ?? state.tabataWorkDuration);
  state.tabataRestDuration = Number(restSelect?.value ?? state.tabataRestDuration);
  state.tabataTotalRounds = Number(roundsSelect?.value ?? state.tabataTotalRounds);

  const phases = buildTabataPhases({
    workDuration: state.tabataWorkDuration,
    restDuration: state.tabataRestDuration,
    totalRounds: state.tabataTotalRounds,
  });

  state.lastWorkout = { format: "tabata", phases };
  state.activeFormat = "tabata";
  state.view = VIEW.running;
  engine.start(phases, {
    voiceEnabled: state.voiceEnabled && state.voiceAvailable,
    beepsEnabled: state.beepsEnabled,
  });
  render();
}

function startEmomFromUI() {
  ensureAudioUnlocked();
  state.voiceAvailable = ensureSpeechUnlocked();
  state.showCancelConfirm = false;

  const intervalSelect = document.querySelector("#intervalSelect");
  const roundsSelect = document.querySelector("#emomRoundsSelect");

  state.emomIntervalDuration = Number(
    intervalSelect?.value ?? state.emomIntervalDuration
  );
  state.emomTotalRounds = Number(roundsSelect?.value ?? state.emomTotalRounds);

  const phases = buildEmomPhases({
    intervalDuration: state.emomIntervalDuration,
    totalRounds: state.emomTotalRounds,
  });

  state.lastWorkout = { format: "emom", phases };
  state.activeFormat = "emom";
  state.view = VIEW.running;
  engine.start(phases, {
    voiceEnabled: state.voiceEnabled && state.voiceAvailable,
    beepsEnabled: state.beepsEnabled,
  });
  render();
}

function updateTabataStartLabelFromInputs() {
  const workSelect = document.querySelector("#workSelect");
  const restSelect = document.querySelector("#restSelect");
  const roundsSelect = document.querySelector("#roundsSelect");

  const workDuration = Number(workSelect?.value ?? state.tabataWorkDuration);
  const restDuration = Number(restSelect?.value ?? state.tabataRestDuration);
  const totalRounds = Number(roundsSelect?.value ?? state.tabataTotalRounds);

  const totalSec = totalTabataSeconds({ workDuration, restDuration, totalRounds });
  const totalLabel = formatMMSS(totalSec);

  const startBtn = document.querySelector("#startTabataBtn");
  if (startBtn) {
    startBtn.textContent = `Start · ${totalLabel}`;
    startBtn.setAttribute("aria-label", `Start workout, total time ${totalLabel}`);
  }
}

function updateEmomStartLabelFromInputs() {
  const intervalSelect = document.querySelector("#intervalSelect");
  const roundsSelect = document.querySelector("#emomRoundsSelect");

  const intervalDuration = Number(intervalSelect?.value ?? state.emomIntervalDuration);
  const totalRounds = Number(roundsSelect?.value ?? state.emomTotalRounds);

  const totalSec = totalEmomSeconds({ intervalDuration, totalRounds });
  const totalLabel = formatMMSS(totalSec);

  const startBtn = document.querySelector("#startEmomBtn");
  if (startBtn) {
    startBtn.textContent = `Start · ${totalLabel}`;
    startBtn.setAttribute("aria-label", `Start workout, total time ${totalLabel}`);
  }
}

function updateAmrapStartLabelFromInputs() {
  const durationSelect = document.querySelector("#amrapDurationSelect");
  const workDuration = Number(durationSelect?.value ?? state.amrapWorkDuration);

  const totalSec = totalAmrapSeconds({ workDuration });
  const totalLabel = formatMMSS(totalSec);

  const startBtn = document.querySelector("#startAmrapBtn");
  if (startBtn) {
    startBtn.textContent = `Start · ${totalLabel}`;
    startBtn.setAttribute("aria-label", `Start workout, total time ${totalLabel}`);
  }
}

function startAmrapFromUI() {
  ensureAudioUnlocked();
  state.voiceAvailable = ensureSpeechUnlocked();
  state.showCancelConfirm = false;

  const durationSelect = document.querySelector("#amrapDurationSelect");
  state.amrapWorkDuration = Number(durationSelect?.value ?? state.amrapWorkDuration);

  const phases = buildAmrapPhases({ workDuration: state.amrapWorkDuration });

  state.lastWorkout = { format: "amrap", phases };
  state.activeFormat = "amrap";
  state.view = VIEW.running;
  engine.start(phases, {
    voiceEnabled: state.voiceEnabled && state.voiceAvailable,
    beepsEnabled: state.beepsEnabled,
  });
  render();
}

function render() {
  const root = getAppRoot();
  if (!root) return;

  const view =
    state.view === VIEW.home
      ? renderHome()
      : state.view === VIEW.tabataSetup
        ? renderTabataSetup()
        : state.view === VIEW.emomSetup
          ? renderEmomSetup()
          : state.view === VIEW.amrapSetup
            ? renderAmrapSetup()
          : renderRunOrDone();

  root.innerHTML = view;
  wireEvents();
}

function renderHome() {
  return `
    <main class="card" aria-label="Choose timer format">
      <div class="header">
        <div class="headerMain">
          <h1 class="title title--display">Workout Timers</h1>
          <p class="subtitle">Choose a format</p>
        </div>
      </div>

      <div class="content">
        <div class="menuList" role="list">
          <button id="pickTabataBtn" class="primary" type="button" aria-label="Tabata timer">
            Tabata
          </button>
          <button id="pickEmomBtn" class="primary" type="button" aria-label="EMOM timer">
            EMOM
          </button>
          <button id="pickAmrapBtn" class="primary" type="button" aria-label="AMRAP timer">
            AMRAP
          </button>
        </div>
      </div>
    </main>
  `;
}

function renderTabataSetup() {
  const totalSec = totalTabataSeconds({
    workDuration: state.tabataWorkDuration,
    restDuration: state.tabataRestDuration,
    totalRounds: state.tabataTotalRounds,
  });
  const totalLabel = formatMMSS(totalSec);
  return `
    <main class="card" aria-label="Tabata timer setup">
      <div class="header">
        <div class="headerLeft" aria-label="Navigation">
          <button
            id="navBackBtn"
            class="iconBtn"
            type="button"
            aria-label="Back"
            title="Back"
          >
            ${backIcon()}
          </button>
        </div>
        <div class="headerMain">
          <h1 class="title title--display">Tabata Timer</h1>
          <p class="subtitle">Work and rest intervals</p>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </div>

      <div class="content">
        <div class="row">
          <label>
            Work
            <select id="workSelect" aria-label="Work duration">
              ${getDurationOptions().map(
                (o) =>
                  `<option value="${o.seconds}" ${
                    o.seconds === state.tabataWorkDuration ? "selected" : ""
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
                    o.seconds === state.tabataRestDuration ? "selected" : ""
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
                    n === state.tabataTotalRounds ? "selected" : ""
                  }>${n}</option>`
              )
              .join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startTabataBtn" aria-label="Start workout, total time ${totalLabel}" type="button">Start · ${totalLabel}</button>
        </div>
      </div>
    </main>
  `;
}

function renderEmomSetup() {
  const totalSec = totalEmomSeconds({
    intervalDuration: state.emomIntervalDuration,
    totalRounds: state.emomTotalRounds,
  });
  const totalLabel = formatMMSS(totalSec);

  return `
    <main class="card" aria-label="EMOM timer setup">
      <div class="header">
        <div class="headerLeft" aria-label="Navigation">
          <button
            id="navBackBtn"
            class="iconBtn"
            type="button"
            aria-label="Back"
            title="Back"
          >
            ${backIcon()}
          </button>
        </div>
        <div class="headerMain">
          <h1 class="title title--display">EMOM</h1>
          <p class="subtitle">Equal-length rounds back-to-back</p>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </div>

      <div class="content">
        <div class="row">
          <label>
            Interval
            <select id="intervalSelect" aria-label="Interval duration">
              ${getDurationOptions().map(
                (o) =>
                  `<option value="${o.seconds}" ${
                    o.seconds === state.emomIntervalDuration ? "selected" : ""
                  }>${o.label}</option>`
              ).join("")}
            </select>
          </label>

          <label>
            Rounds
            <select id="emomRoundsSelect" aria-label="Number of rounds">
              ${Array.from({ length: 20 }, (_, i) => i + 1)
                .map(
                  (n) =>
                    `<option value="${n}" ${
                      n === state.emomTotalRounds ? "selected" : ""
                    }>${n}</option>`
                )
                .join("")}
            </select>
          </label>
        </div>

        <div class="actions">
          <button class="primary" id="startEmomBtn" aria-label="Start workout, total time ${totalLabel}" type="button">Start · ${totalLabel}</button>
        </div>
      </div>
    </main>
  `;
}

function renderAmrapSetup() {
  const totalSec = totalAmrapSeconds({ workDuration: state.amrapWorkDuration });
  const totalLabel = formatMMSS(totalSec);

  return `
    <main class="card" aria-label="AMRAP timer setup">
      <div class="header">
        <div class="headerLeft" aria-label="Navigation">
          <button
            id="navBackBtn"
            class="iconBtn"
            type="button"
            aria-label="Back"
            title="Back"
          >
            ${backIcon()}
          </button>
        </div>
        <div class="headerMain">
          <h1 class="title title--display">AMRAP</h1>
          <p class="subtitle">As many rounds as possible</p>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </div>

      <div class="content">
        <label>
          Duration
          <select id="amrapDurationSelect" aria-label="AMRAP duration">
            ${getAmrapDurationOptions()
              .map(
                (o) =>
                  `<option value="${o.seconds}" ${
                    o.seconds === state.amrapWorkDuration ? "selected" : ""
                  }>${o.label}</option>`
              )
              .join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startAmrapBtn" aria-label="Start workout, total time ${totalLabel}" type="button">Start · ${totalLabel}</button>
        </div>
      </div>
    </main>
  `;
}

function renderRunOrDone() {
  const eng = engine.getState();
  const isDone = state.view === VIEW.done || eng.status === "done";
  const isActive = eng.status === "running" || eng.status === "paused";
  const formatTitle =
    state.activeFormat === "tabata"
      ? "Tabata"
      : state.activeFormat === "emom"
        ? "EMOM"
        : state.activeFormat === "amrap"
          ? "AMRAP"
          : "WOD Timer";
  const phaseType = eng.currentPhase?.type ?? "done";
  const isCountdown = phaseType === "countdown";
  const isWork = phaseType === "work";
  const themeClass = isDone
    ? "doneTheme"
    : isCountdown
      ? "countdownTheme"
      : isWork
        ? "workTheme"
        : "restTheme";
  const label = isDone ? "DONE" : String(eng.currentPhase?.label ?? "");

  const round = Number(eng.currentPhase?.round ?? 0);
  const totalRounds = Number(eng.currentPhase?.totalRounds ?? 0);

  const roundText = isDone
    ? state.lastWorkout
      ? completedRoundsText(state.lastWorkout)
        ? `Completed ${completedRoundsText(state.lastWorkout)}`
        : "Workout complete"
      : "Workout complete"
    : round && totalRounds
      ? `Round ${round} of ${totalRounds}`
      : isCountdown
        ? "Starting in…"
        : "";

  const countdownText = isDone ? "00:00" : formatMMSS(eng.timeRemaining);

  const pauseResumeLabel = eng.status === "running" ? "Pause" : "Resume";
  const showGoAgain = isDone && !!state.lastWorkout?.phases?.length;
  // Voice status is available via the toggle button; keep header uncluttered.

  return `
    <main class="card" aria-label="Timer running">
      <div class="header">
        ${
          state.activeFormat
            ? `<div class="headerLeft" aria-label="Navigation">
                <button
                  id="navBackBtn"
                  class="iconBtn iconBtn--danger"
                  type="button"
                  aria-label="Cancel timer"
                  title="Cancel timer"
                >
                  ${closeIcon()}
                </button>
              </div>`
            : `<div class="headerLeft" aria-hidden="true"></div>`
        }
        <div class="headerMain">
          <h1 class="title title--display">${formatTitle}</h1>
          <p class="subtitle">${roundText}</p>
        </div>
        <div class="headerRight" aria-label="Controls">
          <button
            id="toggleVoiceBtn"
            class="iconBtn ${state.voiceEnabled ? "" : "isOff"}"
            type="button"
            ${state.voiceAvailable ? "" : "disabled"}
            aria-label="${
              state.voiceAvailable
                ? state.voiceEnabled
                  ? "Mute voice"
                  : "Unmute voice"
                : "Voice unavailable in this browser"
            }"
            title="${
              state.voiceAvailable
                ? state.voiceEnabled
                  ? "Mute voice"
                  : "Unmute voice"
                : "Voice unavailable in this browser"
            }"
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
        ${
          state.showCancelConfirm && isActive
            ? `<div class="modalOverlay" role="presentation">
                <div class="modal" role="dialog" aria-modal="true" aria-label="Cancel timer confirmation">
                  <div class="modalTitle">Cancel timer?</div>
                  <div class="modalBody subtitle">Are you sure you want to cancel and go back to setup?</div>
                  <div class="modalActions">
                    <button id="cancelConfirmNoBtn" type="button">Keep going</button>
                    <button id="cancelConfirmYesBtn" class="danger" type="button">Cancel timer</button>
                  </div>
                </div>
              </div>`
            : ""
        }
        <section id="phaseBanner" class="phaseBanner ${themeClass}" aria-live="polite">
          <div class="phaseLabel">${label}</div>
          <div class="countdown" aria-label="Time remaining">${countdownText}</div>
          <div class="progressTrack" aria-hidden="true">
            <div class="progressFill"></div>
          </div>
        </section>

        ${
          isDone
            ? ""
            : `<div class="actions actions--center">
                <button
                  id="pauseResumeBtn"
                  class="roundBtn roundBtn--xl"
                  type="button"
                  aria-label="${pauseResumeLabel}"
                  title="${pauseResumeLabel}"
                >
                  ${eng.status === "running" ? pauseIcon() : playIcon()}
                </button>
              </div>`
        }
        ${
          showGoAgain
            ? `<div class="actions">
                <button id="goAgainBtn" class="primary">Go again</button>
              </div>`
            : ""
        }
      </div>
    </main>
  `;
}

function completedRoundsText(lastWorkout) {
  const phases = Array.isArray(lastWorkout?.phases) ? lastWorkout.phases : [];
  const lastWork = [...phases].reverse().find((p) => p?.type === "work");
  const rounds = Number(lastWork?.totalRounds ?? 0) || 0;
  if (!rounds) return "";
  return `${rounds} round${rounds === 1 ? "" : "s"}`;
}

function wireEvents() {
  const pickTabataBtn = document.querySelector("#pickTabataBtn");
  if (pickTabataBtn) pickTabataBtn.addEventListener("click", goToTabataSetup);

  const pickEmomBtn = document.querySelector("#pickEmomBtn");
  if (pickEmomBtn) pickEmomBtn.addEventListener("click", goToEmomSetup);

  const pickAmrapBtn = document.querySelector("#pickAmrapBtn");
  if (pickAmrapBtn) pickAmrapBtn.addEventListener("click", goToAmrapSetup);

  const startTabataBtn = document.querySelector("#startTabataBtn");
  if (startTabataBtn) startTabataBtn.addEventListener("click", startTabataFromUI);

  const workSelect = document.querySelector("#workSelect");
  if (workSelect) {
    workSelect.addEventListener("change", (e) => {
      state.tabataWorkDuration = Number(e?.target?.value ?? state.tabataWorkDuration);
      updateTabataStartLabelFromInputs();
    });
  }
  const restSelect = document.querySelector("#restSelect");
  if (restSelect) {
    restSelect.addEventListener("change", (e) => {
      state.tabataRestDuration = Number(e?.target?.value ?? state.tabataRestDuration);
      updateTabataStartLabelFromInputs();
    });
  }
  const roundsSelect = document.querySelector("#roundsSelect");
  if (roundsSelect) {
    roundsSelect.addEventListener("change", (e) => {
      state.tabataTotalRounds = Number(e?.target?.value ?? state.tabataTotalRounds);
      updateTabataStartLabelFromInputs();
    });
  }

  const navBackBtn = document.querySelector("#navBackBtn");
  if (navBackBtn) {
    navBackBtn.addEventListener("click", () => {
      if (state.view === VIEW.running || state.view === VIEW.done) {
        const s = engine.getState();
        const isActiveTimer = s.status === "running" || s.status === "paused";
        if (isActiveTimer) {
          state.showCancelConfirm = true;
          render();
          return;
        }
        goBackToActiveSetup();
        return;
      }
      goHome();
    });
  }

  const cancelConfirmNoBtn = document.querySelector("#cancelConfirmNoBtn");
  if (cancelConfirmNoBtn) {
    cancelConfirmNoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.showCancelConfirm = false;
      render();
    });
  }

  const cancelConfirmYesBtn = document.querySelector("#cancelConfirmYesBtn");
  if (cancelConfirmYesBtn) {
    cancelConfirmYesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      goBackToActiveSetup();
    });
  }

  const startEmomBtn = document.querySelector("#startEmomBtn");
  if (startEmomBtn) startEmomBtn.addEventListener("click", startEmomFromUI);

  const intervalSelect = document.querySelector("#intervalSelect");
  if (intervalSelect) {
    intervalSelect.addEventListener("change", (e) => {
      state.emomIntervalDuration = Number(e?.target?.value ?? state.emomIntervalDuration);
      updateEmomStartLabelFromInputs();
    });
  }
  const emomRoundsSelect = document.querySelector("#emomRoundsSelect");
  if (emomRoundsSelect) {
    emomRoundsSelect.addEventListener("change", (e) => {
      state.emomTotalRounds = Number(e?.target?.value ?? state.emomTotalRounds);
      updateEmomStartLabelFromInputs();
    });
  }

  const amrapDurationSelect = document.querySelector("#amrapDurationSelect");
  if (amrapDurationSelect) {
    amrapDurationSelect.addEventListener("change", (e) => {
      state.amrapWorkDuration = Number(e?.target?.value ?? state.amrapWorkDuration);
      updateAmrapStartLabelFromInputs();
    });
  }

  // Ensure labels are correct on first render of setup screens.
  if (state.view === VIEW.tabataSetup) updateTabataStartLabelFromInputs();
  if (state.view === VIEW.emomSetup) updateEmomStartLabelFromInputs();
  if (state.view === VIEW.amrapSetup) updateAmrapStartLabelFromInputs();

  const startAmrapBtn = document.querySelector("#startAmrapBtn");
  if (startAmrapBtn) startAmrapBtn.addEventListener("click", startAmrapFromUI);

  const pauseResumeBtn = document.querySelector("#pauseResumeBtn");
  if (pauseResumeBtn) {
    pauseResumeBtn.addEventListener("click", () => {
      const s = engine.getState();
      if (s.status === "running") engine.pause();
      else if (s.status === "paused") engine.resume();
    });
  }

  const toggleVoiceBtn = document.querySelector("#toggleVoiceBtn");
  if (toggleVoiceBtn) {
    toggleVoiceBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.voiceEnabled = !state.voiceEnabled;
      engine.setAudioToggles({ voiceEnabled: state.voiceEnabled });
      render();
    });
  }

  const toggleBeepsBtn = document.querySelector("#toggleBeepsBtn");
  if (toggleBeepsBtn) {
    toggleBeepsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.beepsEnabled = !state.beepsEnabled;
      engine.setAudioToggles({ beepsEnabled: state.beepsEnabled });
      render();
    });
  }

  const goAgainBtn = document.querySelector("#goAgainBtn");
  if (goAgainBtn) {
    goAgainBtn.addEventListener("click", () => {
      ensureAudioUnlocked();
      ensureSpeechUnlocked();
      const phases = state.lastWorkout?.phases ?? null;
      if (!Array.isArray(phases) || phases.length === 0) return;
      state.view = VIEW.running;
      engine.start(phases, { voiceEnabled: state.voiceEnabled, beepsEnabled: state.beepsEnabled });
    });
  }

  const phaseBanner = document.querySelector("#phaseBanner");
  if (phaseBanner) {
    phaseBanner.addEventListener("click", () => {
      const s = engine.getState();
      if (s.status === "done" || state.view !== VIEW.running) return;
      engine.skip();
    });
  }

  // Keep the progress bar updated even when engine re-renders via onChange.
  const banner = document.querySelector("#phaseBanner");
  if (banner) {
    const p = engine.getState().progress ?? 0;
    banner.style.setProperty("--p", String(p));
  }
}