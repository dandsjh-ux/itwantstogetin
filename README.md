# IT WANTS TO GET IN

A multiplayer (2–6 players) first-person horror **vocabulary** game built with Three.js and Socket.IO.

You are alone in a house. Your parents have not come back. Something outside wants to get in. It
tries the doors, the windows, the chimney, the drain, the attic hatch… Rush to each entrance and
answer vocabulary "banishing spells" to drive it back. If you're too slow, it gets in, and you have to
hide in a salt circle until it leaves.

## Running locally

```bash
npm install
npm start            # http://localhost:3000
npm run dev          # same, but allows 1 player (for testing on your own)
```

One person clicks **Host a game** and gets a 4-letter house code (show it on the main screen or
projector). Everyone else opens the same URL on their own device and joins with that code. The host
starts the game once at least 2 players are in.

## Deploying on Render

The repo includes a `render.yaml` blueprint.

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** and pick the repo (or **New → Web Service** with
   build command `npm install` and start command `npm start`).
3. Render sets `PORT` automatically. WebSockets work out of the box.

Optional environment variable: `MIN_PLAYERS` (default `2`).

> On Render's free plan the service sleeps when idle, so the first visit can take ~30 seconds to wake up.

## Music and sound effects

The MP3s in **`public/audio/`** are mapped to game moments by `public/audio/manifest.json`, which can
also cut a clip out of a longer file (`start`/`end` in seconds), set its volume, or muffle music
(`filter` in Hz). With the current files:

| File | Used for |
|---|---|
| Ambience Background Soundtrack | In-game music loop; also the title screen and lobby, muffled as if heard through a wall |
| Door Knock Sound Effect | Split into its two knock bursts: knocking at door attacks (positional), the cutscene's "something outside" line, and the title screen when the hand presses the glass |
| Glass Breaking | When it breaks in through a window or skylight, and the final word of the title sequence |
| Chilling Creepy Doll Voice Whisper | Whispers at windows and hatches, the cutscene's "And…", the phone call, and glimpses of her |
| A Young Girl Crying | Distant crying somewhere in the house, the cutscene's "parents" line, and the losing screen |
| Creepy Little Girl Singing | Singing drifting from the nursery, and sometimes when the silhouette appears on the title screen |
| music_box.mp3 (shadow Bonnie music box) | The music box in the dining room: when someone winds it, and short tinkles by itself |
| Creepy Footsteps (& Running) | Walking section: footsteps crossing the floor above you. Running section: her feet while she hunts you during a breach |

Anything without a file uses sound generated in the browser (tapping, scratching, creaks, gurgling
drains, heartbeat, thunder, chase music, a music-box lullaby for the win screen). To add more files,
drop them in the folder and either add them to `manifest.json` or name them with a keyword:
menu, ambient/background (game music), chase, win, lose, knock, scream, whisper, crying, singing,
footsteps, running, glass, alert.

## How to play

- **Attacks:** a warning pops up when something tries to get in. The attack list (top-left) shows
  where it is, which floor, and how long you have. Each attack has its own timer.
- **Banish it:** stand at the entrance and press **E** (or the ✋ button). Answer the vocabulary
  questions. Each correct answer pushes it back; a wrong answer lets it push closer and costs time.
- **Breach:** if a timer runs out, it gets in and a **ward** breaks. Run to a **salt circle** and
  stay there until it leaves. If it catches you, the team loses one banishment. It leaves early if
  everyone is safe for 6 seconds.
- **Win** by banishing it the target number of times before time runs out.
  **Lose** if all wards break or time runs out.

### Items
| Item | Effect |
|---|---|
| 🧂 Salt Shaker | Pour a protective salt circle where you stand (lasts 45 s) — **Q** |
| 🪵 Planks | Board up an entrance: +25 s on a current attack, or +30 s on the next one there — **R** |
| ⚡ Adrenaline | Run faster for 15 s |
| 🧭 Spirit Compass | Points to the nearest attack (and the right stairs) for 25 s |
| 🌿 Lavender Charm | Removes two wrong answers from a question — **C** |
| 🕯️ Blessed Candle | Adds 15 s to every active attack |

### Controls
| Keyboard / touchpad | Action |
|---|---|
| W A S D or ↑ ↓ | Move |
| ← → | Turn (easy for touchpad users) |
| Click, then move mouse or touchpad | Look around (pointer lock). "Drag-to-look" is available in the P menu |
| Shift | Run |
| E / Space / Enter | Interact (banish, pick up, read notes, answer the phone) |
| 1–4 | Answer quiz |
| Q / R / C | Salt / Planks / Charm |
| F | Torch |
| M | Map |
| T | Call for help |
| P | Menu and options (sensitivity, volume, drag-to-look, head bob, graphics quality) |

No right-clicks are needed. On tablets you get a joystick, a drag-to-look area and big buttons.

### Host settings
Vocabulary level (Year 3/4, Year 6/7, Year 9/10), banishments to win, game length (3–10 min),
time to reach an entrance, words per banishment, wards, how long it stays inside, wrong-answer
penalty, intensity (calm / normal / nightmare), entity speed, power-ups on/off, and whether attacks
show on the map.

The number of entrances under attack at the same time goes up with the number of players and with
intensity, and it ramps up over the first two minutes.

## Vocabulary

`server/vocab.js` holds about 65–70 words per level (199 in total), each with a short definition,
synonyms, an opposite and a house-themed example sentence. The words are pitched **a couple of school
years below the level's label** and chosen for atmosphere and tone: how a haunted house looks, sounds,
feels and smells, and the mood of a scene.

