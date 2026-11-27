'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { MiniPlayerBar } from '@/components/player/MiniPlayerBar';
import { PublicWindowBar } from '@/components/windows/PublicWindowBar';
import { useWindowDrag } from '@/lib/hooks/use-window-drag';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';
import styles from './work.module.css';

interface Props {
  kind: 'welcome' | 'files' | 'player';
  id: string;
  layer: number;
  opener?: RefObject<HTMLElement>;
  title: string;
  icon: ReactNode;
  toolbar?: ReactNode;
  hidden: boolean;
  mini?: { title: string; credit?: string; artwork?: string; restore: () => void };
  focused: boolean;
  expanded: boolean;
  onSize: (expanded: boolean) => void;
  onFocus: () => void;
  onClose: () => void;
  onMinimise: () => void;
  children: ReactNode;
}

export function PortfolioFrame({ kind, title, icon, toolbar, id, layer, opener, hidden, mini, focused, expanded, onSize, onFocus, onClose, onMinimise, children }: Props) {
  const frame = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const node = frame.current;
    const folder = opener?.current?.closest('[data-public-window]')?.getBoundingClientRect();
    const area = node?.parentElement?.getBoundingClientRect();
    if (!node || !folder || !area?.width || !area.height) return;
    node.style.setProperty('--player-center', (folder.left - area.left + folder.width * .64) / area.width * 100 + '%');
    node.style.setProperty('--player-top', (folder.top - area.top) / area.height * 100 + '%');
  }, [opener]);
  const compact = Boolean(mini);
  useLayoutEffect(() => {
    const node = frame.current;
    const desktop = node?.closest<HTMLElement>('[data-workspace="public"]');
    if (!compact || !node || !desktop) return;
    const measure = () => desktop.style.setProperty('--mini-height', node.offsetHeight + 'px');
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      desktop.style.removeProperty('--mini-height');
    };
  }, [compact]);
  const mobile = useIsMobile();
  const drag = useWindowDrag(frame, mobile, 44, expanded || hidden || !!mini);
  const miniDrag = useWindowDrag(frame, !mini, 44, false, '--mini-translate');
  const shrinking = useRef<Animation | null>(null);
  useEffect(() => () => shrinking.current?.cancel(), []);

  function minimise() {
    if (shrinking.current) return;
    onSize(false);
    if (!frame.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onMinimise();
    const motion = frame.current.animate([{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.1' }],
      { duration: 230, easing: 'cubic-bezier(.45,.05,.75,.3)' });
    shrinking.current = motion;
    motion.onfinish = () => {
      shrinking.current = null;
      onMinimise();
    };
  }
  function close() {
    shrinking.current?.cancel();
    shrinking.current = null;
    onSize(false);
    onClose();
  }
  return (
    <section ref={frame} tabIndex={-1} aria-label={mini ? title + ' mini player' : title} className={styles.frame} hidden={hidden && !mini}
      style={{ zIndex: mini ? 8 : layer }} data-mini-player={mini ? true : undefined} data-public-window={id} data-work-window={kind} data-work-player={kind === 'player' ? '' : undefined}
      data-front={focused} data-expanded={expanded} onPointerDownCapture={mini ? undefined : onFocus} onFocusCapture={mini ? undefined : onFocus}>
      {mini ? <MiniPlayerBar title={mini.title} credit={mini.credit} artwork={mini.artwork} handle={miniDrag.handle}
        onRestore={mini.restore} onClose={close} /> : <PublicWindowBar title={title}
        minimiseLabel={kind === 'player' ? 'Switch to mini player' : undefined} icon={icon}
        expanded={expanded} handle={expanded ? {} : drag.handle}
        onClose={close} onMinimise={minimise} onToggleSize={() => onSize(!expanded)}>{toolbar}</PublicWindowBar>}
      {children}
    </section>
  );
}
