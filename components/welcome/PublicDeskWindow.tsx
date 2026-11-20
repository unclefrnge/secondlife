'use client';

import { useLayoutEffect, useRef } from 'react';
import { useChamberWorld } from '@/lib/hooks/use-chamber-world';
import { SystemSettings } from '@/components/welcome/SystemSettings';
import { useWindowDrag } from '@/lib/hooks/use-window-drag';
import type { DesktopGame } from '@/lib/desktop-games';
import { Firefly } from '../games/Firefly';
import { Till } from '../games/Till';
import styles from '../games/games.module.css';

function PublicTill() {
  const world = useChamberWorld();
  return <Till {...world} />;
}
export function PublicDeskWindow({ app, onClose }: { app: DesktopGame | 'settings'; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useWindowDrag(dialog, false, 0);
  const title = app === 'settings' ? 'system settings' : `${app}.exe`;
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className={styles.gameWindow} aria-labelledby="utility-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className={styles.gameBar} {...drag.handle} aria-label={`Move ${title}`}>
      <button type="button" aria-label={`Close ${title}`} title="Close window" onClick={onClose}><i aria-hidden="true">×</i></button>
      <span id="utility-title">{title}</span>
    </header>
    {app === 'settings' ? <SystemSettings /> : app === 'till' ? <PublicTill /> : <Firefly />}
  </dialog>;
}
