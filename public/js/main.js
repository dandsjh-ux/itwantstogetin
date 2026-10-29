import { audio } from './audio.js';
import { StartScreen } from './startscreen.js';
import { Controls, isTouch } from './controls.js';
import { Game3D } from './game3d.js';
import * as TX from './textures.js';
import {
  ENTRANCES, FLOORS, ROOMS, WALLS, STAIRS, LADDERS, SALT_CIRCLES, PLAYER_COLORS, POWERUP_TYPES,
  entranceInteractPoint, roomAt,
} from './layout.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const socket = io({ transports: ['websocket', 'polling'] });

const S = {
  myId: null, code: null, lobby: null, settings: null, mode: 'menu', game: null, state: null,
  quiz: null, players: [], hostId: null, lastPrompt: '', overlay: null, phase: 'menu', hintsOn: true,
};
const opts = Object.assign({ sens: 1, turn: 2, music: 0.55, sfx: 0.85, drag: false, bob: true, quality: isTouch ? 'low' : 'high' }, (() => { try { return JSON.parse(localStorage.getItem('iwtgi_opts') || '{}'); } catch { return {}; } })());
const saveOpts = () => { try { localStorage.setItem('iwtgi_opts', JSON.stringify(opts)); } catch {} };

// ---------------------------------------------------------------------------
// Screens
function show(id) {
  for (const s of $$('.screen')) s.classList.toggle('active', s.id === id);
}
function overlay(id) {
  S.overlay = id;
  for (const o of $$('.overlay')) o.classList.toggle('active', o.id === id);
  const inPlay = S.phase === 'playing';
  controls.enabled = inPlay && !id;
  if (id) controls.releaseLock();
  $('#touch').classList.toggle('active', isTouch && inPlay && !id);
}
function toast(t, ms = 2200) {
  const el = $('#toast'); el.textContent = t; el.style.display = 'block';
  clearTimeout(toast.t); toast.t = setTimeout(() => (el.style.display = 'none'), ms);
}

// Title screen: a knock when the hand presses the glass; sometimes she sings when she appears
const bg = new StartScreen($('#bg'), (ev) => {
  if (S.phase !== 'menu' && S.phase !== 'lobby') return;
  if (ev === 'thump') audio.play('knock', { vol: 0.55, file: true, reverb: true });
  if (ev === 'appear' && Math.random() < 0.35) audio.play('singing', { vol: 0.35, muffle: 0.55 });
});
bg.start();
$('#grain').style.backgroundImage = `url(${TX.grainDataURL()})`;
const controls = new Controls(document.getElementById('game-root'));
controls.sens = opts.sens; controls.turnSpeed = opts.turn; controls.dragMode = opts.drag;

$('#gate').addEventListener('click', () => {
  audio.unlock();
  audio.setVolumes(opts.music, opts.sfx);
  audio.playMusic('menu');
  show('menu');
  $('#name').value = localStorage.getItem('iwtgi_name') || '';
  const code = new URLSearchParams(location.search).get('code');
  if (code) $('#join-code').value = code.toUpperCase();
  $('#name').focus();
});

