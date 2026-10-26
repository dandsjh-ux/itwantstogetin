// Shared house layout — imported by both the browser client and the Node server.
// Coordinates: x runs west(-) to east(+), z runs back(-) to front/street(+). y is up.

export const FLOORS = [
  { id: 0, name: 'Basement', y: -3.4, h: 3.4 },
  { id: 1, name: 'Ground Floor', y: 0, h: 3.4 },
  { id: 2, name: 'First Floor', y: 3.4, h: 3.4 },
  { id: 3, name: 'Attic', y: 6.8, h: 2.8 },
];
export const HOUSE = { x1: -14, x2: 14, z1: -10, z2: 10 };
export const WALL_T = 0.25;
export const PLAYER_R = 0.3;

// ---------------------------------------------------------------------------
// Entrances: everywhere the entity can try to get in.
// n = inward normal (direction pointing into the house). b/t = bottom/top of opening.
export const ENTRANCES = [
  // Basement
  { id: 'cellar_doors', name: 'Cellar Doors', f: 0, x: -9, z: -10, n: [0, 1], kind: 'door', w: 1.6, b: 0, t: 2.2 },
  { id: 'coal_chute', name: 'Coal Chute', f: 0, x: 10, z: 10, n: [0, -1], kind: 'chute', w: 1.0, b: 1.9, t: 2.8 },
  { id: 'basement_window', name: 'Basement Window', f: 0, x: -14, z: 5, n: [1, 0], kind: 'window', w: 1.4, b: 2.2, t: 3.0 },
  { id: 'floor_drain', name: 'Floor Drain', f: 0, x: -3, z: 6, n: null, kind: 'drain' },
  { id: 'boiler_flue', name: 'Boiler Flue', f: 0, x: 14, z: -5, n: [-1, 0], kind: 'vent', w: 0.8, b: 1.6, t: 2.3 },
  // Ground floor
  { id: 'front_door', name: 'Front Door', f: 1, x: 0, z: 10, n: [0, -1], kind: 'door', w: 1.3, b: 0, t: 2.3 },
  { id: 'back_door', name: 'Back Door', f: 1, x: -7, z: -10, n: [0, 1], kind: 'door', w: 1.2, b: 0, t: 2.3 },
  { id: 'cat_flap', name: 'Cat Flap', f: 1, x: -11.5, z: -10, n: [0, 1], kind: 'flap', w: 0.5, b: 0.08, t: 0.55 },
  { id: 'living_window', name: 'Living Room Window', f: 1, x: 9, z: 10, n: [0, -1], kind: 'window', w: 1.8, b: 0.9, t: 2.5 },
  { id: 'fireplace', name: 'Fireplace', f: 1, x: 14, z: 5, n: [-1, 0], kind: 'fireplace' },
  { id: 'dining_window', name: 'Dining Room Window', f: 1, x: -9, z: 10, n: [0, -1], kind: 'window', w: 1.6, b: 0.9, t: 2.5 },
  { id: 'dining_side_window', name: 'Dining Side Window', f: 1, x: -14, z: 5, n: [1, 0], kind: 'window', w: 1.4, b: 0.9, t: 2.4 },
  { id: 'kitchen_window', name: 'Kitchen Window', f: 1, x: -14, z: -5, n: [1, 0], kind: 'window', w: 1.4, b: 1.1, t: 2.3 },
  { id: 'study_window', name: 'Study Window', f: 1, x: 9, z: -10, n: [0, 1], kind: 'window', w: 1.6, b: 0.9, t: 2.4 },
  // First floor
  { id: 'master_window', name: 'Master Bedroom Window', f: 2, x: 9, z: 10, n: [0, -1], kind: 'window', w: 1.8, b: 0.9, t: 2.5 },
  { id: 'master_side_window', name: 'Master Side Window', f: 2, x: 14, z: 5, n: [-1, 0], kind: 'window', w: 1.2, b: 0.9, t: 2.4 },
  { id: 'nursery_window', name: 'Nursery Window', f: 2, x: -9, z: 10, n: [0, -1], kind: 'window', w: 1.6, b: 0.9, t: 2.4 },
  { id: 'bathroom_window', name: 'Bathroom Window', f: 2, x: -14, z: -6, n: [1, 0], kind: 'window', w: 1.0, b: 1.3, t: 2.3 },
  { id: 'bedroom_window', name: 'Your Bedroom Window', f: 2, x: -1, z: -10, n: [0, 1], kind: 'window', w: 1.6, b: 0.9, t: 2.4 },
  { id: 'balcony_door', name: 'Balcony Door', f: 2, x: 10, z: -10, n: [0, 1], kind: 'door', w: 1.2, b: 0, t: 2.3 },
  // Attic
  { id: 'attic_window', name: 'Attic Window', f: 3, x: -14, z: 0, n: [1, 0], kind: 'window', w: 1.1, b: 1.0, t: 2.1, round: true },
  { id: 'attic_vent', name: 'Attic Vent', f: 3, x: 14, z: 0, n: [-1, 0], kind: 'vent', w: 1.2, b: 1.2, t: 1.9 },
  { id: 'roof_hatch', name: 'Roof Hatch', f: 3, x: 0, z: 3, n: null, kind: 'hatch' },
  { id: 'skylight', name: 'Skylight', f: 3, x: -9, z: 6, n: null, kind: 'skylight' },
];

