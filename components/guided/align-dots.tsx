'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface AlignDotsProps {
  durationMs: number;
  driftSpeed: 'slow' | 'normal' | 'fast';
  onComplete: () => void;
  onSkip: () => void;
  reducedMotion: boolean;
}

interface Point {
  x: number;
  y: number;
}

const speedMap = {
  slow: 0.00045,
  normal: 0.0007,
  fast: 0.00105
};

export function AlignDots({
  durationMs,
  driftSpeed,
  onComplete,
  onSkip,
  reducedMotion
}: AlignDotsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const [draggable, setDraggable] = useState<Point>({ x: 96, y: 158 });
  const [target, setTarget] = useState<Point>({ x: 214, y: 150 });
  const [copy, setCopy] = useState('align');
  const [snapped, setSnapped] = useState(false);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    setCopy('begin');
    window.setTimeout(onComplete, 500);
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    setSnapped(false);
    setCopy('align');
    setDraggable({ x: 96, y: 158 });
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / durationMs, 1);
      const amp = reducedMotion ? 2 : 12;
      const speed = speedMap[driftSpeed];

      setTarget({
        x: 214 + Math.sin(elapsed * speed) * amp,
        y: 150 + Math.cos(elapsed * speed * 1.28) * amp
      });

      if (progress >= 1) {
        finish();
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [driftSpeed, durationMs, finish, reducedMotion]);

  useEffect(() => {
    if (completedRef.current) {
      return;
    }

    const dx = target.x - draggable.x;
    const dy = target.y - draggable.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 16) {
      setSnapped(true);
      setDraggable(target);
      finish();
    }
  }, [draggable, finish, target]);

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const nextX = ((clientX - rect.left) / rect.width) * 320;
    const nextY = ((clientY - rect.top) / rect.height) * 320;

    setDraggable({
      x: Math.max(36, Math.min(284, nextX)),
      y: Math.max(36, Math.min(284, nextY))
    });
  }, []);

  const dotStyle = useMemo(
    () =>
      snapped
        ? 'fill-text'
        : 'fill-transparent stroke-text hover:fill-[rgba(242,242,240,0.1)] transition-colors duration-ui ease-calm',
    [snapped]
  );

  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto w-full max-w-[320px]">
        <svg
          ref={svgRef}
          width="320"
          height="320"
          viewBox="0 0 320 320"
          role="img"
          aria-label="Align dots lead-in interaction"
          className="mx-auto"
        >
          <rect x="0" y="0" width="320" height="320" rx="16" fill="rgba(255,255,255,0.015)" />

          <circle cx={target.x} cy={target.y} r="12" fill="rgba(242,242,240,0.66)" />

          <circle
            cx={draggable.x}
            cy={draggable.y}
            r="14"
            className={dotStyle}
            strokeWidth="2"
            pointerEvents="none"
          />
          <circle
            cx={draggable.x}
            cy={draggable.y}
            r="22"
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label="Draggable dot"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              updateFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (!dragging) {
                return;
              }
              updateFromPointer(event.clientX, event.clientY);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setDraggable(target);
                return;
              }

              const step = 8;
              const horizontal = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
              const vertical = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;

              if (horizontal || vertical) {
                event.preventDefault();
                setDraggable((current) => ({
                  x: Math.max(36, Math.min(284, current.x + horizontal)),
                  y: Math.max(36, Math.min(284, current.y + vertical))
                }));
              }
            }}
          />

          <line
            x1={draggable.x}
            y1={draggable.y}
            x2={target.x}
            y2={target.y}
            stroke="rgba(242,242,240,0.24)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <p className="text-base font-medium capitalize tracking-[0.02em] text-text">{copy}</p>

      <button
        type="button"
        onClick={onSkip}
        className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        skip
      </button>
    </div>
  );
}
