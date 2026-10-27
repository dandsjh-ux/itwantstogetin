import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import {
  ENTRANCES, FLOORS, SALT_CIRCLES, POWERUP_SPOTS, SPAWN_POINTS, PLAYER_COLORS,
  entranceInteractPoint, INTERACT_RANGE, MUSIC_BOX,
} from './public/js/layout.js';
import { makeQuestion, getWordInfo, LEVEL_NAMES } from './server/vocab.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const MIN_PLAYERS = Math.max(1, parseInt(process.env.MIN_PLAYERS || '2', 10));
const MAX_PLAYERS = 6;
const TICK = 0.1;

const app = express();
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three', 'build'), { maxAge: '7d' }));
app.use('/vendor/three-addons', express.static(path.join(__dirname, 'node_modules', 'three', 'examples', 'jsm'), { maxAge: '7d' }));
app.get('/healthz', (_req, res) => res.send('ok'));

// Lists the audio files dropped into public/audio so the client can assign them to roles.
const AUDIO_DIR = path.join(__dirname, 'public', 'audio');
app.get('/api/audio', (_req, res) => {
  let files = [];
  let manifest = null;
  try {
    files = fs.readdirSync(AUDIO_DIR).filter((f) => /\.(mp3|ogg|wav|m4a)$/i.test(f));
    const mf = path.join(AUDIO_DIR, 'manifest.json');
    if (fs.existsSync(mf)) manifest = JSON.parse(fs.readFileSync(mf, 'utf8'));
  } catch (e) { /* no audio folder */ }
  res.json({ files, manifest });
});

const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  level: 'y34',
  target: 10,          // banishments needed to win
  duration: 600,       // seconds
  attackTime: 60,      // seconds to reach an entrance
  questions: 3,        // correct answers per banishment
  wards: 3,            // breaches allowed
  intensity: 'normal', // calm | normal | nightmare
  breachTime: 25,
  entitySpeed: 'normal',
  powerups: true,
  mapAttacks: true,
  wrongPenalty: 5,
};
const LIMITS = {
  target: [3, 40], duration: [180, 600], attackTime: [25, 150], questions: [1, 6], wards: [1, 6],
  breachTime: [10, 60], wrongPenalty: [0, 15],
};
const ENTITY_SPEEDS = { slow: 2.0, normal: 2.6, fast: 3.3 };
const INTENSITY = { calm: { conc: -1, gap: 1.4 }, normal: { conc: 0, gap: 1 }, nightmare: { conc: 1, gap: 0.65 } };

const rooms = new Map();
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 9);

function makeCode() {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do { c = Array.from({ length: 4 }, () => L[Math.floor(Math.random() * L.length)]).join(''); } while (rooms.has(c));
  return c;
}

function sanitizeName(n) {
  return String(n || '').replace(/[<>&"']/g, '').trim().slice(0, 16) || 'Player';
}

function publicPlayers(room) {
  return [...room.players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, ci: p.ci, host: p.id === room.hostId }));
}
function lobbyState(room) {
  return { code: room.code, hostId: room.hostId, phase: room.phase, players: publicPlayers(room), settings: room.settings, minPlayers: MIN_PLAYERS, levels: LEVEL_NAMES };
}
function emitLobby(room) { io.to(room.code).emit('lobby', lobbyState(room)); }

function freeColor(room) {
  const used = new Set([...room.players.values()].map((p) => p.ci));
  for (let i = 0; i < PLAYER_COLORS.length; i++) if (!used.has(i)) return i;
  return 0;
}

function newPlayer(socket, name, room) {
  const ci = freeColor(room);
  return {
    id: socket.id, name: sanitizeName(name), ci, color: PLAYER_COLORS[ci].hex,
    x: 0, y: 0, z: 0, yaw: 0, f: 1, torch: true, ready: false,
    inv: { salt: 0, plank: 0, charm: 0 }, speedUntil: 0, compassUntil: 0, caughtUntil: 0,
    quiz: null, stats: { banished: 0, correct: 0, wrong: 0, caught: 0 }, missed: [], mastered: [],
  };
}

