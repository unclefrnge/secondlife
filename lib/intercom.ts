// Authored fiction. Content may grow without changing this visitor-state schema.
export const INTERCOM_KEY = 'chamber_world_v1';
export const GATE_ENCOUNTER = 'gate-spare-key-01';
export const HANDOVER_FILE = 'gate-handover';
export const REPLY_DELAY = 4_500;
export const FOLLOW_UP_DELAY = 20_000;

export type ReplyChoice = 'which-key' | 'check-folder';
export type ClosingChoice = 'bring-usb' | 'leave-with-sam';
export type IntercomStage = 'unanswered' | 'waiting' | 'delivered' | 'follow-up' | 'closed';

export interface GateProgress {
  choice?: ReplyChoice;
  repliedAt?: number;
  deliveryAt?: number;
  openedAt?: number;
  closingChoice?: ClosingChoice;
  closedAt?: number;
}

export interface WorldSave {
  version: 1;
  encounters: Record<string, unknown>;
  [key: string]: unknown;
}

export function emptyWorld(): WorldSave {
  return { version: 1, encounters: {} };
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function readWorld(raw: string | null): { save: WorldSave; writable: boolean } {
  if (raw === null) return { save: emptyWorld(), writable: true };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.encounters)) throw new Error('Unsupported save');
    const gate = value.encounters[GATE_ENCOUNTER];
    if (gate !== undefined) {
      if (!isRecord(gate)) throw new Error('Invalid encounter');
      if (gate.choice !== undefined && gate.choice !== 'which-key' && gate.choice !== 'check-folder') throw new Error('Unknown reply');
      if (gate.closingChoice !== undefined && gate.closingChoice !== 'bring-usb' && gate.closingChoice !== 'leave-with-sam') throw new Error('Unknown closing reply');
      for (const key of ['repliedAt', 'deliveryAt', 'openedAt', 'closedAt']) {
        if (gate[key] !== undefined && (typeof gate[key] !== 'number' || !Number.isFinite(gate[key]) || (gate[key] as number) < 0)) throw new Error('Invalid time');
      }
      if (gate.choice && (gate.repliedAt === undefined || gate.deliveryAt === undefined)) throw new Error('Incomplete reply');
      if (gate.openedAt !== undefined && !gate.choice) throw new Error('Unsent attachment');
      if (gate.closingChoice && (gate.openedAt === undefined || gate.closedAt === undefined)) throw new Error('Incomplete closing reply');
    }
    // Keep unknown encounters and metadata for future content versions.
    return { save: value as WorldSave, writable: true };
  } catch {
    // Never overwrite an unsupported/newer save or a damaged original.
    return { save: emptyWorld(), writable: false };
  }
}

export function gateProgress(save: WorldSave): GateProgress {
  return (save.encounters[GATE_ENCOUNTER] as GateProgress | undefined) ?? {};
}

export function gateStage(save: WorldSave, now: number): IntercomStage {
  const gate = gateProgress(save);
  if (!gate.choice) return 'unanswered';
  if (now < gate.deliveryAt!) return 'waiting';
  if (gate.closingChoice) return 'closed';
  if (gate.openedAt !== undefined && now >= gate.openedAt + FOLLOW_UP_DELAY) return 'follow-up';
  return 'delivered';
}

function updateGate(save: WorldSave, patch: Partial<GateProgress>): WorldSave {
  return { ...save, encounters: { ...save.encounters, [GATE_ENCOUNTER]: { ...gateProgress(save), ...patch } } };
}

export function replyToGate(save: WorldSave, choice: ReplyChoice, now: number): WorldSave {
  if (gateProgress(save).choice) return save;
  return updateGate(save, { choice, repliedAt: now, deliveryAt: now + REPLY_DELAY });
}

export function deliveredFiles(save: WorldSave, now: number): string[] {
  const gate = gateProgress(save);
  return gate.choice && now >= gate.deliveryAt! ? [HANDOVER_FILE] : [];
}

export function readHandover(save: WorldSave, now: number): WorldSave {
  if (!deliveredFiles(save, now).includes(HANDOVER_FILE) || gateProgress(save).openedAt !== undefined) return save;
  return updateGate(save, { openedAt: now });
}

export function closeGate(save: WorldSave, choice: ClosingChoice, now: number): WorldSave {
  if (gateStage(save, now) !== 'follow-up') return save;
  return updateGate(save, { closingChoice: choice, closedAt: now });
}

export function nextGateUpdate(save: WorldSave, now: number): number | null {
  const gate = gateProgress(save);
  const stage = gateStage(save, now);
  if (stage === 'waiting') return gate.deliveryAt!;
  if (stage === 'delivered' && gate.openedAt !== undefined) return gate.openedAt + FOLLOW_UP_DELAY;
  return null;
}
