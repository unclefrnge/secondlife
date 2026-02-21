import type { AppendixItem, Track } from '@/lib/types';

export const audioBaseUrl = 'https://pub-253937541e654a4584ad79958b1ed95e.r2.dev';

export const project = {
  title: 'SECOND LIFE',
  subtitle: 'six chapters, recovered and released',
  ogDescription: 'A minimalist listening space for six chapters.',
  infoGuidedLine: 'Guided adds a short lead-in before first play.',
  infoDirectLine: 'Direct starts immediately.',
  infoReplayLine: 'Replays are always instant.',
  footerMicrocopy: 'Streaming, purchase, and free download available.'
};

export const tracks: Track[] = [
  {
    id: 'owe-me-nothing',
    order: 1,
    title: 'Owe Me Nothing',
    audioFile: 'Owe Me Nothing.mp3',
    embedUrl: 'https://untitled.stream/library/project/second-life-01',
    leadIn: {
      type: 'breathing-ring',
      durationMs: 8800
    }
  },
  {
    id: 'let-there-be-ghosts',
    order: 2,
    title: 'Let There Be Ghosts (ft. Killian Black)',
    audioFile: 'Let There Be Ghosts (feat. Killian Black).mp3',
    embedUrl: 'https://untitled.stream/library/project/second-life-02',
    leadIn: {
      type: 'align-dots',
      durationMs: 9200,
      driftSpeed: 'normal'
    }
  },
  {
    id: 'forest-lullaby',
    order: 3,
    title: 'Forest Lullaby',
    audioFile: 'Forest Lullaby.mp3',
    embedUrl: 'https://untitled.stream/library/project/second-life-03',
    leadIn: {
      type: 'breathing-ring',
      durationMs: 8600
    }
  },
  {
    id: 'same-body-different-spirit',
    order: 4,
    title: 'Same Body, Different Spirit',
    audioFile: 'Same Body, Different Spirit.mp3',
    embedUrl: 'https://untitled.stream/library/project/second-life-04',
    leadIn: {
      type: 'align-dots',
      durationMs: 9800,
      driftSpeed: 'slow'
    }
  },
  {
    id: 'healing',
    order: 5,
    title: 'Healing',
    audioFile: 'Healing.mp3',
    embedUrl: 'https://untitled.stream/library/project/second-life-05',
    leadIn: {
      type: 'breathing-ring',
      durationMs: 11200
    }
  },
  {
    id: 'ethics-of-sampling',
    order: 6,
    title: 'Ethics of Sampling',
    audioFile: 'Ethics of Sampling.mp3',
    embedUrl: 'https://untitled.stream/library/project/second-life-06',
    leadIn: {
      type: 'align-dots',
      durationMs: 8900,
      driftSpeed: 'fast'
    }
  }
];

export const interstitialLines = [
  'continue when ready',
  'no rush',
  'next chapter'
];

export const accessLinks = {
  stream: {
    spotify: 'https://open.spotify.com/',
    soundcloud: 'https://soundcloud.com/',
    appleMusic: 'https://music.apple.com/',
    untitled: 'https://untitled.stream/'
  },
  support: {
    bandcamp: 'https://bandcamp.com/'
  }
};

export const downloadConfig = {
  mp3Url: 'https://example.com/second-life/second-life.zip?format=mp3',
  wavUrl: 'https://example.com/second-life/second-life.zip?format=wav',
  artworkUrl: 'https://example.com/second-life/second-life-artwork.zip',
  providerHostedSignupUrl: 'https://example-newsletter-provider.com/signup'
};

export const stealLinks = {
  soulseekRoomUrl: 'https://example.com/soulseek/chamber-collective-room',
  magnetUrl: 'magnet:?xt=urn:btih:0000000000000000000000000000000000000000&dn=second-life'
};

export const newsletter = {
  providerName: 'Chamber Collective',
  submitButtonLabel: 'Subscribe and continue'
};

export const appendixItems: AppendixItem[] = [
  {
    trackId: 'owe-me-nothing',
    title: 'Owe Me Nothing',
    artefactType: 'note',
    content: 'Vocal comp note: first take remained untouched in the opening section.'
  },
  {
    trackId: 'let-there-be-ghosts',
    title: 'Let There Be Ghosts',
    artefactType: 'note',
    content: 'Guest line retained natural room tone. No additional brightening in the second verse.'
  },
  {
    trackId: 'forest-lullaby',
    title: 'Forest Lullaby',
    artefactType: 'patch',
    content: 'Field texture sits -18 LUFS below the stem bus with gentle low-pass automation.'
  },
  {
    trackId: 'same-body-different-spirit',
    title: 'Same Body, Different Spirit',
    artefactType: 'note',
    content: 'Arrangement memo: one synth voice removed in the bridge to preserve headroom.'
  },
  {
    trackId: 'healing',
    title: 'Healing',
    artefactType: 'patch',
    content: 'Final limiter ceiling lowered by 0.3 dB. Dynamics remain intentionally soft.'
  },
  {
    trackId: 'ethics-of-sampling',
    title: 'Ethics of Sampling',
    artefactType: 'note',
    content: 'Clearance log excerpt: source attribution attached to archive copy, revision 4.'
  }
];
