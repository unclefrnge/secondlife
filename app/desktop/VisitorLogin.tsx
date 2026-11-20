'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BootSequence } from '@/components/desktop/BootSequence';
import shell from '../home.module.css';
import styles from './visitor.module.css';

export default function VisitorLogin() {
  const [booting, setBooting] = useState(true);
  const title = useRef<HTMLHeadingElement>(null);
  const finishBoot = useCallback(() => setBooting(false), []);
  useEffect(() => {
    if (!booting) title.current?.focus({ preventScroll: true });
  }, [booting]);

  if (booting) return <BootSequence onComplete={finishBoot} />;
  return (
    <main className={shell.page}>
      <div className={`${shell.window} ${styles.window}`}>
        <header className={shell.bar}>
          <span><img src="/chamber-logo.svg" width="34" height="18" alt="" />resident login</span>
          <span>ChamberOS</span>
        </header>
        <section className={styles.body}>
          <div className={styles.account}>
            <img src="/icons/welcome-computer.png" width="48" height="48" alt="" />
            <div>
              <h1 tabIndex={-1} ref={title}>Knight</h1>
              <p>visitor login is closed</p>
            </div>
          </div>
        </section>
        <footer className={styles.footer}>
          <a href="/">← back to links</a>
          <button type="button" onClick={() => setBooting(true)}>restart</button>
        </footer>
      </div>
    </main>
  );
}
