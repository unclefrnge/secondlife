import { playerName } from './work-folders';
import type { AppId } from '@/lib/windowStore';

export const DOCK_APPS = [
  { appId: 'listen', label: playerName, iconSrc: '/icons/breeze/media-playback-start.svg' },
  { appId: 'files', label: 'files', iconSrc: '/icons/breeze/folder.svg' },
  { appId: 'text-quest', label: 'text quest', iconSrc: '/icons/breeze/akonadiconsole.svg' }
] as const;

export type DockAppId = typeof DOCK_APPS[number]['appId'];

// Legacy document panels are part of Files, so every open window has a dock
// destination without filling the shelf with duplicate document icons.
export function getDockAppId(appId: AppId): DockAppId {
  return appId === 'listen' || appId === 'text-quest' ? appId : 'files';
}
