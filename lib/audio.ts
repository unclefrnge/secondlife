import { audioBaseUrl } from '@/lib/config';
import type { Track } from '@/lib/types';

export function getTrackAudioUrl(track: Track): string {
  const normalizedBase = audioBaseUrl.endsWith('/') ? audioBaseUrl.slice(0, -1) : audioBaseUrl;
  return `${normalizedBase}/${encodeURIComponent(track.audioFile)}`;
}