// Where the visual / sound of an entrance is anchored (world coordinates)
export function entranceAnchor(e) {
  const fy = FLOORS[e.f].y;
  if (e.kind === 'fireplace') return { x: 13.55, y: fy + 0.55, z: e.z };
  if (e.kind === 'drain') return { x: e.x, y: fy + 0.02, z: e.z };
  if (e.kind === 'hatch' || e.kind === 'skylight') return { x: e.x, y: fy + FLOORS[e.f].h, z: e.z };
  return { x: e.x, y: fy + (e.b + e.t) / 2, z: e.z };
}

// Where a player should stand to interact with an entrance
export function entranceInteractPoint(e) {
  const fy = FLOORS[e.f].y;
  if (e.kind === 'fireplace') return { x: 12.2, y: fy, z: e.z };
  if (!e.n) return { x: e.x, y: fy, z: e.z };
  return { x: e.x + e.n[0] * 1.0, y: fy, z: e.z + e.n[1] * 1.0 };
}
export const INTERACT_RANGE = 2.6;

// ---------------------------------------------------------------------------
// Stairs: rectangular ramps. low = which end of the axis is on the lower floor.
export const STAIRS = [
  { id: 'basement_stairs', f0: 0, f1: 1, x1: 1, x2: 6, z1: -9.85, z2: -7.6, axis: 'x', low: 'min' },
  { id: 'main_stairs', f0: 1, f1: 2, x1: -1, x2: 1, z1: 1, z2: 6, axis: 'z', low: 'max' },
  { id: 'attic_stairs', f0: 2, f1: 3, x1: 7, x2: 12, z1: -8, z2: -6, axis: 'x', low: 'min' },
];

function stairT(s, x, z) {
  const a = s.axis === 'x' ? x : z;
  const lo = s.axis === 'x' ? s.x1 : s.z1, hi = s.axis === 'x' ? s.x2 : s.z2;
  let t = (a - lo) / (hi - lo);
  if (s.low === 'max') t = 1 - t;
  return Math.max(0, Math.min(1, t));
}

// Ground height and floor index at a position for a player currently on `floor`
export function groundAt(x, z, floor) {
  for (const s of STAIRS) {
    if (x >= s.x1 && x <= s.x2 && z >= s.z1 && z <= s.z2 && (floor === s.f0 || floor === s.f1)) {
      const t = stairT(s, x, z);
      return { y: FLOORS[s.f0].y + (FLOORS[s.f1].y - FLOORS[s.f0].y) * t, floor: t > 0.5 ? s.f1 : s.f0, stair: s };
    }
  }
  return { y: FLOORS[floor].y, floor, stair: null };
}

// ---------------------------------------------------------------------------
// Walls (y0/y1 relative to floor). collide walls block movement in xz.
export const WALLS = [];
export const DOORWAYS = []; // open interior doorways (for door casings)

