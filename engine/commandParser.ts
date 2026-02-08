import type { CommandIntent } from '@/engine/types';
import { ITEM_DEFINITIONS } from '@/data/items';
import { LOCATION_DEFINITIONS } from '@/data/locations';
import { NPC_DEFINITIONS } from '@/data/npcs';

const SIMPLE_COMMANDS: Record<string, CommandIntent> = {
  look: { type: 'look' },
  l: { type: 'look' },
  inventory: { type: 'inventory' },
  inv: { type: 'inventory' },
  i: { type: 'inventory' },
  status: { type: 'status' },
  stats: { type: 'status' },
  help: { type: 'help' },
  undo: { type: 'undo' },
  'sniff bread': { type: 'ritual', ritual: 'sniff-bread' },
  'salt-flash': { type: 'ritual', ritual: 'salt-flash' },
  'salt flash': { type: 'ritual', ritual: 'salt-flash' },
  wordle: { type: 'ritual', ritual: 'wordle' },
  pray: { type: 'ritual', ritual: 'pray' },
  'file form': { type: 'ritual', ritual: 'file-form' },
  'hum b-flat': { type: 'ritual', ritual: 'hum-b-flat' },
  'hum b flat': { type: 'ritual', ritual: 'hum-b-flat' },
  'hum bflat': { type: 'ritual', ritual: 'hum-b-flat' }
};

function readTail(input: string, keyword: string): string {
  return input.slice(keyword.length).trim();
}

export function parseCommand(rawInput: string): CommandIntent {
  const normalized = rawInput.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!normalized) {
    return { type: 'unknown', raw: '' };
  }

  if (SIMPLE_COMMANDS[normalized]) {
    return SIMPLE_COMMANDS[normalized];
  }

  if (normalized.startsWith('go ')) {
    const target = readTail(normalized, 'go ');
    return target ? { type: 'go', target } : { type: 'unknown', raw: rawInput };
  }

  if (normalized.startsWith('move ')) {
    const target = readTail(normalized, 'move ');
    return target ? { type: 'go', target } : { type: 'unknown', raw: rawInput };
  }

  if (normalized.startsWith('talk ')) {
    const target = readTail(normalized, 'talk ');
    return target ? { type: 'talk', target } : { type: 'unknown', raw: rawInput };
  }

  if (normalized.startsWith('speak ')) {
    const target = readTail(normalized, 'speak ');
    return target ? { type: 'talk', target } : { type: 'unknown', raw: rawInput };
  }

  if (normalized.startsWith('take ')) {
    const target = readTail(normalized, 'take ');
    return target ? { type: 'take', target } : { type: 'unknown', raw: rawInput };
  }

  if (normalized.startsWith('get ')) {
    const target = readTail(normalized, 'get ');
    return target ? { type: 'take', target } : { type: 'unknown', raw: rawInput };
  }

  if (normalized.startsWith('use ')) {
    const target = readTail(normalized, 'use ');
    return target ? { type: 'use', target } : { type: 'unknown', raw: rawInput };
  }

  return { type: 'unknown', raw: rawInput };
}

export function commandNeedsRoll(intent: CommandIntent): boolean {
  if (intent.type === 'ritual') {
    return true;
  }

  if (intent.type === 'use') {
    return ['xbox 720', 'xbox-720', 'analog nomad sigil', 'maldon salt', 'salt-flash strobe token'].some((needle) =>
      intent.target.includes(needle)
    );
  }

  return false;
}

export interface RuleBasedNluResult {
  command: string;
  intent: CommandIntent;
  inferred: boolean;
  reason?: string;
}

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findMatchFromMap(input: string, map: Record<string, string>): string | null {
  for (const [alias, value] of Object.entries(map)) {
    if (input.includes(alias)) {
      return value;
    }
  }
  return null;
}

const LOCATION_ALIAS_MAP: Record<string, string> = Object.values(LOCATION_DEFINITIONS).reduce<Record<string, string>>(
  (acc, location) => {
    acc[location.id.toLowerCase().replace(/-/g, ' ')] = location.name;
    acc[location.name.toLowerCase()] = location.name;
    for (const alias of location.aliases) {
      acc[alias.toLowerCase()] = location.name;
    }
    return acc;
  },
  {}
);

const NPC_ALIAS_MAP: Record<string, string> = Object.values(NPC_DEFINITIONS).reduce<Record<string, string>>(
  (acc, npc) => {
    acc[npc.id.toLowerCase().replace(/-/g, ' ')] = npc.name;
    acc[npc.name.toLowerCase()] = npc.name;
    const firstName = npc.name.split(' ')[0]?.toLowerCase();
    if (firstName) {
      acc[firstName] = npc.name;
    }
    return acc;
  },
  {}
);

