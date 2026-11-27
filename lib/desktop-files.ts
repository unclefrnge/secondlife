import { chamberAppFilename, desktopGames, type DesktopGame } from '@/lib/desktop-games';
import { TILL_SLIP, tillSlip } from '@/lib/grocer-quest';
import { desktopWorkFolders } from '@/lib/work-folders';
import { frnge, tracks } from '@/lib/config';

export interface DesktopFile {
  id: string;
  name: string;
  kind: 'folder' | 'view' | 'text' | 'audio' | 'link' | 'game';
  game?: DesktopGame;
  children?: string[];
  view?: 'profile' | 'releases' | 'contact' | 'streams';
  text?: string;
  source?: string;
  href?: string;
  trackId?: string;
  delivery?: boolean;
}

// Desk fragments are new fiction inspired by the linked records, not recovered
// correspondence. See docs/LORE.md for sources and continuity boundaries.
export const DESKTOP_FILES: Record<string, DesktopFile> = {
  desktop: { id: 'desktop', name: 'Desktop', kind: 'folder', children: ['frnge-folder', 'second-life', 'chamber', 'incoming', 'unsorted', 'games'] },
  games: { id: 'games', name: 'GAMES/', kind: 'folder', children: [...desktopGames] },
  ...Object.fromEntries(desktopGames.map(game => [game, { id: game, name: chamberAppFilename(game), kind: 'game' as const, game }])),
  'frnge-folder': { id: 'frnge-folder', name: 'FRNGE/', kind: 'folder', children: ['profile', ...desktopWorkFolders.map(folder => folder.slug), 'contact', 'releases', 'streams'] },
  ...Object.fromEntries(desktopWorkFolders.map(({ slug, name }) => [
    slug, { id: slug, name, kind: 'folder' as const, href: '/work/' + slug }
  ])),
  profile: { id: 'profile', name: 'FRNGE.TXT', kind: 'view', view: 'profile' },
  releases: { id: 'releases', name: 'RELEASES/', kind: 'view', view: 'releases' },
  contact: { id: 'contact', name: 'CONTACT.MAIL', kind: 'view', view: 'contact' },
  streams: { id: 'streams', name: 'WHERE 2 STREAM.URL', kind: 'view', view: 'streams' },
  'second-life': { id: 'second-life', name: 'SECOND LIFE/', kind: 'folder', children: tracks.map((track) => `audio-${track.id}`) },
  chamber: { id: 'chamber', name: 'CHAMBER/', kind: 'folder', children: ['portal', 'times', 'clockify', 'null-lot', 'grocer', 'scans', 'pending'] },
  portal: { id: 'portal', name: 'CHAMBER COLLECTIVE.URL', kind: 'link', href: frnge.links.chamber },
  times: { id: 'times', name: 'CHAMBER TIMES.URL', kind: 'link', href: 'https://chamber-times.vercel.app' },
  clockify: {
    id: 'clockify', name: 'hours.txt', kind: 'text',
    text: 'Clockify is optional.\n\nKeep the hours somewhere anyway.\nSomeone will ask.\n\nThere is a paper book by the charging table.',
    source: 'https://chamber-times.vercel.app/#entry=83'
  },
  'null-lot': {
    id: 'null-lot', name: 'null-lot.txt', kind: 'text',
    text: 'NULL-LOT\nLoop Syndrome research\nAssigned: Knight\n\nNo floor plan attached.\nCheck the folder again if you have already checked the folder.',
    source: 'https://chamber-times.vercel.app/#entry=202'
  },
  grocer: {
    id: 'grocer', name: 'grocer-list.txt', kind: 'text',
    text: 'GOGO’S\n\nBread.\nA blank SD card. Check it before leaving.\n\nAsk about the listening playlist.\nKeep the receipt out of Adriaan’s expenses.',
    source: 'https://chamber-times.vercel.app/#entry=202'
  },
  scans: { id: 'scans', name: 'SCANS/', kind: 'folder', children: [] },
  pending: { id: 'pending', name: 'PENDING/', kind: 'folder', children: [] },
  unsorted: { id: 'unsorted', name: 'UNSORTED/', kind: 'folder', children: [] },
  incoming: { id: 'incoming', name: 'INCOMING/', kind: 'folder', children: ['gate-handover', TILL_SLIP] },
  [TILL_SLIP]: {
    id: TILL_SLIP, name: tillSlip.name, kind: 'text', delivery: true,
    text: `${tillSlip.shop}\n\n${tillSlip.item}     ${tillSlip.quantity}\n\n${tillSlip.note}\n${tillSlip.closing}`,
    source: 'https://chamber-times.vercel.app/#entry=202'
  },
  'gate-handover': {
    id: 'gate-handover', name: 'gate-handover.txt', kind: 'text', delivery: true,
    text: 'GATE HANDOVER\n\nSam has the spare gate key.\nAdriaan has the USB marked SPARE.\nPlease stop swapping them.\n\n— Parker',
    source: 'https://chamber-times.vercel.app/#entry=202'
  },
  ...Object.fromEntries(tracks.map((track) => [`audio-${track.id}`, {
    id: `audio-${track.id}`, name: track.audioFile, kind: 'audio' as const, trackId: track.id
  }]))
};

export function getDesktopFile(id = 'desktop', deliveredFileIds?: readonly string[]): DesktopFile {
  const entry = DESKTOP_FILES[id] ?? DESKTOP_FILES.desktop;
  if (entry.delivery && deliveredFileIds !== undefined && !deliveredFileIds.includes(entry.id)) {
    return { ...DESKTOP_FILES.incoming, children: [] };
  }
  if (entry.id === 'incoming' && deliveredFileIds !== undefined) {
    return { ...entry, children: entry.children?.filter((child) => deliveredFileIds.includes(child)) };
  }
  return entry;
}

export function getParentFolder(id: string): string {
  return Object.values(DESKTOP_FILES).find((file) => file.children?.includes(id))?.id ?? 'desktop';
}
