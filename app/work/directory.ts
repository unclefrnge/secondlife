import { workFolders } from '@/lib/work-folders';
import { broadcastYears } from './radio';

export type PlaybackSource = 'YouTube' | 'Apple Music' | 'Mixcloud'
  | { bandcamp: 'album' | 'track'; id: number };
export type WorkFile = {
  name: string;
  href: string;
  detail?: string;
  date?: string;
  calendarDate?: string;
  media?: PlaybackSource;
  playerTitle?: string;
  cover?: string;
  mark?: string;
};
export type WorkFolder = {
  slug: string;
  name: string;
  detail?: string;
  date?: string;
  note?: string;
  artwork?: { src: string; width: number; height: number };
  folders?: WorkFolder[];
  radio?: boolean;
  files?: WorkFile[];
};

const pearl: WorkFile = {
  name: 'Pearl In a Needlestack', detail: 'Neighbourhood SA feat. FRNGE · Neighbourhood Vol 1', date: '2023', calendarDate: '2023-07-21',
  cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/0c/1e/72/0c1e723b-3c5a-100b-209c-6ede2ec77aef/artwork.jpg/200x200bb.jpg',
        href: 'https://music.apple.com/za/album/pearl-in-a-needlestack-feat-frnge/1697968230?i=1697968237', media: 'Apple Music'
};

const debut: WorkFile = {
  name: 'Debut (FRNGE Remix)', detail: 'COBRAH · Songs I Changed Vol. 1', date: '2020', calendarDate: '2020-12-25',
  cover: 'https://f4.bcbits.com/img/a0023922669_5.jpg',
        href: 'https://frnge.bandcamp.com/track/cobrah-debut-frnge-remix', media: { bandcamp: 'track', id: 4109511575 }
};

const ownReleases: WorkFolder = {
  name: 'Own releases', slug: 'own-releases',
  folders: [
    { name: 'Remixes', slug: 'remixes', files: [
      { name: 'L U N E (FRNGE Remix)', detail: 'K A G E · SATURATE!', date: '2023', calendarDate: '2023-09-29',
        cover: 'https://f4.bcbits.com/img/a1547312133_5.jpg',
        href: 'https://saturaterecords.bandcamp.com/track/k-a-g-e-l-u-n-e-frnge-remix', media: { bandcamp: 'track', id: 1824350231 } },
      debut
    ] },
    { name: 'Features', slug: 'features', files: [
      pearl,
      { name: 'DREAM of ME', detail: 'trxstxssx feat. FRNGE · Recollection', date: '2020', calendarDate: '2020-03-20',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/12/79/34/127934e2-012b-ffc1-db8b-f798b5e2194d/artwork.jpg/200x200bb.jpg',
        href: 'https://music.apple.com/za/album/dream-of-me-feat-frnge/1502218463?i=1502218468', media: 'Apple Music' },
      { name: 'VOLT', detail: 'trxstxssx feat. FRNGE · Recollection', date: '2020', calendarDate: '2020-03-20',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/12/79/34/127934e2-012b-ffc1-db8b-f798b5e2194d/artwork.jpg/200x200bb.jpg',
        href: 'https://music.apple.com/za/album/volt-feat-frnge/1502218463?i=1502218471', media: 'Apple Music' }
    ] },
    { name: 'Compilations', slug: 'compilations', files: [
      pearl,
      { name: 'Roilerbroom', detail: 'Ariana’s Collectivist Fantasies · SWAK CATALOG fundraiser', date: '2020', calendarDate: '2020-07-03',
        cover: 'https://f4.bcbits.com/img/a1609405718_5.jpg',
        href: 'https://swakcatalog1.bandcamp.com/track/roilerbroom', media: { bandcamp: 'track', id: 1745529645 } },
      { name: 'Somnil', detail: 'V.A Collection Plate · Wet Dreams Recordings', date: '2020', calendarDate: '2020-05-01',
        cover: 'https://f4.bcbits.com/img/a0322734433_5.jpg',
        href: 'https://wetdreamsrecordings.bandcamp.com/track/frnge-somnil', media: { bandcamp: 'track', id: 3951078513 } },
      { name: 'Anxiety', detail: 'Stay True Beat Series Vol. 1 · Stay True Sounds', date: '2018', calendarDate: '2018-02-02',
        cover: 'https://f4.bcbits.com/img/a0412340402_5.jpg',
        href: 'https://staytruesounds.bandcamp.com/track/frnge-anxiety', media: { bandcamp: 'track', id: 1722983419 } },
      { name: 'Blood Nail', detail: 'Friends With Benefits · Biblo.tv vinyl compilation', date: '2017', calendarDate: '2017-11-10',
        cover: 'https://f4.bcbits.com/img/a0170694555_5.jpg',
        href: 'https://biblotvcompilation.bandcamp.com/track/frnge-blood-nail', media: { bandcamp: 'track', id: 3150000232 } }
    ] }
  ],
  files: [
    { name: 'faking a smile for the snake', detail: 'Three-track EP · DISTORTION BOREDOM', date: '2022', calendarDate: '2022-09-06',
      cover: 'https://f4.bcbits.com/img/a3272761420_5.jpg',
        href: 'https://frnge.bandcamp.com/album/faking-a-smile-for-the-snake', media: { bandcamp: 'album', id: 1183160054 } },
    { name: 'Distorted Songs for Distorted People', detail: 'Five-track EP · Wet Dreams Recordings', date: '2020', calendarDate: '2020-08-07',
      cover: 'https://f4.bcbits.com/img/a2808485320_5.jpg',
      href: 'https://frnge.bandcamp.com/album/distorted-songs-for-distorted-people', media: { bandcamp: 'album', id: 2962705657 } },
    { name: 'Soft Colours', detail: 'Ambient EP · Occhiolism Records', date: '2019', calendarDate: '2019-09-05',
      cover: 'https://f4.bcbits.com/img/a0869426531_5.jpg',
        href: 'https://occhiolismrecords.bandcamp.com/album/soft-colours', media: { bandcamp: 'album', id: 1828528073 } },
    { name: 'A Temporary Escape', detail: 'Debut EP · I Suppose Ja', date: '2016', calendarDate: '2016-11-15',
      cover: 'https://f4.bcbits.com/img/a0558322635_5.jpg',
        href: 'https://frnge.bandcamp.com/album/a-temporary-escape', media: { bandcamp: 'album', id: 1013383741 } }
  ]
};

