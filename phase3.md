# Stage 3 (voice callouts) — Round & Rest Announcements

> **Note:** Stage 3 is "polish and extend" in the course. This doc covers the voice-callouts extension specifically. Other Stage 3 work (additional WOD formats, visual polish, etc.) gets its own planning docs as those are scoped.

## What we're building

Voice announcements layered on top of the existing beep-and-tone audio from Stage 2, using the browser's built-in Web Speech API. Spoken callouts for:

- "Round 1," "Round 2," … "Round 19" — announced during the lead-in before each round's work phase
- "Last Round" — instead of the number, announced before the final round's work phase
- "Rest" — announced when a rest phase begins

That's it. No other callouts, no motivational phrases, no dynamic text.

## What we already know

- **Stage 2 is done and deployed.** Beeps, tones, wake lock, skip, and 10-second initial countdown all work. Don't break any of it.
- **Web Speech API only.** Using `speechSynthesis` and `SpeechSynthesisUtterance`. No audio files, no cloud TTS, no external dependencies.
- **Voice plays alongside existing tones**, not instead of them. The beeps and transition tones are unchanged.
- **Default voice is fine.** Not picking a specific voice or agonizing over voice quality. Whatever the browser gives us is what we use.
- **No mute / no volume / no configurability** of the voice. Same philosophy as Stage 2 — one good default, ship it.

## Essential for this extension

### When each callout plays — the full timeline

The goal is that the voice announces *what's coming next* during the lead-in to that phase, before the 3-2-1 countdown beeps. This way the voice doesn't fight the beeps for airtime, and the user hears: "Round three" → beep, beep, beep → "go" tone → work begins.

**Round announcement timing:**

