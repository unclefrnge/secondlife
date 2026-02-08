export type ChamberMode = 'guided' | 'free' | 'hardcore';

export type Archetype =
  | 'Seer Intern'
  | 'Surveillance Adjunct'
  | 'Kombucha Acolyte'
  | 'Bread Compliance Runner'
  | 'Rogue Attache';

export type StatKey = 'distortion' | 'viscosity' | 'bureaucracy';

export type RitualCommand =
  | 'sniff-bread'
  | 'salt-flash'
  | 'wordle'
  | 'pray'
  | 'file-form'
  | 'hum-b-flat';

export type TrackId =
  | 'track-brioche-contraband-sweep'
  | 'track-analog-nomad-sigil-containment'
  | 'track-home-affairs-queue-trap-escape';

export interface PlayerStats {
  distortion: number;
  viscosity: number;
  bureaucracy: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  tags?: string[];
}

export interface LogMessage {
  id: string;
  ts: number;
  role: 'dm' | 'player' | 'system';
  text: string;
}

export interface CodexDiscoveries {
  locations: string[];
  npcs: string[];
  items: string[];
  laws: string[];
}

export interface ChamberSave {
  version: 1;
  createdAt: string;
  updatedAt: string;
  player: {
    name: string;
    archetype: string;
    stats: PlayerStats;
    hp: number;
    conditions: string[];
  };
  world: {
    locationId: string;
    visited: Record<string, boolean>;
    npcFlags: Record<string, unknown>;
    questFlags: Record<string, unknown>;
    inventory: InventoryItem[];
  };
  log: {
    messages: LogMessage[];
  };
}

export interface CharacterBlueprint {
  name: string;
  archetype: Archetype;
  stats: PlayerStats;
  starterItemId: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  summary: string;
  tags: string[];
  consumable?: boolean;
}

export interface NpcDefinition {
  id: string;
  name: string;
  title: string;
  locationId: string;
  summary: string;
  lines: {
    intro: string;
    repeat: string;
    clue?: string;
  };
}

export interface LocationDefinition {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  exits: string[];
  npcIds: string[];
  itemIds: string[];
  encounterTable: string[];
}

export interface TrackDefinition {
  id: TrackId;
  title: string;
  summary: string;
}

export type CommandIntent =
  | { type: 'look' }
  | { type: 'go'; target: string }
  | { type: 'talk'; target: string }
  | { type: 'take'; target: string }
  | { type: 'use'; target: string }
  | { type: 'inventory' }
  | { type: 'status' }
  | { type: 'help' }
  | { type: 'ritual'; ritual: RitualCommand }
  | { type: 'undo' }
  | { type: 'unknown'; raw: string };

export interface RollCheck {
  label: string;
  stat: StatKey;
  roll: number;
  statValue: number;
  total: number;
  dc: number;
  success: boolean;
}

export interface TurnInput {
  save: ChamberSave;
  mode: ChamberMode;
  openedTracks: string[];
  completedTracks: string[];
  appendixUnlocked: boolean;
  rawCommand: string;
  intent: CommandIntent;
  now: number;
  rollValue?: number;
}

export interface TurnResult {
  save: ChamberSave;
  openedTracks: string[];
  completedTracks: string[];
  appendixUnlocked: boolean;
  roll?: RollCheck;
}
