# Stage 2 — Gym-Ready Audio, Wake Lock & Skip

## What we're building

Taking the working Stage 1 Tabata timer and making it fully usable at the gym without looking at the screen. Four features:

1. **Audio cues** — beeps and tones that mark transitions, countdowns, and workout start/end, so you can keep your head down
2. **Screen wake lock** — the screen stays on while the timer is running
3. **Skip button** — manually advance from the current phase to the next one
4. **10-second initial countdown** — a lead-in before round 1 starts, so you have time to set the phone down and get into position

No new formats, no visual redesign, no settings screen.

## What we already know

- **Stage 1 is done and deployed.** Core Tabata timer works end-to-end. Don't break it.
- **Audio:** generated with the Web Audio API using `OscillatorNode`. No audio files, no external assets.
- **Wake Lock:** using the Screen Wake Lock API (`navigator.wakeLock`). Graceful fallback if unavailable.
- **No volume controls, no mute toggle, no settings.** Volume is whatever the phone is at. Audio always plays when the timer runs.
- **No haptics, no background audio, no notifications.** Deferred.
- **iOS Safari is the primary test target** because that's where audio behavior is most constrained. If it works on iOS, it works everywhere.

## Essential for Stage 2

### The 10-second initial countdown

A new phase in the state machine called `"countdown"` (or similar) that runs once, between the user tapping Start and round 1's work phase beginning.

- Lasts 10 seconds, counting down from 0:10 to 0:00.
- During the countdown, the run screen shows the countdown timer with a clear label like "Get Ready" or "Starting in…" — **not** "Round 1" yet. Round 1's clock only starts when work actually begins.
- Visual treatment should be distinct from both work and rest (e.g. a neutral color — gray or yellow — not the work green or rest blue).
- When the countdown hits 0, the state transitions into round 1's work phase and behaves exactly as Stage 1.
- Pause/resume works during the countdown. Reset during the countdown returns to setup.

### Skip button on the run screen

Button that advances immediately from the current phase to the next one.

- From the initial 10-second countdown → skips straight to round 1 work.
- From work in round N → skips to round N rest.
- From rest in round N → skips to round (N+1) work. If round N was the last round, skips to the done state.
- Skipping plays the transition audio cue for the new phase (same cue that would have played if the timer had reached zero naturally).
- The button is available throughout running and paused states. Default to "one tap, immediate." If accidental skips turn out to be a real problem in real gym use, a long-press or two-tap confirmation can be added in Stage 3.

### Audio cues — six distinct moments

1. **Countdown beeps — final 3 seconds** — three short beeps (880Hz, ~100ms each), one per second, during the final 3 seconds of:
   - The initial 10-second countdown (silent for seconds 10–4, beeps for 3-2-1)
   - Every work phase (prepare to rest)
   - Every rest phase *except the final round's* (prepare to work)

