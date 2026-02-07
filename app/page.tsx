'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { accessLinks, downloadConfig, stealLinks } from '@/lib/config';
import { ChamberBootOverlay } from '@/components/ui/chamber-boot-overlay';
import { WindowControls } from '@/components/ui/window-controls';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';
import { readState, writeState } from '@/lib/storage';
import type { ListeningMode } from '@/lib/types';
import { cn } from '@/lib/utils';

type WindowId = 'listen' | 'buy' | 'steal' | 'help' | 'lore' | 'trace' | 'ghost' | 'key';
type MenuLabel = 'Finder' | 'File' | 'Edit' | 'View' | 'Window' | 'Help';
type IconId = 'listen' | 'help' | 'lore' | 'trace' | 'key' | 'buy' | 'steal' | 'ghost';
type SystemStage = 'boot' | 'login' | 'restart-progress' | 'restart-spinner' | 'ready';

interface Point {
  x: number;
  y: number;
}

interface DesktopRect {
  width: number;
  height: number;
}

interface WindowLayout extends Point {
  z: number;
}

type WindowRestoreLayout = Partial<Record<WindowId, Point>>;

interface DragIconState {
  id: IconId;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
}

interface DragWindowState {
  id: WindowId;
  offsetX: number;
  offsetY: number;
}

interface DesktopItem {
  id: IconId;
  label: string;
  hint: string;
  type: 'folder' | 'file';
  window: WindowId;
}

interface WindowSpec {
  title: string;
  subtitle: string;
  width: number;
  height: number;
}

const MENU_ITEMS: MenuLabel[] = ['Finder', 'File', 'Edit', 'View', 'Window', 'Help'];
const ICON_IDS: IconId[] = ['listen', 'help', 'lore', 'trace', 'key', 'buy', 'steal', 'ghost'];
const WINDOW_IDS: WindowId[] = ['listen', 'buy', 'steal', 'help', 'lore', 'trace', 'ghost', 'key'];
const CHAMBER_BOOT_KEY = 'chamber-os-v0.2-booted';

const SYSTEM_LINES = [
  'six chapters, recovered and released',
  'guided: short lead-ins before first play',
  'direct: immediate playback, no lead-in',
  'appendix unlocks after guided completion',
  'drag folders, select, and open'
];

const HELP_TEXT = `SECOND LIFE // help.txt

- Single click to select.
- Drag icons to reposition.
- Drag on empty desktop to box-select.
- Double click icon to open (single tap on mobile).

Guided vs Direct:
- Guided adds short lead-ins before first play.
- Direct plays immediately.

Hint:
Click Finder three times, then run:
Finder > View > Help`;

const LORE_TEXT = `archive_note.log

No perfect take survived.
Only the one that stayed honest.

Trace route now available on desktop.`;

const TRACE_TEXT = `trace.route

Checksum mismatch on recovered stems.
Manual decode required.

Run decode to unlock chamber.key`;

const KEY_TEXT = `chamber.key

Key accepted.
Appendix path is now visible.`;

const DESKTOP_ITEMS: Record<IconId, DesktopItem> = {
  listen: {
    id: 'listen',
    label: 'Listen to Second Life',
    hint: 'Open guided/direct options.',
    type: 'folder',
    window: 'listen'
  },
  help: {
    id: 'help',
    label: 'help.txt',
    hint: 'Basic controls and orientation.',
    type: 'file',
    window: 'help'
  },
  lore: {
    id: 'lore',
    label: 'archive_note.log',
    hint: 'Unlocked by Finder repetition.',
    type: 'file',
    window: 'lore'
  },
  trace: {
    id: 'trace',
    label: 'trace.route',
    hint: 'Recovered route cache.',
    type: 'file',
    window: 'trace'
  },
  key: {
    id: 'key',
    label: 'chamber.key',
    hint: 'Decode unlock.',
    type: 'file',
    window: 'key'
  },
  buy: {
    id: 'buy',
    label: 'Buy',
    hint: 'Stream and support links.',
    type: 'folder',
    window: 'buy'
  },
  steal: {
    id: 'steal',
    label: 'Steal',
    hint: 'Free-access mirror panel.',
    type: 'folder',
    window: 'steal'
  },
  ghost: {
    id: 'ghost',
    label: 'Ghost Cache',
    hint: 'Unlocked by menu sequence.',
    type: 'folder',
    window: 'ghost'
  }
};

