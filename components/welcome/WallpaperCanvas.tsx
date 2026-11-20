'use client';

import { useEffect, useRef } from 'react';
import { paintWallpaper, type Wallpaper } from './wallpapers';
import styles from './welcome-window.module.css';

export function WallpaperCanvas({ scene, running, className = styles.wallpaper }: { scene: Wallpaper; running: boolean; className?: string }) {
  const surface = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  useEffect(() => {
    const canvas = surface.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;
    const paint = () => paintWallpaper[scene](context, canvas.width, canvas.height, frame.current / 192);
    const resize = () => {
      const scale = Math.max(canvas.clientHeight < 150 ? 1 : 3, Math.ceil(canvas.clientWidth / 420), Math.ceil(canvas.clientHeight / 340));
      canvas.width = Math.max(1, Math.round(canvas.clientWidth / scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight / scale));
      paint();
    };
    const sync = () => {
      window.clearInterval(timer);
      if (running && !motion.matches && !document.hidden) {
        timer = window.setInterval(() => { frame.current = (frame.current + 1) % 192; paint(); }, 125);
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    sync();
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [scene, running]);
  return <canvas className={className} ref={surface} aria-hidden="true" />;
}
