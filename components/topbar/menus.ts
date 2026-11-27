import type { AppId } from '@/lib/windowStore';

export type TopBarAction =
  | { type: 'open-window'; appId: AppId }
  | { type: 'new-window' }
  | { type: 'close-focused-window' }
  | { type: 'reset-desktop' }
  | { type: 'copy-sigil-id' }
  | { type: 'paste' }
  | { type: 'focus-desktop' }
  | { type: 'minimise-focused-window' }
  | { type: 'bring-all-to-front' }
  | { type: 'focus-window'; windowId: string }
  | { type: 'show-patch-notes' }
  | { type: 'preview-screensaver' }
  | { type: 'show-quit-dialog' }
  | { type: 'show-keyboard-shortcuts' }
  | { type: 'show-mid-tech-house-report' };

export interface MenuEntry {
  id: string;
  label?: string;
  shortcut?: string;
  action?: TopBarAction;
  separator?: boolean;
}

export const systemMenuItems: MenuEntry[] = [
  { id: 'system-credits', label: 'About ChamberOS', action: { type: 'open-window', appId: 'credits' } },
  { id: 'system-credits-divider', separator: true },
  { id: 'system-files', label: 'files', action: { type: 'open-window', appId: 'files' } },
  { id: 'system-about', label: 'FRNGE.txt', action: { type: 'open-window', appId: 'about' } },
  { id: 'system-releases', label: 'releases', action: { type: 'open-window', appId: 'library' } },
  { id: 'system-listen', label: 'where to stream', action: { type: 'open-window', appId: 'support' } },
  { id: 'system-contact', label: 'contact.mail', action: { type: 'open-window', appId: 'steal' } },
  { id: 'system-chamber', label: 'Chamber', action: { type: 'open-window', appId: 'lore-index' } },
  { id: 'system-divider-primary', separator: true },
  { id: 'system-quest', label: 'open text quest', action: { type: 'open-window', appId: 'text-quest' } },
  { id: 'system-map', label: 'open lore map', action: { type: 'open-window', appId: 'lore-map' } },
  { id: 'system-divider-1', separator: true },
  { id: 'system-patch', label: 'patch notes', action: { type: 'show-patch-notes' } },
  { id: 'system-screensaver', label: 'screensaver', action: { type: 'preview-screensaver' } },
  { id: 'system-divider-2', separator: true },
  { id: 'system-quit', label: 'quit ChamberOS', action: { type: 'show-quit-dialog' } }
];

export const fileMenuItems: MenuEntry[] = [
  { id: 'file-new', label: 'new window', shortcut: '⌘N', action: { type: 'new-window' } },
  { id: 'file-close', label: 'close window', shortcut: '⌘W', action: { type: 'close-focused-window' } },
  { id: 'file-divider-1', separator: true },
  { id: 'file-reset', label: 'reset desktop', action: { type: 'reset-desktop' } }
];

export const editMenuItems: MenuEntry[] = [
  { id: 'edit-copy', label: 'copy sigil ID', shortcut: '⌘C', action: { type: 'copy-sigil-id' } },
  { id: 'edit-paste', label: 'paste', shortcut: '⌘V', action: { type: 'paste' } }
];

export const goMenuItems: MenuEntry[] = [
  { id: 'go-recents', label: 'recents', action: { type: 'open-window', appId: 'recents' } },
  { id: 'go-documents', label: 'documents', action: { type: 'open-window', appId: 'documents' } },
  { id: 'go-desktop', label: 'desktop', action: { type: 'focus-desktop' } },
  { id: 'go-downloads', label: 'downloads', action: { type: 'open-window', appId: 'downloads' } },
  { id: 'go-network', label: 'network', action: { type: 'open-window', appId: 'network' } },
  { id: 'go-divider-1', separator: true },
  { id: 'go-quest', label: 'text quest', action: { type: 'open-window', appId: 'text-quest' } },
  { id: 'go-lore-map', label: 'lore map', action: { type: 'open-window', appId: 'lore-map' } },
  { id: 'go-lore-index', label: 'Chamber index', action: { type: 'open-window', appId: 'lore-index' } }
];

export const windowMenuItems: MenuEntry[] = [
  { id: 'window-minimise', label: 'minimise', shortcut: '⌘M', action: { type: 'minimise-focused-window' } },
  { id: 'window-front', label: 'bring all to front', action: { type: 'bring-all-to-front' } }
];

export const helpMenuItems: MenuEntry[] = [
  { id: 'help-shortcuts', label: 'keyboard shortcuts', action: { type: 'show-keyboard-shortcuts' } },
  { id: 'help-report', label: 'report mid tech house', action: { type: 'show-mid-tech-house-report' } },
  { id: 'help-status', label: 'system status', action: { type: 'open-window', appId: 'system-status' } }
];
