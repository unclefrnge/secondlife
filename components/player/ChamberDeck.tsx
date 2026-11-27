'use client';

import { useState, type ReactNode } from 'react';
import styles from './chamber-deck.module.css';

export const discIcon = '/icons/oxygen/media-optical.png';

interface DeckProps {
  title: string;
  credit?: string;
  cover?: string;
  children?: ReactNode;
  playlist?: { collection: string; titles: string[]; selected: number; onSelect: (index: number) => void };
  source?: ReactNode;
}

export function ChamberDeck({ title, credit, cover, children, playlist, source }: DeckProps) {
  const [failedCover, setFailedCover] = useState<string>();
  const showCover = Boolean(cover && cover !== failedCover);
  return (
    <div className={styles.deck}>
      <section aria-label="Recording" className={styles.recording}>
        <div className={styles.metadata}>
          <div className={styles.sleeve} data-covered={showCover}>
            <img className={styles.disc} src={discIcon} alt="" width="48" height="48" />
            {showCover && <img className={styles.cover} src={cover} width="140" height="140" alt="" onError={() => setFailedCover(cover)} />}
          </div>
          <div className={styles.titles}>
            <h2>{title}</h2>
            {credit && <p>{credit}</p>}
          </div>
        </div>
        {children}
      </section>
      {playlist && playlist.titles.length > 1 && (
        <fieldset className={styles.playlist}>
          <legend>{playlist.collection}</legend>
          <ol aria-label={playlist.collection}>
            {playlist.titles.map((name, index) => (
              <li key={name}>
                <button type="button" aria-current={index === playlist.selected ? 'true' : undefined} onClick={() => playlist.onSelect(index)}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{name}
                </button>
              </li>
            ))}
          </ol>
        </fieldset>
      )}
      {source && <footer className={styles.status}>
        <span>{source}</span>
        {playlist && playlist.selected >= 0 && <span aria-label={`Recording ${playlist.selected + 1} of ${playlist.titles.length}`}>{playlist.selected + 1} / {playlist.titles.length}</span>}
      </footer>}
    </div>
  );
}
