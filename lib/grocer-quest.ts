import type { WorldSave } from './intercom';

// New fiction set at Gogo's Grocer. See Chamber Times entry 202 and docs/LORE.md.
type SceneId = 'counter' | 'card' | 'bread' | 'properties' | 'trolley' | 'rack' | 'returns'
  | 'listening' | 'bakery-door' | 'practice' | 'shift-book' | 'credits' | 'spare-wheel' | 'tea-tray' | 'call-sheet'
  | 'track-id' | 'side-b' | 'rehearsal' | 'exchange' | 'repair' | 'staff-tea';
type Scene = { title: string; text: string; choices?: readonly [Choice, Choice] };
type Choice = readonly [label: string, next: SceneId];

export const grocerScenes: Record<SceneId, Scene> = {
  counter: {
    title: 'two brown loaves',
    text: 'At Gogo’s Grocer you put a loaf and a blank SD card on the counter. The slip says TWO BROWN LOAVES. The cashier looks at the card. “Do you want that one sliced as well?”',
    choices: [['try the card in the till', 'card'], ['ask for the second loaf', 'bread']]
  },
  card: {
    title: 'track one',
    text: 'There’s one recording on the card. Two till beeps, a shopping trolley with a bad wheel, then two more beeps. Someone in the queue leans in. “Sorry, whose mix is this?”',
    choices: [['open the file details', 'properties'], ['find the trolley', 'trolley']]
  },
  bread: {
    title: 'the bakery counter',
    text: 'The cashier fetches another loaf. You now have two loaves and an SD card. “I can put one back,” she says. Behind you, a man with a single tomato checks his watch.',
    choices: [['check the bread rack', 'rack'], ['ask about a return', 'returns']]
  },
  properties: {
    title: '06:12 on Tuesday',
    text: 'The file was made before the shop opened. The cashier remembers that morning. She was holding the microphone while somebody fetched a longer lead. She is still waiting for her headphones back.',
    choices: [['borrow the shop headphones', 'listening'], ['follow the lead to the bakery', 'bakery-door']]
  },
  trolley: {
    title: 'rear left',
    text: 'You push the nearest trolley half a metre. Wrong note. The man with the tomato lends you his. There it is. He holds the tomato against his chest while you do another lap for certainty.',
    choices: [['compare it on headphones', 'listening'], ['wheel it round to the bakery', 'bakery-door']]
  },
  rack: {
    title: 'held until lunch',
    text: 'There’s an empty space on the rack and a peg marked PRACTICE. Someone has been putting a loaf aside for the band every Tuesday. You’ve been thanking the drummer for months.',
    choices: [['phone the drummer', 'practice'], ['find out who put it aside', 'bakery-door']]
  },
  returns: {
    title: 'customer returns',
    text: 'The cashier turns her stool round. You go to the other side of the counter. “Morning again.” She lays the card and both loaves on a tea towel and gets out the book.',
    choices: [['look up the original order', 'shift-book'], ['see if rehearsal needs the bread', 'practice']]
  },
  listening: {
    title: 'left ear only',
    text: 'One ear works. Under the trolley squeak you hear a baker counting backwards from eight. You were expecting a count-in. At zero an oven door opens and a tray lands exactly on the beat.',
    choices: [['ask who to credit', 'credits'], ['listen for the wheel again', 'spare-wheel']]
  },
  'bakery-door': {
    title: 'cooling rack',
    text: 'At the back door a woman is cooling six loaves on the rack that usually holds the mixer. The mixer is on a bread crate. She sees you looking. “They were both the right height.”',
    choices: [['ask about Tuesday’s recording', 'credits'], ['give her a hand with tea', 'tea-tray']]
  },
  practice: {
    title: 'one voice note',
    text: 'The drummer answers from rehearsal. Chairs scrape. Someone asks if you can bring bread. Someone further from the phone asks if you can bring the recording. The drummer says yes to both on your behalf.',
    choices: [['write down what goes where', 'call-sheet'], ['ask the baker for a bread bag', 'tea-tray']]
  },
  'shift-book': {
    title: 'Tuesday’s order',
    text: 'The book says “one brown, one blank”. Underneath, in a different hand, it says “ask before formatting either”. The cashier runs a finger down the page. There’s a rehearsal address and a tiny drawing of a loose wheel.',
    choices: [['copy the rehearsal address', 'call-sheet'], ['ask about the drawing', 'spare-wheel']]
  },
  credits: {
    title: 'sleeve notes',
    text: 'The baker gives you her first name for the sleeve. For the trolley she writes “shop equipment”. She’d like a copy for her sister, who has never believed how early she gets here.',
    choices: [['write the track ID on the slip', 'track-id'], ['play the whole take for the queue', 'side-b']]
  },
  'spare-wheel': {
    title: 'a drop of oil',
    text: 'There’s a bottle of oil on the windowsill. The man with the tomato says the wheel has sounded like that since April. He quite likes it. His wife can hear him coming round the end of the aisle.',
    choices: [['oil the wheel', 'repair'], ['leave the wheel and play the take', 'side-b']]
  },
  'tea-tray': {
    title: 'the heel',
    text: 'The baker cuts the heel off the extra loaf and butters it standing up. It’s the first thing she’s eaten since six. She offers you the other heel, then sets out three cups without asking.',
    choices: [['stay and cut the rest for tea', 'staff-tea'], ['bag the bread for rehearsal', 'rehearsal']]
  },
  'call-sheet': {
    title: 'the back of the slip',
    text: 'On the back you draw a little map from Gogo’s to the practice room. The cashier crosses out the front entrance. “Take the side door. The bell’s on the recording, but it hasn’t worked in years.”',
    choices: [['take the order to rehearsal', 'rehearsal'], ['leave the spare loaf here', 'exchange']]
  },
  repair: {
    title: 'quiet aisle',
    text: 'One drop does it. The man pushes the trolley round the corner, humming the squeak himself on the turns. From somewhere behind the beans his wife says, “Is that you?”'
  },
  'staff-tea': {
    title: 'three cups',
    text: 'You eat at the counter with the baker and the cashier. The tomato man comes back for salt. By the time the band rings again there’s half a sandwich wrapped for the drummer and a clean copy of the take.'
  },
  'track-id': {
    title: 'bakery_final_final.wav',
    text: 'You read the name off the screen. Three people write it down. The cashier draws a little star beside the second loaf on your slip. “That one’s the single.”'
  },
  'side-b': {
    title: 'closing time',
    text: 'After a minute the squeaky wheel stops. A voice very close to the microphone says, “Is that still on?” A man buying a single tomato starts the applause.'
  },
  rehearsal: {
    title: 'catering',
    text: 'At rehearsal everyone thanks you for sorting out supper. You find the SD card in the bread bag. There’s butter in the little write-protect switch, but the session opens.'
  },
  exchange: {
    title: 'one for the road',
    text: 'The cashier takes back the spare loaf and slips the card into your change. On the bag she writes BREAD in biro. “Just in case you need to plug something in later.”'
  }
};

