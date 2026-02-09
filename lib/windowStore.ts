export const SIGIL_ID = 'CHMBR-13A-LOOP-077';

export type AppId =
  | 'about'
  | 'text-quest'
  | 'listen'
  | 'support'
  | 'steal'
  | 'lore-map'
  | 'lore-index'
  | 'settings'
  | 'notes'
  | 'recents'
  | 'documents'
  | 'downloads'
  | 'network'
  | 'system-status';

export interface ChamberWindow {
  id: string;
  appId: AppId;
  title: string;
  zIndex: number;
  isMinimised: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppWindowMeta {
  title: string;
  width: number;
  height: number;
}

export const APP_META: Record<AppId, AppWindowMeta> = {
  about: { title: 'About ChamberOS', width: 460, height: 430 },
  'text-quest': { title: 'Chamber Text Quest', width: 920, height: 620 },
  listen: { title: 'Second Life Player', width: 760, height: 460 },
  support: { title: 'Support', width: 640, height: 420 },
  steal: { title: 'Steal', width: 640, height: 420 },
  'lore-map': { title: 'Lore Map', width: 720, height: 520 },
  'lore-index': { title: 'Lore Index', width: 540, height: 460 },
  settings: { title: 'Settings', width: 520, height: 440 },
  notes: { title: 'Notes', width: 520, height: 420 },
  recents: { title: 'Recents', width: 520, height: 400 },
  documents: { title: 'Documents', width: 520, height: 400 },
  downloads: { title: 'Downloads', width: 520, height: 400 },
  network: { title: 'Network', width: 520, height: 400 },
  'system-status': { title: 'System Status', width: 540, height: 430 }
};

const WINDOW_START_X = 72;
const WINDOW_START_Y = 74;
const WINDOW_STEP_X = 24;
const WINDOW_STEP_Y = 20;

export function getNextZIndex(windows: ChamberWindow[]): number {
  const highest = windows.reduce((max, current) => Math.max(max, current.zIndex), 0);
  return highest + 1;
}

export function getFocusedWindow(windows: ChamberWindow[], focusedWindowId: string | null): ChamberWindow | null {
  if (!focusedWindowId) {
    return null;
  }
  return windows.find((window) => window.id === focusedWindowId) ?? null;
}

export function bringAllToFront(windows: ChamberWindow[]): ChamberWindow[] {
  const ordered = [...windows].sort((a, b) => a.zIndex - b.zIndex);
  return ordered.map((window, index) => ({
    ...window,
    zIndex: index + 1
  }));
}

export function createWindow(appId: AppId, existingWindows: ChamberWindow[]): ChamberWindow {
  const meta = APP_META[appId];
  const offset = existingWindows.length % 10;

  return {
    id: `${appId}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    appId,
    title: meta.title,
    zIndex: getNextZIndex(existingWindows),
    isMinimised: false,
    x: WINDOW_START_X + offset * WINDOW_STEP_X,
    y: WINDOW_START_Y + offset * WINDOW_STEP_Y,
    width: meta.width,
    height: meta.height
  };
}

export function focusWindow(windows: ChamberWindow[], windowId: string): ChamberWindow[] {
  const nextZ = getNextZIndex(windows);
  return windows.map((window) =>
    window.id === windowId
      ? {
          ...window,
          zIndex: nextZ,
          isMinimised: false
        }
      : window
  );
}

export function minimiseWindow(windows: ChamberWindow[], windowId: string): ChamberWindow[] {
  return windows.map((window) =>
    window.id === windowId
      ? {
          ...window,
          isMinimised: true
        }
      : window
  );
}

export function restoreWindow(windows: ChamberWindow[], windowId: string): ChamberWindow[] {
  const nextZ = getNextZIndex(windows);
  return windows.map((window) =>
    window.id === windowId
      ? {
          ...window,
          isMinimised: false,
          zIndex: nextZ
        }
      : window
  );
}

export function closeWindow(windows: ChamberWindow[], windowId: string): ChamberWindow[] {
  return windows.filter((window) => window.id !== windowId);
}
