'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type FlagMap = Record<string, boolean>;
type VisitMap = Record<string, number>;

type State = {
  sceneId: string;
  loop: number;
  signal: number;
  flags: FlagMap;
  inv: string[];
  log: string[];
  usedOptions: string[];
  visited: VisitMap;
  lastOutcome: string | null;
};

type Choice = {
  id: string;
  label: string;
  to: string;
  when?: (s: State) => boolean;
  effects?: (s: State) => void;
  outcome?: string;
  once?: boolean;
};

type Scene = {
  title: string;
  body: (s: State) => string;
  choices: Choice[];
};

type DrawerType = 'inventory' | 'log' | null;
type EndingId = 'outside_intact' | 'outside_haunted' | 'stay_deliberate';

const STORAGE_KEY = 'chamber-text-quest-scenes-v3';
const COMPLETED_KEY = 'chamber_text_quest_completed';
const LAST_ENDING_KEY = 'chamber_text_quest_last_ending';
const ENDING_SCENE_TO_ID: Record<string, EndingId> = {
  S15_intact: 'outside_intact',
  S15_haunted: 'outside_haunted',
  S15_stay: 'stay_deliberate'
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function hasItem(state: State, id: string): boolean {
  return state.inv.includes(id);
}

function addItem(state: State, id: string): void {
  if (!state.inv.includes(id)) {
    state.inv.push(id);
  }
}

function setFlag(state: State, key: string, value = true): void {
  state.flags[key] = value;
}

function getFlag(state: State, key: string): boolean {
  return Boolean(state.flags[key]);
}

function adjustLoop(state: State, delta: number): void {
  state.loop = Math.max(0, state.loop + delta);
}

function adjustSignal(state: State, delta: number): void {
  state.signal = clamp(state.signal + delta, 0, 3);
}

function markVisit(state: State, sceneId: string): void {
  state.visited[sceneId] = (state.visited[sceneId] ?? 0) + 1;
}

function isFirstVisit(state: State, sceneId: string): boolean {
  return (state.visited[sceneId] ?? 0) <= 1;
}

function protocolCompiledFromState(state: State): boolean {
  return (
    hasItem(state, 'bandcamp_flac_shard') &&
    getFlag(state, 'motif_learned') &&
    getFlag(state, 'prayer_b2b_done')
  );
}

function resolveEndingId(state: State): string {
  const intact =
    getFlag(state, 'protocol_compiled') &&
    state.signal >= 2 &&
    state.loop < 5 &&
    !getFlag(state, 'mammon_marked');

  if (getFlag(state, 'chose_to_stay')) {
    return 'S15_stay';
  }

  if (intact) {
    return 'S15_intact';
  }

  return 'S15_haunted';
}

function toEndingId(sceneId: string): EndingId | null {
  return ENDING_SCENE_TO_ID[sceneId] ?? null;
}

function createInitialState(): State {
  return {
    sceneId: 'S0',
    loop: 0,
    signal: 2,
    flags: {},
    inv: [],
    log: [],
    usedOptions: [],
    visited: { S0: 1 },
    lastOutcome: null
  };
}

const ITEM_LABELS: Record<string, string> = {
  salt_packet: 'Salt packet',
  bandcamp_flac_shard: 'Bandcamp FLAC shard',
  queue_ticket_17B: 'Queue ticket 17B',
  mp3_echo_proof: 'MP3 echo proof',
  seer_glyph: 'Seer glyph',
  kombucha_earplugs: 'Kombucha earplugs',
  youll_live_sd: "You'll Live SD card"
};

const SCENES: Record<string, Scene> = {
  S0: {
    title: 'Outside Noise (prologue)',
    body: () =>
      [
        'It is 02:17 and the world is doing its favourite trick, making everything sound like a notification. Even the fridge hum feels like a performance review.',
        'You tell yourself you are not escaping, you are simply stepping aside. A reasonable person taking a reasonable detour from the reasonable collapse.',
        'Then the drone arrives, a clean B-flat that seems to originate from inside your skull, polite and persistent. Rumour says the Chamber can be entered through a loading dock, or by enduring a tinnitus hymn until your coordinates give up.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S0_loading_dock',
        label: "Go to the loading dock behind Gogo's Grocer",
        to: 'S1',
        effects: (s) => {
          s.signal = 3;
          s.loop = 0;
          setFlag(s, 'entry_dock');
        },
        outcome:
          'You walk like you are running an errand, which is how you smuggle yourself into myths.'
      },
      {
        id: 'S0_endure_drone',
        label: 'Endure the 43-minute B-flat drone',
        to: 'S1',
        effects: (s) => {
          adjustSignal(s, -1);
          setFlag(s, 'entry_drone');
        },
        outcome:
          'You let the note sandpaper your thoughts until the border between inside and outside starts to fray.'
      },
      {
        id: 'S0_archive_first',
        label: 'Open the haunted archive instead of leaving your chair',
        to: 'S13',
        effects: (s) => {
          adjustLoop(s, 1);
          setFlag(s, 'entry_cdn');
        },
        outcome:
          'The screen flashes error pages like scripture, and your body starts feeling optional.'
      }
    ]
  },
  S1: {
    title: "Gogo's Grocer (lore depot)",
    body: () =>
      [
        'The loading dock smells like shoe polish and old HDMI cables, an omen you do not understand yet. Inside, fluorescent lights are slightly out of phase with reality.',
        'Aisle 4 flickers in a pattern that makes your teeth hurt, 666, Morse disguised as burnout. On the circular wall, a breathing glyph exhales white noise at dawn and dusk.',
        'Gogo watches you like you are both a customer and a symptom. Looking for something? she asks. You almost say an exit. You hear yourself say, something that works.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S1_ask_gogo',
        label: 'Ask Gogo what people do when reality gets too loud',
        to: 'S2',
        effects: (s) => {
          setFlag(s, 'met_gogo');
          adjustSignal(s, 1);
        },
        outcome: 'She does not comfort you. She gives you procedure, which is kinder.'
      },
      {
        id: 'S1_follow_morse',
        label: 'Follow the Morse flicker down Aisle 4',
        to: 'S2',
        effects: (s) => {
          setFlag(s, 'saw_aisle4');
        },
        outcome: 'Your eyes learn to read light as language, and suddenly you are deeper.'
      },
      {
        id: 'S1_basement_goo',
        label: 'Go to Basement 3B, the Goo Shelf rumour',
        to: 'S3',
        effects: (s) => {
          adjustLoop(s, 1);
          setFlag(s, 'went_basement');
        },
        outcome: 'You descend like you chose inconvenience on purpose. The Chamber respects that.'
      },
      {
        id: 'S1_buy_salt',
        label: 'Buy a salt packet and leave before you get attached',
        to: 'S4',
        effects: (s) => {
          addItem(s, 'salt_packet');
        },
        outcome: 'You pay for a boundary. It is the most practical magic.'
      }
    ]
  },
  S2: {
    title: 'Aisle 4, 666 (the first instruction)',
    body: () =>
      [
        'The flicker in Aisle 4 is not trying to scare you. It is trying to teach you a pace, fast enough to survive, slow enough to notice.',
        'On the shelf between cheap mints and suspicious kombucha, a paper slip is pinned with a stapler that looks ceremonial.',
        'It reads: NO METRICS, NO MASTERS. Underneath, in smaller handwriting: If you take shortcuts, the Chamber will take you back.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S2_memorise_line',
        label: 'Memorise the line, do not photograph it',
        to: 'S4',
        effects: (s) => {
          setFlag(s, 'motif_learned');
          adjustSignal(s, 1);
        },
        outcome: 'You carry the sentence in your mouth like a lozenge that dissolves slowly.'
      },
      {
        id: 'S2_photo_line',
        label: 'Photograph it anyway',
        to: 'S4',
        effects: (s) => {
          adjustLoop(s, 1);
          setFlag(s, 'motif_photographed');
        },
        outcome: 'The image saves, but the meaning pixelates. You feel slightly cheaper.'
      },
      {
        id: 'S2_ask_author',
        label: 'Ask Gogo who wrote it',
        to: 'S4',
        effects: (s) => {
          setFlag(s, 'asked_author');
        },
        outcome: 'Everyone, she says, and you hate how true that sounds.'
      }
    ]
  },
  S3: {
    title: 'Basement 3B, Goo Shelf (illegal warmth)',
    body: () =>
      [
        'Basement 3B is colder than it should be, like it is underground for emotional reasons. A shelf labelled GOO holds things that should not coexist.',
        'Illegal pastrami. A stack of SD cards with handwritten titles. And an Xbox 720 wrapped in plastic like contraband trying to be reborn.',
        'On the wall, a marker warning: If it asks you to optimise your life, do not answer.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S3_take_flac',
        label: 'Take the Bandcamp FLAC shard',
        to: 'S4',
        effects: (s) => {
          addItem(s, 'bandcamp_flac_shard');
          setFlag(s, 'got_flac');
          adjustSignal(s, 1);
        },
        outcome: 'It is not nostalgia. It is proof that compression is a choice.'
      },
      {
        id: 'S3_take_xbox',
        label: 'Take the Xbox 720 anyway',
        to: 'S8',
        effects: (s) => {
          setFlag(s, 'xbox_exposed');
          adjustLoop(s, 1);
        },
        outcome: 'The plastic is warm, friendly until it is not.'
      },
      {
        id: 'S3_leave_empty',
        label: 'Leave empty-handed, pretending you never saw this',
        to: 'S4',
        effects: (s) => {
          adjustSignal(s, 1);
        },
        outcome: 'Restraint is also a form of ownership.'
      }
    ]
  },
  S4: {
    title: 'Taxi Lane, Kombucha Carburettors (threshold drift)',
    body: () =>
      [
        'Outside the grocer, the street changes texture, as if someone switched the map font.',
        'An ex-school bus idles nearby, repurposed into a Chamber taxi. A Toyota Quantum waits with its engine off. You cannot see the driver, but you feel the question: Bandcamp code?',
        "To your right, the pavement slopes in a way that suggests a loop field, the Null-Lot's breath."
      ].join('\n\n'),
    choices: [
      {
        id: 'S4_take_bus',
        label: 'Take the ex-school bus (public myth)',
        to: 'S5',
        effects: (s) => {
          setFlag(s, 'took_bus');
        },
        outcome: 'You sit among strangers who do not look at you, which is a kind of respect.'
      },
      {
        id: 'S4_take_quantum',
        label: 'Take the Quantum taxi (private myth)',
        to: 'S8',
        effects: (s) => {
          adjustLoop(s, 1);
          setFlag(s, 'took_quantum');
        },
        outcome: 'You trade certainty for speed, which is how the loop buys you.'
      },
      {
        id: 'S4_walk_admin',
        label: 'Walk towards the bureaucratic building that looks like it is waiting for you',
        to: 'S5',
        effects: (s) => {
          setFlag(s, 'chose_admin');
        },
        outcome: 'You choose the hard door first, as if you are serious.'
      },
      {
        id: 'S4_walk_null',
        label: 'Walk towards the slope where GPS starts lying',
        to: 'S7',
        effects: (s) => {
          setFlag(s, 'approached_null_lot');
          adjustLoop(s, 1);
        },
        outcome: 'You feel the world preparing to repeat you.'
      }
    ]
  },
  S5: {
    title: 'Home Affairs Outpost (queue-trap)',
    body: (s) => {
      const lines = [
        'The Home Affairs Outpost is a building shaped like a sigh.',
        'During loadshedding, Wordle kiosks appear like mushrooms. A sign reads: PLEASE WAIT. NO METRICS, NO MASTERS. Somebody stapled the motif to bureaucracy.',
        'A clerk slides a form towards you. The text shifts. Lorem Ipsum, hungry and cheerful.'
      ];

      if (getFlag(s, 'accepted_lorem')) {
        lines.push('The placeholders already know your handwriting.');
      }

      return lines.join('\n\n');
    },
    choices: [
      {
        id: 'S5_queue_ticket',
        label: 'Take a queue ticket and join the line',
        to: 'S6',
        effects: (s) => {
          addItem(s, 'queue_ticket_17B');
          setFlag(s, 'got_queue_ticket');
          adjustLoop(s, 1);
        },
        outcome: 'The ticket number feels like a name you did not consent to.'
      },
      {
        id: 'S5_fill_form',
        label: 'Fill in the form (just to get through)',
        to: 'S6',
        effects: (s) => {
          setFlag(s, 'accepted_lorem');
          adjustSignal(s, -1);
          adjustLoop(s, 1);
        },
        outcome: 'The words do not describe you. They replace you, gently.'
      },
      {
        id: 'S5_refuse_form',
        label: 'Refuse the form, ask for the back hallway',
        to: 'S6',
        effects: (s) => {
          adjustSignal(s, 1);
          setFlag(s, 'refused_lorem');
        },
        outcome: 'The clerk looks relieved, as if you reminded them they are also a person.'
      },
      {
        id: 'S5_leave_queue',
        label: 'Go outside and let the queue solve itself without you',
        to: 'S7',
        effects: (s) => {
          adjustLoop(s, 1);
        },
        outcome: 'Avoidance is a hallway too. It just loops.'
      }
    ]
  },
  S6: {
    title: 'Badkamer (fake door, tiled void)',
    body: () =>
      [
        'A fake bathroom door sits where a door should not fit, a joke that became structural.',
        'Behind it, tiles stretch too cleanly. When you speak, your echo returns as MP3, 128kbps CBR, your voice compressed into something obedient.',
        'A mirror lags by half a second, as if deciding whether it trusts you.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S6_say_name',
        label: 'Say your full name into the tiles',
        to: 'S7',
        effects: (s) => {
          adjustSignal(s, -1);
          setFlag(s, 'named_self');
        },
        outcome: 'Your name comes back thinner, but recognisable. Still a victory.'
      },
      {
        id: 'S6_stay_silent',
        label: 'Stay silent and listen for the real corridor',
        to: 'S7',
        effects: (s) => {
          adjustSignal(s, 1);
          setFlag(s, 'chose_silence');
        },
        outcome: 'Silence is not absence. It is bandwidth.'
      },
      {
        id: 'S6_record_echo',
        label: 'Record the MP3 echo (proof of distortion)',
        to: 'S8',
        effects: (s) => {
          addItem(s, 'mp3_echo_proof');
          adjustLoop(s, 1);
        },
        outcome: 'You gain evidence, lose a little trust in yourself. Classic exchange rate.'
      },
      {
        id: 'S6_slip_back',
        label: 'Slip back through the door before the tiles learn you',
        to: 'S5',
        effects: (s) => {
          adjustLoop(s, 1);
        },
        outcome: 'Retreat is a move, but rarely a new one.'
      }
    ]
  },
  S7: {
    title: 'Null-Lot (GPS loop field)',
    body: () =>
      [
        'The Null-Lot looks ordinary until you try to leave. Walk east and orientation soft-resets in your stomach.',
        'People call it Loop Syndrome, memory of identical vape clouds, identical jokes, identical one more lap.',
        'A sign points to EXIT. The arrow rotates slowly like a bored compass.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S7_walk_east',
        label: 'Walk east anyway (test the rumour)',
        to: 'S7',
        effects: (s) => {
          adjustLoop(s, 1);
        },
        outcome: 'You arrive where you started, with lower confidence fidelity.'
      },
      {
        id: 'S7_salt_ring',
        label: 'Throw a salt ring behind you',
        to: 'S8',
        when: (s) => hasItem(s, 'salt_packet'),
        effects: (s) => {
          setFlag(s, 'salt_ring_cast');
          adjustSignal(s, 1);
        },
        outcome: 'The air stiffens. The loop remembers it is not allowed to touch you.'
      },
      {
        id: 'S7_sit_watch',
        label: 'Sit down and watch the EXIT arrow rotate',
        to: 'S9',
        effects: (s) => {
          adjustSignal(s, 1);
        },
        outcome: 'You stop chasing. The Chamber notices. A path appears.'
      },
      {
        id: 'S7_follow_54',
        label: 'Follow crosswalk beeps in 5/4 (SnapScam lanes)',
        to: 'S8',
        effects: (s) => {
          setFlag(s, 'followed_5_4');
        },
        outcome: 'You time your steps to odd rhythm and the street lets you pass.'
      }
    ]
  },
  S8: {
    title: 'Market of Whispers (black market, soft threat)',
    body: () =>
      [
        'Under SnapScam Plaza, vendors sell technology like food and people eat it.',
        'Xbox 720 units replicate slowly on a table. Tech-House drones hover with low-level cult patience.',
        'A dog in a taxi vest carries burned CDs between stalls. It looks at you once, like it knows what you are trying to protect.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S8_trade_echo',
        label: "Trade the MP3 echo proof for a Seer's glyph",
        to: 'S9',
        when: (s) => hasItem(s, 'mp3_echo_proof'),
        effects: (s) => {
          addItem(s, 'seer_glyph');
          setFlag(s, 'got_seer_glyph');
          adjustSignal(s, 1);
        },
        outcome: 'You exchange compression for direction.'
      },
      {
        id: 'S8_buy_lowfat',
        label: 'Buy the LOW-FAT EXPOSURE can (just to see)',
        to: 'S12',
        effects: (s) => {
          setFlag(s, 'mammon_marked');
          adjustLoop(s, 1);
        },
        outcome: 'It tastes like metrics. Your mouth becomes a dashboard for a moment.'
      },
      {
        id: 'S8_pet_dog',
        label: 'Pet the dog',
        to: 'S9',
        effects: (s) => {
          adjustSignal(s, 1);
          setFlag(s, 'dog_acknowledged');
        },
        outcome: 'The dog leans in, then leaves, as if stamping you with permission.'
      },
      {
        id: 'S8_leave_clean',
        label: 'Walk away without buying anything',
        to: 'S9',
        effects: (s) => {
          adjustSignal(s, 1);
        },
        outcome: 'You refuse to turn your exit into a transaction.'
      }
    ]
  },
  S9: {
    title: 'PENjan Station (spiritual refuelling)',
    body: () =>
      [
        'PENjan is a refuelling depot for things without petrol tanks, ego included.',
        'Pumps dispense kombucha-diesel blend. The hum sits in B-flat like a remembered headache.',
        'Signage cycles between words and almost-words: FEEL EMPTY? WE FILL YOU UP.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S9_refuel_deliberate',
        label: 'Refuel with kombucha-diesel (small, deliberate)',
        to: 'S10',
        effects: (s) => {
          adjustSignal(s, 1);
        },
        outcome: 'You do not get fixed. You get enough to keep walking.'
      },
      {
        id: 'S9_translate_lorem',
        label: 'Translate the Lorem Ipsum until it stops being cute',
        to: 'S10',
        effects: (s) => {
          setFlag(s, 'lorem_resisted');
          adjustSignal(s, 1);
        },
        outcome: 'The parasite hates scrutiny. It prefers skim-reading.'
      },
      {
        id: 'S9_chase_sign',
        label: 'Chase the FEEL EMPTY sign as if it is personal',
        to: 'S12',
        effects: (s) => {
          adjustLoop(s, 1);
        },
        outcome: 'The sign brightens and your autonomy dims, a fair swap if you like cages.'
      },
      {
        id: 'S9_ask_gathering',
        label: 'Ask the attendant about the nearest gathering',
        to: 'S10',
        effects: (s) => {
          setFlag(s, 'asked_for_people');
        },
        outcome: 'CHMBR Bar, they say, like medicine that tastes like noise.'
      }
    ]
  },
  S10: {
    title: 'CHMBR Bar (haven, without speeches)',
    body: () =>
      [
        'CHMBR Bar is loud in a way that does not demand anything from you.',
        'An aux-cable disposal chute feeds an astral drain. People drop cables like offerings, practical, not dramatic.',
        'In the basement, Communal Prayer b2b stitches a room back together beat by beat.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S10_prayer_b2b',
        label: 'Go downstairs for Communal Prayer b2b',
        to: 'S11',
        effects: (s) => {
          setFlag(s, 'prayer_b2b_done');
          adjustSignal(s, 1);
        },
        outcome: 'You do not become pure. You become present.'
      },
      {
        id: 'S10_aux_offering',
        label: 'Dispose of an aux cable in the chute',
        to: 'S11',
        effects: (s) => {
          setFlag(s, 'aux_offering');
          adjustLoop(s, -1);
        },
        outcome: 'You feel one loop loosen. Not solved, loosened.'
      },
      {
        id: 'S10_ask_exits',
        label: 'Ask about exits and immediately feel embarrassed',
        to: 'S12',
        effects: (s) => {
          setFlag(s, 'asked_about_exit');
        },
        outcome: 'Someone laughs with you and hands you a location like a secret.'
      },
      {
        id: 'S10_leave_before_attach',
        label: 'Leave while it still feels good, before it becomes avoidance',
        to: 'S12',
        effects: (s) => {
          setFlag(s, 'left_before_attached');
          adjustSignal(s, 1);
        },
        outcome: 'You practise the hardest kindness, leaving haven without rejecting it.'
      }
    ]
  },
  S11: {
    title: 'The Festive Board (witch-run table)',
    body: () =>
      [
        'The Festive Board is a tea house pretending to be a harvest table.',
        'Goat bones rearrange nightly, spelling L O R E in old T9. A stew pot becomes a mirror when stirred with a kombucha ladle.',
        'An edict hangs above bread: NO BRIOCHE BUNS.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S11_stir_pot',
        label: 'Stir the pot and read your exit like weather',
        to: 'S12',
        effects: (s) => {
          setFlag(s, 'saw_direction_glyphs');
          adjustSignal(s, 1);
        },
        outcome: 'You see a path that looks like community, inconvenient and real.'
      },
      {
        id: 'S11_ask_brioche',
        label: 'Ask what No Brioche Buns is protecting',
        to: 'S12',
        effects: (s) => {
          setFlag(s, 'learned_small_laws');
          adjustSignal(s, 1);
        },
        outcome: 'Softness becomes entitlement, someone says, and it lands.'
      },
      {
        id: 'S11_eat_quietly',
        label: 'Eat quietly without turning it into content',
        to: 'S12',
        effects: (s) => {
          adjustLoop(s, -1);
        },
        outcome: 'The Chamber rewards unposted nourishment.'
      }
    ]
  },
  S12: {
    title: 'kakNET Studios (DStv 666, propaganda with seams)',
    body: () =>
      [
        'kakNET broadcasts like a throat clearing itself. At 03:14, host avatars glitch into a Zulu test pattern.',
        'A control-room sign reads: NO METRICS, NO MASTERS (PLEASE WAIT). The bracketed politeness feels like a knife with a smile.',
        'To enter, you need a specific SD card, or a willingness to be seen.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S12_broadcast_truth',
        label: 'Broadcast a single honest sentence (not optimised)',
        to: 'S13',
        effects: (s) => {
          setFlag(s, 'broadcasted_truth');
          adjustSignal(s, 1);
        },
        outcome: 'The studio stops pretending it owns your voice.'
      },
      {
        id: 'S12_steal_sd',
        label: 'Try to sneak in and steal an SD card',
        to: 'S13',
        effects: (s) => {
          addItem(s, 'youll_live_sd');
          setFlag(s, 'stole_sd');
          adjustLoop(s, 1);
        },
        outcome: 'You get the card, but the theft sticks to you like static.'
      },
      {
        id: 'S12_follow_pattern',
        label: 'Follow the test pattern into the archive layer',
        to: 'S13',
        effects: (s) => {
          setFlag(s, 'followed_test_pattern');
        },
        outcome: 'You step through broadcast into storage, where the Chamber hoards ghosts.'
      }
    ]
  },
  S13: {
    title: "Haunted Archive (CDN scripture, Mammon's shadow)",
    body: (s) => {
      const lines = [
        'The archive is not a place. It is a behaviour.',
        'Error pages load as scripture. FLAC files leak like blood in a hospital corridor, clean and uncompressed.',
        'Mammon stirs in the ping time, a greed daemon feeding on stream metrics under a smiling hologram mask.'
      ];

      if (getFlag(s, 'mammon_marked')) {
        lines.push('The dashboard glow already knows your name.');
      }

      return lines.join('\n\n');
    },
    choices: [
      {
        id: 'S13_chant_refuse',
        label: 'Chant the line and refuse the metrics hallucination',
        to: 'S14',
        when: (s) => getFlag(s, 'motif_learned'),
        effects: (s) => {
          setFlag(s, 'mammon_resisted');
          adjustSignal(s, 1);
        },
        outcome: 'The hologram flickers, annoyed. Your spine returns.'
      },
      {
        id: 'S13_open_dashboard',
        label: 'Open the dashboard anyway (just to know)',
        to: 'S14',
        effects: (s) => {
          setFlag(s, 'mammon_marked');
          adjustLoop(s, 1);
        },
        outcome: 'Numbers enter you like weather. You start thinking in percentage.'
      },
      {
        id: 'S13_burn_pamphlet',
        label: 'Incinerate the Music Dinosaurs pamphlet',
        to: 'S14',
        effects: (s) => {
          setFlag(s, 'burned_pamphlet');
          adjustLoop(s, -1);
        },
        outcome: 'You burn a story about yourself that was never yours.'
      },
      {
        id: 'S13_compile_packet',
        label: 'Compile the Protocol Packet',
        to: 'S14',
        when: (s) => hasItem(s, 'bandcamp_flac_shard') && getFlag(s, 'motif_learned') && getFlag(s, 'prayer_b2b_done'),
        effects: (s) => {
          setFlag(s, 'protocol_compiled');
        },
        outcome: 'Object, phrase, ritual. You make a portable doorway from three small truths.'
      }
    ]
  },
  S14: {
    title: 'Melville Forest Gate (northern threshold)',
    body: () =>
      [
        'The forest gate is a security checkpoint dressed as trees.',
        'Salt rings repel mid-Tech House vibrations. Nearby, an Opel Astra is being shame-posted for cosmically petty reasons.',
        'No dramatic lock, only a question in the air: are you leaving from fear, or ready to carry something back?'
      ].join('\n\n'),
    choices: [
      {
        id: 'S14_present_packet',
        label: 'Present the Protocol Packet',
        to: 'S15',
        when: (s) => getFlag(s, 'protocol_compiled'),
        effects: (s) => {
          setFlag(s, 'chose_protocol_exit');
        },
        outcome: 'The gate recognises practice. It opens like a nod, not a miracle.'
      },
      {
        id: 'S14_show_ticket',
        label: 'Show a queue ticket like it is a passport',
        to: 'S15',
        when: (s) => hasItem(s, 'queue_ticket_17B'),
        effects: (s) => {
          adjustLoop(s, 1);
        },
        outcome: 'The gate lets you through, but bureaucracy purrs in your pocket.'
      },
      {
        id: 'S14_force_gate',
        label: 'Try to force the gate (pure willpower)',
        to: 'S15',
        effects: (s) => {
          adjustLoop(s, 2);
          adjustSignal(s, -1);
        },
        outcome: 'You can bully a door. You cannot bully a pattern.'
      },
      {
        id: 'S14_optimize_exit',
        label: 'Optimise your exit route (best, fastest)',
        to: 'S15',
        effects: (s) => {
          adjustLoop(s, 2);
          setFlag(s, 'mammon_marked');
        },
        outcome: 'The gate opens, and you realise you brought an algorithm with you.'
      },
      {
        id: 'S14_turn_back_help',
        label: 'Turn back, leave the exit open for the next person',
        to: 'S15',
        effects: (s) => {
          setFlag(s, 'chose_to_stay');
          adjustSignal(s, 1);
        },
        outcome: 'You decide to help pay for haven in small laws and presence.'
      }
    ]
  },
  S15_intact: {
    title: 'Ending A: Outside, Intact',
    body: () =>
      [
        'You step out and outside is still outside: sirens, admin, rent, the tyranny of calendars.',
        'But you are not empty-handed. You carry an artefact that refuses compression, a sentence that refuses mastery, and a ritual that can happen anywhere two people choose honesty.',
        'The Chamber does not follow you as place. It follows you as practice. You do not escape reality. You re-enter it with an exit in your pocket.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S15_intact_new',
        label: 'New Run',
        to: 'S0',
        effects: (s) => {
          const runs = (s.visited._runs ?? 0) + 1;
          const fresh = createInitialState();
          Object.assign(s, fresh);
          s.visited._runs = runs;
        }
      }
    ]
  },
  S15_haunted: {
    title: 'Ending B: Outside, Haunted',
    body: () =>
      [
        'You leave. The air tastes less kombucha, more ordinary exhaust.',
        'Your thoughts keep forming menus: optimise, comply, repeat. You carried the loop out like a souvenir you did not mean to buy.',
        'On a wall behind you, the sentence fades: NO METRICS, NO MASTERS? The question mark is new.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S15_haunted_new',
        label: 'New Run',
        to: 'S0',
        effects: (s) => {
          const runs = (s.visited._runs ?? 0) + 1;
          const fresh = createInitialState();
          Object.assign(s, fresh);
          s.visited._runs = runs;
        }
      }
    ]
  },
  S15_stay: {
    title: 'Ending C: Stay, Deliberate',
    body: () =>
      [
        'You do not leave. Not because you failed. Not because you were trapped. Not because comfort seduced you.',
        'You stay because haven has a cost, and you are willing to pay in small laws, salt rings, and showing up when you would rather disappear.',
        'You become, quietly, a service window for the next person whose world gets too loud. The Chamber does not applaud. It just keeps breathing.'
      ].join('\n\n'),
    choices: [
      {
        id: 'S15_stay_new',
        label: 'New Run',
        to: 'S0',
        effects: (s) => {
          const runs = (s.visited._runs ?? 0) + 1;
          const fresh = createInitialState();
          Object.assign(s, fresh);
          s.visited._runs = runs;
        }
      }
    ]
  }
};

