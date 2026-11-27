'use client';

import { MediaController } from 'media-chrome/react';
import { useEffect, useRef, useState } from 'react';
import { ChamberDeck } from '@/components/player/ChamberDeck';
import { Transport } from '@/components/player/Transport';
import styles from '@/components/player/chamber-deck.module.css';
import { getTrackAudioUrl } from '@/lib/audio';
import { tracks } from '@/lib/config';
import type { Track } from '@/lib/types';

interface PlayerProps {
  track: Track | null;
  autoplayToken: number;
  onPlayTrack: (trackId: string) => void;
}

export function SecondLifeWinampPlayer({ track, autoplayToken, onPlayTrack }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const trackUrl = track ? getTrackAudioUrl(track) : null;
  const index = tracks.findIndex(item => item.id === track?.id);

  useEffect(() => {
    let current = true;
    setNotice('');
    setFailed(false);
    if (trackUrl) {
      void audioRef.current?.play().catch(error => {
        if (current && error.name === 'NotAllowedError') setNotice('Press Play to start.');
      });
    }
    return () => { current = false; };
  }, [trackUrl, autoplayToken]);

  return (
    <div className={styles.residentBody}>
      <ChamberDeck title={track?.title ?? 'Second Life'} credit={track ? 'FRNGE · Second Life' : 'FRNGE · Choose a track'}
        playlist={{ collection: "Second Life", selected: index, titles: tracks.map(item => item.title), onSelect: next => onPlayTrack(tracks[next].id) }} source={trackUrl ? <a href={trackUrl} target="_blank" rel="noreferrer">Open audio file</a> : `${tracks.length} tracks`}>
        {trackUrl && <>
          <MediaController id="second-life-media" audio>
            <audio key={trackUrl} slot="media" ref={audioRef} src={trackUrl} playsInline
              onPlaying={() => setNotice('')} onError={() => setFailed(true)} />
          </MediaController>
          <Transport controller="second-life-media" />
          {(failed || notice) && <p className={styles.notice} role="status">{failed ? 'Audio unavailable. Try the source file below.' : notice}</p>}
        </>}
      </ChamberDeck>
    </div>
  );
}
