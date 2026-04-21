export const PHASE_TYPE = {
  countdown: "countdown",
  work: "work",
  rest: "rest",
  done: "done",
};

export const INITIAL_COUNTDOWN_SECONDS = 10;

export function buildTabataPhases({ workDuration, restDuration, totalRounds }) {
  const workSec = Math.max(1, Math.floor(Number(workDuration ?? 0)));
  const restSec = Math.max(1, Math.floor(Number(restDuration ?? 0)));
  const rounds = Math.max(1, Math.floor(Number(totalRounds ?? 1)));

  const phases = [
    { type: PHASE_TYPE.countdown, duration: INITIAL_COUNTDOWN_SECONDS, label: "Get Ready" },
  ];

  for (let round = 1; round <= rounds; round += 1) {
    phases.push({
      type: PHASE_TYPE.work,
      duration: workSec,
      label: `Round ${round} Work`,
      round,
      totalRounds: rounds,
    });
    if (round < rounds) {
      phases.push({
        type: PHASE_TYPE.rest,
        duration: restSec,
        label: `Round ${round} Rest`,
        round,
        totalRounds: rounds,
      });
    }
  }

  phases.push({ type: PHASE_TYPE.done });
  return phases;
}

export function buildEmomPhases({ intervalDuration, totalRounds }) {
  const intervalSec = Math.max(1, Math.floor(Number(intervalDuration ?? 0)));
  const rounds = Math.max(1, Math.floor(Number(totalRounds ?? 1)));

  const phases = [
    { type: PHASE_TYPE.countdown, duration: INITIAL_COUNTDOWN_SECONDS, label: "Get Ready" },
  ];

  for (let round = 1; round <= rounds; round += 1) {
    phases.push({
      type: PHASE_TYPE.work,
      duration: intervalSec,
      label: `Round ${round}`,
      round,
      totalRounds: rounds,
    });
  }

  phases.push({ type: PHASE_TYPE.done });
  return phases;
}

export function buildAmrapPhases({ workDuration }) {
  const workSec = Math.max(1, Math.floor(Number(workDuration ?? 0)));
  return [
    { type: PHASE_TYPE.countdown, duration: INITIAL_COUNTDOWN_SECONDS, label: "Get Ready" },
    {
      type: PHASE_TYPE.work,
      duration: workSec,
      label: "AMRAP",
      midPhaseCues: [
        { atPercentElapsed: 50, audio: "halfway" },
        { atSecondsRemaining: 60, audio: "oneMinuteLeft" },
      ],
    },
    { type: PHASE_TYPE.done },
  ];
}

export function totalTabataSeconds({ workDuration, restDuration, totalRounds }) {
  const workSec = Math.max(1, Math.floor(Number(workDuration ?? 0)));
  const restSec = Math.max(1, Math.floor(Number(restDuration ?? 0)));
  const rounds = Math.max(1, Math.floor(Number(totalRounds ?? 1)));
  return INITIAL_COUNTDOWN_SECONDS + rounds * workSec + (rounds - 1) * restSec;
}

export function totalEmomSeconds({ intervalDuration, totalRounds }) {
  const intervalSec = Math.max(1, Math.floor(Number(intervalDuration ?? 0)));
  const rounds = Math.max(1, Math.floor(Number(totalRounds ?? 1)));
  return INITIAL_COUNTDOWN_SECONDS + rounds * intervalSec;
}

export function totalAmrapSeconds({ workDuration }) {
  const workSec = Math.max(1, Math.floor(Number(workDuration ?? 0)));
  return INITIAL_COUNTDOWN_SECONDS + workSec;
}

