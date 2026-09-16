'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { frnge } from '@/lib/config';

const externalLinkClass =
  'block rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={externalLinkClass}>
      {children}
    </a>
  );
}

export function FrngeProfile() {
  return (
    <section className="space-y-5 text-sm text-text">
      <header className="space-y-1 border-b border-border pb-4">
        <h2 className="font-mono text-xl tracking-[0.08em]">FRNGE</h2>
        <p className="text-muted">Cape Town, South Africa</p>
      </header>
      <div className="max-w-[52ch] space-y-3 leading-relaxed">
        <p>Electronic music moving through leftfield bass, breaks, jungle, gqom, ambient and adjacent forms.</p>
        <p>Producer, DJ and co-founder of Chamber Collective.</p>
        <p className="text-muted">flashdrive forager. distortionist.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ExternalLink href={frnge.links.spotify}>Spotify</ExternalLink>
        <ExternalLink href={frnge.links.bandcamp}>Bandcamp</ExternalLink>
        <ExternalLink href={frnge.links.soundcloud}>SoundCloud</ExternalLink>
      </div>
    </section>
  );
}

export function ReleaseDirectory() {
  return (
    <section className="space-y-4">
      <header className="border-b border-border pb-3">
        <h2 className="font-mono text-base tracking-[0.08em] text-text">RELEASES/</h2>
        <p className="mt-1 text-xs text-muted">FRNGE catalogue index</p>
      </header>
      <ol className="divide-y divide-border border-y border-border font-mono text-xs text-text">
        {frnge.releases.map((release, index) => (
          <li key={release} className="flex gap-3 px-1 py-2.5">
            <span aria-hidden="true" className="w-6 shrink-0 text-muted">{String(index + 1).padStart(2, '0')}</span>
            <span>{release}</span>
          </li>
        ))}
      </ol>
      <ExternalLink href={frnge.links.bandcamp}>OPEN FULL ARCHIVE ON BANDCAMP</ExternalLink>
    </section>
  );
}

export function ListenDirectory() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-mono text-base tracking-[0.08em] text-text">LISTEN.EXE</h2>
        <p className="mt-1 text-xs text-muted">Select a platform.</p>
      </header>
      <div className="grid gap-2">
        <ExternalLink href={frnge.links.spotify}>Spotify</ExternalLink>
        <ExternalLink href={frnge.links.bandcamp}>Bandcamp</ExternalLink>
        <ExternalLink href={frnge.links.soundcloud}>SoundCloud</ExternalLink>
      </div>
    </section>
  );
}

const contactBlock = `FRNGE\ncontact@frn.ge\n\nWebsite: https://frn.ge\nInstagram: https://instagram.com/unclefrnge/\nTikTok: https://www.tiktok.com/@unclefrnge\nSoundCloud: https://soundcloud.com/frngemusic\nBandcamp: https://frnge.bandcamp.com\nSpotify: https://open.spotify.com/artist/3mKDwqQ4AyrT3AQkiBqGHn`;

export function ContactMail() {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const copy = (value: string, confirmation: string) => {
    void navigator.clipboard.writeText(value).then(() => setCopyStatus(confirmation)).catch(() => setCopyStatus('Clipboard unavailable.'));
  };

  return (
    <section className="space-y-4">
      <header className="border-b border-border pb-3">
        <h2 className="font-mono text-base tracking-[0.08em] text-text">CONTACT.MAIL</h2>
        <a href={`mailto:${frnge.email}`} className="mt-2 inline-block text-lg text-text underline decoration-border underline-offset-4 hover:decoration-accent">
          {frnge.email}
        </a>
      </header>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => copy(frnge.email, 'Email copied.')}>Copy Email</Button>
        <Button asChild type="button" size="sm" variant="secondary"><a href={`mailto:${frnge.email}`}>Open Email Client</a></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => copy(contactBlock, 'Contact info copied.')}>COPY CONTACT INFO</Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-xs text-muted">{copyStatus}</p>
      <dl className="space-y-2 text-sm">
        {[
          ['Website', frnge.links.website],
          ['Instagram', frnge.links.instagram],
          ['TikTok', frnge.links.tiktok],
          ['SoundCloud', frnge.links.soundcloud],
          ['Bandcamp', frnge.links.bandcamp],
          ['Spotify', frnge.links.spotify]
        ].map(([label, href]) => (
          <div key={label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <dt className="w-24 text-muted">{label}</dt>
            <dd><a href={href} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4 hover:decoration-accent">{href}</a></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ChamberLink() {
  return (
    <section className="space-y-4 text-sm">
      <div className="space-y-1">
        <h2 className="font-mono text-base tracking-[0.08em] text-text">CHAMBER/</h2>
        <p className="text-muted">collective signal</p>
      </div>
      <ExternalLink href={frnge.links.chamber}>ENTER CHAMBER COLLECTIVE</ExternalLink>
    </section>
  );
}
