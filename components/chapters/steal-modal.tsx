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
import { downloadConfig, stealLinks } from '@/lib/config';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';

interface StealModalProps {
  open: boolean;
  onClose: () => void;
}

function LinkRow({ label, href, tone = 'default' }: { label: string; href: string; tone?: 'default' | 'muted' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-11 items-center justify-between rounded-md border border-border px-4 py-2 text-sm transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className={tone === 'muted' ? 'text-muted' : 'text-text'}>{label}</span>
      <span aria-hidden="true" className="text-muted">
        open
      </span>
    </a>
  );
}

function StealBody({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3 border-b border-border pb-5" aria-label="Direct files">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Direct</h3>
        <div className="space-y-2">
          <LinkRow label="MP3 direct" href={downloadConfig.mp3Url} />
          <LinkRow label="WAV direct" href={downloadConfig.wavUrl} />
          <LinkRow label="Artwork pack" href={downloadConfig.artworkUrl} />
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-5" aria-label="Community links">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Community</h3>
        <div className="space-y-2">
          <LinkRow label="Soulseek room" href={stealLinks.soulseekRoomUrl} tone="muted" />
          <LinkRow label="Torrent magnet" href={stealLinks.magnetUrl} tone="muted" />
        </div>
      </section>

      <section className="space-y-3" aria-label="Official free gate">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Official</h3>
        <Link
          href="/download"
          onClick={onClose}
          className="flex min-h-11 items-center justify-between rounded-md border border-border px-4 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span>Free download gate</span>
          <span aria-hidden="true" className="text-muted">
            open
          </span>
        </Link>
      </section>
    </div>
  );
}

export function StealModal({ open, onClose }: StealModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader className="mb-5 space-y-1 border-b border-border pb-4">
            <SheetTitle>Steal</SheetTitle>
            <SheetDescription>Free-access and mirror links.</SheetDescription>
          </SheetHeader>
          <StealBody onClose={onClose} />
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
      <DialogContent className="max-w-xl">
        <DialogHeader className="mb-2 space-y-1 border-b border-border pb-4">
          <DialogTitle>Steal</DialogTitle>
          <DialogDescription>Free-access and mirror links.</DialogDescription>
        </DialogHeader>
        <StealBody onClose={onClose} />
        <DialogClose asChild>
          <Button variant="ghost" className="mt-1 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
