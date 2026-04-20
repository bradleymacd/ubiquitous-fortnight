let sentinel = null;

export async function requestWakeLockIfSupported() {
  try {
    if (!("wakeLock" in navigator)) return null;
    // @ts-ignore - lib dom types may not include wakeLock in some setups
    sentinel = await navigator.wakeLock.request("screen");
    return sentinel;
  } catch {
    sentinel = null;
    return null;
  }
}

export function releaseWakeLock() {
  try {
    sentinel?.release?.();
  } catch {
    // ignore
  } finally {
    sentinel = null;
  }
}

export function hasWakeLock() {
  return Boolean(sentinel);
}

