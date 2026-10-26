// The 3D house, players, entity visuals, movement and atmosphere.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  FLOORS, WALLS, STAIRS, FLOOR_HOLES, ENTRANCES, FURNITURE, FURN_SIZES, furnitureBox, PORTRAITS, WRITINGS, NOTES,
  SALT_CIRCLES, PLAYER_R, groundAt, roomAt, entranceAnchor, entranceInteractPoint, INTERACT_RANGE, POWERUP_TYPES,
} from './layout.js';
import * as TX from './textures.js';
import { audio } from './audio.js';
import { isTouch } from './controls.js';

const EYE = 1.6;
const WALK = 3.3, RUN = 5.2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

// Box geometry with UVs in world units (1 tile = `tile` metres)
function boxGeo(w, h, d, tile = 1.6) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i;
    uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile);
  }
  return g;
}

export class Game3D {
  constructor(root, controls, hooks) {
    this.root = root; this.controls = controls; this.hooks = hooks;
    this.renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isTouch ? 1.25 : 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    root.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020306);
    this.scene.fog = new THREE.FogExp2(0x020305, 0.055);
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.05, 90);
    this.scene.add(this.camera);
    this.clock = new THREE.Clock();
    this.time = 0;
    this.player = { x: 0, y: 0, z: 0, f: 1, yaw: 0, pitch: 0, vy: 0, eye: EYE, stepAcc: 0, bob: 0 };
    this.headBob = true;
    this.others = new Map();
    this.attackVis = new Map();   // attackId -> visual
    this.powerupMeshes = new Map();
    this.circleMeshes = new Map();
    this.plankMeshes = new Map();
    this.entranceObjs = new Map();
    this.colliders = [[], [], [], []];
    this.wallMeshes = [];
    this.state = null;
    this.myId = null;
    this.torchOn = true;
    this.breach = null;
    this.flicker = 0;
    this.scareCooldown = 40;
    this.phone = { ringing: false, rang: false, t: rand(110, 220) };
    this.running = false;
    this.mats = this._materials();
    this._lights();
    this._build();
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  // ------------------------------------------------------------------ setup
  _materials() {
    const L = (o) => new THREE.MeshLambertMaterial(o);
    const m = {};
    for (const k of ['wall', 'stone', 'attic', 'panel', 'rail', 'ext0', 'ext1', 'ext2', 'ext3']) m[k] = L({ map: TX.surface(k) });
    for (let f = 0; f < 4; f++) m['floor' + f] = L({ map: TX.surface('floor' + f) });
    m.ceiling = L({ map: TX.surface('ceiling') });
    m.wood = L({ color: 0x4a2e1a }); m.darkwood = L({ color: 0x24160d }); m.fabric = L({ color: 0x4a1f24 });
    m.fabric2 = L({ color: 0x2c3a2c }); m.metal = L({ color: 0x45464c }); m.white = L({ color: 0xc9c3b6 });
    m.black = L({ color: 0x070707 }); m.brass = L({ color: 0x8a6a2e }); m.cream = L({ color: 0xa9a08a });
    m.frame = L({ color: 0x5b4220 }); m.gold = L({ color: 0x9a7a35, emissive: 0x1a1205 });
    m.sheet = L({ color: 0xd6d2c8, emissive: 0x111111 });
    m.glass = new THREE.MeshBasicMaterial({ color: 0x9fb4cc, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });
    m.skin = L({ color: 0x9ea4a6, emissive: 0x15191b });
    m.nail = L({ color: 0x1a1414 });
    m.hair = L({ color: 0x050404, side: THREE.DoubleSide });
    m.dress = L({ color: 0xe9e7e1, emissive: 0x2a2e33, transparent: true, opacity: 0.94, side: THREE.DoubleSide });
    m.ember = new THREE.MeshBasicMaterial({ color: 0xff5a1a });
    m.plank = L({ color: 0x6b4a2a });
    return m;
  }

  _lights() {
    const s = this.scene;
    s.add(new THREE.AmbientLight(0x6070a0, 0.45));
    s.add(new THREE.HemisphereLight(0x8090b0, 0x201812, 0.35));
    // Torch
    this.torch = new THREE.SpotLight(0xffe8c4, 26, 26, 0.52, 0.5, 1.5);
    this.torch.position.set(0.15, -0.15, 0);
    this.camera.add(this.torch);
    this.torch.target.position.set(0, -0.3, -4);
    this.camera.add(this.torch.target);
    // Near fill so the immediate area is readable
    this.fill = new THREE.PointLight(0xffe2b0, 1.4, 6, 1.5);
    this.camera.add(this.fill);
    // Fixed room lights
    this.roomLights = [];
    const add = (c, i, d, x, y, z, flick = 0) => {
      const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); s.add(l);
      this.roomLights.push({ l, base: i, flick }); return l;
    };
    this.fireLight = add(0xff7a30, 9, 9, 12.6, 0.8, 5, 1);
    add(0xffc77a, 4, 10, 0, 2.9, 7.5, 0.3);          // hall lamp
    add(0xd9b37a, 3.5, 10, 4, -0.7, 3.5, 0.6);        // basement bulb
    add(0xd9c08a, 3, 10, 0, 6.1, -0.5, 0.2);          // landing
    add(0x8fa8d0, 3.5, 12, -12.5, 8.6, 0, 0.1);       // attic moonlight
    add(0xc0d0ff, 2.5, 9, -8, 5.8, 6, 0.4);           // nursery nightlight
    // Movable lights for attacks / entity
    this.alertLights = [0, 1].map(() => { const l = new THREE.PointLight(0xff2a2a, 0, 7, 1.6); s.add(l); return l; });
    this.entityLight = new THREE.PointLight(0xbfd4ff, 0, 6, 1.5); s.add(this.entityLight);
  }

  _merge(geos, mat, list) {
    if (!geos.length) return null;
    const m = new THREE.Mesh(mergeGeometries(geos), mat);
    this.scene.add(m);
    if (list) list.push(m);
    return m;
  }

  _build() {
    const byMat = {};
    const push = (k, g) => (byMat[k] = byMat[k] || []).push(g);

    // Walls
    for (const w of WALLS) {
      const fy = FLOORS[w.f].y;
      if (w.collide) this.colliders[w.f].push({ x1: w.x1, x2: w.x2, z1: w.z1, z2: w.z2 });
      if (!w.visible) continue;
      const g = boxGeo(w.x2 - w.x1, w.y1 - w.y0, w.z2 - w.z1);
      g.translate((w.x1 + w.x2) / 2, fy + (w.y0 + w.y1) / 2, (w.z1 + w.z2) / 2);
      push(w.mat, g);
    }
    for (const [k, gs] of Object.entries(byMat)) this._merge(gs, this.mats[k] || this.mats.wall, this.wallMeshes);

    // Floors & ceilings
    for (let f = 0; f < 4; f++) {
      const F = FLOORS[f];
      const mk = (holes, flip) => {
        const sh = new THREE.Shape();
        sh.moveTo(-14, -10); sh.lineTo(14, -10); sh.lineTo(14, 10); sh.lineTo(-14, 10); sh.lineTo(-14, -10);
        for (const h of holes) {
          const p = new THREE.Path();
          const z1 = flip ? -h.z2 : h.z1, z2 = flip ? -h.z1 : h.z2;
          p.moveTo(h.x1, z1); p.lineTo(h.x1, z2); p.lineTo(h.x2, z2); p.lineTo(h.x2, z1); p.lineTo(h.x1, z1);
          sh.holes.push(p);
        }
        const g = new THREE.ShapeGeometry(sh);
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.5, uv.getY(i) / 2.5);
        return g;
      };
      const floorG = mk(FLOOR_HOLES.filter((h) => h.f === f), true);
      floorG.rotateX(-Math.PI / 2); floorG.translate(0, F.y, 0);
      const fm = new THREE.Mesh(floorG, this.mats['floor' + f]); this.scene.add(fm); this.wallMeshes.push(fm);
      const roofHoles = f === 3 ? ENTRANCES.filter((e) => e.kind === 'hatch' || e.kind === 'skylight').map((e) => ({ x1: e.x - 0.5, x2: e.x + 0.5, z1: e.z - 0.5, z2: e.z + 0.5 })) : [];
      const ceilG = mk([...FLOOR_HOLES.filter((h) => h.f === f + 1), ...roofHoles], false);
      ceilG.rotateX(Math.PI / 2); ceilG.translate(0, F.y + F.h, 0);
      const cm = new THREE.Mesh(ceilG, f === 3 ? this.mats.attic : this.mats.ceiling); this.scene.add(cm); this.wallMeshes.push(cm);
    }
    // Attic rafters
    const rafters = [];
    for (let x = -12.4; x <= 13; x += 2.2) { const g = boxGeo(0.18, 0.22, 20); g.translate(x, FLOORS[3].y + FLOORS[3].h - 0.12, 0); rafters.push(g); }
    for (let z = -9; z <= 9; z += 4.5) { const g = boxGeo(28, 0.2, 0.2); g.translate(0, FLOORS[3].y + FLOORS[3].h - 0.35, z); rafters.push(g); }
    this._merge(rafters, this.mats.darkwood);

    // Outside ground, so lower windows look out on something
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ map: TX.surface('ground') }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; this.scene.add(ground);
    // keep the basement sealed visually from the outside ground (it's below it)

    // Stairs
    const steps = [];
    for (const s of STAIRS) {
      const y0 = FLOORS[s.f0].y, y1 = FLOORS[s.f1].y, n = 14;
      for (let i = 0; i < n; i++) {
        const top = y0 + ((i + 1) / n) * (y1 - y0);
        const t0 = i / n, t1 = (i + 1) / n;
        let x1 = s.x1, x2 = s.x2, z1 = s.z1, z2 = s.z2;
        if (s.axis === 'x') {
          const a = s.low === 'min' ? lerp(s.x1, s.x2, t0) : lerp(s.x2, s.x1, t1), b = s.low === 'min' ? lerp(s.x1, s.x2, t1) : lerp(s.x2, s.x1, t0);
          x1 = Math.min(a, b); x2 = Math.max(a, b);
        } else {
          const a = s.low === 'min' ? lerp(s.z1, s.z2, t0) : lerp(s.z2, s.z1, t1), b = s.low === 'min' ? lerp(s.z1, s.z2, t1) : lerp(s.z2, s.z1, t0);
          z1 = Math.min(a, b); z2 = Math.max(a, b);
        }
        const g = boxGeo(x2 - x1, top - y0, z2 - z1, 1);
        g.translate((x1 + x2) / 2, (y0 + top) / 2, (z1 + z2) / 2);
        steps.push(g);
      }
    }
    this._merge(steps, this.mats.panel, this.wallMeshes);

    for (const e of ENTRANCES) this._buildEntrance(e);
    for (const it of FURNITURE) this._buildFurniture(it);
    this._buildDecor();
    this._buildSalt();
    // Static outdoors silhouettes: trees seen through windows
    const treeMat = new THREE.MeshBasicMaterial({ color: 0x020304 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, r = rand(24, 40);
      const t = new THREE.Mesh(new THREE.ConeGeometry(rand(1.5, 3), rand(9, 16), 6), treeMat);
      t.position.set(Math.cos(a) * r, 4, Math.sin(a) * r * 0.8); this.scene.add(t);
    }
  }

  _buildEntrance(e) {
    const A = entranceAnchor(e);
    const grp = new THREE.Group();
    grp.position.set(A.x, A.y, A.z);
    if (e.n) grp.rotation.y = Math.atan2(e.n[0], e.n[1]); // local +z points into the house
    this.scene.add(grp);
    const obj = { e, grp, A };
    const box = (w, h, d, mat, x, y, z, parent = grp) => { const m = new THREE.Mesh(boxGeo(w, h, d, 1), mat); m.position.set(x, y, z); parent.add(m); return m; };
    const H = (e.t || 0) - (e.b || 0), W = e.w || 1;
    const backdrop = (w, h) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: TX.radial('rgba(48,64,90,0.95)', 'rgba(3,5,9,1)'), fog: false }));
      m.position.set(0, 0, -3.2); grp.add(m); return m;
    };
    switch (e.kind) {
      case 'window': {
        backdrop(W * 3.2, H * 2.6);
        if (e.round) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(W / 2, 0.06, 8, 24), this.mats.frame); grp.add(ring);
          const gl = new THREE.Mesh(new THREE.CircleGeometry(W / 2, 24), this.mats.glass); grp.add(gl); obj.glass = gl;
          box(0.05, W, 0.05, this.mats.frame, 0, 0, 0); box(W, 0.05, 0.05, this.mats.frame, 0, 0, 0);
        } else {
          const fr = this.mats.frame;
          box(W + 0.12, 0.08, 0.3, fr, 0, H / 2, 0); box(W + 0.12, 0.1, 0.4, fr, 0, -H / 2, 0.06);
          box(0.08, H, 0.3, fr, -W / 2, 0, 0); box(0.08, H, 0.3, fr, W / 2, 0, 0);
          box(0.05, H, 0.06, fr, 0, 0, 0); box(W, 0.05, 0.06, fr, 0, H * 0.1, 0);
          const gl = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.mats.glass); grp.add(gl); obj.glass = gl;
          // tattered curtains
          for (const sx of [-1, 1]) {
            const c = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.32, H + 0.5, 1, 6), new THREE.MeshLambertMaterial({ color: 0x3a1517, side: THREE.DoubleSide }));
            c.position.set(sx * (W / 2 + 0.05), 0.1, 0.22); grp.add(c);
            (obj.curtains = obj.curtains || []).push(c);
          }
        }
        const hp = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, H * 0.6), new THREE.MeshBasicMaterial({ map: TX.handprints(), transparent: true, opacity: 0, depthWrite: false }));
        hp.position.set(0, 0.1, 0.01); grp.add(hp); obj.prints = hp;
        break;
      }
      case 'door': {
        backdrop(W * 3, H * 2);
        const pivot = new THREE.Group(); pivot.position.set(-W / 2, 0, 0.05); grp.add(pivot);
        const door = box(W - 0.04, H - 0.02, 0.08, this.mats.darkwood, W / 2, 0, 0, pivot);
        box(0.08, 0.08, 0.08, this.mats.brass, W - 0.15, -0.1, 0.07, pivot);
        if (e.id === 'front_door') { const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ color: 0x5c7290, transparent: true, opacity: 0.55 })); gl.position.set(W / 2, 0.55, 0.045); pivot.add(gl); }
        box(W + 0.2, 0.1, 0.3, this.mats.frame, 0, H / 2 + 0.05, 0); box(0.1, H, 0.3, this.mats.frame, -W / 2 - 0.05, 0, 0); box(0.1, H, 0.3, this.mats.frame, W / 2 + 0.05, 0, 0);
        obj.pivot = pivot; obj.door = door;
        break;
      }
      case 'chute': case 'vent': case 'flap': {
        backdrop(W * 2, H * 3);
        const pivot = new THREE.Group(); pivot.position.set(0, H / 2, 0.02); grp.add(pivot);
        if (e.kind === 'vent') {
          for (let i = 0; i < 5; i++) box(W, 0.03, 0.04, this.mats.metal, 0, -H * 0.1 - i * (H / 5), 0, pivot);
          box(W + 0.1, 0.05, 0.05, this.mats.metal, 0, 0, 0, pivot);
        } else box(W, H, 0.04, e.kind === 'flap' ? this.mats.wood : this.mats.metal, 0, -H / 2, 0, pivot);
        obj.pivot = pivot;
        break;
      }
      case 'fireplace': {
        const fp = new THREE.Group(); grp.add(fp);
        // local: +z into room. The anchor is the firebox centre.
        // stone surround with an open firebox (opening 1.1 wide, from y -0.55 to 0.3)
        box(0.65, 1.3, 0.7, this.mats.stone, -0.875, 0.1, -0.15, fp);
        box(0.65, 1.3, 0.7, this.mats.stone, 0.875, 0.1, -0.15, fp);
        box(1.1, 0.45, 0.7, this.mats.stone, 0, 0.525, -0.15, fp);
        box(1.1, 0.8, 0.05, this.mats.black, 0, -0.15, -0.47, fp);
        box(1.1, 0.04, 0.6, this.mats.black, 0, -0.53, -0.18, fp);
        box(2.6, 0.12, 0.85, this.mats.darkwood, 0, 0.8, 0, fp);
        box(1.8, 1.8, 0.6, this.mats.stone, 0, 1.9, -0.2, fp);
        for (let i = 0; i < 6; i++) { const em = box(0.12, 0.05, 0.12, this.mats.ember, rand(-0.35, 0.35), -0.48, rand(-0.1, 0.15), fp); em.rotation.y = rand(0, 3); }
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial('rgba(255,120,40,0.9)', 'rgba(255,60,0,0)'), blending: THREE.AdditiveBlending, depthWrite: false }));
        gl.scale.set(1.4, 0.9, 1); gl.position.set(0, -0.3, 0.1); fp.add(gl); obj.fireGlow = gl;
        break;
      }
      case 'drain': {
        const d = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 20), this.mats.metal); grp.add(d);
        const hole = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), this.mats.black); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.02; grp.add(hole);
        for (let i = -2; i <= 2; i++) box(0.03, 0.03, 0.54 - Math.abs(i) * 0.08, this.mats.metal, i * 0.1, 0.03, 0);
        obj.grate = d;
        break;
      }
      case 'hatch': case 'skylight': {
        const pivot = new THREE.Group(); pivot.position.set(-0.5, -0.02, 0); grp.add(pivot);
        for (const [w, d, x, z] of [[1.15, 0.08, 0, -0.54], [1.15, 0.08, 0, 0.54], [0.08, 1.15, -0.54, 0], [0.08, 1.15, 0.54, 0]]) box(w, 0.1, d, this.mats.frame, x, -0.05, z);
        if (e.kind === 'hatch') box(1.0, 0.06, 1.0, this.mats.wood, 0.5, 0, 0, pivot);
        else {
          const gl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mats.glass); gl.rotation.x = Math.PI / 2; gl.position.set(0.5, 0, 0); pivot.add(gl);
          const sky = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: TX.radial('rgba(48,64,90,0.95)', 'rgba(3,5,9,1)'), fog: false }));
          sky.rotation.x = Math.PI / 2; sky.position.y = 2.5; grp.add(sky);
        }
        obj.pivot = pivot;
        break;
      }
    }
    this.entranceObjs.set(e.id, obj);
  }

  _buildFurniture(it) {
    const s = FURN_SIZES[it.t];
    const bx = furnitureBox(it);
    this.colliders[it.f].push({ x1: bx.x1, x2: bx.x2, z1: bx.z1, z2: bx.z2 });
    const grp = new THREE.Group();
    grp.position.set(it.x, FLOORS[it.f].y, it.z);
    grp.rotation.y = (it.r || 0) * Math.PI / 2;
    const [w, d, h] = [s[0], s[1], s[2]];
    const M = this.mats;
    const B = (bw, bh, bd, mat, x, y, z, p = grp) => { const m = new THREE.Mesh(boxGeo(bw, bh, bd, 1), mat); m.position.set(x, y, z); p.add(m); return m; };
    const legs = (lw, ld, lh, mat) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(0.06, lh, 0.06, mat, sx * (lw / 2 - 0.05), lh / 2, sz * (ld / 2 - 0.05)); };
    switch (it.t) {
      case 'bed': B(w, 0.35, d, M.darkwood, 0, 0.2, 0); B(w - 0.1, 0.22, d - 0.1, M.white, 0, 0.47, 0); B(w * 0.7, 0.12, 0.35, M.cream, 0, 0.62, -d / 2 + 0.3); B(w, 1.1, 0.08, M.darkwood, 0, 0.55, -d / 2); B(w - 0.08, 0.06, d * 0.55, M.fabric, 0, 0.6, d * 0.18); break;
      case 'cot': B(w, 0.05, d, M.white, 0, 0.5, 0); for (let i = 0; i < 9; i++) { B(0.03, 0.5, 0.03, M.white, -w / 2, 0.75, -d / 2 + i * d / 8); B(0.03, 0.5, 0.03, M.white, w / 2, 0.75, -d / 2 + i * d / 8); } B(w, 0.04, 0.04, M.white, 0, 1.0, -d / 2); B(w, 0.04, 0.04, M.white, 0, 1.0, d / 2); legs(w, d, 0.5, M.white); break;
      case 'table': case 'smalltable': case 'desk': B(w, 0.06, d, M.wood, 0, h - 0.03, 0); legs(w, d, h - 0.06, M.wood); if (it.t === 'desk') B(w * 0.4, 0.2, d - 0.1, M.darkwood, w * 0.25, h - 0.16, 0); break;
      case 'chair': B(w, 0.06, d, M.wood, 0, 0.46, 0); B(w, 0.55, 0.05, M.wood, 0, 0.75, -d / 2); legs(w, d, 0.44, M.wood); break;
      case 'sofa': case 'armchair': B(w, 0.42, d, M.fabric, 0, 0.21, 0); B(w, 0.5, 0.2, M.fabric, 0, 0.65, -d / 2 + 0.1); B(0.18, 0.25, d, M.fabric, -w / 2 + 0.09, 0.55, 0); B(0.18, 0.25, d, M.fabric, w / 2 - 0.09, 0.55, 0); break;
      case 'bookshelf': case 'shelf': {
        B(w, h, 0.04, M.darkwood, 0, h / 2, -d / 2 + 0.02); B(0.04, h, d, M.darkwood, -w / 2, h / 2, 0); B(0.04, h, d, M.darkwood, w / 2, h / 2, 0);
        const n = 5;
        for (let i = 0; i <= n; i++) {
          const y = i * (h / n); B(w, 0.03, d, M.darkwood, 0, y + 0.015, 0);
          if (i === n) continue;
          let x = -w / 2 + 0.06;
          while (x < w / 2 - 0.1) {
            const bw = rand(0.04, 0.09);
            if (it.t === 'bookshelf') { const bh = rand(0.2, h / n - 0.06); B(bw, bh, d * 0.8, new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(rand(0, 1), 0.35, rand(0.12, 0.25)) }), x + bw / 2, y + bh / 2 + 0.03, 0); }
            else if (Math.random() < 0.4) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), new THREE.MeshLambertMaterial({ color: 0x4a5a3a, transparent: true, opacity: 0.8 })); j.position.set(x + 0.06, y + 0.12, 0); grp.add(j); }
            x += bw + (it.t === 'shelf' ? 0.12 : 0.005);
          }
        }
        break;
      }
      case 'counter': B(w, h - 0.05, d, M.darkwood, 0, (h - 0.05) / 2, 0); B(w + 0.04, 0.05, d + 0.04, M.cream, 0, h - 0.025, 0); break;
      case 'stove': B(w, h, d, M.metal, 0, h / 2, 0); B(w - 0.1, 0.02, d - 0.1, M.black, 0, h + 0.01, 0); B(w - 0.2, 0.4, 0.02, M.black, 0, 0.4, d / 2); break;
      case 'fridge': B(w, h, d, M.cream, 0, h / 2, 0); B(0.03, 0.4, 0.03, M.metal, w / 2 - 0.1, h * 0.7, d / 2 + 0.02); break;
      case 'washer': B(w, h, d, M.white, 0, h / 2, 0); { const c = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), M.black); c.position.set(0, h * 0.5, d / 2 + 0.01); grp.add(c); } break;
      case 'boiler': { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, h, 14), M.metal); c.position.y = h / 2; grp.add(c); B(0.12, 1.3, 0.12, M.metal, 0.3, h + 0.6, 0); B(0.1, 0.1, 2.5, M.metal, 0.3, h + 1.1, -1.2); const g = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), M.ember); g.position.set(0, 0.4, 0.56); grp.add(g); break; }
      case 'crates': B(w * 0.95, 0.55, d * 0.95, M.wood, 0, 0.275, 0); B(w * 0.6, 0.5, d * 0.6, M.wood, rand(-0.1, 0.1), 0.8, rand(-0.1, 0.1)).rotation.y = rand(-0.3, 0.3); break;
      case 'barrel': { const c = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 * 0.9, w / 2, h, 12), M.wood); c.position.y = h / 2; grp.add(c); break; }
      case 'bathtub': B(w, h, d, M.white, 0, h / 2, 0); B(w - 0.12, 0.02, d - 0.12, new THREE.MeshLambertMaterial({ color: 0x1d2420 }), 0, h - 0.06, 0); break;
      case 'sink': B(0.2, 0.75, 0.2, M.white, 0, 0.375, 0); B(w, 0.15, d, M.white, 0, 0.82, 0); break;
      case 'toilet': B(0.4, 0.4, 0.5, M.white, 0, 0.2, 0.08); B(0.42, 0.4, 0.18, M.white, 0, 0.6, -0.25); break;
      case 'wardrobe': B(w, h, d, M.darkwood, 0, h / 2, 0); B(0.01, h - 0.2, 0.01, M.black, 0, h / 2, d / 2 + 0.005); B(0.04, 0.12, 0.04, M.brass, 0.08, h * 0.55, d / 2 + 0.02); B(0.04, 0.12, 0.04, M.brass, -0.08, h * 0.55, d / 2 + 0.02); break;
      case 'dresser': B(w, h, d, M.darkwood, 0, h / 2, 0); for (let i = 0; i < 3; i++) B(w - 0.1, 0.01, 0.01, M.black, 0, 0.3 + i * 0.25, d / 2 + 0.005); break;
      case 'clock': {
        B(w, h, d, M.darkwood, 0, h / 2, 0);
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), M.cream); face.position.set(0, h - 0.35, d / 2 + 0.01); grp.add(face);
        const hand = B(0.015, 0.16, 0.01, M.black, 0, h - 0.35 + 0.08, d / 2 + 0.02);
        const pend = new THREE.Group(); pend.position.set(0, h - 0.65, d / 2 + 0.01); grp.add(pend);
        B(0.02, 0.7, 0.01, M.brass, 0, -0.35, 0, pend); const bob = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), M.brass); bob.position.y = -0.72; pend.add(bob);
        this.clockObj = { pend, hand, pos: new THREE.Vector3(it.x, FLOORS[it.f].y + 1.5, it.z) };
        break;
      }
      case 'rocker': {
        const rk = new THREE.Group(); grp.add(rk);
        B(w, 0.06, d * 0.6, M.wood, 0, 0.45, 0, rk); B(w, 0.7, 0.05, M.wood, 0, 0.85, -d * 0.3, rk).rotation.x = -0.2;
        for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 4, 16, 0.9), M.wood); r.rotation.set(0, Math.PI / 2, Math.PI * 1.5 - 0.45); r.position.set(sx * (w / 2 - 0.05), 0.92, 0); rk.add(r); B(0.04, 0.42, 0.04, M.wood, sx * (w / 2 - 0.05), 0.24, 0.2, rk); B(0.04, 0.42, 0.04, M.wood, sx * (w / 2 - 0.05), 0.24, -0.2, rk); }
        (this.rockers = this.rockers || []).push({ rk, ph: rand(0, 6) });
        break;
      }
      case 'trunk': B(w, h * 0.75, d, M.wood, 0, h * 0.375, 0); B(w + 0.02, h * 0.25, d + 0.02, M.darkwood, 0, h * 0.875, 0); B(0.1, 0.1, 0.03, M.brass, 0, h * 0.7, d / 2 + 0.01); break;
      case 'mannequin': {
        B(0.05, 0.9, 0.05, M.darkwood, 0, 0.45, 0); B(0.4, 0.04, 0.4, M.darkwood, 0, 0.02, 0);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.65, 10), M.cream); t.position.y = 1.15; grp.add(t);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), M.cream); head.position.y = 1.62; grp.add(head);
        (this.mannequins = this.mannequins || []).push({ grp, head, it });
        break;
      }
      case 'sheet': { const m = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.6, h, 8, 1), M.sheet); m.scale.z = d / w; m.position.y = h / 2; grp.add(m); const top = new THREE.Mesh(new THREE.SphereGeometry(w * 0.45, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), M.sheet); top.scale.set(1, 0.3, d / w); top.position.y = h; grp.add(top); break; }
      case 'phone': B(w, 0.04, d, M.wood, 0, h - 0.02, 0); legs(w, d, h - 0.04, M.wood); B(0.22, 0.08, 0.16, M.black, 0, h + 0.04, 0); B(0.24, 0.04, 0.06, M.black, 0, h + 0.1, 0); this.phonePos = new THREE.Vector3(it.x, FLOORS[it.f].y + h + 0.1, it.z); break;
      case 'dollhouse': {
        B(w, 0.6, d, new THREE.MeshLambertMaterial({ color: 0x5d4a3a }), 0, 0.3 + 0.4, 0); B(0.5, 0.4, 0.04, M.darkwood, 0, 0.2, 0);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 0.35, 4), M.darkwood); roof.rotation.y = Math.PI / 4; roof.scale.z = d / w; roof.position.y = 1.17; grp.add(roof);
        for (const [x, y] of [[-0.25, 0.85], [0.25, 0.85], [-0.25, 0.6], [0.25, 0.6]]) B(0.1, 0.1, 0.01, new THREE.MeshBasicMaterial({ color: 0xc9a050 }), x, y, d / 2 + 0.005);
        const fig = B(0.03, 0.08, 0.03, M.sheet, 0.35, 0.44, d / 2 + 0.12); this.dollFig = fig;
        break;
      }
      case 'piano': B(w, h, d, M.black, 0, h / 2, 0); B(w - 0.1, 0.03, 0.18, M.white, 0, 0.75, d / 2 + 0.08); break;
      case 'fireplace': break;
      default: B(w, h, d, M.wood, 0, h / 2, 0);
    }
    this.scene.add(grp);
  }

  _buildDecor() {
    this.portraits = [];
    for (const p of PORTRAITS) {
      const fy = FLOORS[p.f].y;
      const w = p.big ? 1.3 : 0.7, h = p.big ? 1.65 : 0.88;
      const g = new THREE.Group();
      g.position.set(p.x, fy + (p.y || 1.75), p.z); g.rotation.y = p.rot;
      if (p.v !== 'scratched' && Math.random() < 0.35) g.rotation.z = rand(-0.12, 0.12); // crooked
      const fr = new THREE.Mesh(boxGeo(w + 0.14, h + 0.14, 0.05, 1), this.mats.gold); g.add(fr);
      const mat = new THREE.MeshLambertMaterial({ map: TX.portrait(p.v) });
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); pic.position.z = 0.03; g.add(pic);
      this.scene.add(g);
      this.portraits.push({ ...p, g, mat, alt: false, pos: g.position.clone(), dir: new THREE.Vector3(Math.sin(p.rot), 0, Math.cos(p.rot)) });
    }
    for (const w of WRITINGS) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6 * w.size, 0.65 * w.size), new THREE.MeshLambertMaterial({ map: TX.writing(w.text, w.color), transparent: true, depthWrite: false }));
      m.position.set(w.x, FLOORS[w.f].y + w.y, w.z); m.rotation.y = w.rot; m.renderOrder = 1;
      this.scene.add(m);
    }
    // Bathroom mirror
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshBasicMaterial({ color: 0x1b2128 }));
    mir.position.set(-8, FLOORS[2].y + 1.6, -9.85); this.scene.add(mir);
    const mf = new THREE.Mesh(boxGeo(0.7, 0.9, 0.03, 1), this.mats.gold); mf.position.set(-8, FLOORS[2].y + 1.6, -9.865); this.scene.add(mf);
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), new THREE.MeshBasicMaterial({ map: TX.womanFace(), transparent: true, opacity: 0 }));
    ghost.position.set(-7.85, FLOORS[2].y + 1.62, -9.84); this.scene.add(ghost);
    this.mirror = { pos: new THREE.Vector3(-8, FLOORS[2].y + 1.6, -9.85), ghost, t: 0, cd: 0 };

    this.notes = NOTES.map((n) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshLambertMaterial({ map: TX.paper(), emissive: 0x222018 }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = rand(-0.5, 0.5);
      m.position.set(n.x, FLOORS[n.f].y + n.y + 0.01, n.z); this.scene.add(m);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial('rgba(255,240,200,0.5)', 'rgba(255,240,200,0)'), blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.set(0.6, 0.6, 1); glow.position.copy(m.position); glow.position.y += 0.05; this.scene.add(glow);
      return { ...n, mesh: m, glow, read: false };
    });
  }

  _buildSalt() {
    const mk = (c) => {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.PlaneGeometry(c.r * 2.3, c.r * 2.3), new THREE.MeshBasicMaterial({ map: TX.saltRing(), transparent: true, depthWrite: false, opacity: 0.9 }));
      ring.rotation.x = -Math.PI / 2; g.add(ring);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(c.r * 2.6, c.r * 2.6), new THREE.MeshBasicMaterial({ map: TX.radial('rgba(180,210,255,0.18)', 'rgba(180,210,255,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01; g.add(glow);
      g.position.set(c.x, FLOORS[c.f].y + 0.02, c.z);
      this.scene.add(g);
      return g;
    };
    this._mkSalt = mk;
    this.saltFixed = SALT_CIRCLES.map(mk);
  }

  // ------------------------------------------------------------------ models
  makeHand() {
    const g = new THREE.Group();
    const M = this.mats;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 8), M.skin);
    arm.rotation.x = Math.PI / 2; arm.position.z = -0.45; g.add(arm);
    const palm = new THREE.Mesh(boxGeo(0.1, 0.03, 0.12, 1), M.skin); palm.position.z = 0.06; g.add(palm);
    const fingers = [];
    for (let i = 0; i < 5; i++) {
      const thumb = i === 4;
      let parent = new THREE.Group();
      parent.position.set(thumb ? 0.06 : -0.04 + i * 0.027, 0, thumb ? 0.03 : 0.12);
      if (thumb) parent.rotation.y = 0.9;
      g.add(parent);
      const segs = [];
      for (let s = 0; s < 3; s++) {
        const len = (thumb ? 0.035 : 0.055) * (1 - s * 0.12) * (i === 1 || i === 2 ? 1.15 : 1);
        const seg = new THREE.Mesh(boxGeo(0.016, 0.016, len, 1), M.skin); seg.position.z = len / 2; parent.add(seg);
        if (s === 2) { const nail = new THREE.Mesh(boxGeo(0.014, 0.008, 0.03, 1), M.nail); nail.position.set(0, 0.006, len / 2 + 0.01); seg.add(nail); }
        const next = new THREE.Group(); next.position.z = len; parent.add(next);
        segs.push(parent); parent = next;
      }
      fingers.push(segs);
    }
    g.userData.fingers = fingers;
    return g;
  }
  curlHand(h, amt) {
    for (const segs of h.userData.fingers) segs.forEach((s, i) => (s.rotation.x = amt * (0.5 + i * 0.25)));
  }

  makeWoman() {
    const g = new THREE.Group();
    const M = this.mats;
    const pts = [[0.4, 0.0], [0.42, 0.12], [0.38, 0.4], [0.3, 0.8], [0.22, 1.15], [0.19, 1.35], [0.17, 1.45], [0.08, 1.53]].map(([x, y]) => new THREE.Vector2(x, y));
    const dg = new THREE.LatheGeometry(pts, 28);
    // ragged, uneven hem
    const pos = dg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0.2) {
        const a = Math.atan2(pos.getZ(i), pos.getX(i));
        const k = (0.2 - y) / 0.2;
        pos.setY(i, y + k * (0.08 * Math.sin(a * 7) + 0.06 * Math.sin(a * 13 + 1) + 0.05));
        pos.setX(i, pos.getX(i) * (1 + k * 0.12 * Math.sin(a * 5)));
        pos.setZ(i, pos.getZ(i) * (1 + k * 0.12 * Math.sin(a * 5)));
      }
    }
    dg.computeVertexNormals();
    dg.userData.base = Float32Array.from(pos.array);
    const dress = new THREE.Mesh(dg, M.dress); g.add(dress);
    dress.position.y = 0.06;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.14, 8), M.skin); neck.position.y = 1.56; g.add(neck);
    const head = new THREE.Group(); head.position.y = 1.7; g.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), M.skin); skull.scale.set(0.9, 1.1, 0.95); head.add(skull);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.22), new THREE.MeshBasicMaterial({ map: TX.womanFace(), color: 0xd0d0d0, transparent: true, fog: false }));
    face.position.set(0, -0.015, 0.118); head.add(face);
    // long black hair: hangs down the back, a crown over the top and strands framing the face
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.26, 1.0, 14, 1, true, Math.PI * 0.28, Math.PI * 1.44), M.hair);
    back.position.y = -0.4; head.add(back);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.3), M.hair); crown.position.y = 0.012; head.add(crown);
    const backCap = new THREE.Mesh(new THREE.SphereGeometry(0.129, 14, 8, Math.PI * 0.75, Math.PI * 1.5, 0, Math.PI * 0.62), M.hair); head.add(backCap);
    const strands = [];
    for (const sx of [-1, 1]) {
      const st = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.8, 1, 4), M.hair);
      st.position.set(sx * 0.088, -0.36, 0.105); st.rotation.y = sx * 0.35; head.add(st); strands.push(st);
    }
    const arms = [];
    for (const sx of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(sx * 0.2, 1.43, 0); g.add(sh);
      const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.72, 6), M.skin); a.position.y = -0.36; sh.add(a);
      const hnd = this.makeHand(); hnd.scale.setScalar(0.85); hnd.rotation.x = Math.PI / 2; hnd.position.y = -0.72; hnd.position.z = 0.0; sh.add(hnd);
      this.curlHand(hnd, 0.3);
      sh.rotation.z = sx * 0.08;
      arms.push(sh);
    }
    g.userData = { head, arms, strands, dress };
    return g;
  }

  // Hem drifts as if in a wind that isn't there
  waveDress(dress, t) {
    const pos = dress.geometry.attributes.position, base = dress.geometry.userData.base;
    for (let i = 0; i < pos.count; i++) {
      const by = base[i * 3 + 1];
      if (by > 0.5) continue;
      const k = (0.5 - by) / 0.5;
      const bx = base[i * 3], bz = base[i * 3 + 2];
      const a = Math.atan2(bz, bx);
      const w = 1 + k * 0.1 * Math.sin(t * 2.2 + a * 3);
      pos.setXYZ(i, bx * w, by + k * 0.03 * Math.sin(t * 3 + a * 5), bz * w);
    }
    pos.needsUpdate = true;
  }

  makeSilhouette() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshBasicMaterial({ map: TX.silhouette('hands'), transparent: true, depthWrite: false, color: 0x000000, fog: false }));
    return m;
  }

  makeAvatar(color, name) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.25) });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.85, 4, 10), mat); body.position.y = 0.72; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), mat); head.position.y = 1.5; g.add(head);
    const visor = new THREE.Mesh(boxGeo(0.28, 0.08, 0.1, 1), new THREE.MeshBasicMaterial({ color: 0x111111 })); visor.position.set(0, 1.53, 0.16); g.add(visor);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.2, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe8c0, transparent: true, opacity: 0.025, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    beam.rotation.x = -Math.PI / 2; beam.position.set(0.15, 1.3, 1.75); g.add(beam);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.labelSprite(name, color), depthTest: false, transparent: true }));
    label.scale.set(1.2, 0.3, 1); label.position.y = 2.05; label.renderOrder = 5; g.add(label);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; g.add(ring);
    g.userData = { beam, body };
    this.scene.add(g);
    return g;
  }

  makePowerup(type) {
    const g = new THREE.Group();
    const M = this.mats;
    const inner = new THREE.Group(); g.add(inner);
    const add = (geo, mat, y = 0, x = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); inner.add(m); return m; };
    switch (type) {
      case 'salt': add(new THREE.CylinderGeometry(0.07, 0.08, 0.2, 10), M.white); add(new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.metal, 0.1); break;
      case 'plank': for (let i = 0; i < 3; i++) add(boxGeo(0.7, 0.04, 0.12, 1), M.plank, i * 0.05, 0, (i - 1) * 0.05).rotation.y = (i - 1) * 0.2; break;
      case 'speed': add(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xff3355 })); add(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8), M.metal, 0.12); break;
      case 'compass': add(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), M.brass).rotation.x = Math.PI / 2; add(boxGeo(0.02, 0.18, 0.01, 1), new THREE.MeshBasicMaterial({ color: 0x66ccff }), 0, 0, 0.02); break;
      case 'charm': for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: 0xa070ff }), 0.05 + i * 0.04, Math.sin(i) * 0.03); add(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), new THREE.MeshLambertMaterial({ color: 0x3a6a2a }), 0.05); break;
      case 'candle': add(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10), M.cream); add(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd080 }), 0.14); break;
    }
    const col = { salt: 'rgba(220,235,255,0.7)', plank: 'rgba(255,200,130,0.6)', speed: 'rgba(255,80,110,0.7)', compass: 'rgba(110,200,255,0.7)', charm: 'rgba(180,120,255,0.7)', candle: 'rgba(255,210,120,0.8)' }[type];
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(col, 'rgba(0,0,0,0)'), blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(0.9, 0.9, 1); g.add(glow);
    g.userData = { inner };
    this.scene.add(g);
    return g;
  }

  // ------------------------------------------------------------------ attack visuals
  addAttack(a) {
    if (this.attackVis.has(a.id)) return;
    const e = ENTRANCES.find((x) => x.id === a.e);
    const obj = this.entranceObjs.get(e.id);
    const v = { a, e, obj, grp: new THREE.Group(), t: 0, p: 0, push: 0, leaving: 0, parts: {}, nextSound: rand(0.3, 1.2) };
    obj.grp.add(v.grp);
    const P = v.parts;
    const kind = e.kind;
    if (kind === 'window') {
      if (a.v === 'woman') { P.woman = this.makeWoman(); v.grp.add(P.woman); P.woman.rotation.y = 0; }
      else { P.sil = this.makeSilhouette(); v.grp.add(P.sil); }
    } else if (kind === 'skylight') {
      // She lies on the roof, peering straight down through the glass
      P.woman = this.makeWoman(); P.woman.rotation.x = Math.PI / 2; P.woman.userData.dress.visible = false; v.grp.add(P.woman);
    } else {
      P.hand = this.makeHand(); v.grp.add(P.hand);
      if (kind === 'door' || kind === 'drain' || kind === 'fireplace' || kind === 'hatch') { P.hand2 = this.makeHand(); v.grp.add(P.hand2); }
      if (kind === 'door') { P.sil = this.makeSilhouette(); v.grp.add(P.sil); }
      if (kind === 'drain' || kind === 'fireplace') {
        P.hair = new THREE.Group();
        for (let i = 0; i < 9; i++) {
          const st = new THREE.Mesh(new THREE.PlaneGeometry(0.025, rand(0.4, 0.9)), this.mats.hair);
          st.position.set(rand(-0.15, 0.15), 0, rand(-0.12, 0.12)); st.rotation.set(rand(-0.3, 0.3), rand(0, 3), rand(-0.3, 0.3));
          P.hair.add(st);
        }
        v.grp.add(P.hair);
      }
    }
    this.attackVis.set(a.id, v);
    this.flicker = 1.2;
    this._layoutAttack(v, 0);
  }

  _layoutAttack(v, dt) {
    const { e, parts: P, obj } = v;
    const t = this.time;
    const p = clamp(v.p + v.push * 0.25, 0, 1.1) - v.leaving * 1.5;
    const jitter = Math.sin(t * 23) * 0.01 * (1 + v.push * 6);
    const H = (e.t || 0) - (e.b || 0), W = e.w || 1;
    switch (e.kind) {
      case 'window': {
        if (P.woman) {
          P.woman.position.set(Math.sin(t * 0.6) * 0.08 + jitter, -1.84, -0.32 - (1 - p) * 1.4);
          const ud = P.woman.userData;
          ud.arms.forEach((a, i) => { a.rotation.x = -lerp(0.4, 1.35, clamp(p, 0, 1)) + Math.sin(t * 2 + i) * 0.05; a.rotation.z = (i ? 1 : -1) * 0.25; });
          ud.head.rotation.z = Math.sin(t * 0.5) * 0.25;
          this.waveDress(ud.dress, t);
          ud.strands.forEach((s, i) => (s.rotation.x = Math.sin(t * 1.3 + i) * 0.08));
        }
        if (P.sil) {
          P.sil.position.set(Math.sin(t * 0.4) * 0.15 + jitter, -0.55 + (e.b > 2 ? -0.6 : 0), -0.4 - (1 - p) * 1.8);
          P.sil.material.opacity = clamp(0.4 + p * 0.7, 0, 1);
        }
        if (obj.prints) obj.prints.material.opacity = v.leaving ? Math.max(0, obj.prints.material.opacity - dt) : clamp((p - 0.25) * 1.2, 0, 0.8);
        if (obj.curtains) obj.curtains.forEach((c, i) => (c.rotation.y = Math.sin(t * 1.7 + i) * 0.15 * (0.3 + p)));
        break;
      }
      case 'skylight': {
        P.woman.position.set(Math.sin(t * 0.5) * 0.05, 0.22 + (1 - clamp(p, 0, 1)) * 0.9, -1.7);
        P.woman.userData.arms.forEach((a, i) => { a.rotation.x = -2.2 + Math.sin(t * 2 + i) * 0.1; a.rotation.z = (i ? 1 : -1) * 0.5; });
        break;
      }
      case 'door': {
        const open = clamp(p, 0, 1) * 0.42 + Math.abs(Math.sin(t * 17)) * 0.03 * (1 + v.push * 4);
        obj.pivot.rotation.y = open;
        const gapX = W / 2 - 0.05;
        P.hand.position.set(gapX - 0.05, 0.05 + Math.sin(t * 1.3) * 0.05, -0.35 + p * 0.75);
        P.hand.rotation.set(0, -0.3, 0); this.curlHand(P.hand, 0.3 + Math.sin(t * 3) * 0.3);
        P.hand2.position.set(gapX + 0.02, 0.55, -0.15 + p * 0.25); P.hand2.rotation.set(0, -1.6, 0); this.curlHand(P.hand2, 1.2);
        P.hand2.visible = p > 0.3;
        P.sil.position.set(gapX + 0.25, -0.15, -1.0);
        break;
      }
      case 'chute': case 'vent': case 'flap': {
        obj.pivot.rotation.x = -clamp(p, 0, 1) * (e.kind === 'vent' ? 0.15 : 0.9) - Math.abs(Math.sin(t * 15)) * 0.04;
        P.hand.position.set(Math.sin(t * 1.2) * 0.1, e.kind === 'flap' ? -0.05 : -H * 0.1, -0.5 + p * 0.9);
        P.hand.rotation.set(e.kind === 'chute' ? 0.4 : 0, Math.sin(t * 0.8) * 0.3, 0);
        this.curlHand(P.hand, 0.4 + Math.sin(t * 2.5) * 0.4);
        break;
      }
      case 'fireplace': {
        const r = clamp(p, 0, 1);
        P.hand.position.set(-0.18, 0.35 - r * 0.6, -0.05); P.hand.rotation.set(Math.PI / 2 - 0.35, 0, 0); this.curlHand(P.hand, 0.6 + Math.sin(t * 2) * 0.4);
        P.hand2.position.set(0.22, 0.35 - r * 0.45, -0.12); P.hand2.rotation.set(Math.PI / 2 - 0.25, 0.3, 0); this.curlHand(P.hand2, 0.9); P.hand2.visible = r > 0.4;
        P.hair.position.set(0.02, 0.2 - r * 0.35, -0.3);
        if (obj.fireGlow) obj.fireGlow.material.opacity = 0.4 + Math.random() * 0.2;
        break;
      }
      case 'drain': {
        const r = clamp(p, 0, 1);
        P.hand.position.set(-0.08, -0.6 + r * 0.7, 0.0); P.hand.rotation.set(-Math.PI / 2, 0, Math.sin(t) * 0.4); this.curlHand(P.hand, 0.3 + Math.sin(t * 3) * 0.3);
        P.hand2.position.set(0.1, -0.7 + r * 0.6, 0.05); P.hand2.rotation.set(-Math.PI / 2, 0, 1.5); this.curlHand(P.hand2, 1); P.hand2.visible = r > 0.5;
        P.hair.position.set(0, -0.45 + r * 0.3, -0.02); P.hair.rotation.x = -0.2;
        obj.grate.position.y = r > 0.6 ? Math.abs(Math.sin(t * 9)) * 0.04 : 0;
        break;
      }
      case 'hatch': {
        const r = clamp(p, 0, 1);
        obj.pivot.rotation.z = -r * 0.55 - Math.abs(Math.sin(t * 13)) * 0.04;
        P.hand.position.set(0.3, 0.3 - r * 0.75, 0); P.hand.rotation.set(Math.PI / 2, 0, Math.sin(t) * 0.3); this.curlHand(P.hand, 0.4 + Math.sin(t * 3) * 0.4);
        P.hand2.position.set(-0.2, 0.2 - r * 0.4, 0.2); P.hand2.rotation.set(Math.PI / 2, 0, 0.5); this.curlHand(P.hand2, 1.1); P.hand2.visible = r > 0.4;
        break;
      }
    }
  }

  removeAttack(id, how) {
    const v = this.attackVis.get(id);
    if (!v) return;
    if (how === 'banish') { v.leaving = 0.001; }
    else this._disposeAttack(v);
  }
  _disposeAttack(v) {
    v.obj.grp.remove(v.grp);
    if (v.obj.pivot) { v.obj.pivot.rotation.set(0, 0, 0); }
    if (v.obj.prints) v.obj.prints.material.opacity = 0;
    this.attackVis.delete(v.a.id);
  }
  pushAttack(eid) {
    for (const v of this.attackVis.values()) if (v.e.id === eid) { v.push = 1; this._attackSound(v, 'bang'); }
  }

  _attackSound(v, force) {
    const pos = entranceAnchor(v.e);
    const df = Math.abs(v.e.f - this.player.f);
    const o = { pos, vol: Math.pow(0.5, df) * (0.7 + v.p * 0.6), muffle: df ? 0.6 : 0 };
    const k = v.e.kind;
    const pickS = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const s = force || (k === 'door' ? pickS(['knock', 'knock', 'scratch', 'creak'])
      : k === 'window' || k === 'skylight' ? pickS(['tap', 'tap', 'scratch', 'whisper'])
        : k === 'fireplace' ? pickS(['rumble', 'whisper', 'scratch'])
          : k === 'drain' ? pickS(['gurgle', 'whisper', 'gurgle'])
            : k === 'hatch' ? pickS(['bang', 'scratch', 'knock'])
              : pickS(['scratch', 'creak', 'knock']));
    audio.play(s, { ...o, count: s === 'knock' ? 3 + Math.floor(v.p * 4) : undefined });
  }

  // ------------------------------------------------------------------ state
  setPlayers(list, myId) {
    this.myId = myId;
    for (const [id, o] of this.others) { this.scene.remove(o.g); }
    this.others.clear();
    for (const p of list) {
      if (p.id === myId) {
        Object.assign(this.player, { x: p.x, y: p.y, z: p.z, f: p.f, yaw: p.yaw, pitch: 0 });
        continue;
      }
      const g = this.makeAvatar(p.color, p.name);
      g.position.set(p.x, p.y, p.z); g.rotation.y = p.yaw + Math.PI;
      this.others.set(p.id, { g, tx: p.x, ty: p.y, tz: p.z, tyaw: p.yaw + Math.PI, name: p.name, f: p.f, stepAcc: 0 });
    }
  }
  removePlayer(id) { const o = this.others.get(id); if (o) { this.scene.remove(o.g); this.others.delete(id); } }

  applyState(s) {
    this.state = s;
    const seen = new Set();
    for (const a of s.a) {
      seen.add(a.id);
      if (!this.attackVis.has(a.id)) this.addAttack({ id: a.id, e: a.e, v: a.v });
      const v = this.attackVis.get(a.id);
      v.a.l = a.l; v.a.tot = a.tot; v.a.by = a.by;
      v.targetP = clamp(1 - a.l / a.tot, 0, 1);
    }
    for (const [id, v] of this.attackVis) if (!seen.has(id) && !v.leaving) this._disposeAttack(v);

    // powerups
    const pw = new Set();
    for (const p of s.pw) {
      pw.add(p.id);
      if (!this.powerupMeshes.has(p.id)) { const m = this.makePowerup(p.t); m.position.set(p.x, p.y + 0.9, p.z); m.userData.p = p; this.powerupMeshes.set(p.id, m); }
    }
    for (const [id, m] of this.powerupMeshes) if (!pw.has(id)) { this.scene.remove(m); this.powerupMeshes.delete(id); }
    // salt circles
    const cs = new Set();
    for (const c of s.c) {
      cs.add(c.id);
      if (!this.circleMeshes.has(c.id)) this.circleMeshes.set(c.id, this._mkSalt(c));
      const m = this.circleMeshes.get(c.id); m.children[0].material.opacity = c.l < 6 ? 0.3 + 0.6 * Math.abs(Math.sin(this.time * 4)) : 0.9;
    }
    for (const [id, m] of this.circleMeshes) if (!cs.has(id)) { this.scene.remove(m); this.circleMeshes.delete(id); }
    // planks
    const pk = new Set(s.pk);
    for (const id of pk) if (!this.plankMeshes.has(id)) this.plankMeshes.set(id, this._mkPlanks(id));
    for (const [id, m] of this.plankMeshes) if (!pk.has(id)) { m.parent.remove(m); this.plankMeshes.delete(id); }
    // others
    for (const p of s.p) {
      if (p.id === this.myId) { this.me = p; continue; }
      const o = this.others.get(p.id);
      if (!o) continue;
      o.tx = p.x; o.ty = p.y; o.tz = p.z; o.tyaw = p.yaw + Math.PI; o.f = p.f; o.cg = p.cg;
      o.g.userData.beam.visible = p.tr;
    }
    // breach entity
    if (s.br && s.br.on) {
      if (!this.entity) { this.entity = this.makeWoman(); this.scene.add(this.entity); this.entity.position.set(s.br.x, s.br.y, s.br.z); this.entityLight.intensity = 3; }
      this.entityTarget = s.br;
    } else if (this.entity) {
      this.scene.remove(this.entity); this.entity = null; this.entityLight.intensity = 0;
    }
  }

  _mkPlanks(eid) {
    const e = ENTRANCES.find((x) => x.id === eid);
    const obj = this.entranceObjs.get(eid);
    const g = new THREE.Group();
    const W = (e.w || 1.2) + 0.4, H = (e.t || 1) - (e.b || 0);
    if (e.kind === 'drain' || e.kind === 'hatch' || e.kind === 'skylight') {
      for (let i = -1; i <= 1; i++) { const m = new THREE.Mesh(boxGeo(1.2, 0.05, 0.18, 1), this.mats.plank); m.position.set(0, e.kind === 'drain' ? 0.05 : -0.1, i * 0.3); m.rotation.y = i * 0.15; g.add(m); }
    } else if (e.kind === 'fireplace') {
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(boxGeo(1.3, 0.16, 0.05, 1), this.mats.plank); m.position.set(0, -0.35 + i * 0.3, 0.3); m.rotation.z = (i - 1) * 0.12; g.add(m); }
    } else {
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(boxGeo(W, 0.16, 0.05, 1), this.mats.plank); m.position.set(0, (i - 1) * H * 0.3, 0.2); m.rotation.z = (i - 1) * 0.25 + rand(-0.05, 0.05); g.add(m); }
    }
    obj.grp.add(g);
    return g;
  }

  // ------------------------------------------------------------------ movement
  collide(x, z, f) {
    const R = PLAYER_R;
    for (let it = 0; it < 2; it++) {
      for (const b of this.colliders[f]) {
        const cx = clamp(x, b.x1, b.x2), cz = clamp(z, b.z1, b.z2);
        const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 < R * R) {
          if (d2 > 1e-8) { const d = Math.sqrt(d2); x = cx + (dx / d) * R; z = cz + (dz / d) * R; }
          else {
            // inside the box: push out the nearest side
            const opts = [[b.x1 - R - x, 0], [b.x2 + R - x, 0], [0, b.z1 - R - z], [0, b.z2 + R - z]];
            opts.sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1]));
            x += opts[0][0]; z += opts[0][1];
          }
        }
      }
    }
    return { x: clamp(x, -13.8, 13.8), z: clamp(z, -9.8, 9.8) };
  }

  teleport(x, y, z, f) { Object.assign(this.player, { x, y, z, f, ground: y }); }

  update(dt) {
    this.time += dt;
    const P = this.player, C = this.controls;
    const frozen = this.frozen || this.me?.cg;
    if (!frozen && C.enabled) {
      const look = C.consumeLook();
      P.yaw -= look.x * 0.0024;
      P.pitch = clamp(P.pitch - look.y * 0.0024, -1.35, 1.35);
      P.yaw += C.turn() * dt;
      const m = C.move();
      const sp = (m.run ? RUN : WALK) * (this.me?.sp > 0 ? 1.45 : 1);
      const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
      const vx = (-sin * m.z + cos * m.x) * sp, vz = (-cos * m.z - sin * m.x) * sp;
      const moving = Math.hypot(vx, vz) > 0.1;
      if (moving) {
        // substep to avoid tunnelling
        const steps = Math.ceil((Math.hypot(vx, vz) * dt) / 0.15);
        for (let i = 0; i < steps; i++) {
          let nx = P.x + (vx * dt) / steps, nz = P.z + (vz * dt) / steps;
          const r = this.collide(nx, nz, P.f);
          P.x = r.x; P.z = r.z;
          const gr = groundAt(P.x, P.z, P.f);
          P.f = gr.floor; P.ground = gr.y;
        }
        P.stepAcc += Math.hypot(vx, vz) * dt;
        const stride = m.run ? 1.9 : 1.5;
        if (P.stepAcc > stride) { P.stepAcc = 0; audio.play('step', { vol: m.run ? 0.5 : 0.3, creaky: P.f > 0 }); }
        P.bob += dt * (m.run ? 11 : 8);
      } else {
        P.ground = groundAt(P.x, P.z, P.f).y;
      }
    } else {
      C.consumeLook();
    }
    if (P.ground === undefined) P.ground = groundAt(P.x, P.z, P.f).y;
    P.y = lerp(P.y, P.ground, Math.min(1, dt * 14));
    if (Math.abs(P.y - P.ground) > 2) P.y = P.ground;
    const bob = this.headBob ? Math.sin(P.bob) * 0.035 : 0;
    this.camera.position.set(P.x, P.y + EYE + bob, P.z);
    this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');

    this._updateWorld(dt);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    audio.setListener(this.camera.position, fwd);
    this.renderer.render(this.scene, this.camera);
  }

  _updateWorld(dt) {
    const t = this.time;
    // Torch & flicker
    this.flicker = Math.max(0, this.flicker - dt);
    let ti = this.torchOn ? 26 : 0;
    if (this.flicker > 0 && Math.random() < 0.45) ti *= Math.random() * 0.3;
    const near = this.entity ? this.entity.position.distanceTo(this.camera.position) : 99;
    if (near < 8 && Math.random() < 0.25) ti *= Math.random();
    this.torch.intensity = ti;
    this.fill.intensity = this.torchOn ? 1.4 : 0.5;
    for (const r of this.roomLights) {
      let i = r.base * (1 - r.flick * 0.25 + r.flick * 0.25 * Math.sin(t * (5 + r.flick * 9) + r.base));
      if (r.flick && Math.random() < 0.01 * r.flick) i *= 0.2;
      if (this.flicker > 0 && Math.random() < 0.5) i *= 0.15;
      if (this.entity) i *= 0.35;
      r.l.intensity = i;
    }

    // Attack visuals
    const vis = [...this.attackVis.values()];
    for (const v of vis) {
      v.t += dt;
      v.p = lerp(v.p, v.targetP ?? 0, Math.min(1, dt * 2));
      v.push = Math.max(0, v.push - dt * 1.5);
      if (v.leaving) {
        v.leaving += dt;
        if (v.leaving > 1.2) { this._disposeAttack(v); continue; }
      }
      this._layoutAttack(v, dt);
      v.nextSound -= dt;
      if (v.nextSound <= 0 && !v.leaving) {
        this._attackSound(v);
        v.nextSound = lerp(5.5, 1.6, v.p) + rand(0, 1.5);
      }
    }
    // red alert lights to the two nearest attacks on my floor
    const myf = this.player.f;
    const sorted = vis.filter((v) => !v.leaving).map((v) => ({ v, A: entranceAnchor(v.e) }))
      .sort((a, b) => (Math.abs(a.v.e.f - myf) - Math.abs(b.v.e.f - myf)) || 0);
    this.alertLights.forEach((l, i) => {
      const s = sorted[i];
      if (!s) { l.intensity = 0; return; }
      const ip = entranceInteractPoint(s.v.e);
      l.position.set(ip.x, s.A.y + 0.3, ip.z);
      l.intensity = (1.5 + s.v.p * 3) * (0.6 + 0.4 * Math.sin(t * 6 + i));
    });

    // Other players
    for (const o of this.others.values()) {
      const g = o.g;
      const k = Math.min(1, dt * 10);
      const ox = g.position.x, oz = g.position.z;
      g.position.x = lerp(g.position.x, o.tx, k); g.position.y = lerp(g.position.y, o.ty, k); g.position.z = lerp(g.position.z, o.tz, k);
      let dy = o.tyaw - g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      g.rotation.y += dy * k;
      o.stepAcc += Math.hypot(g.position.x - ox, g.position.z - oz);
      if (o.stepAcc > 1.6) { o.stepAcc = 0; const df = Math.abs(o.f - myf); audio.play('step', { pos: g.position, vol: 0.4 * Math.pow(0.4, df), creaky: true }); }
      g.userData.body.material.opacity = o.cg ? 0.3 : 1;
      g.userData.body.material.transparent = !!o.cg;
    }

    // Powerups bob/spin
    for (const m of this.powerupMeshes.values()) { m.userData.inner.rotation.y += dt * 1.5; m.userData.inner.position.y = Math.sin(t * 2 + m.position.x) * 0.08; }

    // Breach entity
    if (this.entity && this.entityTarget) {
      const b = this.entityTarget, E = this.entity;
      const k = Math.min(1, dt * 6);
      const prev = E.position.clone();
      E.position.x = lerp(E.position.x, b.x, k); E.position.z = lerp(E.position.z, b.z, k); E.position.y = lerp(E.position.y, b.y, k) + Math.sin(t * 2) * 0.004;
      const mv = E.position.clone().sub(prev);
      const tgt = b.tgt === this.myId ? this.camera.position : (this.others.get(b.tgt)?.g.position || this.camera.position);
      E.rotation.y = Math.atan2(tgt.x - E.position.x, tgt.z - E.position.z);
      const ud = E.userData;
      this.waveDress(ud.dress, t);
      ud.arms.forEach((a, i) => { a.rotation.x = -1.3 + Math.sin(t * 4 + i * 2) * 0.12; });
      ud.head.rotation.z = Math.sin(t * 7) * 0.08 + (Math.random() < 0.03 ? rand(-0.5, 0.5) : 0);
      E.visible = !(Math.random() < 0.04);
      this.entityLight.position.set(E.position.x, E.position.y + 1.5, E.position.z);
      const dist = E.position.distanceTo(this.camera.position);
      this.entityDist = dist;
      if (mv.length() > 0.001 && Math.random() < dt * 2) audio.play('step', { pos: E.position, vol: 0.5 });
    } else this.entityDist = 99;

    // Rocking chairs, clock, mannequins
    for (const r of this.rockers || []) r.rk.rotation.x = Math.sin(t * 1.4 + r.ph) * 0.12;
    if (this.clockObj) {
      const c = this.clockObj;
      c.pend.rotation.z = Math.sin(t * Math.PI) * 0.18;
      const sec = Math.floor(t);
      if (sec !== c.last) { c.last = sec; if (this.player.f === 1) audio.play('tick', { pos: c.pos, vol: 0.4, tock: sec % 2 }); }
      c.hand.rotation.z = -t * 0.05;
    }
    for (const mq of this.mannequins || []) {
      if (mq.it.f !== this.player.f) continue;
      const dx = this.player.x - mq.it.x, dz = this.player.z - mq.it.z;
      const look = Math.atan2(dx, dz);
      // Only turns its head when you're not looking at it
      const toM = new THREE.Vector3(-dx, 0, -dz).normalize();
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion); fwd.y = 0; fwd.normalize();
      if (fwd.dot(toM) < 0.2) mq.head.rotation.y = look - mq.grp.rotation.y;
    }
    // Portraits that change when you look away
    if (Math.random() < dt * 0.6) {
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      for (const p of this.portraits) {
        if (p.f !== this.player.f) continue;
        const to = p.pos.clone().sub(this.camera.position);
        const d = to.length();
        if (d > 12) continue;
        const looking = fwd.dot(to.normalize()) > 0.55;
        if (!looking && Math.random() < 0.18) { p.alt = !p.alt; p.mat.map = TX.portrait(p.v, p.alt); p.mat.needsUpdate = true; }
      }
    }
    // Notes glow pulse
    for (const n of this.notes) n.glow.material.opacity = n.read ? 0.25 : 0.6 + Math.sin(t * 3) * 0.3;
    // Mirror scare
    const mr = this.mirror;
    mr.cd -= dt;
    if (mr.t > 0) { mr.t -= dt; mr.ghost.material.opacity = mr.t > 0 ? 0.85 : 0; }
    if (this.player.f === 2 && mr.cd <= 0) {
      const to = mr.pos.clone().sub(this.camera.position);
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      if (to.length() < 3.5 && fwd.dot(to.normalize()) > 0.85) {
        mr.cd = 40;
        if (Math.random() < 0.6) { mr.t = 0.35; audio.play('stinger', { vol: 0.8 }); this.flicker = 0.5; }
      }
    }
    // Dollhouse figure creeps closer to the tiny front door over the game
    if (this.dollFig && this.state) { const prog = clamp(this.state.b / Math.max(1, this.state.tg), 0, 1); this.dollFig.position.x = 0.35 - (1 - prog) * 0.0 - prog * 0.35; }

    this._ambientScares(dt);
    this._phone(dt);
  }

  _ambientScares(dt) {
    if (!this.running) return;
    this.scareCooldown -= dt;
    if (this.scareCooldown > 0 || this.entity) return;
    this.scareCooldown = rand(35, 75);
    const r = Math.random();
    const P = this.player;
    if (r < 0.4) {
      // Glimpse of her at the end of your torch beam
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion); fwd.y = 0; fwd.normalize();
      const ray = new THREE.Raycaster(new THREE.Vector3(P.x, P.y + 1.2, P.z), fwd, 0.5, 14);
      const hit = ray.intersectObjects(this.wallMeshes, false)[0];
      const d = hit ? hit.distance - 0.6 : 12;
      if (d < 4) return;
      const w = this.makeWoman();
      w.position.set(P.x + fwd.x * d, P.y, P.z + fwd.z * d);
      w.rotation.y = Math.atan2(-fwd.x, -fwd.z);
      this.scene.add(w);
      this.flicker = 0.6;
      audio.play('whisper', { pos: w.position, vol: 0.7 });
      setTimeout(() => { this.scene.remove(w); this.flicker = 0.4; }, 380 + Math.random() * 250);
    } else if (r < 0.65) {
      // Footsteps on the floor above
      const above = { x: P.x + rand(-3, 3), y: P.y + 3.6, z: P.z + rand(-3, 3) };
      let i = 0;
      const iv = setInterval(() => { audio.play('step', { pos: above, vol: 0.9, creaky: true, muffle: 0.5 }); above.x += 0.7; if (++i > 6) clearInterval(iv); }, 520);
    } else if (r < 0.8) {
      audio.play('whisper', { pos: { x: P.x + rand(-1.5, 1.5), y: P.y + 1.6, z: P.z + rand(-1.5, 1.5) }, vol: 0.6 });
    } else {
      audio.play('creak', { pos: { x: P.x + rand(-6, 6), y: P.y + 1, z: P.z + rand(-6, 6) }, vol: 0.7 });
    }
  }

  _phone(dt) {
    const ph = this.phone;
    if (!this.running || ph.rang || !this.phonePos) return;
    ph.t -= dt;
    if (ph.t <= 0 && !ph.ringing && !this.entity) { ph.ringing = true; ph.ringT = 14; ph.next = 0; }
    if (ph.ringing) {
      ph.ringT -= dt; ph.next -= dt;
      if (ph.next <= 0) { audio.play('ring', { pos: this.phonePos, vol: Math.pow(0.5, Math.abs(this.player.f - 1)) * 1.2 }); ph.next = 3; }
      if (ph.ringT <= 0) { ph.ringing = false; ph.rang = true; }
    }
  }

  // ------------------------------------------------------------------ interaction
  getInteraction() {
    const P = this.player, s = this.state;
    if (!s) return null;
    let best = null;
    // Attack entrances
    for (const a of s.a) {
      const e = ENTRANCES.find((x) => x.id === a.e);
      if (e.f !== P.f) continue;
      const ip = entranceInteractPoint(e);
      const d = Math.hypot(P.x - ip.x, P.z - ip.z);
      if (d <= INTERACT_RANGE && (!best || d < best.d)) best = { type: 'attack', a, e, d };
    }
    if (best) return best;
    for (const p of s.pw) {
      if (p.f !== P.f) continue;
      const d = Math.hypot(P.x - p.x, P.z - p.z);
      if (d <= 1.9 && (!best || d < best.d)) best = { type: 'pickup', p, d };
    }
    if (best) return best;
    if (this.phone.ringing && P.f === 1 && Math.hypot(P.x - this.phonePos.x, P.z - this.phonePos.z) < 2.2) return { type: 'phone' };
    for (const n of this.notes) {
      if (n.f !== P.f) continue;
      const d = Math.hypot(P.x - n.x, P.z - n.z);
      if (d <= 1.9 && (!best || d < best.d)) best = { type: 'note', n, d };
    }
    return best;
  }

  // Nearest entrance I could board up
  getPlankTarget() {
    const P = this.player;
    let best = null;
    for (const e of ENTRANCES) {
      if (e.f !== P.f) continue;
      const ip = entranceInteractPoint(e);
      const d = Math.hypot(P.x - ip.x, P.z - ip.z);
      if (d <= INTERACT_RANGE && (!best || d < best.d)) best = { e, d };
    }
    return best;
  }

  answerPhone() { this.phone.ringing = false; this.phone.rang = true; }

  roomName() { return roomAt(this.player.f, this.player.x, this.player.z); }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.running = true;
    this.root.style.display = 'block';
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, this.clock.getDelta());
      this.update(dt);
    };
    loop();
  }
  stop() { this.running = false; this.root.style.display = 'none'; }
}