function wall(f, dir, fixed, a1, a2, openings = [], o = {}) {
  const H = o.h ?? FLOORS[f].h;
  const t = o.t ?? WALL_T;
  const mat = o.mat || (f === 0 ? 'stone' : f === 3 ? 'attic' : 'wall');
  const push = (s, e, y0, y1, collide, visible = true) => {
    if (e - s < 0.01 || y1 - y0 < 0.01) return;
    const w = dir === 'x'
      ? { x1: s, x2: e, z1: fixed - t / 2, z2: fixed + t / 2 }
      : { x1: fixed - t / 2, x2: fixed + t / 2, z1: s, z2: e };
    WALLS.push({ f, ...w, y0, y1, collide, visible, mat, rail: !!o.rail });
  };
  let cur = a1;
  for (const op of [...openings].sort((a, b) => a.c - b.c)) {
    const s = op.c - op.w / 2, e = op.c + op.w / 2;
    push(cur, s, 0, H, true);
    const b = op.b ?? 0, top = op.t ?? 2.25;
    if (b > 0) push(s, e, 0, b, b > 0.3 || !!op.solid);
    if (top < H) push(s, e, top, H, false);
    if (op.solid) push(s, e, 0, H, true, false); // invisible blocker (closed window/door)
    else if (!o.rail) DOORWAYS.push({ f, dir, fixed, c: op.c, w: op.w, t: top, thick: t });
    cur = e;
  }
  push(cur, a2, 0, H, true);
}
const D = (c, w = 1.5) => ({ c, w, b: 0, t: 2.25 });

// Exterior walls with entrance openings
for (let f = 0; f < 4; f++) {
  const ops = (pred) => ENTRANCES.filter((e) => e.f === f && e.w && pred(e))
    .map((e) => ({ c: Math.abs(e.z) === 10 ? e.x : e.z, w: e.w, b: e.b, t: e.t, solid: true }));
  wall(f, 'x', -10, -14, 14, ops((e) => e.z === -10), { mat: 'ext' + f });
  wall(f, 'x', 10, -14, 14, ops((e) => e.z === 10), { mat: 'ext' + f });
  wall(f, 'z', -14, -10, 10, ops((e) => e.x === -14 && Math.abs(e.z) < 10), { mat: 'ext' + f });
  wall(f, 'z', 14, -10, 10, ops((e) => e.x === 14 && Math.abs(e.z) < 10), { mat: 'ext' + f });
}
// Basement
wall(0, 'x', 0, -14, 14, [D(-9), D(2.5), D(11)]);
wall(0, 'z', -4, -10, 0, [D(-3)]);
wall(0, 'z', 8, -10, 0, [D(-3)]);
// Ground
wall(1, 'x', 0, -14, 14, [D(-9), D(-2.6, 1.4), D(2.6, 1.4), D(9)]);
wall(1, 'z', -4, 0, 10, [D(8)]);
wall(1, 'z', 4, 0, 10, [D(8)]);
wall(1, 'z', 0, -10, 0, [D(-3)]);
// First
wall(2, 'x', 1, -14, -2, [D(-8)]);
wall(2, 'x', 1, 2, 14, [D(8)]);
wall(2, 'z', -2, 1, 10);
wall(2, 'z', 2, 1, 10);
wall(2, 'x', -2, -14, 14, [D(-10), D(-3), D(6)]);
wall(2, 'z', -6, -10, -2);
wall(2, 'z', 4, -10, -2);
// Attic
wall(3, 'z', -5, -10, 10, [D(3, 2)]);

// Stair enclosures: full walls on the lower floor, railings on the upper floor
for (const s of STAIRS) {
  const sides = s.axis === 'x'
    ? [['x', s.z1, s.x1, s.x2], ['x', s.z2, s.x1, s.x2]]
    : [['z', s.x1, s.z1, s.z2], ['z', s.x2, s.z1, s.z2]];
  for (const [dir, fixed, a, b] of sides) {
    if (Math.abs(Math.abs(fixed) - 10) < 0.3 || Math.abs(Math.abs(fixed) - 14) < 0.3) continue;
    wall(s.f0, dir, fixed, a, b, [], { t: 0.15, mat: 'panel' });
    wall(s.f1, dir, fixed, a, b, [], { t: 0.1, h: 1.0, rail: true, mat: 'rail' });
  }
  // caps: lower floor at the high end, upper floor at the low end
  const highIsMax = s.low === 'min';
  if (s.axis === 'x') {
    wall(s.f0, 'z', highIsMax ? s.x2 : s.x1, s.z1, s.z2, [], { t: 0.15, mat: 'panel' });
    wall(s.f1, 'z', highIsMax ? s.x1 : s.x2, s.z1, s.z2, [], { t: 0.1, h: 1.0, rail: true, mat: 'rail' });
  } else {
    wall(s.f0, 'x', highIsMax ? s.z2 : s.z1, s.x1, s.x2, [], { t: 0.15, mat: 'panel' });
    wall(s.f1, 'x', highIsMax ? s.z1 : s.z2, s.x1, s.x2, [], { t: 0.1, h: 1.0, rail: true, mat: 'rail' });
  }
}

