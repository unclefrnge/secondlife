'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, type ReactNode } from 'react';
import { PublicDesktopChrome } from '@/components/welcome/PublicDesktopChrome';
import { FolderIcon } from '@/components/desktop/FolderIcon';
import { discIcon } from '@/components/player/ChamberDeck';
import { desktopWorkFolders, playerName } from '@/lib/work-folders';
import { useDeskPreferences } from '@/lib/hooks/use-desk-preferences';
import { useWindowSize } from '@/lib/hooks/use-window-size';
import { folderTrail } from './directory';
import { FolderExplorer, FolderToolbar } from './FolderExplorer';
import { PortfolioFrame } from './PortfolioFrame';
import { PlayerContext, RecordingDeck, type Recording } from './Recordings';
import chrome from '@/components/welcome/welcome-window.module.css';
import styles from './work.module.css';

const sections = [
  { slug: 'welcome', name: 'Welcome' },
  ...desktopWorkFolders,
  { slug: 'player', name: playerName }
] as const;
type WindowId = typeof sections[number]['slug'];
type DeskLocation = { id: WindowId; href: string };
type DeskWindow = DeskLocation & { minimised: boolean; back: string[]; forward: string[] };
type Navigation = 'visit' | 'back' | 'forward' | 'browser';

function locationAt(href: string): DeskLocation | undefined {
  if (href === '/') return { id: 'welcome', href };
  const [, root, ...path] = href.split('/');
  const section = desktopWorkFolders.find(folder => folder.slug === path[0]);
  if (root === 'work' && section && folderTrail(path)) return { id: section.slug, href };
}

function parentsOf(href: string) {
  // Give a directly opened subfolder a way back to its section on the desktop.
  const folders = href.split('/').slice(2);
  return folders.slice(0, -1).map((_, index) => '/work/' + folders.slice(0, index + 1).join('/'));
}

function raise(stack: DeskWindow[], target: DeskLocation, navigation: Navigation = 'visit') {
  const previous = stack.find(item => item.id === target.id);
  if (previous?.href === target.href && !previous.minimised && previous === stack.at(-1)) return stack;
  let back = previous?.back ?? parentsOf(target.href);
  let forward = previous?.forward ?? [];
  if (previous && previous.href !== target.href) {
    if (navigation === 'back' || (navigation === 'browser' && back.at(-1) === target.href)) {
      back = back.slice(0, -1);
      forward = [...forward, previous.href];
    } else if (navigation === 'forward' || (navigation === 'browser' && forward.at(-1) === target.href)) {
      forward = forward.slice(0, -1);
      back = [...back, previous.href];
    } else {
      back = [...back, previous.href];
      forward = [];
    }
  }
  return [...stack.filter(item => item.id !== target.id), { ...target, back, forward, minimised: false }];
}

