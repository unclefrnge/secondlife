import type { NpcDefinition } from '@/engine/types';

export const NPC_DEFINITIONS: Record<string, NpcDefinition> = {
  'ghost-of-the-chamber': {
    id: 'ghost-of-the-chamber',
    name: 'Ghost of the Chamber',
    title: 'Spectral CEO',
    locationId: 'home-affairs-outpost',
    summary: 'Speaks in packet loss and signs decrees by corrupting PDFs.',
    lines: {
      intro:
        'Ghost of the Chamber flickers through the queue monitors: "File nothing clean. Distortion is policy."',
      repeat:
        'The Ghost whispers: "The queue is not a line. It is a circle with fluorescent lighting."',
      clue: 'Track C opens here. If the queue loops, run `wordle` then `file form`.'
    }
  },
  'knight-of-the-chamber': {
    id: 'knight-of-the-chamber',
    name: 'Knight of the Chamber',
    title: 'Sonic Bastion',
    locationId: 'melville-forest-gate',
    summary: 'Carries a 50Hz hum blade and draws salt geometries.',
    lines: {
      intro:
        'Knight of the Chamber rests a humming blade on the gate rail: "Salt first. Heroics later."',
      repeat: 'The Knight says: "Mid-tech-house creeps from certainty. Keep one ear in B-flat."',
      clue: 'Containment rituals become safer if you keep Maldon salt in inventory.'
    }
  },
  'seer-samuel': {
    id: 'seer-samuel',
    name: 'Seer Samuel',
    title: 'Treasurer and Dean',
    locationId: 'chmbr-bar',
    summary: 'Documents bugs, timelines, and every click in the breakbeat loop.',
    lines: {
      intro:
        'Seer Samuel adjusts a ledger carved with insect shells: "History is a looped breakbeat. Log your clicks."',
      repeat: 'Samuel says: "Nothing is lost. It just changes format and keeps accusing us."',
      clue: 'Use `pray` here if conditions start stacking.'
    }
  },
  'adriaan-willemse': {
    id: 'adriaan-willemse',
    name: 'Adriaan Willemse',
    title: 'Head of Security',
    locationId: 'gogo-grocer',
    summary: 'Runs surveillance intuition and astral restraining orders.',
    lines: {
      intro: 'Adriaan taps the counter twice: "If you touch that sigil, run salt-flash first."',
      repeat: 'Adriaan mutters: "We can forgive noise. We cannot forgive softness."',
      clue: 'Track B starts near the sigil wall at Gogo\'s.'
    }
  },
  'sister-crumb': {
    id: 'sister-crumb',
    name: 'Sister Crumb',
    title: 'Cursed Bread Compliance',
    locationId: 'festive-board',
    summary: 'Reads mold constellations and audits softness with QR slices.',
    lines: {
      intro:
        'Sister Crumb circles a loaf with chalk: "The brioche contraband moved at sunrise. Sniff before you accuse."',
      repeat: 'Sister Crumb says: "Bread remembers. Bureaucracy pretends not to."',
      clue: 'Track A needs `sniff bread` and a proper compliance follow-through.'
    }
  },
  'seer-pearl': {
    id: 'seer-pearl',
    name: 'Seer Pearl',
    title: 'Kombucha Viscosity Director',
    locationId: 'penjan-station',
    summary: 'Measures fluid doctrine and exposes viscosity heresy.',
    lines: {
      intro:
        'Seer Pearl checks a refractometer over neon pumps: "If the blend gets thin, the timeline gets loud."',
      repeat: 'Pearl says: "Contamination starts as a rhythm you pretend not to hear."',
      clue: 'Use `hum b-flat` to reduce Mid Tech House contamination.'
    }
  },
  'flash-tactix': {
    id: 'flash-tactix',
    name: 'Flash Tactix',
    title: 'Seizure-Friendly Lighting Board',
    locationId: 'market-of-whispers',
    summary: 'Approves strobe frequencies and weaponizes calibration errors.',
    lines: {
      intro:
        'Flash Tactix spins a dimmer wheel: "Salt-flash catches lies faster than interviews."',
      repeat: 'Flash says: "160 bpm for exorcism. 50Hz for evidence."',
      clue: 'If you carry a strobe token, `salt-flash` gains better outcomes.'
    }
  },
  'clockkeeper-luma': {
    id: 'clockkeeper-luma',
    name: 'Clockkeeper Luma',
    title: 'Temporal HR',
    locationId: 'home-affairs-outpost',
    summary: 'Tracks astral absence forms and impossible backlog numbers.',
    lines: {
      intro:
        'Clockkeeper Luma stamps your wrist: "Queue Trap exemption requires one solved Wordle and one filed form."',
      repeat: 'Luma says: "Timecards are haunted. Please queue respectfully."',
      clue: 'Track C completion requires a successful `file form` at Home Affairs.'
    }
  }
};

export function getNpcByName(target: string): NpcDefinition | null {
  const normalized = target.trim().toLowerCase();
  return (
    Object.values(NPC_DEFINITIONS).find((npc) => {
      return (
        npc.name.toLowerCase() === normalized ||
        npc.id.replaceAll('-', ' ') === normalized ||
        normalized.includes(npc.name.toLowerCase())
      );
    }) ?? null
  );
}
