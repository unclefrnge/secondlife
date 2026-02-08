import type { LocationDefinition } from '@/engine/types';

export const LOCATION_DEFINITIONS: Record<string, LocationDefinition> = {
  'gogo-grocer': {
    id: 'gogo-grocer',
    name: "Gogo's Grocer",
    aliases: ['gogo', 'grocer', 'gogos'],
    description:
      'A cursed bodega where aisle 4 blinks Morse and the Analog Nomad Sigil breathes white noise at dawn.',
    exits: ['chmbr-bar', 'market-of-whispers', 'belt-kombucha-pipes'],
    npcIds: ['adriaan-willemse'],
    itemIds: ['analog-nomad-sigil', 'low-fat-exposure-can'],
    encounterTable: ['A CCTV dream clip loops on a freezer door.', 'The Goo Shelf hums from somewhere under tile.']
  },
  'chmbr-bar': {
    id: 'chmbr-bar',
    name: 'CHMBR Bar',
    aliases: ['chmbr', 'bar'],
    description:
      'Event crucible and PSA projector. The aux-cable chute feeds an astral sewer under the prayer arena.',
    exits: ['gogo-grocer', 'festive-board', 'home-affairs-outpost'],
    npcIds: ['seer-samuel'],
    itemIds: ['cheese-semtex'],
    encounterTable: ['A bassline audit appears on a napkin, then catches fire.', 'Someone whispers your name through an unplugged monitor.']
  },
  'festive-board': {
    id: 'festive-board',
    name: 'Festive Board',
    aliases: ['festive', 'board', 'tea house'],
    description:
      'Witch-run tea house where goat bones spell L O R E and stew acts as a scrying mirror.',
    exits: ['chmbr-bar', 'melville-forest-gate', 'null-lot'],
    npcIds: ['sister-crumb'],
    itemIds: ['sasko-qr-slice', 'stale-sasko-slice'],
    encounterTable: ['A kettle whistles in tritones.', 'Someone files a softness complaint against the weather.']
  },
  'market-of-whispers': {
    id: 'market-of-whispers',
    name: 'Market of Whispers',
    aliases: ['market', 'whispers'],
    description:
      'Tech bazaar where Xbox 720 units self-replicate and vendors price in Low-Fat Exposure cans.',
    exits: ['gogo-grocer', 'kaknet-studios', 'penjan-station'],
    npcIds: ['flash-tactix'],
    itemIds: ['xbox-720', 'baba-phone', 'salt-flash-strobe-token'],
    encounterTable: ['A vendor tries to sell you your own search history.', '14 drones hover in 4/4 and wait for consent.']
  },
  'home-affairs-outpost': {
    id: 'home-affairs-outpost',
    name: 'Home Affairs Outpost',
    aliases: ['home affairs', 'outpost', 'queue office'],
    description:
      'Bureaucratic purgatory with loadshedding ghosts and Wordle terminals that appear during outages.',
    exits: ['chmbr-bar', 'penjan-station', 'null-lot'],
    npcIds: ['ghost-of-the-chamber', 'clockkeeper-luma'],
    itemIds: ['queue-ticket-43', 'bread-compliance-form'],
    encounterTable: ['A queue number repeats itself with confidence.', 'Form 13B asks for your favorite clipping artifact.']
  },
  'penjan-station': {
    id: 'penjan-station',
    name: 'PENjan Station',
    aliases: ['penjan', 'station'],
    description:
      'Spiritual fueling depot where kombucha-diesel pumps blink devotional slogans in Lorem Ipsum.',
    exits: ['market-of-whispers', 'home-affairs-outpost', 'belt-kombucha-pipes'],
    npcIds: ['seer-pearl'],
    itemIds: ['kombucha-vial'],
    encounterTable: ['A pump asks if emptiness is taxable.', 'Someone fuels a taxi with pure regret.']
  },
  'null-lot': {
    id: 'null-lot',
    name: 'Null-Lot',
    aliases: ['null lot', 'lot'],
    description:
      'GPS loop field where walking east resets orientation and memory collects duplicate vape clouds.',
    exits: ['festive-board', 'home-affairs-outpost', 'melville-forest-gate'],
    npcIds: [],
    itemIds: ['usb-fetus'],
    encounterTable: ['You pass the same lamp post for the third first time.', 'The queue from Home Affairs appears in a parking bay.']
  },
  'melville-forest-gate': {
    id: 'melville-forest-gate',
    name: 'Melville Forest Gate',
    aliases: ['melville', 'forest gate', 'gate'],
    description:
      'Northern threshold ringed with salt. Mid Tech House vibrations weaken near the pines.',
    exits: ['festive-board', 'null-lot', 'belt-kombucha-pipes'],
    npcIds: ['knight-of-the-chamber'],
    itemIds: ['maldon-salt-pinch'],
    encounterTable: ['A shame-posted Opel Astra stares at you from fog.', 'The gate hums in B-flat when approached respectfully.']
  },
  'belt-kombucha-pipes': {
    id: 'belt-kombucha-pipes',
    name: 'Belt of Kombucha Pipes',
    aliases: ['belt', 'pipes', 'kombucha pipes'],
    description:
      'A ring of old pipes that hiss vaporous hands shaped like missing appendages from old seers.',
    exits: ['gogo-grocer', 'penjan-station', 'melville-forest-gate'],
    npcIds: [],
    itemIds: ['clean-decap-kick'],
    encounterTable: ['Pipe mist forms a hand signal for "go slower".', 'A valve stamps your shadow with bureaucracy.']
  },
  'kaknet-studios': {
    id: 'kaknet-studios',
    name: 'kakNET Studios',
    aliases: ['kaknet', 'studios', 'dstv 666'],
    description:
      'Broadcast nexus where hosts phase-shift into test patterns at 03:14.',
    exits: ['market-of-whispers'],
    npcIds: [],
    itemIds: ['sd-card-youll-live'],
    encounterTable: ['A weather ticker outputs coordinates in glitch glyphs.', 'A control-room door asks for an SD card confession.']
  }
};

export const START_LOCATION_ID = 'gogo-grocer';

export function getLocationByTarget(target: string): LocationDefinition | null {
  const normalized = target.trim().toLowerCase();
  return (
    Object.values(LOCATION_DEFINITIONS).find((location) => {
      if (location.id === normalized) {
        return true;
      }
      if (location.name.toLowerCase() === normalized) {
        return true;
      }
      return location.aliases.some((alias) => alias.toLowerCase() === normalized);
    }) ?? null
  );
}
