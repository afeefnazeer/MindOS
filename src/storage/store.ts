// src/storage/store.ts — Typed localStorage wrapper

const KEYS = {
  thoughts:      'mindos:thoughts',
  decisions:     'mindos:decisions',
  focusSessions: 'mindos:focus_sessions',
  moodLog:       'mindos:mood_log',
  settings:      'mindos:settings',
} as const;

type StoreKey = keyof typeof KEYS;

export function get<T>(key: StoreKey): T | null {
  const raw = localStorage.getItem(KEYS[key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function set<T>(key: StoreKey, value: T): void {
  localStorage.setItem(KEYS[key], JSON.stringify(value));
}

export function update<T>(key: StoreKey, fn: (prev: T | null) => T): void {
  set(key, fn(get<T>(key)));
}

export function clear(key: StoreKey): void {
  localStorage.removeItem(KEYS[key]);
}
