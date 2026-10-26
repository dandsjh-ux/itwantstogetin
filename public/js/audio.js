// Audio: user-supplied MP3s (public/audio) for music & cues, plus procedural Web Audio SFX.
// Files are matched to roles by filename keywords, or by public/audio/manifest.json.

const ROLE_PATTERNS = [
  ['breach', /(chase|breach|hunt|danger|intense|panic|run)/],
  ['win', /(win|victory|dawn|safe|success|relief)/],
  ['lose', /(lose|lost|game.?over|death|dead|fail|ending)/],
  ['menu', /(menu|title|start|intro|theme|main)/],
  ['game', /(ambien|background|bgm|game|loop|house|music|drone|atmos|tension)/],
  ['knock', /(knock|door|bang)/],
  ['scream', /(scream|shriek|jump|scare|sting)/],
  ['whisper', /(whisper|voice|breath|laugh|giggle|hum|sing|lullaby)/],
  ['cue', /(alert|cue|warning|bell|chime|alarm|notify|ding)/],
];
const MUSIC_ROLES = ['menu', 'game', 'breach', 'win', 'lose'];
const SHORT_ROLES = ['knock', 'scream', 'whisper', 'cue', 'stinger'];

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.musicVol = 0.55;
    this.sfxVol = 0.85;
    this.roles = {};      // role -> [url]
    this.buffers = {};    // url -> AudioBuffer
    this.music = null;    // { role, el | proc }
    this.loops = new Map();
    this.ready = false;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createDynamicsCompressor();
    this.master.threshold.value = -12; this.master.ratio.value = 4;
    this.master.connect(ctx.destination);
    this.sfxGain = ctx.createGain(); this.sfxGain.gain.value = this.sfxVol; this.sfxGain.connect(this.master);
    this.musicGain = ctx.createGain(); this.musicGain.gain.value = this.musicVol; this.musicGain.connect(this.master);
    this.reverb = ctx.createConvolver(); this.reverb.buffer = this._impulse(2.8, 2.2);
    this.revGain = ctx.createGain(); this.revGain.gain.value = 0.35;
    this.reverb.connect(this.revGain); this.revGain.connect(this.sfxGain);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.ready = true;
    this.loadFiles();
  }

  _impulse(sec, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  async loadFiles() {
    let data;
    try { data = await (await fetch('/api/audio')).json(); } catch { return; }
    const files = data.files || [];
    const roles = {};
    const add = (r, f) => (roles[r] = roles[r] || []).push('audio/' + encodeURIComponent(f));
    const mf = data.manifest || {};
    const assigned = new Set();
    for (const [role, v] of Object.entries(mf)) {
      for (const f of [].concat(v)) { if (files.includes(f)) { add(role, f); assigned.add(f); } }
    }
    const unmatched = [];
    for (const f of files) {
      if (assigned.has(f)) continue;
      const n = f.toLowerCase();
      const hit = ROLE_PATTERNS.find(([, re]) => re.test(n));
      if (hit) add(hit[0], f); else unmatched.push(f);
    }
    // Unmatched files: long ones become music, short ones become tension stingers
    await Promise.all(unmatched.map((f) => new Promise((res) => {
      const a = new Audio(); a.preload = 'metadata'; a.src = 'audio/' + encodeURIComponent(f);
      const done = () => { add(a.duration > 40 ? 'extra_music' : 'stinger', f); res(); };
      a.onloadedmetadata = done; a.onerror = res; setTimeout(res, 6000);
    })));
    // Fill missing music roles from spare long tracks
    const spare = [...(roles.extra_music || [])];
    for (const r of ['game', 'menu', 'breach']) if (!roles[r] && spare.length) roles[r] = [spare.shift()];
    if (spare.length) roles.game = [...(roles.game || []), ...spare];
    this.roles = roles;
    // Decode short cues so they can be positioned in 3D
    for (const r of SHORT_ROLES) for (const url of roles[r] || []) this._decode(url);
    if (this.music && !this.music.el) this.playMusic(this.music.role, true);
    console.log('[audio] roles', roles);
  }

  async _decode(url) {
    try {
      const ab = await (await fetch(url)).arrayBuffer();
      this.buffers[url] = await this.ctx.decodeAudioData(ab);
    } catch (e) { /* ignore */ }
  }

  setVolumes(music, sfx) {
    this.musicVol = music; this.sfxVol = sfx;
    if (!this.ctx) return;
    this.musicGain.gain.setTargetAtTime(music, this.ctx.currentTime, 0.1);
    this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.1);
    if (this.music?.el) this.music.el.volume = Math.min(1, music);
  }

  // ------------------------------------------------------------------ music
  playMusic(role, force = false) {
    if (!this.ctx) return;
    if (!force && this.music && this.music.role === role) return;
    this.stopMusic(1.5);
    const urls = this.roles[role];
    if (urls && urls.length) {
      const el = new Audio(urls[Math.floor(Math.random() * urls.length)]);
      el.loop = !(role === 'win' || role === 'lose');
      el.volume = 0;
      el.play().catch(() => {});
      const target = Math.min(1, this.musicVol);
      let v = 0;
      const iv = setInterval(() => { v = Math.min(target, v + 0.05); el.volume = v; if (v >= target) clearInterval(iv); }, 80);
      this.music = { role, el, iv };
    } else {
      this.music = { role, proc: this._procMusic(role) };
    }
  }

  stopMusic(fade = 1) {
    const m = this.music;
    this.music = null;
    if (!m) return;
    if (m.el) {
      clearInterval(m.iv);
      const el = m.el; let v = el.volume;
      const iv = setInterval(() => { v -= 0.05; if (v <= 0) { el.pause(); clearInterval(iv); } else el.volume = v; }, (fade * 1000) / 20);
    } else if (m.proc) m.proc.stop(fade);
  }

  duck(amount = 0.3, sec = 2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setTargetAtTime(this.musicVol * amount, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.musicVol, t + sec, 0.8);
    if (this.music?.el) {
      const el = this.music.el;
      el.volume = Math.min(1, this.musicVol * amount);
      setTimeout(() => { if (this.music?.el === el) el.volume = Math.min(1, this.musicVol); }, sec * 1000);
    }
  }

  // Procedural fallback music
  _procMusic(role) {
    const ctx = this.ctx, out = ctx.createGain();
    out.gain.value = 0; out.connect(this.musicGain);
    out.gain.setTargetAtTime(1, ctx.currentTime, 1.0);
    const nodes = [];
    let timer = null;
    const osc = (type, f, g, dest = out) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const gg = ctx.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(dest); o.start(); nodes.push(o); return { o, g: gg };
    };
    if (role === 'menu' || role === 'win') {
      // Detuned music-box lullaby
      const notes = role === 'win' ? [64, 67, 71, 76, 74, 71, 67, 69] : [69, 72, 76, 74, 72, 71, 72, 69, 68, 71, 74, 71, 69, 64, 65, 68];
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.38;
      const fb = ctx.createGain(); fb.gain.value = 0.45;
      delay.connect(fb); fb.connect(delay); delay.connect(out);
      let i = 0;
      const play = () => {
        const t = ctx.currentTime;
        const m = notes[i++ % notes.length];
        const f = 440 * Math.pow(2, (m - 69) / 12) * (1 + (Math.random() - 0.5) * 0.012);
        for (const [mul, a] of [[1, 0.14], [2.01, 0.04], [3.02, 0.015]]) {
          const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
          o.connect(g); g.connect(out); g.connect(delay); o.start(t); o.stop(t + 1.7);
        }
        timer = setTimeout(play, (i % 8 === 0 ? 1100 : 560) * (role === 'win' ? 0.9 : 1));
      };
      play();
      const pad = osc('sine', 55, 0.05);
      nodes.push(pad.o);
    } else if (role === 'game') {
      osc('sawtooth', 41.2, 0.035); osc('sawtooth', 41.6, 0.035); osc('sine', 82.4, 0.04); osc('sine', 98.6, 0.012);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; lp.connect(out);
      const n = ctx.createBufferSource(); n.buffer = this.noise; n.loop = true;
      const ng = ctx.createGain(); ng.gain.value = 0.05; n.connect(ng); ng.connect(lp); n.start(); nodes.push(n);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 250;
      lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); nodes.push(lfo);
      const swell = () => {
        const t = ctx.currentTime;
        const f = [233, 247, 311, 349][Math.floor(Math.random() * 4)];
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 4); g.gain.linearRampToValueAtTime(0, t + 9);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 9.2);
        timer = setTimeout(swell, 7000 + Math.random() * 9000);
      };
      timer = setTimeout(swell, 3000);
    } else if (role === 'breach') {
      osc('sawtooth', 36.7, 0.06); osc('sawtooth', 37.3, 0.06);
      const trem = ctx.createGain(); trem.gain.value = 0; trem.connect(out);
      osc('sawtooth', 880, 0.02, trem); osc('sawtooth', 932, 0.02, trem);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 9; const lg = ctx.createGain(); lg.gain.value = 0.7;
      lfo.connect(lg); lg.connect(trem.gain); lfo.start(); nodes.push(lfo);
      const beat = () => { this.heartbeat(0.9); timer = setTimeout(beat, 650); };
      beat();
    } else if (role === 'lose') {
      osc('sawtooth', 32.7, 0.07); osc('sawtooth', 33.4, 0.07); osc('sine', 46.2, 0.05);
    }
    return {
      stop: (fade) => {
        clearTimeout(timer);
        out.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
        setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch {} }); out.disconnect(); }, fade * 1000 + 500);
      },
    };
  }

  // ------------------------------------------------------------------ 3D
  setListener(p, fwd) {
    const L = this.ctx?.listener;
    if (!L) return;
    if (L.positionX) {
      const t = this.ctx.currentTime;
      L.positionX.setValueAtTime(p.x, t); L.positionY.setValueAtTime(p.y, t); L.positionZ.setValueAtTime(p.z, t);
      L.forwardX.setValueAtTime(fwd.x, t); L.forwardY.setValueAtTime(fwd.y, t); L.forwardZ.setValueAtTime(fwd.z, t);
      L.upX.setValueAtTime(0, t); L.upY.setValueAtTime(1, t); L.upZ.setValueAtTime(0, t);
    } else {
      L.setPosition(p.x, p.y, p.z); L.setOrientation(fwd.x, fwd.y, fwd.z, 0, 1, 0);
    }
  }

  // Creates an output node chain for a sound. pos optional; muffle 0..1 lowpasses for walls/floors.
  _out(opts = {}) {
    const ctx = this.ctx;
    const g = ctx.createGain(); g.gain.value = opts.vol ?? 1;
    let head = g;
    if (opts.muffle) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000 * (1 - opts.muffle) + 300;
      g.connect(lp); head = lp;
    }
    if (opts.pos) {
      const p = ctx.createPanner();
      p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 2.2; p.rolloffFactor = 1.1; p.maxDistance = 60;
      if (p.positionX) { p.positionX.value = opts.pos.x; p.positionY.value = opts.pos.y; p.positionZ.value = opts.pos.z; } else p.setPosition(opts.pos.x, opts.pos.y, opts.pos.z);
      head.connect(p); head = p;
    }
    head.connect(this.sfxGain);
    if (opts.reverb !== false) {
      const s = ctx.createGain(); s.gain.value = opts.wet ?? 0.6; head.connect(s); s.connect(this.reverb);
    }
    return g;
  }

  _noiseSrc(t, dur) {
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    n.start(t, Math.random() * 1.5, dur + 0.05);
    return n;
  }

  _file(role, opts) {
    const urls = (this.roles[role] || []).filter((u) => this.buffers[u]);
    if (!urls.length) return false;
    const buf = this.buffers[urls[Math.floor(Math.random() * urls.length)]];
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    s.playbackRate.value = opts.rate || 1;
    s.connect(this._out(opts)); s.start();
    return true;
  }

  hasFile(role) { return (this.roles[role] || []).some((u) => this.buffers[u]); }

  play(name, opts = {}) {
    if (!this.ready) return;
    const fn = this['s_' + name];
    if (fn) fn.call(this, opts);
  }

  // ------------------------------------------------------------------ procedural SFX
  s_knock(o) {
    if (o.file !== false && Math.random() < 0.5 && this._file('knock', o)) return;
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.8 });
    const n = o.count || 3, gap = o.gap || 0.28;
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * gap + Math.random() * 0.03;
      const s = this._noiseSrc(t, 0.12);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      s.connect(lp); lp.connect(g); g.connect(out);
      const os = ctx.createOscillator(); os.frequency.setValueAtTime(110, t); os.frequency.exponentialRampToValueAtTime(55, t + 0.15);
      const og = ctx.createGain(); og.gain.setValueAtTime(0.9, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      os.connect(og); og.connect(out); os.start(t); os.stop(t + 0.2);
    }
  }
  s_bang(o) { this.s_knock({ ...o, count: 1, vol: (o.vol || 1) * 1.6, file: false }); this.s_rumble({ ...o, dur: 0.6 }); }

  s_scratch(o) {
    const ctx = this.ctx, out = this._out(o), t = ctx.currentTime, d = o.dur || 0.9;
    const s = this._noiseSrc(t, d);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(2200, t); bp.frequency.linearRampToValueAtTime(3800, t + d);
    const g = ctx.createGain(); g.gain.value = 0;
    for (let i = 0; i < d * 18; i++) { const tt = t + i / 18; g.gain.setValueAtTime(0.1 + Math.random() * 0.5, tt); g.gain.setValueAtTime(0.02, tt + 0.03); }
    g.gain.setValueAtTime(0, t + d);
    s.connect(bp); bp.connect(g); g.connect(out);
  }

  s_tap(o) {
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.7 });
    const n = o.count || 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * (0.16 + Math.random() * 0.08);
      for (const f of [2300 + Math.random() * 300, 3500]) {
        const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = f;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.08);
      }
      const s = this._noiseSrc(t, 0.03); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.3, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      s.connect(hp); hp.connect(g2); g2.connect(out);
    }
  }

  s_creak(o) {
    const ctx = this.ctx, out = this._out(o), t = ctx.currentTime, d = o.dur || 1.2;
    const os = ctx.createOscillator(); os.type = 'sawtooth';
    const f0 = 60 + Math.random() * 60;
    os.frequency.setValueAtTime(f0, t); os.frequency.linearRampToValueAtTime(f0 * 0.6, t + d);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9; bp.frequency.setValueAtTime(600, t); bp.frequency.linearRampToValueAtTime(900, t + d);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.1);
    for (let i = 1; i < d * 12; i++) g.gain.setValueAtTime(0.15 + Math.random() * 0.45, t + i / 12);
    g.gain.linearRampToValueAtTime(0, t + d);
    os.connect(bp); bp.connect(g); g.connect(out); os.start(t); os.stop(t + d + 0.05);
  }

  s_whisper(o) {
    if (o.file !== false && Math.random() < 0.6 && this._file('whisper', o)) return;
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.9 }), t = ctx.currentTime, d = o.dur || 1.8;
    const s = this._noiseSrc(t, d);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6;
    const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.Q.value = 4;
    const g = ctx.createGain(); g.gain.value = 0;
    let tt = t;
    while (tt < t + d) {
      const syl = 0.08 + Math.random() * 0.16;
      bp.frequency.setValueAtTime(900 + Math.random() * 1800, tt); bp2.frequency.setValueAtTime(2500 + Math.random() * 2000, tt);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.5 + Math.random() * 0.5, tt + syl * 0.3); g.gain.linearRampToValueAtTime(0.02, tt + syl);
      tt += syl + Math.random() * 0.08;
    }
    s.connect(bp); s.connect(bp2); bp.connect(g); bp2.connect(g); g.connect(out);
  }

  s_rumble(o) {
    const ctx = this.ctx, out = this._out(o), t = ctx.currentTime, d = o.dur || 1.6;
    const s = this._noiseSrc(t, d);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.4, t + d * 0.3); g.gain.linearRampToValueAtTime(0, t + d);
    s.connect(lp); lp.connect(g); g.connect(out);
  }

  s_gurgle(o) {
    const ctx = this.ctx, out = this._out(o);
    for (let i = 0; i < 6; i++) {
      const t = ctx.currentTime + i * 0.12 + Math.random() * 0.1;
      const os = ctx.createOscillator(); os.type = 'sine';
      os.frequency.setValueAtTime(200 + Math.random() * 300, t); os.frequency.exponentialRampToValueAtTime(800 + Math.random() * 500, t + 0.06);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.1);
    }
  }

  heartbeat(vol = 1) {
    if (!this.ready) return;
    const ctx = this.ctx, out = this._out({ vol, reverb: false });
    for (const dt of [0, 0.22]) {
      const t = ctx.currentTime + dt;
      const os = ctx.createOscillator(); os.frequency.setValueAtTime(70, t); os.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      const g = ctx.createGain(); g.gain.setValueAtTime(dt ? 0.6 : 0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.22);
    }
  }

  s_stinger(o) {
    if (o.file !== false && this._file('stinger', { ...o, vol: (o.vol || 1) * 0.9 })) return;
    const ctx = this.ctx, out = this._out({ ...o, wet: 1 }), t = ctx.currentTime;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(3500, t + 0.4); lp.connect(out);
    for (const f of [146.8, 155.6, 207.7, 220, 311.1]) {
      const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.25); g.gain.exponentialRampToValueAtTime(0.001, t + 2.8);
      os.connect(g); g.connect(lp); os.start(t); os.stop(t + 3);
    }
    const s = this._noiseSrc(t, 0.5); const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    s.connect(g); g.connect(lp);
  }

  s_scream(o) {
    if (o.file !== false && this._file('scream', o)) return;
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.9 }), t = ctx.currentTime, d = o.dur || 1.5;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.5; bp.connect(out);
    for (const det of [0, 7, -12]) {
      const os = ctx.createOscillator(); os.type = 'sawtooth';
      os.frequency.setValueAtTime(500, t); os.frequency.exponentialRampToValueAtTime(1300 + det * 10, t + 0.25); os.frequency.linearRampToValueAtTime(900, t + d);
      const vib = ctx.createOscillator(); vib.frequency.value = 11; const vg = ctx.createGain(); vg.gain.value = 40; vib.connect(vg); vg.connect(os.frequency); vib.start(t); vib.stop(t + d);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.06); g.gain.linearRampToValueAtTime(0, t + d);
      os.connect(g); g.connect(bp); os.start(t); os.stop(t + d);
    }
    const s = this._noiseSrc(t, d); const g = ctx.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.linearRampToValueAtTime(0, t + d);
    s.connect(g); g.connect(bp);
  }

  s_banish(o) {
    const ctx = this.ctx, out = this._out({ ...o, wet: 1 }), t = ctx.currentTime;
    const s = this._noiseSrc(t, 1.2);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(5000, t + 1.0);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.8, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 1.2);
    s.connect(bp); bp.connect(g); g.connect(out);
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => {
      const tt = t + 0.75 + i * 0.07;
      const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.value = f;
      const gg = ctx.createGain(); gg.gain.setValueAtTime(0, tt); gg.gain.linearRampToValueAtTime(0.18, tt + 0.02); gg.gain.exponentialRampToValueAtTime(0.001, tt + 2);
      os.connect(gg); gg.connect(out); os.start(tt); os.stop(tt + 2.1);
    });
    this.s_scream({ ...o, vol: 0.25, dur: 0.8, file: false });
  }

  s_correct() {
    const ctx = this.ctx, out = this._out({ vol: 0.7, wet: 0.4 });
    [659.3, 987.8].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.09;
      const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.65);
    });
  }

  s_wrong() {
    const ctx = this.ctx, out = this._out({ vol: 0.8, wet: 0.5 }), t = ctx.currentTime;
    for (const f of [98, 103.8]) {
      const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.65);
    }
    this.s_bang({ vol: 0.5 });
  }

  s_pickup(o) {
    const ctx = this.ctx, out = this._out({ ...o, vol: 0.5, wet: 0.5 });
    [784, 988, 1175, 1568].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.05;
      const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.45);
    });
  }

  s_salt(o) {
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.3 }), t = ctx.currentTime;
    const s = this._noiseSrc(t, 0.9);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
    const g = ctx.createGain(); g.gain.value = 0;
    for (let i = 0; i < 9; i++) { g.gain.setValueAtTime(0.4, t + i * 0.1); g.gain.linearRampToValueAtTime(0.05, t + i * 0.1 + 0.08); }
    g.gain.setValueAtTime(0, t + 0.9);
    s.connect(hp); hp.connect(g); g.connect(out);
  }

  s_hammer(o) { this.s_knock({ ...o, count: 4, gap: 0.22, file: false }); }

  s_step(o) {
    const ctx = this.ctx, out = this._out({ ...o, reverb: false }), t = ctx.currentTime;
    const s = this._noiseSrc(t, 0.08);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 350 + Math.random() * 250;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    s.connect(lp); lp.connect(g); g.connect(out);
    if (o.creaky && Math.random() < 0.18) this.s_creak({ ...o, vol: 0.15, dur: 0.4 });
  }

  s_tick(o) {
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.5 }), t = ctx.currentTime;
    const os = ctx.createOscillator(); os.type = 'square'; os.frequency.value = o.tock ? 1400 : 1800;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.04);
  }

  s_ring(o) {
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.5 }), t = ctx.currentTime;
    const mod = ctx.createOscillator(); mod.type = 'square'; mod.frequency.value = 20;
    const mg = ctx.createGain(); mg.gain.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0;
    mod.connect(mg); mg.connect(g.gain);
    for (const f of [440, 480]) { const os = ctx.createOscillator(); os.frequency.value = f; os.connect(g); os.start(t); os.stop(t + 1.8); }
    const env = ctx.createGain(); env.gain.setValueAtTime(0.15, t); env.gain.setValueAtTime(0.15, t + 1.7); env.gain.linearRampToValueAtTime(0, t + 1.8);
    g.connect(env); env.connect(out); mod.start(t); mod.stop(t + 1.8);
  }

  s_cue(o) {
    if (this._file('cue', { ...o, reverb: false })) return;
    const ctx = this.ctx, out = this._out({ vol: 0.5, wet: 0.8 }), t = ctx.currentTime;
    for (const [f, dt] of [[392, 0], [370, 0.18]]) {
      const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t + dt); g.gain.linearRampToValueAtTime(0.3, t + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dt + 1.4);
      os.connect(g); g.connect(out); os.start(t + dt); os.stop(t + dt + 1.5);
    }
  }

  s_whoosh(o) {
    const ctx = this.ctx, out = this._out(o), t = ctx.currentTime;
    const s = this._noiseSrc(t, 0.8);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1; bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(2000, t + 0.4); bp.frequency.exponentialRampToValueAtTime(300, t + 0.8);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.7, t + 0.35); g.gain.linearRampToValueAtTime(0, t + 0.8);
    s.connect(bp); bp.connect(g); g.connect(out);
  }

  s_glass(o) {
    const ctx = this.ctx, out = this._out({ ...o, wet: 0.7 }), t = ctx.currentTime;
    for (let i = 0; i < 12; i++) {
      const tt = t + Math.random() * 0.5;
      const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = 2000 + Math.random() * 5000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.12, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.2);
      os.connect(g); g.connect(out); os.start(tt); os.stop(tt + 0.22);
    }
    this.s_bang(o);
  }

  // Looping positional bed (e.g. wind at a broken window). Returns stop function.
  loop(key, kind, pos, vol = 0.3) {
    if (!this.ready || this.loops.has(key)) return;
    const ctx = this.ctx, out = this._out({ pos, vol: 0, wet: 0.5 });
    const n = ctx.createBufferSource(); n.buffer = this.noise; n.loop = true;
    const f = ctx.createBiquadFilter();
    if (kind === 'wind') { f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.8; }
    else { f.type = 'lowpass'; f.frequency.value = 220; }
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.2 + Math.random() * 0.3;
    const lg = ctx.createGain(); lg.gain.value = 300; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    n.connect(f); f.connect(out); n.start();
    out.gain.setTargetAtTime(vol, ctx.currentTime, 0.5);
    this.loops.set(key, { n, lfo, out });
  }
  stopLoop(key) {
    const l = this.loops.get(key);
    if (!l) return;
    this.loops.delete(key);
    l.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    setTimeout(() => { try { l.n.stop(); l.lfo.stop(); } catch {} }, 1500);
  }
  stopAllLoops() { for (const k of [...this.loops.keys()]) this.stopLoop(k); }
}

export const audio = new AudioSys();
