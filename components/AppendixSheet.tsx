'use client';

import { TRACK_DEFINITIONS } from '@/data/tracks';
import type { CodexDiscoveries } from '@/engine/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AppendixSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unlocked: boolean;
  discoveries: CodexDiscoveries;
  openedTracks: string[];
  completedTracks: string[];
}

function SectionList({ title, entries }: { title: string; entries: string[] }) {
  return (
    <section className="space-y-2 rounded-md border border-border bg-black/25 p-3">
      <h3 className="text-xs uppercase tracking-[0.12em] text-muted">{title}</h3>
      {entries.length ? (
        <ul className="space-y-1 text-sm text-text">
          {entries.map((entry) => (
            <li key={entry}>- {entry}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No entries yet.</p>
      )}
    </section>
  );
}

export function AppendixSheet({
  open,
  onOpenChange,
  unlocked,
  discoveries,
  openedTracks,
  completedTracks
}: AppendixSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appendix // Chamber Codex</SheetTitle>
          <SheetDescription>
            {unlocked
              ? 'Discovered entries from this run and prior loops.'
              : 'Locked. Complete any track to unlock codex entries.'}
          </SheetDescription>
        </SheetHeader>

        <section className="space-y-2 rounded-md border border-border bg-black/30 p-3">
          <h3 className="text-xs uppercase tracking-[0.12em] text-muted">Tracks</h3>
          <ul className="space-y-2 text-sm">
            {TRACK_DEFINITIONS.map((track) => {
              const isOpened = openedTracks.includes(track.id);
              const isCompleted = completedTracks.includes(track.id);

              return (
                <li key={track.id} className="rounded border border-border bg-black/20 p-2">
                  <p className="text-text">{track.title}</p>
                  <p className="text-xs text-muted">{track.summary}</p>
                  <p className="pt-1 text-xs text-muted">
                    {isCompleted ? 'completed' : isOpened ? 'opened' : 'sealed'}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {unlocked ? (
          <div className="space-y-3">
            <SectionList title="Locations" entries={discoveries.locations} />
            <SectionList title="NPCs" entries={discoveries.npcs} />
            <SectionList title="Items" entries={discoveries.items} />
            <SectionList title="Laws & Rituals" entries={discoveries.laws} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
