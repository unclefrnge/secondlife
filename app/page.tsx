'use client';

import Image from 'next/image';
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TopBar } from '@/components/topbar/TopBar';
import type { TopBarAction } from '@/components/topbar/menus';
import { Button } from '@/components/ui/button';
import { WindowManager } from '@/components/windows/WindowManager';
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
type BootPhase = 'post' | 'manager' | 'loader' | 'handoff';
type AccountId = 'Knight' | 'Ghost' | 'Bat' | 'Parker' | 'Samuel';
type AccountStatus = 'available' | 'locked' | 'banned';

interface LoginAccount {
  id: AccountId;
  status: AccountStatus;
  summary: string;
}

const SHORTCUT_CARD_WIDTH = 184;
const SHORTCUT_CARD_HEIGHT = 126;
const SHORTCUT_GRID_X = 200;
const SHORTCUT_GRID_Y = 132;
const SHORTCUT_MARGIN = 12;
const BOOT_TOTAL_MS = 4000;
const CHAMBER_OS_USER_KEY = 'chamber_os_user';
const CHAMBER_OS_LOGGED_IN_KEY = 'chamber_os_logged_in';
const BOOT_PHASE_TIMING = {
  postEnd: Math.round(BOOT_TOTAL_MS * (1700 / 7000)),
  managerEnd: Math.round(BOOT_TOTAL_MS * (2600 / 7000)),
  loaderEnd: Math.round(BOOT_TOTAL_MS * (6800 / 7000)),
  handoffEnd: BOOT_TOTAL_MS
} as const;

const POST_LINES = [
  'CHAMBER BIOS v0.2.13',
  'CPU: EMU CORE OK',
  'MEM: 16384MB OK',
  'VIDEO: VGA OK',
  'USB: 2 devices detected',
  'SATA0: CHMBR_DRIVE_01 OK',
  'NET: LINK UP',
  '[POST] salt integrity........ OK',
  '[POST] kombucha viscosity..... OK',
  'Press F2 for Setup, F12 Boot Menu'
] as const;

