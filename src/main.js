import "./style.css";

const appEl = document.querySelector("#app");

const PHASE = {
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
};

let intervalId = null;

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
}

function setStatus(nextStatus) {
  state.status = nextStatus;
  state.isRunning = nextStatus === STATUS.running;

  if (state.isRunning) startInterval();
  else stopInterval();

  render();
}

function startWorkout() {
  state.currentRound = 1;
  state.currentPhase = PHASE.work;
  state.timeRemaining = state.workDuration;
  setStatus(STATUS.running);
}

function pause() {
  if (state.status !== STATUS.running) return;
  setStatus(STATUS.paused);
}

function resume() {
  if (state.status !== STATUS.paused) return;
  setStatus(STATUS.running);
}

function resetToSetup() {
  stopInterval();

  state.status = STATUS.setup;
  state.isRunning = false;

  // Preserve the user's selected settings; reset runtime fields.
  state.currentRound = 1;
  state.currentPhase = PHASE.work;
  state.timeRemaining = state.workDuration;

  render();
}

function done() {
  setStatus(STATUS.done);
  state.timeRemaining = 0;
  render();
}

function tick() {
  if (state.timeRemaining > 0) {
    state.timeRemaining -= 1;
  }

  if (state.timeRemaining > 0) {
    render();
    return;
  }

  state.timeRemaining = 0;

  // Transition immediately when hitting 0.
  if (state.currentPhase === PHASE.work) {
    state.currentPhase = PHASE.rest;
    state.timeRemaining = state.restDuration;
    render();
    return;
  }

  // Rest ended.
  if (state.currentRound >= state.totalRounds) {
    done();
    return;
  }

  state.currentRound += 1;
  state.currentPhase = PHASE.work;
  state.timeRemaining = state.workDuration;
  render();
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
  const isWork = state.currentPhase === PHASE.work;
  const themeClass = isDone ? "doneTheme" : isWork ? "workTheme" : "restTheme";
  const label = isDone ? "DONE" : phaseLabel(state.currentPhase);

  const roundText = isDone
    ? `Completed ${state.totalRounds} round${state.totalRounds === 1 ? "" : "s"}`
    : `Round ${state.currentRound} of ${state.totalRounds}`;

  const countdownText = isDone ? "00:00" : formatMMSS(state.timeRemaining);

  const pauseResumeText =
    state.status === STATUS.running ? "Pause" : "Resume";

  const pauseResumeDisabled = isDone;

  return `
    <main class="card" aria-label="Tabata timer running">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">${roundText}</p>
        </div>
      </div>

      <div class="run">
        <section class="phaseBanner ${themeClass}" aria-live="polite">
          <div class="phaseLabel">${label}</div>
          <div class="countdown" aria-label="Time remaining">${countdownText}</div>
          <div class="meta">
            <span>${isDone ? "Workout complete" : (isWork ? "Work phase" : "Rest phase")}</span>
            <span>${isDone ? "" : (state.status === STATUS.paused ? "Paused" : "Running")}</span>
          </div>
        </section>

        <div class="actions">
          <button id="pauseResumeBtn" class="primary" ${
            pauseResumeDisabled ? "disabled" : ""
          } ${pauseResumeDisabled ? "disabled" : ""}>${pauseResumeText}</button>
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
}

// Safety: stop timers if the tab is backgrounded or closed.
window.addEventListener("beforeunload", () => stopInterval());

