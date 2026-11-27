'use client';

import { useState } from 'react';
import { MediaController } from 'media-chrome/react';
import { Transport } from '@/components/player/Transport';
import YouTubeVideo from 'youtube-video-element/react';
import styles from '@/components/player/chamber-deck.module.css';

export default function YouTubePlayer({ href }: { href: string }) {
  const [failed, setFailed] = useState(false);
  const videoId = new URL(href).searchParams.get('v');
  return (
    <>
      <MediaController id="work-video" gesturesDisabled className={styles.screen}>
        <YouTubeVideo slot="media" src={'https://www.youtube-nocookie.com/embed/' + videoId} playsInline
          onError={() => setFailed(true)} />
      </MediaController>
      {failed
        ? <p className={styles.notice} role="status">YouTube couldn’t play this video here. <a href={href}>Watch on YouTube</a></p>
        : <Transport controller="work-video" />}
    </>
  );
}
