'use client';

import Image from 'next/image';
import { CalendarClock } from '@/components/calendar/CalendarClock';
import type { Recording } from '@/app/work/Recordings';
import { PixelMoon } from './PixelMoon';
import { chamberBuild } from '@/lib/config';
import { useChamberClock } from '@/lib/hooks/use-chamber-clock';
import { useMemo, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  editMenuItems,
  fileMenuItems,
  goMenuItems,
  helpMenuItems,
  systemMenuItems,
  windowMenuItems,
  type MenuEntry,
  type TopBarAction
} from '@/components/topbar/menus';
import type { ChamberWindow } from '@/lib/windowStore';
import { cn } from '@/lib/utils';

interface TopBarProps {
  windows: ChamberWindow[];
  focusedWindowId: string | null;
  onAction: (action: TopBarAction) => void;
  onLogout: () => void;
  onRecording: (recording: Recording) => void;
}

function MenuList({ entries, onAction }: { entries: MenuEntry[]; onAction: (action: TopBarAction) => void }) {
  return (
    <>
      {entries.map((entry) => {
        if (entry.separator) {
          return <DropdownMenuSeparator key={entry.id} />;
        }

        return (
          <DropdownMenuItem key={entry.id} onSelect={() => entry.action && onAction(entry.action)}>
            {entry.label}
            {entry.shortcut ? <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut> : null}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

export function TopBar({ windows, focusedWindowId, onAction, onLogout, onRecording }: TopBarProps) {
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const clock = useChamberClock();
  const { chamberCycle } = clock;
  const orderedWindows = useMemo(() => [...windows].sort((a, b) => b.zIndex - a.zIndex), [windows]);
  const topMenus: Array<{ name: string; entries: MenuEntry[] }> = [
    { name: 'File', entries: fileMenuItems },
    { name: 'Edit', entries: editMenuItems },
    { name: 'Go', entries: goMenuItems },
    { name: 'Window', entries: windowMenuItems },
    { name: 'Help', entries: helpMenuItems }
  ];

  const handleAction = (action: TopBarAction) => {
    if (action.type === 'show-patch-notes') {
      setPatchNotesOpen(true);
      return;
    }

    if (action.type === 'show-quit-dialog') {
      setQuitOpen(true);
      return;
    }

    if (action.type === 'show-keyboard-shortcuts') {
      setShortcutsOpen(true);
      return;
    }

    if (action.type === 'show-mid-tech-house-report') {
      setReportOpen(true);
      return;
    }

    if (action.type === 'reset-desktop') {
      setResetConfirmOpen(true);
      return;
    }

    onAction(action);
  };

  return (
    <>
      <header className="chamber-topbar fixed inset-x-0 top-0 z-50 h-10 border-b border-border bg-[#0a0a0b] text-text">
        <div className="mx-auto flex h-full w-full items-center gap-1 px-2 sm:gap-2 sm:px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Chamber system menu"
                className="inline-flex min-h-9 items-center rounded-md px-2 transition-colors duration-ui ease-calm hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Image
                  src="/chamber-logo.svg"
                  alt="Chamber Collective"
                  width={34}
                  height={18}
                  className="h-[18px] w-[34px] [filter:brightness(0)_invert(1)]"
                  priority
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <MenuList entries={systemMenuItems} onAction={handleAction} />
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><a href="/" target="_blank" rel="noreferrer">home links ↗</a></DropdownMenuItem>
              <DropdownMenuItem onSelect={onLogout}>log out Knight</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="min-h-9 rounded-md px-2 text-sm hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent">menu</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[70dvh] overflow-y-auto">
                {topMenus.map((menu) => (
                  <div key={menu.name}>
                    <DropdownMenuLabel>{menu.name.toLowerCase()}</DropdownMenuLabel>
                    <MenuList entries={menu.entries} onAction={handleAction} />
                    {menu.name === 'Window' ? orderedWindows.map((window) => (
                      <DropdownMenuItem key={window.id} onSelect={() => handleAction({ type: 'focus-window', windowId: window.id })}>
                        {window.isMinimised ? 'Restore ' : ''}{window.title}
                      </DropdownMenuItem>
                    )) : null}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 sm:flex" aria-label="Top bar menus">
            {topMenus.map((menu) => (
              <DropdownMenu key={menu.name}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {menu.name.toLowerCase()}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <MenuList entries={menu.entries} onAction={handleAction} />

                  {menu.name === 'Window' ? (
                    <>
                      <DropdownMenuSeparator />
                      {orderedWindows.length === 0 ? (
                        <DropdownMenuItem disabled>No open windows</DropdownMenuItem>
                      ) : (
                        orderedWindows.map((window) => (
                          <DropdownMenuCheckboxItem
                            key={window.id}
                            checked={focusedWindowId === window.id}
                            onSelect={() => handleAction({ type: 'focus-window', windowId: window.id })}
                          >
                            <span className={cn(window.isMinimised ? 'opacity-60' : '')}>{window.title}</span>
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </nav>

          <div className="chamber-status-cluster ml-auto flex h-full shrink-0 items-center text-muted" aria-label="Chamber status">
            <div
              className="chamber-cycle flex items-center gap-1.5 px-1.5 sm:px-2"
              role="img"
              aria-label={chamberCycle ? `Chamber cycle: ${chamberCycle.name}, ${chamberCycle.code}` : 'Chamber cycle'}
              title={chamberCycle ? `${chamberCycle.name} · ${chamberCycle.code}` : 'Chamber cycle'}
            >
              <PixelMoon fraction={chamberCycle?.fraction} />
              <span className="hidden whitespace-nowrap font-machine text-[13px] lg:inline">
                {chamberCycle ? `${chamberCycle.name} · ${chamberCycle.code}` : 'cycle --'}
              </span>
            </div>
            <CalendarClock clock={clock} onRecording={onRecording} />
          </div>
        </div>
      </header>

      <Dialog open={patchNotesOpen} onOpenChange={setPatchNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patch Notes</DialogTitle>
            <DialogDescription>ChamberOS {chamberBuild}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-text">
            <li>Added macOS-style top menu system.</li>
            <li>Window manager now handles focus and minimise state.</li>
            <li>Improved launcher paths for lore and quest utilities.</li>
          </ul>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPatchNotesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quitOpen} onOpenChange={setQuitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quit ChamberOS</DialogTitle>
            <DialogDescription>Silence is a crime.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setQuitOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => setQuitOpen(false)}>
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Top bar shortcuts</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-text">
            <li><span className="text-muted">⌘N</span> New Window</li>
            <li><span className="text-muted">⌘W</span> Close Window</li>
            <li><span className="text-muted">⌘M</span> Minimise Window</li>
            <li><span className="text-muted">⌘C</span> Copy Sigil ID</li>
          </ul>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShortcutsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mid Tech House</DialogTitle>
            <DialogDescription>Thanks. The Chamber has logged your fear.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setReportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Desktop</DialogTitle>
            <DialogDescription>Close all windows and restore the centered icon layout?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setResetConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onAction({ type: 'reset-desktop' });
                setResetConfirmOpen(false);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
