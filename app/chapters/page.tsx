'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { WindowControls } from '@/components/ui/window-controls';
import type { ListeningMode } from '@/lib/types';
import { cn, uniquePush } from '@/lib/utils';

type RitualAnimation = 'beatDots' | 'scanline' | 'dotfield' | 'signalBars' | 'breathingRing' | 'progressPulse';
type TrackStatus = 'locked' | 'ready' | 'playing' | 'complete';

interface GuidedTrack {
  id: string;
  order: number;
  title: string;
  audioUrl: string;
  durationSec: number;
  instruction: string;
  animation: RitualAnimation;
}

interface RitualVisualProps {
  active: boolean;
  progress: number;
}

const STORAGE_KEYS = {
  unlockedIndex: 'secondLife_unlockedIndex',
  completedTracks: 'secondLife_completedTracks',
  lastTrackId: 'secondLife_lastTrackId'
} as const;

const IDLE_STATUS = 'ready when you are';
const COMPLETION_TOAST = 'Unlocked.';

const TRACKS: GuidedTrack[] = [
  {
    id: 'owe-me-nothing',
    order: 1,
    title: 'Owe Me Nothing',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationSec: 8,
    instruction: 'Breathe in. Hold. Breathe out. Rest.',
    animation: 'beatDots'
  },
  {
    id: 'let-there-be-ghosts',
    order: 2,
    title: 'Let There Be Ghosts (feat. Killian Black)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    durationSec: 7,
    instruction: 'Soften your eyes.',
    animation: 'scanline'
  },
  {
    id: 'forest-lullaby',
    order: 3,
    title: 'Forest Lullaby',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    durationSec: 9,
    instruction: 'Find one point. Stay there.',
    animation: 'dotfield'
  },
  {
    id: 'same-body-different-spirit',
    order: 4,
    title: 'Same Body, Different Spirit',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    durationSec: 9,
    instruction: 'Stay with this moment.',
    animation: 'signalBars'
  },
  {
    id: 'healing',
    order: 5,
    title: 'Healing',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    durationSec: 10,
    instruction: 'Let your shoulders drop.',
    animation: 'breathingRing'
  },
  {
    id: 'ethics-of-sampling',
    order: 6,
    title: 'Ethics of Sampling',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    durationSec: 9,
    instruction: 'Let the track carry you.',
    animation: 'progressPulse'
  }
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const full = Math.floor(seconds);
  const mins = Math.floor(full / 60);
  const secs = full % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function parseCompletedTracks(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const valid = new Set(TRACKS.map((track) => track.id));
    return parsed.filter((entry): entry is string => typeof entry === 'string' && valid.has(entry));
  } catch {
    return [];
  }
}

function BeatDots({ active, progress }: RitualVisualProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3" aria-hidden="true">
      {[0, 1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={cn(
            'h-2.5 w-2.5 rounded-full border border-border bg-transparent',
            active ? 'second-life-beat-dot' : 'opacity-45'
          )}
          style={{
            animationDelay: `${dot * 220}ms`,
            opacity: !active && progress >= 1 ? 0.85 : undefined,
            backgroundColor: !active && progress >= 1 ? 'rgba(243,241,234,0.75)' : undefined
          }}
        />
      ))}
    </div>
  );
}

function Scanline({ active, progress }: RitualVisualProps) {
  const top = `${8 + clamp(progress, 0, 1) * 56}px`;

  return (
    <div className="relative h-20 overflow-hidden rounded-md border border-border bg-black/20" aria-hidden="true">
      <div
        className={cn(
          'absolute left-3 right-3 h-px bg-text/70',
          active ? 'second-life-scanline' : 'transition-opacity duration-300',
          !active && progress >= 1 ? 'opacity-0' : 'opacity-55'
        )}
        style={{ top: active ? undefined : top }}
      />
    </div>
  );
}

function DotfieldDrift({ active }: RitualVisualProps) {
  return (
    <div className="grid grid-cols-6 gap-x-4 gap-y-3 py-2" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, index) => (
        <span
          key={index}
          className={cn('h-[3px] w-[3px] rounded-full bg-text/50', active ? 'second-life-dotfield' : 'opacity-35')}
          style={{ animationDelay: `${(index % 6) * 160}ms` }}
        />
      ))}
    </div>
  );
}

function SignalBars({ active, progress }: RitualVisualProps) {
  return (
    <div className="flex h-14 items-end justify-center gap-1.5 py-2" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn(
            'h-9 w-2 origin-bottom rounded-sm border border-border bg-text/50',
            active ? 'second-life-signal-bar' : ''
          )}
          style={{
            animationDelay: `${bar * 140}ms`,
            transform: active ? undefined : progress >= 1 ? 'scaleY(0.24)' : 'scaleY(0.3)'
          }}
        />
      ))}
    </div>
  );
}

