let isUnlocked = false;

function dbg(hypothesisId, location, message, data) {
  // #region agent log
  fetch("http://127.0.0.1:7448/ingest/d9512ff2-96b2-4b56-987a-9b4cb119db51", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "0441b6" },
    body: JSON.stringify({
      sessionId: "0441b6",
      runId: "pre-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export function ensureSpeechUnlocked() {
  const hasSS = "speechSynthesis" in window;
  dbg("H1", "src/voice.js:23", "ensureSpeechUnlocked() called", {
    hasSpeechSynthesis: hasSS,
    alreadyUnlocked: isUnlocked,
    docVisibility: document.visibilityState,
  });
  if (!hasSS) return false;
  if (isUnlocked) return true;

  try {
    // iOS Safari: needs a user gesture before speech works.
    const u = new SpeechSynthesisUtterance("");
    u.lang = "en-US";
    u.onstart = () => {
      dbg("H1", "src/voice.js:37", "unlock utterance onstart", {
        speaking: window.speechSynthesis?.speaking,
        pending: window.speechSynthesis?.pending,
        paused: window.speechSynthesis?.paused,
      });
    };
    u.onerror = (e) => {
      dbg("H4", "src/voice.js:45", "unlock utterance onerror", {
        error: e?.error,
        name: e?.name,
        message: e?.message,
      });
    };
    window.speechSynthesis.speak(u);
    isUnlocked = true;
    const voicesLen = window.speechSynthesis?.getVoices?.()?.length ?? null;
    dbg("H2", "src/voice.js:56", "unlock speak() invoked", {
      isUnlocked,
      voicesLen,
      speaking: window.speechSynthesis?.speaking,
      pending: window.speechSynthesis?.pending,
      paused: window.speechSynthesis?.paused,
    });
    return true;
  } catch (err) {
    dbg("H1", "src/voice.js:67", "ensureSpeechUnlocked() threw", {
      err: String(err?.message ?? err),
    });
    return false;
  }
}

export function cancelSpeech() {
  try {
    dbg("H3", "src/voice.js:79", "cancelSpeech() called", {
      speaking: window.speechSynthesis?.speaking,
      pending: window.speechSynthesis?.pending,
      paused: window.speechSynthesis?.paused,
    });
    window.speechSynthesis?.cancel?.();
  } catch {
    // ignore
  }
}

export function speak(text) {
  if (!("speechSynthesis" in window)) return;
  if (!text) return;

  try {
    const ss = window.speechSynthesis;
    const voices = ss?.getVoices?.() ?? [];
    dbg("H2", "src/voice.js:87", "speak() called", {
      textLen: String(text).length,
      isUnlocked,
      voicesLen: Array.isArray(voices) ? voices.length : null,
      speaking: ss?.speaking,
      pending: ss?.pending,
      paused: ss?.paused,
    });

    // Avoid a cancel→speak race that can cause immediate "canceled" errors in some browsers.
    const shouldCancelFirst = !!(ss?.speaking || ss?.pending);
    if (shouldCancelFirst) {
      dbg("H3", "src/voice.js:101", "speak() cancelSpeech() before new utterance", {
        speaking: ss?.speaking,
        pending: ss?.pending,
        paused: ss?.paused,
      });
      cancelSpeech();
      // If the engine got paused, resume can unstick some implementations.
      try {
        ss?.resume?.();
      } catch {
        // ignore
      }
    }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 1.1;
    u.pitch = 1.0;
    u.volume = 1.0;
    u.onstart = () => {
      dbg("H3", "src/voice.js:109", "utterance onstart", {
        speaking: window.speechSynthesis?.speaking,
        pending: window.speechSynthesis?.pending,
        paused: window.speechSynthesis?.paused,
      });
    };
    u.onend = () => {
      dbg("H3", "src/voice.js:117", "utterance onend", {
        speaking: window.speechSynthesis?.speaking,
        pending: window.speechSynthesis?.pending,
        paused: window.speechSynthesis?.paused,
      });
    };
    u.onerror = (e) => {
      dbg("H4", "src/voice.js:125", "utterance onerror", {
        error: e?.error,
        name: e?.name,
        message: e?.message,
      });
    };

    const doSpeak = () => {
      ss.speak(u);
      dbg("H3", "src/voice.js:150", "speak() invoked speechSynthesis.speak", {
        speaking: ss?.speaking,
        pending: ss?.pending,
        paused: ss?.paused,
      });
    };

    if (shouldCancelFirst) {
      requestAnimationFrame(doSpeak);
      dbg("H3", "src/voice.js:159", "speak() scheduled speak on next frame", {});
    } else {
      doSpeak();
    }
  } catch (err) {
    dbg("H1", "src/voice.js:143", "speak() threw", { err: String(err?.message ?? err) });
    // ignore
  }
}

