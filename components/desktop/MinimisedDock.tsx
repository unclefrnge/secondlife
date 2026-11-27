'use client';

import Image from 'next/image';
import { useEffect, useRef, type PointerEvent } from 'react';

import { DOCK_APPS, getDockAppId, type DockAppId } from '@/lib/dock-apps';
import type { ChamberWindow } from '@/lib/windowStore';

interface MinimisedDockProps {
  windows: ChamberWindow[];
  focusedWindowId: string | null;
  busyWindowIds: string[];
  onActivate: (appId: DockAppId, origin: { x: number; y: number }) => void;
}

const ICON_SIZE = 48;
const MAGNIFICATION = 18;
const REACH = 120;

export function MinimisedDock({ windows, focusedWindowId, busyWindowIds, onActivate }: MinimisedDockProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const strip = stripRef.current;
    const scroller = strip?.parentElement;
    if (!strip || !scroller) return;
    const observer = new ResizeObserver(() => {
      scroller.toggleAttribute('data-overflow', strip.getBoundingClientRect().width > scroller.clientWidth + 1);
    });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reset = () => strip.querySelectorAll<HTMLElement>('[data-dock-item]').forEach((item) => item.style.removeProperty('--dock-size'));
    observer.observe(strip);
    observer.observe(scroller);
    motion.addEventListener('change', reset);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameRef.current);
      motion.removeEventListener('change', reset);
    };
  }, []);

  const magnify = (clientX: number | null, focusedId?: string) => {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      const strip = stripRef.current;
      if (!strip) return;
      const slots = Array.from(strip.querySelectorAll<HTMLElement>('[data-dock-item]'));
      const allowed = !window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px), (hover: none)').matches;
      const rect = strip.getBoundingClientRect();
      // Use fixed, unmagnified centres so changing widths cannot feed back into
      // the hover calculation and make the dock wobble under a stationary cursor.
      const start = rect.left + rect.width / 2 - slots.length * (ICON_SIZE + 8) / 2;
      const focusedIndex = slots.findIndex((slot) => slot.dataset.dockItem === focusedId);
      const origin = focusedIndex >= 0 ? start + (focusedIndex + 0.5) * (ICON_SIZE + 8) : clientX;
      slots.forEach((slot, index) => {
        const distance = origin === null ? REACH : Math.abs(origin - (start + (index + 0.5) * (ICON_SIZE + 8)));
        const influence = allowed && distance < REACH ? (Math.cos(distance / REACH * Math.PI) + 1) / 2 : 0;
        slot.style.setProperty('--dock-size', `${ICON_SIZE + MAGNIFICATION * influence}px`);
      });
    });
  };

  const pointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') magnify(event.clientX);
  };

  return (
    <footer className="chamber-taskbar" aria-label="Applications">
      <div className="chamber-dock-shell">
        <div className="chamber-dock-scroll">
          <div
            ref={stripRef}
            className="chamber-dock"
            onPointerMove={pointerMove}
            onPointerLeave={() => magnify(null)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) magnify(null); }}
          >
            {DOCK_APPS.map((app) => {
              const appWindows = windows.filter((item) => getDockAppId(item.appId) === app.appId).sort((a, b) => b.zIndex - a.zIndex);
              const target = appWindows[0];
              const running = appWindows.length > 0;
              const active = appWindows.some((item) => item.id === focusedWindowId && !item.isMinimised);
              const action = !target ? 'Open' : target.isMinimised ? 'Restore' : 'Show';
              return (
                <div key={app.appId} className="chamber-dock-item" data-dock-item={app.appId}>
                  <button
                    type="button"
                    className="chamber-task-tile"
                    data-dock-app={app.appId}
                    data-dock-window={target?.id}
                    data-running={running || undefined}
                    data-active={active || undefined}
                    disabled={!!target && busyWindowIds.includes(target.id)}
                    aria-label={`${action} ${app.label}${running ? ' (running)' : ''}`}
                    onFocus={() => magnify(null, app.appId)}
                    onClick={(event) => {
                      const icon = event.currentTarget.querySelector('.chamber-dock-icon') ?? event.currentTarget;
                      const rect = icon.getBoundingClientRect();
                      onActivate(app.appId, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                      magnify(null);
                    }}
                  >
                    <span className="chamber-dock-label" aria-hidden="true">{app.label}</span>
                    <span className="chamber-dock-icon" aria-hidden="true">
                      <Image src={app.iconSrc} alt="" width={66} height={66} unoptimized draggable={false} className="breeze-icon" />
                    </span>
                    {running ? <span className="chamber-dock-running" aria-hidden="true" /> : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