// Holes in floor slabs (the floor that the stair arrives at)
export const FLOOR_HOLES = STAIRS.map((s) => ({ f: s.f1, x1: s.x1, x2: s.x2, z1: s.z1, z2: s.z2 }));

// Pull-down attic ladder on the first-floor landing, right by the top of the main stairs.
// Climbed with an animation rather than walked like a ramp.
export const LADDERS = [{
  id: 'attic_ladder', f0: 2, f1: 3, x: 3.2,
  base: { x: 3.2, z: 0.0 },          // where you stand on the landing to climb up
  top: { x: 3.2, z: -0.2 },          // where you stand in the attic to climb down
  foot: -0.6, head: -1.55,           // z of the ladder's feet and where it meets the attic floor
  hole: { x1: 2.7, x2: 3.7, z1: -1.85, z2: -0.55 },
}];
for (const L of LADDERS) {
  const h = L.hole;
  FLOOR_HOLES.push({ f: L.f1, ...h });
  // attic: railing on three sides, and an invisible blocker over the opening itself
  wall(L.f1, 'z', h.x1, h.z1, h.z2, [], { t: 0.08, h: 0.9, rail: true, mat: 'rail' });
  wall(L.f1, 'z', h.x2, h.z1, h.z2, [], { t: 0.08, h: 0.9, rail: true, mat: 'rail' });
  wall(L.f1, 'x', h.z1, h.x1, h.x2, [], { t: 0.08, h: 0.9, rail: true, mat: 'rail' });
  WALLS.push({ f: L.f1, x1: h.x1, x2: h.x2, z1: h.z1, z2: h.z2, y0: 0, y1: 1, collide: true, visible: false, mat: 'rail', rail: true });
  // landing: the ladder itself is solid
  WALLS.push({ f: L.f0, x1: h.x1 + 0.05, x2: h.x2 - 0.05, z1: h.z1, z2: L.foot, y0: 0, y1: 3, collide: true, visible: false, mat: 'rail', rail: true });
}

// ---------------------------------------------------------------------------
export const ROOMS = [
  { f: 0, name: 'Cellar', x1: -14, z1: 0, x2: 14, z2: 10 },
  { f: 0, name: 'Storage Room', x1: -14, z1: -10, x2: -4, z2: 0 },
  { f: 0, name: 'Coal Room', x1: -4, z1: -10, x2: 8, z2: 0 },
  { f: 0, name: 'Boiler Room', x1: 8, z1: -10, x2: 14, z2: 0 },
  { f: 1, name: 'Hall', x1: -4, z1: 0, x2: 4, z2: 10 },
  { f: 1, name: 'Dining Room', x1: -14, z1: 0, x2: -4, z2: 10 },
  { f: 1, name: 'Living Room', x1: 4, z1: 0, x2: 14, z2: 10 },
  { f: 1, name: 'Kitchen', x1: -14, z1: -10, x2: 0, z2: 0 },
  { f: 1, name: 'Study', x1: 0, z1: -10, x2: 14, z2: 0 },
  { f: 2, name: 'Stairwell', x1: -2, z1: 1, x2: 2, z2: 10 },
  { f: 2, name: 'Landing', x1: -14, z1: -2, x2: 14, z2: 1 },
  { f: 2, name: 'Nursery', x1: -14, z1: 1, x2: -2, z2: 10 },
  { f: 2, name: 'Master Bedroom', x1: 2, z1: 1, x2: 14, z2: 10 },
  { f: 2, name: 'Bathroom', x1: -14, z1: -10, x2: -6, z2: -2 },
  { f: 2, name: 'Your Bedroom', x1: -6, z1: -10, x2: 4, z2: -2 },
  { f: 2, name: 'Back Room', x1: 4, z1: -10, x2: 14, z2: -2 },
  { f: 3, name: 'West Attic', x1: -14, z1: -10, x2: -5, z2: 10 },
  { f: 3, name: 'East Attic', x1: -5, z1: -10, x2: 14, z2: 10 },
];
export function roomAt(f, x, z) {
  const r = ROOMS.find((r) => r.f === f && x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2);
  return r ? r.name : FLOORS[f]?.name || '';
}