const WINDOW_SPECS: Record<WindowId, WindowSpec> = {
  listen: { title: 'SECOND LIFE', subtitle: 'Listen to Second Life', width: 980, height: 430 },
  buy: { title: 'BUY', subtitle: 'Platforms and support', width: 820, height: 470 },
  steal: { title: 'STEAL', subtitle: 'Free-access mirror panel', width: 880, height: 520 },
  help: { title: 'help.txt', subtitle: 'Quick orientation', width: 760, height: 470 },
  lore: { title: 'archive_note.log', subtitle: 'Recovered artefact', width: 760, height: 390 },
  trace: { title: 'trace.route', subtitle: 'Diagnostic route', width: 760, height: 430 },
  ghost: { title: 'GHOST CACHE', subtitle: 'Hidden folder', width: 760, height: 430 },
  key: { title: 'chamber.key', subtitle: 'Verification file', width: 720, height: 380 }
};

const ICON_WIDTH = 210;
const ICON_HEIGHT = 106;
const ICON_GRID_X = 228;
const ICON_GRID_Y = 132;
const ICON_EDGE = 24;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toSelectionRect = (a: Point, b: Point) => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y)
});

const intersects = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

function buildInitialIconPositions(width: number) {
  const rightX = Math.max(ICON_EDGE, width - ICON_WIDTH - ICON_EDGE);

  return {
    listen: { x: ICON_EDGE, y: ICON_EDGE },
    help: { x: ICON_EDGE, y: ICON_EDGE + ICON_GRID_Y },
    lore: { x: ICON_EDGE, y: ICON_EDGE + ICON_GRID_Y * 2 },
    trace: { x: ICON_EDGE, y: ICON_EDGE + ICON_GRID_Y * 3 },
    key: { x: ICON_EDGE, y: ICON_EDGE + ICON_GRID_Y * 4 },
    buy: { x: rightX, y: ICON_EDGE },
    steal: { x: rightX, y: ICON_EDGE + ICON_GRID_Y },
    ghost: { x: rightX, y: ICON_EDGE + ICON_GRID_Y * 2 }
  };
}

function getWindowSize(id: WindowId, rect: DesktopRect) {
  const spec = WINDOW_SPECS[id];
  const width = Math.min(spec.width, Math.max(360, rect.width - 16));
  const height = Math.min(spec.height, Math.max(260, rect.height - 16));
  return { width, height };
}

function clampIconPoint(point: Point, rect: DesktopRect): Point {
  return {
    x: clamp(point.x, 8, Math.max(8, rect.width - ICON_WIDTH - 8)),
    y: clamp(point.y, 8, Math.max(8, rect.height - ICON_HEIGHT - 8))
  };
}

function snapIconPoint(point: Point, rect: DesktopRect): Point {
  const snapped = {
    x: ICON_EDGE + Math.round((point.x - ICON_EDGE) / ICON_GRID_X) * ICON_GRID_X,
    y: ICON_EDGE + Math.round((point.y - ICON_EDGE) / ICON_GRID_Y) * ICON_GRID_Y
  };
  return clampIconPoint(snapped, rect);
}

function clampWindowPoint(id: WindowId, point: Point, rect: DesktopRect): Point {
  const size = getWindowSize(id, rect);
  return {
    x: clamp(point.x, 4, Math.max(4, rect.width - size.width - 4)),
    y: clamp(point.y, 4, Math.max(4, rect.height - size.height - 4))
  };
}

function FolderGlyph() {
  return (
    <span aria-hidden="true" className="relative block h-[44px] w-[64px]">
      <span className="absolute left-[6px] top-0 h-[11px] w-[24px] rounded-t-[4px] border border-border border-b-0 bg-zinc-500/70" />
      <span className="absolute left-0 top-[9px] h-[35px] w-[64px] rounded-[5px] border border-border bg-zinc-500/75" />
    </span>
  );
}

function FileGlyph() {
  return (
    <span aria-hidden="true" className="relative block h-[48px] w-[36px]">
      <span className="absolute inset-0 rounded-[4px] border border-border bg-zinc-500/75" />
      <span className="absolute right-0 top-0 h-[13px] w-[13px] border-b border-l border-border bg-bg/85" />
      <span className="absolute left-[7px] top-[19px] h-[1px] w-[20px] bg-border" />
      <span className="absolute left-[7px] top-[24px] h-[1px] w-[20px] bg-border" />
      <span className="absolute left-[7px] top-[29px] h-[1px] w-[14px] bg-border" />
    </span>
  );
}

interface ListRowProps {
  iconType?: 'folder' | 'file';
  title: string;
  detail: string;
  status?: string;
  action: ReactNode;
}

function ListRow({ iconType = 'folder', title, detail, status, action }: ListRowProps) {
  return (
    <article className="grid gap-3 border-b border-border px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="flex items-start gap-3">
        <span className="mt-1 shrink-0">{iconType === 'folder' ? <FolderGlyph /> : <FileGlyph />}</span>
        <div>
          <h3 className="text-base font-medium text-text">{title}</h3>
          <p className="text-sm text-muted">{detail}</p>
        </div>
      </div>
      <p className="self-center text-xs uppercase tracking-[0.1em] text-muted">{status ?? 'ready'}</p>
      <div className="self-center justify-self-start sm:justify-self-end">{action}</div>
    </article>
  );
}

