'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { project } from '@/lib/config';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  onResetProgress: () => void;
}

export function InfoModal({ open, onClose, onResetProgress }: InfoModalProps) {
  const isMobile = useIsMobile();

  const body = (
    <div className="space-y-4">
      <p className="text-sm text-muted">{project.infoGuidedLine}</p>
      <p className="text-sm text-muted">{project.infoDirectLine}</p>
      <p className="text-sm text-muted">{project.infoReplayLine}</p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onResetProgress();
            onClose();
          }}
        >
          Reset progress
        </Button>

        <Button asChild type="button" variant="ghost">
          <Link href="/privacy" onClick={onClose}>
            Privacy
          </Link>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
        <SheetContent side="bottom">
          <SheetHeader className="mb-4 space-y-1 border-b border-border pb-4">
            <SheetTitle>Info</SheetTitle>
            <SheetDescription>Two listening modes.</SheetDescription>
          </SheetHeader>
          {body}
          <SheetClose asChild>
            <Button variant="ghost" className="mt-5 w-full">
              Close
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader className="mb-1 space-y-1 border-b border-border pb-4">
          <DialogTitle>Info</DialogTitle>
          <DialogDescription>Two listening modes.</DialogDescription>
        </DialogHeader>
        {body}
        <DialogClose asChild>
          <Button variant="ghost" className="mt-4 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
