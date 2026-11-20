'use client';

import { useSyncExternalStore } from 'react';
import { isWallpaper, type Wallpaper } from '@/components/welcome/wallpapers';

export type DeskPreferences = {
  wallpaper: Wallpaper;
  animate: boolean;
  iconPlate: boolean;
  clock: 'device' | 'johannesburg';
  hours: 'device' | '12' | '24';
  paper: 'cream' | 'pink' | 'green';
  stamp: 'none' | 'customer copy' | 'bakery copy';
  feed: 'roller' | 'instant';
};

const defaults: DeskPreferences = {
  wallpaper: 'pond', animate: true, iconPlate: false,
  clock: 'device', hours: 'device', paper: 'cream', stamp: 'none', feed: 'roller'
};
const key = 'chamber-desk-preferences-v1';
const legacyKey = 'chamber-wallpaper';
let current = defaults;
let memoryOnly = false;
const listeners = new Set<() => void>();

function refresh() {
  if (memoryOnly) return;
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
    const wallpaper = data.wallpaper ?? localStorage.getItem(legacyKey);
    const next: DeskPreferences = {
      wallpaper: isWallpaper(wallpaper) ? wallpaper : defaults.wallpaper,
      animate: data.animate !== false, iconPlate: data.iconPlate === true,
      clock: data.clock === 'johannesburg' ? data.clock : defaults.clock,
      hours: ['12', '24'].includes(data.hours) ? data.hours : defaults.hours,
      paper: ['pink', 'green'].includes(data.paper) ? data.paper : defaults.paper,
      stamp: ['customer copy', 'bakery copy'].includes(data.stamp) ? data.stamp : defaults.stamp,
      feed: data.feed === 'instant' ? data.feed : defaults.feed
    };
    if (Object.keys(next).some(k => next[k as keyof DeskPreferences] !== current[k as keyof DeskPreferences])) {
      current = next;
    }
  } catch { /* Keep this visit's preferences if storage is unavailable. */ }
}
function notify() { listeners.forEach(listener => listener()); }
function onStorage(event: StorageEvent) {
  if (event.key === key || event.key === legacyKey || event.key === null) { refresh(); notify(); }
}
function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  refresh();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener('storage', onStorage);
  };
}

export function setDeskPreference<K extends keyof DeskPreferences>(setting: K, value: DeskPreferences[K]) {
  refresh();
  current = { ...current, [setting]: value };
  try { localStorage.setItem(key, JSON.stringify(current)); }
  catch { memoryOnly = true; }
  notify();
}

export function useDeskPreferences() {
  return useSyncExternalStore(subscribe, () => current, () => defaults);
}
