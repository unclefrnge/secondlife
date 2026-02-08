import { ITEM_DEFINITIONS } from '@/data/items';
import { LOCATION_DEFINITIONS, START_LOCATION_ID, getLocationByTarget } from '@/data/locations';
import { NPC_DEFINITIONS, getNpcByName } from '@/data/npcs';
import { TRACK_DEFINITIONS } from '@/data/tracks';
import { buildHelpMessage, buildInventoryMessage, buildLocationLook, buildLocationMessage, buildStatusMessage, formatRoll } from '@/engine/dm';
import type {
  ChamberMode,
  ChamberSave,
  CharacterBlueprint,
  CodexDiscoveries,
  CommandIntent,
  InventoryItem,
  ItemDefinition,
  LocationDefinition,
  LogMessage,
  RollCheck,
  StatKey,
  TrackId,
  TurnInput,
  TurnResult
} from '@/engine/types';

const MAX_HP = 10;

const RITUAL_LAWS: Record<string, string> = {
  'sniff-bread': 'Bread-sniff rite',
  'salt-flash': 'Salt-flash test',
  wordle: 'Queue Wordle Protocol',
  pray: 'Communal Prayer b2b duel',
  'file-form': 'Silence is a Crime',
  'hum-b-flat': 'Distortion >= Devotion'
};

interface RollSpec {
  stat: StatKey;
  baseDc: number;
  label: string;
}

interface RuntimeState {
  openedTracks: string[];
  completedTracks: string[];
  appendixUnlocked: boolean;
  roll?: RollCheck;
}

function cloneSave(save: ChamberSave): ChamberSave {
  return JSON.parse(JSON.stringify(save)) as ChamberSave;
}

function uniquePush(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}

function normalizeKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildLogMessage(role: LogMessage['role'], text: string, now: number): LogMessage {
  return {
    id: `${now}-${role}-${Math.random().toString(16).slice(2, 8)}`,
    ts: now,
    role,
    text
  };
}

function pushMessage(save: ChamberSave, role: LogMessage['role'], text: string, now: number): void {
  if (!text.trim()) {
    return;
  }

  save.log.messages.push(buildLogMessage(role, text, now));
  if (save.log.messages.length > 500) {
    save.log.messages = save.log.messages.slice(-500);
  }
}

function readQuestFlags(save: ChamberSave): Record<string, unknown> {
  if (!save.world.questFlags || typeof save.world.questFlags !== 'object') {
    save.world.questFlags = {};
  }
  return save.world.questFlags as Record<string, unknown>;
}

function readTakenItems(save: ChamberSave): Record<string, boolean> {
  const flags = readQuestFlags(save);
  if (!flags.takenItems || typeof flags.takenItems !== 'object') {
    flags.takenItems = {};
  }
  return flags.takenItems as Record<string, boolean>;
}

function readCodex(save: ChamberSave): CodexDiscoveries {
  const flags = readQuestFlags(save);
  if (!flags.codex || typeof flags.codex !== 'object') {
    flags.codex = {
      locations: [],
      npcs: [],
      items: [],
      laws: []
    };
  }

  const codex = flags.codex as Partial<CodexDiscoveries>;
  return {
    locations: Array.isArray(codex.locations) ? codex.locations : [],
    npcs: Array.isArray(codex.npcs) ? codex.npcs : [],
    items: Array.isArray(codex.items) ? codex.items : [],
    laws: Array.isArray(codex.laws) ? codex.laws : []
  };
}

function writeCodex(save: ChamberSave, codex: CodexDiscoveries): void {
  const flags = readQuestFlags(save);
  flags.codex = codex;
}

function discoverLocation(save: ChamberSave, location: LocationDefinition): void {
  const codex = readCodex(save);
  codex.locations = uniquePush(codex.locations, location.name);
  writeCodex(save, codex);
}

function discoverNpc(save: ChamberSave, npcName: string): void {
  const codex = readCodex(save);
  codex.npcs = uniquePush(codex.npcs, npcName);
  writeCodex(save, codex);
}

function discoverItem(save: ChamberSave, itemName: string): void {
  const codex = readCodex(save);
  codex.items = uniquePush(codex.items, itemName);
  writeCodex(save, codex);
}

function discoverLaw(save: ChamberSave, lawLabel: string): void {
  const codex = readCodex(save);
  codex.laws = uniquePush(codex.laws, lawLabel);
  writeCodex(save, codex);
}

