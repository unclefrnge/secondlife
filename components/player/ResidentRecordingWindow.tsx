'use client';

import { useRef } from 'react';
import { PortfolioFrame } from '@/app/work/PortfolioFrame';
import { RecordingDeck, type Recording } from '@/app/work/Recordings';
import styles from '@/app/work/work.module.css';
import { useWindowSize } from '@/lib/hooks/use-window-size';
import { playerName } from '@/lib/work-folders';
import { discIcon } from './ChamberDeck';

// Calendar recordings use the same hosted player and keep their iframe mounted in mini mode.
export function ResidentRecordingWindow({ recording, id, focused, mini, layer, onFocus, onClose, onMinimise, onRestore }: {
  recording: Recording; id: string; focused: boolean; mini: boolean; layer: number;
  onFocus: () => void; onClose: () => void; onMinimise: () => void; onRestore: () => void;
}) {
  const area = useRef<HTMLDivElement>(null);
  const { expanded, toggleSize, restore } = useWindowSize(area, mini || !focused);
  return <div ref={area} className={styles.workspace} data-window-area="" style={{ inset: 0, zIndex: layer }}>
    <PortfolioFrame kind="player" id={id} layer={1} title={playerName} focused={focused} hidden={false}
      icon={<img src={discIcon} alt="" width="20" height="20" />} expanded={expanded}
      onSize={enlarge => enlarge ? toggleSize() : restore()} onFocus={onFocus} onClose={onClose} onMinimise={onMinimise}
      mini={mini ? { title: recording.media === 'YouTube' ? recording.name : playerName, restore: onRestore } : undefined}>
      <RecordingDeck file={recording} />
    </PortfolioFrame>
  </div>;
}