export const SALT_CIRCLES = [
  { f: 0, x: 4, z: 5, r: 1.4 },
  { f: 1, x: -8, z: -5, r: 1.4 },
  { f: 1, x: 6.8, z: 2.2, r: 1.3 },
  { f: 2, x: -11.8, z: -0.5, r: 1.2 },
  { f: 3, x: -9, z: -4, r: 1.4 },
];

export const SPAWN_POINTS = [
  { f: 1, x: 7, z: 8 }, { f: 1, x: 8.6, z: 8.2 }, { f: 1, x: 10.2, z: 8 },
  { f: 1, x: 7, z: 6.6 }, { f: 1, x: 8.6, z: 6.6 }, { f: 1, x: 10.2, z: 6.6 },
];

export const POWERUP_SPOTS = [
  { f: 0, x: -10, z: 7 }, { f: 0, x: 9, z: 5 }, { f: 0, x: -9, z: -6 }, { f: 0, x: 3, z: -3 },
  { f: 0, x: 11, z: -7 }, { f: 0, x: -1, z: 3 },
  { f: 1, x: -9, z: 4 }, { f: 1, x: -10, z: -7 }, { f: 1, x: 5, z: -4 }, { f: 1, x: 11, z: -6 },
  { f: 1, x: 2.8, z: 8.8 }, { f: 1, x: 11, z: 3 }, { f: 1, x: -3, z: -7 },
  { f: 2, x: -8, z: 5 }, { f: 2, x: 8, z: 4 }, { f: 2, x: -10, z: -6 }, { f: 2, x: -2, z: -6 },
  { f: 2, x: 5.5, z: -4 }, { f: 2, x: -5, z: -0.5 },
  { f: 3, x: -10, z: 5 }, { f: 3, x: 4, z: -4 }, { f: 3, x: 9, z: 3 }, { f: 3, x: -1, z: -6 },
];

export const POWERUP_TYPES = {
  salt: { name: 'Salt Shaker', desc: 'Pour a protective salt circle anywhere [Q]' },
  plank: { name: 'Planks', desc: 'Board up an entrance to slow the entity [R]' },
  speed: { name: 'Adrenaline', desc: 'Run much faster for 15 seconds' },
  compass: { name: 'Spirit Compass', desc: 'Points to the nearest attack for 25 seconds' },
  charm: { name: 'Lavender Charm', desc: 'Removes two wrong answers [C]' },
  candle: { name: 'Blessed Candle', desc: 'Adds 15 seconds to every active attack' },
};

