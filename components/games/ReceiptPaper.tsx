'use client';

import type { ReactNode } from 'react';
import { useDeskPreferences } from '@/lib/hooks/use-desk-preferences';
import styles from './games.module.css';

export function ReceiptPaper({ children }: { children: ReactNode }) {
  const { paper, feed, stamp } = useDeskPreferences();
  return <div className={styles.slot}>
    <article className={styles.receipt} data-paper={paper} data-feed={feed}>
      <header>GOGO’S GROCER</header>
      {children}
      {stamp !== 'none' && <footer className={styles.stamp}>{stamp}</footer>}
    </article>
  </div>;
}
