'use client';

import { Button } from '@/components/ui/button';
import { cn, withAutoplay } from '@/lib/utils';
import type { ListeningMode, Track } from '@/lib/types';

interface TrackCardProps {
  track: Track;
  mode: ListeningMode;
  isActive: boolean;
  isCompleted: boolean;
  isSealed: boolean;
  isLoaded: boolean;
  isLoadingEmbed: boolean;
  onOpen: (track: Track) => void;
  onMarkCompleted: (track: Track) => void;
  onCollapse: () => void;
  onEmbedLoaded: () => void;
}

function StatusDot({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted">
      <span
        aria-hidden="true"
        className={cn(
          'h-2 w-2 rounded-full border border-border',
          active ? 'bg-text' : 'bg-transparent'
        )}
      />
      {label}
    </span>
  );
}

export function TrackCard({
  track,
  mode,
  isActive,
  isCompleted,
  isSealed,
  isLoaded,
  isLoadingEmbed,
  onOpen,
  onMarkCompleted,
  onCollapse,
  onEmbedLoaded
}: TrackCardProps) {
  const statusLabel = isActive ? 'playing' : isCompleted ? 'completed' : 'sealed';
  const primaryLabel = isCompleted ? 'Play again' : 'Open';

  return (
    <article className="rounded-md border border-border bg-surface p-4 sm:p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted">
            {track.order.toString().padStart(2, '0')}
          </p>
          <h2 className="text-base font-medium leading-tight text-text sm:text-lg">{track.title}</h2>
        </div>
        <StatusDot label={statusLabel} active={isActive} />
      </header>

      <div className="space-y-4">
        {isActive ? (
          <div className="space-y-4">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-black/40 p-1 sm:p-2">
              {!isLoaded || isLoadingEmbed ? (
                <div className="absolute inset-0 animate-pulse bg-zinc-950" aria-hidden="true" />
              ) : null}

              <iframe
                src={withAutoplay(track.embedUrl)}
                title={`${track.title} player`}
                className={cn(
                  'absolute inset-0 h-full w-full border-0',
                  isLoaded && !isLoadingEmbed ? 'opacity-100' : 'opacity-0'
                )}
                loading="lazy"
                allow="autoplay; encrypted-media"
                onLoad={onEmbedLoaded}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => onMarkCompleted(track)}>
                Completed
              </Button>
              <Button type="button" variant="ghost" onClick={onCollapse}>
                Collapse
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpen(track)}>
              {primaryLabel}
            </Button>
            {mode === 'guided' && isSealed ? <p className="self-center text-xs text-muted">lead-in first</p> : null}
          </div>
        )}
      </div>
    </article>
  );
}
