# Stage 5 — AMRAP Format & Mid-Phase Audio Cues

## What we're building

Adding AMRAP as the third WOD format. AMRAP ("As Many Rounds As Possible") is the simplest format structurally — a single timed work phase. The user picks a duration, taps Start, the timer counts down, done.

This stage also introduces one small new engine capability: **mid-phase audio cues** — sounds that fire during a phase rather than at its boundaries. AMRAP is the first format that needs them (halfway and one-minute-left callouts), and the mechanism generalizes cleanly for future formats.

## What we already know

- **Stage 4 is done and deployed.** Home screen, shared phase engine, Tabata, and EMOM all work. New format plugs into the existing home screen picker.
- **AMRAP phase sequence is minimal:** `[countdown, work, done]`. One work phase, no rounds, no rest.
- **Duration picker is tiered:** 15-second increments from `0:15` to `5:00` (matching Tabata exactly in that range), then 1-minute increments from `6:00` to `30:00`. Total values: 20 (15s range) + 25 (minute range) = 45 values. Long but scrollable. Default: `10:00`.
- **No rounds picker.** AMRAP users count rounds themselves during the workout.
- **Mid-phase audio cues are a new engine capability.** Phases can optionally carry cues that fire at specific points during the phase.
- **Existing CSS is respected and extended.** Same rules as Stage 4 — use existing tokens, match existing class patterns, do not invent new systems.

## Essential for Stage 5

### AMRAP setup screen

- **Duration picker:** `<select>` with the tiered values described above (`0:15`, `0:30`, … `5:00`, `6:00`, `7:00`, … `30:00`). Default `10:00`.
- **Start button:** same styling as Tabata's and EMOM's.
- **Back-to-home navigation.**

Visually simpler than Tabata or EMOM since there's only one picker. Layout should feel intentional, not sparse — center the single picker, use the same spacing rhythm as the other setup screens rather than letting it float oddly on the page.

### AMRAP phase-sequence generator

Given `workDuration` (in seconds), produce:

```
[
  { type: "countdown", duration: 10, label: "Get Ready" },
  {
    type: "work",
    duration: workDuration,
    label: "AMRAP",
    midPhaseCues: [
      { atPercentElapsed: 50, audio: "halfway" },
      { atSecondsRemaining: 60, audio: "oneMinuteLeft" }
    ]
  },
  { type: "done" }
]
```

No round metadata — AMRAP doesn't have rounds in the engine's sense. The run screen should handle missing `round`/`totalRounds` gracefully (show just the label, no "Round X of Y" indicator).

### Mid-phase audio cues — new engine capability

A phase may optionally carry a `midPhaseCues` array. Each cue is an object with:

- Exactly one trigger field:
  - `atSecondsRemaining: <number>` — fires when `timeRemaining` equals this value
  - `atPercentElapsed: <number>` — fires when elapsed time is >= this percentage of `duration`
- An `audio` field identifying which sound to play (string key like `"halfway"` or `"oneMinuteLeft"`)

The engine, on each tick, checks the current phase's `midPhaseCues`:
- For `atSecondsRemaining` cues: fire when current `timeRemaining` equals the value.
- For `atPercentElapsed` cues: fire when `(elapsed / duration) * 100 >= value` and the cue hasn't already fired this phase.
- Track fired cues so they don't double-fire within a phase.
- Reset fired-cue tracking when entering a new phase.
- On pause/resume, mid-phase cues continue to fire at the appropriate points relative to the resumed timeline.
- On skip, any remaining mid-phase cues for the current phase are discarded (they don't fire later).

**Edge cases worth being explicit about:**

- If `duration` is short enough that a `atSecondsRemaining: 60` cue would fire before the workout even starts (e.g. a 45-second AMRAP), the cue simply never fires. Don't error, don't force it.
- If `atPercentElapsed: 50` and `atSecondsRemaining: 60` both happen at the same moment (e.g. a 2-minute AMRAP), both fire in sequence. Since these are voice callouts ("Halfway" then "One minute left"), the speech system queues or cancels-and-replaces appropriately — this is already the Stage 3 behavior (`speechSynthesis.cancel()` before each `speak()`), so the later one wins. In practice these cues won't collide meaningfully because one is a voice callout and the other is a voice callout, and the 2-minute AMRAP case is pathological.
- For AMRAP durations shorter than 2:00, the halfway callout happens in the first minute. That's fine — users who set a 90-second AMRAP get a halfway call at 45s and a one-minute-left call at 60s, which is oddly-timed but not broken.

### Two new voice callouts

Adding to the voice-callout vocabulary from Stage 3:

- `"halfway"` → speaks "Halfway"
- `"oneMinuteLeft"` → speaks "One minute left"

These use the same `speechSynthesis` setup as the round callouts. Same utterance parameters (rate 1.0, volume 1.0, lang `en-US`).

No new audio tones. AMRAP's work-start "go" tone, final-3-seconds countdown beeps, and workout-complete sequence all reuse the existing Stage 2 sounds with no changes.

### Run screen — adjustments for round-less phases

The run screen currently shows a round indicator ("Round 3 of 10") sourced from phase metadata. For AMRAP's work phase, `round` and `totalRounds` are absent.

- When those fields are missing, hide the round indicator entirely — don't show "Round undefined" or "Round 0 of 0."
- The phase `label` ("AMRAP") is the primary text in place of the round indicator.
- The large countdown display (MM:SS) is the focal point, same as always.
- Color treatment for AMRAP's work phase uses the same work color as Tabata and EMOM. No special AMRAP color.

### Home screen — add AMRAP

Add a third option to the home screen's format picker: AMRAP. Same card/button style as Tabata and EMOM. Optional one-line description: "As many rounds as possible in a set time."

### Navigation / view-state

Add `"amrap-setup"` to the view-state enum. Home → amrap-setup → running → done → home, same flow as other formats.

### Behavior that has to keep working

- Tabata and EMOM are unchanged in observable behavior.
- All Stage 2/3/4 functionality (audio, wake lock, skip, pause, reset, voice callouts) works for AMRAP exactly as it does for the other formats, plus the new mid-phase cues.
- Skip on AMRAP's work phase skips to the done state (it's the only meaningful phase, so skipping past it ends the workout). Plays the workout-complete sound.