// ---------------------------------------------------------------------------
// Game lifecycle

function startGame(room) {
  const s = room.settings;
  room.phase = 'intro';
  const players = [...room.players.values()];
  players.forEach((p, i) => {
    const sp = SPAWN_POINTS[i % SPAWN_POINTS.length];
    Object.assign(p, {
      x: sp.x, z: sp.z, y: FLOORS[sp.f].y, f: sp.f, yaw: Math.PI, ready: false,
      inv: { salt: 1, plank: 0, charm: 0 }, speedUntil: 0, compassUntil: 0, caughtUntil: 0, quiz: null,
      stats: { banished: 0, correct: 0, wrong: 0, caught: 0 }, missed: [], mastered: [],
    });
  });
  room.game = {
    timeLeft: s.duration, banished: 0, wards: s.wards, attacks: new Map(), nextAttack: 6,
    cooldowns: {}, breach: null, powerups: [], nextPowerup: 4, circles: [],
    planks: new Set(), recentWords: [], startedAt: Date.now(), elapsed: 0, result: null,
    totalBreaches: 0, musicBox: false,
  };
  // Seed a few powerups
  if (s.powerups) for (let i = 0; i < 3; i++) spawnPowerup(room);
  io.to(room.code).emit('gameStarting', {
    settings: s, players: players.map((p) => ({ id: p.id, name: p.name, color: p.color, ci: p.ci, x: p.x, y: p.y, z: p.z, f: p.f, yaw: p.yaw })),
  });
  room.introTimer = setTimeout(() => beginPlay(room), 75000);
}

function beginPlay(room) {
  if (room.phase !== 'intro') return;
  clearTimeout(room.introTimer);
  room.phase = 'playing';
  room.game.startedAt = Date.now();
  io.to(room.code).emit('gameBegin', {});
  notify(room, 'Listen... something is circling the house.', 'info');
}

function endGame(room, win, reason) {
  if (room.phase !== 'playing') return;
  room.phase = 'ended';
  const g = room.game;
  for (const p of room.players.values()) p.quiz = null;
  const words = (list) => list.map((w) => getWordInfo(room.settings.level, w)).filter(Boolean).map((w) => ({ word: w.word, def: w.def }));
  const missedAll = new Map();
  for (const p of room.players.values()) for (const w of p.missed) missedAll.set(w, (missedAll.get(w) || 0) + 1);
  io.to(room.code).emit('gameOver', {
    win, reason, banished: g.banished, target: room.settings.target, elapsed: Math.round(g.elapsed),
    breaches: g.totalBreaches,
    players: [...room.players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, stats: p.stats, missed: words([...new Set(p.missed)]), mastered: words([...new Set(p.mastered)]) })),
    review: words([...missedAll.keys()]),
  });
}

function notify(room, text, kind = 'info', extra = {}) {
  io.to(room.code).emit('notify', { text, kind, ...extra });
}

// ---------------------------------------------------------------------------
// Attacks

function maxConcurrent(room) {
  const n = room.players.size;
  const base = n <= 2 ? 2 : n <= 3 ? 2 : n <= 5 ? 3 : 4;
  const ramp = room.game.elapsed < 45 ? 1 : room.game.elapsed < 120 ? Math.min(2, base) : base;
  return clamp(ramp + INTENSITY[room.settings.intensity].conc, 1, 6);
}

