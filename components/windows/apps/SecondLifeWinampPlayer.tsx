'use client';

import 'media-chrome/react';
import 'media-chrome/react/menu';
import { useEffect, useMemo, useRef, useState } from 'react';
import MediaThemeWinamp from '@player.style/winamp/react';

import { getTrackAudioUrl } from '@/lib/audio';
import type { Track } from '@/lib/types';

interface SecondLifeWinampPlayerProps {
  track: Track | null;
  autoplayToken: number;
}

export function SecondLifeWinampPlayer({ track, autoplayToken }: SecondLifeWinampPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoplayNotice, setAutoplayNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const trackUrl = useMemo(() => (track ? getTrackAudioUrl(track) : null), [track]);

  useEffect(() => {
    setAutoplayNotice(null);
    setLoadError(null);
  }, [trackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !trackUrl) {
      return;
    }

    void audio
      .play()
      .then(() => setAutoplayNotice(null))
      .catch(() => setAutoplayNotice('Press Play to start audio.'));
  }, [autoplayToken, trackUrl]);

  if (!track || !trackUrl) {
    return (
      <div className="h-full w-full p-3">
        <div className="flex h-full min-h-[240px] items-center justify-center rounded-md border border-border bg-black/25 px-4 text-center text-sm text-muted">
          Select a track in the Library to open playback.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto px-2 py-3">
      <div className="mx-auto w-[275px] min-w-[275px]">
        <MediaThemeWinamp
          style={{
            display: 'block',
            width: '275px',
            height: '260px'
          }}
        >
          <audio
            key={trackUrl}
            ref={audioRef}
            slot="media"
            src={trackUrl}
            playsInline
            crossOrigin="anonymous"
            onError={() => {
              setLoadError('Could not load track.');
              setAutoplayNotice(null);
            }}
          />
        </MediaThemeWinamp>
      </div>

      <div className="mx-auto mt-3 w-[275px] space-y-1 text-xs">
        <p className="truncate text-text">{track.title}</p>
        {autoplayNotice ? <p className="text-muted">{autoplayNotice}</p> : null}
        {loadError ? (
          <p className="text-danger">
            {loadError}{' '}
            <a href={trackUrl} target="_blank" rel="noreferrer" className="underline">
              Open source file
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
