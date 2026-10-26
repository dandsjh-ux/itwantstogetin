// Vocabulary database for "It Wants To Get In".
// Format per line: word | definition | synonyms (comma) | antonym | sentence with ___ | category
// Distractors are always drawn from a different category, so options never overlap in meaning.

const RAW = {
  y34: `
scary|making you feel afraid|frightening,spooky|comforting|The ___ noise came from the dark basement.|fear
creepy|giving you an unpleasant, shivery feeling|spooky,eerie|pleasant|A ___ hand slid under the door.|fear
dreadful|very bad or frightening|awful,terrible|wonderful|A ___ smell drifted out of the chimney.|fear
horrible|very unpleasant or frightening|awful,nasty|lovely|The ___ face vanished from the glass.|fear
spooky|strange and a little bit scary, as if ghosts are near|eerie,creepy|ordinary|The empty house felt ___ at midnight.|ghost
ghostly|pale, misty and see-through, like a ghost|spooky,phantom|solid|A ___ figure floated past the window.|ghost
haunted|visited by ghosts or spirits|cursed,spooked||Everyone in the village says this house is ___.|ghost
ghost|the spirit of a dead person that some people believe they can see|spirit,phantom||A ___ in a white dress drifted down the hall.|ghost
vanish|to disappear suddenly|disappear,fade|appear|Blink, and the face in the window will ___.|ghost
gloomy|dark and dull, without much light|dim,dreary|bright|The attic was ___ and full of shadows.|dark
dim|not bright; with only a little light|faint,murky|bright|The ___ candle barely lit the hallway.|dark
shadowy|full of shadows and hard to see clearly|dark,murky|sunny|Something moved in the ___ corner.|dark
pitch-black|completely dark|inky,lightless|bright|The cellar was ___ when the torch went out.|dark
shadow|a dark shape made when something blocks the light|shade,outline|light|A tall ___ crossed the curtain.|dark
foggy|full of thick mist, so it is hard to see|misty,hazy|clear|The garden was ___ and grey.|dark
flicker|to shine on and off in an unsteady way|blink,waver||The lights ___ whenever it is near.|light
glow|to give out a soft, steady light|shine,gleam||Two eyes began to ___ in the dark garden.|light
silent|making no sound at all|quiet,hushed|noisy|The house went ___ — then came a knock.|sound
creaky|making a long squeaking sound when moved|squeaky,groaning|silent|The ___ stairs gave away every step.|sound
whisper|to speak very softly|murmur,mutter|shout|Something began to ___ through the keyhole.|sound
howl|to make a long, loud, sad cry|wail,yowl|hush|The wind began to ___ around the chimney.|sound
shriek|a sudden, high, loud scream|screech,scream|whisper|A ___ echoed from the attic.|sound
moan|a long, low sound of pain or sadness|groan,wail|laugh|A low ___ came from inside the fireplace.|sound
rattle|to shake and make quick knocking noises|clatter,shake||The window began to ___ in its frame.|sound
thud|a dull, heavy sound|thump,bump||There was a ___ on the roof above.|sound
tap|to hit something lightly again and again|knock,patter||Long fingernails began to ___ on the glass.|sound
scratch|to scrape with something sharp, like nails or claws|scrape,claw||You hear claws ___ at the back door.|sound
bang|a sudden, loud noise|crash,boom||A loud ___ came from the basement.|sound
afraid|feeling fear|scared,frightened|brave|You are not ___ of the dark... are you?|feeling
nervous|worried and a little afraid about something|anxious,jittery|calm|The ___ child peeked around the door.|feeling
terrified|extremely frightened|petrified,horrified|calm|She was ___ when the door handle turned.|feeling
lonely|sad because you are alone|alone,friendless||The house felt ___ without your parents.|feeling
trapped|unable to get away or escape|stuck,caught|free|You feel ___ inside the locked house.|feeling
brave|ready to face danger without running away|bold,fearless|cowardly|Be ___ and go down to the basement.|trait
cautious|careful to avoid danger|careful,wary|careless|Be ___ when you open the cellar door.|trait
curious|wanting to find out about something|nosy,interested|uninterested|The ___ cat stared up at the attic hatch.|trait
wicked|very bad or evil|evil,nasty|good|A ___ laugh drifted down the chimney.|trait
sneaky|doing things secretly so no one notices|sly,secretive|honest|The ___ shadow slipped behind the curtain.|trait
tremble|to shake because you are cold or scared|shiver,quiver||Your hands ___ as you hold the torch.|move
lurk|to wait somewhere hidden, ready to jump out|hide,prowl||Something likes to ___ under the stairs.|move
creep|to move slowly and quietly|sneak,tiptoe|stomp|You ___ down the hall so it won't hear you.|move
crawl|to move on hands and knees, close to the ground|creep,wriggle||Something began to ___ out of the coal chute.|move
scurry|to run with quick, short steps|scamper,dash|dawdle|Mice ___ away from the cellar door.|move
shiver|to shake a little because of cold or fear|tremble,quake||The cold air in the hall made you ___.|cold
icy|very cold, like ice|freezing,frosty|warm|An ___ breath touched the back of your neck.|cold
chilly|cold enough to be uncomfortable|cold,nippy|warm|The hallway grew ___ as it came closer.|cold
frosty|covered with frost; very cold|icy,wintry|hot|___ fingerprints appeared on the window.|cold
clammy|unpleasantly damp and sticky|damp,sweaty|dry|A ___ hand touched yours in the dark.|cold
damp|slightly wet|moist,soggy|dry|The basement walls were ___ and smelled of mould.|decay
dusty|covered with dust|grimy,dirty|clean|___ old photos lay on the attic floor.|decay
rotten|old and gone bad|decayed,mouldy|fresh|The floorboards were ___ and soft.|decay
mouldy|covered in fuzzy growth caused by damp|musty,rotten|fresh|A ___ smell rose from the drain.|decay
broken|damaged and in pieces|smashed,cracked|fixed|A ___ window let the cold wind in.|decay
cracked|having thin lines where it has started to break|split,chipped|whole|The ___ mirror showed two of you.|decay
slimy|covered in something wet and slippery|slippery,gooey|dry|A ___ trail led away from the drain.|decay
crooked|bent or twisted, not straight|bent,twisted|straight|The ___ portrait hung from one nail.|look
pale|having very little colour; almost white|white,colourless|rosy|A ___ face pressed against the window.|look
hollow|empty inside|empty,sunken|solid|The figure stared with ___ eyes.|look
bony|so thin that the bones show|skinny,scrawny|plump|A ___ hand reached through the cat flap.|look
jagged|with rough, sharp, uneven edges|sharp,spiky|smooth|___ glass stuck out of the window frame.|look
tangled|twisted together in a messy way|knotted,matted|neat|Her ___ black hair hung over her face.|look
strange|unusual and hard to understand|odd,weird|normal|A ___ smell filled the kitchen.|mood
weird|very strange or odd|odd,bizarre|normal|There was a ___ scratching inside the walls.|mood
stormy|with strong winds, rain and thunder|wild,blustery|calm|It was a ___ night with no stars.|mood
grim|serious, dark and unpleasant|bleak,stern|cheerful|The man in the portrait had a ___ face.|mood
sudden|happening quickly, without warning|quick,unexpected|gradual|A ___ bang made everyone jump.|mood
empty|with nothing or no one inside|bare,vacant|full|The rocking chair was ___ — but it was still rocking.|place
abandoned|left behind and no longer cared for|deserted,left|cared-for|An ___ doll sat on the stairs.|place
gigantic|extremely big|huge,enormous|tiny|A ___ shadow filled the doorway.|size
enormous|very large|huge,massive|tiny|An ___ spider hung above the bed.|size
tiny|very small|little,small|huge|___ footprints led across the dusty floor.|size
narrow|thin, not wide|thin,slim|wide|The ___ stairs led up to the attic.|size
ancient|very, very old|old,aged|new|An ___ clock ticked in the hall.|age
`,
  y67: `
ominous|giving the feeling that something bad is going to happen|threatening,menacing|promising|An ___ silence settled over the house.|fear
menacing|suggesting that danger or harm is coming|threatening,intimidating|harmless|A ___ figure loomed behind the frosted glass.|fear
gruesome|causing horror and disgust|grisly,horrifying|pleasant|The old book in the study told ___ stories.|fear
dread|great fear about something that may happen|terror,horror||A cold ___ crept over you as the clock struck twelve.|fear
unnerving|making you lose your courage or feel scared|unsettling,disturbing|reassuring|The portrait's ___ eyes followed you.|fear
sinister|seeming evil or dangerous|evil,menacing|innocent|A ___ smile spread across the portrait's face.|trait
malicious|wanting to hurt others|spiteful,cruel|kind|A ___ voice hissed through the vent.|trait
vengeful|wanting to get revenge|unforgiving,bitter|forgiving|Some say the woman in white is ___.|trait
vigilant|carefully watching for danger|watchful,alert|careless|Stay ___ — it is never far away.|trait
reluctant|unwilling and slow to do something|hesitant,unwilling|eager|You were ___ to climb into the attic.|trait
wary|cautious and suspicious of possible danger|cautious,suspicious|trusting|Be ___ of anything that asks to come in.|trait
eerie|strange and frightening in a mysterious way|uncanny,unsettling|ordinary|An ___ glow seeped under the attic door.|ghost
ethereal|extremely light and delicate, as if not of this world|otherworldly,unearthly|earthly|An ___ figure drifted along the landing.|ghost
spectral|like a ghost|ghostly,phantom||A ___ light flickered in the attic.|ghost
apparition|a ghost or ghostlike image of a person|ghost,spirit||The ___ vanished when the lights came on.|ghost
phantom|a ghost; something that seems real but is not|ghost,spirit||___ footsteps paced above your head.|ghost
tormented|suffering great pain or worry|tortured,troubled|peaceful|The ___ spirit could not rest.|ghost
restless|unable to stay still or be at peace|unsettled,fidgety|peaceful|The ___ ghost wanders the house every night.|ghost
foreboding|a strong feeling that something bad will happen|unease,apprehension||You felt a sense of ___ as the lights dimmed.|feeling
petrified|so frightened that you cannot move|terrified,frozen|calm|___, you stared at the shape in the doorway.|feeling
apprehensive|worried that something bad may happen|uneasy,anxious|confident|You felt ___ about opening the cellar door.|feeling
anxious|feeling worried or nervous|uneasy,fretful|relaxed|The ___ children waited for their parents.|feeling
agitated|nervous, upset and unable to keep still|restless,flustered|calm|The dog grew ___ whenever it was near.|feeling
bewildered|very confused|baffled,puzzled|enlightened|You were ___ — the door was locked from the inside.|feeling
desolate|empty, bleak and lonely|bleak,barren|lively|The ___ garden stretched away into the fog.|place
derelict|abandoned and in very bad condition|abandoned,ruined|occupied|The ___ house next door had no lights.|place
deserted|empty of people|abandoned,empty|crowded|The street outside was ___.|place
stifling|so hot or airless that it is hard to breathe|suffocating,airless|fresh|The attic was ___ and dusty.|place
claustrophobic|uncomfortably closed in and cramped|cramped,confined|spacious|The ___ coal room made it hard to breathe.|place
dilapidated|old and falling apart from neglect|rundown,crumbling|well-kept|The ___ shed leaned against the fence.|decay
ramshackle|badly made and falling to pieces|rickety,tumbledown|sturdy|A ___ ladder led up into the attic.|decay
rickety|likely to break or fall apart|shaky,wobbly|sturdy|The ___ banister creaked under your hand.|decay
putrid|rotting and smelling disgusting|rotten,foul|fresh|A ___ smell rose from the coal chute.|decay
rancid|smelling or tasting sour and spoiled|sour,spoiled|fresh|The ___ milk had been left out for days.|decay
pungent|having a strong, sharp smell|acrid,strong|mild|The ___ smell of smoke drifted from the fireplace.|decay
ghastly|causing horror; deathly pale|horrible,hideous|pleasant|A ___ face peered down the chimney.|look
hideous|extremely ugly|repulsive,monstrous|beautiful|A ___ creature pressed its face to the glass.|look
grotesque|strangely ugly or twisted in shape|distorted,deformed|beautiful|Its ___ fingers curled around the door frame.|look
translucent|letting some light through, but not clear like glass|see-through,semi-transparent|opaque|Her ___ hand passed straight through the door.|look
opaque|not letting any light through; impossible to see through|cloudy,solid|transparent|Through the ___ screen door, you could only see a shape.|look
gaunt|very thin and bony, often from illness|haggard,bony|plump|A ___ face appeared at the bathroom window.|look
haggard|looking exhausted and unwell|worn,drawn|fresh|The ___ woman in the painting had sleepless eyes.|look
sinewy|lean and stringy, with tough muscles showing|wiry,stringy|flabby|A long, ___ arm reached down the chimney.|look
tattered|old and torn|ragged,shredded|pristine|Her ___ white dress dragged along the floor.|look
gnarled|knobbly and twisted with age|knotted,twisted|smooth|___ fingers scraped down the window.|look
dismal|gloomy and depressing|dreary,depressing|cheerful|The ___ basement smelled of damp coal.|mood
bleak|cold, empty and without hope|grim,hopeless|hopeful|The night outside looked ___ and endless.|mood
sombre|dark, serious and sad|grave,solemn|cheerful|The family in the portrait wore ___ black clothes.|mood
sorrowful|full of sadness|mournful,grieving|joyful|Her ___ cry echoed through the halls.|mood
forlorn|sad and lonely|wretched,lonely|cheerful|A ___ teddy bear sat in the empty cot.|mood
murky|dark and dirty, hard to see through|cloudy,muddy|clear|___ water gurgled in the floor drain.|dark
shrouded|covered or hidden, as if wrapped in cloth|veiled,cloaked|exposed|The furniture was ___ in white sheets.|dark
silhouette|a dark outline of someone seen against a lighter background|outline,profile||A tall ___ stood outside the screen door.|dark
engulf|to completely surround or swallow up|swallow,consume||Darkness began to ___ the hallway.|dark
obscure|to hide something or make it hard to see|conceal,hide|reveal|Long black hair seemed to ___ her face.|dark
frigid|extremely cold|freezing,icy|scorching|___ air poured from the open hatch.|cold
numb|unable to feel anything|deadened,unfeeling|sensitive|Your fingers were ___ with cold.|cold
wail|a long, high cry of pain or grief|howl,lament||A ___ rose from inside the fireplace.|sound
haunting|sad and beautiful in a way that is hard to forget|mournful,unforgettable|forgettable|A ___ lullaby played from the nursery.|sound
echoing|repeating as an echo|resounding,reverberating|muffled|___ footsteps followed you down the hall.|sound
muffled|quiet and unclear because something covers it|muted,stifled|clear|A ___ voice called from inside the wall.|sound
piercing|very loud and high, almost hurting your ears|shrill,ear-splitting|soft|A ___ scream came from the attic.|sound
rasping|harsh and scraping|grating,hoarse|smooth|A ___ breath came through the letterbox.|sound
lurking|hiding and waiting, often ready to attack|skulking,prowling||Something was ___ beneath the floorboards.|move
frantic|wild with fear or worry|panicked,desperate|calm|___ knocking shook the back door.|move
clamber|to climb awkwardly using hands and feet|scramble,climb||You ___ up the steep attic stairs.|move
stagger|to walk unsteadily, as if about to fall|totter,reel|stride|You ___ backwards as the glass cracked.|move
lurch|to make a sudden, unsteady movement|jerk,sway||The figure began to ___ towards the window.|move
cower|to crouch down in fear|cringe,shrink||Don't ___ — face it and speak the words!|move
looming|appearing large and threatening|towering,hovering||A ___ shape filled the attic window.|size
intruder|someone who enters a place without permission|trespasser,invader|guest|Keep the ___ out at all costs!|threat
barricade|to block something to keep people out|blockade,fortify|unblock|___ the door with planks!|threat
nocturnal|active at night|night-time,nightly|diurnal|The ___ visitor only comes after dark.|threat
treacherous|dangerous and not to be trusted|perilous,unsafe|safe|The ___ stairs were missing three steps.|threat
banish|to send away and forbid from coming back|expel,exile|welcome|Speak the right word to ___ the spirit.|threat
`,
  y910: `
macabre|disturbing because it involves death or horror|grisly,gruesome|cheerful|The study held a ___ collection of mourning photographs.|fear
baleful|threatening harm; menacing|menacing,sinister|friendly|She fixed you with a ___ stare.|fear
portentous|warning that something momentous or bad will happen|ominous,foreboding|reassuring|The ___ knocking came exactly three times.|fear
harrowing|extremely distressing|traumatic,agonising|comforting|It was a ___ night that none of you will ever forget.|fear
ghoulish|delighting in death and gruesome things|macabre,morbid|wholesome|A ___ grin was carved into the banister.|fear
abhorrent|causing hatred or disgust|repugnant,detestable|admirable|The thing at the window was ___ to behold.|fear
malevolent|wishing to do evil to others|malicious,wicked|benevolent|A ___ presence pressed against every window.|trait
insidious|harmful in a slow, hidden way|stealthy,sly|harmless|The cold spread with ___ patience through the house.|trait
morbid|having an unhealthy interest in death and disturbing things|grim,ghoulish|wholesome|The previous owner had a ___ fascination with funerals.|trait
nefarious|wicked and criminal|villainous,evil|honourable|Whatever it wants, its intentions are ___.|trait
malignant|evil in nature and harmful|harmful,hostile|benign|Something ___ had settled into the walls of the house.|trait
sordid|dirty and unpleasant, or morally shameful|squalid,seedy|respectable|The diary revealed the ___ history of the house.|trait
enigmatic|mysterious and hard to understand|cryptic,puzzling|straightforward|The notes left behind were ___.|trait
clandestine|kept secret, often because it is forbidden|secret,covert|open|The diaries describe ___ rituals in the cellar.|trait
sepulchral|gloomy and dismal, like a tomb|funereal,tomblike|cheerful|A ___ voice rose from the cellar.|mood
lugubrious|looking or sounding sad and dismal|mournful,doleful|cheerful|The grandfather clock struck with a ___ chime.|mood
oppressive|heavy and overwhelming; hard to bear|suffocating,overbearing|uplifting|An ___ silence filled the attic.|mood
melancholy|a deep, lasting sadness|sorrow,gloom|joy|A heavy ___ hung over the nursery.|mood
desolation|a state of complete emptiness or great sadness|bleakness,despair|joy|___ spread through the empty rooms.|mood
uncanny|strange in an unsettling, almost supernatural way|eerie,weird|ordinary|The ___ likeness between you and the portrait was unsettling.|ghost
incorporeal|having no physical body|bodiless,immaterial|physical|An ___ figure drifted straight through the wall.|ghost
preternatural|beyond what is normal or natural|supernatural,abnormal|ordinary|She moved with ___ speed.|ghost
revenant|a person who has returned, especially from the dead|ghost,returner||The ___ had come back for the house it once owned.|ghost
spectre|a ghost, or a threat that haunts you|phantom,wraith||The ___ of the woman in white haunts the lane.|ghost
wraith|a ghost or ghostlike image, often thin and pale|spectre,phantom||A ___ in white glided past the landing.|ghost
eldritch|weird, unnatural and frightening|unearthly,otherworldly|natural|An ___ shriek split the night.|ghost
invocation|calling on a spirit or power, often with words|incantation,summoning||Each correct word is an ___ that drives it back.|ghost
desecrated|treated with violent disrespect (a sacred place)|defiled,violated|consecrated|The salt circle had been ___ by muddy footprints.|ghost
liminal|relating to a threshold or an in-between state|transitional,in-between||The doorway is a ___ space — neither in nor out.|place
labyrinthine|like a maze; complicated and confusing|maze-like,winding|straightforward|The ___ cellar corridors twisted into darkness.|place
threshold|the strip at the bottom of a doorway; a point of entering|doorway,entrance||It cannot cross the ___ without an invitation.|place
cadaverous|very pale, thin and bony, like a corpse|gaunt,deathly|healthy|Her ___ fingers wrapped around the window frame.|look
emaciated|abnormally thin from starvation or illness|skeletal,wasted|well-fed|An ___ arm slid through the cat flap.|look
pallid|unhealthily pale|wan,ashen|flushed|A ___ face hovered behind the frosted glass.|look
wan|pale and looking ill or tired|pallid,sickly|rosy|A ___ moon gave almost no light.|look
sallow|having an unhealthy yellowish skin colour|sickly,pasty|ruddy|A ___ face watched from the bathroom window.|look
inscrutable|impossible to understand or interpret|mysterious,unreadable|obvious|The portrait wore an ___ expression.|look
dishevelled|untidy and messy in appearance|unkempt,bedraggled|neat|Her ___ black hair hid her face entirely.|look
gossamer|very light, thin and delicate|filmy,wispy|coarse|Her ___ dress fluttered without any wind.|look
phantasmagorical|dreamlike, with strange, shifting images|surreal,dreamlike|realistic|Shadows danced in ___ shapes across the wall.|look
palpable|so intense it can almost be touched|tangible,perceptible|imperceptible|The fear in the room was ___.|feeling
visceral|felt deep in the body rather than reasoned|instinctive,raw|rational|You felt a ___ terror as the handle turned.|feeling
trepidation|fear or worry about what might happen|apprehension,dread|confidence|With ___, you lifted the attic hatch.|feeling
premonition|a strong feeling that something is about to happen|hunch,omen||You had a ___ that the back door was next.|feeling
bereft|deprived of something; lonely and grieving|forlorn,deprived|blessed|___ of their parents, the children waited alone.|feeling
tremulous|shaking slightly, usually from nervousness|quivering,shaky|steady|You read the words in a ___ voice.|feeling
tenebrous|dark and shadowy|shadowy,murky|luminous|The ___ hallway swallowed the torchlight.|dark
stygian|extremely dark, gloomy and hellish|pitch-black,infernal|radiant|A ___ darkness rose from the cellar.|dark
impenetrable|impossible to get through or see through|impassable,dense|accessible|An ___ fog surrounded the house.|dark
cacophony|a harsh mixture of loud, unpleasant sounds|din,racket|harmony|A ___ of knocking erupted from every door.|sound
susurration|a soft whispering or rustling sound|whispering,murmur||A ___ of voices drifted from the vents.|sound
miasma|an unpleasant, unhealthy smell or atmosphere|stench,fug||A ___ of decay drifted up from the drain.|decay
fetid|smelling extremely unpleasant|putrid,rank|fragrant|___ water pooled beneath the coal chute.|decay
viscous|thick and sticky, not flowing easily|gooey,syrupy|runny|A ___ black liquid oozed from the vent.|decay
decrepit|worn out and ruined by age or neglect|dilapidated,crumbling|pristine|A ___ rocking chair rocked by itself.|decay
vile|extremely unpleasant or wicked|foul,repugnant|lovely|A ___ odour drifted from the chimney.|decay
cloying|unpleasantly sweet or excessive|sickly,syrupy|refreshing|The ___ scent of lilies filled the hall.|decay
moribund|close to death; no longer active|dying,declining|thriving|The ___ garden had not bloomed in years.|decay
vestige|a last trace of something that has disappeared|remnant,trace||A ___ of old perfume lingered in the nursery.|decay
gelid|icy; extremely cold|frozen,icy|scalding|A ___ draught crept under the cellar door.|cold
pervasive|spreading through every part of something|widespread,permeating|contained|A ___ chill filled every room.|cold
furtive|done secretly in a nervous or guilty way|stealthy,secretive|open|You noticed a ___ movement behind the curtains.|move
surreptitious|done secretly so that others will not notice|covert,sneaky|blatant|A ___ hand slid the bolt back.|move
writhe|to twist and squirm, as if in pain|squirm,thrash||Her fingers began to ___ through the gap.|move
recoil|to spring back suddenly in fear or disgust|flinch,shrink||The entity will ___ when it hears the right word.|move
beckon|to signal to someone to come closer|summon,gesture||A pale hand began to ___ from the garden.|move
skulk|to hide or move about secretly, with bad intent|lurk,prowl||Something likes to ___ in the boiler room.|move
sinuous|having many curves; moving with smooth twists|serpentine,winding|straight|Her ___ arms bent in impossible ways.|move
inexorable|impossible to stop or prevent|unstoppable,unavoidable|avoidable|Its ___ advance continued, room by room.|threat
relentless|never stopping or easing|unrelenting,persistent|half-hearted|The ___ scratching went on all night.|threat
implacable|unable to be calmed or stopped|unstoppable,merciless|forgiving|The ___ spirit would not rest until it was inside.|threat
pernicious|having a harmful effect, especially gradually|destructive,damaging|beneficial|The damp had a ___ effect on the old timbers.|threat
perilous|full of danger|dangerous,hazardous|safe|The ___ attic floor creaked with every step.|threat
interloper|a person who goes where they are not wanted|intruder,trespasser||The ___ tested every lock in the house.|threat
exorcise|to drive out an evil spirit|banish,expel|summon|You must ___ the spirit from every entrance.|threat
`,
};

