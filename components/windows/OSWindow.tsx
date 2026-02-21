import { type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { ChamberWindow } from '@/lib/windowStore';
import { cn } from '@/lib/utils';

interface OSWindowProps {
  window: ChamberWindow;
  focused: boolean;
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
  mobile,
  uiScale,
  workspaceSize,
  onFocus,
  onClose,
  onMinimise,
  onDragStart,
  children
}: OSWindowProps) {
  const isListenWindow = window.appId === 'listen';
  const scaledWidth = Math.min(Math.round(window.width * uiScale), Math.max(320, workspaceSize.width - 12));
  const scaledHeight = Math.min(Math.round(window.height * uiScale), Math.max(260, workspaceSize.height - 12));
  const left = clamp(window.x, 4, Math.max(4, workspaceSize.width - scaledWidth - 4));
  const top = clamp(window.y, 4, Math.max(4, workspaceSize.height - scaledHeight - 4));

  if (mobile) {
    return (
      <section
        className={cn(
          'pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border bg-[#0d0d0f]',
          focused ? 'border-accent' : 'border-border'
        )}
        onPointerDown={() => onFocus(window.id)}
      >
        <header className="flex items-center justify-between border-b border-border bg-black/35 px-3 py-2">
          <p className="truncate text-sm font-medium text-text">{window.title}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onMinimise(window.id)}
            >
              Minimise
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onClose(window.id)}
            >
              Close
            </Button>
          </div>
        </header>
        <div className={cn('min-h-0 flex-1 overflow-y-auto', isListenWindow ? 'p-0' : 'p-3')}>{children}</div>
      </section>
    );
  }

  return (
    <section
      role="dialog"
      aria-label={window.title}
      className={cn(
        'pointer-events-auto absolute overflow-hidden rounded-[10px] border bg-[#0d0d0f] shadow-[0_10px_20px_rgba(0,0,0,0.35)]',
        focused ? 'border-accent' : 'border-border'
      )}
      onMouseDown={() => onFocus(window.id)}
      style={{
        left,
        top,
        width: scaledWidth,
        height: scaledHeight,
        zIndex: window.zIndex
      }}
    >
      <header
        className="flex h-10 cursor-move select-none items-center justify-between border-b border-border bg-black/35 px-3"
        onPointerDown={(event) => onDragStart(event, window.id)}
      >
        <p className="truncate text-sm font-medium text-text">{window.title}</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Minimise window"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMinimise(window.id)}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/30 bg-[#febc2e] text-[9px] text-black/80"
          >
            -
          </button>
          <button
            type="button"
            aria-label="Close window"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onClose(window.id)}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/30 bg-[#ff5f57] text-[9px] text-black/80"
          >
            x
          </button>
        </div>
      </header>

      <div className={cn('h-[calc(100%-2.5rem)] overflow-auto', isListenWindow ? 'p-0' : 'p-3')}>{children}</div>
    </section>
  );
}
