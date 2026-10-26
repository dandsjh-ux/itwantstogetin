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
      [c, g] = canvas(S, S);
      g.fillStyle = '#0d120c'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${20 + rnd() * 30},${30 + rnd() * 40},${15 + rnd() * 20},0.6)`; g.fillRect(rnd() * S, rnd() * S, 1, 3 + rnd() * 4); }
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

export function womanFace() {
  if (cache.has('wface')) return cache.get('wface');
  const W = 256, H = 256;
  const [c, g] = canvas(W, H);
  // oval face, transparent outside
  g.save();
  g.beginPath(); g.ellipse(W / 2, H / 2 + 4, W * 0.42, H * 0.49, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#cfccc4'; g.fillRect(0, 0, W, H);
  const sh = g.createRadialGradient(W / 2, H / 2 - 10, 20, W / 2, H / 2, 135);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(30,40,50,0.85)');
  g.fillStyle = sh; g.fillRect(0, 0, W, H);
  // sunken black eyes
  for (const x of [W / 2 - 38, W / 2 + 38]) {
    const eg = g.createRadialGradient(x, 110, 4, x, 110, 30);
    eg.addColorStop(0, '#000'); eg.addColorStop(0.55, '#050202'); eg.addColorStop(1, 'rgba(30,20,20,0)');
    g.fillStyle = eg; g.beginPath(); g.ellipse(x, 110, 30, 24, 0, 0, Math.PI * 2); g.fill();
  }
  // gaping mouth
  const mg = g.createRadialGradient(W / 2, 190, 2, W / 2, 190, 26);
  mg.addColorStop(0, '#000'); mg.addColorStop(1, 'rgba(20,0,0,0)');
  g.fillStyle = mg; g.beginPath(); g.ellipse(W / 2, 190, 16, 26, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(60,70,80,0.4)'; g.lineWidth = 1;
  for (let i = 0; i < 12; i++) { g.beginPath(); const x = rnd() * W; g.moveTo(x, rnd() * H); g.lineTo(x + (rnd() - 0.5) * 40, rnd() * H); g.stroke(); }
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
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

// Full-screen jump scare: her face through curtains of black hair
export function scareImage() {
  const W = 800, H = 600;
  const [c, g] = canvas(W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.52;
  // face
  const fg = g.createRadialGradient(cx, cy - 20, 20, cx, cy, 260);
  fg.addColorStop(0, '#e4e1da'); fg.addColorStop(0.6, '#9da3a6'); fg.addColorStop(1, '#1a1c1e');
  g.fillStyle = fg; g.beginPath(); g.ellipse(cx, cy, 190, 270, 0, 0, Math.PI * 2); g.fill();
  // eye sockets and pinprick pupils
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 72, ey = cy - 40;
    const eg = g.createRadialGradient(ex, ey, 4, ex, ey, 70);
    eg.addColorStop(0, '#000'); eg.addColorStop(0.6, '#050202'); eg.addColorStop(1, 'rgba(20,10,10,0)');
    g.fillStyle = eg; g.beginPath(); g.ellipse(ex, ey, 70, 52, sx * 0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8d0c0'; g.beginPath(); g.arc(ex + sx * 4, ey + 4, 4, 0, Math.PI * 2); g.fill();
  }
  // stretched screaming mouth
  const mg = g.createLinearGradient(0, cy + 70, 0, cy + 260);
  mg.addColorStop(0, '#000'); mg.addColorStop(1, '#200000');
  g.fillStyle = mg; g.beginPath(); g.ellipse(cx, cy + 160, 46, 100, 0, 0, Math.PI * 2); g.fill();
  // veins / cracks
  g.strokeStyle = 'rgba(40,50,60,0.55)'; g.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) { g.beginPath(); let x = cx + (rnd() - 0.5) * 340, y = cy + (rnd() - 0.5) * 460; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 40; y += rnd() * 40; g.lineTo(x, y); } g.stroke(); }
  // hair: long strands hanging over the sides and across the face
  g.strokeStyle = '#030202';
  for (let i = 0; i < 520; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const x0 = cx + side * (40 + rnd() * 260) * (rnd() < 0.15 ? 0.3 : 1);
    g.lineWidth = 1 + rnd() * 4;
    g.beginPath(); g.moveTo(x0, -10);
    g.bezierCurveTo(x0 + side * rnd() * 40, H * 0.3, x0 - side * rnd() * 60, H * 0.7, x0 + (rnd() - 0.5) * 80, H + 10);
    g.stroke();
  }
  g.fillStyle = '#030202'; g.beginPath(); g.ellipse(cx, 20, 260, 120, 0, 0, Math.PI * 2); g.fill();
  // red tint + vignette
  g.fillStyle = 'rgba(120,0,0,0.18)'; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(cx, cy, 150, cx, cy, 520);
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