function startAttack(room) {
  const g = room.game;
  const active = new Set([...g.attacks.values()].map((a) => a.e));
  const players = [...room.players.values()];
  const now = g.elapsed;
  const options = ENTRANCES.filter((e) => !active.has(e.id) && !(g.cooldowns[e.id] > now));
  if (!options.length) return;
  // Prefer entrances away from players so they have to move around the house
  const weights = options.map((e) => {
    const ip = entranceInteractPoint(e);
    let d = Infinity;
    for (const p of players) d = Math.min(d, Math.hypot(p.x - ip.x, p.z - ip.z) + Math.abs(p.f - e.f) * 8);
    const sameFloorActive = [...g.attacks.values()].some((a) => ENTRANCES.find((x) => x.id === a.e).f === e.f);
    return clamp(d, 4, 40) * (sameFloorActive ? 0.5 : 1);
  });
  let r = Math.random() * weights.reduce((s, w) => s + w, 0);
  let e = options[0];
  for (let i = 0; i < options.length; i++) { if ((r -= weights[i]) <= 0) { e = options[i]; break; } }

  let total = room.settings.attackTime;
  const planked = g.planks.has(e.id);
  if (planked) total += 30;
  const visual = e.kind === 'window' || e.kind === 'skylight' ? (Math.random() < 0.5 ? 'woman' : 'silhouette') : 'hand';
  const a = { id: uid(), e: e.id, total, left: total, banisher: null, progress: 0, required: room.settings.questions, visual, planked };
  g.attacks.set(a.id, a);
  io.to(room.code).emit('attackStart', { id: a.id, e: e.id, total, visual, planked });
}

function triggerBreach(room, a) {
  const g = room.game;
  const e = ENTRANCES.find((x) => x.id === a.e);
  g.attacks.delete(a.id);
  for (const p of room.players.values()) if (p.quiz && p.quiz.attackId === a.id) { p.quiz = null; io.to(p.id).emit('quizClosed', { reason: 'breach' }); }
  g.planks.delete(e.id);
  g.cooldowns[e.id] = g.elapsed + 25;
  g.wards -= 1;
  g.totalBreaches++;
  if (g.wards <= 0) {
    io.to(room.code).emit('breach', { e: e.id, final: true });
    setTimeout(() => endGame(room, false, 'breached'), 2500);
    g.breach = null;
    g.finalBreach = true;
    return;
  }
  const ip = entranceInteractPoint(e);
  g.breach = {
    e: e.id, left: room.settings.breachTime, x: ip.x, y: FLOORS[e.f].y, z: ip.z, f: e.f,
    target: null, safeTime: 0, caught: new Set(), spawnDelay: 1.5,
  };
  // Release anyone mid-quiz — attacks freeze during a breach
  for (const p of room.players.values()) if (p.quiz) { p.quiz = null; io.to(p.id).emit('quizClosed', { reason: 'breach' }); }
  for (const at of g.attacks.values()) at.banisher = null;
  io.to(room.code).emit('breach', { e: e.id, wards: g.wards, time: room.settings.breachTime });
}

function endBreach(room, reason) {
  const g = room.game;
  if (!g.breach) return;
  g.breach = null;
  g.nextAttack = Math.max(g.nextAttack, 6);
  io.to(room.code).emit('breachEnd', { reason });
}

function isProtected(room, p) {
  const g = room.game;
  const circles = [...SALT_CIRCLES, ...g.circles];
  return circles.some((c) => c.f === p.f && Math.hypot(p.x - c.x, p.z - c.z) <= c.r + 0.1);
}

