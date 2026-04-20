# Stage 1 — Core Tabata Timer

## What we're building

A working Tabata interval timer for the web. The user picks a work duration, a rest duration, and a number of rounds, then runs the timer. The timer alternates between work and rest phases for the chosen number of rounds and then stops.

This is the "core functionality only" version. No audio, no wake lock, no other WOD formats, no persistence. It is, on its own, a usable Tabata timer — someone can open it in a browser, set their intervals, and run a workout. It just requires them to glance at the screen to know when to switch phases. Audio and the things that make it truly gym-ready come in Stage 2.

## What we already know

- **Stack:** Vite, vanilla JS (or React if the course has moved there by now — follow Nevan's setup).
- **Platform:** web app, works on desktop and mobile browsers. No PWA or install flow in Stage 1.
- **Pickers:** native `<select>` dropdowns on every platform. On iOS and Android, the browser renders these as native scrolling pickers automatically. Custom wheel/slider UI is deferred to Stage 3.
- **No persistence.** Settings reset on page reload. localStorage comes later if at all.
- **No audio, no wake lock, no notifications.** All deferred to Stage 2.
- **One format only:** Tabata. AMRAP, For Time, EMOM, and Custom are Stage 3 extensions.

## Essential for Stage 1

**Setup screen**
- Work duration picker: `<select>` with values from `0:15` to `5:00` in 15-second increments (20 options total). Default: `0:20`.
- Rest duration picker: same value set. Default: `0:10`.
- Rounds picker: `<select>` with values `1` through `20`. Default: `8`.
- A "Start" button that takes the user to the run screen.

**Run screen**
- Large countdown display showing the time remaining in the current phase, `MM:SS` format.
- Clear visual indication of the current phase — work vs. rest must be instantly recognizable at 3 meters. Use a bold color swap (e.g. green for work, blue for rest) plus a large text label ("WORK" / "REST").
- Round indicator: `Round 3 of 8` or similar.
- Controls: Pause/Resume toggle, Reset (returns to setup screen).
- When the final round ends, show a clear "Done" state.

**State model**
- `timeRemaining` — seconds left in the current phase
- `isRunning` — boolean
- `currentPhase` — `"work"` or `"rest"`
- `currentRound` — integer, 1 through `totalRounds`
- `workDuration`, `restDuration`, `totalRounds` — set from the setup screen
- `status` — `"setup"` | `"running"` | `"paused"` | `"done"`

**Behavior**
- Timer starts in the `work` phase of round 1.
- When `timeRemaining` hits 0: if currently in `work`, switch to `rest` (same round). If currently in `rest`, increment round and switch back to `work`. If that was the last round's rest phase, go to `done`.
- Pause freezes `timeRemaining` and `isRunning`. Resume picks up from the same point.
- Reset returns everything to the setup screen with the previously selected settings preserved in the UI (so the user doesn't have to redo their picks if they want to run another round).

## Nice-to-have, deferred

- **Audio cues** (beep at phase transition, 3-2-1 countdown) → Stage 2
- **Wake lock** to keep screen on during a workout → Stage 2
- **Custom duration presets** (e.g. save "my Tabata" as 45/15 × 10) → Stage 3
- **Other WOD formats** (AMRAP, For Time, EMOM, Custom) → Stage 3
- **Visual polish** — fonts, theming, better layout, bigger numbers → Stage 3
- **Persistence** of last-used settings → Stage 3 if at all

## Why these choices

**Native `<select>` over custom pickers.** iOS doesn't expose its native wheel picker to web pages, and building one from scratch is a Stage 3 polish task, not a core-functionality task. `<select>` renders as a platform-native picker on iOS and Android for free, works identically on desktop, and removes ~a day of UI work from Stage 1.

**15-second increments up to 5:00.** Covers every common Tabata variant (20/10, 30/30, 40/20, 45/15, 60/30, etc.) with a single uniform step size. 20 values per picker is easy to scroll through. Going finer than 15 seconds adds UI complexity without matching real usage patterns.

**No audio in Stage 1.** The course structure puts notifications in Stage 2, and honoring that boundary forces me to first nail the state machine and phase transitions without the distraction of Web Audio. Stage 1 is demo-able; Stage 2 is actually gym-ready. That's the right split for the learning goals of this week.

**Tabata first, not AMRAP.** It's the format I'll actually use, so Stage 2 produces something I benefit from immediately. Tabata's two-phase structure also maps cleanly onto the course's Pomodoro state model (work/break modes), so the conceptual parallel to Nevan's Stage 1 holds.

**Reset returns to setup, not re-runs.** Different people's intuitions vary here. I'm picking "back to setup with settings preserved" because in gym use, you often want to tweak rounds or durations between sets. If that turns out wrong in practice, it's a one-line change.

## What I'm explicitly not deciding yet

- How audio will be structured in Stage 2 (Web Audio tones vs. pre-recorded, how many distinct cues)
- Whether Stage 3 refactors into a generalized phase-sequence engine or keeps each format as its own screen
- Styling system (CSS tokens, component patterns) beyond what Nevan's course walks through

These get decided when we plan those stages. Stage 1's job is to work.

## Definition of done for Stage 1

- Deployed to a live URL
- I can set work/rest/rounds on the setup screen, hit Start, and run a complete Tabata workout that ends correctly
- Phase transitions happen automatically at the right times
- Pause and Reset both work
- The work vs. rest distinction is visually obvious from across the room
- Merged to `main` from its own branch