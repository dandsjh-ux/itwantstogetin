// Vocabulary database for "It Wants To Get In".
// Words are pitched a couple of school years BELOW each level's label and chosen for atmosphere:
// how things look, sound, feel and smell in a haunted house, and the tone/mood of a scene.
//
// Format per line: word | definition | synonyms (comma, or -) | antonym (or -) | sentence with ___ | category | part of speech
// Distractors always come from a different category (so only one answer fits) and, where possible,
// the same part of speech (so grammar never gives the answer away).

const RAW = {
  y34: `
scary|makes you feel afraid|frightening|nice|The dark cellar was very ___.|fear|adj
afraid|feeling fear|scared|brave|I was ___ of the noise in the dark.|feel|adj
frightened|very scared|scared,afraid|calm|The ___ girl hid under her bed.|feel|adj
nervous|a bit worried and shaky inside|worried|calm|He felt ___ on the dark stairs.|feel|adj
brave|not afraid, even when things are scary|bold|scared|The ___ boy opened the creaky door.|trait|adj
dark|with no light|-|bright|The cellar was so ___ I could not see my hand.|dark|adj
dim|with only a little light|faint|bright|A ___ candle lit the hall.|dark|adj
shadow|a dark shape made when light is blocked|shade|light|A tall ___ moved across the wall.|dark|noun
night|the time when it is dark outside|-|day|The ghost only comes out at ___.|dark|noun
mist|thin cloud near the ground|fog|-|Thick ___ covered the garden.|dark|noun
moon|the bright round light in the night sky|-|-|The ___ shone through the dusty window.|light|noun
candle|a stick of wax that gives a small light|-|-|The ___ flickered and went out.|light|noun
flicker|to shine on and off|blink|-|The lights began to ___.|light|verb
glow|to give off a soft light|shine|-|Two eyes began to ___ in the dark.|light|verb
quiet|making very little noise|silent|loud|The house was ___ and still.|sound|adj
silent|with no sound at all|quiet|noisy|It was so ___ that I could hear my heart.|sound|adj
loud|making a lot of noise|noisy|quiet|A ___ bang made me jump.|sound|adj
creaky|making a long, squeaky sound|squeaky|silent|The ___ door opened by itself.|sound|adj
whisper|to speak very softly|murmur|shout|The ghost leaned close and began to ___ in my ear.|sound|verb
knock|to hit a door to be let in|tap|-|Someone began to ___ on the door with their fist.|sound|verb
scratch|to scrape with sharp nails|scrape|-|Something began to ___ at the window with long, sharp nails.|sound|verb
howl|to make a long, sad cry|wail|-|The wind began to ___ like a sad wolf outside.|sound|verb
scream|to shout in a high voice because you are scared|shriek|-|She began to ___ at the top of her voice.|sound|verb
hiss|to make a long "sss" sound, like a snake|-|-|The thing began to ___ like an angry snake through the keyhole.|sound|verb
bang|a sudden, loud noise|crash|-|A ___ came from the attic.|sound|noun
thump|a dull, heavy sound|bump|-|I heard a ___ on the stairs above.|sound|noun
echo|a sound that comes back after you shout|-|-|My shout made an ___ in the cellar.|sound|noun
thunder|the loud rumble in the sky in a storm|-|-|___ shook the whole house.|sound|noun
storm|wild weather with wind, rain and thunder|-|-|A ___ rattled the windows all night.|mood|noun
cold|not warm|chilly|hot|The ghost's hand felt ___ as ice.|cold|adj
icy|very, very cold, like ice|freezing|warm|An ___ breath touched my neck.|cold|adj
freezing|so cold that you shake|icy|hot|The cellar was ___ and dark.|cold|adj
shiver|to shake a little from cold or fear|shake|-|The cold wind made me ___.|cold|verb
damp|a little bit wet|moist|dry|The cellar walls were ___ and smelled of mould.|decay|adj
dusty|covered in dust|dirty|clean|The ___ books had not been touched for years.|decay|adj
dirty|not clean|grubby|clean|The floor was ___ and covered in footprints.|decay|adj
broken|in pieces or not working|smashed|fixed|A ___ window let in the cold wind.|decay|adj
cracked|with thin lines where it has split|split|whole|The ___ mirror showed two faces.|decay|adj
rotten|old and gone bad|-|fresh|The ___ floor was soft and wet.|decay|adj
cobweb|a thin web made by a spider|-|-|An old ___ hung in the corner.|decay|noun
pale|very light in colour, like a ghost|white|rosy|The ghost had a ___ face with no colour.|look|adj
sharp|able to cut|pointy|blunt|The monster had ___ claws.|look|adj
thin|not fat, with very little flesh|skinny|fat|A ___ hand came through the gap.|look|adj
tall|very high|-|short|A ___ shadow stood by the door.|size|adj
huge|very, very big|giant|tiny|A ___ spider hung over the bed.|size|adj
tiny|very small|little|huge|I saw ___ footprints on the floor.|size|adj
old|made a long time ago|ancient|new|The ___ house creaked in the wind.|age|adj
ghost|the spirit of a person who has died|spirit|-|A ___ floated down the hall.|ghost|noun
spooky|a bit scary, as if ghosts are near|creepy|-|The old house felt ___ at night.|ghost|adj
creepy|strange and a little scary|spooky|-|A ___ doll sat on the stairs.|ghost|adj
haunted|visited by ghosts|-|-|People say this house is ___.|ghost|adj
monster|a big, scary creature|beast|-|A ___ was hiding in the cupboard.|ghost|noun
vanish|to suddenly disappear|disappear|appear|Blink, and the face will ___.|ghost|verb
float|to drift in the air|drift|sink|The ghost began to ___ up the stairs.|ghost|verb
creep|to move slowly and quietly|sneak|stomp|I had to ___ past the sleeping dog.|move|verb
sneak|to move quietly so no one sees you|creep|-|The cat began to ___ in through the flap.|move|verb
tiptoe|to walk very quietly on your toes|-|stomp|We had to ___ past the bedroom.|move|verb
crawl|to move on your hands and knees|-|-|Something began to ___ out of the drain.|move|verb
hide|to go where no one can see you|-|seek|I ran to ___ under the bed.|move|verb
run|to go fast on your feet|dash|walk|Quick, ___ as fast as you can to the salt circle!|move|verb
jump|to push yourself up into the air|leap|-|The loud bang made me ___ right out of my seat.|move|verb
shake|to move quickly up and down|tremble|-|The ground began to ___ and the pictures fell off the wall.|move|verb
strange|not normal; a bit odd|odd|normal|A ___ smell came from the cellar.|mood|adj
sad|unhappy|unhappy|happy|The ghost looked very ___.|mood|adj
angry|very cross|cross|calm|The ghost was ___ that we were there.|mood|adj
lonely|sad because you are all alone|-|-|The big, empty house felt ___.|mood|adj
still|not moving at all|-|moving|Nothing moved. Everything was ___.|mood|adj
sudden|happening very quickly|-|slow|A ___ noise made us all jump.|mood|adj
empty|with nothing or no one inside|-|full|The room was ___, but the chair was rocking.|place|adj
`,
  y67: `
dreadful|very bad or frightening|terrible|lovely|A ___ scream came from the attic.|fear|adj
terrified|so scared you can hardly move|petrified|calm|She was ___ when the handle turned.|feel|adj
uneasy|worried and not relaxed|anxious|calm|I felt ___ in the quiet house.|feel|adj
trapped|not able to get away|stuck|free|We felt ___ inside the locked house.|feel|adj
tense|nervous and waiting for something to happen|-|relaxed|The air felt ___ just before the knock.|mood|adj
curious|wanting to find out about something|nosy|bored|The ___ girl opened the cellar door.|trait|adj
cautious|being careful to avoid danger|careful|careless|Be ___ on the creaky stairs.|trait|adj
wicked|very bad or evil|evil|good|A ___ laugh drifted down the chimney.|trait|adj
sneaky|doing things secretly|sly|honest|The ___ shadow slipped behind the curtain.|trait|adj
ghostly|pale and see-through, like a ghost|phantom|solid|A ___ figure floated past the window.|ghost|adj
eerie|strange and a little frightening|spooky|ordinary|An ___ glow came from under the door.|ghost|adj
creature|a living thing, often strange or scary|beast|-|A ___ was moving in the dark.|ghost|noun
fade|to slowly become less clear|-|appear|The face began to ___ away.|ghost|verb
gloomy|dark and sad-looking|dim|bright|The attic was ___ and full of shadows.|dark|adj
shadowy|full of shadows|dark|sunny|Something moved in the ___ corner.|dark|adj
pitch-black|completely dark|very dark|bright|The cellar was ___ when the torch went out.|dark|adj
foggy|full of thick mist|misty|clear|The garden was ___ and grey.|dark|adj
lurk|to wait, hidden and ready to jump out|hide|-|Something likes to ___ under the stairs.|move|verb
tremble|to shake because you are scared|shiver|-|My hands began to ___.|move|verb
scurry|to run with quick, little steps|scamper|dawdle|Mice ___ away from the light.|move|verb
stumble|to trip or nearly fall over|trip|-|I began to ___ and nearly fell down the dark stairs.|move|verb
slither|to slide along like a snake|slide|-|Something began to ___ across the floor like a snake.|move|verb
drift|to float slowly|float|-|The mist began to ___ slowly through the hall.|move|verb
rattle|to shake and knock noisily|clatter|-|The window began to ___ in its frame.|sound|verb
shriek|a sudden, high scream|screech|whisper|A ___ echoed through the house.|sound|noun
moan|a low sound of pain or sadness|groan|laugh|A low ___ came from the chimney.|sound|noun
murmur|a soft, low sound of people talking|whisper|-|A ___ of voices came from the wall.|sound|noun
hush|a sudden, deep quiet|-|noise|A ___ fell over the house.|sound|noun
faint|very quiet or hard to see|weak|clear|I heard a ___ whisper.|sound|adj
muffled|quiet because something is covering it|-|clear|A ___ cry came from behind the wall.|sound|adj
chilly|cold enough to make you shiver|cool|warm|The hall grew ___ as it came near.|cold|adj
frosty|covered in white frost; very cold|icy|hot|___ fingerprints appeared on the glass.|cold|adj
clammy|cold, damp and sticky|damp|dry|A ___ hand touched mine in the dark.|cold|adj
mouldy|covered in fuzzy growth caused by damp|-|fresh|A ___ smell came from the drain.|decay|adj
slimy|wet and slippery|slippery|dry|A ___ trail led away from the drain.|decay|adj
crumbling|falling apart in little pieces|-|-|The ___ walls turned to dust.|decay|adj
rusty|covered in orange-brown rust|-|shiny|The ___ gate creaked open.|decay|adj
faded|lost its colour or brightness|-|bright|The ___ photo showed three children.|decay|adj
abandoned|left empty and not looked after|deserted|cared-for|An ___ doll sat on the stairs.|place|adj
tattered|old and torn|ragged|new|Her ___ dress dragged along the floor.|look|adj
crooked|bent or not straight|twisted|straight|The ___ picture hung from one nail.|look|adj
hollow|empty inside|-|solid|The ghost had ___ eyes.|look|adj
bony|so thin you can see the bones|skinny|plump|A ___ hand came through the gap.|look|adj
jagged|sharp and uneven|spiky|smooth|___ glass stuck out of the frame.|look|adj
tangled|twisted together in a mess|knotted|neat|Her ___ black hair hung over her face.|look|adj
glimpse|a very quick look|-|-|I caught a ___ of a face at the window.|look|noun
stare|to look at something for a long time|gaze|-|The portrait seemed to ___ at me.|look|verb
peer|to look closely at something hard to see|-|-|I had to ___ into the dark.|look|verb
weird|very strange|odd|normal|There was a ___ scratching in the walls.|mood|adj
stormy|with strong wind, rain and thunder|wild|calm|It was a ___ night with no stars.|mood|adj
grim|serious and unpleasant|-|cheerful|The man in the painting had a ___ face.|mood|adj
peaceful|calm and quiet|-|troubled|The garden looked ___, until the shadow moved.|mood|adj
mysterious|strange and hard to explain|puzzling|ordinary|A ___ light glowed in the attic.|mood|adj
gigantic|extremely big|enormous|tiny|A ___ shadow filled the doorway.|size|adj
narrow|thin, not wide|slim|wide|The ___ stairs led up to the attic.|size|adj
ancient|very, very old|old|modern|An ___ clock ticked in the hall.|age|adj
gasp|a sudden breath in because you are shocked|-|-|She gave a loud ___ and dropped the torch.|sound|noun
rumble|a low, deep sound like thunder|-|-|A low ___ shook the floor.|sound|noun
stalk|to follow quietly and slowly, like a hunter|hunt|-|Something seemed to ___ me down the hall.|move|verb
swirl|to move round and round|twirl|-|Cold mist began to ___ around my feet.|move|verb
shimmer|to shine with a soft, shaky light|glimmer|-|The ghost seemed to ___ in the moonlight.|light|verb
glisten|to shine because it is wet|sparkle|-|The wet floor began to ___ in the torchlight.|light|verb
motionless|not moving at all|frozen|moving|The ghost stood ___ at the end of the hall.|mood|adj
gloom|a dark, sad feeling in a place|-|-|A heavy ___ filled the empty room.|mood|noun
dusk|the time just as it gets dark|twilight|dawn|We reached the old house at ___.|dark|noun
`,
  y910: `
ominous|giving a feeling that something bad will happen|threatening|promising|An ___ silence settled over the house.|fear|adj
menacing|looking dangerous, as if it might hurt you|threatening|harmless|A ___ shape stood behind the frosted glass.|fear|adj
gruesome|very horrible and shocking|grisly|pleasant|The old book told ___ stories.|fear|adj
unnerving|scary in a quiet way that makes you lose your nerve|unsettling|reassuring|The portrait's eyes were ___.|fear|adj
dread|great fear of something that might happen|terror|-|A cold ___ crept over me.|fear|noun
foreboding|a feeling that something bad is coming|dread|-|I felt a sense of ___ as the lights dimmed.|fear|noun
sinister|seeming evil or dangerous|evil|innocent|A ___ smile spread across the portrait.|trait|adj
malicious|wanting to hurt other people|spiteful|kind|A ___ voice hissed through the vent.|trait|adj
vengeful|wanting revenge|bitter|forgiving|Some say the woman in white is ___.|trait|adj
vigilant|watching carefully for danger|alert|careless|Stay ___, because it is never far away.|trait|adj
reluctant|not wanting to do something|unwilling|eager|I was ___ to climb into the attic.|trait|adj
wary|careful because you think there might be danger|cautious|trusting|Be ___ of anything that asks to come in.|trait|adj
spectral|like a ghost|ghostly|-|A ___ light flickered in the attic.|ghost|adj
apparition|a ghost or ghost-like figure|ghost|-|The ___ vanished when the lights came on.|ghost|noun
restless|not able to stay still or be at peace|uneasy|peaceful|The ___ ghost wanders the house every night.|ghost|adj
haunting|sad, beautiful and hard to forget|-|forgettable|A ___ lullaby played from the nursery.|sound|adj
petrified|so scared that you cannot move|terrified|calm|___, I stared at the doorway.|feel|adj
apprehensive|worried about what might happen|nervous|confident|I felt ___ about the cellar door.|feel|adj
bewildered|very confused|puzzled|certain|I was ___ because the door was locked from the inside.|feel|adj
isolated|far away from everyone else|cut off|crowded|The house felt ___ and cut off from the world.|place|adj
desolate|empty, bleak and lonely|bleak|lively|The ___ garden stretched into the fog.|place|adj
derelict|empty and falling to pieces|abandoned|well-kept|The ___ house next door had no lights.|place|adj
stifling|so hot and airless that it is hard to breathe|stuffy|fresh|The attic was ___ and dusty.|place|adj
claustrophobic|uncomfortably small and closed in|cramped|spacious|The ___ coal room made it hard to breathe.|place|adj
dilapidated|old and falling apart|crumbling|well-kept|A ___ shed leaned against the fence.|decay|adj
rickety|shaky and likely to break|wobbly|sturdy|The ___ banister creaked under my hand.|decay|adj
putrid|rotting and smelling horrible|rotten|fresh|A ___ smell rose from the drain.|decay|adj
pungent|having a very strong smell|strong|mild|The ___ smell of smoke drifted down the chimney.|decay|adj
musty|smelling old and damp|stale|fresh|The ___ attic smelled of old books.|decay|adj
ghastly|horrible and deathly pale|horrible|pleasant|A ___ face peered down the chimney.|look|adj
hideous|very ugly and horrible|repulsive|beautiful|A ___ creature pressed against the glass.|look|adj
grotesque|ugly in a strange, twisted way|twisted|beautiful|Its ___ fingers curled round the frame.|look|adj
gaunt|very thin and bony|haggard|plump|A ___ face appeared at the bathroom window.|look|adj
translucent|letting light through, but not clear like glass|see-through|opaque|Her ___ hand passed through the door.|look|adj
opaque|not letting any light through|cloudy|transparent|Through the ___ screen door I could only see a shape.|look|adj
silhouette|a dark outline seen against the light|outline|-|A tall ___ stood outside the screen door.|dark|noun
shrouded|covered up, hiding what is underneath|veiled|exposed|The furniture was ___ in white sheets.|dark|adj
murky|dark and hard to see through|cloudy|clear|___ water gurgled in the drain.|dark|adj
engulf|to cover or swallow up completely|swallow|-|Darkness began to ___ the hall.|dark|verb
obscure|to hide something from view|conceal|reveal|Long black hair seemed to ___ her face.|dark|verb
dismal|gloomy and depressing|dreary|cheerful|The ___ basement smelled of damp.|mood|adj
bleak|cold, empty and without hope|grim|hopeful|The night looked ___ and endless.|mood|adj
sombre|dark, serious and sad|solemn|cheerful|The family in the portrait wore ___ clothes.|mood|adj
forlorn|sad and lonely|-|cheerful|A ___ teddy bear sat in the cot.|mood|adj
oppressive|heavy and hard to bear|overwhelming|uplifting|An ___ silence filled the attic.|mood|adj
melancholy|deep, lasting sadness|sorrow|joy|A heavy ___ hung over the nursery.|mood|noun
sorrowful|full of sadness|mournful|joyful|Her ___ cry echoed through the halls.|mood|adj
frigid|extremely cold|freezing|scorching|___ air poured out of the hatch.|cold|adj
numb|not able to feel anything|-|sensitive|My fingers were ___ with cold.|cold|adj
wail|a long, high cry of sadness|howl|-|A ___ rose from the fireplace.|sound|noun
piercing|so high and loud it hurts your ears|shrill|soft|A ___ scream came from the attic.|sound|adj
rasping|rough and scratchy|harsh|smooth|A ___ breath came through the letterbox.|sound|adj
cower|to crouch down in fear|cringe|-|Do not ___; face it and speak the words!|move|verb
stagger|to walk unsteadily|stumble|stride|I began to ___ back from the window.|move|verb
lurch|to make a sudden, unsteady move|jerk|-|The figure began to ___ towards the window.|move|verb
writhe|to twist and squirm|squirm|-|Her fingers began to ___ through the gap.|move|verb
beckon|to signal for someone to come closer|summon|-|A pale hand began to ___ from the garden.|move|verb
frantic|wild with fear or worry|panicked|calm|___ knocking shook the back door.|move|adj
looming|appearing large and threatening|towering|-|A ___ shape filled the window.|size|adj
intruder|someone who enters without permission|trespasser|guest|Keep the ___ out at all costs!|threat|noun
barricade|to block something to keep people out|block|unblock|___ the door with planks!|threat|verb
nocturnal|active at night|-|-|The ___ visitor only comes after dark.|threat|adj
treacherous|dangerous and not to be trusted|perilous|safe|The ___ stairs were missing three steps.|threat|adj
relentless|never stopping|persistent|-|The ___ scratching went on all night.|threat|adj
banish|to send away and forbid to come back|expel|welcome|Speak the right word to ___ the spirit.|threat|verb
`,
};