// ---------------------------------------------------------------------------
// Furniture. size: w (x), d (z), h. rot in quarter turns.
export const FURN_SIZES = {
  bed: [1.7, 2.2, 0.6], cot: [0.9, 1.4, 1.0], table: [2.0, 1.1, 0.78], smalltable: [0.7, 0.7, 0.75],
  chair: [0.5, 0.5, 1.0], sofa: [2.2, 0.9, 0.85], armchair: [0.9, 0.9, 0.95], bookshelf: [1.6, 0.4, 2.2],
  counter: [3.0, 0.7, 0.92], stove: [0.8, 0.7, 0.92], fridge: [0.8, 0.7, 1.9], boiler: [1.4, 1.2, 2.2],
  crates: [1.2, 1.2, 1.1], shelf: [2.0, 0.5, 1.9], bathtub: [0.9, 1.9, 0.6], sink: [0.6, 0.5, 0.9],
  wardrobe: [1.4, 0.65, 2.1], desk: [1.4, 0.7, 0.78], clock: [0.55, 0.4, 2.1], rocker: [0.7, 1.0, 1.1],
  trunk: [1.1, 0.6, 0.6], mannequin: [0.5, 0.5, 1.75], sheet: [1.4, 1.0, 1.1], phone: [0.5, 0.5, 0.8],
  dollhouse: [1.0, 0.6, 1.0], fireplace: [0.8, 2.2, 1.3], piano: [1.5, 0.6, 1.25], washer: [0.7, 0.7, 0.9],
  barrel: [0.7, 0.7, 1.0], dresser: [1.2, 0.5, 1.0], toilet: [0.45, 0.7, 0.8],
};
export const FURNITURE = [
  // Basement
  { t: 'boiler', f: 0, x: 11.5, z: -2 }, { t: 'barrel', f: 0, x: 13, z: -8.8 }, { t: 'barrel', f: 0, x: 12, z: -8.8 },
  { t: 'crates', f: 0, x: -12.5, z: -8.5 }, { t: 'crates', f: 0, x: -12.6, z: -2.2 }, { t: 'shelf', f: 0, x: -7, z: -0.5 },
  { t: 'shelf', f: 0, x: -12, z: 9.5 }, { t: 'crates', f: 0, x: 12.6, z: 8.5 }, { t: 'washer', f: 0, x: -2.5, z: 9.4 },
  { t: 'crates', f: 0, x: -2.8, z: -8.8 }, { t: 'trunk', f: 0, x: 6.8, z: -1, r: 1 }, { t: 'barrel', f: 0, x: 8.9, z: 3 },
  // Ground
  { t: 'fireplace', f: 1, x: 13.55, z: 5 }, { t: 'sofa', f: 1, x: 9.5, z: 4.8, r: 1 }, { t: 'armchair', f: 1, x: 12, z: 1.4 },
  { t: 'armchair', f: 1, x: 12.2, z: 8.6 }, { t: 'piano', f: 1, x: 4.6, z: 5, r: 1 },
  { t: 'table', f: 1, x: -9, z: 5 }, { t: 'chair', f: 1, x: -10, z: 3.9 }, { t: 'chair', f: 1, x: -8, z: 3.9 },
  { t: 'chair', f: 1, x: -10, z: 6.1 }, { t: 'chair', f: 1, x: -8, z: 6.1 }, { t: 'bookshelf', f: 1, x: -9, z: 0.4 },
  { t: 'clock', f: 1, x: -3.5, z: 4 }, { t: 'phone', f: 1, x: 3.5, z: 3 },
  { t: 'counter', f: 1, x: -9.6, z: -9.5 }, { t: 'stove', f: 1, x: -4.5, z: -9.5 }, { t: 'fridge', f: 1, x: -0.6, z: -8.5, r: 1 },
  { t: 'table', f: 1, x: -5, z: -4.5, r: 1 }, { t: 'counter', f: 1, x: -13.5, z: -1.8, r: 1 },
  { t: 'desk', f: 1, x: 11, z: -1, r: 2 }, { t: 'bookshelf', f: 1, x: 13.6, z: -4, r: 1 }, { t: 'bookshelf', f: 1, x: 7, z: -0.4 },
  { t: 'armchair', f: 1, x: 4.5, z: -1.6 },
  // First
  { t: 'cot', f: 2, x: -12.5, z: 7 }, { t: 'rocker', f: 2, x: -7, z: 7.5 }, { t: 'dollhouse', f: 2, x: -4, z: 9.4 },
  { t: 'dresser', f: 2, x: -12.8, z: 2.5, r: 1 },
  { t: 'bed', f: 2, x: 11.8, z: 7.5 }, { t: 'wardrobe', f: 2, x: 2.6, z: 7, r: 1 }, { t: 'dresser', f: 2, x: 6, z: 9.5 },
  { t: 'bathtub', f: 2, x: -12.9, z: -8.6, r: 1 }, { t: 'sink', f: 2, x: -8, z: -9.6 }, { t: 'toilet', f: 2, x: -6.6, z: -8, r: 3 },
  { t: 'bed', f: 2, x: -4.6, z: -8.5 }, { t: 'desk', f: 2, x: 3.4, z: -6, r: 3 }, { t: 'wardrobe', f: 2, x: -5.5, z: -4, r: 1 },
  { t: 'crates', f: 2, x: 13, z: -3 }, { t: 'trunk', f: 2, x: 5, z: -9.4 }, { t: 'shelf', f: 2, x: 13.6, z: -8.8, r: 1 },
  // Attic
  { t: 'rocker', f: 3, x: -11.5, z: 2 }, { t: 'mannequin', f: 3, x: -6.2, z: 8.5 }, { t: 'trunk', f: 3, x: -12.8, z: -8 },
  { t: 'sheet', f: 3, x: 2, z: 7 }, { t: 'sheet', f: 3, x: 6, z: -2 }, { t: 'sheet', f: 3, x: -2, z: -2.5 },
  { t: 'crates', f: 3, x: 12.6, z: 8.5 }, { t: 'crates', f: 3, x: 12.6, z: -2.5 }, { t: 'trunk', f: 3, x: -9, z: 9.3 },
  { t: 'mannequin', f: 3, x: 9, z: 8.8 }, { t: 'shelf', f: 3, x: -13.6, z: -5, r: 1 },
];
export function furnitureBox(it) {
  const s = FURN_SIZES[it.t];
  const q = ((it.r || 0) % 4 + 4) % 4;
  const w = q % 2 ? s[1] : s[0], d = q % 2 ? s[0] : s[1];
  return { x1: it.x - w / 2, x2: it.x + w / 2, z1: it.z - d / 2, z2: it.z + d / 2, h: s[2] };
}