function addCondition(save: ChamberSave, condition: string): void {
  if (!save.player.conditions.includes(condition)) {
    save.player.conditions.push(condition);
  }
}

function removeCondition(save: ChamberSave, condition: string): void {
  save.player.conditions = save.player.conditions.filter((entry) => entry !== condition);
}

function applyFailureDamage(save: ChamberSave): void {
  save.player.hp = Math.max(1, save.player.hp - 1);
}

function heal(save: ChamberSave, amount: number): void {
  save.player.hp = Math.min(MAX_HP, save.player.hp + amount);
}

function getStat(save: ChamberSave, stat: StatKey): number {
  return save.player.stats[stat];
}

function adjustDc(baseDc: number, mode: ChamberMode): number {
  if (mode === 'guided') {
    return Math.max(5, baseDc - 1);
  }
  if (mode === 'hardcore') {
    return Math.min(9, baseDc + 1);
  }
  return baseDc;
}

function performRoll(save: ChamberSave, mode: ChamberMode, rollValue: number | undefined, spec: RollSpec): RollCheck {
  const statValue = getStat(save, spec.stat);
  const roll = Math.min(6, Math.max(1, rollValue ?? 1));
  const dc = adjustDc(spec.baseDc, mode);
  const total = roll + statValue;

  return {
    label: spec.label,
    stat: spec.stat,
    roll,
    statValue,
    total,
    dc,
    success: total >= dc
  };
}

function setNpcFlag(save: ChamberSave, npcId: string, key: string, value: unknown): void {
  const existing = save.world.npcFlags[npcId];
  const bag = existing && typeof existing === 'object' ? (existing as Record<string, unknown>) : {};
  bag[key] = value;
  save.world.npcFlags[npcId] = bag;
}

function getQuestBool(save: ChamberSave, key: string): boolean {
  const flags = readQuestFlags(save);
  return Boolean(flags[key]);
}

function setQuestFlag(save: ChamberSave, key: string, value: unknown): void {
  const flags = readQuestFlags(save);
  flags[key] = value;
}

function readContamination(save: ChamberSave): number {
  const flags = readQuestFlags(save);
  const value = flags.midTechHouseContamination;
  return typeof value === 'number' ? value : 0;
}

function writeContamination(save: ChamberSave, value: number): void {
  const next = Math.min(6, Math.max(0, value));
  setQuestFlag(save, 'midTechHouseContamination', next);
  if (next >= 3) {
    addCondition(save, 'tech-house-contamination');
  }
  if (next < 3) {
    removeCondition(save, 'tech-house-contamination');
  }
}

function addInventory(save: ChamberSave, definition: ItemDefinition, qty = 1): void {
  const existing = save.world.inventory.find((item) => item.id === definition.id);
  if (existing) {
    existing.qty += qty;
    return;
  }

  const entry: InventoryItem = {
    id: definition.id,
    name: definition.name,
    qty,
    tags: definition.tags
  };
  save.world.inventory.push(entry);
}

function removeInventory(save: ChamberSave, itemId: string, qty = 1): void {
  const target = save.world.inventory.find((item) => item.id === itemId);
  if (!target) {
    return;
  }

  target.qty -= qty;
  if (target.qty <= 0) {
    save.world.inventory = save.world.inventory.filter((item) => item.id !== itemId);
  }
}

function findInventoryItemByTarget(save: ChamberSave, target: string): InventoryItem | null {
  const normalized = normalizeKey(target);
  return (
    save.world.inventory.find((item) => {
      return item.id === normalized || normalizeKey(item.name) === normalized || normalizeKey(item.name).includes(normalized);
    }) ?? null
  );
}

function findVisibleItemByTarget(location: LocationDefinition, save: ChamberSave, target: string): ItemDefinition | null {
  const taken = readTakenItems(save);
  const normalized = normalizeKey(target);

  for (const itemId of location.itemIds) {
    if (taken[itemId]) {
      continue;
    }

    const definition = ITEM_DEFINITIONS[itemId];
    if (!definition) {
      continue;
    }

    if (
      definition.id === normalized ||
      normalizeKey(definition.name) === normalized ||
      normalizeKey(definition.name).includes(normalized)
    ) {
      return definition;
    }
  }

  return null;
}

function markItemTaken(save: ChamberSave, itemId: string): void {
  const taken = readTakenItems(save);
  taken[itemId] = true;
}

