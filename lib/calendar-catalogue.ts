import { folderTrail, type WorkFolder } from '@/app/work/directory';
import type { Recording } from '@/app/work/Recordings';
import { calendarDay, type CalendarEntry } from './calendar';

// The archive includes one upload whose station title gives no exact broadcast day.
const shortMonths = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
function radioDate(label: string) {
  const match = /^(?:(\d{1,2}) )?([A-Z][a-z]{2}) (\d{4})$/.exec(label);
  if (!match) return;
  const month = shortMonths.indexOf(match[2]) + 1;
  if (!month) return;
  return match[3] + '-' + String(month).padStart(2, '0') + (match[1] ? '-' + match[1].padStart(2, '0') : '');
}

export function archivedEntries() {
  const entries = new Map<string, CalendarEntry>();
  function visit(folder: WorkFolder, radio: boolean) {
    for (const file of folder.files ?? []) {
      if (!file.media || entries.has(file.href)) continue;
      const date = radio ? radioDate(file.date ?? file.name) : file.calendarDate;
      if (date) entries.set(file.href, {
        date, kind: radio ? 'Radio' : 'Release', title: file.playerTitle ?? file.name,
        recording: { ...file, media: file.media }
      });
    }
    for (const child of folder.folders ?? []) visit(child, radio || !!child.radio);
  }
  visit(folderTrail(['releases-radio'])!.at(-1)!, false);
  return entries;
}

export type ReleaseAnnouncement = { title: string; date: string; published: boolean; link?: string };

function newRecording(url: URL, name: string): Recording | undefined {
  const host = url.hostname.toLowerCase();
  if (['www.youtube.com', 'youtube.com', 'youtu.be'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : null;
    if (id && /^[\w-]{11}$/.test(id)) return { name, href: 'https://www.youtube.com/watch?v=' + id, media: 'YouTube' };
  }
  if (['mixcloud.com', 'www.mixcloud.com'].includes(host) && /^\/[^/]+\/[^/]+\/?$/.test(url.pathname))
    return { name, href: url.href, media: 'Mixcloud' };
  if (host === 'music.apple.com' && /^\/(?:[a-z]{2}\/)?(?:album|song)\//.test(url.pathname))
    return { name, href: url.href, media: 'Apple Music' };
  if (host === 'bandcamp.com' && url.pathname.startsWith('/EmbeddedPlayer/')) {
    const match = /\/(track)=(\d+)(?:\/|$)/.exec(url.pathname) ?? /\/(album)=(\d+)(?:\/|$)/.exec(url.pathname);
    if (match) return { name, href: url.href, media: { bandcamp: match[1] === 'track' ? 'track' : 'album', id: Number(match[2]) } };
  }
}

// Bandcamp publishes its own player address in the release page's Open Graph metadata.
// Resolve it once at build time. An unannounced or unavailable page can still be linked.
async function bandcampRecording(url: URL, title: string): Promise<Recording | undefined> {
  if (!/^[a-z0-9-]+\.bandcamp\.com$/.test(url.hostname) || url.port || !/^\/(album|track)\/[\w-]+\/?$/.test(url.pathname)) return;
  try {
    const response = await fetch(url.origin + url.pathname, { signal: AbortSignal.timeout(6000), redirect: 'error' });
    if (!response.ok) return;
    const page = await response.text();
    const tag = page.match(/<meta\b[^>]*\bproperty=["']og:video["'][^>]*>/i)?.[0];
    const playerUrl = tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1];
    const media = playerUrl && newRecording(new URL(playerUrl), title)?.media;
    if (media && typeof media === 'object') return { name: title, href: url.href, media };
  } catch { /* Keep the canonical release link when the provider is unavailable. */ }
}

export async function addAnnouncement(entries: Map<string, CalendarEntry>, announcement: ReleaseAnnouncement) {
  if (announcement.published !== true) return;
  const { title, date, link } = announcement;
  const time = Date.parse(date + 'T00:00:00Z');
  if (!title?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(time) || calendarDay(new Date(time)) !== date)
    throw new Error('A published calendar release requires a title and a valid date.');
  const url = link?.trim() ? new URL(link.trim()) : undefined;
  if (url && (url.protocol !== 'https:' || url.username || url.password)) throw new Error('Use a public HTTPS release link.');
  const known = url && entries.get(url.href)?.recording;
  const recording = known ?? (url && (newRecording(url, title) ?? await bandcampRecording(url, title)));
  const key = url && entries.get(url.href)?.date === date ? url.href : JSON.stringify([date, title, url?.href]);
  entries.set(key, { title: title.trim(), date, kind: 'Release', recording, href: recording ? undefined : url?.href });
}
