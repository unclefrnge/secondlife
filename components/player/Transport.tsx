'use client';

import { MediaControlBar, MediaPlayButton, MediaSeekBackwardButton, MediaSeekForwardButton, MediaMuteButton, MediaTimeRange, MediaTimeDisplay, MediaDurationDisplay, MediaVolumeRange } from 'media-chrome/react';
import styles from './chamber-deck.module.css';

const skipSeconds = 30;

export function Transport({ controller }: { controller: string }) {
  return (
    <MediaControlBar ref={bar => bar?.setAttribute('mediacontroller', controller)} className={styles.transport}>
      <div className={styles.timeline}>
        <MediaTimeDisplay className={styles.elapsed} />
        <MediaTimeRange className={styles.seek} />
        <MediaDurationDisplay className={styles.duration} />
      </div>
      <div className={styles.controlsRow}>
        <div className={styles.playbackGroup} role="group" aria-label="Playback">
          <MediaSeekBackwardButton seekOffset={skipSeconds} className={styles.transportKey} />
          <MediaPlayButton className={styles.play} />
          <MediaTimeDisplay className={styles.miniTime} />
          <MediaSeekForwardButton seekOffset={skipSeconds} className={styles.transportKey} />
        </div>
        <div className={styles.volumeGroup} role="group" aria-label="Volume">
          <MediaMuteButton className={styles.transportKey} />
          <MediaVolumeRange className={styles.volume} />
        </div>
      </div>
    </MediaControlBar>
  );
}
