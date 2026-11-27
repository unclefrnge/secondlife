import { useState, type HTMLAttributes } from 'react';
import { discIcon } from './ChamberDeck';
import styles from './mini-player.module.css';

interface Props {
  title: string;
  credit?: string;
  artwork?: string;
  handle: HTMLAttributes<HTMLElement>;
  onRestore: () => void;
  onClose: () => void;
}

export function MiniPlayerBar({ title, credit, artwork, handle, onRestore, onClose }: Props) {
  const [failedArt, setFailedArt] = useState<string>();
  const cover = artwork && artwork !== failedArt ? artwork : discIcon;
  return <header className={styles.bar} {...handle} aria-label="Move mini player">
    <img className={styles.art} src={cover} alt="" width="34" height="34" onError={() => setFailedArt(artwork)} />
    <span className={styles.label} title={[title, credit].filter(Boolean).join(' · ')}>
      <strong>{title}</strong>{credit && <small>{credit}</small>}
    </span>
    <button type="button" aria-label="Enlarge player" title="Enlarge player" onClick={onRestore}>
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M11 3h6v6m0-6-7 7M7 5H3v12h12v-4" />
      </svg>
    </button>
    <button type="button" aria-label="Close player" title="Close player" onClick={onClose}>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="m5 5 10 10M15 5 5 15" />
      </svg>
    </button>
  </header>;
}
