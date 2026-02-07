'use client';

import { AlignDots } from '@/components/guided/align-dots';
import { BreathingRing } from '@/components/guided/breathing-ring';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import type { Track } from '@/lib/types';

interface GuidedLeadInProps {
  track: Track | null;
  onComplete: (trackId: string) => void;
  onSkip: (trackId: string) => void;
}

export function GuidedLeadIn({ track, onComplete, onSkip }: GuidedLeadInProps) {
  const reducedMotion = usePrefersReducedMotion();

  if (!track) {
    return null;
  }

  return (
    <Dialog open={Boolean(track)} onOpenChange={(nextOpen) => (!nextOpen ? onSkip(track.id) : undefined)}>
      <DialogContent mobile="sheet" className="max-w-lg">
        <DialogHeader className="mb-1 space-y-1">
          <DialogTitle>{track.title}</DialogTitle>
          <DialogDescription>Short lead-in.</DialogDescription>
        </DialogHeader>

        {track.leadIn.type === 'breathing-ring' ? (
          <BreathingRing
            durationMs={track.leadIn.durationMs}
            onComplete={() => onComplete(track.id)}
            onSkip={() => onSkip(track.id)}
            reducedMotion={reducedMotion}
          />
        ) : (
          <AlignDots
            durationMs={track.leadIn.durationMs}
            driftSpeed={track.leadIn.driftSpeed ?? 'normal'}
            onComplete={() => onComplete(track.id)}
            onSkip={() => onSkip(track.id)}
            reducedMotion={reducedMotion}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
