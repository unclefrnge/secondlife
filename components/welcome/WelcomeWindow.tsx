'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { desktopGames } from '@/lib/desktop-games';
import { TILL_SLIP, tillSlip } from '@/lib/grocer-quest';
import { useChamberWorld } from '@/lib/hooks/use-chamber-world';
import type { DeskApp } from './PublicDeskWindow';
import shell from '@/app/home.module.css';
import styles from './welcome-window.module.css';
import { WelcomeBar } from './WelcomeBar';
import { WallpaperCanvas } from './WallpaperCanvas';
import { useDeskPreferences } from '@/lib/hooks/use-desk-preferences';
import { useWindowDrag } from '@/lib/hooks/use-window-drag';

const DeskWindow = dynamic(() => import('./PublicDeskWindow').then(module => module.PublicDeskWindow));

type HiddenState = 'closed' | 'minimized';

function currentDeskApp(): DeskApp | null {
  const id = window.history.state?.frngeDeskApp;
  return id === 'settings' || id === TILL_SLIP || desktopGames.includes(id) ? id : null;
}

export function WelcomeWindow({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState<HiddenState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [app, setApp] = useState<DeskApp | null>(null);
  const world = useChamberWorld();
  const hasSlip = world.deliveredFileIds.includes(TILL_SLIP);
  const appLauncher = useRef<DeskApp | null>(null);
  const dismissing = useRef(false);
  useEffect(() => {
    function syncApp() {
      dismissing.current = false;
      const id = currentDeskApp();
      setApp(id);
      if (id) {
        appLauncher.current = id;
      } else if (appLauncher.current) {
        const launcher = appLauncher.current;
        appLauncher.current = null;
        requestAnimationFrame(() => {
          const button = document.querySelector<HTMLElement>(`[data-launch-app="${launcher}"]`)
            ?? document.querySelector<HTMLElement>('[data-launch-app="till"]');
          button?.focus({ preventScroll: true });
        });
      }
    }
    syncApp();
    window.addEventListener('popstate', syncApp);
    return () => window.removeEventListener('popstate', syncApp);
  }, []);

  function launch(id: DeskApp) {
    if (currentDeskApp()) return;
    window.history.pushState({ frngeDeskApp: id }, '');
    appLauncher.current = id;
    setApp(id);
  }
  function closeApp() {
    if (dismissing.current || !currentDeskApp()) return;
    dismissing.current = true;
    window.history.back();
  }
  useEffect(() => {
    if (app === TILL_SLIP && world.ready && !hasSlip) closeApp();
  }, [app, world.ready, hasSlip]);
  const wantsFullscreen = useRef(false);
  const preferences = useDeskPreferences();
  const frame = useRef<HTMLDivElement>(null);
  const drag = useWindowDrag(frame, expanded || !!hidden);
  const shrinking = useRef<Animation | null>(null);
  const root = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const minimize = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HiddenState | null>(null);

  useEffect(() => {
    if (hidden) {
      restore.current?.focus({ preventScroll: true });
    } else if (returnTo.current) {
      (returnTo.current === 'closed' ? close : minimize).current?.focus({ preventScroll: true });
      returnTo.current = null;
    }
  }, [hidden]);

  useEffect(() => {
    const onFullscreen = () => {
      const active = document.fullscreenElement === root.current;
      if (active && !wantsFullscreen.current) {
        void document.exitFullscreen().catch(() => {});
        return;
      }
      wantsFullscreen.current = active;
      setExpanded(active);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement && !root.current?.querySelector('dialog[open]')) {
        wantsFullscreen.current = false;
        setExpanded(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('keydown', onKey);
    return () => {
      shrinking.current?.cancel();
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function leaveFullscreen() {
    wantsFullscreen.current = false;
    setExpanded(false);
    if (document.fullscreenElement === root.current && document.exitFullscreen) {
      void document.exitFullscreen().catch(() => {});
    }
  }
  function putAway(state: HiddenState) {
    if (shrinking.current) return;
    leaveFullscreen();
    returnTo.current = state;
    if (state === 'minimized' && frame.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const bounds = frame.current.getBoundingClientRect();
      const x = (window.innerWidth - bounds.width) / 2 - bounds.left;
      const y = (window.innerHeight - bounds.height) / 2 - bounds.top;
      const animation = frame.current.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(.09)`, opacity: 0 }
      ], { duration: 230, easing: 'cubic-bezier(.45,.05,.75,.3)', fill: 'forwards' });
      shrinking.current = animation;
      animation.onfinish = () => {
        shrinking.current = null;
        setHidden('minimized');
      };
    } else {
      setHidden(state);
    }
  }
  function openWelcome() {
    if (shrinking.current) {
      shrinking.current.cancel();
      shrinking.current = null;
    }
    if (hidden) setHidden(null);
    else minimize.current?.focus({ preventScroll: true });
  }
  function toggleSize() {
    if (expanded) return leaveFullscreen();
    wantsFullscreen.current = true;
    setExpanded(true);
    // Keep the window viewport-sized when embedded browsers decline native fullscreen.
    if (document.fullscreenEnabled) void root.current?.requestFullscreen?.().catch(() => {});
  }

  return (
    <main ref={root} className={`${shell.page} ${styles.desk}`} data-plate={preferences.iconPlate} data-expanded={expanded} data-away={!!hidden}>
      {!hidden && <a className={styles.skip} href="#listen" onClick={event => {
        const directory = document.getElementById('listen');
        if (directory) {
          event.preventDefault();
          directory.focus();
        }
      }}>skip to music</a>}
      <WallpaperCanvas scene={preferences.wallpaper} running={preferences.animate && !expanded && !app} />
      <WelcomeBar away={!!hidden} onDesktop={() => hidden ? openWelcome() : putAway('minimized')}
        onSettings={() => launch('settings')} />
      <nav className={styles.gameShortcuts} aria-label="Desktop shortcuts">
        {desktopGames.map(id => <button key={id} data-launch-app={id} type="button" onClick={() => launch(id)}>
          <img src={`/icons/games/${id}.png`} width="48" height="40" alt="" />
          <span>{id}.exe</span>
        </button>)}
        {hasSlip && <button data-launch-app={TILL_SLIP} type="button" onClick={() => launch(TILL_SLIP)}>
          <img src="/icons/till-slip.png" width="48" height="40" alt="" />
          <span>{tillSlip.name}</span>
        </button>}
      </nav>
      {app && (app !== TILL_SLIP || hasSlip) && <DeskWindow app={app} till={world} onClose={closeApp} />}
      {hidden && (
        <button ref={restore} data-state={hidden} className={styles.desktopFolder} onClick={openWelcome}>
          <i className={styles.folder} aria-hidden="true" />
          <span>welcome</span>
        </button>
      )}
      {!hidden && (
        <div ref={frame} className={`${shell.window} ${styles.frame}`}>
          <header className={styles.chrome} {...drag.handle} aria-label="Move welcome window">
            <div className={styles.controls}>
              <button ref={close} aria-label="Close window" title="Close window" onClick={() => putAway('closed')}><span aria-hidden="true"><i>×</i></span></button>
              <button ref={minimize} aria-label="Minimize window" title="Minimize window" onClick={() => putAway('minimized')}><span aria-hidden="true"><i>−</i></span></button>
              <button aria-label={expanded ? 'Restore window size' : 'Enter full screen'} title={expanded ? 'Restore window size' : 'Enter full screen'} onClick={toggleSize}><span aria-hidden="true"><i className={styles.sizeGlyph} /></span></button>
            </div>
            <span className={styles.caption}><i className={styles.folder} aria-hidden="true" />welcome</span>
          </header>
          {children}
        </div>
      )}
    </main>
  );
}
