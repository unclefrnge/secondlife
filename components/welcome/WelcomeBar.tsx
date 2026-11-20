'use client';

import { useEffect, useRef } from 'react';
import { PixelMoon } from '@/components/topbar/PixelMoon';
import { useChamberClock } from '@/lib/hooks/use-chamber-clock';
import styles from './welcome-window.module.css';

type Props = {
  away: boolean;
  onDesktop: () => void;
  onSettings: (launcher: HTMLElement) => void;
};

export function WelcomeBar({ away, onDesktop, onSettings }: Props) {
  const { now, localTime, localDate, chamberCycle } = useChamberClock();
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      bar.current?.querySelectorAll('details[open]').forEach(panel => {
        if (event.target instanceof Node && !panel.contains(event.target)) panel.removeAttribute('open');
      });
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      const panel = bar.current?.querySelector('details[open]');
      if (panel) {
        panel.removeAttribute('open');
        panel.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  return (
    <header className={styles.topBar} ref={bar}>
      <details>
        <summary aria-label="ChamberOS system menu" data-launch-app="settings">
          <img src="/chamber-logo.svg" width="28" height="16" alt="" />ChamberOS
        </summary>
        <div className={styles.panel}>
          <button type="button" onClick={event => {
            event.currentTarget.closest('details')!.open = false;
            onDesktop();
          }}>{away ? 'open welcome' : 'show desktop'}</button>
          <button type="button" onClick={event => {
            const menu = event.currentTarget.closest('details')!;
            menu.open = false;
            onSettings(menu.querySelector('summary')!);
          }}>system settings…</button>
          <a href="/desktop">resident login</a>
        </div>
      </details>
      <div className={styles.status}>
        <details>
          <summary aria-label="Moon phase" title="Moon phase">
            <PixelMoon fraction={chamberCycle?.fraction} />
          </summary>
          <div className={styles.cycle}>
            <PixelMoon fraction={chamberCycle?.fraction} large />
            <div>
              <p>{chamberCycle?.phaseName ?? 'moon phase'}</p>
              {chamberCycle && <small>about {chamberCycle.ageDays} {chamberCycle.ageDays === 1 ? 'day' : 'days'} since the new moon</small>}
            </div>
          </div>
        </details>
        <time dateTime={now?.toISOString()} title={localDate}><span>{localDate}</span>{localTime}</time>
      </div>
    </header>
  );
}
