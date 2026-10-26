// Animated title backdrop: an opaque screen door at night. Sometimes, something stands outside.
export class StartScreen {
  constructor(canvas, onEvent) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});
    this.running = false;
    this.t = 0;
    this.state = 'idle'; this.stateT = 4; this.alpha = 0;
    this.variant = 'stand';
    this.sway = 0;
    this.moths = Array.from({ length: 5 }, () => ({ a: Math.random() * 6, r: 20 + Math.random() * 40, s: 1 + Math.random() * 2 }));
    this.sil = document.createElement('canvas');
    addEventListener('resize', () => this.resize());
    this.resize();
  }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    this.c.width = innerWidth * d; this.c.height = innerHeight * d;
    this.W = this.c.width; this.H = this.c.height;
  }
  start() { if (this.running) return; this.running = true; this.c.style.display = 'block'; this.last = performance.now(); requestAnimationFrame((t) => this.frame(t)); }
  stop() { this.running = false; this.c.style.display = 'none'; }

  nextState(dt) {
    this.stateT -= dt;
    if (this.stateT > 0) return;
    switch (this.state) {
      case 'idle': {
        this.state = 'in'; this.stateT = 2 + Math.random() * 1.5;
        const r = Math.random();
        this.variant = r < 0.45 ? 'stand' : r < 0.7 ? 'side' : r < 0.88 ? 'close' : 'hand';
        this.side = Math.random() < 0.5 ? -1 : 1;
        this.onEvent(this.variant === 'hand' ? 'thump' : 'appear');
        break;
      }
      case 'in': this.state = 'hold'; this.stateT = 2.5 + Math.random() * 3; break;
      case 'hold': this.state = 'out'; this.stateT = this.variant === 'close' ? 0.25 : 1.6; break;
      case 'out': this.state = 'idle'; this.stateT = 5 + Math.random() * 8; break;
    }
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.t += dt;
    this.nextState(dt);
    const total = this.state === 'in' ? 1 - Math.max(0, this.stateT) / 2.5 : this.state === 'hold' ? 1 : this.state === 'out' ? Math.max(0, this.stateT) / 1.6 : 0;
    this.alpha += (Math.max(0, Math.min(1, total)) - this.alpha) * Math.min(1, dt * 3);
    this.draw();
    requestAnimationFrame((t) => this.frame(t));
  }

  draw() {
    const { g, W, H } = this;
    // Interior wall
    g.fillStyle = '#0b0807'; g.fillRect(0, 0, W, H);
    const cx = W > H * 1.3 ? W * 0.64 : W * 0.5;
    const dh = H * 0.86, dw = Math.min(dh * 0.46, W * 0.8);
    const dx = cx - dw / 2, dy = H - dh;
    // flickering porch light from outside
    const flick = 0.75 + 0.25 * Math.sin(this.t * 13) * Math.sin(this.t * 3.1) + (Math.random() < 0.02 ? -0.5 : 0);
    const glow = g.createRadialGradient(cx, dy + dh * 0.25, 10, cx, dy + dh * 0.4, dh * 0.9);
    glow.addColorStop(0, `rgba(70,80,95,${0.25 * flick})`); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);

    // door frame
    g.fillStyle = '#1a110b'; g.fillRect(dx - dw * 0.07, dy - dw * 0.07, dw * 1.14, dh + dw * 0.07);
    g.fillStyle = '#2a1b11'; g.fillRect(dx, dy, dw, dh);
    const px = dx + dw * 0.08, py = dy + dw * 0.08, pw = dw * 0.84, ph = dh * 0.62;

    // frosted panel lit from behind
    const pg = g.createLinearGradient(0, py, 0, py + ph);
    pg.addColorStop(0, `rgba(${120 * flick},${132 * flick},${150 * flick},1)`);
    pg.addColorStop(1, `rgba(${50 * flick},${58 * flick},${70 * flick},1)`);
    g.fillStyle = pg; g.fillRect(px, py, pw, ph);

    // silhouette behind frosted glass
    if (this.alpha > 0.01) {
      g.save();
      g.beginPath(); g.rect(px, py, pw, ph); g.clip();
      this.drawFigure(px, py, pw, ph);
      g.restore();
    }
    // screen mesh
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
    const step = Math.max(3, W / 500);
    g.beginPath();
    for (let x = px; x < px + pw; x += step) { g.moveTo(x, py); g.lineTo(x, py + ph); }
    for (let y = py; y < py + ph; y += step) { g.moveTo(px, y); g.lineTo(px + pw, y); }
    g.stroke();
    // frost haze
    const fz = g.createRadialGradient(px + pw / 2, py + ph / 2, 10, px + pw / 2, py + ph / 2, ph * 0.7);
    fz.addColorStop(0, 'rgba(200,210,220,0.08)'); fz.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = fz; g.fillRect(px, py, pw, ph);
    // mid rail & kick panel
    g.fillStyle = '#21150d'; g.fillRect(dx, py + ph, dw, dw * 0.08);
    g.fillStyle = '#1c120b'; g.fillRect(px, py + ph + dw * 0.14, pw, dh - ph - dw * 0.3);
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.strokeRect(px + 6, py + ph + dw * 0.14 + 6, pw - 12, dh - ph - dw * 0.3 - 12);
    // handle
    g.fillStyle = '#6b5a3a'; g.beginPath(); g.arc(dx + dw * 0.9, py + ph + dw * 0.05, dw * 0.025, 0, Math.PI * 2); g.fill();
    // moths around the porch light (outside, seen as specks)
    g.fillStyle = 'rgba(0,0,0,0.6)';
    for (const m of this.moths) {
      m.a += m.s * 0.03;
      const mx = px + pw * 0.5 + Math.cos(m.a * 1.3) * m.r * (W / 1000), my = py + ph * 0.12 + Math.sin(m.a) * m.r * 0.6 * (W / 1000);
      g.fillRect(mx, my, 3, 2);
    }
    // floor shadow & vignette
    const v = g.createRadialGradient(cx, H * 0.55, H * 0.2, cx, H * 0.55, Math.max(W, H) * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.92)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  drawFigure(px, py, pw, ph) {
    const g = this.g;
    const s = this.sil;
    const close = this.variant === 'close' || this.variant === 'hand';
    const scale = close ? 1.5 : 1;
    s.width = Math.ceil(pw); s.height = Math.ceil(ph);
    const sg = s.getContext('2d');
    sg.clearRect(0, 0, s.width, s.height);
    const blur = close ? pw * 0.012 : pw * 0.035;
    sg.filter = `blur(${blur}px)`;
    sg.fillStyle = '#05070a';
    const sway = Math.sin(this.t * 0.7) * pw * 0.01;
    let fx = pw / 2 + sway;
    if (this.variant === 'side') fx = pw / 2 + this.side * pw * 0.3;
    const hy = ph * (close ? 0.28 : 0.32), hr = pw * 0.11 * scale;
    // head tilted slightly
    sg.save(); sg.translate(fx, hy); sg.rotate(this.variant === 'side' ? this.side * -0.25 : Math.sin(this.t * 0.4) * 0.05);
    sg.beginPath(); sg.ellipse(0, 0, hr, hr * 1.25, 0, 0, Math.PI * 2); sg.fill();
    // long hair
    sg.beginPath(); sg.moveTo(-hr * 1.1, 0); sg.quadraticCurveTo(-hr * 1.5, hr * 3, -hr * 1.2, hr * 5);
    sg.lineTo(hr * 1.2, hr * 5); sg.quadraticCurveTo(hr * 1.5, hr * 3, hr * 1.1, 0); sg.fill();
    sg.restore();
    // shoulders / body
    sg.beginPath();
    sg.moveTo(fx - hr * 2.7, ph); sg.quadraticCurveTo(fx - hr * 2.8, hy + hr * 2.2, fx - hr * 0.8, hy + hr * 1.6);
    sg.lineTo(fx + hr * 0.8, hy + hr * 1.6); sg.quadraticCurveTo(fx + hr * 2.8, hy + hr * 2.2, fx + hr * 2.7, ph); sg.fill();
    if (this.variant === 'hand') {
      sg.filter = `blur(${pw * 0.004}px)`;
      const hx = fx + pw * 0.18, hyy = ph * 0.45;
      sg.beginPath(); sg.ellipse(hx, hyy, pw * 0.06, pw * 0.075, 0, 0, Math.PI * 2); sg.fill();
      for (let i = 0; i < 5; i++) {
        const a = -2.3 + i * 0.32;
        sg.save(); sg.translate(hx + Math.cos(a) * pw * 0.06, hyy + Math.sin(a) * pw * 0.07); sg.rotate(a + Math.PI / 2);
        sg.beginPath(); sg.ellipse(0, -pw * 0.05, pw * 0.012, pw * (i === 0 ? 0.04 : 0.065), 0, 0, Math.PI * 2); sg.fill(); sg.restore();
      }
    }
    sg.filter = 'none';
    g.globalAlpha = this.alpha * (close ? 0.95 : 0.8);
    g.drawImage(s, px, py);
    g.globalAlpha = 1;
  }
}
