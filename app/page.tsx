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

const SHORTCUT_CARD_WIDTH = 172;
const SHORTCUT_CARD_HEIGHT = 104;
const SHORTCUT_GRID_X = 188;
const SHORTCUT_GRID_Y = 118;
const SHORTCUT_MARGIN = 12;
const BOOT_TOTAL_MS = 7000;
const CHAMBER_OS_USER_KEY = 'chamber_os_user';
const CHAMBER_OS_LOGGED_IN_KEY = 'chamber_os_logged_in';
const BOOT_PHASE_TIMING = {
  postEnd: 1700,
  managerEnd: 2600,
  loaderEnd: 6800,
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
    id: 'quest',
    label: 'Chamber Quest',
    hint: 'resident app',
    iconSrc: '/desktop-icons/chamber-quest.svg',
    appId: 'text-quest'
  },
  {
    id: 'listen',
    label: 'Listen To Second Life',
    hint: 'track library',
    iconSrc: '/desktop-icons/listen-to-second-life.svg',
    appId: 'library'
  },
  {
    id: 'support',
    label: 'Support',
    hint: 'platform links',
    iconSrc: '/desktop-icons/support.svg',
    appId: 'support'
  },
  {
    id: 'steal',
    label: 'Steal',
    hint: 'free mirror panel',
    iconSrc: '/desktop-icons/steal.svg',
    appId: 'steal'
  }
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildInitialShortcutPositions(width: number): Record<string, Point> {
  const right = Math.max(SHORTCUT_MARGIN, width - SHORTCUT_CARD_WIDTH - SHORTCUT_MARGIN);

  return {
    quest: { x: SHORTCUT_MARGIN, y: SHORTCUT_MARGIN },
    listen: { x: SHORTCUT_MARGIN, y: SHORTCUT_MARGIN + SHORTCUT_GRID_Y },
    support: { x: right, y: SHORTCUT_MARGIN },
    steal: { x: right, y: SHORTCUT_MARGIN + SHORTCUT_GRID_Y }
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

function ShortcutGlyph({ iconSrc, label }: { iconSrc: string; label: string }) {
  return (
    <span aria-hidden="true" className="relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-[6px]">
      <Image src={iconSrc} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default function HomePage() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!sessionHydrated || systemStage !== 'boot') {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= BOOT_TOTAL_MS) {
        setBootElapsedMs(BOOT_TOTAL_MS);
        setSystemStage('login');
        window.clearInterval(timer);
        return;
      }
      setBootElapsedMs(elapsed);
    }, 50);

    return () => window.clearInterval(timer);
  }, [sessionHydrated, systemStage]);

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

  const closeById = useCallback((windowId: string) => {
    setWindows((current) => {
      const next = closeWindow(current, windowId);
      setFocusedWindowId((focused) => (focused === windowId ? getTopWindowId(next) : focused));
      return next;
    });
  }, []);

  const minimiseById = useCallback((windowId: string) => {
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

        setWindows((current) => {
          const next = minimiseWindow(current, focusedWindowId);
          const remaining = next.filter((window) => !window.isMinimised);
          setFocusedWindowId(getTopWindowId(remaining));
          return next;
        });
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
    [closeById, focusedWindowId, isMobile, openWindowForApp, uiScale, workspace]
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
        <section className="absolute inset-0 p-5 sm:p-6">
          <div className="mx-auto h-full w-full max-w-[980px] rounded-[8px] border border-border/60 bg-black/85 p-4 font-mono text-[13px] leading-6 sm:text-sm">
            {bootPhase === 'post' ? (
              <div className="relative h-full">
                <div className="absolute right-0 top-0 hidden text-right sm:block">
                  <Image src="/chamber-star.svg" alt="Chamber Star" width={180} height={64} className="h-auto w-[180px] opacity-90" />
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#b8b8b8]">certified resident build</p>
                </div>
                <div className="space-y-1 sm:pr-56">
                  {POST_LINES.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {bootPhase === 'manager' ? (
              <div className="space-y-1">
                <p>CHAMBER BOOT MANAGER</p>
                <p>ChamberOS v0.2 (build 0206.314)</p>
                <p>Default: RESIDENT</p>
                <p>Booting in: {managerCountdown}...</p>
              </div>
            ) : null}

            {bootPhase === 'loader' ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Image src="/chamber-star.svg" alt="Chamber Star loader mark" width={220} height={78} className="h-auto w-[220px] opacity-75" />
                </div>
                <div className="space-y-1">
                  {LOADER_LINES.slice(0, loaderVisibleCount).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {bootPhase === 'handoff' ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-text" />
                <p className="animate-pulse tracking-[0.08em] text-[#e7e7e7]">DESKTOP_APPEARS</p>
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none fixed inset-x-5 bottom-6 sm:inset-x-6">
            <div className="mx-auto max-w-[980px]">
              <div className="h-[2px] w-full overflow-hidden rounded bg-border/80">
                <div className="h-full bg-text transition-[width] duration-75 ease-linear" style={{ width: `${Math.round(bootProgress * 100)}%` }} />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (systemStage === 'login') {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-[#070708] text-text">
        <section className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] rounded-[12px] border border-border bg-[#0d0d0f] p-4 sm:p-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-full border border-border text-sm font-medium',
                  selectedAccount.status === 'banned' ? 'text-[#ff5f57]' : 'text-text'
                )}
              >
                {selectedAccount.id.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-xl font-medium text-text">{selectedAccount.id}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-muted">{selectedAccount.summary}</p>
              </div>
            </div>

            <div className="space-y-3 py-4">
              {selectedAccount.status === 'available' ? (
                <>
                  <Button type="button" className="w-full" onClick={setKnightSession}>
                    Log In
                  </Button>
                  <p className="text-xs text-muted">visitor access</p>
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
                    className="h-11 w-full rounded-md border border-border bg-black/30 px-3 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                  <Button type="button" className="w-full" onClick={handleLockedAttempt}>
                    Unlock
                  </Button>
                  <p className="min-h-5 text-xs text-[#ff7f7f]">{loginError}</p>
                </>
              ) : null}

              {selectedAccount.status === 'banned' ? (
                <p className="rounded-md border border-[#ff5f57]/55 bg-[#ff5f57]/10 px-3 py-2 text-sm text-[#ff9d9d]">
                  ACCOUNT DISABLED (BANNED)
                </p>
              ) : null}
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs uppercase tracking-[0.09em] text-muted">Profiles</p>
              <div className="space-y-1.5">
                {LOGIN_ACCOUNTS.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(account.id);
                      setLoginPassword('');
                      setLoginError(account.status === 'banned' ? 'ACCOUNT DISABLED (BANNED)' : null);
                    }}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors duration-ui ease-calm',
                      selectedAccountId === account.id ? 'bg-white/[0.08] text-text' : 'text-muted hover:bg-white/[0.05] hover:text-text'
                    )}
                  >
                    <span>{account.id}</span>
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em]">
                      <span className={cn('h-2 w-2 rounded-full', statusDotClass(account.status))} />
                      {account.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={restartFromLogin}>
                Restart
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLoginPassword('')}>
                Shut down
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-bg text-text">
      <TopBar windows={windows} focusedWindowId={focusedWindowId} onAction={handleTopBarAction} />

      <section className="relative h-[calc(100dvh-2.5rem)] pt-10">
        <div className="absolute inset-0 bg-[#0b0b0c]" />

        <div ref={workspaceRef} className="relative h-full w-full px-3 pb-20 pt-3 sm:px-4">
          {isMobile ? (
            <div className="pointer-events-auto mb-3 grid max-w-[560px] grid-cols-2 gap-2">
              {DESKTOP_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={() => {
                    setSelectedShortcutId(shortcut.id);
                    openWindowForApp(shortcut.appId);
                  }}
                  className={cn(
                    'group min-h-[96px] rounded-md bg-transparent px-3 py-2 text-left transition-colors duration-ui ease-calm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    selectedShortcutId === shortcut.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  )}
                  aria-label={`${shortcut.label}. ${shortcut.hint}`}
                >
                  <ShortcutGlyph iconSrc={shortcut.iconSrc} label={shortcut.label} />
                  <span className="mt-2 block text-sm leading-tight text-text">{shortcut.label}</span>
                  <span className="mt-1 block text-xs text-muted">{shortcut.hint}</span>
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
                      style={{ left: point.x, top: point.y, width: SHORTCUT_CARD_WIDTH }}
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
                      <ShortcutGlyph iconSrc={shortcut.iconSrc} label={shortcut.label} />
                      <span className="mt-2 block text-sm leading-tight text-text">{shortcut.label}</span>
                      <span className="mt-1 block text-xs text-muted">{shortcut.hint}</span>
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
            onOpenWindow={openWindowForApp}
            onPlayTrack={playTrack}
            onFocusWindow={focusById}
            onCloseWindow={closeById}
            onMinimiseWindow={minimiseById}
            onWindowDragStart={startWindowDrag}
          />
        </div>

        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[#0a0a0b]/95 px-3 py-2">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.08em] text-muted">Minimised</span>
            {minimisedWindows.length === 0 ? (
              <span className="text-xs text-muted">none</span>
            ) : (
              minimisedWindows.map((window) => (
                <Button
                  key={window.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setWindows((current) => focusWindow(restoreWindow(current, window.id), window.id));
                    setFocusedWindowId(window.id);
                  }}
                >
                  {window.title}
                </Button>
              ))
            )}

            <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={logoutToLogin}>
              Log out
            </Button>
            <span className="text-xs text-muted">scale {Math.round(uiScale * 100)}%</span>
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