// ---------------------------------------------------------------------------
// Menu
function nameVal() {
  const n = $('#name').value.trim();
  if (!n) { $('#menu-error').textContent = 'Enter your name first.'; $('#name').focus(); return null; }
  try { localStorage.setItem('iwtgi_name', n); } catch {}
  return n;
}
$('#btn-create').onclick = () => {
  const name = nameVal(); if (!name) return;
  socket.emit('createRoom', { name }, (r) => {
    if (r.error) return ($('#menu-error').textContent = r.error);
    S.myId = r.id; S.code = r.code;
  });
};
const doJoin = () => {
  const name = nameVal(); if (!name) return;
  const code = $('#join-code').value.trim().toUpperCase();
  if (code.length !== 4) return ($('#menu-error').textContent = 'Enter the 4-letter house code.');
  socket.emit('joinRoom', { name, code }, (r) => {
    if (r.error) return ($('#menu-error').textContent = r.error);
    S.myId = r.id; S.code = r.code;
  });
};
$('#btn-join').onclick = doJoin;
$('#join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
$('#name').addEventListener('keydown', (e) => { if (e.key === 'Enter') ($('#join-code').value ? doJoin() : $('#btn-create').click()); });

// ---------------------------------------------------------------------------
// Lobby
const SETTINGS_UI = [
  { k: 'level', label: 'Vocabulary level', type: 'seg', wide: true, opts: [['y34', 'Year 3/4'], ['y67', 'Year 6/7'], ['y910', 'Year 9/10']] },
  { k: 'target', label: 'Banishments to win', type: 'range', min: 3, max: 40, step: 1 },
  { k: 'duration', label: 'Game length', type: 'range', min: 180, max: 600, step: 60, fmt: (v) => v / 60 + ' min' },
  { k: 'attackTime', label: 'Time to reach an entrance', type: 'range', min: 25, max: 150, step: 5, fmt: (v) => v + ' s' },
  { k: 'questions', label: 'Words per banishment', type: 'range', min: 1, max: 6, step: 1 },
  { k: 'wards', label: 'Wards (breaches allowed)', type: 'range', min: 1, max: 6, step: 1 },
  { k: 'breachTime', label: 'Time it stays inside', type: 'range', min: 10, max: 60, step: 5, fmt: (v) => v + ' s' },
  { k: 'wrongPenalty', label: 'Wrong answer penalty', type: 'range', min: 0, max: 15, step: 1, fmt: (v) => '−' + v + ' s' },
  { k: 'intensity', label: 'Intensity', type: 'seg', opts: [['calm', 'Calm'], ['normal', 'Normal'], ['nightmare', 'Nightmare']] },
  { k: 'entitySpeed', label: 'Entity speed', type: 'seg', opts: [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']] },
  { k: 'powerups', label: 'Power-ups', type: 'seg', opts: [[true, 'On'], [false, 'Off']] },
  { k: 'mapAttacks', label: 'Show attacks on map', type: 'seg', opts: [[true, 'Yes'], [false, 'No']] },
];
let settingsBuilt = false;
function buildSettings() {
  const root = $('#settings'); root.innerHTML = '';
  for (const it of SETTINGS_UI) {
    const d = document.createElement('div'); d.className = 'set' + (it.wide ? ' wide' : ''); d.dataset.k = it.k;
    d.innerHTML = `<label>${it.label}: <span class="val"></span></label>`;
    if (it.type === 'seg') {
      const seg = document.createElement('div'); seg.className = 'seg';
      for (const [v, l] of it.opts) {
        const b = document.createElement('button'); b.textContent = l; b.dataset.v = JSON.stringify(v);
        b.onclick = () => socket.emit('updateSettings', { [it.k]: v });
        seg.appendChild(b);
      }
      d.appendChild(seg);
    } else {
      const r = document.createElement('input'); r.type = 'range'; r.min = it.min; r.max = it.max; r.step = it.step;
      r.oninput = () => { d.querySelector('.val').textContent = it.fmt ? it.fmt(+r.value) : r.value; clearTimeout(r._t); r._t = setTimeout(() => socket.emit('updateSettings', { [it.k]: +r.value }), 120); };
      d.appendChild(r);
    }
    root.appendChild(d);
  }
  settingsBuilt = true;
}
function renderLobby(L) {
  if (!settingsBuilt) buildSettings();
  const host = L.hostId === S.myId;
  $('#room-code').textContent = L.code;
  $('#join-url').textContent = location.host;
  $('#player-count').textContent = `(${L.players.length}/6)`;
  const ul = $('#player-list'); ul.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const p = L.players[i];
    const li = document.createElement('li');
    if (p) li.innerHTML = `<span class="dot" style="background:${p.color};color:${p.color}"></span>${esc(p.name)}${p.id === S.myId ? ' <span class="muted">(you)</span>' : ''}${p.host ? '<span class="badge">HOST</span>' : ''}`;
    else { li.className = 'empty-slot'; li.textContent = 'waiting for player…'; }
    ul.appendChild(li);
  }
  const cp = $('#color-pick'); cp.innerHTML = '';
  const me = L.players.find((p) => p.id === S.myId);
  PLAYER_COLORS.forEach((c, i) => {
    const b = document.createElement('button'); b.style.background = c.hex; b.title = c.name;
    const owner = L.players.find((p) => p.ci === i);
    if (owner && owner.id !== S.myId) b.disabled = true;
    if (me && me.ci === i) b.classList.add('sel');
    b.onclick = () => socket.emit('setColor', i);
    cp.appendChild(b);
  });
  for (const it of SETTINGS_UI) {
    const d = $(`.set[data-k="${it.k}"]`); const v = L.settings[it.k];
    d.querySelector('.val').textContent = it.type === 'seg' ? it.opts.find((o) => o[0] === v)?.[1] : (it.fmt ? it.fmt(v) : v);
    if (it.type === 'seg') for (const b of d.querySelectorAll('button')) { b.classList.toggle('sel', JSON.parse(b.dataset.v) === v); b.disabled = !host; }
    else { const r = d.querySelector('input'); if (document.activeElement !== r) r.value = v; r.disabled = !host; }
  }
  $('#host-only').textContent = host ? '(you are the host)' : '(only the host can change these)';
  $('#btn-start').style.display = host ? '' : 'none';
  const enough = L.players.length >= L.minPlayers;
  $('#btn-start').disabled = !enough;
  $('#lobby-msg').textContent = host ? (enough ? 'Everyone in? Start when ready.' : `Waiting for at least ${L.minPlayers} players…`) : 'Waiting for the host to start the game…';
}
socket.on('lobby', (L) => {
  S.lobby = L; S.settings = L.settings; S.hostId = L.hostId;
  if (S.phase !== 'lobby') {
    S.phase = 'lobby';
    endGameView();
    show('lobby'); bg.start(); audio.playMusic('menu');
  }
  renderLobby(L);
});
$('#btn-start').onclick = () => socket.emit('startGame', null, (r) => { if (r?.error) $('#lobby-msg').textContent = r.error; });
$('#btn-leave').onclick = () => leaveRoom();
function leaveRoom() {
  socket.emit('leaveRoom');
  S.phase = 'menu'; S.code = null;
  endGameView();
  show('menu'); bg.start(); audio.playMusic('menu');
}

// ---------------------------------------------------------------------------
// Game start: cutscene → rules → play
socket.on('gameStarting', (d) => {
  S.phase = 'intro'; S.settings = d.settings; S.players = d.players;
  S.attackNames = new Map();
  audio.stopMusic(2);
  bg.stop();
  if (!S.game) {
    S.game = new Game3D(document.getElementById('game-root'), controls, { quality: opts.quality, canScare: () => S.phase === 'playing' && !S.overlay && !S.quiz });
  } else resetGameWorld();
  S.game.headBob = opts.bob;
  S.game.setPlayers(d.players, S.myId);
  $('#rules-target').textContent = d.settings.target;
  // paint the jump-scare face now, during the cutscene, so it can't hitch when it's needed
  setTimeout(() => { jumpscare.url ||= TX.scareImage(); }, 1500);
  runCutscene();
});

function resetGameWorld() {
  const g = S.game;
  for (const v of [...g.attackVis.values()]) g._disposeAttack(v);
  g.phone = { ringing: false, rang: false, t: 110 + Math.random() * 110 };
  for (const n of g.notes) n.read = false;
  g.state = null;
  if (g.entity) { g.scene.remove(g.entity); g.entity = null; }
}

let cutTimers = [];
function runCutscene() {
  show('cutscene');
  const txt = $('#cut-text'), ttl = $('#cut-title');
  txt.textContent = ''; ttl.innerHTML = ''; txt.classList.remove('show');
  cutTimers.forEach(clearTimeout); cutTimers = [];
  const at = (ms, fn) => cutTimers.push(setTimeout(fn, ms));
  const lines = ['You are alone in a house.', 'Your parents have not come back.', 'But there is something outside.', 'And...'];
  let t = 600;
  audio.play('rumble', { vol: 0.6, dur: 3 });
  lines.forEach((l, i) => {
    at(t, () => {
      txt.textContent = l; txt.classList.add('show');
      if (i === 1) audio.play('crying', { vol: 0.45, muffle: 0.35 });
      if (i === 2) audio.play('knock', { vol: 0.9, file: true });
      if (i === 3) audio.play('whisper', { vol: 1 });
    });
    at(t + (i === 3 ? 2200 : 3000), () => txt.classList.remove('show'));
    t += i === 3 ? 3400 : 4200;
  });
  const words = ['IT', 'WANTS', 'TO', 'GET', 'IN'];
  // each word tolls once and echoes away — no crashes or screams here
  const gap = 1100, pitches = [1, 0.94, 1.06, 0.89, 0.84];
  words.forEach((w, i) => {
    at(t + i * gap, () => {
      const d = document.createElement('div'); d.textContent = w; ttl.appendChild(d);
      requestAnimationFrame(() => d.classList.add('show'));
      audio.play('titleword', { pitch: pitches[i], vol: i === words.length - 1 ? 1.1 : 0.9 });
      if (i === words.length - 1) d.classList.add('shake');
    });
  });
  at(t + words.length * gap + 3200, showRules);
}
$('#btn-skip').onclick = () => { cutTimers.forEach(clearTimeout); showRules(); };

const CONTROL_HELP = isTouch
  ? [['Left stick', 'move (push far to run)'], ['Drag right side', 'look around'], ['✋ Interact', 'banish / pick up / read'], ['🧂 Salt', 'pour a salt circle'], ['🪵 Plank', 'board up entrance'], ['🔦 Torch', 'flashlight on/off'], ['🗺️ (top right)', 'map']]
  : [['<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>↑</kbd><kbd>↓</kbd>', 'move'], ['<kbd>←</kbd><kbd>→</kbd>', 'turn (great for touchpads)'], ['Click, then move mouse / touchpad', 'look around'], ['<kbd>Shift</kbd>', 'run'], ['<kbd>E</kbd> / <kbd>Space</kbd>', 'banish · pick up · read'], ['<kbd>1</kbd>–<kbd>4</kbd>', 'answer quiz'], ['<kbd>Q</kbd>', 'pour salt circle'], ['<kbd>R</kbd>', 'board up with planks'], ['<kbd>C</kbd>', 'use lavender charm'], ['<kbd>F</kbd>', 'torch'], ['<kbd>M</kbd>', 'map'], ['<kbd>T</kbd>', 'call for help'], ['<kbd>P</kbd>', 'menu / options']];
const helpHTML = CONTROL_HELP.map(([k, v]) => `<div>${k} — ${v}</div>`).join('');
$('#rules-controls').innerHTML = helpHTML;
$('#pause-controls').innerHTML = helpHTML;
$('#keyhints').innerHTML = isTouch ? '' : 'WASD move · ←→ turn · Shift run<br>E interact · Q salt · R plank · F torch · M map · P menu';

function showRules() {
  if (S.phase !== 'intro') return;
  show('rules');
  $('#btn-ready').disabled = false; $('#btn-ready').textContent = "I'm ready";
  audio.playMusic('game');
}
$('#btn-ready').onclick = () => { socket.emit('ready'); $('#btn-ready').disabled = true; $('#btn-ready').textContent = 'Waiting for others…'; };
socket.on('readyState', (list) => {
  const n = list.filter((p) => p.ready).length;
  $('#ready-state').textContent = `${n}/${list.length} ready`;
});

socket.on('gameBegin', () => {
  cutTimers.forEach(clearTimeout);
  S.phase = 'playing';
  show('hud');
  overlay(null);
  S.game.start();
  S.game.torchOn = true;
  audio.playMusic('game');
  if (!isTouch && !controls.dragMode) $('#click-to-look').style.display = 'block';
  updateWards(S.settings.wards, S.settings.wards);
});

// Stream my position to the server (15 Hz)
setInterval(() => {
  if (S.phase !== 'playing' || !S.game) return;
  const P = S.game.player;
  socket.volatile.emit('pos', { x: P.x, y: P.y, z: P.z, yaw: P.yaw, f: P.f, tr: S.game.torchOn });
}, 66);

controls.on('lockchange', () => { $('#click-to-look').style.display = controls.locked || isTouch || controls.dragMode || S.phase !== 'playing' || S.overlay ? 'none' : 'block'; });

// ---------------------------------------------------------------------------
// State & HUD
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
const eById = Object.fromEntries(ENTRANCES.map((e) => [e.id, e]));
const pName = (id) => S.players.find((p) => p.id === id)?.name || 'Someone';
const pColor = (id) => S.players.find((p) => p.id === id)?.color || '#fff';

function updateWards(w, total) {
  $('#hud-wards').innerHTML = Array.from({ length: total }, (_, i) => `<span class="ward ${i < w ? '' : 'broken'}" title="Wards">🛡️</span>`).join('');
}

socket.on('state', (s) => {
  if (S.phase !== 'playing' || !S.game) return;
  S.state = s;
  S.game.applyState(s);
  const me = s.p.find((p) => p.id === S.myId);
  S.me = me;
  // top bar
  $('#hud-timer').textContent = fmtTime(s.t);
  $('#hud-timer').classList.toggle('low', s.t <= 60);
  $('#hud-bcount').textContent = `${s.b}/${s.tg}`;
  $('#hud-bbar i').style.width = Math.min(100, (s.b / s.tg) * 100) + '%';
  if (S.lastWards !== s.w) { updateWards(s.w, S.settings.wards); S.lastWards = s.w; }
  // attack list
  const P = S.game.player;
  renderAttacks(s.a, P);
  // team
  $('#team-list').innerHTML = s.p.filter((p) => p.id !== S.myId).map((p) => {
    const st = p.cg ? 'taken!' : p.q ? 'banishing' : p.safe ? 'in salt' : roomAt(p.f, p.x, p.z);
    return `<div class="tm"><span class="dot" style="background:${pColor(p.id)};color:${pColor(p.id)}"></span>${esc(pName(p.id))} <span class="st">${esc(st)}</span></div>`;
  }).join('');
  // inventory
  if (me) {
    const inv = me.inv;
    $('#inventory').innerHTML = [
      ['🧂', inv.salt, isTouch ? 'Salt' : 'Salt [Q]'],
      ['🪵', inv.plank, isTouch ? 'Planks' : 'Planks [R]'],
      ['🌿', inv.charm, isTouch ? 'Charm' : 'Charm [C]'],
    ].map(([i, n, l]) => `<div class="inv ${n ? '' : 'off'}"><b>${i} ${n}</b>${l}</div>`).join('')
      + (me.sp ? `<div class="inv buff"><b>⚡ ${me.sp}s</b>Adrenaline</div>` : '')
      + (me.cp ? `<div class="inv buff"><b>🧭 ${me.cp}s</b>Compass</div>` : '');
  }
  // breach banner
  const bb = $('#breach-banner');
  if (s.br) {
    const safe = me?.safe;
    bb.style.display = 'block';
    bb.innerHTML = safe ? `YOU ARE SAFE IN THE SALT<small>Stay still… it leaves in ${s.br.l}s</small>` : `IT IS INSIDE<small>Get to a salt circle! ${s.br.l}s</small>`;
  } else bb.style.display = 'none';
  if (S.overlay === 'map') drawMap();
  if (S.quiz) {
    const a = s.a.find((x) => x.id === S.quiz.attackId);
    if (a) $('#quiz-timer i').style.width = (a.l / a.tot) * 100 + '%';
  }
});

// Attack cards are updated in place so their entrance animation only plays once
const atkEls = new Map();
function renderAttacks(attacks, P) {
  const box = $('#attack-list');
  const live = new Set();
  for (const a of attacks) {
    live.add(a.id);
    let el = atkEls.get(a.id);
    if (!el) { el = document.createElement('div'); el.innerHTML = '<div class="an"><span class="n"></span><span class="t"></span></div><div class="af"></div><div class="ab"><i></i></div>'; box.appendChild(el); atkEls.set(a.id, el); }
    const e = eById[a.e];
    const df = e.f - P.f;
    const ip = entranceInteractPoint(e);
    const dist = Math.round(Math.hypot(P.x - ip.x, P.z - ip.z));
    const where = df === 0 ? `this floor · ${dist}m` : df > 0 ? `${FLOORS[e.f].name} · ↑ ${df} up` : `${FLOORS[e.f].name} · ↓ ${-df} down`;
    el.className = `atk ${a.l < 12 ? 'urgent' : ''} ${a.by ? 'banishing' : ''}`;
    el.querySelector('.n').textContent = e.name + (a.pk ? ' 🪵' : '');
    el.querySelector('.t').textContent = Math.ceil(a.l) + 's';
    el.querySelector('.af').innerHTML = where + (a.by ? ` · <b style="color:${pColor(a.by)}">${esc(pName(a.by))}</b> banishing ${a.p}/${a.r}` : '');
    el.querySelector('.ab i').style.width = (a.l / a.tot) * 100 + '%';
  }
  for (const [id, el] of atkEls) if (!live.has(id)) { el.remove(); atkEls.delete(id); }
}

// Per-frame HUD bits (prompt, compass, location, vignette)
function hudFrame() {
  requestAnimationFrame(hudFrame);
  if (S.phase !== 'playing' || !S.game) return;
  const g = S.game, P = g.player;
  $('#location').textContent = `${FLOORS[P.f].name} — ${g.roomName()}`;
  // interaction prompt
  let txt = '', cls = '';
  const it = g.getInteraction();
  const key = isTouch ? '✋' : '[E]';
  if (it && !S.overlay) {
    if (it.type === 'attack') {
      const by = it.a.by && it.a.by !== S.myId ? it.a.by : null;
      txt = by ? `${pName(by)} is banishing it — keep watch!` : `${key} Banish the thing at the ${it.e.name}`;
      cls = 'attack';
    } else if (it.type === 'pickup') txt = `${key} Pick up ${POWERUP_TYPES[it.p.t].name}`;
    else if (it.type === 'note') txt = `${key} Read: ${it.n.title}`;
    else if (it.type === 'phone') txt = `${key} Answer the phone…`;
    else if (it.type === 'musicbox') { txt = `${key} Wind the music box`; cls = 'attack'; }
    else if (it.type === 'ladder') txt = it.dir === 'up' ? `${key} Climb the ladder to the Attic` : `${key} Climb down the ladder`;
  }
  if (!txt && S.me?.inv.plank && !S.overlay) {
    const pt = g.getPlankTarget();
    if (pt && !S.state?.pk.includes(pt.e.id)) txt = `${isTouch ? '🪵' : '[R]'} Board up the ${pt.e.name}`;
  }
  const pr = $('#prompt');
  if (txt !== S.lastPrompt) { pr.textContent = txt; pr.style.display = txt ? 'block' : 'none'; S.lastPrompt = txt; }
  pr.className = cls;
  // compass
  const cp = $('#compass');
  if (S.me?.cp > 0 && S.state?.a.length) {
    const tgt = compassTarget();
    if (tgt) {
      cp.style.display = 'block';
      const yawTo = Math.atan2(-(tgt.x - P.x), -(tgt.z - P.z));
      let rel = yawTo - P.yaw; while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
      cp.querySelector('.arrow').style.transform = `rotate(${-90 - (rel * 180) / Math.PI}deg)`;
      cp.querySelector('.clabel').textContent = tgt.label;
    }
  } else cp.style.display = 'none';
  // danger vignette & frost
  const danger = g.entityDist < 7 || (S.state?.br && !S.me?.safe);
  $('#vignette').classList.toggle('danger', !!danger);
  if (g.entityDist < 6) { if (!hudFrame.hb || performance.now() - hudFrame.hb > 600 + g.entityDist * 120) { hudFrame.hb = performance.now(); audio.heartbeat(1.2 - g.entityDist / 8); } }
  let frost = 0;
  for (const v of g.attackVis.values()) { if (v.e.f === P.f) { const A = entranceInteractPoint(v.e); const d = Math.hypot(P.x - A.x, P.z - A.z); if (d < 5) frost = Math.max(frost, v.p * (1 - d / 5)); } }
  $('#frost').style.opacity = frost;
}
requestAnimationFrame(hudFrame);

function compassTarget() {
  const P = S.game.player;
  let best = null;
  for (const a of S.state.a) {
    const e = eById[a.e], ip = entranceInteractPoint(e);
    const d = Math.hypot(P.x - ip.x, P.z - ip.z) + Math.abs(e.f - P.f) * 10;
    if (!best || d < best.d) best = { d, e, ip };
  }
  if (!best) return null;
  if (best.e.f === P.f) return { x: best.ip.x, z: best.ip.z, label: best.e.name };
  const up = best.e.f > P.f;
  // every way off this floor in the right direction: stair ends and the attic ladder
  const routes = [];
  for (const st of STAIRS.filter((s) => (up ? s.f0 === P.f : s.f1 === P.f))) {
    const lowEnd = (st.axis === 'x') ? { x: st.low === 'min' ? st.x1 - 0.5 : st.x2 + 0.5, z: (st.z1 + st.z2) / 2 } : { x: (st.x1 + st.x2) / 2, z: st.low === 'min' ? st.z1 - 0.5 : st.z2 + 0.5 };
    const highEnd = (st.axis === 'x') ? { x: st.low === 'min' ? st.x2 + 0.5 : st.x1 - 0.5, z: (st.z1 + st.z2) / 2 } : { x: (st.x1 + st.x2) / 2, z: st.low === 'min' ? st.z2 + 0.5 : st.z1 - 0.5 };
    routes.push({ ...(up ? lowEnd : highEnd), how: up ? '↑ Upstairs' : '↓ Downstairs' });
  }
  for (const L of LADDERS) {
    if (up && L.f0 === P.f) routes.push({ ...L.base, how: '↑ Up the ladder' });
    if (!up && L.f1 === P.f) routes.push({ ...L.top, how: '↓ Down the ladder' });
  }
  if (!routes.length) return null;
  routes.sort((a, b) => Math.hypot(P.x - a.x, P.z - a.z) - Math.hypot(P.x - b.x, P.z - b.z));
  const r = routes[0];
  return { x: r.x, z: r.z, label: `${r.how} to the ${best.e.name}` };
}

// ---------------------------------------------------------------------------
// Notifications & events
function notify(text, kind = 'info') {
  const el = document.createElement('div'); el.className = 'ntf ' + kind; el.textContent = text;
  const box = $('#notifications'); box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.remove(), 4200);
}
socket.on('notify', (n) => notify(n.text, n.kind));

socket.on('attackStart', (a) => {
  const e = eById[a.e];
  notify(`Something is at the ${e.name.toUpperCase()}!  (${FLOORS[e.f].name})`, 'attack');
  audio.play('cue');
  if (Math.random() < 0.5) audio.play('stinger', { vol: 0.6 });
  if (S.game) S.game.flicker = 1;
});
socket.on('banished', (d) => {
  const e = eById[d.e];
  notify(`${d.name} banished it from the ${e.name}!  (${d.count}/${S.settings.target})`, 'good');
  if (S.game) {
    for (const v of S.game.attackVis.values()) if (v.e.id === d.e) S.game.removeAttack(v.a.id, 'banish');
    const A = entranceInteractPoint(e);
    audio.play('banish', { pos: { x: A.x, y: A.y + 1.5, z: A.z }, vol: d.by === S.myId ? 1.2 : 0.8 });
  }
});
socket.on('musicBox', (d) => {
  S.game?.playMusicBox();
  audio.duck(0.15, 6);
  notify(d.by === S.myId ? 'The music box begins to play… and something outside stops to listen.' : `${d.name} wound the music box. She heard it.`, 'attack');
  if (S.game) S.game.flicker = 2;
});
socket.on('entityPush', (d) => S.game?.pushAttack(d.e));
socket.on('breach', (d) => {
  const e = eById[d.e];
  if (S.quiz) closeQuiz(false);
  const A = entranceInteractPoint(e);
  const at = { x: A.x, y: A.y + 1.4, z: A.z };
  if (e.kind === 'window' || e.kind === 'skylight') audio.play('glass', { pos: at, vol: 1.3 });
  else audio.play('bang', { pos: at, vol: 1.3 });
  audio.play('glass', { vol: 0.5 });
  audio.play('scream', { vol: 1 });
  S.game.flicker = 2.5;
  if (d.final) { notify(`It came through the ${e.name}. The last ward is broken.`, 'attack'); jumpscare(); return; }
  notify(`IT GOT IN through the ${e.name}! A ward has broken. Find a salt circle!`, 'attack');
  audio.playMusic('breach');
});
socket.on('breachEnd', (d) => {
  notify(d.reason === 'safe' ? 'It could not find anyone… it has left. For now.' : 'It has slipped back outside. For now.', 'info');
  audio.playMusic('game');
});
socket.on('caught', (d) => {
  if (d.id === S.myId) {
    if (S.quiz) closeQuiz(false);
    jumpscare();
    S.game.frozen = true;
    $('#caught-overlay').style.display = 'flex';
    setTimeout(() => {
      S.game.teleport(d.respawn.x, d.respawn.y, d.respawn.z, d.respawn.f);
      $('#caught-overlay').style.display = 'none';
      S.game.frozen = false;
      notify('You wake up inside a salt circle… The team lost a banishment.', 'warn');
    }, 6000);
  } else notify(`It caught ${d.name}! The team lost a banishment.`, 'attack');
});
socket.on('pickedUp', (d) => {
  if (d.by === S.myId) { audio.play('pickup'); toast(`${POWERUP_TYPES[d.type].name}: ${POWERUP_TYPES[d.type].desc}`, 3000); }
  if (d.type === 'candle') audio.play('cue');
});
socket.on('saltPlaced', (d) => { audio.play('salt', { pos: { x: d.x, y: FLOORS[d.f].y + 0.5, z: d.z } }); if (d.by !== S.myId) notify(`${d.name} poured a salt circle in the ${roomAt(d.f, d.x, d.z)}`, 'info'); });
socket.on('planked', (d) => {
  const e = eById[d.e]; const A = entranceInteractPoint(e);
  audio.play('hammer', { pos: { x: A.x, y: A.y + 1, z: A.z } });
  notify(`${d.name} boarded up the ${e.name}`, 'good');
});
socket.on('ping', (d) => { notify(`${d.name}: "${d.text}" — ${roomAt(d.f, d.x, d.z)}`, 'warn'); });
socket.on('playerLeft', (d) => {
  notify(`${d.name} has left the house.`, 'warn');
  S.game?.removePlayer(d.id);
  S.hostId = d.hostId;
});

function jumpscare() {
  const sc = $('#scare');
  if (!jumpscare.url) jumpscare.url = TX.scareImage();
  sc.style.backgroundImage = `url(${jumpscare.url})`;
  sc.style.display = 'block';
  audio.play('scream', { vol: 1.4, file: true });
  audio.duck(0.2, 2);
  let n = 0;
  const iv = setInterval(() => { sc.style.transform = `scale(${1.1 + Math.random() * 0.2}) translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px)`; if (++n > 10) { clearInterval(iv); sc.style.display = 'none'; } }, 50);
}

// ---------------------------------------------------------------------------
// Actions
controls.on('interact', () => {
  if (S.overlay === 'note') return overlay(null);
  if (S.overlay || S.phase !== 'playing' || !S.game || S.game.frozen) return;
  const it = S.game.getInteraction();
  if (!it) return;
  if (it.type === 'attack') { if (!it.a.by || it.a.by === S.myId) socket.emit('interact', { attackId: it.a.id }); }
  else if (it.type === 'pickup') socket.emit('pickup', { id: it.p.id });
  else if (it.type === 'note') openNote(it.n.title, it.n.text, it.n);
  else if (it.type === 'ladder') S.game.startClimb(it.dir);
  else if (it.type === 'musicbox') socket.emit('playMusicBox');
  else if (it.type === 'phone') {
    S.game.answerPhone();
    audio.play('whisper', { vol: 1, file: true });
    openNote('The telephone', "Static. Then breathing.\n\nA woman's voice, very close: \"Your mother says it's alright, sweetheart. She says you can let me in now.\"\n\n\"Just open the door.\"\n\nThe line goes dead.");
  }
});
controls.on('salt', () => { if (S.phase === 'playing' && !S.overlay) { if (S.me?.inv.salt) socket.emit('useSalt'); else toast('No salt. Find a salt shaker.'); } });
controls.on('plank', () => {
  if (S.phase !== 'playing' || S.overlay) return;
  if (!S.me?.inv.plank) return toast('No planks. Find some first.');
  const t = S.game.getPlankTarget();
  if (!t) return toast('Stand next to an entrance to board it up.');
  socket.emit('usePlank', { e: t.e.id });
});
controls.on('torch', () => {
  if (S.phase !== 'playing') return;
  S.game.torchOn = !S.game.torchOn; socket.emit('torch', S.game.torchOn);
  audio.play('tick', { vol: 0.6 });
  $('[data-act="torch"]')?.classList.toggle('on', !S.game.torchOn);
});
controls.on('map', () => { if (S.phase !== 'playing') return; if (S.overlay === 'map') overlay(null); else if (!S.overlay) openMap(); });
controls.on('pause', () => { if (S.phase !== 'playing') return; if (S.overlay === 'pause') overlay(null); else if (!S.overlay) openPause(); });
controls.on('escape', () => {
  if (S.overlay === 'quiz') return closeQuiz(true);
  if (S.overlay) return overlay(null);
});
controls.on('charm', () => { if (S.quiz) useCharm(); });
controls.on('hints', () => { S.hintsOn = !S.hintsOn; $('#keyhints').style.display = S.hintsOn ? '' : 'none'; });
controls.on('ping', () => { if (S.phase === 'playing') socket.emit('chatPing', { text: 'Help!' }); });
for (let i = 1; i <= 4; i++) controls.on('opt' + i, () => { if (S.quiz) answer(i - 1); });
$('#btn-map').onclick = () => controls.fire('map');
$('#btn-pause').onclick = () => controls.fire('pause');

// ---------------------------------------------------------------------------
// Notes
function openNote(title, text, n) {
  if (n) n.read = true;
  $('#note-title').textContent = title;
  $('#note-text').textContent = text;
  overlay('note');
  audio.play('creak', { vol: 0.3, dur: 0.5 });
}
$('#btn-note-close').onclick = () => overlay(null);

// ---------------------------------------------------------------------------
// Quiz
socket.on('quiz', (q) => {
  S.quiz = q;
  overlay('quiz');
  audio.muffle(1400);
  $('#quiz-title').textContent = `Banishing: ${q.entrance}`;
  $('#quiz-steps').innerHTML = Array.from({ length: q.required }, (_, i) => `<i class="${i < q.step ? 'done' : ''}"></i>`).join('');
  $('#quiz-flavour').textContent = q.flavour;
  $('#quiz-prompt').textContent = q.prompt;
  $('#quiz-focus').textContent = q.focus || '';
  $('#quiz-focus').style.display = q.focus ? '' : 'none';
  $('#quiz-sub').innerHTML = q.sub ? esc(q.sub).replace('___', '<span class="blank">&nbsp;</span>') : '';
  $('#quiz-feedback').textContent = ''; $('#quiz-feedback').className = '';
  const box = $('#quiz-options'); box.innerHTML = '';
  q.options.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt-btn';
    b.innerHTML = `<span class="k">${i + 1}</span><span>${esc(o)}</span>`;
    b.onclick = () => answer(i);
    box.appendChild(b);
  });
  $('#btn-charm').style.display = S.me?.inv.charm ? '' : 'none';
  q.locked = false;
  audio.play('whisper', { vol: 0.3, file: false, dur: 1 });
});
function answer(i) {
  const q = S.quiz;
  if (!q || q.locked) return;
  q.locked = true;
  q.choice = i;
  socket.emit('answer', { choice: i });
}
socket.on('answerResult', (r) => {
  const q = S.quiz; if (!q) return;
  const btns = $$('#quiz-options .opt-btn');
  btns.forEach((b) => (b.disabled = true));
  btns[r.answer]?.classList.add('right');
  if (!r.correct) btns[q.choice]?.classList.add('wrong');
  const fb = $('#quiz-feedback');
  $('#quiz-steps').innerHTML = Array.from({ length: r.required }, (_, i) => `<i class="${i < r.progress ? 'done' : ''}"></i>`).join('');
  if (r.correct) {
    audio.play('correct');
    fb.className = 'good'; fb.textContent = r.done ? 'IT RECOILS! The entrance is sealed.' : `Yes! “${r.word}” — ${r.def}. It shrinks back…`;
  } else {
    audio.play('wrong');
    fb.className = 'bad'; fb.innerHTML = `It pushes closer! The answer was <b>${esc(r.correctText)}</b>. (${esc(r.word)}: ${esc(r.def)})`;
    S.game.flicker = 0.6;
  }
  if (r.done) setTimeout(() => closeQuiz(false), 1300);
});
socket.on('charmResult', ({ removed }) => {
  const btns = $$('#quiz-options .opt-btn');
  removed.forEach((i) => btns[i]?.classList.add('gone'));
  $('#btn-charm').style.display = 'none';
  audio.play('pickup');
});
socket.on('quizClosed', () => closeQuiz(false));
function useCharm() { if (S.me?.inv.charm) socket.emit('useCharm'); }
$('#btn-charm').onclick = useCharm;
function closeQuiz(sendQuit) {
  if (sendQuit && S.quiz) socket.emit('quitQuiz');
  S.quiz = null;
  audio.muffle(null);
  if (S.overlay === 'quiz') overlay(null);
}
$('#btn-quiz-close').onclick = () => closeQuiz(true);