export const LEVEL_NAMES = { y34: 'Year 3/4', y67: 'Year 6/7', y910: 'Year 9/10' };

const none = (s) => (!s || s === '-' ? '' : s);
function parse(raw) {
  return raw.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [word, def, syn, ant, sent, cat, pos] = l.split('|').map((s) => (s || '').trim());
    return { word, def, syn: none(syn) ? syn.split(',').map((s) => s.trim()).filter(Boolean) : [], ant: none(ant), sent, cat, pos };
  });
}
export const WORDS = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, parse(v)]));

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function sample(a, n) { return shuffle([...a]).slice(0, n); }

// Wrong answers: a different meaning group. Same part of speech is preferred so grammar never
// gives the answer away; other types only top up if there are too few.
function distractors(list, w, n, get, exclude = []) {
  const pool = list.filter((o) => o.cat !== w.cat && o.word !== w.word && !w.syn.includes(o.word) && !o.syn.includes(w.word) && o.word !== w.ant && !exclude.includes(o.word));
  const same = sample(pool.filter((o) => o.pos === w.pos), n);
  const rest = sample(pool.filter((o) => o.pos !== w.pos), n - same.length);
  return [...same, ...rest].map(get);
}

// Flavour lines shown above the question
const FLAVOUR = [
  'It hisses through the gap. Speak the word to drive it back!',
  'Pale fingers scrape closer. Answer clearly!',
  'It knows you are there. Say the word!',
  'The glass begins to frost over. Quickly!',
  'A cold whisper asks you a riddle...',
  'Its hair slides through the crack. Banish it!',
  'It is listening. Choose the right word.',
];