interface FinderWindowProps {
  id: WindowId;
  mobile: boolean;
  expanded: boolean;
  layout: WindowLayout;
  desktopRect: DesktopRect;
  onClose: () => void;
  onMinimize: () => void;
  onToggleExpand: () => void;
  onBringToFront: () => void;
  onHeaderPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

function FinderWindow({
  id,
  mobile,
  expanded,
  layout,
  desktopRect,
  onClose,
  onMinimize,
  onToggleExpand,
  onBringToFront,
  onHeaderPointerDown,
  children
}: FinderWindowProps) {
  const spec = WINDOW_SPECS[id];
  const size = getWindowSize(id, desktopRect);

  if (mobile) {
    return (
      <div className="fixed inset-0 z-40 flex items-start bg-black/65 px-3 pt-14">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={spec.title}
          className="w-full overflow-hidden rounded-[12px] border border-border bg-[#0d0d0f] animate-window-pop"
        >
          <header className="border-b border-border bg-zinc-900/55 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <WindowControls onClose={onClose} onMinimize={onMinimize} onToggleExpand={onToggleExpand} expanded={expanded} />
                <div>
                  <p className="text-sm font-medium text-text">{spec.title}</p>
                  <p className="text-[11px] text-muted">{spec.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center rounded-md px-2 text-xs text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                close
              </button>
            </div>
          </header>
          <div className="max-h-[74svh] overflow-y-auto bg-[#0b0b0d]/95 p-3">{children}</div>
        </section>
      </div>
    );
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={spec.title}
      className="absolute overflow-hidden rounded-[12px] border border-border bg-[#0d0d0f] transition-[left,top,width,height,transform,opacity] duration-ui ease-calm animate-window-pop"
      style={{
        left: expanded ? 0 : layout.x,
        top: expanded ? 0 : layout.y,
        width: expanded ? desktopRect.width : size.width,
        height: expanded ? desktopRect.height : size.height,
        zIndex: layout.z
      }}
      onMouseDown={onBringToFront}
    >
      <header className="border-b border-border bg-zinc-900/55 px-3 py-2">
        <div
          className="flex cursor-move items-center justify-between gap-3"
          onPointerDown={onHeaderPointerDown}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onBringToFront();
            }
          }}
          aria-label={`${spec.title} window title bar`}
        >
          <div className="flex items-center gap-4">
            <WindowControls onClose={onClose} onMinimize={onMinimize} onToggleExpand={onToggleExpand} expanded={expanded} />
            <div>
                <p className="text-sm font-medium text-text">{spec.title}</p>
                <p className="text-[11px] text-muted">{spec.subtitle}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="h-[calc(100%-56px)] overflow-y-auto bg-[#0b0b0d]/95 p-3">{children}</div>
    </section>
  );
}