function BreathingRing({ active, progress }: RitualVisualProps) {
  const normalizedProgress = clamp(progress, 0, 1);
  const circumference = 2 * Math.PI * 38;
  const offset = circumference * (1 - normalizedProgress);

  return (
    <div className="relative mx-auto h-24 w-24" aria-hidden="true">
      <div className="absolute inset-2 rounded-full border border-text/65" />
      <div className={cn('absolute inset-0 rounded-full border border-text/35', active ? 'second-life-breathing-ring' : '')} />
      <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
        <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(243,241,234,0.2)" strokeWidth="2" />
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke="rgba(243,241,234,0.66)"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function ProgressBarPulse({ active, progress }: RitualVisualProps) {
  const normalizedProgress = clamp(progress, 0, 1);
  const width = `${Math.round(normalizedProgress * 100)}%`;

  return (
    <div className="relative py-4" aria-hidden="true">
      <div className="h-[4px] overflow-hidden rounded bg-border">
        <div className="h-full bg-text/75 transition-[width] duration-100" style={{ width }} />
      </div>
      <span
        className={cn(
          'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-text/80',
          active ? 'second-life-progress-dot' : ''
        )}
        style={{ left: width }}
      />
    </div>
  );
}

function RitualVisual({ animation, active, progress }: { animation: RitualAnimation; active: boolean; progress: number }) {
  if (animation === 'beatDots') {
    return <BeatDots active={active} progress={progress} />;
  }
  if (animation === 'scanline') {
    return <Scanline active={active} progress={progress} />;
  }
  if (animation === 'dotfield') {
    return <DotfieldDrift active={active} progress={progress} />;
  }
  if (animation === 'signalBars') {
    return <SignalBars active={active} progress={progress} />;
  }
  if (animation === 'breathingRing') {
    return <BreathingRing active={active} progress={progress} />;
  }
  return <ProgressBarPulse active={active} progress={progress} />;
}

export default function ChaptersPage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<ListeningMode>('guided');

  const [unlockedIndex, setUnlockedIndex] = useState(0);
  const [completedTracks, setCompletedTracks] = useState<string[]>([]);
  const [lastTrackId, setLastTrackId] = useState<string | null>(null);

  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [autoplayRequested, setAutoplayRequested] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [ritualTrackIndex, setRitualTrackIndex] = useState<number | null>(null);
  const [ritualRunning, setRitualRunning] = useState(false);
  const [ritualStartedAt, setRitualStartedAt] = useState<number | null>(null);
  const [ritualDurationMs, setRitualDurationMs] = useState(0);
  const [ritualRemainingMs, setRitualRemainingMs] = useState(0);

  const [nextRitualPrompt, setNextRitualPrompt] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const activeTrack = useMemo(() => TRACKS.find((track) => track.id === activeTrackId) ?? null, [activeTrackId]);
  const activeTrackIndex = useMemo(() => TRACKS.findIndex((track) => track.id === activeTrackId), [activeTrackId]);
  const ritualTrack = useMemo(() => {
    if (ritualTrackIndex === null) {
      return null;
    }
    return TRACKS[ritualTrackIndex] ?? null;
  }, [ritualTrackIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const queryMode = params.get('mode');
    if (queryMode === 'guided' || queryMode === 'direct') {
      setMode(queryMode);
    }

    const savedUnlockedIndex = Number(window.localStorage.getItem(STORAGE_KEYS.unlockedIndex));
    const safeUnlocked = Number.isFinite(savedUnlockedIndex) ? clamp(Math.floor(savedUnlockedIndex), 0, TRACKS.length) : 0;

    const rawCompleted =
      window.localStorage.getItem(STORAGE_KEYS.completedTracks) ?? window.localStorage.getItem('secondLife_completed');

    const savedCompletedTracks = parseCompletedTracks(rawCompleted);
    const savedLastTrackId = window.localStorage.getItem(STORAGE_KEYS.lastTrackId);

    setUnlockedIndex(safeUnlocked);
    setCompletedTracks(savedCompletedTracks);

    if (savedLastTrackId && TRACKS.some((track) => track.id === savedLastTrackId)) {
      setLastTrackId(savedLastTrackId);
      setActiveTrackId(savedLastTrackId);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.unlockedIndex, String(unlockedIndex));
      window.localStorage.setItem(STORAGE_KEYS.completedTracks, JSON.stringify(completedTracks));

      if (lastTrackId) {
        window.localStorage.setItem(STORAGE_KEYS.lastTrackId, lastTrackId);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.lastTrackId);
      }
    } catch {
      // do nothing if storage is blocked
    }
  }, [completedTracks, hydrated, lastTrackId, unlockedIndex]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 1000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const completeRitual = useCallback(() => {
    if (ritualTrackIndex === null) {
      return;
    }

    setUnlockedIndex((current) => Math.max(current, ritualTrackIndex + 1));
    setRitualRunning(false);
    setRitualStartedAt(null);
    setRitualTrackIndex(null);
    setRitualDurationMs(0);
    setRitualRemainingMs(0);
    setToast(COMPLETION_TOAST);
    setNextRitualPrompt(null);
  }, [ritualTrackIndex]);

  useEffect(() => {
    if (!ritualRunning || ritualStartedAt === null) {
      return;
    }

    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - ritualStartedAt;
      const remaining = Math.max(ritualDurationMs - elapsed, 0);
      setRitualRemainingMs(remaining);

      if (remaining <= 0) {
        completeRitual();
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [completeRitual, ritualDurationMs, ritualRunning, ritualStartedAt]);

  useEffect(() => {
    if (!activeTrack || !autoplayRequested) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    let cancelled = false;

    const play = async () => {
      try {
        await audio.play();
        if (!cancelled) {
          setIsPlaying(true);
          setAudioError(null);
        }
      } catch {
        if (!cancelled) {
          setIsPlaying(false);
          setAudioError('Playback unavailable. Replace placeholder URLs when ready.');
        }
      } finally {
        if (!cancelled) {
          setAutoplayRequested(false);
        }
      }
    };

    play();

    return () => {
      cancelled = true;
    };
  }, [activeTrack, autoplayRequested]);

  const ritualProgress = ritualDurationMs > 0 ? clamp(1 - ritualRemainingMs / ritualDurationMs, 0, 1) : 0;
  const ritualCountdown = Math.max(0, Math.ceil(ritualRemainingMs / 1000));

  const statusForTrack = (index: number): TrackStatus => {
    const track = TRACKS[index];
    if (activeTrackId === track.id && isPlaying) {
      return 'playing';
    }
    if (completedTracks.includes(track.id)) {
      return 'complete';
    }
    if (index > unlockedIndex) {
      return 'locked';
    }
    return 'ready';
  };

  const openRitual = (index: number) => {
    if (mode !== 'guided' || index !== unlockedIndex) {
      return;
    }

    const track = TRACKS[index];
    setRitualTrackIndex(index);
    setRitualDurationMs(track.durationSec * 1000);
    setRitualRemainingMs(track.durationSec * 1000);
    setRitualStartedAt(null);
    setRitualRunning(false);
  };

  const beginRitual = () => {
    if (!ritualTrack || ritualRunning) {
      return;
    }

    const durationMs = ritualTrack.durationSec * 1000;
    setRitualDurationMs(durationMs);
    setRitualRemainingMs(durationMs);
    setRitualStartedAt(performance.now());
    setRitualRunning(true);
  };

  const closeRitual = () => {
    setRitualTrackIndex(null);
    setRitualRunning(false);
    setRitualStartedAt(null);
    setRitualDurationMs(0);
    setRitualRemainingMs(0);
  };

  const playTrack = (index: number) => {
    if (index >= unlockedIndex) {
      return;
    }

    const track = TRACKS[index];
    setActiveTrackId(track.id);
    setLastTrackId(track.id);
    setAutoplayRequested(true);
    setAudioError(null);
    setNextRitualPrompt(null);
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
        setAudioError(null);
      } catch {
        setAudioError('Playback unavailable. Replace placeholder URLs when ready.');
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const moveTrack = (direction: -1 | 1) => {
    if (activeTrackIndex < 0 || unlockedIndex === 0) {
      return;
    }

    const nextIndex = activeTrackIndex + direction;
    if (nextIndex < 0 || nextIndex >= unlockedIndex) {
      return;
    }

    playTrack(nextIndex);
  };

  const resetProgress = () => {
    setUnlockedIndex(0);
    setCompletedTracks([]);
    setLastTrackId(null);
    setActiveTrackId(null);
    setAutoplayRequested(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
    setRitualTrackIndex(null);
    setRitualRunning(false);
    setRitualStartedAt(null);
    setRitualDurationMs(0);
    setRitualRemainingMs(0);
    setNextRitualPrompt(null);
  };

  if (!hydrated) {
    return (
      <main className="min-h-dvh bg-bg px-4 py-14">
        <section className="mx-auto max-w-5xl animate-pulse space-y-3 rounded-[12px] border border-border bg-[#0d0d0f] p-5">
          <div className="h-6 w-44 rounded bg-zinc-900" />
          <div className="h-24 rounded bg-zinc-900" />
          <div className="h-24 rounded bg-zinc-900" />
          <div className="h-24 rounded bg-zinc-900" />
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-dvh bg-bg px-3 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:px-5 sm:pt-[calc(4rem+env(safe-area-inset-top))]">
        <section className="relative mx-auto max-w-6xl overflow-hidden rounded-[12px] border border-border bg-[#0d0d0f] animate-window-pop">
          <header className="border-b border-border bg-zinc-900/50 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <WindowControls onClose={() => window.history.back()} onMinimize={() => {}} onToggleExpand={() => {}} expanded={false} />
                <div>
                  <p className="text-sm font-medium text-text">Second Life / Guided Listening</p>
                  <p className="text-[11px] text-muted">quiet gates, six tracks</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'guided' ? 'primary' : 'secondary'}
                  onClick={() => setMode('guided')}
                  className="font-mono text-xs"
                >
                  Guided
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'direct' ? 'primary' : 'secondary'}
                  onClick={() => setMode('direct')}
                  className="font-mono text-xs"
                >
                  Direct
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={resetProgress} className="font-mono text-xs">
                  Reset
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="border-b border-border p-4 lg:border-b-0 lg:border-r lg:p-5" aria-label="Guided track spine">
              <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Guided journey</p>
                  <h1 className="mt-1 text-xl font-medium text-text">Second Life</h1>
                </div>
                <p className="text-sm text-muted">
                  unlocked {unlockedIndex}/{TRACKS.length}
                </p>
              </header>

              <div className="relative space-y-3 pl-7">
                <div aria-hidden="true" className="absolute left-3 top-2 h-[calc(100%-10px)] w-px bg-border" />

                {TRACKS.map((track, index) => {
                  const status = statusForTrack(index);
                  const isUnlocked = index < unlockedIndex;
                  const canRunRitual = mode === 'guided' && index === unlockedIndex;

                  return (
                    <article key={track.id} className="relative rounded-[10px] border border-border bg-black/25 p-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute -left-[27px] top-4 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-medium',
                          isUnlocked ? 'border-accent text-text' : 'border-border text-muted'
                        )}
                      >
                        {track.order}
                      </span>

                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-sm font-medium text-text">{track.title}</h2>
                          <span
                            className={cn(
                              'mt-1 inline-flex rounded-full border px-2 py-[2px] text-[10px] uppercase tracking-[0.1em]',
                              status === 'playing'
                                ? 'border-accent text-text'
                                : status === 'complete'
                                  ? 'border-border text-text'
                                  : status === 'ready'
                                    ? 'border-border text-muted'
                                    : 'border-border text-muted/80'
                            )}
                          >
                            {status}
                          </span>
                        </div>

                        {isUnlocked ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => playTrack(index)}
                            className="font-mono text-xs"
                          >
                            Listen
                          </Button>
                        ) : canRunRitual ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openRitual(index)}
                            className="font-mono text-xs"
                          >
                            Begin Ritual
                          </Button>
                        ) : (
                          <Button type="button" size="sm" variant="ghost" disabled className="font-mono text-xs">
                            Locked
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="p-4 lg:p-5" aria-label="Player">
              <header className="mb-3 border-b border-border pb-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Player</p>
                <h2 className="mt-1 text-base font-medium text-text">Simple Deck</h2>
                <p className="mt-1 text-xs text-muted">
                  {mode === 'guided'
                    ? 'Guided unlock is sequential.'
                    : 'Direct shows all tracks. Locked tracks stay unavailable.'}
                </p>
              </header>

              {activeTrack ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-text">{activeTrack.title}</p>
                    <p className="text-xs text-muted">Track {TRACKS.findIndex((item) => item.id === activeTrack.id) + 1}</p>
                  </div>

                  <audio
                    ref={audioRef}
                    src={activeTrack.audioUrl}
                    preload="metadata"
                    onLoadedMetadata={(event) => {
                      setDuration(event.currentTarget.duration || 0);
                    }}
                    onTimeUpdate={(event) => {
                      setCurrentTime(event.currentTarget.currentTime);
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      setCompletedTracks((current) => uniquePush(current, activeTrack.id));

                      const currentIndex = TRACKS.findIndex((item) => item.id === activeTrack.id);
                      const nextIndex = currentIndex + 1;

                      if (mode === 'guided' && nextIndex < TRACKS.length && nextIndex === unlockedIndex) {
                        setNextRitualPrompt(nextIndex);
                      }
                    }}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={togglePlayback} className="font-mono text-xs">
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => moveTrack(-1)}
                      disabled={activeTrackIndex <= 0}
                      className="font-mono text-xs"
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => moveTrack(1)}
                      disabled={activeTrackIndex < 0 || activeTrackIndex + 1 >= unlockedIndex}
                      className="font-mono text-xs"
                    >
                      Next
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(duration, 1)}
                      step={0.1}
                      value={currentTime}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (!audioRef.current) {
                          return;
                        }
                        audioRef.current.currentTime = value;
                        setCurrentTime(value);
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded bg-border"
                      aria-label="Seek"
                    />
                    <p className="font-mono text-xs text-muted">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>

                  {audioError ? <p className="text-xs text-muted">{audioError}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-muted">Choose an unlocked track to listen.</p>
              )}

              {nextRitualPrompt !== null && nextRitualPrompt < TRACKS.length ? (
                <div className="mt-4 rounded-[10px] border border-border bg-black/20 p-3">
                  <p className="text-sm text-text">Next ritual available.</p>
                  <p className="mt-1 text-xs text-muted">{TRACKS[nextRitualPrompt].title}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => openRitual(nextRitualPrompt)}
                    className="mt-3 font-mono text-xs"
                  >
                    Begin Ritual
                  </Button>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                <Link href="/" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 hover:text-text">
                  Back to desktop
                </Link>
                <Link href="/download" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 hover:text-text">
                  Download
                </Link>
              </div>
            </section>
          </div>
        </section>
      </main>

      {ritualTrack ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)]"
          role="dialog"
          aria-modal="true"
        >
          <section className="max-h-full w-full max-w-md overflow-y-auto rounded-[12px] border border-border bg-[#0d0d0f] p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Ritual gate</p>
            <h3 className="mt-1 text-lg font-medium text-text">{ritualTrack.title}</h3>

            <div className="mt-4 rounded-[10px] border border-border bg-black/25 p-3">
              <RitualVisual animation={ritualTrack.animation} active={ritualRunning} progress={ritualProgress} />
            </div>

            <p className="mt-3 text-sm text-text">{ritualTrack.instruction}</p>

            <div className="mt-4 h-[3px] overflow-hidden rounded bg-border">
              <div className="h-full bg-text/80 transition-[width] duration-100" style={{ width: `${Math.round(ritualProgress * 100)}%` }} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={beginRitual}
                disabled={ritualRunning}
                className="font-mono text-xs"
              >
                {ritualRunning ? `${ritualCountdown}s` : 'Begin'}
              </Button>

              <Button type="button" variant="ghost" onClick={closeRitual} className="font-mono text-xs">
                Close
              </Button>
            </div>

            <p className="mt-2 text-xs text-muted">{IDLE_STATUS}</p>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-[60] -translate-x-1/2 rounded-md border border-border bg-[#111214] px-3 py-2 text-sm text-text sm:left-auto sm:right-4 sm:translate-x-0">
          {toast}
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes second-life-beat-dot {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
            background: transparent;
          }
          25% {
            opacity: 1;
            transform: scale(1.08);
            background: rgba(243, 241, 234, 0.78);
          }
        }

        @keyframes second-life-scanline {
          0% {
            top: 8px;
            opacity: 0.45;
          }
          50% {
            opacity: 0.85;
          }
          100% {
            top: 64px;
            opacity: 0.32;
          }
        }

        @keyframes second-life-dotfield {
          0%,
          100% {
            opacity: 0.22;
          }
          50% {
            opacity: 0.65;
          }
        }

        @keyframes second-life-signal-bar {
          0%,
          100% {
            transform: scaleY(0.28);
          }
          50% {
            transform: scaleY(1);
          }
        }

        @keyframes second-life-breathing-ring {
          0%,
          100% {
            transform: scale(0.94);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.82;
          }
        }

        @keyframes second-life-progress-dot {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.75;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.12);
            opacity: 1;
          }
        }

        .second-life-beat-dot {
          animation: second-life-beat-dot 880ms linear infinite;
        }

        .second-life-scanline {
          animation: second-life-scanline 2200ms linear infinite;
        }

        .second-life-dotfield {
          animation: second-life-dotfield 2800ms linear infinite;
        }

        .second-life-signal-bar {
          animation: second-life-signal-bar 1400ms linear infinite;
        }

        .second-life-breathing-ring {
          animation: second-life-breathing-ring 2600ms ease-in-out infinite;
        }

        .second-life-progress-dot {
          animation: second-life-progress-dot 1200ms ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
