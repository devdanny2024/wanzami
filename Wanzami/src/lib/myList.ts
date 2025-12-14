'use client';

const STORAGE_KEY = 'myListIds';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore storage errors
  }
}

export function getMyListIds() {
  return readIds();
}

export function isInMyList(id?: string | number | null) {
  if (id === undefined || id === null) return false;
  const target = String(id);
  return readIds().includes(target);
}

export function addToMyList(id?: string | number | null) {
  if (id === undefined || id === null) return;
  const target = String(id);
  const ids = readIds();
  if (!ids.includes(target)) {
    ids.push(target);
    writeIds(ids);
  }
}

export function removeFromMyList(id?: string | number | null) {
  if (id === undefined || id === null) return;
  const target = String(id);
  const filtered = readIds().filter((x) => x !== target);
  writeIds(filtered);
}

export function toggleMyList(id?: string | number | null) {
  if (isInMyList(id)) {
    removeFromMyList(id);
    return false;
  }
  addToMyList(id);
  return true;
}
