'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { randomInt } from '@/lib/utils';

interface InterstitialOverlayProps {
  open: boolean;
  lines: string[];
  onDone: () => void;
  onSkip: () => void;
}

export function InterstitialOverlay({ open, lines, onDone, onSkip }: InterstitialOverlayProps) {
  const [durationMs, setDurationMs] = useState(0);
  const [line, setLine] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }

    const nextDuration = randomInt(6000, 10000);
    setDurationMs(nextDuration);
    setLine(lines[Math.floor(Math.random() * lines.length)]);

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const ratio = Math.min(elapsed / nextDuration, 1);
      setProgress(ratio);
      if (ratio >= 1) {
        onDone();
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [lines, onDone, open]);

  const width = useMemo(() => `${Math.round(progress * 100)}%`, [progress]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onSkip() : undefined)}>
      <DialogContent mobile="sheet" className="max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle>Buffer</DialogTitle>
          <DialogDescription>A short pause between chapters.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-1 text-center">
          <p className="text-base font-medium text-text">{line}</p>

          <div className="h-px w-full overflow-hidden bg-border">
            <div className="h-full bg-text transition-[width] duration-150 ease-linear" style={{ width }} />
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            skip
          </button>

          <p className="text-xs tracking-[0.08em] text-muted">
            {Math.ceil(Math.max(durationMs * (1 - progress), 0) / 1000)}s
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
