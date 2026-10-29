// Procedurally painted canvas textures (no image assets needed).
import * as THREE from 'three';

let seed = 1337;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const cache = new Map();

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep = [1, 1]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4;
  return t;
}
function stains(g, w, h, n, col, maxR) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h, r = 10 + rnd() * maxR;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
function grain(g, w, h, a = 0.08) {
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 255 * a; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}

export function surface(kind) {
  if (cache.has(kind)) return cache.get(kind);
  let c, g, t;
  const S = 256;
  switch (kind) {
    case 'wall': case 'ext1': case 'ext2': {
      [c, g] = canvas(S, S);
      const base = kind === 'ext2' ? '#4b4a3a' : '#4a3f33';
      g.fillStyle = base; g.fillRect(0, 0, S, S);
      // damask-ish stripes and motifs
      g.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = 0; x < S; x += 32) g.fillRect(x, 0, 6, S);
      g.strokeStyle = 'rgba(210,180,120,0.10)'; g.lineWidth = 2;
      for (let y = 16; y < S; y += 64) for (let x = 16; x < S; x += 64) {
        g.beginPath(); g.ellipse(x + 16, y + 16, 10, 18, 0, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(x + 16, y - 6); g.lineTo(x + 16, y + 38); g.stroke();
      }
      stains(g, S, S, 6, 'rgba(20,12,4,0.35)', 60);
      grain(g, S, S, 0.06);
      t = tex(c, [1, 1]); break;
    }
    case 'stone': case 'ext0': {
      [c, g] = canvas(S, S);
      g.fillStyle = '#2b2925'; g.fillRect(0, 0, S, S);
      for (let row = 0; row < 8; row++) for (let col = 0; col < 4; col++) {
        const off = row % 2 ? 32 : 0, x = col * 64 + off, y = row * 32;
        const v = 50 + rnd() * 30;
        g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
        g.fillRect(x + 2, y + 2, 60, 28); g.fillRect(x + 2 - 256, y + 2, 60, 28);
      }
      stains(g, S, S, 8, 'rgba(10,30,10,0.35)', 50);
      grain(g, S, S, 0.12);
      t = tex(c, [1, 1]); break;
    }
    case 'attic': case 'ext3': case 'panel': case 'rail': {
      [c, g] = canvas(S, S);
      const dark = kind === 'panel' || kind === 'rail';
      g.fillStyle = dark ? '#2a1a10' : '#3b2a1c'; g.fillRect(0, 0, S, S);
      for (let x = 0; x < S; x += 32) {
        const v = rnd() * 20;
        g.fillStyle = `rgba(${60 + v},${40 + v},${24 + v},0.6)`; g.fillRect(x + 1, 0, 30, S);
        g.strokeStyle = 'rgba(0,0,0,0.25)';
        for (let i = 0; i < 6; i++) { g.beginPath(); const y = rnd() * S; g.moveTo(x + 3, y); g.bezierCurveTo(x + 10, y + 20, x + 20, y - 20, x + 29, y + 5); g.stroke(); }
      }
      grain(g, S, S, 0.08);
      t = tex(c, [1, 1]); break;
    }
    case 'floor1': case 'floor2': case 'floor3': {
      [c, g] = canvas(S, S);
      g.fillStyle = kind === 'floor3' ? '#2e2216' : '#3a2617'; g.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 32) {
        let x = -rnd() * 128;
        while (x < S) {
          const len = 90 + rnd() * 120, v = rnd() * 25;
          g.fillStyle = `rgb(${58 + v},${38 + v * 0.7},${22 + v * 0.4})`; g.fillRect(x + 1, y + 1, len - 2, 30);
          x += len;
        }
      }
      stains(g, S, S, 5, 'rgba(0,0,0,0.3)', 50);
      grain(g, S, S, 0.07);
      t = tex(c, [6, 6]); break;
    }
    case 'floor0': {
      [c, g] = canvas(S, S);
      g.fillStyle = '#3a3835'; g.fillRect(0, 0, S, S);
      stains(g, S, S, 14, 'rgba(15,15,10,0.4)', 70);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) { g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 50; y += (rnd() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
      grain(g, S, S, 0.15);
      t = tex(c, [6, 6]); break;
    }
    case 'ceiling': {
      [c, g] = canvas(S, S);
      g.fillStyle = '#5a554c'; g.fillRect(0, 0, S, S);
      stains(g, S, S, 6, 'rgba(60,40,10,0.35)', 80);
      grain(g, S, S, 0.05);
      t = tex(c, [6, 6]); break;
    }
    case 'ground': {
      // moonlit snow: soft drifts, a faint blue cast, a scatter of glints
      [c, g] = canvas(S, S);
      g.fillStyle = '#9aa7ba'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 46; i++) {
        const x = rnd() * S, y = rnd() * S, r = 22 + rnd() * 50, lit = rnd() < 0.5;
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
          const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
          gr.addColorStop(0, lit ? 'rgba(220,230,245,0.28)' : 'rgba(60,75,100,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
        }
      }
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.5})`; g.fillRect(rnd() * S, rnd() * S, 1, 1); }
      t = tex(c, [30, 30]); break;
    }
    default: return surface('wall');
  }
  cache.set(kind, t);
  return t;
}

// ---------------------------------------------------------------------------
// Portraits
function face(g, cx, cy, s, opts = {}) {
  // head
  g.fillStyle = opts.skin || '#c9bfae';
  g.beginPath(); g.ellipse(cx, cy, s * 0.36, s * 0.48, 0, 0, Math.PI * 2); g.fill();
  const shade = g.createRadialGradient(cx - s * 0.1, cy - s * 0.1, s * 0.05, cx, cy, s * 0.55);
  shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = shade; g.beginPath(); g.ellipse(cx, cy, s * 0.36, s * 0.48, 0, 0, Math.PI * 2); g.fill();
  // eyes
  if (!opts.noEyes) {
    g.fillStyle = opts.eyeCol || '#050303';
    for (const dx of [-0.13, 0.13]) { g.beginPath(); g.ellipse(cx + dx * s, cy - 0.05 * s, s * 0.07, s * (opts.wideEyes ? 0.08 : 0.05), 0, 0, Math.PI * 2); g.fill(); }
    if (opts.glint) { g.fillStyle = '#ddd'; for (const dx of [-0.12, 0.14]) g.fillRect(cx + dx * s, cy - 0.07 * s, 2, 2); }
  }
  // mouth
  g.strokeStyle = 'rgba(40,10,10,0.9)'; g.lineWidth = Math.max(1, s * 0.02);
  g.beginPath();
  if (opts.smile) { g.moveTo(cx - s * 0.12, cy + s * 0.2); g.quadraticCurveTo(cx, cy + s * 0.3, cx + s * 0.12, cy + s * 0.2); }
  else if (opts.open) { g.fillStyle = '#100404'; g.ellipse(cx, cy + s * 0.24, s * 0.06, s * 0.1, 0, 0, Math.PI * 2); g.fill(); }
  else { g.moveTo(cx - s * 0.1, cy + s * 0.23); g.lineTo(cx + s * 0.1, cy + s * 0.23); }
  g.stroke();
}
function bust(g, cx, top, s, col) {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(cx - s * 0.9, top + s * 1.6); g.quadraticCurveTo(cx - s * 0.7, top + s * 0.4, cx, top + s * 0.35);
  g.quadraticCurveTo(cx + s * 0.7, top + s * 0.4, cx + s * 0.9, top + s * 1.6); g.fill();
}
function hair(g, cx, cy, s, len) {
  g.fillStyle = '#060404';
  g.beginPath(); g.moveTo(cx - s * 0.42, cy + len); g.quadraticCurveTo(cx - s * 0.55, cy - s * 0.5, cx, cy - s * 0.55);
  g.quadraticCurveTo(cx + s * 0.55, cy - s * 0.5, cx + s * 0.42, cy + len); g.lineTo(cx + s * 0.3, cy + len);
  g.quadraticCurveTo(cx + s * 0.32, cy, cx + s * 0.2, cy - s * 0.25); g.lineTo(cx - s * 0.2, cy - s * 0.25); g.quadraticCurveTo(cx - s * 0.32, cy, cx - s * 0.3, cy + len); g.fill();
}

export function portrait(variant, alt = false) {
  const key = 'portrait_' + variant + (alt ? '_alt' : '');
  if (cache.has(key)) return cache.get(key);
  const W = 256, H = 320;
  const [c, g] = canvas(W, H);
  const bg = g.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H / 2, H * 0.7);
  bg.addColorStop(0, '#3a2f22'); bg.addColorStop(1, '#0a0705');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const cx = W / 2;
  switch (variant) {
    case 'lady':
      bust(g, cx, 140, 110, '#d8d4cc');
      if (alt) { hair(g, cx, 125, 120, 120); g.fillStyle = '#060404'; g.fillRect(cx - 44, 70, 88, 110); }
      else { hair(g, cx, 125, 120, 110); face(g, cx, 125, 120, { skin: '#d9d2c6', eyeCol: '#000', wideEyes: true }); g.fillStyle = '#060404'; g.fillRect(cx - 36, 60, 18, 120); }
      break;
    case 'man':
      bust(g, cx, 150, 110, '#1b1612');
      face(g, cx, 130, 110, { skin: '#b9a891', smile: alt });
      g.fillStyle = '#16100c'; g.fillRect(cx - 40, 64, 80, 20);
      if (alt) { g.fillStyle = 'rgba(120,0,0,0.8)'; g.fillRect(cx - 18, 125, 4, 40); g.fillRect(cx + 16, 125, 4, 46); }
      break;
    case 'child':
      bust(g, cx, 170, 90, '#2b3241');
      face(g, cx, 150, 95, { skin: '#cbbca7', noEyes: alt, open: alt });
      g.fillStyle = '#3a2512'; g.beginPath(); g.ellipse(cx, 112, 38, 18, 0, Math.PI, 0); g.fill();
      break;
    case 'family': {
      for (const [x, y, s, col] of [[70, 160, 70, '#1b1612'], [130, 165, 66, '#2a2420'], [190, 190, 50, '#2b3241']]) { bust(g, x, y, s, col); face(g, x, y - 8, s, { skin: '#bfae96' }); }
      // the pale figure behind them
      g.globalAlpha = alt ? 0.85 : 0.35;
      g.fillStyle = '#e6e2da'; g.beginPath(); g.ellipse(212, 92, 16, 22, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#060404'; g.fillRect(196, 76, 32, 70);
      g.globalAlpha = 1;
      break;
    }
    case 'eyes': {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const n = alt ? 9 : 2;
      for (let i = 0; i < n; i++) {
        const x = i === 0 ? cx - 30 : i === 1 ? cx + 30 : 30 + rnd() * (W - 60), y = i < 2 ? H * 0.45 : 30 + rnd() * (H - 60);
        g.fillStyle = '#d8d0c0'; g.beginPath(); g.ellipse(x, y, 14, 7, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#300'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
      }
      break;
    }
    case 'scratched':
      bust(g, cx, 150, 110, '#2b1e18');
      face(g, cx, 130, 110, { skin: '#b9a891' });
      g.strokeStyle = 'rgba(20,10,5,0.95)'; g.lineWidth = 3;
      for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(cx - 50 + rnd() * 100, 70 + rnd() * 30); g.lineTo(cx - 50 + rnd() * 100, 150 + rnd() * 50); g.stroke(); }
      break;
    case 'house': {
      g.fillStyle = '#0d1018'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#c8c8b8'; g.beginPath(); g.arc(200, 50, 18, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#18140f'; g.fillRect(48, 140, 160, 130);
      g.beginPath(); g.moveTo(38, 140); g.lineTo(128, 70); g.lineTo(218, 140); g.fill();
      g.fillStyle = '#e1b85a';
      for (const [x, y] of [[70, 165], [160, 165], [70, 215], [160, 215]]) g.fillRect(x, y, 22, 26);
      g.fillStyle = '#211'; g.fillRect(116, 225, 24, 45);
      // figure in the garden, nearer in the alt
      g.fillStyle = '#eee';
      const fx = alt ? 128 : 30, fy = alt ? 270 : 285, fs = alt ? 1.4 : 0.8;
      g.beginPath(); g.ellipse(fx, fy - 30 * fs, 4 * fs, 5 * fs, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(fx - 8 * fs, fy); g.lineTo(fx, fy - 26 * fs); g.lineTo(fx + 8 * fs, fy); g.fill();
      g.fillStyle = '#122016'; g.fillRect(0, 285, W, 35);
      break;
    }
    case 'blank':
      if (alt) { g.fillStyle = '#e6e2da'; g.beginPath(); g.ellipse(cx, 150, 34, 46, 0, 0, Math.PI * 2); g.fill(); hair(g, cx, 150, 100, 140); g.fillStyle = '#000'; g.fillRect(cx - 30, 110, 60, 130); }
      break;
  }
  // varnish & age
  stains(g, W, H, 8, 'rgba(60,40,10,0.25)', 60);
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  grain(g, W, H, 0.1);
  const t = tex(c);
  cache.set(key, t);
  return t;
}

export function writing(text, color = '#7a1010', size = 1) {
  const key = 'w_' + text + color;
  if (cache.has(key)) return cache.get(key);
  const W = 1024, H = 256;
  const [c, g] = canvas(W, H);
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 120;
  g.font = `${fs}px "Special Elite", "Courier New", monospace`;
  while (g.measureText(text).width > W * 0.92 && fs > 30) { fs -= 6; g.font = `${fs}px "Special Elite", "Courier New", monospace`; }
  for (let i = 0; i < 3; i++) { g.globalAlpha = 0.35; g.fillText(text, W / 2 + (rnd() - 0.5) * 6, H / 2 + (rnd() - 0.5) * 6); }
  g.globalAlpha = 0.9; g.fillText(text, W / 2, H / 2);
  // drips
  g.globalAlpha = 0.7;
  for (let i = 0; i < 14; i++) { const x = W * 0.08 + rnd() * W * 0.84; g.fillRect(x, H / 2 + 20, 3, 20 + rnd() * 70); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

export function silhouette(kind = 'woman') {
  const key = 'sil_' + kind;
  if (cache.has(key)) return cache.get(key);
  const W = 256, H = 512;
  const [c, g] = canvas(W, H);
  g.filter = 'blur(6px)';
  g.fillStyle = '#000';
  const cx = W / 2;
  // head + long hair
  g.beginPath(); g.ellipse(cx, 90, 40, 52, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(cx - 46, 90); g.quadraticCurveTo(cx - 60, 220, cx - 50, 300); g.lineTo(cx + 50, 300); g.quadraticCurveTo(cx + 60, 220, cx + 46, 90); g.fill();
  // shoulders / body
  g.beginPath(); g.moveTo(cx - 95, H); g.quadraticCurveTo(cx - 100, 190, cx - 30, 150); g.lineTo(cx + 30, 150); g.quadraticCurveTo(cx + 100, 190, cx + 95, H); g.fill();
  // arms raised to the glass
  if (kind === 'hands') {
    g.lineWidth = 26; g.strokeStyle = '#000'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - 70, 210); g.lineTo(cx - 105, 120); g.stroke();
    g.beginPath(); g.moveTo(cx + 70, 210); g.lineTo(cx + 105, 115); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 108, 100, 20, 26, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.filter = 'none';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

// ---------------------------------------------------------------------------
// Smoke helpers: value noise, used to smear features and build vapour
function hash2(ix, iy) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f + i * 17.3, y * f + i * 5.1); n += a; f *= 2.03; a *= 0.5; }
  return s / n;
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// The entity's face: a grey, soft-edged face made of smoke. Hollow black eyes, a gaping mouth, wisps
// streaming off it like vapour. Painted per pixel so every feature smears into the mist.
// Transparent outside, so it can float in front of a dark head.
function smokeFace(S, o = {}) {
  const [c, g] = canvas(S, S);
  const id = g.createImageData(S, S), px = id.data;
  const mouthRx = o.mouthRx ?? 0.1, mouthRy = o.mouthRy ?? 0.23;
  const seg = (x, y, ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay, t = clamp01(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy));
    return [Math.hypot(x - ax - vx * t, y - ay - vy * t), t];
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = (x / S - 0.5) * 2, v = (y / S - 0.5) * 2;
    // drift: warp the coordinates so everything looks like it's made of vapour
    const wu = u + (fbm(u * 1.7 + 3.1, v * 1.7 + 1.7, 3) - 0.5) * 0.3;
    const wv = v + (fbm(u * 1.7 + 8.3, v * 1.7 + 5.2, 3) - 0.5) * 0.3;
    // face, mist and wisps
    const faceA = 1 - sstep(0.6, 1.1, Math.hypot(wu / 0.42, (wv - 0.04) / 0.6));
    const n = fbm(u * 2.4 + 11, v * 2.4 + 4.5, 5);
    const hazeA = (1 - sstep(0.12, 0.98, Math.hypot(u * 0.95, v))) * (0.1 + 0.9 * sstep(0.32, 0.72, n)) * 0.72;
    // wisps curl and thin out, and are uneven from side to side
    const cu = u + (fbm(u * 2.2 + 41, v * 2.2 + 7, 3) - 0.5) * 0.7, cv = v + (fbm(u * 2.2 + 9, v * 2.2 + 63, 3) - 0.5) * 0.7;
    let wispA = 0;
    for (const s of [-1, 1]) {
      const k = s > 0 ? 1 : 0.75;
      let [dd, t] = seg(cu, cv, s * 0.16, -0.4, s * 0.3, -0.95);                    // pointed wisps rising off the head
      wispA = Math.max(wispA, (1 - sstep(0, 1, dd / (0.11 * (1 - t * 0.9) + 0.008))) * 0.5 * k * (1 - t * 0.4));
      [dd, t] = seg(cu, cv, s * 0.32, 0.0, s * 0.96, 0.46 + s * 0.1);               // streaks trailing out sideways
      wispA = Math.max(wispA, (1 - sstep(0, 1, dd / (0.15 * (1 - t * 0.85) + 0.01))) * 0.26 * k * (0.2 + n));
      [dd, t] = seg(cu, cv, s * 0.16, 0.54, s * 0.4 + s * 0.1, 0.99);               // and down below the chin
      wispA = Math.max(wispA, (1 - sstep(0, 1, dd / (0.1 * (1 - t * 0.85) + 0.01))) * 0.22 * k * (0.2 + n));
    }
    wispA *= 0.2 + 1.5 * sstep(0.3, 0.7, fbm(u * 3 + 30, v * 3 + 2, 3));
    let alpha = 1 - (1 - faceA) * (1 - hazeA) * (1 - clamp01(wispA));

    // brightness: forehead and cheeks catch the light, the mist is dimmer and mottled
    const lit = clamp01(1 - Math.hypot(wu / 0.5, (wv + 0.12) / 0.7));
    const mottle = 0.78 + 0.44 * fbm(u * 4.5 + 20, v * 4.5 + 9, 3);
    const faceCol = 128 + 112 * lit, mistCol = 72 + 84 * n;
    const wm = Math.max(hazeA, clamp01(wispA));
    let col = (faceCol * faceA + mistCol * wm) / (faceA + wm + 1e-4) * mottle;

    // hollow eyes: black sockets, a faint dark halo, set a little askew (features smear less than the mist)
    const fu = u + (wu - u) * 0.5, fv = v + (wv - v) * 0.5;
    let hole = 0, shade = 0;
    for (const sx of [-1, 1]) {
      const dx = fu - sx * 0.18, dy = fv + 0.15, a = sx * 0.28;
      const e = Math.hypot((dx * Math.cos(a) - dy * Math.sin(a)) / 0.12, (dx * Math.sin(a) + dy * Math.cos(a)) / 0.088);
      hole = Math.max(hole, 1 - sstep(0.35, 1.2, e));
      shade += (1 - sstep(0.7, 2.5, e)) * 0.5;
      shade += (1 - sstep(0.15, 1, Math.hypot((fu - sx * 0.22) / 0.15, (fv - 0.22) / 0.2))) * 0.28;   // sunken cheeks
    }
    // nose: two dark nostrils and a shadow down the bridge
    hole = Math.max(hole, (1 - sstep(0.2, 1, Math.hypot(fu / 0.055, (fv - 0.22) / 0.06))) * 0.55);
    shade += (1 - sstep(0, 1, Math.abs(fu - 0.03) / 0.035)) * sstep(-0.1, 0.05, fv) * (1 - sstep(0.12, 0.2, fv)) * 0.08;
    // the mouth: stretched wide open, with a pale rim
    const m = Math.hypot(fu / mouthRx, (fv - 0.45) / mouthRy);
    hole = Math.max(hole, 1 - sstep(0.55, 1.05, m));
    shade += (1 - sstep(0.9, 2.2, m)) * 0.4;
    const rim = sstep(0.95, 1.1, m) * (1 - sstep(1.1, 1.4, m)) * (fv > 0.45 ? 1 : 0.4);
    // brow and jaw fall into shadow
    shade += (1 - sstep(0, 0.12, Math.abs(fv + 0.3))) * 0.2 + sstep(0.3, 0.8, fv) * 0.5;
    col = col * (1 - clamp01(shade * faceA)) + rim * 45 * faceA;
    col += (8 - col) * clamp01(hole);
    alpha = Math.max(alpha, clamp01(hole)) * (1 - sstep(0.8, 1, Math.hypot(u, v)));

    const i = (y * S + x) * 4;
    px[i] = Math.min(255, col * 0.97); px[i + 1] = Math.min(255, col); px[i + 2] = Math.min(255, col * 1.06 + 4);
    px[i + 3] = alpha * 255;
  }
  g.putImageData(id, 0, 0);
  return c;
}

export function womanFace() {
  if (cache.has('wface')) return cache.get('wface');
  const t = new THREE.CanvasTexture(smokeFace(256));
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set('wface', t);
  return t;
}

export function radial(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const key = 'rad' + inner + outer;
  if (cache.has(key)) return cache.get(key);
  const [c, g] = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  cache.set(key, t);
  return t;
}

export function saltRing() {
  if (cache.has('salt')) return cache.get('salt');
  const S = 512;
  const [c, g] = canvas(S, S);
  for (let i = 0; i < 9000; i++) {
    const a = rnd() * Math.PI * 2, r = S * 0.42 + (rnd() - 0.5) * S * 0.07 * (1 + rnd());
    g.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`;
    g.fillRect(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  cache.set('salt', t);
  return t;
}

