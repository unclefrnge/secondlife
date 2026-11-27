'use client';

import dynamic from 'next/dynamic';
import { createContext, useContext, type ReactNode } from 'react';
import type { PlaybackSource, WorkFile } from './directory';
import { ChamberDeck } from '@/components/player/ChamberDeck';
import deck from '@/components/player/chamber-deck.module.css';

const YouTubePlayer = dynamic(() => import('./YouTubePlayer'), {
  ssr: false,
  loading: () => <div className={deck.pendingVideo} role="status">Loading video…</div>
});
export type Recording = WorkFile & { media: PlaybackSource };
type Playback = {
  href?: string;
  open: (file: Recording, trigger: HTMLAnchorElement) => void;
};
export const PlayerContext = createContext<Playback | null>(null);
function SourcePlayer({ file }: { file: Recording }) {
  const { media, href } = file;
  if (media === 'YouTube') return <YouTubePlayer href={href} />;

  let src: string;
  let height: number;
  if (media === 'Mixcloud') {
    src = 'https://player-widget.mixcloud.com/?hide_cover=1&feed=' + encodeURIComponent(href);
    height = 120;
  } else if (media === 'Apple Music') {
    const url = new URL(href);
    url.hostname = 'embed.music.apple.com';
    src = url.href;
    height = 175;
  } else {
    const album = media.bandcamp === 'album';
    const tracklist = album ? 'true' : 'false';
    src = `https://bandcamp.com/EmbeddedPlayer/${media.bandcamp}=${media.id}/size=large/bgcol=ffffff/linkcol=3c613c/tracklist=${tracklist}/artwork=none/transparent=true/`;
    height = album ? 240 : 120;
  }
  return <iframe className={deck.embed} data-provider={typeof media === 'string' ? media : 'Bandcamp'} src={src} height={height}
    title={(file.playerTitle ?? file.name) + ' on ' + (typeof media === 'string' ? media : 'Bandcamp')}
    allow="autoplay; encrypted-media; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />;
}

export function RecordingDeck({ file }: { file: Recording }) {
  return <ChamberDeck title={file.playerTitle ?? file.name} credit={file.detail} cover={file.cover}>
    <SourcePlayer key={file.href} file={file} />
  </ChamberDeck>;
}

export function RecordingLink({ file, media, children }: { file: WorkFile; media: PlaybackSource; children: ReactNode }) {
  const player = useContext(PlayerContext);
  return (
    <a href={file.href} aria-current={player?.href === file.href ? 'true' : undefined}
      title={'Open ' + (file.playerTitle ?? file.name) + ' in player'}
      onClick={event => {
        if (!player || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        player.open({ ...file, media }, event.currentTarget);
      }}>
      {children}
    </a>
  );
}