const encounterId = 'gogos-till-01';
export const TILL_SLIP = 'gogos-till-slip';
export const tillSlip = {
  name: 'till-slip.txt',
  shop: 'GOGO’S GROCER',
  item: 'BROWN LOAF',
  quantity: '× 2',
  note: 'Second item brought to till in an SD card case.',
  closing: 'Please keep this slip.'
} as const;
type Progress = { scene: SceneId; hasSlip: boolean };
const initial: Progress = { scene: 'counter', hasSlip: false };

export function grocerProgress(save: WorldSave): Progress {
  const stored = save.encounters[encounterId];
  if (!stored || typeof stored !== 'object' || !('scene' in stored)
    || typeof stored.scene !== 'string' || !Object.hasOwn(grocerScenes, stored.scene)) return initial;
  return { scene: stored.scene as SceneId, hasSlip: 'hasSlip' in stored && stored.hasSlip === true };
}

export function chooseGrocerScene(save: WorldSave, next: SceneId): WorldSave {
  const current = grocerProgress(save);
  const choices = grocerScenes[current.scene].choices;
  if (choices ? !choices.some(([, id]) => id === next) : next !== 'counter') return save;
  const progress = { scene: next, hasSlip: current.hasSlip || !grocerScenes[next].choices };
  return { ...save, encounters: { ...save.encounters, [encounterId]: progress } };
}