function updateBreach(room, dt) {
  const g = room.game;
  const b = g.breach;
  b.left -= dt;
  if (b.spawnDelay > 0) { b.spawnDelay -= dt; return; }
  const now = Date.now();
  const players = [...room.players.values()];
  const active = players.filter((p) => p.caughtUntil < now);
  const exposed = active.filter((p) => !isProtected(room, p));

  if (!exposed.length) b.safeTime += dt; else b.safeTime = 0;
  if (b.left <= 0) return endBreach(room, 'timeout');
  if (b.safeTime >= 6) return endBreach(room, 'safe');

  // Choose target: closest exposed player (floor changes are costly)
  let target = null, best = Infinity;
  for (const p of exposed) {
    const d = Math.hypot(p.x - b.x, p.z - b.z) + Math.abs(p.f - b.f) * 7;
    if (d < best) { best = d; target = p; }
  }
  if (!target) {
    // Drift towards the nearest protected player and circle them menacingly
    for (const p of active) {
      const d = Math.hypot(p.x - b.x, p.z - b.z) + Math.abs(p.f - b.f) * 7;
      if (d < best) { best = d; target = p; }
    }
  }
  b.target = target ? target.id : null;
  if (!target) return;
  const speed = ENTITY_SPEEDS[room.settings.entitySpeed] || 2.6;
  const dx = target.x - b.x, dz = target.z - b.z, dy = target.y - b.y;
  const dist = Math.hypot(dx, dz);
  const step = speed * dt;
  if (dist > 0.01) { b.x += (dx / dist) * Math.min(step, dist); b.z += (dz / dist) * Math.min(step, dist); }
  b.y += clamp(dy, -1.6 * dt, 1.6 * dt);
  b.x = clamp(b.x, -13.5, 13.5); b.z = clamp(b.z, -9.5, 9.5);
  b.f = clamp(Math.round(b.y / 3.4) + 1, 0, 3);

  // Salt pushes the entity out
  for (const c of [...SALT_CIRCLES, ...g.circles]) {
    if (c.f !== b.f) continue;
    const cx = b.x - c.x, cz = b.z - c.z;
    const d = Math.hypot(cx, cz);
    const r = c.r + 0.45;
    if (d < r) {
      const nx = d > 0.001 ? cx / d : 1, nz = d > 0.001 ? cz / d : 0;
      b.x = c.x + nx * r; b.z = c.z + nz * r;
    }
  }

  // Catch
  for (const p of exposed) {
    if (p.f === b.f && Math.hypot(p.x - b.x, p.z - b.z) < 0.9 && Math.abs(p.y - b.y) < 1.5) {
      p.caughtUntil = now + 6000;
      p.stats.caught++;
      if (p.quiz) p.quiz = null;
      g.banished = Math.max(0, g.banished - 1);
      // Respawn at the nearest salt circle on another floor
      const circ = pick(SALT_CIRCLES.filter((c) => c.f !== p.f));
      Object.assign(p, { x: circ.x, z: circ.z, f: circ.f, y: FLOORS[circ.f].y });
      io.to(room.code).emit('caught', { id: p.id, name: p.name, respawn: { x: circ.x, z: circ.z, f: circ.f, y: FLOORS[circ.f].y } });
      b.left = Math.min(b.left, 8);
    }
  }
}

// ---------------------------------------------------------------------------
// Powerups

function spawnPowerup(room) {
  const g = room.game;
  const taken = new Set(g.powerups.map((p) => p.spot));
  const spots = POWERUP_SPOTS.map((s, i) => ({ ...s, i })).filter((s) => !taken.has(s.i));
  if (!spots.length) return;
  const s = pick(spots);
  const table = [['salt', 3], ['plank', 3], ['speed', 2], ['compass', 2], ['charm', 2], ['candle', 1]];
  let r = Math.random() * 13, type = 'salt';
  for (const [t, w] of table) { if ((r -= w) <= 0) { type = t; break; } }
  g.powerups.push({ id: uid(), type, spot: s.i, x: s.x, z: s.z, f: s.f, y: FLOORS[s.f].y });
}

// ---------------------------------------------------------------------------
// Tick