const SCENE_PROMPTS = ['Which word fits this spooky scene?', 'Pick the best word for the scene:', 'Which word makes the story scarier?'];

// How often each question style comes up. Sentences (using a word to set the mood) come up most;
// the youngest level skips synonyms.
const MIX = {
  y34: { sentence: 40, def2word: 35, word2def: 15, synonym: 0, antonym: 10 },
  y67: { sentence: 38, def2word: 28, word2def: 14, synonym: 12, antonym: 8 },
  y910: { sentence: 36, def2word: 28, word2def: 14, synonym: 14, antonym: 8 },
};

export function getWordInfo(level, word) {
  return (WORDS[level] || []).find((w) => w.word === word);
}

// recent: array of recently used words (avoid repeats)
export function makeQuestion(level, recent = []) {
  const list = WORDS[level] || WORDS.y34;
  let candidates = list.filter((w) => !recent.includes(w.word));
  if (candidates.length < 8) candidates = list;
  const w = pick(candidates);

  const mix = MIX[level] || MIX.y34;
  const types = Object.entries(mix).filter(([t, wt]) => wt > 0 && !(t === 'synonym' && !w.syn.length) && !(t === 'antonym' && !w.ant));
  let r = Math.random() * types.reduce((s, t) => s + t[1], 0);
  let type = types[0][0];
  for (const [t, wt] of types) { if ((r -= wt) <= 0) { type = t; break; } }

  let prompt, focus = '', sub = '', correct, others;
  switch (type) {
    case 'def2word':
      prompt = 'Which word means:'; sub = `“${w.def}”`;
      correct = w.word; others = distractors(list, w, 3, (o) => o.word);
      break;
    case 'word2def':
      prompt = 'What does this word mean?'; focus = w.word;
      correct = w.def; others = distractors(list, w, 3, (o) => o.def);
      break;
    case 'sentence':
      prompt = pick(SCENE_PROMPTS); sub = w.sent;
      correct = w.word; others = distractors(list, w, 3, (o) => o.word);
      break;
    case 'synonym':
      prompt = 'Which word means almost the same as:'; focus = w.word;
      correct = pick(w.syn);
      others = distractors(list, w, 3, (o) => o.word, [correct]);
      break;
    case 'antonym': {
      prompt = 'Which word means the opposite of:'; focus = w.word;
      correct = w.ant;
      const o2 = [];
      if (w.syn.length) o2.push(pick(w.syn));
      for (const x of distractors(list, w, 3, (o) => o.word, [correct, ...o2])) { if (o2.length < 3) o2.push(x); }
      others = o2;
      break;
    }
  }
  const options = [...new Set([correct, ...others])];
  while (options.length < 4) {
    const extra = pick(list.filter((o) => o.word !== w.word && o.cat !== w.cat));
    const v = type === 'word2def' ? extra.def : extra.word;
    if (!options.includes(v)) options.push(v);
  }
  shuffle(options);
  return {
    word: w.word, type, prompt, focus, sub, options,
    answer: options.indexOf(correct), correctText: correct,
    flavour: pick(FLAVOUR), def: w.def,
  };
}