const production: WorkFolder = {
  name: 'Production credits', slug: 'production-credits',
  files: [
    { name: 'Deeper the Machine Dream, Deeper Goes the Learning', detail: 'Jaco van der Merwe · mastering', date: '2023',
      href: 'https://www.litnet.co.za/jaco-van-der-merwe-onderhoud-woordkunstenaar-en-kultuurbewaarder/' },
    { name: 'Black 02', detail: 'FRNGE · production, mixing and mastering', date: '2022', calendarDate: '2022-09-30',
      cover: 'https://f4.bcbits.com/img/a1916223999_5.jpg',
        href: 'https://frnge.bandcamp.com/album/black-02', media: { bandcamp: 'album', id: 3621837398 } },
    { name: 'group chat', detail: 'Co-produced with trxstxssx and Tzara · mixed with trxstxssx', date: '2022', calendarDate: '2022-03-11',
      cover: 'https://f4.bcbits.com/img/a1984198084_5.jpg',
        href: 'https://frnge.bandcamp.com/album/group-chat', media: { bandcamp: 'album', id: 3400547181 } }
  ]
};

const press: WorkFile[] = [
  { date: '2025', name: 'Curation Hour', mark: '/work/press/curation-hour.png', detail: 'Kate S on collaborating with FRNGE for Dissipate', href: 'https://www.curationhour.com/features/dissipate' },
  { date: '2024', name: 'Zkhiphani', mark: '/work/press/zkhiphani.png', detail: 'Artist feature · Diesel × NTS TRACKS SA', href: 'https://www.zkhiphani.co.za/nts-x-diesel-tracks-sa-presents-frnge/' },
  { date: '2024', name: 'ZiFM Stereo', mark: '/work/press/zifm-stereo.png', detail: 'Diesel × NTS TRACKS SA · syndicated artist announcement', href: 'https://zifmstereo.co.zw/nts-x-diesel-tracks-sa-presents-frnge/' },
  { date: '2023', name: 'Texx and the City', mark: '/work/press/texx-and-the-city.png', detail: 'Artist interview · SpotlightOn FRNGE', href: 'https://texxandthecity.com/2023/12/spotlighton-frnge-a-daring-electronic-artist-who-thrives-off-of-discomfort/' },
  { date: '2023', name: 'LitNet', mark: '/work/press/litnet.png', detail: 'Jaco van der Merwe on mastering with FRNGE', href: 'https://www.litnet.co.za/jaco-van-der-merwe-onderhoud-woordkunstenaar-en-kultuurbewaarder/' },
  { date: '2022', name: 'Glamcult', mark: '/work/press/glamcult.png', detail: 'DJ Premium Timeflex credits FRNGE with founding DISTORTION BOREDOM', href: 'https://www.glamcult.com/articles/meet-the-line-up-dj-premium-timeflex/' },
  { date: '2021', name: 'No Bells', mark: '/work/press/no-bells.png', detail: 'Allison Harris on the COBRAH remix in Mugler’s collection film', href: 'https://nobells.blog/2021_listoflists/' },
  { date: '2021', name: 'Ringtone Mag', mark: '/work/press/ringtone-mag.png', detail: 'Fashion column · the sound of Mugler’s collection film', href: 'https://www.ringtonemag.com/articles/hautepop-a-hyperpop-fashion-column-november' },
  { date: '2021', name: 'Dance Wax', mark: '/work/press/dance-wax.png', detail: 'Kai van Dongen recommends catching FRNGE live in South Africa', href: 'https://dancewax.net/2021/09/20/on-the-rise-kai-van-dongen/' },
  { date: '2021', name: 'Origins Sound', mark: '/work/press/origins-sound.png', detail: 'SHE Spells Doom names FRNGE among the South African artists inspiring him', href: 'https://www.originssound.com/os-tapes/shespellsdoom' },
  { date: '2021', name: 'Design Scene', mark: '/work/press/design-scene.png', detail: 'Mugler film soundtrack credits · COBRAH’s “Debut” (FRNGE remix)', href: 'https://www.designscene.net/2021/10/mugler-fw21.html' },
  { date: '2021', name: 'New York Style Guide', mark: '/work/press/new-york-style-guide.png', detail: 'Mugler film soundtrack credits · COBRAH’s “Debut” (FRNGE remix)', href: 'https://newyorkstyleguide.com/mugler-fall-winter-2021-film/' },
  { date: '2020', name: 'Resident Advisor', mark: '/work/press/resident-advisor.png', detail: 'Bandcamp Friday, 7 August · Distorted Songs for Distorted People', href: 'https://ra.co/news/73166' },
  { date: '2020', name: 'Bubblegum Club', mark: '/work/press/bubblegum-club.png', detail: 'EP review · Distorted Songs for Distorted People', href: 'https://archive.bubblegumclub.co.za/music/distorted-songs-for-distorted-people-delves-deep-into-dark-ambient-self-exploration/' },
  { date: '2017', name: 'The Way of Us', mark: '/work/press/the-way-of-us.png', detail: 'Markus Wormstorm on “Blood Nail” for Friends With Benefits', href: 'https://superbalist.com/thewayofus/2017/11/06/markus-wormstorm-friends-with-benefits/11793' },
  { date: '2016', name: 'Nowamuzyka', mark: '/work/press/nowamuzyka.png', detail: 'Guest credit as Two Lives Left on Buli’s Feels', href: 'https://www.nowamuzyka.pl/2016/10/22/eksperymentalne-oblicze-rpa-czesc-trzydziesta-pierwsza/' },
  { date: '2016', name: 'The BASSics', mark: '/work/press/the-bassics.png', detail: 'Debut EP feature · A Temporary Escape', href: 'https://thebassicsblog.wordpress.com/2016/11/17/frnge-a-temporary-escape-debut-ep-release/' }
];

