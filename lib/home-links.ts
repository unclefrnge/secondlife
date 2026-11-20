import { frnge } from './config';

// Add a project title and URL here when it is being promoted, newest first.
export const featuredLinks: { label: string; href: string; artwork?: string; caption?: string }[] = [
  {
    label: 'ALSO',
    artwork: '/artwork/also.webp',
    caption: 'latest release',
    href: 'https://www.chambercollective.net/also-an-album-by-frnge-jaco-van-der-merwe-trxstxssx/'
  }
];

// The order here is the reading order on both desktop and mobile.
export const musicLinks = [
  { label: 'Spotify', icon: 'spotify', href: frnge.links.spotify },
  { label: 'Bandcamp', icon: 'bandcamp', href: frnge.links.bandcamp },
  { label: 'Apple Music', icon: 'applemusic', href: frnge.links.appleMusic },
  { label: 'SoundCloud', icon: 'soundcloud', href: frnge.links.soundcloud }
];

export const footerLinks = [
  { label: 'chamber collective', href: frnge.links.chamber },
  { label: 'discord', href: 'https://discord.gg/va5Bk9kM4' },
  { label: 'ig', href: frnge.links.instagram },
  { label: 'contact', href: '/contact' }
];
