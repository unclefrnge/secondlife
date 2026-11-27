'use client';

import { useEffect, useRef, type Ref } from 'react';
import Link from 'next/link';
import { desktopWorkFolders } from '@/lib/work-folders';
import { CalendarClock } from '@/components/calendar/CalendarClock';
import { PixelMoon } from '@/components/topbar/PixelMoon';
import { useChamberClock } from '@/lib/hooks/use-chamber-clock';
import styles from './welcome-window.module.css';

export type MenuWindow = {
  name: string;
  state: 'active' | 'open' | 'minimised';
  select: () => void;
};

type Props = {
  desktopLabel: string;
  onDesktop: () => void;
  onSettings: () => void;
  onAbout: () => void;
  folderHref: (slug: string) => string;
  onOpenFolder: (href: string) => void;
  windows: MenuWindow[];
  windowsRef?: Ref<HTMLElement>;
};

export function WelcomeBar({ desktopLabel, onDesktop, onSettings, onAbout, folderHref, onOpenFolder, windows, windowsRef }: Props) {
  const clock = useChamberClock();
  const { chamberCycle } = clock;
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent | FocusEvent) {
      bar.current?.querySelectorAll('details[open]').forEach(panel => {
        if (event.target instanceof Node && !panel.contains(event.target)) panel.removeAttribute('open');
      });
    }
    function escape(event: KeyboardEvent) {
      const panel = bar.current?.querySelector('details[open]');
      if (event.key === 'Escape' && panel) {
        event.stopPropagation();
        panel.removeAttribute('open');
        panel.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    document.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
      document.removeEventListener('keydown', escape, true);
    };
  }, []);

  return (
    <header className={styles.topBar} ref={bar} onClick={event => {
      const menu = event.target instanceof Element ? event.target.closest('button, a')?.closest('details') : null;
      if (menu) {
        const returnFocus = menu.contains(document.activeElement);
        menu.open = false;
        if (returnFocus) menu.querySelector('summary')?.focus({ preventScroll: true });
      }
    }}>
      <div className={styles.menus}>
        <details>
          <summary aria-label="ChamberOS system menu" data-system-menu="">
            <img src="/chamber-logo.svg" width="28" height="16" alt="" />ChamberOS
          </summary>
          <div className={styles.panel}>
            <button type="button" onClick={onAbout}>About ChamberOS</button>
            <button type="button" onClick={onSettings}>System settings…</button>
            <hr />
            <button type="button" onClick={onDesktop}>{desktopLabel}</button>
            {desktopWorkFolders.map(({ slug, name }) =>
              <Link key={slug} href={folderHref(slug)} scroll={false} onNavigate={() => onOpenFolder(folderHref(slug))}>{name}</Link>)}
            <hr />
            <a href="/desktop">resident login</a>
          </div>
        </details>
        {windows.length > 0 && <details>
          <summary ref={windowsRef} aria-label="Windows">Windows</summary>
          <div className={styles.windowMenu}>
            {windows.map(item => <button type="button" key={item.name} onClick={item.select}>
              {item.name}{item.state !== 'open' && <small>{item.state === 'active' ? 'Active' : 'Minimised'}</small>}
            </button>)}
          </div>
        </details>}
      </div>
      <div className={styles.status}>
        <details>
          <summary aria-label="Moon phase" title="Moon phase"><PixelMoon fraction={chamberCycle?.fraction} /></summary>
          <div className={styles.cycle}>
            <PixelMoon fraction={chamberCycle?.fraction} large />
            <div>
              <p>{chamberCycle?.phaseName ?? 'moon phase'}</p>
              {chamberCycle && <small>about {chamberCycle.ageDays} {chamberCycle.ageDays === 1 ? 'day' : 'days'} since the new moon</small>}
            </div>
          </div>
        </details>
        <CalendarClock clock={clock} />
      </div>
    </header>
  );
}