| Level | Sample words |
|---|---|
| Year 3/4 | scary, dark, creak, whisper, icy, dusty, spooky, creep, shiver, lonely |
| Year 6/7 | gloomy, eerie, lurk, tremble, slither, mouldy, hollow, tense, glimpse, mysterious |
| Year 9/10 | ominous, menacing, dread, desolate, rickety, translucent, sombre, cower, relentless, banish |

Questions are generated on the fly in five styles (a sentence to complete, definition → word,
word → definition, similar meaning, opposite). Complete-the-scene sentences come up most, and the
Year 3/4 level skips "similar meaning". Wrong options always come from a different meaning group, so
only one answer fits, and they match the right answer's part of speech so grammar can't give it away.
Recently used words are avoided, and the results screen lists the words to review.

**Figurative language (Year 9/10 only).** About 30% of Year 9/10 questions are about figurative
language, using 40 lines written for the house and its story ("The stairs groaned under my feet",
"Fear was a cold hand gripping my throat", "A silent scream rose in my throat"). They cover simile,
metaphor, personification, alliteration, onomatopoeia, hyperbole, oxymoron and idioms, in four styles:
*what does this line mean?*, *which technique is used?*, *which line is an example of a simile?* and
*which term means "…"?*. The meaning questions include a too-literal wrong answer ("A real hand was
holding my neck"), and the results screen explains each line you missed. The lines live in
`server/vocab.js` (`FIG_RAW`); the share is set by `FIG_SHARE`.

Add words by appending lines in the format:

```
word|definition|synonym1,synonym2 (or -)|antonym (or -)|Sentence with ___ for the word.|category|adj/noun/verb
```

## The house

Four floors: **Basement** (cellar, storage, coal room, boiler room), **Ground** (hall, living room,
dining room, kitchen, study), **First** (landing, nursery, master bedroom, bathroom, your bedroom,
back room) and **Attic**. The attic is reached by the pull-down ladder on the first-floor landing
(next to the top of the main stairs, marked "ATTIC ↑"; walk into it or press E to climb) or by the
narrow stairs in the back room. There are 24 entrances, from the front door and cat flap to the coal chute,
floor drain, boiler flue, fireplace, balcony door, roof hatch and skylight. The layout lives in
`public/js/layout.js` and is shared by the client and the server.

**The music box.** In the far corner of the dining room sits a music box with a note: *"DO NOT PLAY IT."*
Players have to read the note before they can wind it. Winding it plays the tune through the house,
and two seconds later she smashes in through the dining room side window: an instant breach that
breaks a ward. It can only be wound once per game.

**Uncanny happenings.** Rocking chairs that rock only when nobody is watching; a dining chair that
turns to face you; wet footprints that appear one by one from the front door to the stairs; words
that write themselves on walls behind you; a ball that rolls out of the nursery towards you; the
piano playing wrong notes; the kitchen wireless crackling into whispers; bath taps running on their
own; hanging lamps that start to sway; "LET ME IN" breathed onto the bathroom mirror; and the music
box tinkling a few notes by itself. Each has its own trigger, and every 35–70 seconds one of them
also fires at random wherever the player is.

**The dark scare.** Rarely, and only in the basement or attic, your torch stutters and dies for two
seconds. When it comes back, her face is right in front of you for a heartbeat. The game only counts
time spent down there or up there, and the scare happens once or twice a game (never every visit,
never at the same moment twice). It's skipped while you're answering a quiz, climbing, or being hunted.
`triggerDarkScare()` on the game object fires it on demand when testing.

Look out for portraits that change when you're not looking, notes and diary pages that tell the
story of Eleanor Vane, writing on the walls, the dollhouse, the telephone, and the bathroom mirror…

## Outside, and her face

Beyond the windows it is a snowy night: a pale overcast sky with the moon smeared behind the cloud,
snow-covered ground, bare black trees in the garden and a hazy forest wall beyond, all painted at start-up
(no image files). Snow falls continuously (drawn on the GPU, so it is cheap, and culled inside the house),
settles on the window sills, and a gnarled branch scratches across some windows. The basement openings
look out of stone wells up to the snow. Lightning lights the sky and snow up and leaves the trees black.

The entity's face is made of grey smoke: soft-edged, with hollow black eyes and a gaping mouth, wisps
curling off the head and a slow churn as it floats. It is painted by `smokeFace()` in
`public/js/textures.js` and is used on the 3D model, in the bathroom mirror, in the dark scare and in the
jump scare.

## Graphics settings

"High quality graphics" (on by default on computers, off on tablets) adds torch shadows, floating
dust and a heavier snowfall. Turn it off in the P menu if a computer struggles. Everything else (lighting, moonlight,
lightning, cobwebs, film grain) is cheap and always on.

## Project structure

```
server.js            Express + Socket.IO game server (authoritative timers, attacks, entity AI)
server/vocab.js      Vocabulary database and question generator
public/index.html    UI shell
public/css/style.css
public/js/main.js         Screens, lobby, cutscene, HUD, quiz, map, networking
public/js/game3d.js       Three.js house, entity visuals, movement and collision, ambient scares
public/js/layout.js       Shared house layout (walls, entrances, stairs, rooms, props, lore)
public/js/audio.js        MP3 role matching plus procedural Web Audio SFX with 3D positioning
public/js/textures.js     Procedurally painted textures (portraits, wallpaper, the smoke face, sky, trees…)
public/js/controls.js     Keyboard, mouse/touchpad and touch controls
public/js/startscreen.js  Animated screen-door title backdrop
public/audio/             Put your MP3s here
```