- Played approximately 5 seconds before a work phase begins.
- During the initial 10-second countdown, "Round one" speaks around the 5-second mark (so: silence seconds 10–6, "Round one" around seconds 5–4, silence around seconds 4–3 to avoid overlapping the countdown beeps, then 3-2-1 beeps, then "go" tone).
- During every subsequent rest phase, the next round's announcement speaks around the 5-second-remaining mark — so about 5 seconds before rest ends and work begins. Same structure: voice first, then 3-2-1 countdown beeps, then "go" tone.
- For the final round specifically, the voice says "Last Round" rather than "Round N."
- **Edge case:** if the rest duration is very short (15 or 30 seconds), the voice still plays at the "5 seconds before work" mark. If rest is 15s, that means the voice starts at 10s in, and 5 seconds later the 3-2-1 beeps start. This should be fine — just verify nothing collides.
- **Edge case:** if the rest duration is shorter than ~5 seconds, voice and beeps will overlap. Since our minimum rest is 15s (from Stage 1's picker), this doesn't actually happen — but if it ever did, the beeps take priority and the voice gets truncated or skipped.

**"Rest" announcement timing:**

- Played at the start of each rest phase, simultaneous with the rest-start tone (the 440Hz lower tone from Stage 2).
- Both audio events fire at the same moment as the phase transition. The tone is ~400ms, the word "Rest" is ~500ms — they'll overlap briefly and that's fine, it sounds natural.
- No "Rest" announcement on the final round's rest? Actually, yes, still say "Rest" — the user doesn't know it's the last rest until it ends with the workout-complete sound. Announcing "Rest" is consistent and doesn't reveal anything.

### iOS Web Speech unlock

Web Speech on iOS Safari has the same user-gesture requirement as Web Audio. Without unlocking, `speechSynthesis.speak()` silently does nothing.

- On the Start button tap (same moment the Web Audio context is unlocked), also fire a silent/empty utterance: `speechSynthesis.speak(new SpeechSynthesisUtterance(''))` or a very quiet one.
- After that, subsequent callouts work for the rest of the session.
- The AudioContext unlock from Stage 2 and the speechSynthesis unlock are separate things — both have to happen.

**Test on a real iPhone.** Web Speech quirks on iOS are the whole reason this needs spelling out.

### Voice selection — keep it simple

- Do not spend time picking a voice by name. Use the browser default.
- If the default voice is obnoxious in testing (too fast, too slow, wrong pitch), adjust the utterance parameters (`rate`, `pitch`, `volume`), not the voice selection.
- `speechSynthesis.getVoices()` may return an empty array on first access because voices load asynchronously. Either use the default (passing no voice) which avoids this entirely, or listen for the `voiceschanged` event before attempting to read the voices list.

### Utterance parameters

Reasonable defaults:
- `rate`: 1.0 (normal speed). Adjust up to 1.1–1.2 if callouts feel draggy.
- `pitch`: 1.0.
- `volume`: 1.0. Voice competes with the beeps at full volume.
- `lang`: `'en-US'`. Pinning this avoids platforms randomly picking a Spanish or other-locale voice.

### What stays exactly the same

All Stage 2 audio behavior is unchanged. Beeps, tones, the workout-complete sequence — all fire on the same schedule. The voice is purely additive.

### State additions over Stage 2

- A flag tracking whether speechSynthesis has been unlocked (separate from the Web Audio unlock flag).
- That's it. Callout logic reads from existing state (current round, current phase, time remaining) — no new state needed.

## Nice-to-have, deferred

- **Volume/mute toggle** — still deferred. Same reasoning as Stage 2.
- **Voice picker** — if the default voice turns out to be unusable in practice, add this later.
- **Customizable callouts** (e.g. coach-voice "Halfway through," "You got this") — maybe someday, probably never.
- **Multi-language support** — English-only is fine.
- **Interrupting / queuing logic** — if two utterances collide (which shouldn't happen given our timing, but), don't build fancy queuing. `speechSynthesis.cancel()` before each `speak()` to guarantee clean playback.

## Why these choices

**Web Speech over pre-recorded audio or cloud TTS.** Smallest possible scope. No asset management, no API keys, no generation scripts, no recording sessions. Twenty-two utterances' worth of voice quality isn't worth the overhead of alternatives for this project.

**Voice during the lead-in, not at the phase transition.** Announcing "Round three" *before* round three begins feels natural and anticipatory, like a coach calling the next round. Announcing it during or after the transition feels redundant — you can already see it on the screen. More importantly, this placement means voice and beeps don't compete for the same timeslot.

**"Rest" simultaneous with the rest-start tone.** For Rest announcements, simultaneity is fine because the word is short and the tone is short. Making Rest follow the same "5 seconds before" pattern as Round would require announcing Rest during the final seconds of work, which would conflict with the end-of-work countdown beeps. Simpler to play it at the transition itself.

**"Last Round" instead of "Round 8" (or whatever).** More informative and more motivating. Zero extra cost. Obvious win.

**Default voice, default parameters.** The tradeoff for using browser TTS is accepting that voice quality varies. Spending time selecting voices fights that tradeoff instead of accepting it. If the sound grates in real use, that's a specific signal to fix later — not a problem to pre-solve now.

**No mute toggle.** If voice ends up being annoying, the fix is removing it, not making it configurable. Configurable adds persistent UI, persistent state, persistence of that state across sessions — all deferred by design.

**Voice on the final round says "Last Round" but the final rest still says "Rest."** The user hearing "Last Round" already knows they're in the last round. Hearing "Rest" after their work phase is informative (they made it through work), not redundant. No need to special-case it.

## What I'm explicitly not deciding yet

- Whether any callouts get added beyond the 22 in scope
- Whether voice gets extended to other WOD formats when those are built (AMRAP doesn't have rounds, EMOM has a different structure, etc. — those formats will need their own voice-callout plans if we add them)
- Volume/mute/voice-picker controls

## Definition of done for this extension

- Deployed to the same live URL (merged from its own branch)
- Running a Tabata workout on my iPhone: before round 1 begins, I hear "Round one" during the initial countdown. Before round 2 begins, I hear "Round two" during the tail end of round 1's rest. And so on. Before the final round, I hear "Last Round."
- When each rest phase starts, I hear "Rest" at roughly the same moment as the rest-start tone.
- All Stage 2 audio still fires correctly: initial countdown beeps, work-start tones, end-of-work beeps, rest-start tones, end-of-rest beeps, workout-complete sound.
- No audio events collide in a way that sounds messy. Voice ends before the 3-2-1 countdown beeps begin.
- Works on iOS Safari. Works on desktop Chrome.
- Pausing the timer stops any in-progress speech. Resuming doesn't replay the missed utterance.
- Skipping to a new phase plays that phase's voice callout, if any (skipping into work plays "Round N" or "Last Round"; skipping into rest plays "Rest").
- Stage 1 and Stage 2 functionality is entirely unchanged in behavior.