function tick(room) {
  if (room.phase !== 'playing') return;
  const g = room.game;
  const s = room.settings;
  const dt = TICK;
  g.elapsed += dt;
  g.timeLeft -= dt;
  if (g.timeLeft <= 0) { g.timeLeft = 0; return endGame(room, false, 'time'); }
  if (g.finalBreach) return;

  if (g.breach) {
    updateBreach(room, dt);
  } else {
    for (const a of [...g.attacks.values()]) {
      const rate = a.banisher ? 0.3 : 1;
      a.left -= dt * rate;
      if (a.left <= 0) { triggerBreach(room, a); break; }
    }
    g.nextAttack -= dt;
    if (!g.breach && !g.finalBreach && g.nextAttack <= 0 && g.attacks.size < maxConcurrent(room)) {
      startAttack(room);
      const gap = INTENSITY[s.intensity].gap;
      const n = room.players.size;
      g.nextAttack = rand(9, 17) * gap * (n >= 4 ? 0.85 : 1);
    }
  }

  if (s.powerups) {
    g.nextPowerup -= dt;
    const cap = 4 + Math.ceil(room.players.size / 2);
    if (g.nextPowerup <= 0) {
      if (g.powerups.length < cap) spawnPowerup(room);
      g.nextPowerup = rand(14, 22);
    }
  }
  g.circles = g.circles.filter((c) => c.until > g.elapsed);

  const now = Date.now();
  const state = {
    t: Math.ceil(g.timeLeft), b: g.banished, tg: s.target, w: g.wards,
    a: [...g.attacks.values()].map((a) => ({ id: a.id, e: a.e, l: +a.left.toFixed(1), tot: a.total, by: a.banisher, p: a.progress, r: a.required, v: a.visual, pk: a.planked })),
    br: g.breach ? { x: +g.breach.x.toFixed(2), y: +g.breach.y.toFixed(2), z: +g.breach.z.toFixed(2), f: g.breach.f, l: Math.ceil(g.breach.left), tgt: g.breach.target, on: g.breach.spawnDelay <= 0 } : null,
    pw: g.powerups.map((p) => ({ id: p.id, t: p.type, x: p.x, y: p.y, z: p.z, f: p.f })),
    c: g.circles.map((c) => ({ id: c.id, x: c.x, z: c.z, f: c.f, r: c.r, l: Math.ceil(c.until - g.elapsed) })),
    pk: [...g.planks], mb: g.musicBox,
    p: [...room.players.values()].map((p) => ({
      id: p.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(2), f: p.f, tr: p.torch,
      cg: p.caughtUntil > now, inv: p.inv, sp: Math.max(0, Math.ceil((p.speedUntil - now) / 1000)),
      cp: Math.max(0, Math.ceil((p.compassUntil - now) / 1000)), q: !!p.quiz, safe: isProtected(room, p),
    })),
  };
  io.to(room.code).volatile.emit('state', state);
}

setInterval(() => { for (const r of rooms.values()) { try { tick(r); } catch (e) { console.error(e); } } }, TICK * 1000);

// ---------------------------------------------------------------------------
// Quiz

function sendQuestion(room, p) {
  const g = room.game;
  const q = makeQuestion(room.settings.level, g.recentWords);
  g.recentWords.push(q.word);
  if (g.recentWords.length > 30) g.recentWords.shift();
  p.quiz.q = q;
  p.quiz.removed = [];
  const a = g.attacks.get(p.quiz.attackId);
  const e = ENTRANCES.find((x) => x.id === a.e);
  io.to(p.id).emit('quiz', {
    attackId: a.id, entrance: e.name, step: a.progress, required: a.required,
    prompt: q.prompt, focus: q.focus, sub: q.sub, options: q.options, flavour: q.flavour, type: q.type,
  });
}

function near(p, e) {
  const ip = entranceInteractPoint(e);
  return p.f === e.f && Math.hypot(p.x - ip.x, p.z - ip.z) <= INTERACT_RANGE + 1.2;
}

// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  let room = null;
  const me = () => room && room.players.get(socket.id);

  socket.on('createRoom', ({ name } = {}, cb) => {
    if (room) return cb?.({ error: 'Already in a room' });
    const code = makeCode();
    room = { code, hostId: socket.id, players: new Map(), phase: 'lobby', settings: { ...DEFAULT_SETTINGS }, game: null };
    rooms.set(code, room);
    room.players.set(socket.id, newPlayer(socket, name, room));
    socket.join(code);
    cb?.({ ok: true, code, id: socket.id });
    emitLobby(room);
  });

  socket.on('joinRoom', ({ code, name } = {}, cb) => {
    if (room) return cb?.({ error: 'Already in a room' });
    const r = rooms.get(String(code || '').toUpperCase().trim());
    if (!r) return cb?.({ error: 'No house with that code. Check the code on the host screen.' });
    if (r.phase !== 'lobby') return cb?.({ error: 'That game has already started.' });
    if (r.players.size >= MAX_PLAYERS) return cb?.({ error: 'That house is full (6 players).' });
    room = r;
    room.players.set(socket.id, newPlayer(socket, name, room));
    socket.join(room.code);
    cb?.({ ok: true, code: room.code, id: socket.id });
    emitLobby(room);
  });

  socket.on('updateSettings', (patch = {}) => {
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    const s = room.settings;
    for (const [k, v] of Object.entries(patch)) {
      if (!(k in DEFAULT_SETTINGS)) continue;
      if (k === 'level' && LEVEL_NAMES[v]) s.level = v;
      else if (k === 'intensity' && INTENSITY[v]) s.intensity = v;
      else if (k === 'entitySpeed' && ENTITY_SPEEDS[v]) s.entitySpeed = v;
      else if (k === 'powerups' || k === 'mapAttacks') s[k] = !!v;
      else if (LIMITS[k]) s[k] = clamp(Math.round(Number(v) || DEFAULT_SETTINGS[k]), ...LIMITS[k]);
    }
    emitLobby(room);
  });

  socket.on('setColor', (ci) => {
    if (!room || room.phase !== 'lobby') return;
    const p = me();
    ci = Number(ci);
    if (!p || !(ci >= 0 && ci < PLAYER_COLORS.length)) return;
    if ([...room.players.values()].some((o) => o.ci === ci && o.id !== p.id)) return;
    p.ci = ci; p.color = PLAYER_COLORS[ci].hex;
    emitLobby(room);
  });

  socket.on('startGame', (_, cb) => {
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    if (room.players.size < MIN_PLAYERS) return cb?.({ error: `You need at least ${MIN_PLAYERS} players.` });
    startGame(room);
    cb?.({ ok: true });
  });

  socket.on('ready', () => {
    const p = me();
    if (!p || room.phase !== 'intro') return;
    p.ready = true;
    io.to(room.code).emit('readyState', [...room.players.values()].map((p) => ({ id: p.id, ready: p.ready })));
    if ([...room.players.values()].every((p) => p.ready)) beginPlay(room);
  });

  socket.on('pos', (d) => {
    const p = me();
    if (!p || !d) return;
    if (p.caughtUntil > Date.now()) return;
    if ([d.x, d.y, d.z, d.yaw].every(Number.isFinite)) {
      p.x = clamp(d.x, -14, 14); p.y = clamp(d.y, -4, 10); p.z = clamp(d.z, -10, 10); p.yaw = d.yaw;
      p.f = clamp(d.f | 0, 0, 3); p.torch = !!d.tr;
    }
  });

  socket.on('interact', ({ attackId } = {}) => {
    const p = me();
    if (!p || room.phase !== 'playing') return;
    const g = room.game;
    if (g.breach || p.caughtUntil > Date.now()) return;
    const a = g.attacks.get(attackId);
    if (!a) return;
    const e = ENTRANCES.find((x) => x.id === a.e);
    if (!near(p, e)) return socket.emit('notify', { text: 'Get closer to the ' + e.name, kind: 'warn', private: true });
    if (a.banisher && a.banisher !== p.id && room.players.get(a.banisher)?.quiz) {
      return socket.emit('notify', { text: room.players.get(a.banisher).name + ' is already banishing this one!', kind: 'warn', private: true });
    }
    if (p.quiz) { const old = g.attacks.get(p.quiz.attackId); if (old && old.banisher === p.id) old.banisher = null; }
    a.banisher = p.id;
    p.quiz = { attackId: a.id };
    sendQuestion(room, p);
  });

  socket.on('answer', ({ choice } = {}) => {
    const p = me();
    if (!p || !p.quiz || !p.quiz.q || room.phase !== 'playing') return;
    const g = room.game;
    const a = g.attacks.get(p.quiz.attackId);
    if (!a) { p.quiz = null; return socket.emit('quizClosed', { reason: 'gone' }); }
    const q = p.quiz.q;
    const correct = choice === q.answer;
    if (correct) {
      p.stats.correct++;
      p.mastered.push(q.word);
      a.progress++;
    } else {
      p.stats.wrong++;
      p.missed.push(q.word);
      a.left = Math.max(1.5, a.left - room.settings.wrongPenalty);
    }
    const done = a.progress >= a.required;
    socket.emit('answerResult', { correct, answer: q.answer, correctText: q.correctText, word: q.word, def: q.def, done, progress: a.progress, required: a.required });
    if (!correct) io.to(room.code).emit('entityPush', { e: a.e });
    if (done) {
      g.attacks.delete(a.id);
      g.banished++;
      p.stats.banished++;
      p.quiz = null;
      const e = ENTRANCES.find((x) => x.id === a.e);
      if (g.planks.has(e.id)) g.planks.delete(e.id);
      g.cooldowns[e.id] = g.elapsed + 15;
      io.to(room.code).emit('banished', { e: e.id, by: p.id, name: p.name, count: g.banished });
      if (g.banished >= room.settings.target) setTimeout(() => endGame(room, true, 'banished'), 1800);
    } else {
      p.quiz.pendingNext = true;
      setTimeout(() => {
        if (p.quiz && p.quiz.pendingNext && g.attacks.has(p.quiz.attackId) && room.phase === 'playing') {
          p.quiz.pendingNext = false;
          sendQuestion(room, p);
        }
      }, correct ? 700 : 2200);
    }
  });

  socket.on('quitQuiz', () => {
    const p = me();
    if (!p || !p.quiz) return;
    const a = room.game?.attacks.get(p.quiz.attackId);
    if (a && a.banisher === p.id) a.banisher = null;
    p.quiz = null;
  });

  socket.on('useCharm', () => {
    const p = me();
    if (!p || !p.quiz || !p.quiz.q || p.inv.charm <= 0 || p.quiz.removed.length) return;
    p.inv.charm--;
    const wrong = [0, 1, 2, 3].filter((i) => i !== p.quiz.q.answer).sort(() => Math.random() - 0.5).slice(0, 2);
    p.quiz.removed = wrong;
    socket.emit('charmResult', { removed: wrong });
  });

  socket.on('pickup', ({ id } = {}) => {
    const p = me();
    if (!p || room.phase !== 'playing') return;
    const g = room.game;
    const i = g.powerups.findIndex((x) => x.id === id);
    if (i < 0) return;
    const pw = g.powerups[i];
    if (pw.f !== p.f || Math.hypot(pw.x - p.x, pw.z - p.z) > 2.6) return;
    const now = Date.now();
    if ((pw.type === 'salt' || pw.type === 'plank' || pw.type === 'charm') && p.inv[pw.type] >= 3) {
      return socket.emit('notify', { text: 'You can only carry 3.', kind: 'warn', private: true });
    }
    g.powerups.splice(i, 1);
    if (pw.type === 'speed') p.speedUntil = now + 15000;
    else if (pw.type === 'compass') p.compassUntil = now + 25000;
    else if (pw.type === 'candle') {
      for (const a of g.attacks.values()) { a.left += 15; a.total += 15; }
      notify(room, `${p.name} lit a Blessed Candle — every attack slowed!`, 'good');
    } else p.inv[pw.type]++;
    io.to(room.code).emit('pickedUp', { id, type: pw.type, by: p.id, name: p.name });
  });

  socket.on('useSalt', () => {
    const p = me();
    if (!p || room.phase !== 'playing' || p.inv.salt <= 0) return;
    const g = room.game;
    p.inv.salt--;
    g.circles.push({ id: uid(), x: p.x, z: p.z, f: p.f, r: 1.3, until: g.elapsed + 45 });
    io.to(room.code).emit('saltPlaced', { by: p.id, name: p.name, x: p.x, z: p.z, f: p.f });
  });

  socket.on('usePlank', ({ e: eid } = {}) => {
    const p = me();
    if (!p || room.phase !== 'playing' || p.inv.plank <= 0) return;
    const g = room.game;
    const e = ENTRANCES.find((x) => x.id === eid);
    if (!e || !near(p, e)) return;
    if (g.planks.has(e.id)) return socket.emit('notify', { text: 'Already boarded up.', kind: 'warn', private: true });
    p.inv.plank--;
    g.planks.add(e.id);
    const a = [...g.attacks.values()].find((x) => x.e === e.id);
    if (a) { a.left += 25; a.total += 25; a.planked = true; }
    io.to(room.code).emit('planked', { e: e.id, by: p.id, name: p.name });
  });

  // Winding the music box: she hears it and comes straight in through the dining room window
  socket.on('playMusicBox', () => {
    const p = me();
    if (!p || room.phase !== 'playing') return;
    const g = room.game;
    if (g.musicBox || g.breach || g.finalBreach || p.caughtUntil > Date.now()) return;
    if (p.f !== MUSIC_BOX.f || Math.hypot(p.x - MUSIC_BOX.x, p.z - MUSIC_BOX.z) > 2.6) return;
    g.musicBox = true;
    io.to(room.code).emit('musicBox', { by: p.id, name: p.name });
    setTimeout(() => {
      if (room.phase !== 'playing' || room.game !== g || g.breach || g.finalBreach) return;
      const eid = 'dining_side_window';
      triggerBreach(room, [...g.attacks.values()].find((a) => a.e === eid) || { id: 'musicbox', e: eid });
    }, 2500);
  });

  socket.on('torch', (on) => { const p = me(); if (p) p.torch = !!on; });

  socket.on('chatPing', ({ text } = {}) => {
    const p = me();
    if (!p || !room) return;
    const allowed = ['Help!', 'On my way!', 'I got this one!', 'Need salt!', 'Over here!'];
    if (allowed.includes(text)) io.to(room.code).emit('ping', { id: p.id, name: p.name, color: p.color, text, x: p.x, y: p.y, z: p.z, f: p.f });
  });

  socket.on('backToLobby', () => {
    if (!room || room.hostId !== socket.id || room.phase !== 'ended') return;
    room.phase = 'lobby';
    room.game = null;
    emitLobby(room);
  });

  socket.on('leaveRoom', () => leave());
  socket.on('disconnect', () => leave());

  function leave() {
    if (!room) return;
    const r = room;
    room = null;
    socket.leave(r.code);
    const p = r.players.get(socket.id);
    r.players.delete(socket.id);
    if (r.game && p?.quiz) { const a = r.game.attacks.get(p.quiz.attackId); if (a) a.banisher = null; }
    if (!r.players.size) { clearTimeout(r.introTimer); rooms.delete(r.code); return; }
    if (r.hostId === socket.id) r.hostId = r.players.keys().next().value;
    if (r.phase === 'lobby') emitLobby(r);
    else {
      io.to(r.code).emit('playerLeft', { id: socket.id, name: p?.name, hostId: r.hostId });
      if (r.phase === 'intro' && [...r.players.values()].every((x) => x.ready)) beginPlay(r);
    }
  }
});

server.listen(PORT, () => console.log(`It Wants To Get In — listening on :${PORT}`));
