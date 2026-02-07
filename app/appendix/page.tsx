'use client';

import Link from 'next/link';

import { appendixItems } from '@/lib/config';
import { useSecondLifeState } from '@/lib/hooks/use-second-life-state';

export default function AppendixPage() {
  const { state, isHydrated } = useSecondLifeState();

  if (!isHydrated) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-14 sm:px-10">
        <div className="h-10 w-48 animate-pulse rounded bg-zinc-900" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-14 sm:px-10 sm:py-20">
      {state.appendixUnlocked ? (
        <section className="space-y-7">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">SECOND LIFE</p>
            <h1 className="text-3xl font-medium text-text sm:text-4xl">Appendix</h1>
            <p className="text-sm text-muted">Unlocked by guided completion.</p>
          </header>

          <div className="space-y-3">
            {appendixItems.map((item) => (
              <article key={item.trackId} className="rounded-md border border-border bg-surface p-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted">{item.artefactType}</p>
                <h2 className="mt-2 text-base font-medium text-text">{item.title}</h2>
                <p className="mt-1 text-sm text-muted">{item.content}</p>
              </article>
            ))}
          </div>

          <Link
            href="/chapters"
            className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Return to listening
          </Link>
        </section>
      ) : (
        <section className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">SECOND LIFE</p>
            <h1 className="text-3xl font-medium text-text sm:text-4xl">Appendix locked</h1>
            <p className="text-sm text-muted">Complete all six tracks in Guided mode to unlock this page.</p>
          </header>

          <Link
            href="/chapters"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Return to listening
          </Link>
        </section>
      )}
    </main>
  );
}
