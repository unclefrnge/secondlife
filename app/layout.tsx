import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { frnge, siteMetadata } from '@/lib/config';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: siteMetadata.title,
  description: siteMetadata.description,
  url: siteMetadata.url,
  jobTitle: ['Producer', 'DJ'],
  memberOf: {
    '@type': 'Organization',
    name: 'Chamber Collective'
  },
  sameAs: [frnge.links.spotify, frnge.links.bandcamp, frnge.links.soundcloud, frnge.links.instagram, frnge.links.tiktok]
};

export const metadata: Metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  metadataBase: new URL(siteMetadata.url),
  openGraph: {
    type: 'website',
    url: siteMetadata.url,
    siteName: siteMetadata.title,
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: ['/og-image.svg']
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMetadata.title,
    description: siteMetadata.description,
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