function openTrack(runtime: RuntimeState, trackId: TrackId, save: ChamberSave, now: number): void {
  if (!runtime.openedTracks.includes(trackId)) {
    runtime.openedTracks = [...runtime.openedTracks, trackId];
    const track = TRACK_DEFINITIONS.find((entry) => entry.id === trackId);
    pushMessage(save, 'system', `TRACK OPENED: ${track?.title ?? trackId}`, now);
  }
}

function completeTrack(runtime: RuntimeState, trackId: TrackId, save: ChamberSave, now: number): void {
  openTrack(runtime, trackId, save, now);
  if (!runtime.completedTracks.includes(trackId)) {
    runtime.completedTracks = [...runtime.completedTracks, trackId];
    const track = TRACK_DEFINITIONS.find((entry) => entry.id === trackId);
    pushMessage(save, 'system', `TRACK COMPLETED: ${track?.title ?? trackId}`, now);
  }
}

function applyRiskOutcome(
  save: ChamberSave,
  runtime: RuntimeState,
  check: RollCheck,
  now: number,
  successText: string,
  failureText: string,
  failureCondition: string,
  onSuccess?: () => void,
  onFailure?: () => void
): void {
  runtime.roll = check;
  pushMessage(save, 'system', formatRoll(check), now);

  if (check.success) {
    pushMessage(save, 'dm', successText, now);
    onSuccess?.();
    return;
  }

  addCondition(save, failureCondition);
  applyFailureDamage(save);
  pushMessage(save, 'dm', failureText, now);
  onFailure?.();
}

function touchTrackByLocation(save: ChamberSave, runtime: RuntimeState, locationId: string, now: number): void {
  if (locationId === 'gogo-grocer') {
    openTrack(runtime, 'track-analog-nomad-sigil-containment', save, now);
  }
  if (locationId === 'festive-board') {
    openTrack(runtime, 'track-brioche-contraband-sweep', save, now);
  }
  if (locationId === 'home-affairs-outpost') {
    openTrack(runtime, 'track-home-affairs-queue-trap-escape', save, now);
  }
}

