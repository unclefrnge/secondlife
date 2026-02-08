import type { ChamberMode, ChamberSave } from '@/engine/types';

export const CHAMBER_MODE_KEY = 'chamber_mode';
export const CHAMBER_OPENED_TRACKS_KEY = 'chamber_opened_tracks';
export const CHAMBER_COMPLETED_TRACKS_KEY = 'chamber_completed_tracks';
export const CHAMBER_APPENDIX_UNLOCKED_KEY = 'chamber_appendix_unlocked';
export const CHAMBER_SAVE_KEY = 'chamber_save_v1';
export const CHAMBER_INTRO_SEEN_KEY = 'chamber_intro_seen_v1';

const memoryStorage = new Map<string, string>();

function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

function canUseLocalStorage(): boolean {
  if (!inBrowser()) {
    return false;
  }

  try {
    const testKey = '__chamber_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function readRaw(key: string): string | null {
  if (canUseLocalStorage()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  }

  return memoryStorage.get(key) ?? null;
}

function writeRaw(key: string, value: string): void {
  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      memoryStorage.set(key, value);
      return;
    }
  }

  memoryStorage.set(key, value);
}

function removeRaw(key: string): void {
  if (canUseLocalStorage()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  }

  memoryStorage.delete(key);
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isValidMode(value: unknown): value is ChamberMode {
  return value === 'guided' || value === 'free' || value === 'hardcore';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function isSaveV1(value: unknown): value is ChamberSave {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const save = value as Partial<ChamberSave>;
  if (save.version !== 1 || !save.player || !save.world || !save.log) {
    return false;
  }

  if (typeof save.createdAt !== 'string' || typeof save.updatedAt !== 'string') {
    return false;
  }

  const player = save.player;
  const world = save.world;

  if (
    typeof player.name !== 'string' ||
    typeof player.archetype !== 'string' ||
    typeof player.hp !== 'number' ||
    !Array.isArray(player.conditions)
  ) {
    return false;
  }

  if (!player.stats) {
    return false;
  }

  if (
    typeof player.stats.distortion !== 'number' ||
    typeof player.stats.viscosity !== 'number' ||
    typeof player.stats.bureaucracy !== 'number'
  ) {
    return false;
  }

  if (
    typeof world.locationId !== 'string' ||
    !world.visited ||
    typeof world.visited !== 'object' ||
    !world.npcFlags ||
    typeof world.npcFlags !== 'object' ||
    !world.questFlags ||
    typeof world.questFlags !== 'object' ||
    !Array.isArray(world.inventory)
  ) {
    return false;
  }

  if (!save.log.messages || !Array.isArray(save.log.messages)) {
    return false;
  }

  return true;
}

function migrateSave(value: unknown): ChamberSave | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version === 1 && isSaveV1(record)) {
    return record;
  }

  return null;
}

export interface ChamberPersistedState {
  mode: ChamberMode;
  openedTracks: string[];
  completedTracks: string[];
  appendixUnlocked: boolean;
  save: ChamberSave | null;
  persistentStorage: boolean;
}

export function loadPersistedState(): ChamberPersistedState {
  const rawMode = readRaw(CHAMBER_MODE_KEY);
  const rawOpened = readRaw(CHAMBER_OPENED_TRACKS_KEY);
  const rawCompleted = readRaw(CHAMBER_COMPLETED_TRACKS_KEY);
  const rawAppendix = readRaw(CHAMBER_APPENDIX_UNLOCKED_KEY);
  const rawSave = readRaw(CHAMBER_SAVE_KEY);

  const parsedMode = safeParse<unknown>(rawMode);
  const parsedOpened = safeParse<unknown>(rawOpened);
  const parsedCompleted = safeParse<unknown>(rawCompleted);
  const parsedAppendix = safeParse<unknown>(rawAppendix);
  const parsedSave = safeParse<unknown>(rawSave);

  return {
    mode: isValidMode(parsedMode) ? parsedMode : 'guided',
    openedTracks: isStringArray(parsedOpened) ? parsedOpened : [],
    completedTracks: isStringArray(parsedCompleted) ? parsedCompleted : [],
    appendixUnlocked: typeof parsedAppendix === 'boolean' ? parsedAppendix : false,
    save: migrateSave(parsedSave),
    persistentStorage: canUseLocalStorage()
  };
}

export function saveMode(mode: ChamberMode): void {
  writeRaw(CHAMBER_MODE_KEY, JSON.stringify(mode));
}

export function persistRunState(input: {
  mode: ChamberMode;
  openedTracks: string[];
  completedTracks: string[];
  appendixUnlocked: boolean;
  save: ChamberSave;
}): void {
  writeRaw(CHAMBER_MODE_KEY, JSON.stringify(input.mode));
  writeRaw(CHAMBER_OPENED_TRACKS_KEY, JSON.stringify(input.openedTracks));
  writeRaw(CHAMBER_COMPLETED_TRACKS_KEY, JSON.stringify(input.completedTracks));
  writeRaw(CHAMBER_APPENDIX_UNLOCKED_KEY, JSON.stringify(input.appendixUnlocked));
  writeRaw(CHAMBER_SAVE_KEY, JSON.stringify(input.save));
}

export function wipeRunState(): void {
  removeRaw(CHAMBER_OPENED_TRACKS_KEY);
  removeRaw(CHAMBER_COMPLETED_TRACKS_KEY);
  removeRaw(CHAMBER_APPENDIX_UNLOCKED_KEY);
  removeRaw(CHAMBER_SAVE_KEY);
}

export function readIntroSeen(): boolean {
  const parsed = safeParse<unknown>(readRaw(CHAMBER_INTRO_SEEN_KEY));
  return parsed === true;
}

export function writeIntroSeen(): void {
  writeRaw(CHAMBER_INTRO_SEEN_KEY, JSON.stringify(true));
}

export function getCodexFromSave(save: ChamberSave | null): {
  locations: string[];
  npcs: string[];
  items: string[];
  laws: string[];
} {
  if (!save) {
    return { locations: [], npcs: [], items: [], laws: [] };
  }

  const flags = asRecord(save.world.questFlags);
  const codex = asRecord(flags.codex);

  const locations = isStringArray(codex.locations) ? codex.locations : [];
  const npcs = isStringArray(codex.npcs) ? codex.npcs : [];
  const items = isStringArray(codex.items) ? codex.items : [];
  const laws = isStringArray(codex.laws) ? codex.laws : [];

  return { locations, npcs, items, laws };
}
