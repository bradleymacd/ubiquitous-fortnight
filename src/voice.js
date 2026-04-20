let isUnlocked = false;

export function ensureSpeechUnlocked() {
  if (!("speechSynthesis" in window)) return false;
  if (isUnlocked) return true;

  try {
    // iOS Safari: needs a user gesture before speech works.
    const u = new SpeechSynthesisUtterance("");
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
    isUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

export function cancelSpeech() {
  try {
    window.speechSynthesis?.cancel?.();
  } catch {
    // ignore
  }
}

export function speak(text) {
  if (!("speechSynthesis" in window)) return;
  if (!text) return;

  try {
    // Keep it simple: cancel any queued/in-progress speech first.
    cancelSpeech();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 1.1;
    u.pitch = 1.0;
    u.volume = 1.0;

    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

