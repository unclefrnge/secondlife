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
import { accessLinks } from '@/lib/config';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';

interface AccessModalProps {
  open: boolean;
  onClose: () => void;
}

function ExternalRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-11 items-center justify-between rounded-md border border-border px-4 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-muted">
        open
      </span>
    </a>
  );
}

function AccessBody({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3 border-b border-border pb-5" aria-label="Stream links">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Stream</h3>
        <div className="space-y-2">
          <ExternalRow label="Spotify" href={accessLinks.stream.spotify} />
          <ExternalRow label="SoundCloud" href={accessLinks.stream.soundcloud} />
          <ExternalRow label="Apple Music" href={accessLinks.stream.appleMusic} />
          <ExternalRow label="Untitled" href={accessLinks.stream.untitled} />
        </div>
      </section>

      <section className="space-y-3 border-b border-border pb-5" aria-label="Support links">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Support</h3>
        <ExternalRow label="Bandcamp" href={accessLinks.support.bandcamp} />
      </section>

      <section className="space-y-3" aria-label="Download link">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Download</h3>
        <Link
          href="/download"
          onClick={onClose}
          className="flex min-h-11 items-center justify-between rounded-md border border-border px-4 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span>Free download (newsletter subscription required)</span>
          <span aria-hidden="true" className="text-muted">
            open
          </span>
        </Link>
      </section>
    </div>
  );
}

export function AccessModal({ open, onClose }: AccessModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader className="mb-5 space-y-1 border-b border-border pb-4">
            <SheetTitle>Access</SheetTitle>
            <SheetDescription>Stream, support, and download options.</SheetDescription>
          </SheetHeader>
          <AccessBody onClose={onClose} />
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
          <DialogTitle>Access</DialogTitle>
          <DialogDescription>Stream, support, and download options.</DialogDescription>
        </DialogHeader>
        <AccessBody onClose={onClose} />
        <DialogClose asChild>
          <Button variant="ghost" className="mt-1 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
