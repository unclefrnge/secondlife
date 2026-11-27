'use client';

import { type PointerEvent as ReactPointerEvent, type ReactNode, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';
import type { TillProgress } from '@/components/games/Till';
import { ChamberTextQuest } from '@/components/windows/apps/ChamberTextQuest';
import { LoreMap } from '@/components/windows/apps/LoreMap';
import { AboutChamberOS } from '@/components/windows/apps/AboutChamberOS';
import { Notes } from '@/components/windows/apps/Notes';
import { FileBrowser } from '@/components/windows/apps/FileBrowser';
import type { Recording } from '@/app/work/Recordings';
import { ResidentMiniPlayer } from '@/components/player/ResidentMiniPlayer';
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

const ResidentRecordingWindow = dynamic(() => import('@/components/player/ResidentRecordingWindow').then(module => module.ResidentRecordingWindow));
const Till = dynamic(() => import('@/components/games/Till').then(module => module.Till));
const Firefly = dynamic(() => import('@/components/games/Firefly').then(module => module.Firefly));

interface WindowManagerProps {
  tillProgress: TillProgress;
  deliveredFileIds: string[];
  onFileRead: (id: string) => void;
  onNavigateFiles: (windowId: string, entryId: string) => void;
  windows: ChamberWindow[];
  focusedWindowId: string | null;
  calendarRecording: Recording | null;
  activeTrackId: string | null;
  autoplayToken: number;
  uiScale: number;
  workspaceSize: { width: number; height: number };
  minimisingWindowIds: string[];
  onOpenWindow: (appId: AppId) => void;
  onPlayTrack: (trackId: string) => void;
  onFocusWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
  onMinimiseWindow: (windowId: string) => void;
  onRestoreWindow: (windowId: string) => void;
  onWindowDragStart: (event: ReactPointerEvent<HTMLElement>, windowId: string) => void;
}

function renderApp(
  appId: AppId,
  tillProgress: TillProgress,
  activeTrack: Track | null,
  autoplayToken: number,
  onPlayTrack: (trackId: string) => void
): ReactNode {
  if (appId === 'till') return <Till {...tillProgress} />;
  if (appId === 'firefly') return <Firefly />;

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
    return <SecondLifeWinampPlayer track={activeTrack} autoplayToken={autoplayToken} onPlayTrack={onPlayTrack} />;
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
  tillProgress,
  deliveredFileIds,
  onFileRead,
  onNavigateFiles,
  windows,
  focusedWindowId,
  calendarRecording,
  activeTrackId,
  autoplayToken,
  uiScale,
  workspaceSize,
  minimisingWindowIds,
  onOpenWindow,
  onPlayTrack,
  onFocusWindow,
  onCloseWindow,
  onMinimiseWindow,
  onRestoreWindow,
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
  // Preserve app state (including quest progress and notes) when minimising on any screen.
  const renderedWindows = windows;
  const mini = windows.find(item => item.appId === 'listen' && item.isMinimised);

  return (
    <>
      <section
        className={cn(
          isMobile
            ? cn('absolute inset-3 z-20 min-h-0 min-w-0', hasForegroundWindow ? 'pointer-events-auto' : 'pointer-events-none')
            : 'pointer-events-none relative h-full w-full'
        )}
      >
        {renderedWindows.map((window) => window.appId === 'listen' && calendarRecording ? (
          <ResidentRecordingWindow key={window.id} recording={calendarRecording} id={window.id}
            focused={window.id === focusedWindowId} mini={window.isMinimised}
            layer={window.isMinimised ? Math.max(...windows.map(item => item.zIndex)) + 1 : window.zIndex}
            onFocus={() => onFocusWindow(window.id)} onClose={() => onCloseWindow(window.id)}
            onMinimise={() => onMinimiseWindow(window.id)} onRestore={() => onRestoreWindow(window.id)} />
        ) : (
          <OSWindow
            key={window.id}
            window={window}
            focused={window.id === focusedWindowId}
            minimising={minimisingWindowIds.includes(window.id)}
            mobile={isMobile}
            uiScale={uiScale}
            workspaceSize={workspaceSize}
            onFocus={onFocusWindow}
            onClose={onCloseWindow}
            onMinimise={onMinimiseWindow}
            onDragStart={onWindowDragStart}
          >
            {window.appId === 'files' ? <FileBrowser onGame={onOpenWindow} entryId={window.entryId} onNavigate={(entryId) => onNavigateFiles(window.id, entryId)} onPlayTrack={onPlayTrack} deliveredFileIds={deliveredFileIds} onFileRead={onFileRead} /> : renderApp(
              window.appId,
              tillProgress,
              activeTrack,
              autoplayToken,
              onPlayTrack
            )}
          </OSWindow>
        ))}
        {mini && !calendarRecording && activeTrack && <ResidentMiniPlayer title={activeTrack.title} layer={Math.max(...windows.map(item => item.zIndex)) + 1}
          onRestore={() => onRestoreWindow(mini.id)} onClose={() => onCloseWindow(mini.id)} />}
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