## Nice-to-have, deferred

- **For Time format.** Counts up instead of down, has an optional cap. Different enough that it deserves its own planning pass.
- **Custom intervals.** The build-a-phase-sequence-by-hand format. Significant UI work.
- **Additional mid-phase cues for Tabata/EMOM.** (E.g. minute-mark beeps during long EMOMs.) Not needed right now.
- **Configurable AMRAP callouts.** User toggling whether they want halfway or one-minute-left. Keep it non-configurable for now; sensible defaults only.

## Why these choices

**Tiered picker (15s to 5:00, then 1min to 30:00).** Matches Tabata exactly in its range for consistency, then switches to a sane granularity for longer durations. Whole-minute increments at the top end match how people actually program AMRAPs. No 15:30 AMRAPs in real life.

**No rounds picker for AMRAP.** The defining feature of AMRAP is that the user counts rounds themselves — the timer's job is just to bound the time. Adding a rounds field would contradict the format.

**Halfway + one-minute-left + final 3-2-1.** Three audio moments is the right amount for the long-silence problem. Halfway is motivating. One minute left is tactically useful (signals the final push). Final 3-2-1 is consistent with the rest of the app. More than these would make AMRAPs feel chatty.

**Mid-phase cues as engine data, not hard-coded format logic.** If the engine had an if-statement checking "is this an AMRAP phase, fire halfway audio," that logic would be stuck in the engine forever. Expressing it as phase metadata means any future format can opt in to mid-phase cues without touching the engine, and AMRAP's existing cues can be adjusted by changing the generator.

**`atSecondsRemaining` and `atPercentElapsed` as trigger types.** Covers both tactical cues (one minute left — you care about absolute remaining time) and pacing cues (halfway — you care about relative progress). Two trigger types is enough; adding more (`atSecondsElapsed`, `everyMinute`, etc.) is deferred until a format actually needs them.

**Reuse every existing audio primitive.** No new tones for AMRAP — just two new voice utterances that use the same speech infrastructure. Keeps the audio module stable.

**Hide round indicator when round data is missing, don't fake it.** "Round 1 of 1" would be misleading — AMRAP isn't one round, it's N rounds you count yourself. The run screen just doesn't show a round indicator at all.

## What I'm explicitly not deciding yet

- For Time and Custom formats — each gets its own planning pass.
- Whether to surface mid-phase cues in Tabata or EMOM retroactively.
- Whether AMRAP gets a "tap to count round" button on the run screen (nice-to-have, but introduces persistent state and UI the format hasn't needed so far).

## Definition of done for Stage 5

- Deployed to the same live URL from its own branch.
- Home screen shows three formats: Tabata, EMOM, AMRAP.
- Tapping AMRAP opens the AMRAP setup screen with a single duration picker. Default is 10:00.
- Tapping Start runs a 10-second initial countdown, then a single work phase counting down for the selected duration, then the workout-complete sound.
- During a 10-minute AMRAP: at the 5-minute mark (halfway), voice says "Halfway." At 1:00 remaining, voice says "One minute left." At 0:03, 0:02, 0:01, the countdown beeps fire. At 0:00, the workout-complete sequence plays.
- During a 1-minute AMRAP: the "One minute left" callout fires effectively at the start (at second 60 remaining, which is when the phase begins). The halfway callout fires at 30 seconds remaining. This is expected behavior.
- On AMRAP's run screen, no round indicator appears. The phase label ("AMRAP") is shown alongside the countdown.
- Skip on the AMRAP work phase ends the workout with the complete sound.
- Pause and resume work correctly. Mid-phase cues don't fire during pause. After resume, they fire at the correct remaining-time values.
- Tabata and EMOM functionality is unchanged in observable behavior.
- No new CSS files, tokens, or class-naming patterns introduced. New markup uses the existing system.
- Tested on both desktop Chrome and iOS Safari before merging.