// ---------------------------------------------------------------------------
// Map
let mapFloor = 1;
function openMap() { mapFloor = S.game.player.f; overlay('map'); drawMap(); }
$('#btn-map-close').onclick = () => overlay(null);
function drawMap() {
  const tabs = $('#map-tabs');
  const hot = new Set((S.state?.a || []).map((a) => eById[a.e].f));
  tabs.innerHTML = '';
  for (let f = 3; f >= 0; f--) {
    const b = document.createElement('button'); b.textContent = FLOORS[f].name + (f === S.game.player.f ? ' (you)' : '');
    if (f === mapFloor) b.classList.add('sel');
    if (hot.has(f) && S.settings.mapAttacks) b.classList.add('hot');
    b.onclick = () => { mapFloor = f; drawMap(); };
    tabs.appendChild(b);
  }
  const cv = $('#map-canvas'), g = cv.getContext('2d');
  const sc = 23.5, ox = 350, oz = 260;
  const X = (x) => ox + x * sc, ZZ = (z) => oz + z * sc; // front of the house (z+) at the bottom
  g.clearRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#0b0909'; g.fillRect(0, 0, cv.width, cv.height);
  for (const r of ROOMS.filter((r) => r.f === mapFloor)) {
    g.fillStyle = '#1b1514'; g.fillRect(X(r.x1), ZZ(r.z1), (r.x2 - r.x1) * sc, (r.z2 - r.z1) * sc);
  }
  g.fillStyle = '#7d7062';
  for (const w of WALLS.filter((w) => w.f === mapFloor && w.visible && w.y0 < 1.2)) g.fillRect(X(w.x1), ZZ(w.z1), Math.max(2, (w.x2 - w.x1) * sc), Math.max(2, (w.z2 - w.z1) * sc));
  g.font = '12px Inter, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#a89c8c';
  for (const r of ROOMS.filter((r) => r.f === mapFloor)) g.fillText(r.name, X((r.x1 + r.x2) / 2), ZZ((r.z1 + r.z2) / 2) + 4);
  for (const L of LADDERS.filter((l) => l.f0 === mapFloor || l.f1 === mapFloor)) {
    const h = L.hole;
    g.fillStyle = 'rgba(200,170,90,0.85)'; g.fillRect(X(h.x1), ZZ(h.z1), (h.x2 - h.x1) * sc, (h.z2 - h.z1) * sc);
    g.fillStyle = '#fff'; g.font = 'bold 11px Inter';
    g.fillText(L.f0 === mapFloor ? '↑ Attic ladder' : '↓ Ladder', X((h.x1 + h.x2) / 2), ZZ(h.z2) + 14);
  }
  for (const s of STAIRS.filter((s) => s.f0 === mapFloor || s.f1 === mapFloor)) {
    g.fillStyle = 'rgba(122,106,74,0.7)'; g.fillRect(X(s.x1), ZZ(s.z1), (s.x2 - s.x1) * sc, (s.z2 - s.z1) * sc);
    g.fillStyle = '#fff'; g.font = 'bold 11px Inter';
    g.fillText(s.f0 === mapFloor ? `↑ ${FLOORS[s.f1].name}` : `↓ ${FLOORS[s.f0].name}`, X((s.x1 + s.x2) / 2), ZZ((s.z1 + s.z2) / 2) + 4);
  }
  const circles = [...SALT_CIRCLES, ...(S.state?.c || [])].filter((c) => c.f === mapFloor);
  g.strokeStyle = '#eee'; g.lineWidth = 2;
  for (const c of circles) { g.beginPath(); g.arc(X(c.x), ZZ(c.z), c.r * sc, 0, Math.PI * 2); g.stroke(); }
  // entrances
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
  for (const e of ENTRANCES.filter((e) => e.f === mapFloor)) {
    const ip = entranceInteractPoint(e);
    const atk = S.settings.mapAttacks && (S.state?.a || []).find((a) => a.e === e.id);
    g.fillStyle = atk ? `rgba(255,${40 + pulse * 60},${40 + pulse * 60},1)` : '#4a3f38';
    g.beginPath(); g.arc(X(ip.x), ZZ(ip.z), atk ? 8 + pulse * 4 : 4, 0, Math.PI * 2); g.fill();
    if (atk) { g.fillStyle = '#ff9a9a'; g.font = 'bold 12px Inter'; g.fillText(`${e.name} ${Math.ceil(atk.l)}s`, X(ip.x), ZZ(ip.z) - 14); }
  }
  // players
  for (const p of S.state?.p || []) {
    if (p.f !== mapFloor) continue;
    const me = p.id === S.myId;
    const pp = me ? S.game.player : p;
    g.fillStyle = me ? '#fff' : pColor(p.id);
    g.beginPath(); g.arc(X(pp.x), ZZ(pp.z), me ? 7 : 6, 0, Math.PI * 2); g.fill();
    if (me) {
      const yaw = S.game.player.yaw;
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(pp.x), ZZ(pp.z)); g.lineTo(X(pp.x - Math.sin(yaw) * 0.9), ZZ(pp.z - Math.cos(yaw) * 0.9)); g.stroke();
    }
  }
  if (S.state?.br && S.state.br.f === mapFloor && S.state.br.on) {
    g.fillStyle = `rgba(230,230,255,${0.5 + pulse * 0.5})`; g.font = 'bold 18px serif'; g.fillText('👁', X(S.state.br.x), ZZ(S.state.br.z) + 6);
  }
  g.fillStyle = '#665'; g.font = '11px Inter'; g.textAlign = 'left';
  g.fillText('▼ Front of house (street)', 12, cv.height - 10);
}

