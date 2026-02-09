'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  editMenuItems,
  fileMenuItems,
  goMenuItems,
  helpMenuItems,
  systemMenuItems,
  viewMenuItems,
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

export function TopBar({ windows, focusedWindowId, onAction }: TopBarProps) {
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const orderedWindows = useMemo(() => [...windows].sort((a, b) => b.zIndex - a.zIndex), [windows]);
  const topMenus: Array<{ name: string; entries: MenuEntry[] }> = [
    { name: 'File', entries: fileMenuItems },
    { name: 'Edit', entries: editMenuItems },
    { name: 'View', entries: viewMenuItems },
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
      <header className="fixed inset-x-0 top-0 z-50 h-10 border-b border-border bg-[#0a0a0b] text-text">
        <div className="mx-auto flex h-full w-full items-center gap-2 px-2 sm:px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Chamber system menu"
                className="inline-flex min-h-9 items-center rounded-md px-2 transition-colors duration-ui ease-calm hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Image
                  src="/chamber-logo.svg"
                  alt="Chamber logo"
                  width={22}
                  height={14}
                  className="h-3.5 w-auto [filter:brightness(0)_invert(1)]"
                  priority
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <MenuList entries={systemMenuItems} onAction={handleAction} />
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-sm font-medium text-text">ChamberOS</span>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto" aria-label="Top bar menus">
            {topMenus.map((menu) => (
              <DropdownMenu key={menu.name}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {menu.name}
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
        </div>
      </header>

      <Dialog open={patchNotesOpen} onOpenChange={setPatchNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patch Notes</DialogTitle>
            <DialogDescription>ChamberOS v0.2 DMZ Build</DialogDescription>
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
            <DialogDescription>Close all windows and reset focus?</DialogDescription>
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