export function PublicDesktop({ welcome }: { welcome: ReactNode }) {
  const desktop = useRef<HTMLElement>(null);
  const preferences = useDeskPreferences();
  const pathname = usePathname();
  const router = useRouter();
  const [lastPath, setLastPath] = useState(pathname);
  const [stack, setStack] = useState<DeskWindow[]>(() => {
    const initial = locationAt(pathname);
    return initial ? raise([], initial) : [];
  });
  const [recording, setRecording] = useState<Recording | null>(null);
  const [large, setLarge] = useState<WindowId[]>([]);
  const { expanded, toggleSize, restore } = useWindowSize(desktop);
  const windowMenu = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    const next = locationAt(pathname);
    if (next) setStack(current => raise(current, next, 'browser'));
  }

  function focus(id?: WindowId) {
    requestAnimationFrame(() => {
      const target = id ? desktop.current?.querySelector<HTMLElement>(`[data-public-window="${id}"]:not([hidden])`)
        : windowMenu.current ?? desktop.current?.querySelector<HTMLElement>('nav[aria-label="Desktop shortcuts"] a');
      target?.focus({ preventScroll: true });
    });
  }
  function navigate(href: string, navigation: Navigation = 'visit') {
    const destination = locationAt(href);
    if (!destination) return;
    setStack(current => raise(current, destination, navigation));
    if (navigation === 'back' || navigation === 'forward') {
      router.push(href, { scroll: false });
      requestAnimationFrame(() => {
        if (document.activeElement === document.body || document.activeElement?.matches(':disabled')) {
          desktop.current?.querySelector<HTMLElement>(`[data-public-window="${destination.id}"] h1`)?.focus({ preventScroll: true });
        }
      });
      return;
    }
    focus(destination.id);
  }
  function folderHref(slug: string) {
    return stack.find(item => item.id === slug)?.href ?? '/work/' + slug;
  }
  function select(item: DeskLocation) {
    setStack(current => raise(current, item));
    if (item.id !== 'player' && item.href !== pathname) router.push(item.href, { scroll: false });
    focus(item.id);
  }
  function resize(id: WindowId, enlarge: boolean) {
    const next = expanded ? large.filter(item => item !== id) : [];
    if (enlarge) next.push(id);
    setLarge(next);
    if (enlarge && !expanded) toggleSize();
    else if (!next.length && expanded) restore();
  }
  function putAway(id: WindowId, close: boolean) {
    const update = (items: DeskWindow[]) => close ? items.filter(item => item.id !== id)
      : items.map(item => item.id === id ? { ...item, minimised: true } : item);
    setStack(update);
    if (close && id === 'player') setRecording(null);
    const next = update(stack).filter(item => !item.minimised).at(-1);
    const opener = trigger.current;
    const origin = opener?.closest<HTMLElement>('[data-public-window]');
    if (close && id === 'player' && opener?.isConnected && next && origin?.dataset.publicWindow === next.id) {
      opener.focus({ preventScroll: true });
    } else focus(next?.id);
  }
  function openRecording(file: Recording, anchor: HTMLAnchorElement) {
    trigger.current = anchor;
    setRecording(file);
    setStack(current => raise(current, { id: 'player', href: '' }));
    focus('player');
  }
  const front = stack.filter(item => !item.minimised).at(-1)?.id;
  const windows = stack.map(item => ({
    name: sections.find(section => section.slug === item.id)!.name,
    state: item.minimised ? 'minimised' as const : item.id === front ? 'active' as const : 'open' as const,
    select: () => select(item)
  }));
  if (!locationAt(pathname)) return null;
  return <main ref={desktop} className={styles.desktop} data-workspace="public" data-plate={preferences.iconPlate}>
    <PlayerContext.Provider value={{ href: recording?.href, open: openRecording }}>
      {front === 'welcome' && <a className={chrome.skip} href="#listen">skip to music</a>}
      <PublicDesktopChrome windows={windows} windowsRef={windowMenu} animateWallpaper={!expanded}
        desktopShown={!front} folderHref={folderHref} onOpenFolder={navigate}
        onDesktop={() => {
          if (!front) return select({ id: 'welcome', href: '/' });
          restore();
          setLarge([]);
          setStack(current => current.map(item => ({ ...item, minimised: true })));
          focus();
        }} wallpaperClass={styles.wallpaper}
        welcomeShortcut={<Link href="/" scroll={false} onNavigate={() => navigate('/')}><FolderIcon /><span>Welcome</span></Link>} />
      <div className={styles.workspace} data-window-area="">
        {sections.map(({ slug, name }) => {
          const rank = stack.findIndex(item => item.id === slug);
          if (rank < 0) return null;
          const item = stack[rank];
          const kind = slug === 'welcome' || slug === 'player' ? slug : 'files';
          const folder = kind === 'files' ? folderTrail(item.href.split('/').slice(2))?.at(-1) : undefined;
          return <PortfolioFrame key={slug} id={slug} kind={kind} layer={rank + 2} title={name}
            toolbar={folder && <FolderToolbar folder={folder} back={item.back.at(-1)} forward={item.forward.at(-1)} navigate={navigate} />}
            opener={slug === 'player' ? trigger : undefined} icon={slug === 'player' ? <img src={discIcon} alt="" width="20" height="20" /> : <FolderIcon kind={slug} />}
            mini={slug === 'player' && item.minimised && recording ? {
              title: recording.media === 'YouTube' ? recording.playerTitle ?? recording.name : playerName,
              artwork: recording.media === 'YouTube' ? recording.cover : undefined,
              restore: () => select(item)
            } : undefined}
            hidden={item.minimised} expanded={expanded && large.includes(slug)} focused={front === slug}
            onSize={enlarge => resize(slug, enlarge)} onFocus={() => setStack(current => raise(current, item))}
            onClose={() => putAway(slug, true)} onMinimise={() => putAway(slug, false)}>
            {slug === 'welcome' && <div className={styles.welcomeBody}>{welcome}</div>}
            {folder && <FolderExplorer folder={folder} href={item.href} navigate={navigate} />}
            {slug === 'player' && recording && <RecordingDeck file={recording} />}
          </PortfolioFrame>;
        })}
      </div>
    </PlayerContext.Provider>
  </main>;
}
