'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AccessModal } from '@/components/chapters/access-modal';
import { InfoModal } from '@/components/chapters/info-modal';
import { InterstitialOverlay } from '@/components/chapters/interstitial-overlay';
import { ModeToggle } from '@/components/chapters/mode-toggle';
import { StealModal } from '@/components/chapters/steal-modal';
import { GuidedLeadIn } from '@/components/guided/guided-leadin';
import { Button } from '@/components/ui/button';
import { ChamberBootOverlay } from '@/components/ui/chamber-boot-overlay';
import { WindowControls } from '@/components/ui/window-controls';
import { interstitialLines, project, tracks } from '@/lib/config';
import { useSecondLifeState } from '@/lib/hooks/use-second-life-state';
import type { ListeningMode, Track } from '@/lib/types';
import { cn, uniquePush, withAutoplay } from '@/lib/utils';

type TrackState = 'sealed' | 'ready' | 'playing' | 'completed';

const SHORTCUT_CLASS =
  'inline-flex min-h-11 w-full items-center justify-between rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:bg-white/[0.03] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function toTrackFilename(track: Track) {
  const clean = track.title
    .toLowerCase()
    .replace(/\(ft\.[^)]+\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${track.order.toString().padStart(2, '0')}-${clean}.m4a`;
}

function AudioFileGlyph({ state }: { state: TrackState }) {
  const tone = state === 'playing' ? 'bg-text/18 border-accent' : 'bg-zinc-500/75 border-border';

  return (
    <span aria-hidden="true" className={cn('relative block h-[48px] w-[38px] rounded-[5px] border', tone)}>
      <span className="absolute right-0 top-0 h-[13px] w-[13px] border-b border-l border-border bg-bg/85" />
      <svg
        viewBox="0 0 24 24"
        className="absolute left-[8px] top-[15px] h-[22px] w-[22px]"
        fill="none"
        stroke="rgba(243,241,234,0.88)"
        strokeWidth="1.6"
      >
        <path d="M10 6v9.2a2.6 2.6 0 1 1-1.5-2.3V8.6l6-1.6v7.2a2.6 2.6 0 1 1-1.5-2.3V6.6L10 7.4" />
      </svg>
    </span>
  );
}

interface TrackFileButtonProps {
  track: Track;
  mode: ListeningMode;
  state: TrackState;
  onOpen: (track: Track) => void;
}

function TrackFileButton({ track, mode, state, onOpen }: TrackFileButtonProps) {
  const statusLabel =
    state === 'playing' ? 'playing' : state === 'completed' ? 'completed' : state === 'sealed' ? 'sealed' : 'ready';

  return (
    <button
      type="button"
      onClick={() => onOpen(track)}
      className={cn(
        'group min-h-24 rounded-[10px] border p-3 text-left transition-colors duration-ui ease-calm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        state === 'playing' ? 'border-accent bg-white/[0.04]' : 'border-border bg-black/25 hover:border-accent/70'
      )}
      aria-label={`${track.order.toString().padStart(2, '0')} ${track.title}, ${statusLabel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <AudioFileGlyph state={state} />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
              {track.order.toString().padStart(2, '0')}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-text">{track.title}</p>
            <p className="mt-1 truncate text-xs text-muted">{toTrackFilename(track)}</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted">
          <span
            aria-hidden="true"
            className={cn(
              'h-2 w-2 rounded-full border border-border',
              state === 'playing' ? 'bg-text' : state === 'completed' ? 'bg-muted' : 'bg-transparent'
            )}
          />
          {statusLabel}
        </span>
      </div>

      {mode === 'guided' && state === 'sealed' ? (
        <p className="mt-2 text-xs text-muted">opens with lead-in</p>
      ) : (
        <p className="mt-2 text-xs text-muted">open file</p>
      )}
    </button>
  );
}