const ITEM_ALIAS_MAP: Record<string, string> = Object.values(ITEM_DEFINITIONS).reduce<Record<string, string>>(
  (acc, item) => {
    acc[item.id.toLowerCase().replace(/-/g, ' ')] = item.name;
    acc[item.name.toLowerCase()] = item.name;
    for (const token of item.name.toLowerCase().split(' ')) {
      if (token.length >= 4) {
        acc[token] = item.name;
      }
    }
    return acc;
  },
  {}
);

export function interpretNaturalCommand(rawInput: string): RuleBasedNluResult {
  const direct = parseCommand(rawInput);
  if (direct.type !== 'unknown') {
    return {
      command: rawInput,
      intent: direct,
      inferred: false
    };
  }

  const normalized = normalize(rawInput);
  if (!normalized) {
    return {
      command: rawInput,
      intent: direct,
      inferred: false
    };
  }

  if (/(where am i|look around|scan( the)? area|inspect room|what is here|describe)/.test(normalized)) {
    const intent = parseCommand('look');
    return { command: 'look', intent, inferred: true, reason: 'scene-inspection pattern' };
  }

  if (/(what do i have|show (my )?(bag|items)|pockets|inventory)/.test(normalized)) {
    const intent = parseCommand('inventory');
    return { command: 'inventory', intent, inferred: true, reason: 'inventory pattern' };
  }

  if (/(how am i|health|hp|conditions|status)/.test(normalized)) {
    const intent = parseCommand('status');
    return { command: 'status', intent, inferred: true, reason: 'status pattern' };
  }

  if (/(help|what can i do|commands|options)/.test(normalized)) {
    const intent = parseCommand('help');
    return { command: 'help', intent, inferred: true, reason: 'help pattern' };
  }

  if (/(undo|go back|revert)/.test(normalized)) {
    const intent = parseCommand('undo');
    return { command: 'undo', intent, inferred: true, reason: 'undo pattern' };
  }

  if ((normalized.includes('sniff') && normalized.includes('bread')) || normalized.includes('brioche')) {
    const intent = parseCommand('sniff bread');
    return { command: 'sniff bread', intent, inferred: true, reason: 'bread ritual pattern' };
  }

  if (normalized.includes('salt') && (normalized.includes('flash') || normalized.includes('strobe') || normalized.includes('scan'))) {
    const intent = parseCommand('salt-flash');
    return { command: 'salt-flash', intent, inferred: true, reason: 'salt ritual pattern' };
  }

  if (normalized.includes('wordle') || normalized.includes('five letter') || normalized.includes('queue puzzle')) {
    const intent = parseCommand('wordle');
    return { command: 'wordle', intent, inferred: true, reason: 'wordle ritual pattern' };
  }

  if (normalized.includes('pray') || normalized.includes('prayer')) {
    const intent = parseCommand('pray');
    return { command: 'pray', intent, inferred: true, reason: 'prayer ritual pattern' };
  }

  if ((normalized.includes('file') && normalized.includes('form')) || normalized.includes('paperwork')) {
    const intent = parseCommand('file form');
    return { command: 'file form', intent, inferred: true, reason: 'form ritual pattern' };
  }

  if (normalized.includes('hum') && (normalized.includes('b-flat') || normalized.includes('b flat') || normalized.includes('bflat'))) {
    const intent = parseCommand('hum b-flat');
    return { command: 'hum b-flat', intent, inferred: true, reason: 'hum ritual pattern' };
  }

  if (/(talk|speak|chat|ask|meet)/.test(normalized)) {
    const npc = findMatchFromMap(normalized, NPC_ALIAS_MAP);
    if (npc) {
      const command = `talk ${npc}`;
      return { command, intent: parseCommand(command), inferred: true, reason: 'npc conversational mapping' };
    }
  }

  if (/(go|move|head|travel|walk|enter)/.test(normalized)) {
    const location = findMatchFromMap(normalized, LOCATION_ALIAS_MAP);
    if (location) {
      const command = `go ${location}`;
      return { command, intent: parseCommand(command), inferred: true, reason: 'location movement mapping' };
    }
  }

  if (/(take|get|grab|pick up|collect)/.test(normalized)) {
    const item = findMatchFromMap(normalized, ITEM_ALIAS_MAP);
    if (item) {
      const command = `take ${item}`;
      return { command, intent: parseCommand(command), inferred: true, reason: 'item-take mapping' };
    }
  }

  if (/(use|activate|apply|trigger|consume|drink)/.test(normalized)) {
    const item = findMatchFromMap(normalized, ITEM_ALIAS_MAP);
    if (item) {
      const command = `use ${item}`;
      return { command, intent: parseCommand(command), inferred: true, reason: 'item-use mapping' };
    }
  }

  return {
    command: rawInput,
    intent: direct,
    inferred: false
  };
}