export function handprints() {
  if (cache.has('hp')) return cache.get('hp');
  const S = 256;
  const [c, g] = canvas(S, S);
  g.fillStyle = 'rgba(230,240,255,0.5)';
  for (const [x, y, r] of [[70, 120, -0.2], [180, 100, 0.25]]) {
    g.save(); g.translate(x, y); g.rotate(r);
    g.beginPath(); g.ellipse(0, 20, 22, 28, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-20 + i * 10, -22 - (i === 2 ? 10 : i === 0 ? -14 : 4), 4.5, 16, (i - 2) * 0.12, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  cache.set('hp', t);
  return t;
}

export function labelSprite(text, color) {
  const [c, g] = canvas(256, 64);
  g.font = 'bold 30px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 8, 256, 48);
  g.fillStyle = color; g.fillText(text, 128, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function iconSprite(emoji) {
  const key = 'ic' + emoji;
  if (cache.has(key)) return cache.get(key);
  const [c, g] = canvas(128, 128);
  g.font = '86px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

export function paper() {
  if (cache.has('paper')) return cache.get('paper');
  const [c, g] = canvas(128, 160);
  g.fillStyle = '#d6cba9'; g.fillRect(0, 0, 128, 160);
  g.strokeStyle = 'rgba(40,30,20,0.6)';
  for (let y = 24; y < 150; y += 12) { g.beginPath(); g.moveTo(12, y); g.lineTo(12 + 60 + rnd() * 44, y); g.stroke(); }
  stains(g, 128, 160, 4, 'rgba(90,60,20,0.35)', 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set('paper', t);
  return t;
}

// The same face, screaming: for the sudden flash in the dark
export function screamFace() {
  if (cache.has('scream')) return cache.get('scream');
  const t = new THREE.CanvasTexture(smokeFace(320, { mouthRx: 0.11, mouthRy: 0.28 }));
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set('scream', t);
  return t;
}

// Full-screen jump scare: her smoke face, screaming, rushing out of the dark
export function scareImage() {
  const W = 800, H = 600;
  const [c, g] = canvas(W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const face = smokeFace(384, { mouthRx: 0.1, mouthRy: 0.27 });
  // a wide dim halo of the same face, then the face itself, brightened
  g.globalAlpha = 0.3; g.globalCompositeOperation = 'lighter';
  g.drawImage(face, W / 2 - 520, H / 2 - 480, 1040, 1040);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(face, W / 2 - 380, H / 2 - 360, 760, 760);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18;
  g.drawImage(face, W / 2 - 380, H / 2 - 360, 760, 760);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(90,0,0,0.12)'; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(W / 2, H / 2, 150, W / 2, H / 2, 520);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.95)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  grain(g, W, H, 0.12);
  return c.toDataURL('image/jpeg', 0.85);
}

// Corner cobweb: threads fanning down from the top centre with a sagging spiral, transparent background
export function cobweb() {
  if (cache.has('cobweb')) return cache.get('cobweb');
  const W = 256, H = 184;
  const [c, g] = canvas(W, H);
  g.strokeStyle = 'rgba(225,225,225,0.6)'; g.lineWidth = 1;
  const ox = W / 2, oy = 0, spokes = 11;
  const ang = (i) => 0.08 * Math.PI + (i / (spokes - 1)) * 0.84 * Math.PI;
  for (let i = 0; i < spokes; i++) { g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(ang(i)) * W, oy + Math.sin(ang(i)) * W); g.stroke(); }
  for (let r = 14; r < H * 1.1; r += 11 + rnd() * 9) {
    g.beginPath();
    for (let i = 0; i < spokes; i++) {
      const rr = r * (0.9 + rnd() * 0.15);
      const x = ox + Math.cos(ang(i)) * rr, y = oy + Math.sin(ang(i)) * rr;
      if (i === 0) g.moveTo(x, y);
      else { const mid = (ang(i - 1) + ang(i)) / 2; g.quadraticCurveTo(ox + Math.cos(mid) * rr * 0.84, oy + Math.sin(mid) * rr * 0.84, x, y); }
    }
    g.globalAlpha = 0.3 + rnd() * 0.45; g.stroke(); g.globalAlpha = 1;
  }
  // a few broken, drooping strands
  for (let i = 0; i < 6; i++) { g.beginPath(); const x = rnd() * W; g.moveTo(x, rnd() * H * 0.4); g.quadraticCurveTo(x + 10, H * 0.7, x + (rnd() - 0.5) * 30, H); g.globalAlpha = 0.3; g.stroke(); g.globalAlpha = 1; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set('cobweb', t);
  return t;
}

// Moonlight shaft: bright at the window end, fading along its length and at the edges
export function shaft() {
  if (cache.has('shaft')) return cache.get('shaft');
  const [c, g] = canvas(64, 256);
  const gl = g.createLinearGradient(0, 0, 0, 256);
  gl.addColorStop(0, 'rgba(170,195,255,0.9)'); gl.addColorStop(0.5, 'rgba(140,170,240,0.35)'); gl.addColorStop(1, 'rgba(120,150,220,0)');
  g.fillStyle = gl; g.fillRect(0, 0, 64, 256);
  const ge = g.createLinearGradient(0, 0, 64, 0);
  ge.addColorStop(0, 'rgba(0,0,0,1)'); ge.addColorStop(0.25, 'rgba(0,0,0,0)'); ge.addColorStop(0.75, 'rgba(0,0,0,0)'); ge.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = ge; g.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set('shaft', t);
  return t;
}

// Tileable film-grain image for the CSS overlay
export function grainDataURL() {
  const S = 160;
  const [c, g] = canvas(S, S);
  const id = g.createImageData(S, S);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  return c.toDataURL('image/png');
}

// A wet, bare footprint (toes towards the top)
export function footprint() {
  if (cache.has('foot')) return cache.get('foot');
  const [c, g] = canvas(64, 128);
  g.fillStyle = 'rgba(14,20,24,0.85)';
  g.beginPath(); g.ellipse(32, 78, 17, 34, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(30, 112, 12, 13, 0, 0, Math.PI * 2); g.fill();
  for (const [x, y, r] of [[22, 30, 6.5], [33, 24, 5.5], [42, 26, 4.8], [49, 31, 4.2], [54, 38, 3.6]]) { g.beginPath(); g.arc(x - 4, y - 4, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(160,190,210,0.25)';
  g.beginPath(); g.ellipse(26, 70, 5, 16, -0.2, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set('foot', t);
  return t;
}

// ---------------------------------------------------------------------------
// The world outside the windows: a snowy night, a pale sky, bare black trees

// A bare tree drawn as forking branches. (x, y) is where the limb starts, ang is measured from straight up.
function drawBranch(g, x, y, ang, len, wid, depth, spread) {
  const wob = (rnd() - 0.5) * len * 0.3;
  const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len;
  g.lineWidth = Math.max(wid, 0.8);
  g.beginPath(); g.moveTo(x, y);
  g.quadraticCurveTo((x + x2) / 2 + wob, (y + y2) / 2 + wob * 0.4, x2, y2);
  g.stroke();
  if (depth <= 0 || wid < 0.55) return;
  const kids = depth > 2 && rnd() < 0.3 ? 3 : 2;
  for (let i = 0; i < kids; i++) {
    const side = kids === 2 ? (i ? 1 : -1) : i - 1;
    const a = ang * 0.86 + side * spread * (0.6 + rnd() * 0.8) + (rnd() - 0.5) * 0.3;
    drawBranch(g, x2, y2, a, len * (0.68 + rnd() * 0.16), wid * 0.68, depth - 1, spread);
  }
}
function drawDeadTree(g, x, base, h, w, spread, depth, col) {
  g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  drawBranch(g, x, base, (rnd() - 0.5) * 0.18, h * 0.22, w, depth, spread);
}

// Four kinds of tree for the garden: a spreading oak, a thin poplar, a gnarled lopsided one, a dead pine
export function treeTexture(variant) {
  const key = 'tree' + variant;
  if (cache.has(key)) return cache.get(key);
  const W = 512, H = 768;
  const [c, g] = canvas(W, H);
  const col = '#06080b';
  // draw a little smaller than the card so no crown is ever clipped by its edge
  g.translate(W / 2, H); g.scale(0.8, 0.8); g.translate(-W / 2, -H);
  if (variant === 0) drawDeadTree(g, W / 2, H - 2, H, 19, 0.66, 9, col);
  else if (variant === 1) drawDeadTree(g, W / 2, H - 2, H, 14, 0.4, 9, col);
  else if (variant === 2) {
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    drawBranch(g, W * 0.45, H - 2, 0.22, H * 0.2, 22, 9, 0.6);
    drawBranch(g, W * 0.45, H * 0.76, -0.9, H * 0.16, 11, 8, 0.55);
  } else {
    g.strokeStyle = col; g.lineCap = 'round';
    g.lineWidth = 12; g.beginPath(); g.moveTo(W / 2, H - 2); g.quadraticCurveTo(W / 2 + 10, H * 0.5, W / 2 - 4, H * 0.04); g.stroke();
    for (let y = H * 0.82, k = 0; y > H * 0.08; y -= 30 + rnd() * 22, k++) {
      const len = 20 + (y / H) * 190;
      for (const s of [-1, 1]) if (rnd() < 0.85) drawBranch(g, W / 2 + 4 * s, y, s * (1.45 + rnd() * 0.3), len * (0.6 + rnd() * 0.4), 3.2, 3, 0.5);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

// A hazy forest wall that rings the whole property, seen far off beyond the garden
export function treeline() {
  if (cache.has('treeline')) return cache.get('treeline');
  const W = 4096, H = 512;
  const [c, g] = canvas(W, H);
  for (const [n, lo, hi, a, rgb] of [[70, 140, 330, 0.75, '14,19,27'], [90, 190, 460, 1, '7,10,15']]) {
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, h = lo + rnd() * (hi - lo), sp = 0.4 + rnd() * 0.3;
      for (const dx of x < 400 ? [0, W] : x > W - 400 ? [0, -W] : [0]) drawDeadTree(g, x + dx, H + 2, h * 1.6, h * 0.05, sp, 7, `rgba(${rgb},${a})`);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.wrapS = THREE.RepeatWrapping;
  cache.set('treeline', t);
  return t;
}

// A gnarled branch reaching across a window from outside
export function branchOverlay() {
  if (cache.has('branch')) return cache.get('branch');
  const W = 512, H = 512;
  const [c, g] = canvas(W, H);
  g.strokeStyle = '#040608'; g.lineCap = 'round'; g.lineJoin = 'round';
  drawBranch(g, -12, H * 0.8, 1.1, 190, 22, 8, 0.5);
  drawBranch(g, W + 12, H * 0.06, -2.1, 150, 12, 7, 0.55);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  cache.set('branch', t);
  return t;
}

// Overcast, moonlit night sky wrapped around a dome. Horizon at the vertical middle; the glow
// behind the cloud is brightest at the horizon so the trees stand out against it.
export function skyTexture() {
  if (cache.has('sky')) return cache.get('sky');
  const W = 1024, H = 512;
  const [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  for (const [p, col] of [[0, '#0a0f18'], [0.17, '#182233'], [0.3, '#2c3b55'], [0.4, '#46587a'], [0.47, '#667a9a'], [0.495, '#7a8ba5'], [0.502, '#07090d'], [1, '#030406']]) gr.addColorStop(p, col);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // drifting cloud banks, slightly lighter than the sky behind them
  for (let i = 0; i < 130; i++) {
    const x = rnd() * W, y = H * (0.06 + rnd() * 0.42), rx = 50 + rnd() * 150, ry = rx * (0.12 + rnd() * 0.12);
    for (const dx of [0, -W, W]) {
      const cg = g.createRadialGradient(x + dx, y, 0, x + dx, y, rx);
      const dark = rnd() < 0.45;
      cg.addColorStop(0, dark ? `rgba(6,9,16,${0.12 + rnd() * 0.14})` : `rgba(130,148,178,${0.06 + rnd() * 0.08})`); cg.addColorStop(1, dark ? 'rgba(6,9,16,0)' : 'rgba(130,148,178,0)');
      g.save(); g.translate(x + dx, y); g.scale(1, ry / rx); g.translate(-(x + dx), -y);
      g.fillStyle = cg; g.fillRect(x + dx - rx, y - rx, rx * 2, rx * 2); g.restore();
    }
  }
  // the moon, smeared behind the cloud
  const mx = W * 0.2, my = H * 0.33;
  g.save(); g.translate(mx, my); g.scale(1.15, 1);
  const mg = g.createRadialGradient(0, 0, 0, 0, 0, 105);
  mg.addColorStop(0, 'rgba(240,246,255,0.95)'); mg.addColorStop(0.06, 'rgba(225,235,255,0.8)');
  mg.addColorStop(0.2, 'rgba(165,180,208,0.22)'); mg.addColorStop(0.55, 'rgba(110,125,155,0.05)'); mg.addColorStop(1, 'rgba(110,125,155,0)');
  g.fillStyle = mg; g.fillRect(-105, -105, 210, 210); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  cache.set('sky', t);
  return t;
}