function resolveRitual(
  save: ChamberSave,
  runtime: RuntimeState,
  ritual: string,
  mode: ChamberMode,
  rollValue: number | undefined,
  now: number
): void {
  const location = LOCATION_DEFINITIONS[save.world.locationId];
  if (!location) {
    pushMessage(save, 'dm', 'Ritual failed to mount. Location index missing.', now);
    return;
  }

  const law = RITUAL_LAWS[ritual];
  if (law) {
    discoverLaw(save, law);
  }

  if (ritual === 'sniff-bread') {
    openTrack(runtime, 'track-brioche-contraband-sweep', save, now);
    const check = performRoll(save, mode, rollValue, {
      stat: 'viscosity',
      baseDc: location.id === 'festive-board' ? 6 : 8,
      label: 'Bread-sniff compliance'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'Your nose catches the softness profile. Contraband brioche confirms itself in the steam.',
      'The loaf reads you first. A Softness Citation lands on your file.',
      'softness-citation',
      () => {
        setQuestFlag(save, 'trackA_sniff_passed', true);
        if (location.id === 'festive-board') {
          setQuestFlag(save, 'trackA_location_confirmed', true);
        }

        if (getQuestBool(save, 'trackA_briefed') && getQuestBool(save, 'trackA_sniff_passed')) {
          completeTrack(runtime, 'track-brioche-contraband-sweep', save, now);
        }
      }
    );
    return;
  }

  if (ritual === 'salt-flash') {
    const check = performRoll(save, mode, rollValue, {
      stat: 'distortion',
      baseDc: location.id === 'gogo-grocer' ? 6 : 7,
      label: 'Salt-flash strobe sweep'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'The flash reveals hidden seams in the room. Contraband lines become obvious.',
      'The strobe desyncs and your vision loops. Queue echoes follow you.',
      'loop-syndrome',
      () => {
        if (location.id === 'gogo-grocer') {
          openTrack(runtime, 'track-analog-nomad-sigil-containment', save, now);
          setQuestFlag(save, 'trackB_sigil_revealed', true);
        }
      },
      () => {
        writeContamination(save, readContamination(save) + 1);
      }
    );
    return;
  }

  if (ritual === 'wordle') {
    openTrack(runtime, 'track-home-affairs-queue-trap-escape', save, now);
    const check = performRoll(save, mode, rollValue, {
      stat: 'bureaucracy',
      baseDc: location.id === 'home-affairs-outpost' ? 6 : 8,
      label: 'Queue Wordle challenge'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'Five letters click into place. The queue stutters and exposes an exit packet.',
      'Wrong word. The terminal prints your number again and again.',
      'queue-trap',
      () => setQuestFlag(save, 'trackC_wordle_passed', true)
    );
    return;
  }

  if (ritual === 'pray') {
    const check = performRoll(save, mode, rollValue, {
      stat: 'distortion',
      baseDc: location.id === 'chmbr-bar' ? 6 : 7,
      label: 'Communal Prayer b2b'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'The room locks in time. One condition peels off your file.',
      'Your prayer arrives on the wrong bus route. The hi-hats get closer.',
      'tech-house-contamination',
      () => {
        const firstCondition = save.player.conditions[0];
        if (firstCondition) {
          removeCondition(save, firstCondition);
        }
        heal(save, 1);
      },
      () => writeContamination(save, readContamination(save) + 1)
    );
    return;
  }

  if (ritual === 'file-form') {
    openTrack(runtime, 'track-home-affairs-queue-trap-escape', save, now);
    const check = performRoll(save, mode, rollValue, {
      stat: 'bureaucracy',
      baseDc: location.id === 'home-affairs-outpost' ? 7 : 9,
      label: 'Form filing audit'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'Form accepted. A bureaucratic lock disengages with resentful dignity.',
      'Form rejected: signature too clean. You are recirculated to the back.',
      'queue-trap',
      () => {
        setQuestFlag(save, 'trackC_form_filed', true);
        if (getQuestBool(save, 'trackC_wordle_passed')) {
          completeTrack(runtime, 'track-home-affairs-queue-trap-escape', save, now);
        }
      }
    );
    return;
  }

  if (ritual === 'hum-b-flat') {
    const check = performRoll(save, mode, rollValue, {
      stat: 'viscosity',
      baseDc: 5,
      label: 'B-flat stabilization'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'The pipe belt settles. Mid Tech House contamination recedes by one grade.',
      'You miss the note. The contamination rhythm syncs to your pulse.',
      'loop-syndrome',
      () => {
        writeContamination(save, readContamination(save) - 1);
      },
      () => writeContamination(save, readContamination(save) + 1)
    );
  }
}

function resolveUseItem(
  save: ChamberSave,
  runtime: RuntimeState,
  target: string,
  mode: ChamberMode,
  rollValue: number | undefined,
  now: number
): void {
  const location = LOCATION_DEFINITIONS[save.world.locationId];
  const item = findInventoryItemByTarget(save, target);
  if (!item || !location) {
    pushMessage(save, 'dm', 'You pat your pockets. That item is not currently available.', now);
    return;
  }

  if (item.id === 'kombucha-vial') {
    heal(save, 2);
    removeInventory(save, item.id, 1);
    pushMessage(save, 'dm', 'You down a kombucha vial. HP +2. Reality tastes fermented but stable.', now);
    return;
  }

  if (item.id === 'maldon-salt-pinch') {
    openTrack(runtime, 'track-analog-nomad-sigil-containment', save, now);
    const check = performRoll(save, mode, rollValue, {
      stat: 'distortion',
      baseDc: location.id === 'gogo-grocer' ? 7 : 8,
      label: 'Sigil containment with Maldon salt'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'Salt lattice locks around the sigil. White noise collapses into silence without felony.',
      'Salt pattern fractures. The sigil breathes deeper and brands your queue record.',
      'loop-syndrome',
      () => {
        if (location.id === 'gogo-grocer') {
          setQuestFlag(save, 'trackB_contained', true);
          completeTrack(runtime, 'track-analog-nomad-sigil-containment', save, now);
        }
      },
      () => writeContamination(save, readContamination(save) + 1)
    );
    return;
  }

  if (item.id === 'xbox-720') {
    const check = performRoll(save, mode, rollValue, {
      stat: 'distortion',
      baseDc: 8,
      label: 'Xbox 720 drone resistance'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'You cage the drone loop in a compliance crate. The device stops self-replicating for now.',
      'The console boots itself and invites fourteen drones to your location.',
      'tech-house-contamination',
      () => writeContamination(save, readContamination(save) + 1),
      () => writeContamination(save, readContamination(save) + 2)
    );
    return;
  }

  if (item.id === 'low-fat-exposure-can') {
    setQuestFlag(save, 'bureaucracy_boost', true);
    removeInventory(save, item.id, 1);
    pushMessage(save, 'dm', 'You crack the can. Your paperwork confidence rises for the next risky filing.', now);
    return;
  }

  if (item.id === 'salt-flash-strobe-token') {
    const check = performRoll(save, mode, rollValue, {
      stat: 'bureaucracy',
      baseDc: 6,
      label: 'Authorized strobe deployment'
    });

    applyRiskOutcome(
      save,
      runtime,
      check,
      now,
      'Strobe sweep approved. Contraband contours become obvious.',
      'Deployment denied. Lighting board cites procedural chaos.',
      'queue-trap'
    );
    return;
  }

  pushMessage(save, 'dm', `${item.name} hums politely but does not resolve anything yet.`, now);
}

function resolveTalk(save: ChamberSave, runtime: RuntimeState, target: string, mode: ChamberMode, now: number): void {
  const location = LOCATION_DEFINITIONS[save.world.locationId];
  const npc = getNpcByName(target);

  if (!location || !npc || npc.locationId !== location.id) {
    pushMessage(save, 'dm', 'No response. Either wrong room, wrong title, or wrong century.', now);
    return;
  }

  const currentMeta = save.world.npcFlags[npc.id];
  const visitCount =
    currentMeta && typeof currentMeta === 'object' && typeof (currentMeta as Record<string, unknown>).visitCount === 'number'
      ? ((currentMeta as Record<string, unknown>).visitCount as number)
      : 0;

  const isFirst = visitCount === 0;
  setNpcFlag(save, npc.id, 'visitCount', visitCount + 1);
  discoverNpc(save, npc.name);

  const message = isFirst ? npc.lines.intro : npc.lines.repeat;
  pushMessage(save, 'dm', message, now);

  if (mode === 'guided' && npc.lines.clue) {
    pushMessage(save, 'system', `Hint: ${npc.lines.clue}`, now);
  }

  if (npc.id === 'sister-crumb') {
    setQuestFlag(save, 'trackA_briefed', true);
    openTrack(runtime, 'track-brioche-contraband-sweep', save, now);
  }

  if (npc.id === 'adriaan-willemse') {
    openTrack(runtime, 'track-analog-nomad-sigil-containment', save, now);
  }

  if (npc.id === 'ghost-of-the-chamber' || npc.id === 'clockkeeper-luma') {
    openTrack(runtime, 'track-home-affairs-queue-trap-escape', save, now);
  }
}

function resolveTake(save: ChamberSave, runtime: RuntimeState, target: string, now: number): void {
  const location = LOCATION_DEFINITIONS[save.world.locationId];
  if (!location) {
    pushMessage(save, 'dm', 'Cannot take from unknown location.', now);
    return;
  }

  const item = findVisibleItemByTarget(location, save, target);
  if (!item) {
    pushMessage(save, 'dm', 'Nothing matching that is visible here.', now);
    return;
  }

  addInventory(save, item, 1);
  markItemTaken(save, item.id);
  discoverItem(save, item.name);

  pushMessage(save, 'dm', `Taken: ${item.name}.`, now);

  if (item.id === 'analog-nomad-sigil') {
    openTrack(runtime, 'track-analog-nomad-sigil-containment', save, now);
  }
  if (item.id === 'sasko-qr-slice') {
    openTrack(runtime, 'track-brioche-contraband-sweep', save, now);
  }
  if (item.id === 'queue-ticket-43') {
    openTrack(runtime, 'track-home-affairs-queue-trap-escape', save, now);
  }
  if (item.id === 'xbox-720') {
    writeContamination(save, readContamination(save) + 1);
  }
}

function resolveMove(save: ChamberSave, runtime: RuntimeState, target: string, mode: ChamberMode, now: number): void {
  const current = LOCATION_DEFINITIONS[save.world.locationId];
  const next = getLocationByTarget(target);

  if (!current || !next) {
    pushMessage(save, 'dm', 'Route not found. Try an exact place name.', now);
    return;
  }

  if (!current.exits.includes(next.id)) {
    pushMessage(save, 'dm', `No direct path from ${current.name} to ${next.name}.`, now);
    return;
  }

  save.world.locationId = next.id;
  save.world.visited[next.id] = true;
  discoverLocation(save, next);
  touchTrackByLocation(save, runtime, next.id, now);

  if (next.id === 'market-of-whispers') {
    writeContamination(save, readContamination(save) + 1);
  }

  if (next.id === 'belt-kombucha-pipes' && readContamination(save) > 0) {
    pushMessage(save, 'system', 'Pipe mist responds to contamination and repeats your footsteps.', now);
  }

  pushMessage(save, 'dm', buildLocationLook(next, save, mode), now);
}

function resolveUnknown(save: ChamberSave, raw: string, now: number): void {
  pushMessage(save, 'dm', `Unknown command: ${raw || '<empty>'}. Try \`help\` for valid syntax.`, now);
}

function runIntent(input: TurnInput, save: ChamberSave, runtime: RuntimeState): void {
  const { intent, mode, now, rollValue } = input;

  if (intent.type === 'look') {
    const location = LOCATION_DEFINITIONS[save.world.locationId];
    if (location) {
      discoverLocation(save, location);
      touchTrackByLocation(save, runtime, location.id, now);
    }
    pushMessage(save, 'dm', buildLocationMessage(save, mode), now);
    return;
  }

  if (intent.type === 'go') {
    resolveMove(save, runtime, intent.target, mode, now);
    return;
  }

  if (intent.type === 'talk') {
    resolveTalk(save, runtime, intent.target, mode, now);
    return;
  }

  if (intent.type === 'take') {
    resolveTake(save, runtime, intent.target, now);
    return;
  }

  if (intent.type === 'use') {
    resolveUseItem(save, runtime, intent.target, mode, rollValue, now);
    return;
  }

  if (intent.type === 'inventory') {
    pushMessage(save, 'dm', buildInventoryMessage(save), now);
    return;
  }

  if (intent.type === 'status') {
    pushMessage(save, 'dm', buildStatusMessage(save), now);
    return;
  }

  if (intent.type === 'help') {
    pushMessage(save, 'dm', buildHelpMessage(mode), now);
    return;
  }

  if (intent.type === 'ritual') {
    resolveRitual(save, runtime, intent.ritual, mode, rollValue, now);
    return;
  }

  if (intent.type === 'unknown') {
    resolveUnknown(save, intent.raw, now);
  }
}

export function createNewSave(blueprint: CharacterBlueprint, now = Date.now()): ChamberSave {
  const starter = ITEM_DEFINITIONS[blueprint.starterItemId] ?? ITEM_DEFINITIONS['maldon-salt-pinch'];

  const save: ChamberSave = {
    version: 1,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    player: {
      name: blueprint.name.trim() || 'Unknown Resident',
      archetype: blueprint.archetype,
      stats: {
        distortion: blueprint.stats.distortion,
        viscosity: blueprint.stats.viscosity,
        bureaucracy: blueprint.stats.bureaucracy
      },
      hp: MAX_HP,
      conditions: []
    },
    world: {
      locationId: START_LOCATION_ID,
      visited: {
        [START_LOCATION_ID]: true
      },
      npcFlags: {},
      questFlags: {
        takenItems: {},
        codex: {
          locations: [LOCATION_DEFINITIONS[START_LOCATION_ID].name],
          npcs: [],
          items: [starter.name],
          laws: []
        },
        midTechHouseContamination: 0
      },
      inventory: [
        {
          id: starter.id,
          name: starter.name,
          qty: 1,
          tags: starter.tags
        }
      ]
    },
    log: {
      messages: []
    }
  };

  pushMessage(
    save,
    'dm',
    'Chamber Text Quest booted. Type `help` to see syntax or start with `look`.',
    now
  );
  pushMessage(save, 'system', buildLocationMessage(save, 'guided'), now);

  return save;
}

export function resolveTurn(input: TurnInput): TurnResult {
  const save = cloneSave(input.save);
  const runtime: RuntimeState = {
    openedTracks: [...input.openedTracks],
    completedTracks: [...input.completedTracks],
    appendixUnlocked: input.appendixUnlocked,
    roll: undefined
  };

  pushMessage(save, 'player', input.rawCommand, input.now);

  runIntent(input, save, runtime);

  const contamination = readContamination(save);
  if (contamination >= 4) {
    pushMessage(save, 'system', 'Threat: Mid Tech House contamination is escalating. Consider `hum b-flat`.', input.now);
  }

  if (runtime.completedTracks.length > 0) {
    runtime.appendixUnlocked = true;
  }

  save.updatedAt = new Date(input.now).toISOString();

  return {
    save,
    openedTracks: runtime.openedTracks,
    completedTracks: runtime.completedTracks,
    appendixUnlocked: runtime.appendixUnlocked,
    roll: runtime.roll
  };
}

export function listTrackSummaries(): { id: string; title: string; summary: string }[] {
  return TRACK_DEFINITIONS.map((track) => ({
    id: track.id,
    title: track.title,
    summary: track.summary
  }));
}