export const portfolio: WorkFolder = {
  name: 'Portfolio',
  slug: '',
  folders: [
    {
      ...workFolders.selected,
      folders: [
        {
          name: 'Dissipate', slug: 'dissipate', detail: 'Original music for a dance film', date: '2025',
          artwork: { src: '/work/dissipate.webp', width: 1280, height: 720 },
          note: 'I wrote the music for Kate S’s short film with dancer Zara Asa. Chamber Collective presented the film.',
          files: [
            { name: 'Watch Dissipate', playerTitle: 'Dissipate', media: 'YouTube', href: 'https://www.youtube.com/watch?v=0Ja4hN7_5jw' },
            { name: 'Kate S in Curation Hour', detail: 'Director interview', href: 'https://www.curationhour.com/features/dissipate' }
          ]
        },
        {
          name: 'Diesel × NTS', slug: 'diesel-nts', detail: 'TRACKS SA mix and artist feature', date: '2024',
          artwork: { src: '/work/diesel-nts-tracks.svg', width: 597, height: 104 },
          note: 'I recorded a techno and electro mix for the Cape Town edition of TRACKS SA.',
          files: [
            { name: 'Listen to the mix', detail: 'Diesel South Africa', href: 'https://diesel.co.za/pages/frnge' },
            { name: 'Watch the artist feature', detail: 'Diesel × NTS', playerTitle: 'Diesel × NTS · FRNGE', media: 'YouTube', href: 'https://www.youtube.com/watch?v=HFTg-ZblVYw' }
          ]
        },
        {
          name: 'Mugler', slug: 'mugler', detail: 'Fall/Winter 2021–22 collection film', date: '2021',
          artwork: { src: '/work/mugler.svg', width: 1506, height: 209 },
          note: 'TORSO’s film for Casey Cadwallader’s Fall/Winter 2021–22 collection features my remix of “Debut” by COBRAH.',
          files: [
            { name: 'Watch the collection film', playerTitle: 'Mugler · Fall/Winter 2021–22', media: 'YouTube', href: 'https://www.youtube.com/watch?v=_7Tz_uElg-g' },
            debut
          ]
        }
      ]
    },
    {
      ...workFolders.releases,
      folders: [
        ownReleases,
        production,
        { name: 'Distortion Chamber', slug: 'distortion-chamber', radio: true, detail: 'My show on The Other Radio', date: '2021–23',
          note: 'For my monthly show on The Other Radio, I brought in my red portable drive and played the music I’d found that month. Guests joined me for some of the broadcasts.',
          folders: broadcastYears },
        { name: 'Radio appearances', slug: 'radio-appearances', radio: true, files: [
          { name: 'The R.I.P Show', detail: 'Guest appearance · Subtle Radio', date: '18 Mar 2025',
            href: 'https://www.mixcloud.com/subtleradio/the-rip-show-ft-frnge-18032025/', media: 'Mixcloud' },
          { name: 'GRRL on NTS', detail: 'GRRL played my edit of “Yardman” by Scratcha DVA and Trim', date: '13 Mar 2025',
            href: 'https://www.mixcloud.com/NTSRadio/grrl-13th-march-2025/', media: 'Mixcloud' },
          { name: 'Vaxxed Up On Five', detail: 'Guest mix · 5FM', date: '3 Sep 2021',
            href: 'https://www.mixcloud.com/frnge/frnge-vaxxed-up-on-five-5fm-guestmix/', media: 'Mixcloud' },
          { name: 'Gone Astray with Rose Bonica', detail: 'Guest mix · The Other Radio', date: '2 Oct 2020',
            href: 'https://www.mixcloud.com/TheOtherRadio/gone-astray-w-rose-bonica-ft-frnge-021020/', media: 'Mixcloud' }
        ] }
      ]
    },
    { ...workFolders.press, files: press }
  ]
};

export function folderTrail(path: string[]) {
  const trail = [portfolio];
  for (const slug of path) {
    const child = trail[trail.length - 1].folders?.find(folder => folder.slug === slug);
    if (!child) return null;
    trail.push(child);
  }
  return trail;
}

export function folderPaths(folder: WorkFolder = portfolio, path: string[] = []): string[][] {
  return [path, ...(folder.folders ?? []).flatMap(child => folderPaths(child, [...path, child.slug]))];
}
