// Episode dates follow the station titles. The undated anniversary title uses its upload month.
const station = 'https://www.mixcloud.com/TheOtherRadio/';

const episodes = [
  { name: "FRNGE", date: "15 Nov 2023", recording: "distortion-chamber-w-frnge-151123", art: "9/8/f/0/143c-b296-4bbb-934b-e27fc74cbeb6" },
  { name: "With Analogue Andre", date: "18 Oct 2023", recording: "distortion-chamber-w-frnge-ft-analogue-andre-181023", art: "3/d/b/e/6809-b659-4157-a0b6-1f8a6ac3fc55" },
  { name: "FRNGE", date: "20 Sep 2023", recording: "distortion-chamber-w-frnge-200923", art: "4/0/5/8/80e8-03b0-4e26-906f-59f6b6c6d67f" },
  { name: "FRNGE", date: "16 Aug 2023", recording: "distortion-chamber-w-frnge-160823", art: "5/5/d/0/6e7f-b96b-4e7e-9ca1-e73a78d477fa" },
  { name: "With keepitbutter", date: "19 Jul 2023", recording: "distortion-chamber-w-frnge-ft-keepitbutter-190723", art: "e/0/0/3/2b6c-f420-46df-b9c5-25e438b7e064" },
  { name: "Season two opener", date: "21 Jun 2023", recording: "distortion-chamber-w-frnge-s2-ep1-210623", art: "8/2/1/5/23ac-9c06-440f-9856-5871f68d6522" },
  { name: "Anniversary mix with NXCK, Odous & Ripchord", date: "Aug 2022", recording: "distortion-chamber-w-frnge-ep-12-ft-nxck-odous-ripchord", art: "b/a/b/b/5307-6393-459a-b65e-fdb030efbe16" },
  { name: "With DJ Premium Timeflex", date: "18 Jul 2022", recording: "distortion-chamber-w-frnge-ep-11-ft-dj-premium-timeflex-180722", art: "e/3/1/b/f818-4ef6-42bf-89e3-2621d356c69c" },
  { name: "With qik.uh", date: "20 Jun 2022", recording: "distortion-chamber-w-frnge-ft-qikuh-200622", art: "4/3/2/1/8d19-9916-48ba-a99b-81e8a89c24d5" },
  { name: "With RamonPang", date: "16 May 2022", recording: "distortion-chamber-w-frnge-ft-ramonpang-160522", art: "2/3/9/0/aab6-79f6-4b1e-8c91-fe4856fd40b2" },
  { name: "FRNGE", date: "18 Apr 2022", recording: "distortion-chamber-w-frnge-180422", art: "1/c/3/b/90d5-8ec7-4f0a-8e6d-c5a0196c7abf" },
  { name: "FRNGE", date: "21 Mar 2022", recording: "distortion-chamber-w-frnge-210322", art: "6/d/0/0/d482-7274-41f3-949d-205505eaf4eb" },
  { name: "FRNGE", date: "22 Feb 2022", recording: "distortion-chamber-w-frnge-220222", art: "0/0/e/9/33e6-0847-45d4-b338-3e7c763b911f" },
  { name: "FRNGE", date: "24 Jan 2022", recording: "distortion-chamber-w-frnge-240122", art: "8/b/f/2/d923-86e9-45f7-87db-ae84dd06d161" },
  { name: "FRNGE", date: "23 Nov 2021", recording: "distortion-chamber-w-frnge-231121", art: "e/c/b/4/2657-964f-4e2a-a7f0-0af5de077ae0" },
  { name: "FRNGE", date: "26 Oct 2021", recording: "distortion-chamber-w-frnge-261021", art: "e/6/4/d/c230-9b8e-47a4-bc77-2c816c1c180e" },
  { name: "FRNGE", date: "29 Sep 2021", recording: "distortion-chamber-w-frnge-290921", art: "7/9/d/8/a183-b7d4-4a20-ad0f-07809def4ef0" },
  { name: "First broadcast", date: "24 Aug 2021", recording: "distortion-chamber-w-frng-240821", art: "9/8/e/8/923c-3613-4156-a278-cf25443653b2" }
].map(({ name, date, recording, art }) => ({
  name: date, detail: name, playerTitle: 'Distortion Chamber · ' + date,
  cover: 'https://thumbnailer.mixcloud.com/unsafe/300x300/extaudio/' + art,
  href: station + recording + '/', media: 'Mixcloud' as const
}));

export const broadcastYears = [...new Set(episodes.map(episode => episode.name.slice(-4)))].map(year => {
  const files = episodes.filter(episode => episode.name.endsWith(year));
  return { name: year, slug: year, detail: files.length + ' broadcasts', files };
});
