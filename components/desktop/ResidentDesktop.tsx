'use client';

import Image from 'next/image';
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Recording } from '@/app/work/Recordings';
import { TopBar } from '@/components/topbar/TopBar';
import type { TopBarAction } from '@/components/topbar/menus';
import { Button } from '@/components/ui/button';
import { WindowManager } from '@/components/windows/WindowManager';
import { BootSequence } from '@/components/desktop/BootSequence';
import { DesktopScreensaver } from '@/components/desktop/DesktopScreensaver';
import { MinimisedDock } from '@/components/desktop/MinimisedDock';
import { DESKTOP_MOTION } from '@/lib/desktop-motion';
import { getDesktopFile } from '@/lib/desktop-files';
import { getDockAppId } from '@/lib/dock-apps';
import { ChamberIntercom } from '@/components/desktop/ChamberIntercom';
import { useChamberWorld } from '@/lib/hooks/use-chamber-world';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';
import {
  SIGIL_ID,
  bringAllToFront,
  closeWindow,
  createWindow,
  focusWindow,
  getFocusedWindow,
  minimiseWindow,
  restoreWindow,
  type AppId,
  type ChamberWindow
} from '@/lib/windowStore';
import { cn } from '@/lib/utils';

interface DesktopShortcut {
  id: string;
  label: string;
  hint: string;
  iconSrc: string;
  appId: AppId;
  entryId: string;
}

interface Point {
  x: number;
  y: number;
}

interface WorkspaceSize {
  width: number;
  height: number;
}

interface DragShortcutState {
  id: string;
  offsetX: number;
  offsetY: number;
  moved: boolean;
}

interface DragWindowState {
  id: string;
  offsetX: number;
  offsetY: number;
}

type SystemStage = 'boot' | 'login' | 'desktop';
type AccountId = 'Knight' | 'Ghost' | 'Bat' | 'Parker' | 'Samuel';
type AccountStatus = 'available' | 'locked' | 'banned';

interface LoginAccount {
  id: AccountId;
  status: AccountStatus;
  summary: string;
}

const SHORTCUT_CARD_WIDTH = 150;
const SHORTCUT_CARD_HEIGHT = 126;
const SHORTCUT_GRID_X = 168;
const SHORTCUT_GRID_Y = 142;
const SHORTCUT_MARGIN = 12;
const CHAMBER_OS_USER_KEY = 'chamber_os_user';
const CHAMBER_OS_LOGGED_IN_KEY = 'chamber_os_logged_in';
const LOGIN_ACCOUNTS: LoginAccount[] = [
  { id: 'Knight', status: 'available', summary: 'visitor access' },
  { id: 'Ghost', status: 'locked', summary: 'password required' },
  { id: 'Bat', status: 'locked', summary: 'password required' },
  { id: 'Parker', status: 'locked', summary: 'password required' },
  { id: 'Samuel', status: 'banned', summary: 'account disabled (banned)' }
];

const LOCKED_ERROR_POOL = [
  'Password incorrect.',
  'Access denied. (credential mismatch)',
  'Local key required.',
  'This profile is not available on this machine.',
  'Handshake failed. (signal dropped)',
  'That password is real somewhere else.',
  'Error 17B: queue token missing.',
  'This login is ceremonial only.',
  'Chamber policy: visitors may not assume identities.',
  'Password accepted. User rejected.'
] as const;