export default function BootPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const desktopRef = useRef<HTMLDivElement>(null);
  const zCounterRef = useRef(24);
  const systemFrameRef = useRef<number | null>(null);
  const systemTimeoutRef = useRef<number | null>(null);

  const [desktopRect, setDesktopRect] = useState<DesktopRect>({ width: 1200, height: 760 });
  const [iconPositions, setIconPositions] = useState<Record<IconId, Point>>(() => buildInitialIconPositions(1200));
  const [selectedIcons, setSelectedIcons] = useState<IconId[]>([]);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<Point | null>(null);
  const [dragIcon, setDragIcon] = useState<DragIconState | null>(null);

  const [openWindows, setOpenWindows] = useState<WindowId[]>([]);
  const [windowLayouts, setWindowLayouts] = useState<Record<WindowId, WindowLayout>>({
    listen: { x: 72, y: 52, z: 10 },
    buy: { x: 100, y: 78, z: 11 },
    steal: { x: 128, y: 104, z: 12 },
    help: { x: 156, y: 130, z: 13 },
    lore: { x: 182, y: 86, z: 14 },
    trace: { x: 208, y: 112, z: 15 },
    ghost: { x: 236, y: 94, z: 16 },
    key: { x: 262, y: 120, z: 17 }
  });
  const [dragWindow, setDragWindow] = useState<DragWindowState | null>(null);
  const [expandedWindows, setExpandedWindows] = useState<WindowId[]>([]);
  const [restoreLayouts, setRestoreLayouts] = useState<WindowRestoreLayout>({});

  const [systemLine, setSystemLine] = useState(SYSTEM_LINES[0]);
  const [finderClicks, setFinderClicks] = useState(0);
  const [menuTrail, setMenuTrail] = useState<MenuLabel[]>([]);
  const [ghostUnlocked, setGhostUnlocked] = useState(false);
  const [traceUnlocked, setTraceUnlocked] = useState(false);
  const [keyUnlocked, setKeyUnlocked] = useState(false);
  const [systemStage, setSystemStage] = useState<SystemStage>('boot');
  const [systemProgress, setSystemProgress] = useState(0);

  const loreUnlocked = finderClicks >= 3;

  const visibleIconIds = useMemo(() => {
    const ids: IconId[] = ['listen', 'help', 'buy', 'steal'];
    if (loreUnlocked) {
      ids.push('lore');
    }
    if (traceUnlocked) {
      ids.push('trace');
    }
    if (ghostUnlocked) {
      ids.push('ghost');
    }
    if (keyUnlocked) {
      ids.push('key');
    }
    return ids;
  }, [ghostUnlocked, keyUnlocked, loreUnlocked, traceUnlocked]);

  const clearSystemTimers = () => {
    if (systemFrameRef.current !== null) {
      window.cancelAnimationFrame(systemFrameRef.current);
      systemFrameRef.current = null;
    }
    if (systemTimeoutRef.current !== null) {
      window.clearTimeout(systemTimeoutRef.current);
      systemTimeoutRef.current = null;
    }
  };

  const runBootAnimation = (durationMs: number) => {
    clearSystemTimers();
    setSystemStage('boot');
    setSystemProgress(0);

    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      setSystemProgress(progress);

      if (progress < 1) {
        systemFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      window.sessionStorage.setItem(CHAMBER_BOOT_KEY, '1');
      systemTimeoutRef.current = window.setTimeout(() => {
        setSystemStage('ready');
        systemTimeoutRef.current = null;
      }, 120);
    };

    systemFrameRef.current = window.requestAnimationFrame(tick);
  };

  const handleRestart = () => {
    clearSystemTimers();
    setSystemStage('restart-progress');
    setSystemProgress(0);

    const durationMs = 3000;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      setSystemProgress(progress);

      if (progress < 1) {
        systemFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      setSystemStage('restart-spinner');
      systemTimeoutRef.current = window.setTimeout(() => {
        runBootAnimation(5000);
      }, 850);
    };

    systemFrameRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.sessionStorage.getItem(CHAMBER_BOOT_KEY) === '1') {
      setSystemProgress(1);
      setSystemStage('login');
    } else {
      runBootAnimation(5000);
    }

    return () => {
      clearSystemTimers();
    };
  }, []);

  useEffect(() => {
    if (!desktopRef.current) {
      return;
    }

    const observe = () => {
      if (!desktopRef.current) {
        return;
      }
      setDesktopRect({
        width: desktopRef.current.clientWidth,
        height: desktopRef.current.clientHeight
      });
    };

    observe();

    const observer = new ResizeObserver(observe);
    observer.observe(desktopRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIconPositions((current) => {
      const next = { ...current };
      for (const id of ICON_IDS) {
        next[id] = clampIconPoint(next[id], desktopRect);
      }
      return next;
    });

    setWindowLayouts((current) => {
      const next = { ...current };
      for (const id of WINDOW_IDS) {
        next[id] = { ...next[id], ...clampWindowPoint(id, next[id], desktopRect) };
      }
      return next;
    });
  }, [desktopRect]);

  useEffect(() => {
    if (finderClicks === 3) {
      setSystemLine('archive_note.log unlocked');
    }
  }, [finderClicks]);

  useEffect(() => {
    if (!dragWindow || isMobile) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      setWindowLayouts((current) => {
        if (expandedWindows.includes(dragWindow.id)) {
          return current;
        }

        const nextPoint = clampWindowPoint(
          dragWindow.id,
          {
            x: event.clientX - dragWindow.offsetX,
            y: event.clientY - dragWindow.offsetY
          },
          desktopRect
        );

        return {
          ...current,
          [dragWindow.id]: {
            ...current[dragWindow.id],
            ...nextPoint
          }
        };
      });
    };

    const handleUp = () => setDragWindow(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [desktopRect, dragWindow, expandedWindows, isMobile]);

  const selectionRect = useMemo(() => {
    if (!selectionStart || !selectionCurrent) {
      return null;
    }
    return toSelectionRect(selectionStart, selectionCurrent);
  }, [selectionCurrent, selectionStart]);

  const openWindow = (id: WindowId) => {
    if (id === 'lore' && loreUnlocked && !traceUnlocked) {
      setTraceUnlocked(true);
      setSystemLine('trace.route unlocked');
    }

    if (isMobile) {
      setOpenWindows([id]);
    } else {
      setOpenWindows((current) => (current.includes(id) ? current : [...current, id]));
    }

    zCounterRef.current += 1;
    setWindowLayouts((current) => {
      const currentLayout = current[id];
      const fallbackPoint = clampWindowPoint(
        id,
        {
          x: 64 + (zCounterRef.current % 7) * 22,
          y: 48 + (zCounterRef.current % 5) * 20
        },
        desktopRect
      );

      return {
        ...current,
        [id]: {
          x: currentLayout?.x ?? fallbackPoint.x,
          y: currentLayout?.y ?? fallbackPoint.y,
          z: zCounterRef.current
        }
      };
    });
  };

  const closeWindow = (id: WindowId) => {
    setOpenWindows((current) => current.filter((item) => item !== id));
    setExpandedWindows((current) => current.filter((item) => item !== id));
  };

  const minimizeWindow = (id: WindowId) => {
    closeWindow(id);
    setSystemLine(`${WINDOW_SPECS[id].title} minimized`);
  };

  const toggleExpandWindow = (id: WindowId) => {
    if (isMobile) {
      return;
    }

    const expanded = expandedWindows.includes(id);

    if (expanded) {
      setExpandedWindows((current) => current.filter((item) => item !== id));

      const restore = restoreLayouts[id];
      if (restore) {
        setWindowLayouts((current) => ({
          ...current,
          [id]: {
            ...current[id],
            ...clampWindowPoint(id, restore, desktopRect)
          }
        }));
      }
      return;
    }

    setRestoreLayouts((current) => ({
      ...current,
      [id]: {
        x: windowLayouts[id].x,
        y: windowLayouts[id].y
      }
    }));
    setExpandedWindows((current) => [...current, id]);
    bringWindowToFront(id);
  };

  const bringWindowToFront = (id: WindowId) => {
    zCounterRef.current += 1;
    setWindowLayouts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        z: zCounterRef.current
      }
    }));
  };

  const setListeningMode = (mode: ListeningMode) => {
    const nextState = {
      ...readState(),
      mode
    };

    writeState(nextState);
    router.push(`/chapters?mode=${mode}&boot=1&app=cmp`);
  };

  const handleMenuClick = (menu: MenuLabel) => {
    if (menu === 'Finder') {
      setFinderClicks((current) => current + 1);
    }

    if (menu === 'Help') {
      openWindow('help');
    }

    setMenuTrail((current) => {
      const next = [...current, menu].slice(-3);
      if (next.join('>') === 'Finder>View>Help' && !ghostUnlocked) {
        setGhostUnlocked(true);
        setSystemLine('Ghost Cache unlocked');
      }
      return next;
    });

    const nextLine = SYSTEM_LINES[(MENU_ITEMS.indexOf(menu) + finderClicks + 1) % SYSTEM_LINES.length];
    setSystemLine(nextLine);
  };

  const getLocalPoint = (clientX: number, clientY: number): Point => {
    if (!desktopRef.current) {
      return { x: 0, y: 0 };
    }
    const rect = desktopRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleDesktopPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile || event.target !== event.currentTarget) {
      return;
    }

    const local = getLocalPoint(event.clientX, event.clientY);
    setSelectionStart(local);
    setSelectionCurrent(local);
    setSelectedIcons([]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDesktopPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile || !selectionStart) {
      return;
    }

    setSelectionCurrent(getLocalPoint(event.clientX, event.clientY));
  };

  const handleDesktopPointerUp = () => {
    if (isMobile || !selectionStart || !selectionCurrent) {
      setSelectionStart(null);
      setSelectionCurrent(null);
      return;
    }

    const rect = toSelectionRect(selectionStart, selectionCurrent);

    const selected = visibleIconIds.filter((id) =>
      intersects(
        rect,
        {
          x: iconPositions[id].x,
          y: iconPositions[id].y,
          width: ICON_WIDTH,
          height: ICON_HEIGHT
        }
      )
    );

    setSelectedIcons(selected);
    setSelectionStart(null);
    setSelectionCurrent(null);
  };

  const handleIconPointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: IconId) => {
    if (isMobile) {
      return;
    }

    event.stopPropagation();
    const local = getLocalPoint(event.clientX, event.clientY);

    setDragIcon({
      id,
      pointerId: event.pointerId,
      offsetX: local.x - iconPositions[id].x,
      offsetY: local.y - iconPositions[id].y,
      moved: false
    });
    setSelectedIcons([id]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleIconPointerMove = (event: React.PointerEvent<HTMLButtonElement>, id: IconId) => {
    if (!dragIcon || dragIcon.id !== id || dragIcon.pointerId !== event.pointerId || isMobile) {
      return;
    }

    const local = getLocalPoint(event.clientX, event.clientY);

    setIconPositions((current) => {
      const nextPoint = clampIconPoint(
        {
          x: local.x - dragIcon.offsetX,
          y: local.y - dragIcon.offsetY
        },
        desktopRect
      );

      const delta = Math.abs(current[id].x - nextPoint.x) + Math.abs(current[id].y - nextPoint.y);
      if (!dragIcon.moved && delta > 3) {
        setDragIcon((state) => (state ? { ...state, moved: true } : null));
      }

      return {
        ...current,
        [id]: nextPoint
      };
    });
  };

  const handleIconPointerUp = (event: React.PointerEvent<HTMLButtonElement>, id: IconId) => {
    if (!dragIcon || dragIcon.id !== id || dragIcon.pointerId !== event.pointerId || isMobile) {
      return;
    }

    if (dragIcon.moved) {
      setIconPositions((current) => ({
        ...current,
        [id]: snapIconPoint(current[id], desktopRect)
      }));
    }

    setDragIcon(null);
  };

  const unlockKey = () => {
    if (keyUnlocked) {
      openWindow('key');
      return;
    }

    setKeyUnlocked(true);
    setSystemLine('chamber.key unlocked');
    openWindow('key');
  };

  const menuHint = useMemo(() => {
    if (keyUnlocked) {
      return 'chamber.key active';
    }
    if (traceUnlocked) {
      return 'trace.route active';
    }
    if (loreUnlocked) {
      return 'archive_note.log available';
    }
    return systemLine;
  }, [keyUnlocked, loreUnlocked, systemLine, traceUnlocked]);

  return (
    <main className="min-h-screen bg-bg text-text">
      <header className="fixed inset-x-0 top-0 z-20 h-11 border-b border-border bg-[#09090b]/95 backdrop-blur-[1px]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <span className="hidden items-center gap-[7px] sm:flex" aria-hidden="true">
              <span className="h-[12px] w-[12px] rounded-full bg-[#ff5f57]" />
              <span className="h-[12px] w-[12px] rounded-full bg-[#febc2e]" />
              <span className="h-[12px] w-[12px] rounded-full bg-[#28c840]" />
            </span>

            <p className="text-lg font-medium text-text">Finder</p>

            <nav aria-label="Desktop menu" className="flex items-center gap-1 overflow-x-auto">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleMenuClick(item)}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <p className="hidden truncate text-xs text-muted lg:block">{menuHint}</p>
        </div>
      </header>

      <section className="relative min-h-screen overflow-hidden px-4 pb-16 pt-14 sm:px-7 sm:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 15%, rgba(255,255,255,0.08), transparent 38%), radial-gradient(circle at 78% 72%, rgba(255,255,255,0.07), transparent 36%), linear-gradient(150deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0) 72%)'
          }}
        />

        <div
          ref={desktopRef}
          className={cn(
            'relative mx-auto h-[calc(100svh-118px)] max-w-[1600px]',
            isMobile ? 'overflow-y-auto pb-4' : ''
          )}
          onPointerDown={handleDesktopPointerDown}
          onPointerMove={handleDesktopPointerMove}
          onPointerUp={handleDesktopPointerUp}
          aria-label="Second Life desktop"
        >
          {isMobile ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {visibleIconIds.map((id) => {
                const item = DESKTOP_ITEMS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => openWindow(item.window)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openWindow(item.window);
                      }
                    }}
                    className={cn(
                      'group min-h-[120px] rounded-md border border-border bg-black/20 p-3 text-left transition-colors duration-ui ease-calm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      'hover:border-accent/70 hover:bg-white/[0.03]'
                    )}
                    aria-label={`${item.label}. ${item.hint}`}
                  >
                    {item.type === 'folder' ? <FolderGlyph /> : <FileGlyph />}
                    <span className="mt-2 block text-base leading-tight text-text">{item.label}</span>
                    <span className="mt-1 block text-xs text-muted">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {visibleIconIds.map((id) => {
                const item = DESKTOP_ITEMS[id];
                const position = iconPositions[id];
                const selected = selectedIcons.includes(id);

                return (
                  <button
                    key={id}
                    type="button"
                    style={{
                      left: position.x,
                      top: position.y,
                      width: ICON_WIDTH
                    }}
                    onPointerDown={(event) => handleIconPointerDown(event, id)}
                    onPointerMove={(event) => handleIconPointerMove(event, id)}
                    onPointerUp={(event) => handleIconPointerUp(event, id)}
                    onDoubleClick={() => openWindow(item.window)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openWindow(item.window);
                      }
                    }}
                    className={cn(
                      'group absolute flex min-h-11 flex-col items-start gap-2 rounded-md p-2 text-left transition-colors duration-ui ease-calm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      selected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'
                    )}
                    aria-label={`${item.label}. ${item.hint}`}
                  >
                    {item.type === 'folder' ? <FolderGlyph /> : <FileGlyph />}

                    <span className="text-[19px] leading-none text-muted transition-colors duration-ui ease-calm group-hover:text-text sm:text-[22px]">
                      {item.label}
                    </span>

                    <span className="hidden pt-1 text-xs text-muted md:block">{item.hint}</span>
                  </button>
                );
              })}

              {selectionRect ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute border border-accent/70 bg-accent/10"
                  style={{
                    left: selectionRect.x,
                    top: selectionRect.y,
                    width: selectionRect.width,
                    height: selectionRect.height
                  }}
                />
              ) : null}
            </>
          )}

          {openWindows.map((id) => (
            <FinderWindow
              key={id}
              id={id}
              mobile={isMobile}
              expanded={expandedWindows.includes(id)}
              layout={windowLayouts[id]}
              desktopRect={desktopRect}
              onClose={() => closeWindow(id)}
              onMinimize={() => minimizeWindow(id)}
              onToggleExpand={() => toggleExpandWindow(id)}
              onBringToFront={() => bringWindowToFront(id)}
              onHeaderPointerDown={(event) => {
                if (isMobile || !desktopRef.current) {
                  return;
                }

                if (expandedWindows.includes(id)) {
                  return;
                }

                const workspaceRect = desktopRef.current.getBoundingClientRect();
                const layout = windowLayouts[id];

                setDragWindow({
                  id,
                  offsetX: event.clientX - workspaceRect.left - layout.x,
                  offsetY: event.clientY - workspaceRect.top - layout.y
                });
                bringWindowToFront(id);
              }}
            >
              {id === 'listen' ? (
                <>
                  <div className="overflow-hidden rounded-md border border-border">
                    <ListRow
                      title="Guided Listen"
                      detail="Short lead-ins before first play. Quiet pacing between tracks."
                      status="recommended"
                      action={
                        <button
                          type="button"
                          onClick={() => setListeningMode('guided')}
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Open
                        </button>
                      }
                    />
                    <ListRow
                      title="Direct Listen"
                      detail="Immediate playback. No lead-ins."
                      status="instant"
                      action={
                        <button
                          type="button"
                          onClick={() => setListeningMode('direct')}
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Open
                        </button>
                      }
                    />
                  </div>
                  <p className="pt-3 text-sm text-muted">Both paths are valid. Guided is only a pacing layer.</p>
                </>
              ) : null}

              {id === 'buy' ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <ListRow
                    title="Spotify"
                    detail="Stream release"
                    status="external"
                    action={
                      <a
                        href={accessLinks.stream.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Open
                      </a>
                    }
                  />
                  <ListRow
                    title="SoundCloud"
                    detail="Stream release"
                    status="external"
                    action={
                      <a
                        href={accessLinks.stream.soundcloud}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Open
                      </a>
                    }
                  />
                  <ListRow
                    title="Apple Music"
                    detail="Stream release"
                    status="external"
                    action={
                      <a
                        href={accessLinks.stream.appleMusic}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Open
                      </a>
                    }
                  />
                  <ListRow
                    title="Untitled"
                    detail="Stream release"
                    status="external"
                    action={
                      <a
                        href={accessLinks.stream.untitled}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Open
                      </a>
                    }
                  />
                  <ListRow
                    title="Bandcamp"
                    detail="Support the release"
                    status="support"
                    action={
                      <a
                        href={accessLinks.support.bandcamp}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Open
                      </a>
                    }
                  />
                </div>
              ) : null}

              {id === 'steal' ? (
                <>
                  <div className="overflow-hidden rounded-md border border-border">
                    <ListRow
                      title="Free Download Gate"
                      detail="Newsletter gate to free release files."
                      status="official"
                      action={
                        <button
                          type="button"
                          onClick={() => router.push('/download')}
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Open
                        </button>
                      }
                    />
                    <ListRow
                      title="MP3 Direct"
                      detail="Placeholder mirror endpoint."
                      status="placeholder"
                      action={
                        <a
                          href={downloadConfig.mp3Url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Open
                        </a>
                      }
                    />
                    <ListRow
                      title="WAV Direct"
                      detail="Placeholder mirror endpoint."
                      status="placeholder"
                      action={
                        <a
                          href={downloadConfig.wavUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Open
                        </a>
                      }
                    />
                    <ListRow
                      title="Soulseek room"
                      detail="Community room mirror."
                      status="community"
                      action={
                        <a
                          href={stealLinks.soulseekRoomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-muted transition-colors duration-ui ease-calm hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Open
                        </a>
                      }
                    />
                    <ListRow
                      title="Torrent magnet"
                      detail="Community archive link."
                      status="community"
                      action={
                        <a
                          href={stealLinks.magnetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-muted transition-colors duration-ui ease-calm hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Open
                        </a>
                      }
                    />
                  </div>
                  <p className="pt-3 text-sm text-muted">If you can support the release, use Buy. If not, use the free gate.</p>
                </>
              ) : null}

              {id === 'help' ? (
                <pre className="overflow-x-auto rounded-md border border-border bg-black/25 p-4 text-sm leading-6 text-muted">
                  {HELP_TEXT}
                </pre>
              ) : null}

              {id === 'lore' ? (
                <pre className="overflow-x-auto rounded-md border border-border bg-black/25 p-4 text-sm leading-6 text-muted">
                  {LORE_TEXT}
                </pre>
              ) : null}

              {id === 'trace' ? (
                <div className="space-y-4">
                  <pre className="overflow-x-auto rounded-md border border-border bg-black/25 p-4 text-sm leading-6 text-muted">
                    {TRACE_TEXT}
                  </pre>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={unlockKey}
                      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Run decode
                    </button>
                    <button
                      type="button"
                      onClick={() => setSystemLine('trace scan complete')}
                      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-muted transition-colors duration-ui ease-calm hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Scan
                    </button>
                  </div>
                </div>
              ) : null}

              {id === 'ghost' ? (
                <div className="space-y-4">
                  <pre className="overflow-x-auto rounded-md border border-border bg-black/25 p-4 text-sm leading-6 text-muted">
                    {`ghost_cache/

cache.bin ........ sealed
manifest.txt ..... partial
trace.mount ....... available`}
                  </pre>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!traceUnlocked) {
                          setTraceUnlocked(true);
                        }
                        setSystemLine('trace.route mounted from Ghost Cache');
                        openWindow('trace');
                      }}
                      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Mount trace
                    </button>
                    <button
                      type="button"
                      onClick={() => setSystemLine('cache.bin remains sealed')}
                      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-muted transition-colors duration-ui ease-calm hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Inspect cache.bin
                    </button>
                  </div>
                </div>
              ) : null}

              {id === 'key' ? (
                <div className="space-y-4">
                  <pre className="overflow-x-auto rounded-md border border-border bg-black/25 p-4 text-sm leading-6 text-muted">
                    {KEY_TEXT}
                  </pre>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push('/appendix')}
                      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Open Appendix
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/chapters')}
                      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Return to listening
                    </button>
                  </div>
                </div>
              ) : null}
            </FinderWindow>
          ))}
        </div>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-[#09090b]/92 px-4 py-2 backdrop-blur-[1px]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <p className="text-sm text-muted">{menuHint}</p>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            privacy
          </Link>
        </div>
      </footer>

      {systemStage === 'boot' ? (
        <ChamberBootOverlay
          label="System boot"
          title="Chamber OS version 0.2"
          subtitle="Loading desktop environment"
          progress={systemProgress}
        />
      ) : null}

      {systemStage === 'login' ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/76 px-4 backdrop-blur-[1px]">
          <section className="w-full max-w-[560px] rounded-[12px] border border-border bg-[#0d0d0f] p-4 sm:p-5 animate-window-pop">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Chambo OS</p>
            <h2 className="mt-2 text-xl font-medium text-text">Returning session detected</h2>
            <p className="mt-2 text-sm text-muted">Log in to continue, or restart to reboot the system.</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSystemStage('ready')}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Login
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm text-muted transition-colors duration-ui ease-calm hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Restart
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {systemStage === 'restart-progress' ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/76 px-4 backdrop-blur-[1px]">
          <section className="w-full max-w-[560px] rounded-[12px] border border-border bg-[#0d0d0f] p-4 sm:p-5 animate-window-pop">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Restart</p>
            <h2 className="mt-2 text-xl font-medium text-text">Preparing system restart</h2>
            <p className="mt-2 text-sm text-muted">Saving desktop state</p>
            <div className="mt-4 h-[2px] overflow-hidden rounded bg-border">
              <div
                className="h-full bg-text transition-[width] duration-150 ease-linear"
                style={{ width: `${Math.round(Math.min(Math.max(systemProgress, 0), 1) * 100)}%` }}
              />
            </div>
          </section>
        </div>
      ) : null}

      {systemStage === 'restart-spinner' ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/76 px-4 backdrop-blur-[1px]">
          <section className="w-full max-w-[560px] rounded-[12px] border border-border bg-[#0d0d0f] p-4 sm:p-5 animate-window-pop">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Restart</p>
            <h2 className="mt-2 text-xl font-medium text-text">Re-initializing services</h2>
            <p className="mt-2 text-sm text-muted">Please wait</p>
            <div className="mt-5 flex justify-center">
              <span
                aria-hidden="true"
                className="h-7 w-7 animate-spin rounded-full border-2 border-text/40 border-t-text"
              />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