export const LEVEL_NAMES = { y34: 'Year 3/4', y67: 'Year 6/7', y910: 'Year 9/10' };

function parse(raw) {
  return raw.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [word, def, syn, ant, sent, cat] = l.split('|').map((s) => (s || '').trim());
    return { word, def, syn: syn ? syn.split(',').map((s) => s.trim()).filter(Boolean) : [], ant, sent, cat };
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

function distractorPool(list, w) {
  return list.filter((o) => o.cat !== w.cat && o.word !== w.word && !w.syn.includes(o.word) && !o.syn.includes(w.word) && o.word !== w.ant);
}

// Entrance-specific flavour lines shown above the question
const FLAVOUR = [
  'It hisses through the gap. Speak the word to drive it back!',
  'Pale fingers scrape closer. Answer clearly!',
  'It knows you are there. Say the word!',
  'The glass begins to frost over. Quickly!',
  'A cold whisper asks you a riddle...',
  'Its hair slides through the crack. Banish it!',
  'It is listening. Choose the right word.',
];

export function getWordInfo(level, word) {
  return (WORDS[level] || []).find((w) => w.word === word);
}

// recent: array of recently used words (avoid repeats)
export function makeQuestion(level, recent = []) {
  const list = WORDS[level] || WORDS.y34;
  let candidates = list.filter((w) => !recent.includes(w.word));
  if (candidates.length < 8) candidates = list;
  const w = pick(candidates);
  const pool = distractorPool(list, w);

  const types = [['def2word', 30], ['word2def', 25], ['sentence', 25], ['synonym', 13]];
  if (w.ant) types.push(['antonym', 10]);
  let r = Math.random() * types.reduce((s, t) => s + t[1], 0);
  let type = types[0][0];
  for (const [t, wt] of types) { if ((r -= wt) <= 0) { type = t; break; } }
  if (type === 'synonym' && !w.syn.length) type = 'def2word';

  let prompt, focus = '', sub = '', correct, others;
  switch (type) {
    case 'def2word':
      prompt = 'Which word means:'; sub = `“${w.def}”`;
      correct = w.word; others = sample(pool, 3).map((o) => o.word);
      break;
    case 'word2def':
      prompt = 'What does this word mean?'; focus = w.word;
      correct = w.def; others = sample(pool, 3).map((o) => o.def);
      break;
    case 'sentence':
      prompt = 'Complete the banishing words:'; sub = w.sent;
      correct = w.word; others = sample(pool, 3).map((o) => o.word);
      break;
    case 'synonym':
      prompt = 'Which word has a SIMILAR meaning to:'; focus = w.word;
      correct = pick(w.syn);
      others = sample(pool.filter((o) => o.word !== correct), 3).map((o) => o.word);
      break;
    case 'antonym': {
      prompt = 'Which word means the OPPOSITE of:'; focus = w.word;
      correct = w.ant;
      const o2 = [];
      if (w.syn.length) o2.push(pick(w.syn));
      for (const o of sample(pool.filter((o) => o.word !== correct && !o2.includes(o.word)), 3)) {
        if (o2.length < 3) o2.push(o.word);
      }
      others = o2;
      break;
    }
  }
  const options = [...new Set([correct, ...others])];
  while (options.length < 4) {
    const extra = pick(pool);
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
