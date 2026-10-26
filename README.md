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

## Adding your music and sound effects

Copy your MP3 files into **`public/audio/`**. The game lists that folder on startup and matches each
file to a role using keywords in its filename:

| Role | Used for | Filename keywords |
|---|---|---|
| `menu` | Title screen and lobby music | menu, title, start, intro, theme, main |
| `game` | In-game background loop | ambient, background, bgm, game, loop, house, music, drone, atmos, tension |
| `breach` | Chase music while it's inside | chase, breach, hunt, danger, intense, panic, run |
| `win` / `lose` | Results screen | win, victory, dawn, safe / lose, lost, gameover, death, dead, fail, ending |
| `knock` | Knocking at doors (positional) | knock, door, bang |
| `scream` | Breaches and jump scares | scream, shriek, jump, scare, sting |
| `whisper` | Whispers at entrances and phone call | whisper, voice, breath, laugh, giggle, hum, sing, lullaby |
| `cue` | Alert when a new attack starts | alert, cue, warning, bell, chime, alarm, notify, ding |

Files that don't match any keyword are still used: tracks longer than 40 seconds become extra
background music, and shorter ones become random tension stingers.

To control this exactly, add `public/audio/manifest.json`:

```json
{
  "menu": "title theme.mp3",
  "game": ["house ambience.mp3", "creepy loop 2.mp3"],
  "breach": "chase.mp3",
  "win": "dawn.mp3",
  "lose": "game over.mp3",
  "knock": ["knock1.mp3", "knock2.mp3"],
  "scream": "scream.mp3",
  "whisper": "whispers.mp3",
  "cue": "alert.mp3",
  "stinger": ["sting1.mp3", "sting2.mp3"]
}
```

Any role without a file falls back to sound generated in the browser (knocks, scratching, glass
taps, whispers, creaks, heartbeat, a detuned music-box lullaby, a low drone, and chase music), so the
game always has sound.

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
| P | Menu and options (sensitivity, volume, drag-to-look, head bob) |

No right-clicks are needed. On tablets you get a joystick, a drag-to-look area and big buttons.

### Host settings
Vocabulary level (Year 3/4, Year 6/7, Year 9/10), banishments to win, game length (3–10 min),
time to reach an entrance, words per banishment, wards, how long it stays inside, wrong-answer
penalty, intensity (calm / normal / nightmare), entity speed, power-ups on/off, and whether attacks
show on the map.

The number of entrances under attack at the same time goes up with the number of players and with
intensity, and it ramps up over the first two minutes.

## Vocabulary

`server/vocab.js` holds about 75 words per level (223 in total), each with a definition, synonyms,
an antonym and a house-themed example sentence. Questions are generated on the fly in five styles
(definition → word, word → definition, fill the gap, synonym, antonym). Wrong options are always
drawn from a different meaning group, so there's only one right answer. Recently used words are
avoided, and the results screen lists the words to review.

Add words by appending lines in the format:

```
word|definition|synonym1,synonym2|antonym|Sentence with ___ for the word.|category
```

## The house

Four floors: **Basement** (cellar, storage, coal room, boiler room), **Ground** (hall, living room,
dining room, kitchen, study), **First** (landing, nursery, master bedroom, bathroom, your bedroom,
back room) and **Attic**. There are 24 entrances, from the front door and cat flap to the coal chute,
floor drain, boiler flue, fireplace, balcony door, roof hatch and skylight. The layout lives in
`public/js/layout.js` and is shared by the client and the server.

Look out for portraits that change when you're not looking, notes and diary pages that tell the
story of Eleanor Vane, writing on the walls, the dollhouse, the telephone, and the bathroom mirror…

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
public/js/textures.js     Procedurally painted textures (portraits, wallpaper, silhouettes…)
public/js/controls.js     Keyboard, mouse/touchpad and touch controls
public/js/startscreen.js  Animated screen-door title backdrop
public/audio/             Put your MP3s here
```
