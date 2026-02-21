'use client';

import { type PointerEvent as ReactPointerEvent, type ReactNode, useMemo, useState } from 'react';

import { AboutChamberOS } from '@/components/windows/apps/AboutChamberOS';
import { ChamberTextQuest } from '@/components/windows/apps/ChamberTextQuest';
import { LoreIndex } from '@/components/windows/apps/LoreIndex';
import { LoreMap } from '@/components/windows/apps/LoreMap';
import { Notes } from '@/components/windows/apps/Notes';
import { SecondLifeLibrary } from '@/components/windows/apps/SecondLifeLibrary';
import { SecondLifeWinampPlayer } from '@/components/windows/apps/SecondLifeWinampPlayer';
import { Settings } from '@/components/windows/apps/Settings';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { accessLinks, downloadConfig, stealLinks, tracks } from '@/lib/config';
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
  onOpenModules: () => void,
  onOpenCertification: () => void,
  activeTrack: Track | null,
  activeTrackId: string | null,
  autoplayToken: number,
  onPlayTrack: (trackId: string) => void
): ReactNode {
  if (appId === 'about') {
    return <AboutChamberOS onOpenModules={onOpenModules} onOpenCertification={onOpenCertification} />;
  }

  if (appId === 'text-quest') {
    return <ChamberTextQuest />;
  }

  if (appId === 'library') {
    return <SecondLifeLibrary activeTrackId={activeTrackId} onPlayTrack={onPlayTrack} />;
  }

  if (appId === 'listen') {
    return <SecondLifeWinampPlayer track={activeTrack} autoplayToken={autoplayToken} />;
  }

  if (appId === 'support') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-text">Support</h3>
          <p className="text-sm text-muted">Choose a platform.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={accessLinks.stream.spotify}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            Spotify
          </a>
          <a
            href={accessLinks.stream.appleMusic}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            Apple Music
          </a>
          <a
            href={accessLinks.stream.untitled}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            Untitled
          </a>
          <a
            href={accessLinks.support.bandcamp}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            Bandcamp
          </a>
        </div>
      </div>
    );
  }

  if (appId === 'steal') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-text">Steal</h3>
          <p className="text-sm text-muted">Free routes.</p>
        </div>
        <div className="grid gap-2">
          <a
            href="/download"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            Free download gate
          </a>
          <a
            href={downloadConfig.mp3Url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            MP3 mirror
          </a>
          <a
            href={downloadConfig.wavUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            WAV mirror
          </a>
          <a
            href={stealLinks.magnetUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            Torrent magnet
          </a>
          <a
            href={stealLinks.soulseekRoomUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent"
          >
            Soulseek room
          </a>
        </div>
      </div>
    );
  }

  if (appId === 'lore-map') {
    return <LoreMap />;
  }

  if (appId === 'lore-index') {
    return <LoreIndex />;
  }

  if (appId === 'settings') {
    return <Settings />;
  }

  if (appId === 'system-status') {
    return (
      <Notes
        heading="System Status"
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
  const hasVisibleWindows = visibleWindows.length > 0;

  return (
    <>
      <section
        className={cn(
          'w-full',
          isMobile
            ? cn('absolute inset-0 z-20 space-y-3 overflow-y-auto pb-2 pr-1', hasVisibleWindows ? 'pointer-events-auto' : 'pointer-events-none')
            : 'pointer-events-none relative h-full'
        )}
      >
        {visibleWindows.map((window) => (
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
              () => setModulesOpen(true),
              () => setCertOpen(true),
              activeTrack,
              activeTrackId,
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