function isState(value: unknown): value is State {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const v = value as State;
  return (
    typeof v.sceneId === 'string' &&
    typeof v.loop === 'number' &&
    typeof v.signal === 'number' &&
    typeof v.flags === 'object' &&
    Array.isArray(v.inv) &&
    Array.isArray(v.log) &&
    Array.isArray(v.usedOptions) &&
    typeof v.visited === 'object'
  );
}

function loadState(): State {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isState(parsed)) {
      return createInitialState();
    }

    return {
      ...parsed,
      loop: Math.max(0, parsed.loop),
      signal: clamp(parsed.signal, 0, 3),
      flags: { ...parsed.flags },
      inv: [...parsed.inv],
      log: [...parsed.log],
      usedOptions: [...parsed.usedOptions],
      visited: { ...parsed.visited },
      lastOutcome: typeof (parsed as State).lastOutcome === 'string' ? (parsed as State).lastOutcome : null
    };
  } catch {
    return createInitialState();
  }
}

function saveState(state: State): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

export default function ChamberTextQuestPage() {
  const [embedded, setEmbedded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<State>(createInitialState());
  const [resetOpen, setResetOpen] = useState(false);
  const [drawer, setDrawer] = useState<DrawerType>(null);
  const [displayedSceneText, setDisplayedSceneText] = useState('');
  const [isTypingSceneText, setIsTypingSceneText] = useState(false);
  const [visibleOutcome, setVisibleOutcome] = useState<string | null>(null);
  const [prizeOpen, setPrizeOpen] = useState(false);
  const [prizeDownloaded, setPrizeDownloaded] = useState(false);
  const [prizeCheckbox, setPrizeCheckbox] = useState(false);
  const [noThanksClicks, setNoThanksClicks] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setEmbedded(params.get('embedded') === '1');
    }

    const initial = loadState();
    setState(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveState(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const endingId = toEndingId(state.sceneId);
    if (!endingId) {
      return;
    }

    try {
      window.localStorage.setItem(COMPLETED_KEY, 'true');
      window.localStorage.setItem(LAST_ENDING_KEY, endingId);
    } catch {
      // ignore storage failures
    }

    setPrizeDownloaded(false);
    setPrizeCheckbox(false);
    setNoThanksClicks(0);
    setPrizeOpen(true);
  }, [hydrated, state.sceneId]);

  const scene = useMemo(() => SCENES[state.sceneId] ?? SCENES.S0, [state.sceneId]);
  const activeEndingId = useMemo(() => toEndingId(state.sceneId), [state.sceneId]);

  const sceneText = useMemo(() => scene.body(state), [scene, state]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (state.lastOutcome) {
      setVisibleOutcome(state.lastOutcome);
      setState((current) => (current.lastOutcome ? { ...current, lastOutcome: null } : current));
    }
  }, [hydrated, state.lastOutcome, state.sceneId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const source = sceneText;
    if (!source) {
      setDisplayedSceneText('');
      setIsTypingSceneText(false);
      return;
    }

    let pointer = 0;
    let timer: number | undefined;
    let cancelled = false;

    setDisplayedSceneText('');
    setIsTypingSceneText(true);

    const tick = () => {
      if (cancelled) {
        return;
      }

      pointer += 1;
      setDisplayedSceneText(source.slice(0, pointer));

      if (pointer >= source.length) {
        setIsTypingSceneText(false);
        return;
      }

      const ch = source.charAt(pointer - 1);
      let delay = 14;

      if (ch === '\n') {
        delay = 70;
      } else if (/[.!?]/.test(ch)) {
        delay = 54;
      } else if (/[,;:]/.test(ch)) {
        delay = 32;
      }

      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 85);

    return () => {
      cancelled = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [hydrated, sceneText]);

  const visibleChoices = useMemo(
    () =>
      scene.choices.filter((choice) => {
        const allowed = choice.when ? choice.when(state) : true;
        const used = choice.once ? state.usedOptions.includes(choice.id) : false;
        return allowed && !used;
      }),
    [scene.choices, state]
  );

  const applyChoice = (choiceId: string) => {
    const choice = scene.choices.find((entry) => entry.id === choiceId);
    if (!choice) {
      return;
    }

    if (choice.when && !choice.when(state)) {
      return;
    }

    if (choice.once && state.usedOptions.includes(choice.id)) {
      return;
    }

    setState((current) => {
      const next: State = {
        ...current,
        flags: { ...current.flags },
        inv: [...current.inv],
        log: [...current.log],
        usedOptions: [...current.usedOptions],
        visited: { ...current.visited },
        lastOutcome: choice.outcome ?? null
      };

      next.log.push(`> ${choice.label}`);

      if (choice.effects) {
        choice.effects(next);
      }

      if (choice.once) {
        next.usedOptions.push(choice.id);
      }

      if (protocolCompiledFromState(next)) {
        setFlag(next, 'protocol_compiled');
      }

      let targetSceneId = choice.to;

      if (targetSceneId === 'S15') {
        targetSceneId = resolveEndingId(next);
      }

      next.sceneId = targetSceneId;
      markVisit(next, targetSceneId);
      next.log.push(`DM // ${SCENES[targetSceneId]?.title ?? targetSceneId}`);

      return next;
    });
  };

  const startNewGame = () => {
    setState((current) => {
      const runs = (current.visited._runs ?? 0) + 1;
      const fresh = createInitialState();
      fresh.visited._runs = runs;
      return fresh;
    });
    setVisibleOutcome(null);
    setResetOpen(false);
    setPrizeOpen(false);
    setPrizeDownloaded(false);
    setPrizeCheckbox(false);
    setNoThanksClicks(0);
  };

  const claimPrize = () => {
    const anchor = document.createElement('a');
    anchor.href = '/rewards/greetings-from-the-chamber.pdf';
    anchor.download = 'GREETINGS_FROM_THE_CHAMBER.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setPrizeDownloaded(true);
  };

  if (!hydrated) {
    return (
      <main className={cn('bg-black text-text', embedded ? 'h-[100dvh] overflow-hidden' : 'min-h-dvh')}>
        <div className={cn('mx-auto flex items-center justify-center px-4 font-mono', embedded ? 'h-full' : 'min-h-dvh max-w-3xl')}>
          <p className="text-sm text-muted">Loading Chamber Text Quest...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={cn(
        'relative bg-[#050706] text-[#b8f3bf]',
        embedded ? 'h-[100dvh] overflow-hidden px-0 py-0' : 'min-h-dvh overflow-hidden px-3 py-5 sm:px-6'
      )}
    >
      <div
        className={cn(
          'relative mx-auto flex min-h-full max-w-5xl flex-col',
          embedded ? 'h-full max-w-none grid grid-rows-[auto_minmax(0,1fr)] p-2 sm:p-3' : 'min-h-[calc(100dvh-2rem)]'
        )}
      >
        <header className="sticky top-0 z-20 rounded-[4px] border border-[#2b3f2d] bg-[#0a120d] px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!embedded ? (
                <div className="mr-2 flex items-center gap-3">
                  <Image
                    src="/chamber-text-quest-app-icon.png"
                    alt="Chamber Text Quest"
                    width={34}
                    height={34}
                    className="rounded-[6px] border border-[#2b3f2d]"
                  />
                  <div>
                    <p className="font-mono text-sm text-[#8df29a]">Chamber Text Quest</p>
                    <p className="font-mono text-[11px] text-[#6ea775]">canon scene build</p>
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setDrawer('inventory')}
                className="border-[#2b3f2d] bg-black/35 text-[#7fc387] hover:border-[#61a86a] hover:bg-[#0f1c12]"
              >
                Inventory
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setDrawer('log')}
                className="border-[#2b3f2d] bg-black/35 text-[#7fc387] hover:border-[#61a86a] hover:bg-[#0f1c12]"
              >
                Run Log
              </Button>
              {!embedded ? (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="border-[#2b3f2d] bg-black/35 text-[#7fc387] hover:border-[#61a86a] hover:bg-[#0f1c12]"
                >
                  <Link href="/">Back to Desktop</Link>
                </Button>
              ) : null}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="rounded-[3px] border border-[#2b3f2d] bg-black/30 px-2 py-1 font-mono text-xs text-[#7dcf89]">
                loop {state.loop} | signal {state.signal}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setResetOpen(true)}
                className="border-[#2b3f2d] bg-black/35 text-[#7fc387] hover:border-[#61a86a] hover:bg-[#0f1c12]"
              >
                New Game
              </Button>
            </div>
          </div>
        </header>

        <section
          className={cn(
            'rounded-[4px] border border-[#2b3f2d] bg-[#071009] p-3',
            embedded ? 'mt-2 min-h-0 overflow-hidden' : 'mt-3 min-h-0 flex-1'
          )}
        >
          <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2">
            <div className="flex items-center justify-between gap-3 border border-[#2b3f2d] bg-black/45 px-2 py-1 font-mono text-[11px] text-[#7dcf89]">
              <p className="truncate">{scene.title}</p>
              <p className="shrink-0 text-[#67a96f]">{isTypingSceneText ? 'writing...' : `choices: ${visibleChoices.length}`}</p>
            </div>

            <div className="relative min-h-0 overflow-y-auto overscroll-y-contain rounded-[4px] border border-[#2b3f2d] bg-[#050706] px-3 py-3 pr-2 font-mono text-[13px] leading-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(147,245,161,0.12), rgba(147,245,161,0.12) 1px, transparent 1px, transparent 3px)'
                }}
              />

              {visibleOutcome ? (
                <p className="relative mb-3 whitespace-pre-wrap italic text-[#89d994]">{visibleOutcome}</p>
              ) : null}

              <p className="relative whitespace-pre-line text-[14px] leading-7 text-[#b8f3bf] sm:text-[15px] sm:leading-8">
                {displayedSceneText}
                {isTypingSceneText ? <span className="ml-0.5 inline-block animate-pulse text-[#8ed596]">|</span> : null}
              </p>
            </div>

            <div className="grid shrink-0 gap-2 rounded-[4px] border border-[#2b3f2d] bg-[#070f0a] px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6ea775]">Choose</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleChoices.map((choice, index) => (
                  <Button
                    key={choice.id}
                    type="button"
                    variant="ghost"
                    onClick={() => applyChoice(choice.id)}
                    disabled={isTypingSceneText}
                    className="min-h-12 justify-start border border-[#2b3f2d] bg-black/30 px-4 py-2 text-left font-mono text-[#8ed596] whitespace-normal break-words leading-5 hover:border-[#61a86a] hover:bg-[#0f1c12] hover:text-[#afffb8] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="inline-block w-full whitespace-normal break-words">
                      [{index + 1}] {choice.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>

      <Sheet open={drawer !== null} onOpenChange={(open) => (!open ? setDrawer(null) : null)}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto border-[#2b3f2d] bg-[#070f0a]">
          {drawer === 'inventory' ? (
            <>
              <SheetHeader>
                <SheetTitle>Inventory</SheetTitle>
                <SheetDescription>Current carried artefacts.</SheetDescription>
              </SheetHeader>

              <section className="mt-4 space-y-3 font-mono text-sm">
                <div className="rounded-[4px] border border-[#2b3f2d] bg-black/25 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[#6ea775]">Items</p>
                  <ul className="mt-2 space-y-1 text-[#8ed596]">
                    {state.inv.length ? (
                      state.inv.map((id) => <li key={id}>- {ITEM_LABELS[id] ?? id}</li>)
                    ) : (
                      <li className="text-[#6ea775]">No items collected.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-[4px] border border-[#2b3f2d] bg-black/25 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[#6ea775]">Flags</p>
                  <ul className="mt-2 space-y-1 text-[#8ed596]">
                    {Object.entries(state.flags)
                      .filter(([, value]) => value)
                      .map(([key]) => (
                        <li key={key}>- {key}</li>
                      ))}
                  </ul>
                </div>
              </section>
            </>
          ) : null}

          {drawer === 'log' ? (
            <>
              <SheetHeader>
                <SheetTitle>Run Log</SheetTitle>
                <SheetDescription>Chronological action trail.</SheetDescription>
              </SheetHeader>

              <section className="mt-4 rounded-[4px] border border-[#2b3f2d] bg-black/25 p-3 font-mono text-sm text-[#8ed596]">
                <div className="max-h-[72dvh] space-y-1 overflow-y-auto pr-1">
                  {state.log.length ? (
                    state.log.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)
                  ) : (
                    <p className="text-[#6ea775]">No log entries.</p>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(activeEndingId) && prizeOpen}
        onOpenChange={(open) => {
          if (open) {
            setPrizeOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-md border-2 border-dashed border-[#6a7b6c] bg-[#0b0d0b] p-0 text-[#e6e6e6] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_40px_rgba(0,0,0,0.7)] [&>button]:hidden">
          <div className={cn('chamber-prize-shake p-4 sm:p-5', prizeDownloaded ? 'chamber-prize-still' : '')}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a3aba4]">System Alert</p>
                <DialogTitle className="mt-1 font-mono text-2xl uppercase tracking-wide text-[#f3f3f3]">YOU WON!</DialogTitle>
              </div>
              <p className="animate-pulse font-mono text-xl leading-none text-[#f3f3f3]">!!</p>
            </div>

            <DialogDescription className="font-mono text-xs uppercase tracking-[0.09em] text-[#c9ccca]">
              A PRIZE HAS BEEN DETECTED ON YOUR SYSTEM.
            </DialogDescription>
            <p className="mt-3 font-mono text-[11px] leading-5 text-[#aeb4af]">
              Click CLAIM to download. Do not close this window (closing does nothing).
            </p>

            {!prizeDownloaded ? (
              <div className="mt-4 grid gap-2">
                <Button
                  type="button"
                  onClick={claimPrize}
                  className="min-h-11 justify-center border border-[#b9beb9] bg-[#d7dcd7] font-mono text-xs uppercase tracking-[0.08em] text-[#0a0c0a] hover:bg-white"
                >
                  CLAIM PRIZE
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNoThanksClicks((current) => current + 1)}
                  className="min-h-10 border border-[#505652] bg-[#161a17] font-mono text-[11px] uppercase tracking-[0.08em] text-[#c8cdc8] hover:bg-[#202420]"
                >
                  NO THANKS (SUSPICIOUS)
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#f0f3f0]">
                  DOWNLOAD INITIATED. YOU ARE FREE (CONDITIONAL).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={startNewGame}
                    className="min-h-10 border border-[#2e3430] bg-[#d7dcd7] font-mono text-[11px] uppercase tracking-[0.08em] text-[#101310] hover:bg-white"
                  >
                    NEW RUN
                  </Button>
                  {!embedded ? (
                    <Button
                      asChild
                      type="button"
                      variant="ghost"
                      className="min-h-10 border border-[#505652] bg-[#161a17] font-mono text-[11px] uppercase tracking-[0.08em] text-[#c8cdc8] hover:bg-[#202420]"
                    >
                      <Link href="/">RETURN TO DESKTOP</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            <label className="mt-4 flex items-start gap-2 font-mono text-[10px] leading-4 text-[#8f9590]">
              <input
                type="checkbox"
                checked={prizeCheckbox}
                onChange={(event) => setPrizeCheckbox(event.target.checked)}
                className="mt-[2px] h-3 w-3 rounded-none border border-[#59605a] bg-black"
              />
              <span>I understand the Chamber is not responsible for loops.</span>
            </label>

            {noThanksClicks > 0 ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.07em] text-[#9ea49f]">
                Exit request denied. Prize remains attached.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new game?</DialogTitle>
            <DialogDescription>This clears the current run and starts from Gogo&apos;s loading dock.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={startNewGame}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes chamber-prize-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          22% {
            transform: translateX(-1.6px);
          }
          44% {
            transform: translateX(1.8px);
          }
          66% {
            transform: translateX(-1.2px);
          }
          88% {
            transform: translateX(1px);
          }
        }

        .chamber-prize-shake {
          animation: chamber-prize-shake 1.2s ease-in-out infinite;
        }

        .chamber-prize-still {
          animation: none;
        }
      `}</style>
    </main>
  );
}
