'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const phaseCopy = ['inhale', 'hold', 'exhale', 'hold'];

interface BreathingRingProps {
  durationMs: number;
  onComplete: () => void;
  onSkip: () => void;
  reducedMotion: boolean;
}

export function BreathingRing({ durationMs, onComplete, onSkip, reducedMotion }: BreathingRingProps) {
  const [elapsed, setElapsed] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const nextElapsed = Math.min(durationMs, now - startedAt);
      setElapsed(nextElapsed);
      if (nextElapsed < durationMs) {
        frame = window.requestAnimationFrame(tick);
        return;
      }

      if (!completedRef.current) {
        completedRef.current = true;
        window.setTimeout(onComplete, 420);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [durationMs, onComplete]);

  const phaseDuration = durationMs / 4;
  const progress = Math.min(elapsed / durationMs, 1);
  const phase = Math.min(3, Math.floor(elapsed / phaseDuration));
  const phaseProgress = Math.min((elapsed % phaseDuration) / phaseDuration, 1);

  const microcopy = progress >= 1 ? 'begin' : phaseCopy[phase];

  const easedPhase = useMemo(() => 0.5 - Math.cos(phaseProgress * Math.PI) / 2, [phaseProgress]);

  const scale = useMemo(() => {
    if (reducedMotion) {
      return 1;
    }
    if (progress >= 1) {
      return 1;
    }

    switch (phase) {
      case 0:
        return 0.82 + easedPhase * 0.3;
      case 1:
        return 1.12;
      case 2:
        return 1.12 - easedPhase * 0.3;
      default:
        return 0.82;
    }
  }, [easedPhase, phase, progress, reducedMotion]);

  const dashOffset = 754 - 754 * progress;

  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto flex w-full max-w-[320px] items-center justify-center">
        <svg
          width="320"
          height="320"
          viewBox="0 0 320 320"
          role="img"
          aria-label="Breathing lead-in animation"
        >
          <circle cx="160" cy="160" r="120" stroke="rgba(215,215,215,0.12)" strokeWidth="1" fill="none" />

          <circle
            cx="160"
            cy="160"
            r="120"
            stroke="rgba(242,242,240,0.84)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="754"
            strokeDashoffset={dashOffset}
            transform="rotate(-90 160 160)"
          />

          <circle
            cx="160"
            cy="160"
            r="72"
            fill="rgba(242,242,240,0.09)"
            style={{
              transform: `translate3d(0, 0, 0) scale(${scale})`,
              transformOrigin: '160px 160px',
              transition: reducedMotion ? 'none' : 'transform 160ms linear'
            }}
          />
        </svg>
      </div>

      <p className="text-base font-medium capitalize text-text">{microcopy}</p>

      <button
        type="button"
        onClick={onSkip}
        className="mx-auto inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        skip
      </button>
    </div>
  );
}
