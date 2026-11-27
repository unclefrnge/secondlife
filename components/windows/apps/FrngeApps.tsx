'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { siApplemusic, siBandcamp, siSoundcloud, siSpotify, siTidal } from 'simple-icons';

import { Button } from '@/components/ui/button';
import { frnge } from '@/lib/config';

const externalLinkClass =
  'block rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const monochromeIcon = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg.replace('<svg ', '<svg fill="#f3f1ea" '))}`;

const streamPlatforms = [
  { name: 'Spotify', href: frnge.links.spotify, iconSrc: monochromeIcon(siSpotify.svg) },
  { name: 'Apple Music', href: frnge.links.appleMusic, iconSrc: monochromeIcon(siApplemusic.svg) },
  { name: 'TIDAL', href: frnge.links.tidal, iconSrc: monochromeIcon(siTidal.svg) },
  { name: 'SoundCloud', href: frnge.links.soundcloud, iconSrc: monochromeIcon(siSoundcloud.svg) },
  { name: 'Bandcamp', href: frnge.links.bandcamp, iconSrc: monochromeIcon(siBandcamp.svg) },
  {
    name: 'Subvert.fm',
    href: frnge.links.subvert,
    iconSrc: 'https://storage.ghost.io/c/82/cc/82cc9879-e8cf-4eb3-8d19-19b2fc3b7c5a/content/images/size/w1200/2024/10/xcard.png'
  }
] as const;

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={externalLinkClass}>
      {children}
    </a>
  );
}

export function FrngeProfile() {
  return (
    <section className="space-y-5 text-base text-text">
      <header className="space-y-1 border-b border-border pb-4">
        <h2 className="font-identity text-2xl">FRNGE</h2>
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
        <h2 className="font-identity text-base text-text">releases</h2>
        <Link className="text-xs underline" href="/work/releases-radio/own-releases">Browse releases and play tracks</Link>
      </header>
      <ol className="divide-y divide-border border-y border-border text-xs text-text">
        {frnge.releases.map((release, index) => (
          <li key={release} className="flex gap-3 px-1 py-2.5">
            <span aria-hidden="true" className="w-6 shrink-0 text-muted">{String(index + 1).padStart(2, '0')}</span>
            <span>{release}</span>
          </li>
        ))}
      </ol>
      <ExternalLink href={frnge.links.bandcamp}>open full archive on Bandcamp</ExternalLink>
    </section>
  );
}

export function ListenDirectory() {
  return (
    <section className="stream-directory" aria-label="Where to stream FRNGE">
      <p className="stream-directory-caption">choose a platform</p>
      <nav className="stream-directory-grid" aria-label="Music platforms">
        {streamPlatforms.map(({ name, href, iconSrc }) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="stream-directory-link" aria-label={`Open ${name} in a new tab`}>
            <span className="stream-directory-icon" aria-hidden="true">
              <Image src={iconSrc} alt="" width={44} height={44} unoptimized className={name === 'Subvert.fm' ? 'stream-directory-subvert' : undefined} />
            </span>
            <span className="stream-directory-label">{name}</span>
          </a>
        ))}
      </nav>
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
        <h2 className="font-identity text-base text-text">contact.mail</h2>
        <a href={`mailto:${frnge.email}`} className="mt-2 inline-block text-lg text-text underline decoration-border underline-offset-4 hover:decoration-accent">
          {frnge.email}
        </a>
      </header>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => copy(frnge.email, 'Email copied.')}>copy email</Button>
        <Button asChild type="button" size="sm" variant="secondary"><a href={`mailto:${frnge.email}`}>open email client</a></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => copy(contactBlock, 'Contact info copied.')}>copy contact info</Button>
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
            <dd className="min-w-0 break-all"><a href={href} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4 hover:decoration-accent">{href}</a></dd>
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
        <h2 className="font-identity text-base text-text">Chamber</h2>
        <p className="text-muted">collective signal</p>
      </div>
      <ExternalLink href={frnge.links.chamber}>enter Chamber Collective</ExternalLink>
    </section>
  );
}
