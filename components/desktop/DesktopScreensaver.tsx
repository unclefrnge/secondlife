'use client';

import { useEffect, useRef, useState } from 'react';

const IDLE_MS = 120_000;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Original, low-resolution ordered dither. No animation work runs while unmounted.
function DitherField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastPaint = -Infinity;
    let elapsed = 0;
    let lastTime: number | null = null;

    const resize = () => {
      canvas.width = Math.min(320, Math.ceil(window.innerWidth / 5));
      canvas.height = Math.max(1, Math.round(canvas.width * window.innerHeight / window.innerWidth));
      canvas.height = Math.min(220, canvas.height);
      lastPaint = -Infinity;
    };
    const draw = (time: number) => {
      if (lastTime !== null) elapsed += Math.min(time - lastTime, 100);
      lastTime = time;
      if (time - lastPaint >= 1000 / 12) {
        lastPaint = time;
        const { width, height } = canvas;
        const pixels = context.createImageData(width, height);
        const phase = elapsed / 14_000;
        for (let y = 0; y < height; y++) {
          const row = Math.sin(y / height * 5.5 + phase * 0.7);
          for (let x = 0; x < width; x++) {
            const wave = (Math.sin(x / width * 6 + row * 1.6 + phase) + 1) / 2;
            const falloff = Math.max(0, 1 - Math.abs(y / height - 0.5) * 1.65);
            const threshold = (BAYER[(y % 4) * 4 + x % 4] + 0.5) / 16;
            const shade = wave * falloff * 0.72 > threshold ? 133 : 10;
            const offset = (y * width + x) * 4;
            pixels.data[offset] = shade;
            pixels.data[offset + 1] = shade;
            pixels.data[offset + 2] = shade;
            pixels.data[offset + 3] = 255;
          }
        }
        context.putImageData(pixels, 0, 0);
      }
      if (!motion.matches) frame = window.requestAnimationFrame(draw);
    };
    const restart = () => {
      window.cancelAnimationFrame(frame);
      lastTime = null;
      lastPaint = -Infinity;
      draw(performance.now());
    };
    resize();
    restart();
    const onResize = () => { resize(); restart(); };
    window.addEventListener('resize', onResize);
    motion.addEventListener('change', restart);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      motion.removeEventListener('change', restart);
    };
  }, []);

  return <canvas ref={canvasRef} className="chamber-screensaver-field" aria-hidden="true" />;
}

export function DesktopScreensaver({ autoStart, previewToken }: { autoStart: boolean; previewToken: number }) {
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const overlayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let timer = 0;
    let suppressClickUntil = 0;
    const arm = () => {
      window.clearTimeout(timer);
      if (!autoStart || document.hidden || activeRef.current) return;
      timer = window.setTimeout(() => {
        // Reading or watching a full-screen video is not an idle desktop.
        const playingVideo = Array.from(document.querySelectorAll('video')).some((video) => !video.paused && !video.ended);
        if (document.fullscreenElement || playingVideo || document.querySelector('[role="dialog"][data-state="open"], [role="menu"]')) {
          arm();
          return;
        }
        activeRef.current = true;
        setActive(true);
      }, IDLE_MS);
    };
    const activity = (event: Event) => {
      if (activeRef.current) {
        // The wake gesture belongs to the screensaver, never to the app below it.
        if (event.type !== 'pointermove') {
          event.preventDefault();
          event.stopImmediatePropagation();
          suppressClickUntil = performance.now() + 500;
        }
        activeRef.current = false;
        setActive(false);
      }
      arm();
    };
    const blockWakeClick = (event: Event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const visibility = () => {
      activeRef.current = false;
      setActive(false);
      arm();
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((name) => window.addEventListener(name, activity, { capture: true, passive: false }));
    window.addEventListener('click', blockWakeClick, true);
    window.addEventListener('keyup', blockWakeClick, true);
    document.addEventListener('visibilitychange', visibility);
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, activity, true));
      window.removeEventListener('click', blockWakeClick, true);
      window.removeEventListener('keyup', blockWakeClick, true);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [autoStart]);

  useEffect(() => {
    if (previewToken > 0) {
      activeRef.current = true;
      setActive(true);
    }
  }, [previewToken]);

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    // Let the system menu finish restoring its trigger before taking focus.
    const focusTimer = window.setTimeout(() => overlayRef.current?.focus({ preventScroll: true }), 100);
    return () => {
      window.clearTimeout(focusTimer);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [active]);

  if (!active) return null;
  return (
    <button
      ref={overlayRef}
      type="button"
      className="chamber-screensaver"
      aria-label="Dither screensaver. Move the pointer or press any key to return to the desktop."
      onClick={() => { activeRef.current = false; setActive(false); }}
    >
      <DitherField />
      <span className="chamber-screensaver-caption" aria-hidden="true">CHAMBEROS <span>Move or press a key to return</span></span>
    </button>
  );
}
