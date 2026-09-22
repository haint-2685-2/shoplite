/* ==========================================================================
   storage.js — localStorage without the sharp edges (module 2, day 3)
   --------------------------------------------------------------------------
   localStorage only stores strings, and it throws in three real situations:
   private mode, a full quota, and data that somebody hand-edited into
   invalid JSON. Every access is wrapped so a corrupt key can never take the
   whole page down with it.
   ========================================================================== */

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback; // nothing stored yet != broken
    return JSON.parse(raw);
  } catch {
    // Corrupt or unreadable: drop the bad value instead of failing forever.
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable entirely — nothing left to clean up */
    }
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // quota exceeded or private mode: the caller decides
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
