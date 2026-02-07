import type { SecondLifeState } from '@/lib/types';

export const STORAGE_KEY = 'second-life:v1';

export const DEFAULT_STATE: SecondLifeState = {
  mode: 'guided',
  openedGuided: [],
  completedTracks: [],
  guidedCompleted: [],
  appendixUnlocked: false,
  lastPlayedTrackId: null
};

export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const key = '__second_life_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readState(): SecondLifeState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<SecondLifeState> & {
      openedTracksGuided?: string[];
      guidedCompletedTracks?: string[];
    };
    return {
      ...DEFAULT_STATE,
      ...parsed,
      openedGuided: Array.isArray(parsed.openedGuided)
        ? parsed.openedGuided
        : Array.isArray(parsed.openedTracksGuided)
          ? parsed.openedTracksGuided
          : [],
      completedTracks: Array.isArray(parsed.completedTracks) ? parsed.completedTracks : [],
      guidedCompleted: Array.isArray(parsed.guidedCompleted)
        ? parsed.guidedCompleted
        : Array.isArray(parsed.guidedCompletedTracks)
          ? parsed.guidedCompletedTracks
          : [],
      lastPlayedTrackId: parsed.lastPlayedTrackId ?? null,
      appendixUnlocked: Boolean(parsed.appendixUnlocked)
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function writeState(state: SecondLifeState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures so the app continues to work when storage is disabled.
  }
}
