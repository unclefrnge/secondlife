import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { project, tracks } from '@/lib/config';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: project.title,
  numTracks: tracks.length,
  track: tracks.map((track, index) => ({
    '@type': 'MusicRecording',
    position: index + 1,
    name: track.title
  }))
};

export const metadata: Metadata = {
  title: project.title,
  description: project.ogDescription,
  metadataBase: new URL('https://second-life.example.com'),
  openGraph: {
    title: project.title,
    description: project.ogDescription,
    images: ['/og-image.svg']
  },
  twitter: {
    card: 'summary_large_image',
    title: project.title,
    description: project.ogDescription,
    images: ['/og-image.svg']
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
