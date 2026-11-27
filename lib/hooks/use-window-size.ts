'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// The CSS expanded state also works when the browser declines native fullscreen.
export function useWindowSize(target: RefObject<HTMLElement>, inactive = false) {
  const [expanded, setExpanded] = useState(false);
  const wanted = useRef(false);
  const restore = useCallback(() => {
    wanted.current = false;
    setExpanded(false);
    if (target.current && document.fullscreenElement === target.current) {
      void document.exitFullscreen().catch(() => {});
    }
  }, [target]);

  useEffect(() => {
    const changed = () => {
      if (document.fullscreenElement === target.current && target.current) {
        if (!wanted.current) restore();
      } else if (wanted.current) {
        wanted.current = false;
        setExpanded(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (!wanted.current || event.key !== 'Escape' || target.current?.querySelector('dialog:modal, dialog[open][data-active="true"]')) return;
      if (!document.fullscreenElement || document.fullscreenElement === target.current) restore();
    };
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('fullscreenchange', changed);
      document.removeEventListener('keydown', escape);
    };
  }, [target, restore]);

  useEffect(() => {
    if (inactive && expanded) restore();
  }, [inactive, expanded, restore]);

  function toggleSize() {
    if (wanted.current) return restore();
    wanted.current = true;
    setExpanded(true);
    if (document.fullscreenEnabled) void target.current?.requestFullscreen?.().catch(() => {});
  }
  return { expanded, restore, toggleSize };
}
