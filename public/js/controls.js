// Input: keyboard + mouse/touchpad (pointer lock or drag-to-look) + touch joystick.
export const isTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

export class Controls {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.lookDX = 0; this.lookDY = 0;
    this.joy = { x: 0, y: 0 };
    this.runToggle = false;
    this.enabled = false;
    this.sens = 1; this.turnSpeed = 2; this.dragMode = false;
    this.actions = {}; // name -> callback
    this.locked = false;
    this.dragging = false;
    this._bind();
  }

  on(name, fn) { this.actions[name] = fn; }
  fire(name) { if (this.actions[name]) this.actions[name](); }

  _bind() {
    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (e.repeat) { this.keys.add(k); return; }
      this.keys.add(k);
      const map = { e: 'interact', q: 'salt', r: 'plank', f: 'torch', m: 'map', escape: 'escape', p: 'pause', c: 'charm', '1': 'opt1', '2': 'opt2', '3': 'opt3', '4': 'opt4', enter: 'interact', h: 'hints', t: 'ping', ' ': 'interact' };
      if (map[k]) this.fire(map[k]);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());

    // Mouse / touchpad
    this.el.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || !this.enabled) return;
      if (this.dragMode) { this.dragging = true; return; }
      if (!this.locked) this.el.requestPointerLock?.();
    });
    addEventListener('mouseup', () => (this.dragging = false));
    addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked || this.dragging) { this.lookDX += e.movementX || 0; this.lookDY += e.movementY || 0; }
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      this.fire('lockchange');
    });
    this.el.addEventListener('contextmenu', (e) => e.preventDefault());

    if (isTouch) this._bindTouch();
  }

  _bindTouch() {
    document.body.classList.add('touch');
    const joy = document.getElementById('joy'), knob = document.getElementById('joy-knob');
    let joyId = null, jc = null;
    const R = 60;
    joy.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0]; joyId = t.identifier;
      const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      move(t);
    }, { passive: false });
    const move = (t) => {
      let dx = t.clientX - jc.x, dy = t.clientY - jc.y;
      const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joy.x = dx / R; this.joy.y = -dy / R;
    };
    addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) move(t);
        if (t.identifier === lookId) { this.lookDX += (t.clientX - lx) * 1.6; this.lookDY += (t.clientY - ly) * 1.6; lx = t.clientX; ly = t.clientY; }
      }
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) { joyId = null; this.joy.x = this.joy.y = 0; knob.style.transform = ''; }
        if (t.identifier === lookId) lookId = null;
      }
    };
    addEventListener('touchend', end); addEventListener('touchcancel', end);
    const look = document.getElementById('look-zone');
    let lookId = null, lx = 0, ly = 0;
    look.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0]; lookId = t.identifier; lx = t.clientX; ly = t.clientY;
    }, { passive: false });
    for (const b of document.querySelectorAll('#touch-buttons .tbtn')) {
      b.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const a = b.dataset.act;
        if (a === 'run') { this.runToggle = !this.runToggle; b.classList.toggle('on', this.runToggle); }
        else this.fire(a);
      }, { passive: false });
    }
  }

  // Movement intent in local space: x = strafe right, z = forward
  move() {
    const k = this.keys;
    let x = 0, z = 0;
    if (k.has('w') || k.has('arrowup')) z += 1;
    if (k.has('s') || k.has('arrowdown')) z -= 1;
    if (k.has('d')) x += 1;
    if (k.has('a')) x -= 1;
    x += this.joy.x; z += this.joy.y;
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z, run: k.has('shift') || this.runToggle || Math.hypot(this.joy.x, this.joy.y) > 0.95 };
  }

  turn() {
    let t = 0;
    if (this.keys.has('arrowleft')) t += 1;
    if (this.keys.has('arrowright')) t -= 1;
    return t * this.turnSpeed;
  }

  consumeLook() {
    const d = { x: this.lookDX * this.sens, y: this.lookDY * this.sens };
    this.lookDX = this.lookDY = 0;
    return d;
  }

  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }
}
