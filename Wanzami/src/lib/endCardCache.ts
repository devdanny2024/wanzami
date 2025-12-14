'use client';

const STORAGE_KEY = 'endcardRatedIds';

function readSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((x) => String(x)));
  } catch {
    return new Set();
  }
}

function writeSet(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

function keyFor(titleId?: string | number | null, episodeId?: string | number | null) {
  if (titleId === undefined || titleId === null) return null;
  const base = String(titleId);
  return episodeId ? `${base}:${episodeId}` : base;
}

export function hasRatedEndcard(titleId?: string | number | null, episodeId?: string | number | null) {
  const key = keyFor(titleId, episodeId);
  if (!key) return false;
  return readSet().has(key);
}

export function markRatedEndcard(titleId?: string | number | null, episodeId?: string | number | null) {
  const key = keyFor(titleId, episodeId);
  if (!key) return;
  const set = readSet();
  set.add(key);
  writeSet(set);
}
