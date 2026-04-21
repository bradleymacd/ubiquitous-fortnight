import { cancelSpeech, speak } from "./voice.js";
import {
  playCountdownBeep,
  playRestStart,
  playWorkStart,
  playWorkoutComplete,
} from "./audio.js";
import {
  releaseWakeLock,
  requestWakeLockIfSupported,
} from "./wakeLock.js";

/**
 * Shared phase engine.
 *
 * A phase is:
 * { type: "countdown"|"work"|"rest"|"done", duration?: number, label?: string, round?: number, totalRounds?: number }
 */
export function createPhaseEngine({ onChange, onProgress } = {}) {
  const engine = {
    phases: [],
    phaseIndex: 0,
    timeRemaining: 0,
    status: "idle", // "idle" | "running" | "paused" | "done"
    voiceEnabled: true,
    beepsEnabled: true,
    phaseEndsAtMs: null,
    phaseDurationMs: null,
    pausedPhaseRemainingMs: null,
  };

  let intervalId = null;
  let rafId = null;
  let lastCountdownBeepAt = null; // `${phaseIndex}:${seconds}`
  let firedMidPhaseCueKeys = null; // Set<string> (per phase)

  function notify() {
    try {
      onChange?.(getState());
    } catch {
      // ignore render errors; caller should surface them
    }
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
      if (engine.status !== "running") return;
      tick();
    }, 1000);
    startProgressLoop();
  }

  function startProgressLoop() {
    if (rafId != null) return;

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (engine.status !== "running") return;
      try {
        onProgress?.(computeProgressNow(), getState());
      } catch {
        // ignore
      }
    };

    rafId = requestAnimationFrame(loop);
  }

  function stopProgressLoop() {
    if (rafId == null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function setStatus(nextStatus) {
    engine.status = nextStatus;
    if (engine.status === "running") {
      startInterval();
      requestWakeLockIfSupported();
    } else {
      stopInterval();
      stopProgressLoop();
      releaseWakeLock();
    }
    notify();
  }

  function getCurrentPhase() {
    return engine.phases[engine.phaseIndex] ?? { type: "done" };
  }

  function getNextPhase() {
    return engine.phases[engine.phaseIndex + 1] ?? null;
  }

  function cueId(cue) {
    // Stable-ish key for "same cue" within a phase.
    if (cue && typeof cue === "object") {
      if ("atSecondsRemaining" in cue) return `r:${Number(cue.atSecondsRemaining)}:${String(cue.audio ?? "")}`;
      if ("atPercentElapsed" in cue) return `p:${Number(cue.atPercentElapsed)}:${String(cue.audio ?? "")}`;
    }
    return JSON.stringify(cue);
  }

  function calloutTextForAudioKey(key) {
    if (!key) return "";
    if (key === "halfway") return "Halfway";
    if (key === "oneMinuteLeft") return "One minute left";
    return "";
  }

  function maybeFireMidPhaseCues() {
    if (engine.status !== "running" && engine.status !== "paused" && engine.status !== "idle") return;
    const phase = getCurrentPhase();
    const cues = Array.isArray(phase?.midPhaseCues) ? phase.midPhaseCues : [];
    if (cues.length === 0) return;

    if (!firedMidPhaseCueKeys) firedMidPhaseCueKeys = new Set();

    const durationSeconds = Number(phase?.duration ?? 0);
    const elapsedSeconds = Math.max(0, durationSeconds - Number(engine.timeRemaining ?? 0));
    const percentElapsed =
      durationSeconds > 0 ? (elapsedSeconds / durationSeconds) * 100 : 0;

    for (const cue of cues) {
      if (!cue || typeof cue !== "object") continue;
      const id = cueId(cue);
      if (firedMidPhaseCueKeys.has(id)) continue;

      const hasSeconds = Object.prototype.hasOwnProperty.call(cue, "atSecondsRemaining");
      const hasPercent = Object.prototype.hasOwnProperty.call(cue, "atPercentElapsed");
      const triggerSeconds = hasSeconds ? Number(cue.atSecondsRemaining) : null;
      const triggerPercent = hasPercent ? Number(cue.atPercentElapsed) : null;

      let shouldFire = false;
      if (hasSeconds && Number.isFinite(triggerSeconds)) {
        shouldFire = Number(engine.timeRemaining) === triggerSeconds;
      } else if (hasPercent && Number.isFinite(triggerPercent)) {
        shouldFire = percentElapsed >= triggerPercent;
      } else {
        continue;
      }

      if (!shouldFire) continue;
      firedMidPhaseCueKeys.add(id);

      const text = calloutTextForAudioKey(String(cue.audio ?? ""));
      if (engine.voiceEnabled && text) speak(text);
    }
  }

  function enterPhase(phaseIndex, { viaSkip } = {}) {
    engine.phaseIndex = phaseIndex;
    const phase = getCurrentPhase();

    lastCountdownBeepAt = null;
    firedMidPhaseCueKeys = null;

    if (phase.type === "done") {
      engine.timeRemaining = 0;
      engine.phaseEndsAtMs = null;
      engine.phaseDurationMs = null;
      engine.pausedPhaseRemainingMs = null;
      cancelSpeech();
      if (engine.voiceEnabled) speak("Done, nice job!");
      setStatus("done");
      return;
    }

    const durationSeconds = Number(phase.duration ?? 0);
    engine.timeRemaining = durationSeconds;
    engine.phaseDurationMs = durationSeconds * 1000;
    engine.phaseEndsAtMs = Date.now() + engine.phaseDurationMs;
    engine.pausedPhaseRemainingMs = null;

    // Entry sounds.
    if (phase.type === "work") {
      if (engine.beepsEnabled) playWorkStart();
      // Round announcements happen when work actually starts (after the prior phase's beeps).
      if (engine.voiceEnabled) speak(roundCalloutForPhase(phase));
    } else if (phase.type === "rest") {
      if (engine.beepsEnabled) playRestStart();
      if (engine.voiceEnabled) speak("Rest");
    }

    // Mid-phase cues may fire immediately on entry (e.g. 60s remaining at start).
    maybeFireMidPhaseCues();
    notify();
  }

  function roundCalloutForPhase(phase) {
    const round = Number(phase.round ?? 0);
    const totalRounds = Number(phase.totalRounds ?? 0);
    if (round && totalRounds && round === totalRounds) return "Last Round";
    if (round) return `Round ${round}`;
    return "Round one";
  }

  function maybePlayCountdownBeepsCrossing(prevShown, nowShown) {
    if (engine.status !== "running") return;

    const next = getNextPhase();
    const nextType = next?.type ?? null;
    const shouldCountDownToNext =
      nextType === "work" ||
      nextType === "rest" ||
      nextType === "countdown" ||
      nextType === "done";
    if (!shouldCountDownToNext) return;

    for (const s of [3, 2, 1]) {
      const crossed = prevShown > s && nowShown <= s;
      const at = nowShown === s;
      if (!crossed && !at) continue;

      const key = `${engine.phaseIndex}:${s}`;
      if (lastCountdownBeepAt === key) continue;
      lastCountdownBeepAt = key;
      if (engine.beepsEnabled) playCountdownBeep();
    }
  }

  function advanceToNextPhase({ viaSkip }) {
    const current = getCurrentPhase();
    const nextIndex = engine.phaseIndex + 1;
    const next = engine.phases[nextIndex] ?? { type: "done" };

    // Transitioning into done plays the workout-complete sound once.
    if (next.type === "done") {
      if (engine.beepsEnabled) playWorkoutComplete();
    }

    // Entering phase triggers entry audio.
    enterPhase(nextIndex, { viaSkip });

    // If we entered done, ensure running stops.
    if (current.type !== "done" && next.type === "done") {
      // Optionally say something, but keep engine generic.
    }
  }

  function tick() {
    const prevShown = engine.timeRemaining;

    if (engine.phaseEndsAtMs != null) {
      const remainingMs = Math.max(0, engine.phaseEndsAtMs - Date.now());
      const durationMs = engine.phaseDurationMs ?? null;
      const boundaryBump =
        remainingMs > 0 &&
        remainingMs % 1000 === 0 &&
        durationMs != null &&
        remainingMs !== durationMs;
      const remainingSeconds = Math.ceil(remainingMs / 1000) + (boundaryBump ? 1 : 0);
      engine.timeRemaining = remainingSeconds;
    }

    maybePlayCountdownBeepsCrossing(prevShown, engine.timeRemaining);
    maybeFireMidPhaseCues();

    if (engine.timeRemaining > 0) {
      notify();
      return;
    }

    engine.timeRemaining = 0;
    advanceToNextPhase({ viaSkip: false });
  }

  function computeProgressNow() {
    if (engine.status !== "running") return 0;
    if (!engine.phaseEndsAtMs || !engine.phaseDurationMs) return 0;
    const now = Date.now();
    const elapsed = engine.phaseDurationMs - Math.max(0, engine.phaseEndsAtMs - now);
    const p = elapsed / engine.phaseDurationMs;
    return Math.max(0, Math.min(1, p));
  }

  function start(phases, { voiceEnabled = true, beepsEnabled = true } = {}) {
    engine.phases = Array.isArray(phases) ? phases : [];
    engine.voiceEnabled = !!voiceEnabled;
    engine.beepsEnabled = !!beepsEnabled;
    engine.phaseIndex = 0;
    // Set status first so the initial enterPhase() notify can't be interpreted as "done".
    setStatus("running");
    enterPhase(0, { viaSkip: false });
  }

  function pause() {
    if (engine.status !== "running") return;
    cancelSpeech();
    if (engine.phaseEndsAtMs != null) {
      engine.pausedPhaseRemainingMs = Math.max(0, engine.phaseEndsAtMs - Date.now());
    }
    setStatus("paused");
  }

  function resume() {
    if (engine.status !== "paused") return;
    if (engine.pausedPhaseRemainingMs != null) {
      engine.phaseEndsAtMs = Date.now() + engine.pausedPhaseRemainingMs;
      engine.pausedPhaseRemainingMs = null;
    }
    setStatus("running");
  }

  function reset() {
    cancelSpeech();
    stopInterval();
    stopProgressLoop();
    releaseWakeLock();

    engine.phases = [];
    engine.phaseIndex = 0;
    engine.timeRemaining = 0;
    engine.phaseEndsAtMs = null;
    engine.phaseDurationMs = null;
    engine.pausedPhaseRemainingMs = null;
    lastCountdownBeepAt = null;
    // no voice scheduling state to reset
    setStatus("idle");
  }

  function skip() {
    if (engine.status !== "running" && engine.status !== "paused") return;
    advanceToNextPhase({ viaSkip: true });
  }

  function getState() {
    const currentPhase = getCurrentPhase();
    return {
      status: engine.status,
      phases: engine.phases,
      phaseIndex: engine.phaseIndex,
      currentPhase,
      nextPhase: getNextPhase(),
      timeRemaining: engine.timeRemaining,
      progress: computeProgressNow(),
      voiceEnabled: engine.voiceEnabled,
      beepsEnabled: engine.beepsEnabled,
    };
  }

  function setAudioToggles({ voiceEnabled, beepsEnabled }) {
    if (typeof voiceEnabled === "boolean") engine.voiceEnabled = voiceEnabled;
    if (typeof beepsEnabled === "boolean") engine.beepsEnabled = beepsEnabled;
    if (!engine.voiceEnabled) cancelSpeech();
    notify();
  }

  function onVisibilityChange() {
    if (document.visibilityState !== "visible") return;
    if (engine.status === "running") {
      requestWakeLockIfSupported();
    }
  }

  window.addEventListener("beforeunload", () => stopInterval());
  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    start,
    pause,
    resume,
    reset,
    skip,
    getState,
    setAudioToggles,
  };
}