export default function ChaptersPage() {
  const router = useRouter();
  const [launchMode, setLaunchMode] = useState<ListeningMode | null>(null);
  const [launchBoot, setLaunchBoot] = useState(false);

  const {
    state,
    isHydrated,
    storageEnabled,
    setMode,
    markGuidedLeadInComplete,
    markTrackStarted,
    markTrackCompleted,
    resetProgress,
    hasOpenedGuidedTrack,
    hasCompletedTrack,
    shouldTriggerLeadIn,
    progress
  } = useSecondLifeState();

  const [accessOpen, setAccessOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [stealOpen, setStealOpen] = useState(false);
  const [leadInTrackId, setLeadInTrackId] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [interstitialOpen, setInterstitialOpen] = useState(false);
  const [loadedEmbedIds, setLoadedEmbedIds] = useState<string[]>([]);
  const [loadingEmbedIds, setLoadingEmbedIds] = useState<string[]>([]);
  const [booting, setBooting] = useState(false);
  const [bootMode, setBootMode] = useState<ListeningMode>('guided');
  const [bootProgress, setBootProgress] = useState(0);
  const [playerMinimized, setPlayerMinimized] = useState(false);
  const [playerExpanded, setPlayerExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const boot = params.get('boot') === '1' || params.get('app') === 'cmp';

    setLaunchMode(mode === 'guided' || mode === 'direct' ? mode : null);
    setLaunchBoot(boot);
  }, []);

  useEffect(() => {
    if (launchMode === 'guided' || launchMode === 'direct') {
      setMode(launchMode);
    }
  }, [launchMode, setMode]);

  useEffect(() => {
    if (!isHydrated || !launchBoot) {
      return;
    }

    const modeForBoot: ListeningMode =
      launchMode === 'guided' || launchMode === 'direct' ? launchMode : state.mode;

    setBootMode(modeForBoot);
    setBooting(true);
    setBootProgress(0);

    const durationMs = 1150;
    const startedAt = performance.now();
    let frame = 0;
    let timeout = 0;

    const tick = (now: number) => {
      const progressValue = Math.min((now - startedAt) / durationMs, 1);
      setBootProgress(progressValue);

      if (progressValue < 1) {
        frame = window.requestAnimationFrame(tick);
        return;
      }

      timeout = window.setTimeout(() => {
        setBooting(false);
        if (window.history.replaceState) {
          window.history.replaceState({}, '', '/chapters');
        }
        setLaunchBoot(false);
      }, 110);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [isHydrated, launchBoot, launchMode, state.mode]);

  const leadInTrack = useMemo(
    () => tracks.find((track) => track.id === leadInTrackId) ?? null,
    [leadInTrackId]
  );

  const activeTrack = useMemo(
    () => tracks.find((track) => track.id === activeTrackId) ?? null,
    [activeTrackId]
  );

  const beginPlayback = (trackId: string) => {
    markTrackStarted(trackId);
    setActiveTrackId(trackId);

    if (!loadedEmbedIds.includes(trackId)) {
      setLoadingEmbedIds((current) => uniquePush(current, trackId));
    }
  };

  const handleOpenTrack = (track: Track) => {
    if (shouldTriggerLeadIn(track.id)) {
      setLeadInTrackId(track.id);
      return;
    }

    beginPlayback(track.id);
  };

  const handleLeadInComplete = (trackId: string) => {
    markGuidedLeadInComplete(trackId);
    setLeadInTrackId(null);
    beginPlayback(trackId);
  };

  const handleTrackCompleted = (track: Track) => {
    markTrackCompleted(track.id, state.mode);

    if (state.mode === 'guided') {
      const currentIndex = tracks.findIndex((item) => item.id === track.id);
      const upcoming = tracks[currentIndex + 1];
      if (upcoming) {
        setInterstitialOpen(true);
      }
    }
  };

  if (!isHydrated) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="animate-pulse space-y-3 rounded-[12px] border border-border bg-[#0d0d0f] p-4 sm:p-5">
          <div className="h-6 w-64 rounded bg-zinc-900" />
          <div className="h-24 rounded-md bg-zinc-900" />
          <div className="h-24 rounded-md bg-zinc-900" />
          <div className="h-24 rounded-md bg-zinc-900" />
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-bg px-3 pb-14 pt-14 sm:px-5 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 6%, rgba(255,255,255,0.08), transparent 36%), radial-gradient(circle at 85% 84%, rgba(255,255,255,0.08), transparent 42%)'
          }}
        />

        {playerMinimized ? (
          <section className="relative mx-auto flex min-h-[calc(100svh-130px)] max-w-6xl items-end justify-center">
            <button
              type="button"
              onClick={() => setPlayerMinimized(false)}
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-[#0d0d0f] px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Reopen Chamber Music Player
            </button>
          </section>
        ) : (
          <section
            className={cn(
              'relative mx-auto overflow-hidden rounded-[12px] border border-border bg-[#0d0d0f] animate-window-pop transition-[width,height] duration-ui ease-calm',
              playerExpanded ? 'h-[calc(100svh-88px)] max-w-none' : 'h-[calc(100svh-128px)] max-w-[1260px]'
            )}
          >
            <header className="border-b border-border bg-zinc-900/55 px-3 py-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <WindowControls
                    onClose={() => router.push('/')}
                    onMinimize={() => setPlayerMinimized(true)}
                    onToggleExpand={() => setPlayerExpanded((current) => !current)}
                    expanded={playerExpanded}
                  />

                  <div>
                    <p className="text-sm font-medium text-text">Chamber Music Player</p>
                    <p className="text-[11px] text-muted">chamber://second-life/player</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ModeToggle mode={state.mode} onModeChange={setMode} />
                </div>
              </div>
            </header>

            <div className="grid h-[calc(100%-76px)] gap-0 lg:grid-cols-[240px_1fr]">
              <aside className="border-b border-border bg-[#0b0b0d]/95 p-4 lg:border-b-0 lg:border-r">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">{project.title}</p>
                  <h1 className="text-xl font-medium text-text">Media files</h1>
                  <p className="text-sm text-muted">
                    {progress.completed} of {progress.total} completed
                  </p>
                  <p className="text-sm text-muted">
                    Mode: <span className="capitalize text-text">{state.mode}</span>
                  </p>
                  {!storageEnabled ? (
                    <p className="text-xs text-muted">Progress is temporary in this session.</p>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Shortcuts</p>
                  <div className="space-y-1">
                    <button type="button" onClick={() => setInfoOpen(true)} className={SHORTCUT_CLASS}>
                      <span>Help</span>
                      <span aria-hidden="true" className="text-xs text-muted">
                        open
                      </span>
                    </button>

                    <button type="button" onClick={() => setAccessOpen(true)} className={SHORTCUT_CLASS}>
                      <span>Buy</span>
                      <span aria-hidden="true" className="text-xs text-muted">
                        open
                      </span>
                    </button>

                    <button type="button" onClick={() => setStealOpen(true)} className={SHORTCUT_CLASS}>
                      <span>Steal</span>
                      <span aria-hidden="true" className="text-xs text-muted">
                        open
                      </span>
                    </button>

                    <Link href="/download" className={SHORTCUT_CLASS}>
                      <span>Download</span>
                      <span aria-hidden="true" className="text-xs text-muted">
                        open
                      </span>
                    </Link>

                    <Link href="/appendix" className={SHORTCUT_CLASS}>
                      <span>Appendix {state.appendixUnlocked ? 'unlocked' : 'locked'}</span>
                      <span aria-hidden="true" className="text-xs text-muted">
                        open
                      </span>
                    </Link>
                  </div>
                </div>
              </aside>

              <section className="h-full overflow-y-auto p-4 sm:p-5" aria-label="Track files">
                <header className="mb-4 border-b border-border pb-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Library</p>
                  <h2 className="mt-1 text-lg font-medium text-text">Second Life / Audio</h2>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {tracks.map((track) => {
                    const isCompleted = hasCompletedTrack(track.id);
                    const isSealed = state.mode === 'guided' && !hasOpenedGuidedTrack(track.id);
                    const fileState: TrackState =
                      activeTrackId === track.id
                        ? 'playing'
                        : isCompleted
                          ? 'completed'
                          : isSealed
                            ? 'sealed'
                            : 'ready';

                    return (
                      <TrackFileButton
                        key={track.id}
                        track={track}
                        mode={state.mode}
                        state={fileState}
                        onOpen={handleOpenTrack}
                      />
                    );
                  })}
                </div>

                <section className="mt-5 rounded-[10px] border border-border bg-black/30 p-3 sm:p-4" aria-label="Player dock">
                  <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted">Player dock</p>
                      <h3 className="text-sm font-medium text-text">Now playing</h3>
                    </div>
                    {activeTrack ? (
                      <button
                        type="button"
                        onClick={() => setActiveTrackId(null)}
                        className="inline-flex min-h-11 items-center rounded-md px-2 text-xs text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        close file
                      </button>
                    ) : null}
                  </header>

                  {activeTrack ? (
                    <>
                      <p className="text-sm font-medium text-text">{activeTrack.title}</p>
                      <p className="mt-1 text-xs text-muted">{toTrackFilename(activeTrack)}</p>

                      <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-black/40 p-1 sm:p-2">
                        {!loadedEmbedIds.includes(activeTrack.id) || loadingEmbedIds.includes(activeTrack.id) ? (
                          <div className="absolute inset-0 animate-pulse bg-zinc-950" aria-hidden="true" />
                        ) : null}

                        <iframe
                          key={activeTrack.id}
                          src={withAutoplay(activeTrack.embedUrl)}
                          title={`${activeTrack.title} player`}
                          className={cn(
                            'absolute inset-0 h-full w-full border-0 transition-opacity duration-ui ease-calm',
                            loadedEmbedIds.includes(activeTrack.id) && !loadingEmbedIds.includes(activeTrack.id)
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                          loading="lazy"
                          allow="autoplay; encrypted-media"
                          onLoad={() => {
                            setLoadedEmbedIds((current) => uniquePush(current, activeTrack.id));
                            setLoadingEmbedIds((current) => current.filter((item) => item !== activeTrack.id));
                          }}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={() => handleTrackCompleted(activeTrack)}>
                          Completed
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => handleOpenTrack(activeTrack)}>
                          Play again
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted">Open a track file to start playback.</p>
                  )}
                </section>
              </section>
            </div>
          </section>
        )}
      </main>

      {booting ? (
        <ChamberBootOverlay
          label="Launching"
          title="Chamber Music Player"
          subtitle={`Loading ${bootMode} session`}
          progress={bootProgress}
        />
      ) : null}

      <GuidedLeadIn track={leadInTrack} onComplete={handleLeadInComplete} onSkip={handleLeadInComplete} />

      <InterstitialOverlay
        open={interstitialOpen}
        lines={interstitialLines}
        onDone={() => setInterstitialOpen(false)}
        onSkip={() => setInterstitialOpen(false)}
      />

      <AccessModal open={accessOpen} onClose={() => setAccessOpen(false)} />
      <StealModal open={stealOpen} onClose={() => setStealOpen(false)} />
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} onResetProgress={resetProgress} />
    </>
  );
}
