'use client';

import type { ReactNode } from 'react';
import { useDeskPreferences } from '@/lib/hooks/use-desk-preferences';
import { tillSlip } from '@/lib/grocer-quest';
import styles from './games.module.css';

export function ReceiptPaper({ children }: { children: ReactNode }) {
  const { paper, feed, stamp } = useDeskPreferences();
  return <div className={styles.slot}>
    <article className={styles.receipt} data-paper={paper} data-feed={feed}>
      <header>{tillSlip.shop}</header>
      {children}
      {stamp !== 'none' && <footer className={styles.stamp}>{stamp}</footer>}
    </article>
  </div>;
}