const DESKTOP_SHORTCUTS: DesktopShortcut[] = [
  { id: 'frnge', label: 'FRNGE/', hint: 'profile, contact and releases', iconSrc: '/icons/breeze/folder.svg', appId: 'files', entryId: 'frnge-folder' },
  { id: 'releases', label: 'SECOND LIFE/', hint: 'six audio files', iconSrc: '/icons/breeze/folder.svg', appId: 'files', entryId: 'second-life' },
  { id: 'listen', label: 'UNSORTED/', hint: 'empty folder', iconSrc: '/icons/breeze/folder.svg', appId: 'files', entryId: 'unsorted' },
  { id: 'contact', label: 'INCOMING/', hint: 'delivered files', iconSrc: '/icons/breeze/folder.svg', appId: 'files', entryId: 'incoming' },
  { id: 'games', label: 'GAMES/', hint: 'two games', iconSrc: '/icons/breeze/folder.svg', appId: 'files', entryId: 'games' },
  { id: 'chamber', label: 'CHAMBER/', hint: 'records and desk fragments', iconSrc: '/icons/breeze/folder.svg', appId: 'files', entryId: 'chamber' }
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildInitialShortcutPositions(width: number, height: number): Record<string, Point> {
  // Leave the upper-left corner for Chamber Line; folders form a separate,
  // predictable two-column grid on the right of the desktop.
  const left = Math.max(320, width - SHORTCUT_GRID_X - SHORTCUT_CARD_WIDTH - 32);
  const top = Math.min(32, Math.max(SHORTCUT_MARGIN, height - SHORTCUT_GRID_Y * 3));
  return {
    frnge: { x: left, y: top },
    releases: { x: left + SHORTCUT_GRID_X, y: top },
    chamber: { x: left, y: top + SHORTCUT_GRID_Y },
    contact: { x: left + SHORTCUT_GRID_X, y: top + SHORTCUT_GRID_Y },
    games: { x: left + SHORTCUT_GRID_X, y: top + SHORTCUT_GRID_Y * 2 },
    listen: { x: left, y: top + SHORTCUT_GRID_Y * 2 }
  };
}

function clampShortcutPoint(point: Point, workspace: WorkspaceSize): Point {
  return {
    x: clamp(point.x, SHORTCUT_MARGIN, Math.max(SHORTCUT_MARGIN, workspace.width - SHORTCUT_CARD_WIDTH - SHORTCUT_MARGIN)),
    y: clamp(point.y, SHORTCUT_MARGIN, Math.max(SHORTCUT_MARGIN, workspace.height - SHORTCUT_CARD_HEIGHT - SHORTCUT_MARGIN))
  };
}

function snapShortcutPoint(point: Point, workspace: WorkspaceSize): Point {
  const snapped = {
    x: SHORTCUT_MARGIN + Math.round((point.x - SHORTCUT_MARGIN) / SHORTCUT_GRID_X) * SHORTCUT_GRID_X,
    y: SHORTCUT_MARGIN + Math.round((point.y - SHORTCUT_MARGIN) / SHORTCUT_GRID_Y) * SHORTCUT_GRID_Y
  };

  return clampShortcutPoint(snapped, workspace);
}

function getRenderedWindowSize(window: ChamberWindow, workspace: WorkspaceSize, uiScale: number): { width: number; height: number } {
  const maxWidth = Math.max(320, workspace.width - 12);
  const maxHeight = Math.max(260, workspace.height - 12);

  return {
    width: Math.min(Math.round(window.width * uiScale), maxWidth),
    height: Math.min(Math.round(window.height * uiScale), maxHeight)
  };
}

function clampWindowPoint(window: ChamberWindow, point: Point, workspace: WorkspaceSize, uiScale: number): Point {
  const size = getRenderedWindowSize(window, workspace, uiScale);

  return {
    x: clamp(point.x, 4, Math.max(4, workspace.width - size.width - 4)),
    y: clamp(point.y, 4, Math.max(4, workspace.height - size.height - 4))
  };
}

function getTopWindowId(windows: ChamberWindow[]): string | null {
  if (windows.length === 0) {
    return null;
  }

  return [...windows].sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null;
}

function statusDotClass(status: AccountStatus): string {
  if (status === 'available') {
    return 'bg-[#28c840]';
  }
  if (status === 'banned') {
    return 'bg-[#ff5f57]';
  }
  return 'bg-[#febc2e]';
}

function ShortcutGlyph({ iconSrc }: { iconSrc: string }) {
  return (
    <span data-shortcut-glyph aria-hidden="true" className="mx-auto flex h-[68px] w-[68px] items-center justify-center">
      <Image src={iconSrc} alt="" width={68} height={68} unoptimized loading="eager" className="breeze-icon h-[68px] w-[68px] object-contain" />
    </span>
  );
}

function getShortcutOrigin(button: HTMLButtonElement): Point {
  const bounds = (button.querySelector('[data-shortcut-glyph]') ?? button).getBoundingClientRect();
  return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
}

export default function ResidentDesktop() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const minimiseTimersRef = useRef<Record<string, number>>({});
  const dockRestoreTimersRef = useRef<Record<string, number>>({});
  const movedShortcutIdsRef = useRef(new Set<string>());
  const isMobile = useIsMobile();
  const world = useChamberWorld();

  const [systemStage, setSystemStage] = useState<SystemStage>('boot');
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<AccountId>('Knight');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lastErrorIndex, setLastErrorIndex] = useState<number>(-1);
  const [windows, setWindows] = useState<ChamberWindow[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const uiScale = 1;
  const [toast, setToast] = useState<string | null>(null);
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSize>({ width: 1200, height: 760 });
  const [shortcutPositions, setShortcutPositions] = useState<Record<string, Point>>({});
  const [dragShortcut, setDragShortcut] = useState<DragShortcutState | null>(null);
  const [blockedShortcutOpenId, setBlockedShortcutOpenId] = useState<string | null>(null);
  const [dragWindow, setDragWindow] = useState<DragWindowState | null>(null);
  const [minimisingWindowIds, setMinimisingWindowIds] = useState<string[]>([]);
  const [restoringWindowIds, setRestoringWindowIds] = useState<string[]>([]);
  const [screensaverPreview, setScreensaverPreview] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [calendarRecording, setCalendarRecording] = useState<Recording | null>(null);
  const [autoplayToken, setAutoplayToken] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rememberedUser = window.localStorage.getItem(CHAMBER_OS_USER_KEY);
    const rememberedLogin = window.localStorage.getItem(CHAMBER_OS_LOGGED_IN_KEY);

    if (rememberedUser === 'Knight' && rememberedLogin === 'true') {
      setSystemStage('desktop');

    } else {
      setSystemStage('boot');

    }

    setSessionHydrated(true);
  }, []);

  const setKnightSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHAMBER_OS_USER_KEY, 'Knight');
      window.localStorage.setItem(CHAMBER_OS_LOGGED_IN_KEY, 'true');
    }
    setLoginError(null);
    setLoginPassword('');
    setSystemStage('desktop');
  }, []);

  const completeBoot = useCallback(() => setSystemStage('login'), []);

  useEffect(
    () => () => {
      Object.values(minimiseTimersRef.current).forEach((timer) => window.clearTimeout(timer));
      Object.values(dockRestoreTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    },
    []
  );

  useEffect(() => {
    if (systemStage !== 'desktop' || !workspaceRef.current) {
      return;
    }

    const node = workspaceRef.current;

    const update = () => {
      const nextWorkspace = {
        width: node.clientWidth,
        height: node.clientHeight
      };
      setWorkspace(nextWorkspace);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, [systemStage, isMobile]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    setShortcutPositions((current) => {
      const fallback = buildInitialShortcutPositions(workspace.width, workspace.height);
      const next: Record<string, Point> = {};

      for (const shortcut of DESKTOP_SHORTCUTS) {
        const currentPoint = movedShortcutIdsRef.current.has(shortcut.id)
          ? current[shortcut.id] ?? fallback[shortcut.id]
          : fallback[shortcut.id];
        next[shortcut.id] = clampShortcutPoint(currentPoint, workspace);
      }

      return next;
    });

    setWindows((current) =>
      current.map((window) => ({
        ...window,
        ...clampWindowPoint(window, { x: window.x, y: window.y }, workspace, uiScale)
      }))
    );
  }, [isMobile, uiScale, workspace]);

  useEffect(() => {
    if (!dragShortcut || isMobile) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const point = { x: event.clientX - rect.left - dragShortcut.offsetX, y: event.clientY - rect.top - dragShortcut.offsetY };
      const previous = shortcutPositions[dragShortcut.id];
      if (!dragShortcut.moved && previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 4) return;
      movedShortcutIdsRef.current.add(dragShortcut.id);

      setShortcutPositions((current) => ({
        ...current,
        [dragShortcut.id]: clampShortcutPoint(
          point,
          workspace
        )
      }));

      setDragShortcut((state) => (state && !state.moved ? { ...state, moved: true } : state));
    };

    const handleUp = () => {
      if (dragShortcut.moved) {
        setShortcutPositions((current) => {
          const point = current[dragShortcut.id];
          if (!point) return current;
          return { ...current, [dragShortcut.id]: snapShortcutPoint(point, workspace) };
        });
      }

      if (dragShortcut.moved) {
        setBlockedShortcutOpenId(dragShortcut.id);
      }
      setDragShortcut(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragShortcut, isMobile, workspace, shortcutPositions]);

  useEffect(() => {
    if (!blockedShortcutOpenId) {
      return;
    }

    const timer = window.setTimeout(() => setBlockedShortcutOpenId(null), 120);
    return () => window.clearTimeout(timer);
  }, [blockedShortcutOpenId]);

  useEffect(() => {
    if (!dragWindow || isMobile) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setWindows((current) =>
        current.map((window) => {
          if (window.id !== dragWindow.id) {
            return window;
          }

          return {
            ...window,
            ...clampWindowPoint(
              window,
              {
                x: event.clientX - rect.left - dragWindow.offsetX,
                y: event.clientY - rect.top - dragWindow.offsetY
              },
              workspace,
              uiScale
            )
          };
        })
      );
    };

    const handleUp = () => setDragWindow(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragWindow, isMobile, uiScale, workspace]);

  const openWindowForApp = useCallback(
    (requestedAppId: AppId, openOrigin?: Point, requestedEntryId?: string) => {
      const fileEntries: Partial<Record<AppId, string>> = { about: 'profile', library: 'releases', support: 'streams', steal: 'contact', 'lore-index': 'chamber', documents: 'desktop', downloads: 'second-life' };
      const entryId = requestedEntryId ?? fileEntries[requestedAppId] ?? 'desktop';
      const appId = requestedAppId === 'files' || fileEntries[requestedAppId] ? 'files' : requestedAppId;
      const title = entryId === 'desktop' ? 'Files' : getDesktopFile(entryId).name;
      const existing = (appId === 'files' || appId === 'listen') ? windows.find(item => item.appId === appId) : undefined;
      if (existing) {
        setWindows(current => {
          const restored = existing.isMinimised ? restoreWindow(current, existing.id) : current;
          const updated = appId === 'files' ? restored.map(item => item.id === existing.id
            ? { ...item, entryId, title, restoreOrigin: existing.isMinimised ? openOrigin : item.restoreOrigin }
            : item) : restored;
          return focusWindow(updated, existing.id);
        });
        setFocusedWindowId(existing.id);
        if (!existing.isMinimised) {
          document.querySelector<HTMLElement>(`[data-chamber-window="${CSS.escape(existing.id)}"]`)?.focus({ preventScroll: true });
        }
        return;
      }
      // Generate the identity once: React may replay state updaters in development.
      const nextWindow = { ...createWindow(appId, windows), openOrigin, ...(appId === 'files' ? { entryId, title } : {}) };
      setWindows((current) => {
        const clamped = isMobile
          ? nextWindow
          : {
              ...nextWindow,
              ...clampWindowPoint(nextWindow, { x: nextWindow.x, y: nextWindow.y }, workspace, uiScale)
            };

        setFocusedWindowId(clamped.id);
        return [...current, clamped];
      });
    },
    [isMobile, uiScale, workspace, windows]
  );

  function playTrack(trackId: string) {
    setCalendarRecording(null);
    setSelectedTrackId(trackId);
    setAutoplayToken(current => current + 1);
    openWindowForApp('listen');
  }
  function playCalendarRecording(file: Recording) {
    setCalendarRecording(file);
    openWindowForApp('listen');
  }

  const focusById = useCallback((windowId: string) => {
    setWindows((current) => getTopWindowId(current.filter((item) => !item.isMinimised)) === windowId
      ? current : focusWindow(current, windowId));
    setFocusedWindowId(windowId);
  }, []);

  const closeById = useCallback(
    (windowId: string) => {
      setWindows((current) => {
        const next = closeWindow(current, windowId);
        const focusCandidates = isMobile ? next.filter((window) => !window.isMinimised) : next;
        setFocusedWindowId((focused) => (focused === windowId ? getTopWindowId(focusCandidates) : focused));
        return next;
      });
    },
    [isMobile]
  );

  const minimiseById = useCallback((windowId: string) => {
    if (minimiseTimersRef.current[windowId]) {
      return;
    }

    setMinimisingWindowIds((current) => (current.includes(windowId) ? current : [...current, windowId]));

    minimiseTimersRef.current[windowId] = window.setTimeout(() => {
      setWindows((current) => {
        const next = minimiseWindow(current, windowId);
        setFocusedWindowId((focused) => {
          if (focused !== windowId) {
            return focused;
          }
          const visible = next.filter((window) => !window.isMinimised);
          return getTopWindowId(visible);
        });
        return next;
      });
      setMinimisingWindowIds((current) => current.filter((id) => id !== windowId));
      delete minimiseTimersRef.current[windowId];
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DESKTOP_MOTION.minimise + DESKTOP_MOTION.settle);
  }, []);

  const startWindowDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>, windowId: string) => {
      if (isMobile || event.button !== 0 || minimiseTimersRef.current[windowId]) {
        return;
      }

      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const target = windows.find((window) => window.id === windowId);
      if (!target) {
        return;
      }

      setDragWindow({
        id: windowId,
        offsetX: event.clientX - rect.left - target.x,
        offsetY: event.clientY - rect.top - target.y
      });

      focusById(windowId);
    },
    [focusById, isMobile, windows]
  );

  const hasMobileForeground = windows.some((window) => window.id === focusedWindowId && !window.isMinimised);
  const selectedAccount = LOGIN_ACCOUNTS.find((account) => account.id === selectedAccountId) ?? LOGIN_ACCOUNTS[0];
  const handleTopBarAction = useCallback(
    (action: TopBarAction) => {
      if (action.type === 'preview-screensaver') {
        setScreensaverPreview((value) => value + 1);
        return;
      }
      if (action.type === 'open-window') {
        openWindowForApp(action.appId);
        return;
      }

      if (action.type === 'new-window') {
        openWindowForApp(getFocusedWindow(windows, focusedWindowId)?.appId ?? 'notes');
        return;
      }

      if (action.type === 'close-focused-window') {
        if (!focusedWindowId) {
          return;
        }
        closeById(focusedWindowId);
        return;
      }

      if (action.type === 'reset-desktop') {
        Object.values(minimiseTimersRef.current).forEach((timer) => window.clearTimeout(timer));
        minimiseTimersRef.current = {};
        Object.values(dockRestoreTimersRef.current).forEach((timer) => window.clearTimeout(timer));
        dockRestoreTimersRef.current = {};
        setMinimisingWindowIds([]);
        setRestoringWindowIds([]);
        movedShortcutIdsRef.current.clear();
        setWindows([]);
        setFocusedWindowId(null);
        setSelectedShortcutId(null);
        setShortcutPositions(buildInitialShortcutPositions(workspace.width, workspace.height));
        setToast('desktop reset');
        return;
      }

      if (action.type === 'copy-sigil-id') {
        void navigator.clipboard
          .writeText(SIGIL_ID)
          .then(() => setToast('sigil copied'))
          .catch(() => setToast('clipboard unavailable'));
        return;
      }

      if (action.type === 'paste') {
        setToast('paste has no target');
        return;
      }

      if (action.type === 'focus-desktop') {
        setFocusedWindowId(null);
        setSelectedShortcutId(null);
        return;
      }

      if (action.type === 'minimise-focused-window') {
        if (!focusedWindowId) {
          return;
        }
        minimiseById(focusedWindowId);
        return;
      }

      if (action.type === 'bring-all-to-front') {
        setWindows((current) => bringAllToFront(current));
        return;
      }

      if (action.type === 'focus-window') {
        setWindows((current) => {
          const target = current.find((window) => window.id === action.windowId);
          if (!target) {
            return current;
          }

          let next = current;
          if (target.isMinimised) {
            next = restoreWindow(next, target.id);
          }
          return focusWindow(next, target.id);
        });
        setFocusedWindowId(action.windowId);
      }
    },
    [closeById, focusedWindowId, minimiseById, openWindowForApp, workspace, windows]
  );

  const restartFromLogin = useCallback(() => {
    setLoginError(null);
    setLoginPassword('');
    setSelectedAccountId('Knight');

    setSystemStage('boot');
  }, []);

  const logoutToLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHAMBER_OS_USER_KEY);
      window.localStorage.removeItem(CHAMBER_OS_LOGGED_IN_KEY);
    }

    setWindows([]);
    Object.values(dockRestoreTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    dockRestoreTimersRef.current = {};
    setFocusedWindowId(null);
    setRestoringWindowIds([]);
    setLoginError(null);
    setLoginPassword('');
    setSelectedAccountId('Knight');
    setSystemStage('login');
  }, []);

  const handleLockedAttempt = useCallback(() => {
    const poolLength = LOCKED_ERROR_POOL.length;
    const randomIndex = Math.floor(Math.random() * (poolLength - 1));
    const nextIndex = randomIndex >= lastErrorIndex ? randomIndex + 1 : randomIndex;
    setLastErrorIndex(nextIndex);
    setLoginError(LOCKED_ERROR_POOL[nextIndex]);
    setLoginPassword('');
  }, [lastErrorIndex]);

  const intercom = (
    <ChamberIntercom
      ready={world.ready}
      durable={world.durable}
      stage={world.stage}
      progress={world.progress}
      onReply={world.reply}
      onClose={world.close}
      onOpenFile={(entryId, origin) => openWindowForApp('files', origin, entryId)}
    />
  );

  if (!sessionHydrated) {
    return <main className="min-h-dvh bg-black" />;
  }

  if (systemStage === 'boot') return <BootSequence onComplete={completeBoot} />;

  if (systemStage === 'login') {
    return (
      <main className="relative min-h-dvh bg-[#070708] text-text">
        <section className="flex min-h-dvh items-center justify-center p-4 sm:p-7">
          <div className="w-full max-w-[660px] overflow-hidden rounded-[10px] border border-[#48484d] bg-[#0d0d0f] shadow-[0_18px_50px_rgba(0,0,0,.48)]">
            <header className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-[#303034] bg-black/35 px-3 py-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src="/chamber-logo.svg"
                  alt="Chamber Collective"
                  width={38}
                  height={20}
                  className="h-5 w-[38px] [filter:brightness(0)_invert(1)]"
                  priority
                />
                <a href="/" className="system-title text-text underline underline-offset-4">home</a>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={restartFromLogin}>restart</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setLoginPassword('')}>shut down</Button>
              </div>
            </header>

            <div className="flex min-h-[470px] flex-col px-5 py-6 sm:px-8">
              <section className="flex min-h-[282px] flex-col items-center text-center">
                <p className="text-sm text-muted">FRNGE</p>
                <h1 className="mt-2 font-identity text-3xl text-text">Second Life</h1>

                <span
                  className={cn(
                    'mt-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-[#4a4a4f] bg-black/25 font-machine text-base',
                    selectedAccount.status === 'banned' ? 'text-[#ff7770]' : 'text-[#ededeb]'
                  )}
                >
                  {selectedAccount.id.slice(0, 2).toUpperCase()}
                </span>
                <p className="mt-3 text-base text-text">{selectedAccount.id}</p>
                <p className="mt-1 text-sm text-muted">{selectedAccount.summary}</p>

                <div className="mt-5 flex min-h-[122px] w-full max-w-[360px] flex-col justify-start gap-2.5">
                  {selectedAccount.status === 'available' ? (
                    <>
                      <Button type="button" className="w-full" onClick={setKnightSession}>log in</Button>
                      <p className="text-xs text-muted">enter the desktop</p>
                    </>
                  ) : null}

                  {selectedAccount.status === 'locked' ? (
                    <>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleLockedAttempt();
                          }
                        }}
                        placeholder="password"
                        aria-label="Password"
                        className="h-10 w-full rounded-md border border-border bg-black/30 px-3 text-base text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      />
                      <Button type="button" className="w-full" onClick={handleLockedAttempt}>unlock</Button>
                      <p className="min-h-4 text-xs text-[#ff7f7f]">{loginError}</p>
                    </>
                  ) : null}

                  {selectedAccount.status === 'banned' ? (
                    <p className="rounded-md border border-[#ff5f57]/55 bg-[#ff5f57]/10 px-3 py-3 text-sm text-[#ff9d9d]">Account disabled.</p>
                  ) : null}
                </div>
              </section>

              <section className="mt-auto border-t border-[#303034] pt-4">
                <p className="mb-3 text-center text-xs text-muted">linked accounts</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {LOGIN_ACCOUNTS.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      aria-label={`${account.id}, ${account.status}`}
                      aria-pressed={selectedAccountId === account.id}
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setLoginPassword('');
                        setLoginError(account.status === 'banned' ? 'Account disabled.' : null);
                      }}
                      className={cn(
                        'group flex min-w-0 flex-col items-center gap-1.5 rounded-md px-1 py-2 text-xs transition-colors duration-ui ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        selectedAccountId === account.id ? 'bg-white/[0.08] text-text' : 'text-muted hover:bg-white/[0.04] hover:text-text'
                      )}
                    >
                      <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#414146] bg-black/25 font-machine text-[11px]">
                        {account.id.slice(0, 2).toUpperCase()}
                        <span className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0d0d0f]', statusDotClass(account.status))} />
                      </span>
                      <span className="w-full break-words text-center">{account.id}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="chamber-desktop min-h-dvh overflow-hidden bg-bg text-text">
      <TopBar windows={windows} focusedWindowId={focusedWindowId} onAction={handleTopBarAction} onLogout={logoutToLogin} onRecording={playCalendarRecording} />

      <section className="chamber-workspace-layout relative h-dvh pb-[84px] pt-10">
        <div className="absolute inset-0 bg-[#0b0b0c]" />

        <div ref={workspaceRef} className="chamber-workspace relative h-full w-full">
          {!isMobile ? <div className="absolute left-6 top-8 max-h-[calc(100%_-_40px)] w-[264px] overflow-y-auto overscroll-contain">{intercom}</div> : null}
          {isMobile ? (
            <div
              hidden={hasMobileForeground}
              className={cn('chamber-shortcuts-mobile pointer-events-auto mx-auto w-full max-w-[620px] grid-cols-2 gap-3 p-3', hasMobileForeground ? 'hidden' : 'grid')}
            >
              <div className="col-span-2">{intercom}</div>
              {DESKTOP_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={(event) => {
                    setSelectedShortcutId(shortcut.id);
                    openWindowForApp(shortcut.appId, getShortcutOrigin(event.currentTarget), shortcut.entryId);
                  }}
                  className={cn(
                    'group min-h-[118px] min-w-0 rounded-md bg-transparent px-3 py-3 text-center transition-colors duration-ui ease-calm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    selectedShortcutId === shortcut.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  )}
                  aria-label={`${shortcut.label}. ${shortcut.hint}`}
                >
                  <ShortcutGlyph iconSrc={shortcut.iconSrc} />
                  <span className="mx-auto mt-2 block max-w-[132px] break-words text-center text-base leading-tight text-text">{shortcut.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0">
              <div className="relative h-full w-full">
                {DESKTOP_SHORTCUTS.map((shortcut) => {
                  const point = shortcutPositions[shortcut.id] ?? buildInitialShortcutPositions(workspace.width, workspace.height)[shortcut.id];

                  return (
                    <button
                      key={shortcut.id}
                      type="button"
                      style={{ left: point.x, top: point.y, width: SHORTCUT_CARD_WIDTH, minHeight: SHORTCUT_CARD_HEIGHT }}
                      onClick={(event) => {
                        if (blockedShortcutOpenId === shortcut.id) {
                          setBlockedShortcutOpenId(null);
                          return;
                        }
                        setSelectedShortcutId(shortcut.id);
                        openWindowForApp(shortcut.appId, getShortcutOrigin(event.currentTarget), shortcut.entryId);
                      }}
                      onPointerDown={(event) => {
                        const rect = workspaceRef.current?.getBoundingClientRect();
                        if (!rect) {
                          return;
                        }

                        event.preventDefault();
                        setSelectedShortcutId(shortcut.id);
                        setDragShortcut({
                          id: shortcut.id,
                          offsetX: event.clientX - rect.left - point.x,
                          offsetY: event.clientY - rect.top - point.y,
                          moved: false
                        });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openWindowForApp(shortcut.appId, getShortcutOrigin(event.currentTarget), shortcut.entryId);
                        }
                      }}
                      className={cn(
                        'group pointer-events-auto absolute min-h-[96px] select-none rounded-md bg-transparent px-3 py-2 text-center transition-colors duration-ui ease-calm',
                        'cursor-grab active:cursor-grabbing',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        selectedShortcutId === shortcut.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                      )}
                      aria-label={`${shortcut.label}. ${shortcut.hint}`}
                    >
                      <ShortcutGlyph iconSrc={shortcut.iconSrc} />
                      <span className="mx-auto mt-2 block max-w-[132px] break-words text-center text-base leading-tight text-text">{shortcut.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <WindowManager
            tillProgress={world}
            deliveredFileIds={world.deliveredFileIds}
            onFileRead={world.markFileRead}
            onNavigateFiles={(windowId, entryId) => setWindows((current) => current.map((item) => item.id === windowId
              ? { ...item, entryId, title: entryId === 'desktop' ? 'files' : getDesktopFile(entryId).name }
              : item))}
            windows={windows}
            focusedWindowId={focusedWindowId}
            calendarRecording={calendarRecording}
            activeTrackId={selectedTrackId}
            autoplayToken={autoplayToken}
            uiScale={uiScale}
            workspaceSize={workspace}
            minimisingWindowIds={minimisingWindowIds}
            onOpenWindow={openWindowForApp}
            onPlayTrack={playTrack}
            onFocusWindow={focusById}
            onCloseWindow={closeById}
            onMinimiseWindow={minimiseById}
            onRestoreWindow={windowId => handleTopBarAction({ type: 'focus-window', windowId })}
            onWindowDragStart={startWindowDrag}
          />
        </div>

        <MinimisedDock
          windows={windows}
          focusedWindowId={focusedWindowId}
          busyWindowIds={[...minimisingWindowIds, ...restoringWindowIds]}
          onActivate={(appId, origin) => {
            const target = windows.filter((item) => getDockAppId(item.appId) === appId).sort((a, b) => b.zIndex - a.zIndex)[0];
            if (!target) {
              openWindowForApp(appId, origin);
              return;
            }
            if (target.isMinimised) {
              setRestoringWindowIds((current) => current.includes(target.id) ? current : [...current, target.id]);
              dockRestoreTimersRef.current[target.id] = window.setTimeout(() => {
                setRestoringWindowIds((current) => current.filter((id) => id !== target.id));
                delete dockRestoreTimersRef.current[target.id];
              }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DESKTOP_MOTION.open + DESKTOP_MOTION.settle);
            }
            setWindows((current) => focusWindow(current.map((item) => item.id === target.id && item.isMinimised ? { ...item, restoreOrigin: origin } : item), target.id));
            setFocusedWindowId(target.id);
            if (!target.isMinimised) {
              document.querySelector<HTMLElement>(`[data-chamber-window="${CSS.escape(target.id)}"]`)?.focus({ preventScroll: true });
            }
          }}
        />
      </section>

      <DesktopScreensaver autoStart={!isMobile} previewToken={screensaverPreview} />

      {toast ? (
        <div className="fixed right-4 top-12 z-[70] rounded-md border border-border bg-[#111113] px-3 py-2 text-sm text-text">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