// ---------------------------------------------------------------------------
// Pause / options
function openPause() {
  $('#opt-sens').value = opts.sens; $('#opt-turn').value = opts.turn; $('#opt-music').value = opts.music; $('#opt-sfx').value = opts.sfx;
  $('#opt-drag').checked = opts.drag; $('#opt-bob').checked = opts.bob; $('#opt-quality').checked = opts.quality === 'high';
  overlay('pause');
}
$('#opt-sens').oninput = (e) => { opts.sens = +e.target.value; controls.sens = opts.sens; saveOpts(); };
$('#opt-turn').oninput = (e) => { opts.turn = +e.target.value; controls.turnSpeed = opts.turn; saveOpts(); };
$('#opt-music').oninput = (e) => { opts.music = +e.target.value; audio.setVolumes(opts.music, opts.sfx); saveOpts(); };
$('#opt-sfx').oninput = (e) => { opts.sfx = +e.target.value; audio.setVolumes(opts.music, opts.sfx); saveOpts(); };
$('#opt-drag').onchange = (e) => { opts.drag = e.target.checked; controls.dragMode = opts.drag; saveOpts(); };
$('#opt-bob').onchange = (e) => { opts.bob = e.target.checked; if (S.game) S.game.headBob = opts.bob; saveOpts(); };
$('#opt-quality').onchange = (e) => { opts.quality = e.target.checked ? 'high' : 'low'; S.game?.setQuality(opts.quality); saveOpts(); };
$('#btn-resume').onclick = () => overlay(null);
$('#btn-fullscreen').onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); };
$('#btn-quit').onclick = () => { if (confirm('Leave the game? Your team will have to survive without you.')) leaveRoom(); };

