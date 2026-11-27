import { useWindowSize } from '@/lib/hooks/use-window-size';
import { useLayoutEffect, useRef, useState, type AnimationEvent as ReactAnimationEvent, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { DESKTOP_MOTION } from '@/lib/desktop-motion';
import { getDockAppId } from '@/lib/dock-apps';
import type { ChamberWindow } from '@/lib/windowStore';
import { cn } from '@/lib/utils';

interface OSWindowProps {
  window: ChamberWindow;
  focused: boolean;
  minimising: boolean;
  mobile: boolean;
  uiScale: number;
  workspaceSize: { width: number; height: number };
  onFocus: (windowId: string) => void;
  onClose: (windowId: string) => void;
  onMinimise: (windowId: string) => void;
  onDragStart: (event: ReactPointerEvent<HTMLElement>, windowId: string) => void;
  children: ReactNode;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function OSWindow({
  window,
  focused,
  minimising,
  mobile,
  uiScale,
  workspaceSize,
  onFocus,
  onClose,
  onMinimise,
  onDragStart,
  children
}: OSWindowProps) {
  const frameRef = useRef<HTMLElement>(null);
  const { expanded, toggleSize } = useWindowSize(frameRef, minimising || window.isMinimised || !focused);
  const sizeLabel = expanded ? 'Restore window size' : 'Enter full screen';
  const [openingReady, setOpeningReady] = useState(false);
  const [openingDone, setOpeningDone] = useState(false);

  useLayoutEffect(() => {
    if (focused && !window.isMinimised) {
      frameRef.current?.focus({ preventScroll: true });
    }
  }, [focused, mobile, window.restoreOrigin, window.isMinimised]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const openOrigin = window.restoreOrigin ?? window.openOrigin;
    if (!frame || window.isMinimised) return;
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOpeningDone(true);
      return;
    }
    setOpeningReady(true);
    setOpeningDone(false);
    if (!openOrigin || mobile) return;
    const destination = frame.getBoundingClientRect();
    const startSize = window.restoreOrigin ? 60 : 68;
    const startScale = Math.min(0.2, startSize / Math.max(destination.width, destination.height));
    frame.style.setProperty('--chamber-open-x', `${openOrigin.x - destination.x - destination.width / 2}px`);
    frame.style.setProperty('--chamber-open-y', `${openOrigin.y - destination.y - destination.height / 2}px`);
    frame.style.setProperty('--chamber-open-scale', String(startScale));
  }, [window.openOrigin, window.restoreOrigin, window.isMinimised, mobile]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!minimising || !frame) return;
    setOpeningDone(true);
    if (mobile || globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const slot = document.querySelector<HTMLButtonElement>(`[data-dock-window="${CSS.escape(window.id)}"]`)
      ?? document.querySelector<HTMLButtonElement>(`[data-dock-app="${getDockAppId(window.appId)}"]`);
    if (!slot) return;
    slot.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    const destination = slot.querySelector('.chamber-dock-icon')?.getBoundingClientRect() ?? slot.getBoundingClientRect();
    const source = frame.getBoundingClientRect();
    frame.style.setProperty('--chamber-minimise-x', `${destination.x + destination.width / 2 - source.x - source.width / 2}px`);
    frame.style.setProperty('--chamber-minimise-y', `${destination.y + destination.height / 2 - source.y - source.height / 2}px`);
    frame.style.setProperty('--chamber-minimise-scale-x', String(destination.width / source.width));
    frame.style.setProperty('--chamber-minimise-scale-y', String(destination.height / source.height));
  }, [minimising, window.id, mobile]);
  const finishOpenAnimation = (event: ReactAnimationEvent<HTMLElement>) => {
    if (event.target === event.currentTarget && ['chamber-window-open-from-icon', 'window-pop'].includes(event.animationName)) {
      setOpeningDone(true);
    }
  };
  const openingFromIcon = openingReady && !openingDone;
  // Only one transform animation can own the frame at a time.
  const motionClass = minimising
    ? (mobile ? 'chamber-window-mobile-minimising' : 'chamber-window-minimising')
    : openingFromIcon
      ? (!mobile && (window.openOrigin || window.restoreOrigin) ? 'chamber-window-opening-from-icon' : 'animate-window-pop')
      : '';
  const motionStyle = {
    '--window-open-duration': `${DESKTOP_MOTION.open}ms`,
    '--window-minimise-duration': `${DESKTOP_MOTION.minimise}ms`
  } as CSSProperties;
  const isListenWindow = window.appId === 'listen';
  const isEdgeToEdgeWindow = isListenWindow || window.appId === 'text-quest';
  const scaledWidth = Math.min(Math.round(window.width * uiScale), Math.max(320, workspaceSize.width - 12));
  const scaledHeight = Math.min(Math.round(window.height * uiScale), Math.max(260, workspaceSize.height - 12));
  const left = clamp(window.x, 4, Math.max(4, workspaceSize.width - scaledWidth - 4));
  const top = clamp(window.y, 4, Math.max(4, workspaceSize.height - scaledHeight - 4));

  if (mobile) {
    return (
      <section
        ref={frameRef}
        data-chamber-window={window.id}
        data-expanded={expanded || undefined}
        role="region"
        tabIndex={-1}
        aria-label={window.title}
        hidden={!focused || window.isMinimised}
        className={cn(
          'pointer-events-auto h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[10px] border bg-[#0d0d0f] outline-none',
          focused && !window.isMinimised ? 'flex' : 'hidden',
          focused ? 'border-accent' : 'border-border',
          motionClass
        )}
        onPointerDown={() => onFocus(window.id)}
        onAnimationEnd={finishOpenAnimation}
        style={motionStyle}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-black/35 px-3 py-2">
          <p className="system-title min-w-0 break-words text-text">{window.title}</p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setOpeningDone(true);
                onMinimise(window.id);
              }}
            >
              minimise
            </Button>
            <Button type="button" size="sm" variant="ghost" aria-label={sizeLabel} title={sizeLabel}
              onPointerDown={event => event.stopPropagation()} onClick={toggleSize}>
              {expanded ? 'restore' : 'enlarge'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onClose(window.id)}
            >
              close
            </Button>
          </div>
        </header>
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-x-hidden',
            isEdgeToEdgeWindow ? 'overflow-hidden p-0' : 'overflow-y-auto p-3'
          )}
        >
          {children}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={frameRef}
      data-chamber-window={window.id}
      data-expanded={expanded || undefined}
      hidden={window.isMinimised}
      role="dialog"
      tabIndex={-1}
      aria-label={window.title}
      className={cn(
        'pointer-events-auto absolute overflow-hidden rounded-[6px] border bg-[#0d0d0f] shadow-[0_10px_20px_rgba(0,0,0,0.35)] outline-none',
        focused ? 'border-accent' : 'border-border',
        motionClass
      )}
      onPointerDown={() => onFocus(window.id)}
      onFocusCapture={() => onFocus(window.id)}
      onAnimationEnd={finishOpenAnimation}
      style={{
        ...motionStyle,
        left,
        top,
        width: scaledWidth,
        height: scaledHeight,
        zIndex: window.zIndex
      }}
    >
      <header
        className="flex h-10 cursor-move select-none items-center justify-between border-b border-border bg-[#1b1b1e] pl-3 pr-1.5"
        onPointerDown={(event) => {
          setOpeningDone(true);
          if (!expanded) onDragStart(event, window.id);
        }}
      >
        <p className="system-title min-w-0 truncate text-text" title={window.title}>{window.title}</p>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Minimise window"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              setOpeningDone(true);
              onMinimise(window.id);
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] border border-border bg-[#26262a] text-sm leading-none text-text hover:bg-[#39393e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            -
          </button>
          <button type="button" aria-label={sizeLabel} title={sizeLabel}
            onPointerDown={event => event.stopPropagation()} onClick={toggleSize}
            className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] border border-border bg-[#26262a] text-sm leading-none text-text hover:bg-[#39393e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span aria-hidden="true">{expanded ? '❐' : '□'}</span>
          </button>
          <button
            type="button"
            aria-label="Close window"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onClose(window.id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] border border-border bg-[#26262a] text-sm leading-none text-text hover:bg-[#39393e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            x
          </button>
        </div>
      </header>

      <div
        className={cn(
          'h-[calc(100%-2.5rem)]',
          isEdgeToEdgeWindow ? 'overflow-hidden p-0' : 'overflow-auto p-3'
        )}
      >
        {children}
      </div>
    </section>
  );
}