// ---------------------------------------------------------------------------
// Decorations & easter eggs (client only)
// rot: yaw; 0 faces +z, PI faces -z, PI/2 faces +x, -PI/2 faces -x
const P = Math.PI, H = Math.PI / 2;
export const PORTRAITS = [
  { f: 1, x: -3.84, z: 2.5, rot: H, v: 'man' },
  { f: 1, x: 3.84, z: 6.5, rot: -H, v: 'lady' },
  { f: 1, x: -2.5, z: 9.84, rot: P, v: 'eyes' },
  { f: 1, x: 10, z: 0.16, rot: 0, v: 'family' },
  { f: 1, x: -12, z: 0.16, rot: 0, v: 'scratched', y: 1.95 },
  { f: 1, x: -6.5, z: 9.84, rot: P, v: 'child' },
  { f: 1, x: -7, z: -0.16, rot: P, v: 'house' },
  { f: 1, x: 0.16, z: -6, rot: H, v: 'blank' },
  { f: 2, x: 0, z: 9.84, rot: P, v: 'lady', big: true },
  { f: 2, x: -6, z: -1.84, rot: 0, v: 'child' },
  { f: 2, x: 2, z: -1.84, rot: 0, v: 'man' },
  { f: 2, x: 11, z: -1.84, rot: 0, v: 'eyes' },
  { f: 2, x: -11, z: 0.84, rot: P, v: 'family' },
  { f: 2, x: 11, z: 0.84, rot: P, v: 'scratched' },
  { f: 2, x: 2.16, z: 4, rot: H, v: 'lady' },
  { f: 2, x: -2.16, z: 4, rot: -H, v: 'child' },
  { f: 0, x: -5, z: 0.16, rot: 0, v: 'blank' },
  { f: 0, x: 7, z: 0.16, rot: 0, v: 'scratched' },
  { f: 3, x: -4.84, z: -5, rot: H, v: 'house' },
  { f: 3, x: -5.16, z: 7, rot: -H, v: 'lady' },
];