// ---------------------------------------------------------------------------
// Game over
const STORIES = {
  banished: { win: true, title: 'DAWN', text: 'The knocking stops.\nGrey light creeps under the doors. Headlights sweep across the hall — your parents are home.\n\n…but they say they never phoned.' },
  time: { win: false, title: 'TOO LATE', text: 'The clock in the hall stops.\nYou did not drive it back enough times, and now it does not need to knock.\n\nIt is already inside. It always was.' },
  breached: { win: false, title: 'IT GOT IN', text: 'The last ward breaks like thin ice.\nCold fingers find the back of your neck.\n\nWhen your parents come home, the house is quiet. Every portrait has one more face.' },
};
socket.on('gameOver', (d) => {
  S.phase = 'ended';
  closeQuiz(false);
  overlay(null);
  controls.enabled = false; controls.releaseLock();
  $('#touch').classList.remove('active');
  const st = STORIES[d.reason] || STORIES.time;
  setTimeout(() => {
    show('results');
    $('#res-title').textContent = st.title; $('#res-title').className = d.win ? 'win' : 'lose';
    $('#res-story').textContent = st.text;
    $('#res-summary').textContent = `Banished ${d.banished}/${d.target} · ${fmtTime(d.elapsed)} survived · ${d.breaches} breach${d.breaches === 1 ? '' : 'es'}`;
    const rows = d.players.map((p) => {
      const tot = p.stats.correct + p.stats.wrong;
      return `<tr><td><span class="dot" style="display:inline-block;background:${p.color};color:${p.color}"></span> ${esc(p.name)}</td><td>${p.stats.banished}</td><td>${p.stats.correct}</td><td>${tot ? Math.round((p.stats.correct / tot) * 100) : 0}%</td><td>${p.stats.caught}</td></tr>`;
    }).join('');
    $('#res-table').innerHTML = `<tr><th>Player</th><th>Banished</th><th>Correct</th><th>Accuracy</th><th>Caught</th></tr>${rows}`;
    $('#res-review').innerHTML = d.review.length ? d.review.map((w) => `<li><b>${esc(w.word)}</b> — ${esc(w.def)}</li>`).join('') : '<li>No mistakes. Impressive.</li>';
    const me = d.players.find((p) => p.id === S.myId);
    $('#res-mastered').innerHTML = me && me.mastered.length ? me.mastered.map((w) => `<li><b>${esc(w.word)}</b> — ${esc(w.def)}</li>`).join('') : '<li>None this time.</li>';
    const host = S.hostId === S.myId;
    $('#btn-again').style.display = host ? '' : 'none';
    $('#res-wait').textContent = host ? '' : 'Waiting for the host to return to the lobby…';
    S.game?.stop();
    audio.stopAllLoops();
    audio.playMusic(d.win ? 'win' : 'lose');
    if (!d.win) setTimeout(() => audio.play('crying', { vol: 0.7 }), 1500);
  }, d.win ? 1200 : 2600);
});
$('#btn-again').onclick = () => socket.emit('backToLobby');
$('#btn-res-leave').onclick = () => leaveRoom();

function endGameView() {
  for (const el of atkEls.values()) el.remove();
  atkEls.clear();
  S.game?.stop();
  S.quiz = null;
  overlay(null);
  controls.enabled = false;
  $('#touch').classList.remove('active');
  $('#caught-overlay').style.display = 'none';
}

socket.on('disconnect', () => {
  if (S.phase !== 'menu') { toast('Connection lost. Returning to the menu…', 4000); S.phase = 'menu'; endGameView(); show('menu'); bg.start(); }
});

// Test hook: only on a local dev server, never on the deployed site
if (location.hostname === 'localhost' && new URLSearchParams(location.search).has('debug')) { window.__S = S; window.__sock = socket; }
