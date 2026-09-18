'use client';

import { type PointerEvent as ReactPointerEvent, type ReactNode, useMemo, useState } from 'react';

import { ChamberTextQuest } from '@/components/windows/apps/ChamberTextQuest';
import { LoreMap } from '@/components/windows/apps/LoreMap';
import { AboutChamberOS } from '@/components/windows/apps/AboutChamberOS';
import { Notes } from '@/components/windows/apps/Notes';
import { SecondLifeWinampPlayer } from '@/components/windows/apps/SecondLifeWinampPlayer';
import { Settings } from '@/components/windows/apps/Settings';
import { ChamberLink, ContactMail, FrngeProfile, ListenDirectory, ReleaseDirectory } from '@/components/windows/apps/FrngeApps';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { tracks } from '@/lib/config';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';
import type { Track } from '@/lib/types';
import type { AppId, ChamberWindow } from '@/lib/windowStore';
import { cn } from '@/lib/utils';
import { OSWindow } from '@/components/windows/OSWindow';

interface WindowManagerProps {
  windows: ChamberWindow[];
  focusedWindowId: string | null;
  activeTrackId: string | null;
  autoplayToken: number;
  uiScale: number;
  workspaceSize: { width: number; height: number };
  onOpenWindow: (appId: AppId) => void;
  onPlayTrack: (trackId: string) => void;
  onFocusWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
  onMinimiseWindow: (windowId: string) => void;
  onWindowDragStart: (event: ReactPointerEvent<HTMLElement>, windowId: string) => void;
}

function renderApp(
  appId: AppId,
  activeTrack: Track | null,
  autoplayToken: number,
  onPlayTrack: (trackId: string) => void
): ReactNode {
  if (appId === 'credits') {
    return <AboutChamberOS />;
  }

  if (appId === 'about') {
    return <FrngeProfile />;
  }

  if (appId === 'text-quest') {
    return <ChamberTextQuest />;
  }

  if (appId === 'library') {
    return <ReleaseDirectory />;
  }

  if (appId === 'listen') {
    return <SecondLifeWinampPlayer track={activeTrack} autoplayToken={autoplayToken} />;
  }

  if (appId === 'support') {
    return <ListenDirectory />;
  }

  if (appId === 'steal') {
    return <ContactMail />;
  }

  if (appId === 'lore-map') {
    return <LoreMap />;
  }

  if (appId === 'lore-index') {
    return <ChamberLink />;
  }

  if (appId === 'settings') {
    return <Settings />;
  }

  if (appId === 'system-status') {
    return (
      <Notes
        heading="System Status"
        machine
        hint="Current diagnostics"
        initialText={[
          'System: stable',
          'Threat monitor: Mid Tech House contamination (low)',
          'Network: kakNET intermittent',
          'Queue health: nominal'
        ].join('\n')}
        readOnly
      />
    );
  }

  if (appId === 'recents') {
    return (
      <Notes
        heading="Recents"
        hint="Recent artefacts"
        initialText={['- Owe Me Nothing (last opened)', '- chamber.key', '- trace.route'].join('\n')}
        readOnly
      />
    );
  }

  if (appId === 'documents') {
    return (
      <Notes
        heading="Support"
        hint="platform links"
        initialText={['- Spotify', '- Apple Music', '- Bandcamp', '- Untitled'].join('\n')}
        readOnly
      />
    );
  }

  if (appId === 'downloads') {
    return (
      <Notes
        heading="Steal"
        hint="free mirror panel"
        initialText={['- Free download gate', '- MP3 mirror', '- WAV mirror', '- magnet link'].join('\n')}
        readOnly
      />
    );
  }

  if (appId === 'network') {
    return (
      <Notes
        heading="Network"
        hint="kakNET endpoint index"
        initialText={['- relay-1: connected', '- relay-2: unstable', '- relay-3: sleeping'].join('\n')}
        readOnly
      />
    );
  }

  return <Notes heading="Notes" hint="Local notes" initialText="" />;
}

export function WindowManager({
  windows,
  focusedWindowId,
  activeTrackId,
  autoplayToken,
  uiScale,
  workspaceSize,
  onOpenWindow,
  onPlayTrack,
  onFocusWindow,
  onCloseWindow,
  onMinimiseWindow,
  onWindowDragStart
}: WindowManagerProps) {
  const isMobile = useIsMobile();
  const [modulesOpen, setModulesOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const activeTrack = useMemo(() => tracks.find((track) => track.id === activeTrackId) ?? null, [activeTrackId]);

  const visibleWindows = useMemo(
    () => windows.filter((window) => !window.isMinimised).sort((a, b) => a.zIndex - b.zIndex),
    [windows]
  );
  const hasForegroundWindow = visibleWindows.some((window) => window.id === focusedWindowId);
  // Keep mobile apps mounted while hidden so their local state survives app switching.
  const renderedWindows = isMobile ? windows : visibleWindows;

  return (
    <>
      <section
        className={cn(
          isMobile
            ? cn('absolute inset-3 z-20 min-h-0 min-w-0 overflow-hidden', hasForegroundWindow ? 'pointer-events-auto' : 'pointer-events-none')
            : 'pointer-events-none relative h-full w-full'
        )}
      >
        {renderedWindows.map((window) => (
          <OSWindow
            key={window.id}
            window={window}
            focused={window.id === focusedWindowId}
            mobile={isMobile}
            uiScale={uiScale}
            workspaceSize={workspaceSize}
            onFocus={onFocusWindow}
            onClose={onCloseWindow}
            onMinimise={onMinimiseWindow}
            onDragStart={onWindowDragStart}
          >
            {renderApp(
              window.appId,
              activeTrack,
              autoplayToken,
              onPlayTrack
            )}
          </OSWindow>
        ))}
      </section>

      <Dialog open={modulesOpen} onOpenChange={setModulesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Installed Modules</DialogTitle>
            <DialogDescription>Resident package inventory</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-text">
            <li>kakNET Runtime Bridge</li>
            <li>Maldon Salt Geometry</li>
            <li>Distortion Engine</li>
            <li>Queue Integrity Watcher</li>
          </ul>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setModulesOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => onOpenWindow('lore-index')}>
              Open Lore Index
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={certOpen} onOpenChange={setCertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regulatory Certification</DialogTitle>
            <DialogDescription>Certified for: ritual-grade playback</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCertOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
