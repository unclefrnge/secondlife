import type { AppId } from '@/lib/windowStore';

export type TopBarAction =
  | { type: 'open-window'; appId: AppId }
  | { type: 'new-window' }
  | { type: 'close-focused-window' }
  | { type: 'reset-desktop' }
  | { type: 'copy-sigil-id' }
  | { type: 'paste' }
  | { type: 'zoom-in' }
  | { type: 'zoom-out' }
  | { type: 'focus-desktop' }
  | { type: 'minimise-focused-window' }
  | { type: 'bring-all-to-front' }
  | { type: 'focus-window'; windowId: string }
  | { type: 'show-patch-notes' }
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
  { id: 'system-about', label: 'About ChamberOS', action: { type: 'open-window', appId: 'about' } },
  { id: 'system-quest', label: 'Open Chamber Text Quest', action: { type: 'open-window', appId: 'text-quest' } },
  { id: 'system-map', label: 'Open Lore Map', action: { type: 'open-window', appId: 'lore-map' } },
  { id: 'system-divider-1', separator: true },
  { id: 'system-patch', label: 'Patch Notes', action: { type: 'show-patch-notes' } },
  { id: 'system-divider-2', separator: true },
  { id: 'system-quit', label: 'Quit ChamberOS', action: { type: 'show-quit-dialog' } }
];

export const fileMenuItems: MenuEntry[] = [
  { id: 'file-new', label: 'New Window', shortcut: '⌘N', action: { type: 'new-window' } },
  { id: 'file-close', label: 'Close Window', shortcut: '⌘W', action: { type: 'close-focused-window' } },
  { id: 'file-divider-1', separator: true },
  { id: 'file-reset', label: 'Reset Desktop', action: { type: 'reset-desktop' } }
];

export const editMenuItems: MenuEntry[] = [
  { id: 'edit-copy', label: 'Copy Sigil ID', shortcut: '⌘C', action: { type: 'copy-sigil-id' } },
  { id: 'edit-paste', label: 'Paste', shortcut: '⌘V', action: { type: 'paste' } }
];

export const viewMenuItems: MenuEntry[] = [
  { id: 'view-zoom-in', label: 'Zoom In', shortcut: '⌘+', action: { type: 'zoom-in' } },
  { id: 'view-zoom-out', label: 'Zoom Out', shortcut: '⌘−', action: { type: 'zoom-out' } }
];

export const goMenuItems: MenuEntry[] = [
  { id: 'go-recents', label: 'Recents', action: { type: 'open-window', appId: 'recents' } },
  { id: 'go-documents', label: 'Documents', action: { type: 'open-window', appId: 'documents' } },
  { id: 'go-desktop', label: 'Desktop', action: { type: 'focus-desktop' } },
  { id: 'go-downloads', label: 'Downloads', action: { type: 'open-window', appId: 'downloads' } },
  { id: 'go-network', label: 'Network', action: { type: 'open-window', appId: 'network' } },
  { id: 'go-divider-1', separator: true },
  { id: 'go-quest', label: 'Chamber Text Quest', action: { type: 'open-window', appId: 'text-quest' } },
  { id: 'go-lore-map', label: 'Lore Map', action: { type: 'open-window', appId: 'lore-map' } },
  { id: 'go-lore-index', label: 'Lore Index', action: { type: 'open-window', appId: 'lore-index' } }
];

export const windowMenuItems: MenuEntry[] = [
  { id: 'window-minimise', label: 'Minimise', shortcut: '⌘M', action: { type: 'minimise-focused-window' } },
  { id: 'window-front', label: 'Bring All to Front', action: { type: 'bring-all-to-front' } }
];

export const helpMenuItems: MenuEntry[] = [
  { id: 'help-shortcuts', label: 'Keyboard Shortcuts', action: { type: 'show-keyboard-shortcuts' } },
  { id: 'help-report', label: 'Report Mid Tech House', action: { type: 'show-mid-tech-house-report' } },
  { id: 'help-status', label: 'System Status', action: { type: 'open-window', appId: 'system-status' } }
];
