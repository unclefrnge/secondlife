'use client';

import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderIcon } from '@/components/desktop/FolderIcon';
import { desktopWorkFolders } from '@/lib/work-folders';
import { chamberAppFilename, desktopGames } from '@/lib/desktop-games';
import { TILL_SLIP, tillSlip } from '@/lib/grocer-quest';
import { useChamberWorld } from '@/lib/hooks/use-chamber-world';
import { useDeskPreferences } from '@/lib/hooks/use-desk-preferences';
import { WallpaperCanvas } from './WallpaperCanvas';
import { WelcomeBar, type MenuWindow } from './WelcomeBar';
import { deskAppTitle, isDeskApp, type DeskApp } from '@/lib/desk-apps';
import styles from './welcome-window.module.css';

const DeskWindow = dynamic(() => import('./PublicDeskWindow').then(module => module.PublicDeskWindow));

function currentDeskApp(): DeskApp | null {
  const entry = window.history.state;
  if ((entry?.frngeDeskPath ?? '/') !== window.location.pathname) return null;
  const id = entry?.frngeDeskApp;
  return isDeskApp(id) ? id : null;
}

type Props = {
  windows: MenuWindow[];
  windowsRef?: Ref<HTMLElement>;
  folderHref: (slug: string) => string;
  animateWallpaper?: boolean;
  wallpaperClass?: string;
  welcomeShortcut?: ReactNode;
  desktopShown: boolean;
  onDesktop: () => void;
  onOpenFolder: (href: string) => void;
};

export function PublicDesktopChrome({ windows, windowsRef, folderHref, animateWallpaper, wallpaperClass, welcomeShortcut, desktopShown, onDesktop, onOpenFolder }: Props) {
  const pathname = usePathname();
  const preferences = useDeskPreferences();
  const [utilityState, setUtilityState] = useState<MenuWindow['state']>('active');
  const utility = useRef<HTMLDialogElement>(null);
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
        setUtilityState('active');
        appLauncher.current = id;
      } else if (appLauncher.current) {
        const launcher = appLauncher.current;
        appLauncher.current = null;
        requestAnimationFrame(() => {
          const button = document.querySelector<HTMLElement>(launcher === 'about' || launcher === 'settings'
            ? '[data-system-menu]' : `[data-launch-app="${launcher}"]`)
            ?? document.querySelector<HTMLElement>('[data-launch-app="till"]');
          button?.focus({ preventScroll: true });
        });
      }
    }
    syncApp();
    window.addEventListener('popstate', syncApp);
    return () => window.removeEventListener('popstate', syncApp);
  }, [pathname]);

  // Native focus and pointer selection both raise the chosen desktop window.
  useEffect(() => {
    if (!app) return;
    function select(event: Event) {
      if (event.target instanceof Element && event.target.closest('[data-public-window]:not([data-mini-player])')) {
        setUtilityState(state => state === 'active' ? 'open' : state);
      }
    }
    document.addEventListener('pointerdown', select, true);
    document.addEventListener('focusin', select, true);
    return () => {
      document.removeEventListener('pointerdown', select, true);
      document.removeEventListener('focusin', select, true);
    };
  }, [app]);

  function raiseUtility() {
    setUtilityState('active');
    requestAnimationFrame(() => utility.current?.focus({ preventScroll: true }));
  }
  function launch(id: DeskApp) {
    const existing = currentDeskApp();
    if (existing !== id) {
      const entry = { ...window.history.state, frngeDeskApp: id, frngeDeskPath: window.location.pathname };
      if (existing) window.history.replaceState(entry, '');
      else window.history.pushState(entry, '');
    }
    appLauncher.current = id;
    setApp(id);
    raiseUtility();
  }
  function closeApp() {
    if (dismissing.current || !currentDeskApp()) return;
    dismissing.current = true;
    window.history.back();
  }
  useEffect(() => {
    if (app === TILL_SLIP && world.ready && !hasSlip) closeApp();
  }, [app, world.ready, hasSlip]);

  const openApp = app && (app !== TILL_SLIP || hasSlip) ? app : null;
  const utilityVisible = !!openApp && utilityState !== 'minimised';
  useEffect(() => {
    if (desktopShown && openApp && utilityState === 'open') raiseUtility();
  }, [desktopShown, openApp, utilityState]);

  const menuWindows: MenuWindow[] = windows.map(item => ({
    ...item,
    state: openApp && utilityState === 'active' && item.state === 'active' ? 'open' : item.state,
    select: () => {
      if (utilityVisible) setUtilityState('open');
      item.select();
    }
  }));
  if (openApp) menuWindows.push({
    name: deskAppTitle(openApp),
    state: utilityState, select: raiseUtility
  });

  return <>
    <WallpaperCanvas scene={preferences.wallpaper} running={!!animateWallpaper && preferences.animate && (!openApp || utilityState === 'minimised')} className={wallpaperClass} />
    <WelcomeBar windows={menuWindows} windowsRef={windowsRef} desktopLabel={desktopShown && !utilityVisible ? 'open welcome' : 'show desktop'}
      onDesktop={() => {
        if (utilityVisible) setUtilityState('minimised');
        if (!desktopShown || !utilityVisible) onDesktop();
      }}
      onAbout={() => launch('about')} onSettings={() => launch('settings')} folderHref={folderHref} onOpenFolder={onOpenFolder} />
    <nav className={styles.gameShortcuts} aria-label="Desktop shortcuts">
      {welcomeShortcut}
      {desktopWorkFolders.map(({ slug, name }) => (
        <Link key={slug} href={folderHref(slug)} scroll={false} onNavigate={() => onOpenFolder(folderHref(slug))}><FolderIcon kind={slug} /><span>{name}</span></Link>
      ))}
      {desktopGames.map(id => <button key={id} data-launch-app={id} type="button" onClick={() => launch(id)}>
        <img src={`/icons/games/${id}.png`} width="48" height="40" alt="" /><span>{chamberAppFilename(id)}</span>
      </button>)}
      {hasSlip && <button data-launch-app={TILL_SLIP} type="button" onClick={() => launch(TILL_SLIP)}>
        <img src="/icons/till-slip.png" width="48" height="40" alt="" /><span>{tillSlip.name}</span>
      </button>}
    </nav>
    {openApp && <DeskWindow refNode={utility} app={openApp} till={world} onClose={closeApp} state={utilityState}
      onSelect={() => setUtilityState('active')} />}
  </>;
}