2. **Work start ("go")** — a single longer tone (660Hz, ~400ms) at the moment work begins. Plays at:
   - The end of the initial countdown (start of round 1 work)
   - The end of every rest phase (start of the next round's work)
   - When the user skips into a work phase

3. **Rest start** — a distinctly lower tone (440Hz, ~400ms) at the moment work ends and rest begins. Plays at:
   - The end of every work phase
   - When the user skips into a rest phase

4. **Workout complete** — a short ascending sequence (523Hz → 659Hz → 784Hz, ~150ms each) when the final round's rest phase ends, or when the user skips past the final rest.

   - Important: **do not** play the final-3-seconds countdown beeps during the last round's rest phase. There's no work coming — just the completion sound. This is a state-machine edge case worth being explicit about or it will be wrong.

**Edge case for short intervals:** if the user picks a 15-second work or rest duration, the final-3-seconds countdown beeps start 12 seconds in — only 3 seconds after the phase began. That's expected behavior, not a bug. Don't try to suppress countdowns on short intervals.

### iOS audio unlock

Web Audio on iOS Safari will not play any sound until the AudioContext has been "unlocked" by a user gesture.

- Create the AudioContext lazily on the first user tap (not on page load).
- When the user taps "Start" on the setup screen, immediately play a silent or inaudible sound (e.g. a 0-gain oscillator for 1ms) through the AudioContext to unlock it.
- After that, all subsequent beeps work without user interaction.
- If the user pauses and resumes, or resets and starts again, the context stays unlocked for the session.

**This must work on iOS Safari. Test on a real iPhone, not just desktop Chrome.**

### Screen wake lock

- Request a screen wake lock (`navigator.wakeLock.request('screen')`) when the timer transitions from setup/paused into any active state (countdown, work, or rest).
- Release the wake lock when the timer transitions into paused, done, or reset states.
- Listen for `visibilitychange` events. When the tab becomes visible again and the timer is still running, re-request the wake lock (it auto-releases when the tab loses visibility).
- If `navigator.wakeLock` doesn't exist, skip silently. No crash, no error shown to user.

### Behavior that has to keep working

- All Stage 1 behavior is unchanged except for the addition of the initial countdown phase: setup screen, run screen, pause/resume, reset, round counter, phase transitions, done state.
- Pausing the timer stops any in-progress countdown beeps. Resuming doesn't replay missed beeps — it picks up wherever the timer is now.

### State additions over Stage 1

- New phase value: `currentPhase` can now be `"countdown"` in addition to `"work"` and `"rest"`
- An `AudioContext` reference (created on first user gesture)
- A `WakeLockSentinel` reference (when active)
- A flag tracking whether audio has been unlocked

Audio and wake-lock state can live in their own modules/hooks rather than polluting the main timer state.

## Nice-to-have, deferred

- **Volume control** → Stage 3 or never
- **Mute toggle** → Stage 3 or never
- **Configurable initial countdown length** (5s, 10s, 15s) → Stage 3 if it matters
- **Different sound schemes** (bells, voice, etc.) → Stage 3
- **Haptic feedback** on mobile (vibration) → Stage 3
- **"Skip back" / rewind to previous phase** → Stage 3 if ever
- **Visual "audio is on / wake lock is active" indicators** → only if confusion arises

## Why these choices

**10 seconds for the initial countdown, not 5 or 15.** 5 seconds is too short to set the phone down and get into position. 15 feels draggy, especially for short-format workouts. 10 is the CrossFit convention for a reason.

**The initial countdown as its own phase, not as "the first 10 seconds of work."** Cleaner state machine, cleaner visual treatment, and it means the round 1 work clock actually runs for the full work duration the user picked (not 10 seconds less).

**Symmetric audio: same 3-2-1-go pattern before every work phase.** Whether it's the initial countdown or the countdown at the end of rest, the audio pattern is identical. One pattern to learn, one pattern to build.

**Countdown beeps before work ending, too.** Not just before work starting. "Work is about to end" is genuinely useful — you don't want to start a new rep with 2 seconds left. The symmetry (countdown before every phase transition) also makes the audio feel predictable.

**No pre-work countdown on the final rest.** Because there's no work phase coming. The workout-complete sound is the audio signal. Playing 3-2-1 beeps and then switching to "done" would confuse people.


**Skip is one-tap immediate, not confirmed.** Worth trying first. If gym-sweaty-accidental-taps turn out to be a real problem, confirmation can be added in Stage 3. Start with the simpler version.

**Wake lock covers the initial countdown too.** Makes sense — if the screen sleeps during the 10-second lead-in, you miss round 1. Any "active" state holds the lock.

## What I'm explicitly not deciding yet

- Whether Stage 3 will introduce audio preferences at all
- Whether the initial countdown duration becomes configurable
- How other formats (AMRAP, EMOM, etc.) will adapt the audio and countdown primitives built here — though the audio module should probably be format-agnostic so it can be reused
- Skip-backward behavior

## Definition of done for Stage 2

- Deployed to the same live URL (merged from its own Stage 2 branch)
- Tapping Start on the setup screen begins a 10-second countdown before round 1 work
- Running a full Tabata workout on my iPhone with the screen face-down on a bench, I can hear all six audio moments clearly: initial countdown beeps, work-start "go," end-of-work countdown beeps, rest-start tone, end-of-rest countdown beeps, and workout-complete sequence
- During the workout, the iPhone screen does not sleep on its own (including during the initial countdown)
- If I pause the timer and put the phone down, the screen sleeps normally
- If I switch apps mid-workout and come back, the wake lock re-engages and the timer has continued correctly
- The Skip button works from every phase (countdown, work, rest), advances to the correct next phase, and plays the correct destination audio cue
- Skipping past the final rest correctly ends the workout with the completion sound
- On the final round's rest phase, the end-of-rest countdown beeps do **not** play (only the workout-complete sound plays when rest ends)
- Stage 1 functionality (pause, reset, round counter, phase logic, done state) still works exactly as before
- Tested on both desktop Chrome and iOS Safari before merging