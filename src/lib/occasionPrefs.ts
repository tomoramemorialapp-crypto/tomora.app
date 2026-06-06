import { Platform } from 'react-native';

/**
 * Lightweight, local per-occasion preferences (notify-me + added-to-calendar).
 * Demo-scoped: persisted to localStorage on web, in-memory on native. This is
 * enough to drive the bell toggle + calendar state without a backend round-trip.
 */

const NOTIFY_KEY = 'tomora.occasions.notify';
const CAL_KEY = 'tomora.occasions.calendar';

const memory: Record<string, Set<string>> = {
  [NOTIFY_KEY]: new Set(),
  [CAL_KEY]: new Set(),
};

function load(key: string): Set<string> {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return memory[key];
  try {
    const raw = localStorage.getItem(key);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function save(key: string, set: Set<string>): void {
  memory[key] = set;
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function getNotifyIds(): Set<string> {
  return load(NOTIFY_KEY);
}

export function setNotify(occasionId: string, on: boolean): Set<string> {
  const set = load(NOTIFY_KEY);
  if (on) set.add(occasionId);
  else set.delete(occasionId);
  save(NOTIFY_KEY, set);
  return new Set(set);
}

export function getCalendarIds(): Set<string> {
  return load(CAL_KEY);
}

export function setCalendarAdded(occasionId: string, on: boolean): Set<string> {
  const set = load(CAL_KEY);
  if (on) set.add(occasionId);
  else set.delete(occasionId);
  save(CAL_KEY, set);
  return new Set(set);
}
