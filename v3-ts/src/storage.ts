/* ==========================================================================
   storage.ts — localStorage without the sharp edges (module 2 -> 3)
   --------------------------------------------------------------------------
   Two changes from v2: getItem() returns `string | null` and strict mode
   makes that null impossible to ignore; and readJSON() now returns
   `unknown` instead of a guessed type. Whatever was stored — by an older
   build, or by hand in DevTools — the caller has to prove its shape with a
   guard before using it.
   ========================================================================== */

export function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return undefined; // nothing stored yet != broken
    return JSON.parse(raw);
  } catch {
    // Corrupt or unreadable: drop the bad value instead of failing forever.
    remove(key);
    return undefined;
  }
}

/** Returns false on a full quota or blocked storage: the caller decides. */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked entirely
  }
}

export function writeString(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable entirely — nothing left to clean up */
  }
}