export const WRITINGS = [
  { f: 2, x: 4.6, z: -1.84, rot: 0, y: 2.3, text: 'ATTIC ↑', color: '#cfcfcf', size: 0.55 },
  { f: 0, x: -1, z: 0.16, rot: 0, y: 1.6, text: 'SHE CANNOT CROSS SALT', color: '#dcdcdc', size: 1.0 },
  { f: 0, x: -13.84, z: -6, rot: H, y: 1.4, text: 'COUNT THE KNOCKS', color: '#7a1010', size: 0.8 },
  { f: 1, x: -4, z: -9.84, rot: 0, y: 1.7, text: "DON'T LET HER IN", color: '#7a1010', size: 1.0 },
  { f: 1, x: 13.84, z: -7.5, rot: -H, y: 1.6, text: 'she was here first', color: '#2a2a2a', size: 0.7 },
  { f: 2, x: -13.84, z: 5, rot: H, y: 1.2, text: 'she sings to the baby', color: '#5a1515', size: 0.6 },
  { f: 2, x: -2, z: -9.84, rot: 0, y: 1.6, text: 'WORDS KEEP HER OUT', color: '#8a1010', size: 0.9 },
  { f: 2, x: 8, z: 9.84, rot: P, y: 1.7, text: 'mum? dad?', color: '#333333', size: 0.6 },
  { f: 3, x: 0, z: -9.84, rot: 0, y: 1.4, text: 'IT WANTS TO GET IN', color: '#8a0c0c', size: 1.2 },
  { f: 3, x: 13.84, z: 6, rot: -H, y: 1.3, text: 'IIII IIII IIII IIII IIII II', color: '#444', size: 0.8 },
  { f: 3, x: -13.84, z: 6.5, rot: H, y: 1.3, text: 'never say yes', color: '#6a1010', size: 0.7 },
];

export const NOTES = [
  { f: 1, x: 3.3, y: 0.82, z: 3.2, title: 'Note on the telephone table',
    text: "Gone to fetch Father Aldous from the village. Back before midnight, we promise.\n\nThe salt circles are fresh. If anything knocks — ANYTHING — do not answer. Do not say yes.\n\nLove, Mum & Dad\n\nP.S. Lock the cat flap." },
  { f: 1, x: -9, y: 0.8, z: 5.2, title: 'A torn diary page',
    text: "14th October.\nThe estate agent said the previous family left in a hurry. They left their portraits. They left every single one.\n\nThe lady in the hallway painting has long black hair. Robin says her eyes move. They don't. I checked." },
  { f: 1, x: 11, y: 0.8, z: -1, title: "Grandfather's research",
    text: "Eleanor Vane. Died 1891, in this house, waiting for her children to come home.\nThey never did.\n\nShe does not know she is dead. She only knows the house is hers, and that someone else is living in it.\n\nShe hates proper words. Speak them clearly and she forgets why she came." },
  { f: 0, x: 6.8, y: 0.62, z: -1, title: 'Scratched inside the trunk lid',
    text: "she comes in where the house is weakest\nthe chimney the drain the little doors\nboard them\nBOARD THEM" },
  { f: 0, x: -7, y: 1.0, z: -0.85, title: 'Jar label',
    text: "SALT — rock, sea, table. Keep dry.\n\nA circle must be unbroken. She will circle it and circle it but she cannot step inside." },
  { f: 2, x: -4, y: 1.05, z: 9.1, title: 'Inside the dollhouse',
    text: "It is a perfect copy of this house.\n\nThere is a tiny white figure standing in the garden, facing the front door.\n\nYesterday it was at the gate." },
  { f: 2, x: 3.4, y: 0.82, z: -6, title: 'Your homework book',
    text: "Spelling test on Monday.\n\nMum says words are like keys. The more you know, the more doors you can lock.\n\nI thought she was joking." },
  { f: 2, x: 6, y: 1.04, z: 9.4, title: "Mum's letter (unsent)",
    text: "Dear Father Aldous,\nWe hear knocking at every hour. Tapping at the attic glass. Fingers in the fireplace.\nThe children have started answering her riddles — and it works. She goes away when they speak the right word.\nBut she always, always comes back." },
  { f: 3, x: -12.8, y: 0.62, z: -8, title: 'Photograph, 1890',
    text: "A family photograph: a father, a mother, three children on the porch of this house.\n\nBehind the glass of the front door, a pale shape is watching them.\n\nOn the back: 'She was here before us.'" },
  { f: 3, x: 6, y: 1.12, z: -2, title: 'Pinned to a dust sheet',
    text: "If you are reading this, you have made it to the attic.\n\nShe cannot keep this up forever. At dawn she goes back to the garden.\n\nHold the doors. Hold the windows. Don't let her in." },
];

export const PLAYER_COLORS = [
  { name: 'Red', hex: '#e53935' }, { name: 'Blue', hex: '#1e88e5' }, { name: 'Green', hex: '#43a047' },
  { name: 'Yellow', hex: '#fdd835' }, { name: 'Purple', hex: '#8e24aa' }, { name: 'Orange', hex: '#fb8c00' },
];
