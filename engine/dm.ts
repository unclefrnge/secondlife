import { ITEM_DEFINITIONS } from '@/data/items';
import { LOCATION_DEFINITIONS } from '@/data/locations';
import { NPC_DEFINITIONS } from '@/data/npcs';
import type { ChamberMode, ChamberSave, LocationDefinition, RollCheck } from '@/engine/types';

function readTakenItems(save: ChamberSave): Record<string, boolean> {
  const value = save.world.questFlags.takenItems;
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as Record<string, boolean>;
}

export function formatRoll(check: RollCheck): string {
  return `ROLL: ${check.roll} + ${check.stat}(${check.statValue}) = ${check.total} vs DC ${check.dc} -> ${
    check.success ? 'SUCCESS' : 'FAIL'
  }`;
}

export function buildHelpMessage(mode: ChamberMode): string {
  const base = [
    'Core commands: look, go [place], talk [npc], take [item], use [item], inventory, status, help',
    'Ritual commands: sniff bread, salt-flash, wordle, pray, file form, hum b-flat',
    'Utility: undo (one step), new game/reset via top controls'
  ];

  if (mode === 'guided') {
    base.push('Guided mode: follow command chips and complete one track to unlock Appendix.');
  }

  if (mode === 'free') {
    base.push('Free roam: no rails. Explore first, then stabilize one crisis line.');
  }

  if (mode === 'hardcore') {
    base.push('Hardcore: sparse hints, higher DCs, conditions stack faster.');
  }

  return base.join('\n');
}

export function buildStatusMessage(save: ChamberSave): string {
  const location = LOCATION_DEFINITIONS[save.world.locationId];
  const conditions = save.player.conditions.length ? save.player.conditions.join(', ') : 'none';
  return [
    `${save.player.name} // ${save.player.archetype}`,
    `Location: ${location ? location.name : save.world.locationId}`,
    `HP: ${save.player.hp}/10`,
    `Conditions: ${conditions}`,
    `Stats -> Distortion ${save.player.stats.distortion} | Viscosity ${save.player.stats.viscosity} | Bureaucracy ${save.player.stats.bureaucracy}`
  ].join('\n');
}

export function buildInventoryMessage(save: ChamberSave): string {
  if (!save.world.inventory.length) {
    return 'Inventory: empty. You are either pure or underprepared.';
  }

  const lines = save.world.inventory.map((item) => {
    const label = item.qty > 1 ? `${item.name} x${item.qty}` : item.name;
    return `- ${label}`;
  });

  return ['Inventory ledger:', ...lines].join('\n');
}

export function buildLocationMessage(save: ChamberSave, mode: ChamberMode): string {
  const location = LOCATION_DEFINITIONS[save.world.locationId];
  if (!location) {
    return 'Location index corrupted. Try `status` or restart the run.';
  }

  return buildLocationLook(location, save, mode);
}

export function buildLocationLook(location: LocationDefinition, save: ChamberSave, mode: ChamberMode): string {
  const exits = location.exits
    .map((exitId) => LOCATION_DEFINITIONS[exitId])
    .filter(Boolean)
    .map((entry) => entry.name)
    .join(' | ');

  const taken = readTakenItems(save);
  const localItems = location.itemIds
    .filter((itemId) => !taken[itemId])
    .map((itemId) => ITEM_DEFINITIONS[itemId]?.name)
    .filter((item): item is string => Boolean(item));

  const localNpcs = location.npcIds
    .map((npcId) => NPC_DEFINITIONS[npcId]?.name)
    .filter((npc): npc is string => Boolean(npc));

  const lines = [
    `${location.name}`,
    location.description,
    `Exits: ${exits || 'none'}`,
    `NPCs: ${localNpcs.length ? localNpcs.join(', ') : 'none visible'}`,
    `Items: ${localItems.length ? localItems.join(', ') : 'none obvious'}`
  ];

  if (mode === 'guided') {
    lines.push('Guided tip: talk first, then run one ritual command before moving.');
  }

  if (mode === 'hardcore') {
    lines.push('Hardcore note: no safety rails. Every clean choice has a cost.');
  }

  return lines.join('\n');
}