const LOADER_LINES = [
  'initialising kernel...',
  'mounting /archive...',
  'loading drivers...',
  'applying edicts...',
  'starting services...',
  'starting shell...'
] as const;

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
  {
    id: 'frnge',
    label: 'who is frnge',
    hint: 'artist profile',
    iconSrc: '/desktop-icons/who-is-frnge.png',
    appId: 'about'
  },
  {
    id: 'releases',
    label: 'discography',
    hint: 'discography archive',
    iconSrc: '/desktop-icons/discography.png',
    appId: 'library'
  },
  {
    id: 'listen',
    label: 'where 2 stream',
    hint: 'external platforms',
    iconSrc: '/desktop-icons/where-2-stream.png',
    appId: 'support'
  },
  {
    id: 'contact',
    label: 'contact',
    hint: 'booking and links',
    iconSrc: '/desktop-icons/contact.png',
    appId: 'steal'
  },
  {
    id: 'chamber',
    label: 'chamber collective',
    hint: 'collective portal',
    iconSrc: '/desktop-icons/chamber-collective.png',
    appId: 'lore-index'
  }
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildInitialShortcutPositions(width: number): Record<string, Point> {
  const right = Math.max(SHORTCUT_MARGIN, width - SHORTCUT_CARD_WIDTH - SHORTCUT_MARGIN);

  return {
    frnge: { x: SHORTCUT_MARGIN, y: SHORTCUT_MARGIN },
    releases: { x: SHORTCUT_MARGIN, y: SHORTCUT_MARGIN + SHORTCUT_GRID_Y },
    listen: { x: SHORTCUT_MARGIN, y: SHORTCUT_MARGIN + SHORTCUT_GRID_Y * 2 },
    contact: { x: right, y: SHORTCUT_MARGIN },
    chamber: { x: right, y: SHORTCUT_MARGIN + SHORTCUT_GRID_Y }
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

function getBootPhase(elapsedMs: number): BootPhase {
  if (elapsedMs < BOOT_PHASE_TIMING.postEnd) {
    return 'post';
  }
  if (elapsedMs < BOOT_PHASE_TIMING.managerEnd) {
    return 'manager';
  }
  if (elapsedMs < BOOT_PHASE_TIMING.loaderEnd) {
    return 'loader';
  }
  return 'handoff';
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

function ShortcutGlyph({ iconSrc, priority = false }: { iconSrc: string; priority?: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-[68px] w-[68px] items-center justify-center">
      <Image src={iconSrc} alt="" width={68} height={68} unoptimized priority={priority} className="h-[68px] w-[68px] object-contain" />
    </span>
  );
}

function getAppIconSrc(appId: AppId): string {
  const iconByApp: Partial<Record<AppId, string>> = {
    about: '/desktop-icons/who-is-frnge.png',
    library: '/desktop-icons/discography.png',
    support: '/desktop-icons/where-2-stream.png',
    steal: '/desktop-icons/contact.png',
    'lore-index': '/desktop-icons/chamber-collective.png',
    'text-quest': '/desktop-icons/chamber-quest.svg',
    listen: '/desktop-icons/listen-to-second-life.svg'
  };

  return iconByApp[appId] ?? '/chamber-logo.svg';
}

export default function HomePage() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const bootTimerRef = useRef<number | null>(null);
  const minimiseTimersRef = useRef<Record<string, number>>({});
  const isMobile = useIsMobile();

  const [systemStage, setSystemStage] = useState<SystemStage>('boot');
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [bootElapsedMs, setBootElapsedMs] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<AccountId>('Knight');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lastErrorIndex, setLastErrorIndex] = useState<number>(-1);
  const [windows, setWindows] = useState<ChamberWindow[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [uiScale, setUiScale] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSize>({ width: 1200, height: 760 });
  const [shortcutPositions, setShortcutPositions] = useState<Record<string, Point>>(() => buildInitialShortcutPositions(1200));
  const [dragShortcut, setDragShortcut] = useState<DragShortcutState | null>(null);
  const [blockedShortcutOpenId, setBlockedShortcutOpenId] = useState<string | null>(null);
  const [dragWindow, setDragWindow] = useState<DragWindowState | null>(null);
  const [minimisingWindowIds, setMinimisingWindowIds] = useState<string[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [autoplayToken, setAutoplayToken] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rememberedUser = window.localStorage.getItem(CHAMBER_OS_USER_KEY);
    const rememberedLogin = window.localStorage.getItem(CHAMBER_OS_LOGGED_IN_KEY);

    if (rememberedUser === 'Knight' && rememberedLogin === 'true') {
      setSystemStage('desktop');
      setBootElapsedMs(BOOT_TOTAL_MS);
    } else {
      setSystemStage('boot');
      setBootElapsedMs(0);
    }

    setSessionHydrated(true);
  }, []);

  const completeBoot = useCallback(() => {
    if (bootTimerRef.current !== null) {
      window.clearInterval(bootTimerRef.current);
      bootTimerRef.current = null;
    }
    setBootElapsedMs(BOOT_TOTAL_MS);
    setSystemStage('login');
  }, []);

  useEffect(() => {
    if (!sessionHydrated || systemStage !== 'boot') {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= BOOT_TOTAL_MS) {
        completeBoot();
        return;
      }
      setBootElapsedMs(elapsed);
    }, 50);
    bootTimerRef.current = timer;

    return () => {
      window.clearInterval(timer);
      bootTimerRef.current = null;
    };
  }, [completeBoot, sessionHydrated, systemStage]);

  useEffect(
    () => () => {
      Object.values(minimiseTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    },
    []
  );

  useEffect(() => {
    if (!workspaceRef.current) {
      return;
    }

    const node = workspaceRef.current;

    const update = () => {
      setWorkspace({
        width: node.clientWidth,
        height: node.clientHeight
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

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
      const fallback = buildInitialShortcutPositions(workspace.width);
      const next: Record<string, Point> = {};

      for (const shortcut of DESKTOP_SHORTCUTS) {
        const currentPoint = current[shortcut.id] ?? fallback[shortcut.id] ?? { x: SHORTCUT_MARGIN, y: SHORTCUT_MARGIN };
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

      setShortcutPositions((current) => ({
        ...current,
        [dragShortcut.id]: clampShortcutPoint(
          {
            x: event.clientX - rect.left - dragShortcut.offsetX,
            y: event.clientY - rect.top - dragShortcut.offsetY
          },
          workspace
        )
      }));

      setDragShortcut((state) => (state && !state.moved ? { ...state, moved: true } : state));
    };

    const handleUp = () => {
      setShortcutPositions((current) => {
        const point = current[dragShortcut.id];
        if (!point) {
          return current;
        }

        return {
          ...current,
          [dragShortcut.id]: snapShortcutPoint(point, workspace)
        };
      });

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
  }, [dragShortcut, isMobile, workspace]);

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
    (appId: AppId) => {
      setWindows((current) => {
        const nextWindow = createWindow(appId, current);
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
    [isMobile, uiScale, workspace]
  );

  const playTrack = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      setAutoplayToken((current) => current + 1);

      setWindows((current) => {
        const playerWindow = current.find((window) => window.appId === 'listen');

        if (playerWindow) {
          const restored = playerWindow.isMinimised ? restoreWindow(current, playerWindow.id) : current;
          const focused = focusWindow(restored, playerWindow.id);
          setFocusedWindowId(playerWindow.id);
          return focused;
        }

        const nextWindow = createWindow('listen', current);
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
    [isMobile, uiScale, workspace]
  );

  const focusById = useCallback((windowId: string) => {
    setWindows((current) => focusWindow(current, windowId));
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
    }, 280);
  }, []);

  const startWindowDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>, windowId: string) => {
      if (isMobile) {
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

  const minimisedWindows = useMemo(
    () => windows.filter((window) => window.isMinimised).sort((a, b) => a.zIndex - b.zIndex),
    [windows]
  );
  const hasMobileForeground = windows.some((window) => window.id === focusedWindowId && !window.isMinimised);
  const selectedAccount = LOGIN_ACCOUNTS.find((account) => account.id === selectedAccountId) ?? LOGIN_ACCOUNTS[0];
  const bootPhase = getBootPhase(bootElapsedMs);
  const bootProgress = clamp(bootElapsedMs / BOOT_TOTAL_MS, 0, 1);
  const managerCountdown = Math.max(0, Math.ceil((BOOT_PHASE_TIMING.managerEnd - bootElapsedMs) / 1000));
  const loaderProgress = clamp(
    (bootElapsedMs - BOOT_PHASE_TIMING.managerEnd) / (BOOT_PHASE_TIMING.loaderEnd - BOOT_PHASE_TIMING.managerEnd),
    0,
    1
  );
  const loaderVisibleCount = Math.max(1, Math.ceil(loaderProgress * LOADER_LINES.length));

  const handleTopBarAction = useCallback(
    (action: TopBarAction) => {
      if (action.type === 'open-window') {
        openWindowForApp(action.appId);
        return;
      }

      if (action.type === 'new-window') {
        setWindows((current) => {
          const focused = getFocusedWindow(current, focusedWindowId);
          const nextWindow = createWindow(focused?.appId ?? 'notes', current);
          const clamped = isMobile
            ? nextWindow
            : {
                ...nextWindow,
                ...clampWindowPoint(nextWindow, { x: nextWindow.x, y: nextWindow.y }, workspace, uiScale)
              };

          setFocusedWindowId(clamped.id);
          return [...current, clamped];
        });
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
        setWindows([]);
        setFocusedWindowId(null);
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

      if (action.type === 'zoom-in') {
        setUiScale((current) => Math.min(current + 0.05, 1.25));
        return;
      }

      if (action.type === 'zoom-out') {
        setUiScale((current) => Math.max(current - 0.05, 0.85));
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
    [closeById, focusedWindowId, isMobile, minimiseById, openWindowForApp, uiScale, workspace]
  );

  const setKnightSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHAMBER_OS_USER_KEY, 'Knight');
      window.localStorage.setItem(CHAMBER_OS_LOGGED_IN_KEY, 'true');
    }
    setLoginError(null);
    setLoginPassword('');
    setSystemStage('desktop');
  }, []);

  const restartFromLogin = useCallback(() => {
    setLoginError(null);
    setLoginPassword('');
    setSelectedAccountId('Knight');
    setBootElapsedMs(0);
    setSystemStage('boot');
  }, []);

  const logoutToLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHAMBER_OS_USER_KEY);
      window.localStorage.removeItem(CHAMBER_OS_LOGGED_IN_KEY);
    }

    setWindows([]);
    setFocusedWindowId(null);
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

  if (!sessionHydrated) {
    return <main className="min-h-dvh bg-black" />;
  }

  if (systemStage === 'boot') {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-black text-[#d8d8d8]">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:100%_24px,24px_100%]" />
        <section className="absolute inset-0 p-4 sm:p-7">
          <div className="mx-auto grid h-full w-full max-w-[1080px] grid-rows-[auto_minmax(0,1fr)_auto] border-y border-[#404044] font-machine">
            <header className="flex items-start justify-between gap-4 border-b border-[#27272a] py-3">
              <Image src="/chamber-star.svg" alt="Chamber Star" width={210} height={75} className="h-auto w-[150px] opacity-90 sm:w-[190px]" priority />
              <div className="grid grid-cols-2 gap-x-5 text-right text-[11px] uppercase leading-5 tracking-[0.08em] text-[#7f7f84]">
                <span>node</span><span className="text-[#c9c9c9]">chmbr-077</span>
                <span>build</span><span className="text-[#c9c9c9]">0206.314</span>
                <span>clock</span><span className="text-[#c9c9c9]">02:17:13</span>
              </div>
            </header>

            <div className="grid min-h-0 grid-cols-1 gap-8 py-6 md:grid-cols-[minmax(0,1.45fr)_minmax(220px,.55fr)] md:py-10">
              <div className="min-h-0 overflow-hidden text-[13px] leading-6 text-[#c7c7c7]">
                <p className="mb-5 text-[11px] uppercase tracking-[0.18em] text-[#717176]">resident boot ledger / {bootPhase}</p>

                {bootPhase === 'post' ? (
                  <div className="space-y-0.5">
                    {POST_LINES.map((line) => <p key={line}>{line}</p>)}
                  </div>
                ) : null}

                {bootPhase === 'manager' ? (
                  <div className="space-y-1">
                    <p>CHAMBER BOOT MANAGER</p>
                    <p>default volume........ RESIDENT</p>
                    <p>archive mount......... READ / WRITE</p>
                    <p>handoff in............ {managerCountdown}</p>
                  </div>
                ) : null}

                {bootPhase === 'loader' ? (
                  <div className="space-y-1">
                    {LOADER_LINES.slice(0, loaderVisibleCount).map((line, index) => (
                      <p key={line}><span className="mr-3 text-[#66666b]">{String(index + 1).padStart(2, '0')}</span>{line}</p>
                    ))}
                  </div>
                ) : null}

                {bootPhase === 'handoff' ? (
                  <div className="flex items-center gap-3">
                    <span className="grid grid-cols-3 gap-1" aria-hidden="true">
                      {[0, 1, 2].map((index) => <span key={index} className="h-2 w-2 animate-pulse bg-[#d8d8d8]" style={{ animationDelay: `${index * 120}ms` }} />)}
                    </span>
                    <p className="tracking-[0.12em] text-[#e7e7e7]">PASSING CONTROL TO RESIDENT SHELL</p>
                  </div>
                ) : null}
              </div>

              <aside className="border-l border-[#27272a] pl-5 text-[11px] uppercase leading-6 tracking-[0.08em] text-[#737378]">
                <p className="text-[#b5b5b8]">machine notes</p>
                <p className="mt-3">signal........ 2/3</p>
                <p>salt geometry. stable</p>
                <p>kaknet relay... intermittent</p>
                <p>queue token.... 17B</p>
                <p>time drift..... +00:43</p>
                <p className="mt-5 text-[#929297]">no metrics / no masters</p>
              </aside>
            </div>

            <footer className="grid grid-cols-[1fr_auto] items-end gap-4 border-t border-[#27272a] py-3">
              <div>
                <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-[#68686d]">
                  <span>memory scan</span><span>{Math.round(bootProgress * 100)}%</span>
                </div>
                <div className="h-[3px] overflow-hidden bg-[#242427]">
                  <div className="h-full bg-[#d6d6d2] transition-[width] duration-75 ease-linear" style={{ width: `${Math.round(bootProgress * 100)}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={completeBoot}
                aria-label="Skip simulated boot and continue to login"
                className="min-h-10 border border-[#404044] px-3 text-[11px] uppercase tracking-[0.1em] text-[#a7a7aa] hover:border-[#d6d6d2] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                skip / enter
              </button>
            </footer>
          </div>
        </section>
      </main>
    );
  }

  if (systemStage === 'login') {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-[#070708] text-text">
        <section className="absolute inset-0 flex items-center justify-center p-4 sm:p-7">
          <div className="w-full max-w-[660px] overflow-hidden rounded-[10px] border border-[#48484d] bg-[#0d0d0f] shadow-[0_18px_50px_rgba(0,0,0,.48)]">
            <header className="flex h-11 items-center justify-between gap-3 border-b border-[#303034] bg-black/35 px-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src="/chamber-logo.svg"
                  alt="Chamber Collective"
                  width={38}
                  height={20}
                  className="h-5 w-[38px] [filter:brightness(0)_invert(1)]"
                  priority
                />
                <p className="truncate text-sm font-identity text-text">ChamberOS Login</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={restartFromLogin}>Restart</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setLoginPassword('')}>Shut down</Button>
              </div>
            </header>

            <div className="flex min-h-[470px] flex-col px-5 py-6 sm:px-8">
              <section className="flex min-h-[282px] flex-col items-center text-center">
                <p className="text-base text-[#d7d7d5]">
                  Welcome, <span className="font-lore text-[26px] tracking-[0.03em] text-[#f0eee8]">{selectedAccount.id}</span>
                </p>

                <span
                  className={cn(
                    'mt-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-[#4a4a4f] bg-black/25 font-machine text-base',
                    selectedAccount.status === 'banned' ? 'text-[#ff7770]' : 'text-[#ededeb]'
                  )}
                >
                  {selectedAccount.id.slice(0, 2).toUpperCase()}
                </span>
                <p className="mt-3 text-sm text-muted">{selectedAccount.summary}</p>

                <div className="mt-5 flex min-h-[122px] w-full max-w-[360px] flex-col justify-start gap-2.5">
                  {selectedAccount.status === 'available' ? (
                    <>
                      <Button type="button" className="w-full" onClick={setKnightSession}>Log in</Button>
                      <p className="text-xs text-muted">Click Log in to continue.</p>
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
                        placeholder="Password"
                        className="h-10 w-full rounded-md border border-border bg-black/30 px-3 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      />
                      <Button type="button" className="w-full" onClick={handleLockedAttempt}>Unlock</Button>
                      <p className="min-h-4 text-xs text-[#ff7f7f]">{loginError}</p>
                    </>
                  ) : null}

                  {selectedAccount.status === 'banned' ? (
                    <p className="rounded-md border border-[#ff5f57]/55 bg-[#ff5f57]/10 px-3 py-3 text-sm text-[#ff9d9d]">Account disabled.</p>
                  ) : null}
                </div>
              </section>

              <section className="mt-auto border-t border-[#303034] pt-4">
                <p className="mb-3 text-center text-xs text-muted">Linked accounts</p>
                <div className="grid grid-cols-5 gap-2">
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
                      <span className="w-full truncate text-center">{account.id}</span>
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
      <TopBar windows={windows} focusedWindowId={focusedWindowId} onAction={handleTopBarAction} onLogout={logoutToLogin} />

      <section className="chamber-workspace-layout relative h-[calc(100dvh-2.5rem)] pt-10">
        <div className="absolute inset-0 bg-[#0b0b0c]" />

        <div ref={workspaceRef} className="chamber-workspace relative h-full w-full px-3 pb-20 pt-3 sm:px-4">
          {isMobile ? (
            <div
              hidden={hasMobileForeground}
              className={cn('pointer-events-auto mb-3 max-w-[620px] grid-cols-2 gap-3', hasMobileForeground ? 'hidden' : 'grid')}
            >
              {DESKTOP_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={() => {
                    setSelectedShortcutId(shortcut.id);
                    openWindowForApp(shortcut.appId);
                  }}
                  className={cn(
                    'group min-h-[118px] min-w-0 rounded-md bg-transparent px-3 py-3 text-left transition-colors duration-ui ease-calm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    selectedShortcutId === shortcut.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  )}
                  aria-label={`${shortcut.label}. ${shortcut.hint}`}
                >
                  <ShortcutGlyph iconSrc={shortcut.iconSrc} priority={shortcut.id === 'frnge'} />
                  <span className="mt-2 block break-words text-base leading-tight text-text">{shortcut.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0">
              <div className="pointer-events-auto relative h-full w-full">
                {DESKTOP_SHORTCUTS.map((shortcut) => {
                  const point = shortcutPositions[shortcut.id] ?? buildInitialShortcutPositions(workspace.width)[shortcut.id];

                  return (
                    <button
                      key={shortcut.id}
                      type="button"
                      style={{ left: point.x, top: point.y, width: SHORTCUT_CARD_WIDTH, minHeight: SHORTCUT_CARD_HEIGHT }}
                      onClick={() => {
                        if (blockedShortcutOpenId === shortcut.id) {
                          setBlockedShortcutOpenId(null);
                          return;
                        }
                        setSelectedShortcutId(shortcut.id);
                        openWindowForApp(shortcut.appId);
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
                          openWindowForApp(shortcut.appId);
                        }
                      }}
                      className={cn(
                        'group absolute min-h-[96px] select-none rounded-md bg-transparent px-3 py-2 text-left transition-colors duration-ui ease-calm',
                        'cursor-grab active:cursor-grabbing',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        selectedShortcutId === shortcut.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                      )}
                      aria-label={`${shortcut.label}. ${shortcut.hint}`}
                    >
                      <ShortcutGlyph iconSrc={shortcut.iconSrc} priority={shortcut.id === 'frnge'} />
                      <span className="mt-2 block break-words text-base leading-tight text-text">{shortcut.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <WindowManager
            windows={windows}
            focusedWindowId={focusedWindowId}
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
            onWindowDragStart={startWindowDrag}
          />
        </div>

        <footer className="chamber-taskbar fixed inset-x-0 bottom-0 z-40 min-h-[52px] border-t border-border bg-[#0a0a0b]/95 px-3 py-1.5">
          <div className="mx-auto flex min-h-10 max-w-[1400px] items-center justify-center gap-2">
            {minimisedWindows.length > 0 ? (
              minimisedWindows.map((window) => (
                <button
                  key={window.id}
                  type="button"
                  title={`Restore ${window.title}`}
                  aria-label={`Restore ${window.title}`}
                  onClick={() => {
                    setWindows((current) => focusWindow(restoreWindow(current, window.id), window.id));
                    setFocusedWindowId(window.id);
                  }}
                  className="chamber-task-tile inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[#45454a] bg-[#111113] hover:border-[#d7d6d0] hover:bg-[#1b1b1e] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                >
                  <Image src={getAppIconSrc(window.appId)} alt="" width={26} height={26} unoptimized className="h-[26px] w-[26px] object-contain" />
                </button>
              ))
            ) : null}
          </div>
        </footer>
      </section>

      {toast ? (
        <div className="fixed right-4 top-12 z-[70] rounded-md border border-border bg-[#111113] px-3 py-2 text-sm text-text">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
