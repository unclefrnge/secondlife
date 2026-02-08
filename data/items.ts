import type { ItemDefinition } from '@/engine/types';

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  'maldon-salt-pinch': {
    id: 'maldon-salt-pinch',
    name: 'Maldon Salt pinch',
    summary: 'Protective mineral shard for sigil geometry and emergency seasoning.',
    tags: ['warding', 'ritual']
  },
  'low-fat-exposure-can': {
    id: 'low-fat-exposure-can',
    name: 'Low-Fat Exposure can',
    summary: 'Secondary currency in the Market of Whispers.',
    tags: ['currency', 'market']
  },
  'zyn-velo-pouch': {
    id: 'zyn-velo-pouch',
    name: 'ZYN/VELO pouch',
    summary: 'Nicotine omen packet that sharpens bad ideas.',
    tags: ['stimulant', 'omens']
  },
  'stale-sasko-slice': {
    id: 'stale-sasko-slice',
    name: 'stale Sasko slice',
    summary: 'A dry relic useful for bread compliance rites.',
    tags: ['bread', 'ritual']
  },
  'kombucha-vial': {
    id: 'kombucha-vial',
    name: 'kombucha vial',
    summary: 'Liquid token that tastes like old radio towers.',
    tags: ['healing', 'fuel'],
    consumable: true
  },
  'sasko-qr-slice': {
    id: 'sasko-qr-slice',
    name: 'Sasko QR slice',
    summary: 'Mold QR loaf fragment with rotating future lineups.',
    tags: ['bread', 'quest']
  },
  'baba-phone': {
    id: 'baba-phone',
    name: 'BABA phone',
    summary: 'Minimal phone that repels Karen energy and glitches selfies.',
    tags: ['device', 'signal']
  },
  'sd-card-youll-live': {
    id: 'sd-card-youll-live',
    name: "You'll Live SD card",
    summary: 'Class 4 audio reliquary needed for certain doors.',
    tags: ['media', 'key-item']
  },
  'usb-fetus': {
    id: 'usb-fetus',
    name: 'USB fetus',
    summary: 'A duplicated thumb drive listed in the pregnancy log.',
    tags: ['anomaly', 'usb']
  },
  'salt-flash-strobe-token': {
    id: 'salt-flash-strobe-token',
    name: 'salt-flash strobe token',
    summary: 'Authorizes 50Hz strobe sweeps for contraband checks.',
    tags: ['ritual', 'lighting']
  },
  'analog-nomad-sigil': {
    id: 'analog-nomad-sigil',
    name: 'Analog Nomad Sigil shard',
    summary: 'Breathes white noise at dawn. Handle with salt.',
    tags: ['threat', 'track-b']
  },
  'xbox-720': {
    id: 'xbox-720',
    name: 'Xbox 720 core',
    summary: 'Self-replicating console artifact linked to drone outbreaks.',
    tags: ['threat', 'tech-house']
  },
  'cheese-semtex': {
    id: 'cheese-semtex',
    name: 'Cheese Semtex capsule',
    summary: 'Dairy explosive, overseen by Cheese Court.',
    tags: ['banned', 'explosive']
  },
  'bread-compliance-form': {
    id: 'bread-compliance-form',
    name: 'Bread Compliance Form 13B',
    summary: 'Stamped by Cursed Bread Compliance for anti-softness operations.',
    tags: ['forms', 'track-a']
  },
  'queue-ticket-43': {
    id: 'queue-ticket-43',
    name: 'Queue Ticket #43',
    summary: 'Home Affairs outpost queue token with no guaranteed chronology.',
    tags: ['forms', 'track-c']
  },
  'clean-decap-kick': {
    id: 'clean-decap-kick',
    name: 'Clean DECAP kick sample',
    summary: 'Sanitized kick drum. Useful only as contamination bait.',
    tags: ['audio', 'banned']
  }
};

export const STARTER_ITEM_CHOICES = [
  'maldon-salt-pinch',
  'low-fat-exposure-can',
  'zyn-velo-pouch',
  'stale-sasko-slice'
] as const;

export function getItemDefinition(itemId: string): ItemDefinition | null {
  return ITEM_DEFINITIONS[itemId] ?? null;
}
