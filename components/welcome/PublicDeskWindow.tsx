'use client';

import { useLayoutEffect, useRef } from 'react';
import { TILL_SLIP, tillSlip } from '@/lib/grocer-quest';
import { SystemSettings } from '@/components/welcome/SystemSettings';
import { useWindowDrag } from '@/lib/hooks/use-window-drag';
import type { DesktopGame } from '@/lib/desktop-games';
import { Firefly } from '../games/Firefly';
import { Till, type TillProgress } from '../games/Till';
import { ReceiptPaper } from '../games/ReceiptPaper';
import styles from '../games/games.module.css';

export type DeskApp = DesktopGame | 'settings' | typeof TILL_SLIP;

export function PublicDeskWindow({ app, till, onClose }: { app: DeskApp; till: TillProgress; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useWindowDrag(dialog, false, 0);
  const isSlip = app === TILL_SLIP;
  const title = isSlip ? tillSlip.name : app === 'settings' ? 'system settings' : `${app}.exe`;
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} data-print-slip={isSlip || undefined} className={styles.gameWindow} aria-labelledby="utility-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className={styles.gameBar} {...drag.handle} aria-label={`Move ${title}`}>
      <button type="button" aria-label={`Close ${title}`} title="Close window" onClick={onClose}><i aria-hidden="true">×</i></button>
      <span id="utility-title">{title}</span>
    </header>
    {app === 'settings' && <SystemSettings />}
    {app === 'firefly' && <Firefly />}
    {app === 'till' && <Till {...till}>
      <p className={styles.delivery}>{tillSlip.name} is on your desk.</p>
    </Till>}
    {isSlip && <section className={styles.till}>
      <ReceiptPaper>
        <p className={styles.lineItem}><span>{tillSlip.item}</span><span>{tillSlip.quantity}</span></p>
        <p>{tillSlip.note}</p>
        <p className={styles.closing}>{tillSlip.closing}</p>
      </ReceiptPaper>
      <div className={styles.choices}><button type="button" onClick={() => window.print()}>print slip</button></div>
    </section>}
  </dialog>;
}
