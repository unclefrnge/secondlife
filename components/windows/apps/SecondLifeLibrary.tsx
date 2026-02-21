'use client';

import { useMemo } from 'react';

import { tracks } from '@/lib/config';
import { cn } from '@/lib/utils';

interface SecondLifeLibraryProps {
  activeTrackId: string | null;
  onPlayTrack: (trackId: string) => void;
}

function toFileLabel(order: number, title: string): string {
  return `${String(order).padStart(2, '0')} - ${title}.mp3`;
}

export function SecondLifeLibrary({ activeTrackId, onPlayTrack }: SecondLifeLibraryProps) {
  const orderedTracks = useMemo(() => [...tracks].sort((a, b) => a.order - b.order), []);

  return (
    <div className="space-y-4">
      <header className="rounded-md border border-border bg-black/25 px-3 py-2">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted">secondlife-media</p>
        <p className="text-sm text-text">{orderedTracks.length} items</p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {orderedTracks.map((track) => {
          const isActive = activeTrackId === track.id;
          const fileLabel = toFileLabel(track.order, track.title);

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onPlayTrack(track.id)}
              aria-label={`Play ${track.title}`}
              className={cn(
                'flex min-h-[92px] flex-col rounded-md border bg-black/20 px-3 py-2 text-left transition-colors duration-ui ease-calm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isActive ? 'border-accent bg-white/[0.06]' : 'border-border hover:border-accent'
              )}
            >
              <span aria-hidden="true" className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded bg-[#101318] text-base">
                ♪
              </span>
              <span className="text-xs leading-snug text-text">{fileLabel}</span>
              <span className="mt-1 text-[11px] text-muted">{isActive ? 'now selected' : 'audio file'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
