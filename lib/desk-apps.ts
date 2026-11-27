import { chamberAppFilename, desktopGames, type DesktopGame } from './desktop-games';
import { TILL_SLIP, tillSlip } from './grocer-quest';

export type DeskApp = DesktopGame | 'settings' | 'about' | typeof TILL_SLIP;

export function isDeskApp(id: unknown): id is DeskApp {
  return id === 'about' || id === 'settings' || id === TILL_SLIP || desktopGames.some(game => game === id);
}

export function deskAppTitle(id: DeskApp) {
  if (id === 'about') return 'About ChamberOS';
  if (id === 'settings') return 'System settings';
  if (id === TILL_SLIP) return tillSlip.name;
  return chamberAppFilename(id);
}
