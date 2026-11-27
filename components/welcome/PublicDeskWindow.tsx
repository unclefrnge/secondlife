'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { TILL_SLIP, tillSlip } from '@/lib/grocer-quest';
import type { MenuWindow } from './WelcomeBar';
import { SystemSettings } from '@/components/welcome/SystemSettings';
import { useWindowDrag } from '@/lib/hooks/use-window-drag';
import { deskAppTitle, type DeskApp } from '@/lib/desk-apps';
import { AboutChamberOS } from '../windows/apps/AboutChamberOS';
import { Firefly } from '../games/Firefly';
import { Till, type TillProgress } from '../games/Till';
import { ReceiptPaper } from '../games/ReceiptPaper';
import styles from '../games/games.module.css';

type Props = {
  app: DeskApp;
  till: TillProgress;
  state: MenuWindow['state'];
  refNode: RefObject<HTMLDialogElement>;
  onSelect: () => void;
  onClose: () => void;
};

export function PublicDeskWindow({ app, till, state, refNode, onSelect, onClose }: Props) {
  const drag = useWindowDrag(refNode, false, 44, state === 'minimised');
  const isSlip = app === TILL_SLIP;
  const title = deskAppTitle(app);
  useLayoutEffect(() => {
    refNode.current?.focus({ preventScroll: true });
  }, [app, refNode]);
  return <dialog ref={refNode} open={state !== 'minimised'} tabIndex={-1} data-public-utility="" data-active={state === 'active'}
    data-print-slip={isSlip || undefined} className={styles.gameWindow} aria-labelledby="utility-title"
    onFocusCapture={onSelect} onPointerDownCapture={onSelect}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
    <header className={styles.gameBar} {...drag.handle} aria-label={`Move ${title}`}>
      <button type="button" aria-label={`Close ${title}`} title="Close window" onClick={onClose}><i aria-hidden="true">×</i></button>
      <span id="utility-title">{title}</span>
    </header>
    {app === 'about' && <AboutChamberOS />}
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
