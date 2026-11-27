'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWindowDrag } from '@/lib/hooks/use-window-drag';
import { playerName } from '@/lib/work-folders';
import { MiniPlayerBar } from './MiniPlayerBar';
import { Transport } from './Transport';
import styles from './mini-player.module.css';

export function ResidentMiniPlayer({ title, layer, onRestore, onClose }: {
  title: string; layer: number; onRestore: () => void; onClose: () => void;
}) {
  const frame = useRef<HTMLElement>(null);
  const drag = useWindowDrag(frame);
  const [fullscreen, setFullscreen] = useState<Element | null>(null);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement);
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const mini = <section ref={frame} data-mini-player="" aria-label={playerName + ' mini player'}
    className={styles.resident} style={{ zIndex: layer }}>
    <MiniPlayerBar title={title} credit="FRNGE · Second Life" handle={drag.handle} onRestore={onRestore} onClose={onClose} />
    <Transport controller="second-life-media" />
  </section>;
  return fullscreen ? createPortal(mini, fullscreen) : mini;
}
