// src/components/BusSimulator.jsx
// Busz szimulátor sofőr szemszögből (pszeudo-3D canvas):
// széles út, térbeli (dobozokból épített) díszlet és forgalom,
// ütközés + sérülés, útvonaltérkép, ajtókezelés és utascsere.
import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ============================================================
   KONSTANSOK
   ============================================================ */
const SEGMENT_LENGTH = 200;      // egy útszelet hossza (világ egység)
const RUMBLE_LENGTH = 3;         // hány szelet egy csík
const ROAD_WIDTH = 3800;         // fél útszélesség (széles út)
const LANES = 2;
const DRAW_DISTANCE = 180;       // hány szeletet rajzolunk előre
const CAMERA_HEIGHT = 1650;      // a sofőr szemmagassága (busz => magas)
const FIELD_OF_VIEW = 100;
const CAMERA_DEPTH = 1 / Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);

const MAX_SPEED = 9000;                    // egység / mp
const ACCEL = MAX_SPEED / 7;               // a busz lomha
const BRAKE = -MAX_SPEED / 2.2;
const DECEL = -MAX_SPEED / 14;             // gurulás
const OFF_ROAD_DECEL = -MAX_SPEED / 1.6;
const OFF_ROAD_LIMIT = MAX_SPEED / 5;
const CENTRIFUGAL = 0.28;
const STEER = 1.6;

const KMH_PER_UNIT = 110 / MAX_SPEED;              // kijelzett sebesség
const UNITS_PER_KMH = MAX_SPEED / 110;
const UNITS_PER_METER = MAX_SPEED / (110 / 3.6);   // méter <-> világ egység
const SPEED_LIMIT_KMH = 90;

const STOPPED_SPEED = 200;       // ennél lassabban = "áll" (~2,4 km/h)
const STOP_ZONE_SEGMENTS = 15;   // a megállósáv fél hossza szeletben

const DOOR_TIME = 0.9;           // ajtó nyitás/csukás ideje (mp)
const PAX_TIME = 0.34;           // egy utas fel-/leszállása (mp)

const TRAFFIC_COUNT = 26;        // egyszerre ennyi jármű kering a busz körül
const COLLISION_COOLDOWN = 1.6;
const BUS_HALF = 850;            // a busz fél szélessége (világ egység)
const BUS_LENGTH = 1200;         // ütközésvizsgálathoz
const MAX_DAMAGE = 3;            // ennyi ütközés után vége a műszaknak

const COLORS = {
  skyTop: '#0f2340',
  skyMid: '#2c5480',
  skyHorizon: '#7d9ab5',
  sun: '#ffd9a0',
  hillFar: '#456179',
  hillNear: '#3a5a4a',
  fog: '#7d9ab5',
  light: { road: '#42485a', grass: '#2c5c40', rumble: '#fbbf24', lane: '#f1f5f9' },
  dark: { road: '#3b4152', grass: '#265237', rumble: '#e2e8f0', lane: null },
};

/* --- választható járatok --- */
const ROUTES = [
  {
    id: 1,
    name: '1-es járat',
    subtitle: 'Városi kör',
    desc: 'Sok megálló, enyhe kanyarok, sűrű beépítés.',
    seed: 1978,
    curve: 1,
    hill: 1,
    town: 1.15, // ennyire sűrű a beépítés
    stops: ['Telephely', 'Petőfi utca', 'Kossuth tér', 'Városi Kórház', 'Gimnázium', 'Ipari Park', 'Nagyállomás', 'Végállomás'],
  },
  {
    id: 5,
    name: '5-ös járat',
    subtitle: 'Külváros',
    desc: 'Rövidebb, de kanyargósabb járat a lakótelep felé.',
    seed: 50421,
    curve: 1.5,
    hill: 0.7,
    town: 0.85,
    stops: ['Telephely', 'Rákóczi tér', 'Piac', 'Sportpálya', 'Vásárcsarnok', 'Lakótelep', 'Végállomás'],
  },
  {
    id: 9,
    name: '9-es járat',
    subtitle: 'Hegyvidék',
    desc: 'Hosszú, dombos szerpentin, ritka beépítés.',
    seed: 909090,
    curve: 1.35,
    hill: 2.1,
    town: 0.5,
    stops: [
      'Telephely',
      'Szerpentin alsó',
      'Kilátó',
      'Erdei iskola',
      'Menedékház',
      'Hegytető',
      'Turistaház',
      'Völgyállomás',
      'Végállomás',
    ],
  },
];

const CAR_COLORS = ['#ef4444', '#3b82f6', '#e2e8f0', '#22c55e', '#f97316', '#a855f7', '#0ea5e9'];

/* --- térbeli objektumok méretei (világ egység) --- */
const OBJ = {
  tree: { halfW: 110, depth: 220, h: 1500, crownR: 950, crownY: 2350, hit: 420 },
  bush: { halfW: 0, depth: 0, h: 0, crownR: 520, crownY: 460, hit: 0 },
  lamp: { halfW: 70, depth: 140, h: 3400, hit: 240 },
  house: { halfW: 1800, depth: 3800, h: 2000, roof: 1000, hit: 1800 },
  block: { halfW: 2400, depth: 4200, h: 6200, hit: 2400 },   // panelház
  shop: { halfW: 2600, depth: 3000, h: 2400, hit: 2600 },    // üzlet/csarnok
  sign: { halfW: 60, depth: 120, h: 1700, panelW: 460, panelH: 720, hit: 420 },
  shelter: { halfW: 1500, depth: 1400, h: 1600, hit: 1500 },
};

const VEHICLE = {
  car: { halfW: 740, depth: 3400, floor: 170, body: 780, cabTop: 1420 },
  truck: { halfW: 900, depth: 5400, floor: 240, body: 2150, cabTop: 2150 },
  citybus: { halfW: 950, depth: 7200, floor: 220, body: 2500, cabTop: 2500 },
};

/* ============================================================
   SEGÉDFÜGGVÉNYEK
   ============================================================ */
const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
const interpolate = (a, b, p) => a + (b - a) * p;
const easeIn = (a, b, p) => a + (b - a) * Math.pow(p, 2);
const easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
const exponentialFog = (distance, density) => 1 / Math.pow(Math.E, distance * distance * density);

const shadeCache = new Map();
function shade(hex, f) {
  const key = hex + '|' + f;
  let v = shadeCache.get(key);
  if (v) return v;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  v = `rgb(${r},${g},${b})`;
  shadeCache.set(key, v);
  return v;
}

// determinisztikus véletlen => mindig ugyanaz az útvonal
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// izotróp vetítés: vízszintesen és függőlegesen ugyanaz a pixel/egység arány
function project(p, cameraX, cameraY, cameraZ, width, height) {
  p.camera.x = (p.world.x || 0) - cameraX;
  p.camera.y = (p.world.y || 0) - cameraY;
  p.camera.z = (p.world.z || 0) - cameraZ;
  p.screen.scale = CAMERA_DEPTH / p.camera.z;
  p.screen.x = Math.round(width / 2 + (p.screen.scale * p.camera.x * width) / 2);
  p.screen.y = Math.round(height / 2 - (p.screen.scale * p.camera.y * width) / 2);
  p.screen.w = Math.round((p.screen.scale * ROAD_WIDTH * width) / 2);
}

/* ============================================================
   PÁLYAÉPÍTÉS
   ============================================================ */
function buildTrack(route) {
  const rnd = mulberry32(route.seed);
  const town = route.town;
  const segments = [];
  const stops = [];

  const lastY = () => (segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y);

  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({
      index: n,
      p1: { world: { y: lastY(), z: n * SEGMENT_LENGTH }, camera: {}, screen: {} },
      p2: { world: { y: y, z: (n + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
      curve,
      sprites: [],
      cars: [],
      stopZone: null,
      crossing: false,
      clip: 0,
      color: Math.floor(n / RUMBLE_LENGTH) % 2 ? COLORS.dark : COLORS.light,
    });
  }

  function addRoad(enter, hold, leave, curve, height) {
    const startY = lastY();
    const endY = startY + height;
    const total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++)
      addSegment(easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
  }

  // díszlet a szakasz mentén
  const building = (side, dist) => {
    const r = rnd();
    const type = r < 0.42 ? 'house' : r < 0.72 ? 'block' : 'shop';
    return {
      type,
      offset: side * dist,
      shade: rnd(),
      scale: 0.85 + rnd() * 0.5,
      floors: 3 + Math.floor(rnd() * 5),
    };
  };

  function decorate(from, to) {
    for (let n = from; n < to; n++) {
      if (n % 3 !== 0) continue;
      const r = rnd();
      if (r < 0.4) segments[n].sprites.push({ type: rnd() < 0.7 ? 'tree' : 'bush', offset: -(1.35 + rnd() * 1.9) });
      if (r > 0.65) segments[n].sprites.push({ type: rnd() < 0.7 ? 'tree' : 'bush', offset: 1.35 + rnd() * 1.9 });
      if (n % 27 === 0) segments[n].sprites.push({ type: 'lamp', offset: -1.16 });
      // épületek: két sorban, a járat "beépítettsége" szerint
      if (n % Math.round(21 / town) === 0) segments[n].sprites.push(building(1, 2.7 + rnd() * 0.9));
      if (n % Math.round(26 / town) === 0) segments[n].sprites.push(building(-1, 2.7 + rnd() * 0.9));
      if (n % Math.round(47 / town) === 0) segments[n].sprites.push(building(rnd() < 0.5 ? 1 : -1, 4.4 + rnd() * 1.6));
    }
  }

  addRoad(20, 60, 20, 0, 0); // rajtszakasz

  route.stops.forEach((name, i) => {
    const from = segments.length;

    // változatos szakasz a megállók között (járatonként eltérő jelleggel)
    const kind = Math.floor(rnd() * 4);
    const dir = rnd() < 0.5 ? -1 : 1;
    const cv = route.curve;
    const hl = route.hill;
    if (kind === 0) addRoad(60, 200, 60, 0, 0);
    else if (kind === 1) addRoad(70, 160, 70, dir * (2 + rnd() * 3) * cv, 0);
    else if (kind === 2) addRoad(70, 160, 70, 0, dir * (900 + rnd() * 1200) * hl);
    else addRoad(70, 150, 70, dir * (2 + rnd() * 2.5) * cv, dir * (600 + rnd() * 900) * hl);

    // ráfutó egyenes + sík megállósáv
    addRoad(50, 90, 50, 0, 0);

    const center = segments.length - 60;
    const stop = {
      name,
      index: center,
      center: center * SEGMENT_LENGTH,
      zStart: (center - STOP_ZONE_SEGMENTS) * SEGMENT_LENGTH,
      zEnd: (center + STOP_ZONE_SEGMENTS) * SEGMENT_LENGTH,
      waiting: 1 + Math.floor(rnd() * 6), // ennyien várnak a megállóban
      done: false,
      missed: false,
      quality: null,
      last: i === route.stops.length - 1,
    };
    stops.push(stop);

    for (let n = center - STOP_ZONE_SEGMENTS; n <= center + STOP_ZONE_SEGMENTS; n++) {
      if (segments[n]) segments[n].stopZone = stop;
    }
    // zebra a megálló előtt
    for (let n = center - STOP_ZONE_SEGMENTS - 8; n < center - STOP_ZONE_SEGMENTS - 3; n++) {
      if (segments[n]) segments[n].crossing = true;
    }
    segments[center].sprites.push({ type: 'sign', offset: 1.18, stop });
    if (segments[center + 5]) segments[center + 5].sprites.push({ type: 'shelter', offset: 1.75, stop });

    decorate(from, center - STOP_ZONE_SEGMENTS - 10);
  });

  addRoad(40, 120, 40, 0, 0); // kifutó

  /* --- felülnézeti útvonal a térképhez --- */
  const path = [];
  let heading = 0;
  let mx = 0;
  let my = 0;
  segments.forEach((seg, n) => {
    heading += seg.curve * 0.0022;
    mx += Math.sin(heading);
    my += Math.cos(heading);
    seg.mapX = mx;
    seg.mapY = my;
    if (n % 8 === 0) path.push({ x: mx, y: my, z: n * SEGMENT_LENGTH });
  });
  const xs = path.map((p) => p.x);
  const ys = path.map((p) => p.y);
  const bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };

  return { segments, stops, path, bounds, trackLength: segments.length * SEGMENT_LENGTH };
}

/* --- forgalom --- */
function buildTraffic(trackLength) {
  const rnd = mulberry32(4242);
  const cars = [];
  for (let i = 0; i < TRAFFIC_COUNT; i++) {
    const oncoming = rnd() < 0.42;
    const type = rnd() < 0.18 ? 'truck' : rnd() < 0.12 ? 'citybus' : 'car';
    const lane = oncoming ? -0.6 + rnd() * 0.16 : 0.42 + rnd() * 0.18;
    cars.push({
      z: rnd() * trackLength,
      oncoming,
      type,
      color: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)],
      lane,
      offset: lane,
      hitCooldown: 0,
      speed: (oncoming ? -1 : 1) * (type === 'car' ? 45 + rnd() * 28 : 38 + rnd() * 16) * UNITS_PER_KMH,
    });
  }
  return cars;
}

/* ============================================================
   RAJZOLÁS – ÚT
   ============================================================ */
function polygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

function renderSegment(ctx, W, x1, y1, w1, x2, y2, w2, fog, color, seg) {
  const r1 = w1 / 7;
  const r2 = w2 / 7;
  const l1 = w1 / 44;
  const l2 = w2 / 44;

  ctx.fillStyle = color.grass;
  ctx.fillRect(0, y2, W, y1 - y2);

  // padka
  polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
  polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
  // aszfalt
  polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

  // megállóöböl
  if (seg.stopZone && !seg.stopZone.done) {
    polygon(ctx, x1 + w1 * 0.35, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 * 0.35, y2, 'rgba(251,191,36,0.16)');
  } else if (seg.stopZone) {
    polygon(ctx, x1 + w1 * 0.35, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 * 0.35, y2, 'rgba(34,197,94,0.12)');
  }

  // zebra
  if (seg.crossing) {
    for (let i = -3; i <= 3; i++) {
      const c1 = x1 + (w1 * i) / 4;
      const c2 = x2 + (w2 * i) / 4;
      polygon(ctx, c1 - w1 * 0.05, y1, c1 + w1 * 0.05, y1, c2 + w2 * 0.05, y2, c2 - w2 * 0.05, y2, '#e2e8f0');
    }
  }

  // szélső fehér csíkok
  polygon(ctx, x1 - w1 + l1, y1, x1 - w1 + l1 * 4, y1, x2 - w2 + l2 * 4, y2, x2 - w2 + l2, y2, 'rgba(226,232,240,0.75)');
  polygon(ctx, x1 + w1 - l1 * 4, y1, x1 + w1 - l1, y1, x2 + w2 - l2, y2, x2 + w2 - l2 * 4, y2, 'rgba(226,232,240,0.75)');

  // szaggatott felezővonal
  if (color.lane) {
    let lanew1 = (w1 * 2) / LANES;
    let lanew2 = (w2 * 2) / LANES;
    let lanex1 = x1 - w1 + lanew1;
    let lanex2 = x2 - w2 + lanew2;
    for (let lane = 1; lane < LANES; lanex1 += lanew1, lanex2 += lanew2, lane++) {
      polygon(ctx, lanex1 - l1 * 1.6, y1, lanex1 + l1 * 1.6, y1, lanex2 + l2 * 1.6, y2, lanex2 - l2 * 1.6, y2, color.lane);
    }
  }

  if (fog < 1) {
    ctx.globalAlpha = 1 - fog;
    ctx.fillStyle = COLORS.fog;
    ctx.fillRect(0, y2, W, y1 - y2);
    ctx.globalAlpha = 1;
  }
}

/* ============================================================
   RAJZOLÁS – TÉRBELI OBJEKTUMOK
   ============================================================ */

// Egy világpont vetítése: z mentén interpolálunk a szeletek között,
// ox = oldalirányú eltolás (világ egység), h = magasság az út felett.
const NEAR_CLIP = 700;   // ennél közelebbi pontot nem vetítünk (különben óriási poligonok)
const OBJ_NEAR = 2100;   // ennél közelebbi tárgyat egészben kihagyunk (már a kabin mellett van)
const ONCOMING_NEAR = 6000; // a szembejövőket előbb vágjuk, különben elmossák a fél képet
function pt(s, base, z, ox, h, W) {
  if (z - s.position < NEAR_CLIP) return null;
  const idx = Math.floor(z / SEGMENT_LENGTH);
  if (idx < base || idx >= base + DRAW_DISTANCE) return null;
  const seg = s.segments[idx];
  if (!seg || !seg.p1.screen.scale) return null;
  const p = (z - seg.p1.world.z) / SEGMENT_LENGTH;
  const scale = interpolate(seg.p1.screen.scale, seg.p2.screen.scale, p);
  return {
    x: interpolate(seg.p1.screen.x, seg.p2.screen.x, p) + (scale * ox * W) / 2,
    y: interpolate(seg.p1.screen.y, seg.p2.screen.y, p) - (scale * h * W) / 2,
    scale,
  };
}

const COORD_LIMIT = 40000; // biztonsági határ: extrém nagy poligont nem rajzolunk
function quad(ctx, a, b, c, d, color) {
  if (!a || !b || !c || !d) return;
  if (
    Math.abs(a.x) > COORD_LIMIT ||
    Math.abs(b.x) > COORD_LIMIT ||
    Math.abs(a.y) > COORD_LIMIT ||
    Math.abs(c.y) > COORD_LIMIT
  )
    return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
}

// Térbeli doboz: a kamerához közeli lap, a látható oldallap és (ha alacsonyabb
// a szemmagasságnál) a tetőlap. Visszaadja a közeli lap sarkait.
function box(ctx, s, base, W, camX, zN, zF, cx, halfW, yB, yT, color, opts = {}) {
  const nlb = pt(s, base, zN, cx - halfW, yB, W);
  const nrb = pt(s, base, zN, cx + halfW, yB, W);
  const nlt = pt(s, base, zN, cx - halfW, yT, W);
  const nrt = pt(s, base, zN, cx + halfW, yT, W);
  if (!nlb || !nrb || !nlt || !nrt) return null;

  const flb = pt(s, base, zF, cx - halfW, yB, W);
  const frb = pt(s, base, zF, cx + halfW, yB, W);
  const flt = pt(s, base, zF, cx - halfW, yT, W);
  const frt = pt(s, base, zF, cx + halfW, yT, W);

  // oldallap: azt látjuk, amelyik a kamera felé néz
  if (flb && frb && flt && frt) {
    if (cx > camX) quad(ctx, nlb, flb, flt, nlt, shade(color, opts.sideShade || 0.68));
    else quad(ctx, nrb, frb, frt, nrt, shade(color, opts.sideShade || 0.68));
    // tetőlap csak akkor látszik, ha a tető a szemmagasság alatt van
    if (yT < CAMERA_HEIGHT * 0.97) quad(ctx, nlt, nrt, frt, flt, shade(color, opts.topShade || 1.22));
  }

  quad(ctx, nlb, nrb, nrt, nlt, shade(color, opts.frontShade || 1));
  return { nlb, nrb, nlt, nrt };
}

function ellipse(ctx, cx, cy, rx, ry, color) {
  if (!(rx > 0.3) || rx > COORD_LIMIT || Math.abs(cx) > COORD_LIMIT || Math.abs(cy) > COORD_LIMIT) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// A köd nem külön téglalappal készül (az kirajzolta a tárgyak körvonalát),
// hanem magukat a színeket keverjük a köd színéhez a távolság szerint.
const FOG_RGB = [125, 154, 181]; // COLORS.fog
const fogCache = new Map();
function fogMix(hex, fog) {
  if (fog >= 0.995) return hex;
  const q = Math.round(fog * 50) / 50;
  const key = hex + '|' + q;
  let v = fogCache.get(key);
  if (v) return v;
  const n = parseInt(hex.slice(1), 16);
  const t = 1 - q;
  const r = Math.round(((n >> 16) & 255) * q + FOG_RGB[0] * t);
  const g = Math.round(((n >> 8) & 255) * q + FOG_RGB[1] * t);
  const b = Math.round((n & 255) * q + FOG_RGB[2] * t);
  v = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  fogCache.set(key, v);
  return v;
}

/* --- díszletelemek --- */
function drawScenery(ctx, s, base, W, camX, seg, sp, fog) {
  const z = seg.p1.world.z;
  const cx = sp.offset * ROAD_WIDTH;
  const o = OBJ[sp.type];
  if (z - s.position < OBJ_NEAR) return;
  const near = pt(s, base, z, cx, 0, W);
  if (!near) return;
  const px = near.scale * W;       // méretarány a részletességhez
  const sc = sp.scale || 1;        // példányonkénti méretszorzó
  const F = (c) => fogMix(c, fog); // a köd a színben van, nem külön téglalapban

  switch (sp.type) {
    case 'tree': {
      ellipse(ctx, near.x, near.y, near.scale * o.crownR * W * 0.5, near.scale * o.crownR * W * 0.16, 'rgba(2,6,23,' + 0.3 * fog + ')');
      box(ctx, s, base, W, camX, z, z + o.depth, cx, o.halfW, 0, o.h * sc, F('#4a3524'));
      const c = pt(s, base, z + o.depth / 2, cx, o.crownY * sc, W);
      if (c) {
        const r = c.scale * o.crownR * sc * W * 0.5;
        ellipse(ctx, c.x, c.y + r * 0.25, r * 0.95, r * 0.9, F('#1b4531'));
        ellipse(ctx, c.x - r * 0.12, c.y - r * 0.05, r * 0.82, r * 0.8, F('#256b45'));
        ellipse(ctx, c.x - r * 0.3, c.y - r * 0.3, r * 0.45, r * 0.42, F('#3d8a5c'));
      }
      break;
    }
    case 'bush': {
      const c = pt(s, base, z, cx, o.crownY, W);
      if (c) {
        const r = c.scale * o.crownR * W * 0.5;
        ellipse(ctx, c.x, c.y + r * 0.2, r, r * 0.8, F('#1f5a3c'));
        ellipse(ctx, c.x - r * 0.2, c.y - r * 0.1, r * 0.6, r * 0.5, F('#2f7a52'));
      }
      break;
    }
    case 'lamp': {
      const dir = cx < 0 ? 1 : -1; // az út felé nyúló kar
      box(ctx, s, base, W, camX, z, z + o.depth, cx, o.halfW, 0, o.h, F('#94a3b8'), { sideShade: 0.7 });
      if (px > 0.06) {
        box(ctx, s, base, W, camX, z, z + o.depth, cx + dir * 430, 500, o.h - 130, o.h, F('#94a3b8'), { topShade: 1.1 });
        box(ctx, s, base, W, camX, z - 40, z + o.depth + 40, cx + dir * 900, 260, o.h - 260, o.h - 120, F('#e2e8f0'), {
          topShade: 1.05,
        });
      }
      break;
    }
    case 'house': {
      const hw = o.halfW * sc;
      const dp = o.depth * sc;
      const ht = o.h * sc;
      const rf = o.roof * sc;
      const wall = sp.shade > 0.5 ? '#8a8177' : '#9a8f83';
      box(ctx, s, base, W, camX, z, z + dp, cx, hw, 0, ht, F(wall), { sideShade: 0.68 });
      const ridgeN = pt(s, base, z, cx, ht + rf, W);
      const ridgeF = pt(s, base, z + dp, cx, ht + rf, W);
      const eaveNL = pt(s, base, z, cx - hw * 1.12, ht, W);
      const eaveNR = pt(s, base, z, cx + hw * 1.12, ht, W);
      const eaveFL = pt(s, base, z + dp, cx - hw * 1.12, ht, W);
      const eaveFR = pt(s, base, z + dp, cx + hw * 1.12, ht, W);
      if (ridgeN && ridgeF && eaveNL && eaveNR && eaveFL && eaveFR) {
        quad(ctx, eaveNL, eaveFL, ridgeF, ridgeN, F('#7f2b23'));
        quad(ctx, eaveNR, eaveFR, ridgeF, ridgeN, shade(F('#7f2b23'), 1.3));
        ctx.fillStyle = shade(F(wall), 1.05);
        ctx.beginPath();
        ctx.moveTo(eaveNL.x, eaveNL.y);
        ctx.lineTo(eaveNR.x, eaveNR.y);
        ctx.lineTo(ridgeN.x, ridgeN.y);
        ctx.closePath();
        ctx.fill();
      }
      if (px > 0.05) {
        for (let i = -1; i <= 1; i += 2) {
          const wl = pt(s, base, z, cx + i * hw * 0.45 - 300, ht * 0.45, W);
          const wr = pt(s, base, z, cx + i * hw * 0.45 + 300, ht * 0.45, W);
          const tl = pt(s, base, z, cx + i * hw * 0.45 - 300, ht * 0.78, W);
          const tr = pt(s, base, z, cx + i * hw * 0.45 + 300, ht * 0.78, W);
          quad(ctx, wl, wr, tr, tl, F('#f6cf7a'));
        }
        const dl = pt(s, base, z, cx - 260, 0, W);
        const dr = pt(s, base, z, cx + 260, 0, W);
        const dtl = pt(s, base, z, cx - 260, ht * 0.62, W);
        const dtr = pt(s, base, z, cx + 260, ht * 0.62, W);
        quad(ctx, dl, dr, dtr, dtl, F('#4a3a2e'));
      }
      break;
    }
    case 'block': {
      // panelház: több emelet, ablakráccsal
      const hw = o.halfW * sc;
      const dp = o.depth * sc;
      const floors = sp.floors || 5;
      const ht = Math.min(o.h * sc, 1300 * floors);
      const wall = sp.shade > 0.5 ? '#8e9196' : '#a3a099';
      box(ctx, s, base, W, camX, z, z + dp, cx, hw, 0, ht, F(wall), { sideShade: 0.66, topShade: 1.1 });
      if (px > 0.04) {
        const cols = 4;
        for (let f = 0; f < floors; f++) {
          const y0 = 320 + (f * ht) / floors;
          const y1 = y0 + (ht / floors) * 0.52;
          if (y1 > ht) break;
          for (let c = 0; c < cols; c++) {
            const x0 = cx - hw * 0.8 + (c * hw * 1.6) / cols;
            const x1 = x0 + (hw * 1.6) / cols - hw * 0.12;
            const lit = (f * 7 + c * 3 + Math.round(sp.shade * 10)) % 5 < 2;
            quad(
              ctx,
              pt(s, base, z, x0, y0, W),
              pt(s, base, z, x1, y0, W),
              pt(s, base, z, x1, y1, W),
              pt(s, base, z, x0, y1, W),
              F(lit ? '#f6cf7a' : '#37414f')
            );
          }
        }
      }
      break;
    }
    case 'shop': {
      const hw = o.halfW * sc;
      const dp = o.depth * sc;
      const ht = o.h * sc;
      box(ctx, s, base, W, camX, z, z + dp, cx, hw, 0, ht, F('#b0a99e'), { sideShade: 0.7, topShade: 1.12 });
      box(ctx, s, base, W, camX, z - 60, z + dp + 60, cx, hw * 1.04, ht, ht + 160, F('#6b7280'), { topShade: 1.25 });
      if (px > 0.05) {
        quad(
          ctx,
          pt(s, base, z, cx - hw * 0.75, ht * 0.62, W),
          pt(s, base, z, cx + hw * 0.75, ht * 0.62, W),
          pt(s, base, z, cx + hw * 0.75, ht * 0.85, W),
          pt(s, base, z, cx - hw * 0.75, ht * 0.85, W),
          F(sp.shade > 0.5 ? '#c2410c' : '#1d4ed8')
        );
        quad(
          ctx,
          pt(s, base, z, cx - hw * 0.8, ht * 0.1, W),
          pt(s, base, z, cx + hw * 0.8, ht * 0.1, W),
          pt(s, base, z, cx + hw * 0.8, ht * 0.5, W),
          pt(s, base, z, cx - hw * 0.8, ht * 0.5, W),
          F('#dfe6ef')
        );
      }
      break;
    }
    case 'sign': {
      const done = sp.stop && sp.stop.done;
      box(ctx, s, base, W, camX, z, z + o.depth, cx, o.halfW, 0, o.h, F('#94a3b8'));
      box(
        ctx, s, base, W, camX,
        z - 30, z + o.depth + 30,
        cx, o.panelW, o.h, o.h + o.panelH,
        F(done ? '#22c55e' : '#fbbf24'),
        { topShade: 1.15, sideShade: 0.75 }
      );
      if (px > 0.05) {
        const y0 = o.h + o.panelH * 0.28;
        const y1 = o.h + o.panelH * 0.72;
        quad(
          ctx,
          pt(s, base, z - 35, cx - o.panelW * 0.6, y0, W),
          pt(s, base, z - 35, cx + o.panelW * 0.6, y0, W),
          pt(s, base, z - 35, cx + o.panelW * 0.6, y1, W),
          pt(s, base, z - 35, cx - o.panelW * 0.6, y1, W),
          F('#0f172a')
        );
      }
      break;
    }
    case 'shelter': {
      const stop = sp.stop;
      box(ctx, s, base, W, camX, z, z + o.depth, cx + o.halfW * 0.86, o.halfW * 0.14, 0, o.h, F('#475569'));
      box(ctx, s, base, W, camX, z, z + o.depth, cx - o.halfW * 0.86, o.halfW * 0.14, 0, o.h, F('#475569'));
      ctx.globalAlpha = 0.42;
      box(ctx, s, base, W, camX, z + o.depth * 0.82, z + o.depth, cx, o.halfW * 0.9, 0, o.h, F('#cbd5e1'), {
        sideShade: 0.9,
      });
      ctx.globalAlpha = 1;
      box(ctx, s, base, W, camX, z + o.depth * 0.55, z + o.depth * 0.8, cx, o.halfW * 0.8, 380, 520, F('#57534e'));
      box(ctx, s, base, W, camX, z - 120, z + o.depth + 120, cx, o.halfW * 1.06, o.h, o.h + 130, F('#334155'), {
        topShade: 1.3,
      });
      if (stop && !stop.done && stop.waiting > 0 && px > 0.05) {
        for (let i = 0; i < Math.min(stop.waiting, 5); i++) {
          const px2 = cx - o.halfW * 0.55 + i * (o.halfW * 0.28);
          const pz = z + o.depth * (0.3 + (i % 2) * 0.25);
          const col = ['#e2e8f0', '#fca5a5', '#93c5fd', '#fcd34d', '#c4b5fd'][i % 5];
          box(ctx, s, base, W, camX, pz, pz + 220, px2, 130, 0, 950, F(col), { sideShade: 0.75 });
          const head = pt(s, base, pz + 110, px2, 1120, W);
          if (head) ellipse(ctx, head.x, head.y, head.scale * 150 * W * 0.5, head.scale * 150 * W * 0.5, F('#d6b48c'));
        }
      }
      break;
    }
    default:
      break;
  }
}

/* --- járművek --- */
function drawVehicle(ctx, s, base, W, camX, car, fog) {
  const v = VEHICLE[car.type];
  const cx = car.offset * ROAD_WIDTH;
  const zN = car.z;
  const zF = car.z + v.depth;
  if (zN - s.position < (car.oncoming ? ONCOMING_NEAR : OBJ_NEAR)) return;
  const near = pt(s, base, zN, cx, 0, W);
  if (!near) return;
  const px = near.scale * W;
  const F = (c) => fogMix(c, fog);
  const color = F(car.type === 'citybus' ? '#fbbf24' : car.color);
  const glass = F('#101a2b');
  const rear = !car.oncoming; // az azonos irányúaknál a hátulját látjuk

  ellipse(
    ctx,
    near.x,
    near.y,
    near.scale * v.halfW * W * 1.1,
    near.scale * v.halfW * W * 0.22,
    'rgba(2,6,23,' + 0.3 * fog + ')'
  );

  if (px > 0.05) {
    box(ctx, s, base, W, camX, zN + v.depth * 0.12, zN + v.depth * 0.3, cx, v.halfW * 1.02, 0, v.floor + 120, F('#1a2230'));
    box(ctx, s, base, W, camX, zN + v.depth * 0.7, zN + v.depth * 0.88, cx, v.halfW * 1.02, 0, v.floor + 120, F('#1a2230'));
  }

  const body = box(ctx, s, base, W, camX, zN, zF, cx, v.halfW, v.floor, v.floor + v.body, color, {
    sideShade: 0.66,
    topShade: 1.2,
  });
  if (!body) return;

  if (car.type === 'car') {
    box(
      ctx, s, base, W, camX,
      zN + v.depth * 0.22, zN + v.depth * 0.74,
      cx, v.halfW * 0.88, v.floor + v.body, v.cabTop,
      shade(color, 0.92),
      { sideShade: 0.62, topShade: 1.25 }
    );
    if (px > 0.06) {
      const zw = zN + v.depth * 0.24;
      quad(
        ctx,
        pt(s, base, zw, cx - v.halfW * 0.72, v.floor + v.body + 60, W),
        pt(s, base, zw, cx + v.halfW * 0.72, v.floor + v.body + 60, W),
        pt(s, base, zw, cx + v.halfW * 0.72, v.cabTop - 60, W),
        pt(s, base, zw, cx - v.halfW * 0.72, v.cabTop - 60, W),
        glass
      );
      const sx = cx + (cx > camX ? -v.halfW * 0.9 : v.halfW * 0.9);
      quad(
        ctx,
        pt(s, base, zN + v.depth * 0.3, sx, v.floor + v.body + 60, W),
        pt(s, base, zN + v.depth * 0.66, sx, v.floor + v.body + 60, W),
        pt(s, base, zN + v.depth * 0.66, sx, v.cabTop - 80, W),
        pt(s, base, zN + v.depth * 0.3, sx, v.cabTop - 80, W),
        shade(glass, 0.8)
      );
    }
  } else if (px > 0.05) {
    quad(
      ctx,
      pt(s, base, zN - 20, cx - v.halfW * 0.85, v.floor + v.body * 0.55, W),
      pt(s, base, zN - 20, cx + v.halfW * 0.85, v.floor + v.body * 0.55, W),
      pt(s, base, zN - 20, cx + v.halfW * 0.85, v.floor + v.body * 0.88, W),
      pt(s, base, zN - 20, cx - v.halfW * 0.85, v.floor + v.body * 0.88, W),
      glass
    );
    const sx = cx + (cx > camX ? -v.halfW * 1.01 : v.halfW * 1.01);
    quad(
      ctx,
      pt(s, base, zN + v.depth * 0.1, sx, v.floor + v.body * 0.55, W),
      pt(s, base, zN + v.depth * 0.92, sx, v.floor + v.body * 0.55, W),
      pt(s, base, zN + v.depth * 0.92, sx, v.floor + v.body * 0.86, W),
      pt(s, base, zN + v.depth * 0.1, sx, v.floor + v.body * 0.86, W),
      shade(glass, 0.8)
    );
  }

  if (px > 0.05) {
    const ly = v.floor + v.body * 0.3;
    const lh = v.floor + v.body * 0.52;
    const col = F(rear ? '#ef4444' : '#fef3c7');
    [-1, 1].forEach((sgn) => {
      quad(
        ctx,
        pt(s, base, zN - 25, cx + sgn * v.halfW * 0.55, ly, W),
        pt(s, base, zN - 25, cx + sgn * v.halfW * 0.92, ly, W),
        pt(s, base, zN - 25, cx + sgn * v.halfW * 0.92, lh, W),
        pt(s, base, zN - 25, cx + sgn * v.halfW * 0.55, lh, W),
        col
      );
    });
  }
}

/* ============================================================
   RAJZOLÁS – ÉG, TÉRKÉP, BELSŐ TÉR
   ============================================================ */
function drawSky(ctx, W, H, skyOffset) {
  const horizon = H * 0.5;
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(0.55, COLORS.skyMid);
  g.addColorStop(1, COLORS.skyHorizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, horizon + 2);

  const sunX = W * 0.72 - skyOffset * 0.35;
  const sunY = horizon - H * 0.22;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.13);
  glow.addColorStop(0, 'rgba(255,217,160,0.35)');
  glow.addColorStop(1, 'rgba(255,217,160,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, H * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, H * 0.032, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(226,232,240,0.16)';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 0.27 * W - skyOffset * 0.6) % (W * 1.4)) - W * 0.2;
    const cy = H * (0.08 + (i % 3) * 0.07);
    ctx.beginPath();
    ctx.ellipse(cx, cy, W * 0.11, H * 0.022, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + W * 0.05, cy - H * 0.012, W * 0.07, H * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const drawHills = (color, amp, freq, base, off) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, horizon + 2);
    for (let x = 0; x <= W; x += W / 40) {
      const y = horizon - base - Math.sin((x + off) * freq) * amp - Math.sin((x + off) * freq * 2.3) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, horizon + 2);
    ctx.closePath();
    ctx.fill();
  };
  drawHills(COLORS.hillFar, H * 0.045, 0.006, H * 0.02, -skyOffset * 0.5);
  drawHills(COLORS.hillNear, H * 0.03, 0.011, 0, -skyOffset * 0.8);

  ctx.fillStyle = COLORS.light.grass;
  ctx.fillRect(0, horizon, W, H - horizon);
}

function drawMiniMap(ctx, W, H, s) {
  const b = s.bounds;
  const spanX = Math.max(1e-6, b.maxX - b.minX);
  const spanY = Math.max(1e-6, b.maxY - b.minY);

  const pad = W * 0.012;
  const boxW = W * 0.26;
  const headH = H * 0.05;
  const footH = H * 0.045;
  const innerW = boxW * 0.86;
  const innerH = clamp((innerW * spanY) / spanX, H * 0.1, H * 0.3);
  const boxH = headH + innerH + footH;
  const x0 = pad;
  const y0 = pad;

  ctx.save();
  ctx.fillStyle = 'rgba(2,6,23,0.72)';
  ctx.strokeStyle = 'rgba(251,191,36,0.5)';
  ctx.lineWidth = Math.max(1, W * 0.0015);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x0, y0, boxW, boxH, W * 0.008);
  else ctx.rect(x0, y0, boxW, boxH);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = `bold ${Math.round(H * 0.026)}px monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText('ÚTVONAL', x0 + boxW * 0.07, y0 + headH * 0.28);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${s.served}/${s.stops.length}`, x0 + boxW * 0.74, y0 + headH * 0.28);

  const inner = { x: x0 + (boxW - innerW) / 2, y: y0 + headH, w: innerW, h: innerH };
  const scale = Math.min(inner.w / spanX, inner.h / spanY);
  const offX = inner.x + (inner.w - spanX * scale) / 2;
  const offY = inner.y + (inner.h - spanY * scale) / 2;
  const mapX = (p) => offX + (p.x - b.minX) * scale;
  const mapY = (p) => offY + (b.maxY - p.y) * scale;

  ctx.strokeStyle = 'rgba(148,163,184,0.55)';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  s.path.forEach((p, i) => (i === 0 ? ctx.moveTo(mapX(p), mapY(p)) : ctx.lineTo(mapX(p), mapY(p))));
  ctx.stroke();

  ctx.strokeStyle = '#fbbf24';
  ctx.beginPath();
  let started = false;
  for (const p of s.path) {
    if (p.z > s.position) break;
    if (!started) {
      ctx.moveTo(mapX(p), mapY(p));
      started = true;
    } else ctx.lineTo(mapX(p), mapY(p));
  }
  if (started) ctx.stroke();

  s.stops.forEach((stop, i) => {
    const seg = s.segments[stop.index];
    const px = mapX({ x: seg.mapX, y: seg.mapY });
    const py = mapY({ x: seg.mapX, y: seg.mapY });
    const isNext = i === s.nextStopIndex;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2.5, W * (isNext ? 0.0055 : 0.004)), 0, Math.PI * 2);
    ctx.fillStyle = stop.done ? '#22c55e' : stop.missed ? '#ef4444' : isNext ? '#fbbf24' : '#94a3b8';
    ctx.fill();
    if (isNext) {
      ctx.strokeStyle = 'rgba(251,191,36,0.7)';
      ctx.lineWidth = Math.max(1, W * 0.002);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(5, W * 0.011) * (1 + 0.25 * Math.sin(s.time * 4)), 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  const next = s.stops[s.nextStopIndex];
  ctx.font = `${Math.round(H * 0.024)}px monospace`;
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(next ? `► ${next.name}` : '► Vége', x0 + boxW * 0.07, y0 + headH + innerH + footH * 0.12);

  const seg = s.segments[clamp(Math.floor(s.position / SEGMENT_LENGTH), 0, s.segments.length - 2)];
  const nextSeg = s.segments[Math.min(seg.index + 4, s.segments.length - 1)];
  const bx = mapX({ x: seg.mapX, y: seg.mapY });
  const by = mapY({ x: seg.mapX, y: seg.mapY });
  const nx = mapX({ x: nextSeg.mapX, y: nextSeg.mapY });
  const ny = mapY({ x: nextSeg.mapX, y: nextSeg.mapY });
  const ang = Math.atan2(ny - by, nx - bx);
  const r = Math.max(4, W * 0.008);
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(ang);
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(-r * 0.8, r * 0.7);
  ctx.lineTo(-r * 0.8, -r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// repedések a szélvédőn a sérülések szerint
function drawCracks(ctx, W, H, damage) {
  if (damage <= 0) return;
  const seeds = [
    { x: 0.3, y: 0.3 },
    { x: 0.66, y: 0.24 },
    { x: 0.48, y: 0.42 },
  ];
  ctx.save();
  ctx.strokeStyle = 'rgba(226,232,240,0.55)';
  ctx.lineWidth = Math.max(1, W * 0.0015);
  for (let d = 0; d < Math.min(damage, seeds.length); d++) {
    const cx = W * seeds[d].x;
    const cy = H * seeds[d].y;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + d;
      const len = H * (0.05 + ((i * 37 + d * 11) % 10) / 90);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.lineTo(cx + Math.cos(a + 0.3) * len * 1.5, cy + Math.sin(a + 0.3) * len * 1.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A busz belseje: tető, A-oszlopok, műszerfal, kormány, órák
function drawInterior(ctx, W, H, s, kmh) {
  const roof = ctx.createLinearGradient(0, 0, 0, H * 0.1);
  roof.addColorStop(0, '#0b1018');
  roof.addColorStop(1, 'rgba(11,16,24,0)');
  ctx.fillStyle = roof;
  ctx.fillRect(0, 0, W, H * 0.1);
  ctx.fillStyle = '#0b1018';
  ctx.fillRect(0, 0, W, H * 0.045);

  const mx = W * 0.055;
  const my = H * 0.04;
  const mw = W * 0.14;
  const mh = H * 0.085;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(mx, my, mw, mh);
  const mg = ctx.createLinearGradient(mx, my, mx, my + mh);
  mg.addColorStop(0, 'rgba(148,163,184,0.30)');
  mg.addColorStop(0.5, 'rgba(71,85,105,0.18)');
  mg.addColorStop(1, 'rgba(15,23,42,0.5)');
  ctx.fillStyle = mg;
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = Math.max(1, W * 0.0025);
  ctx.strokeRect(mx, my, mw, mh);

  ctx.fillStyle = '#0b1018';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W * 0.075, 0);
  ctx.lineTo(W * 0.03, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W * 0.925, 0);
  ctx.lineTo(W * 0.97, H);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  const dashTop = H * 0.7;
  const dg = ctx.createLinearGradient(0, dashTop - H * 0.05, 0, H);
  dg.addColorStop(0, '#151b26');
  dg.addColorStop(0.25, '#0d121b');
  dg.addColorStop(1, '#070a10');
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, dashTop + H * 0.05);
  ctx.quadraticCurveTo(W * 0.5, dashTop - H * 0.05, W, dashTop + H * 0.05);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#263244';
  ctx.lineWidth = Math.max(1.5, H * 0.005);
  ctx.beginPath();
  ctx.moveTo(0, dashTop + H * 0.05);
  ctx.quadraticCurveTo(W * 0.5, dashTop - H * 0.05, W, dashTop + H * 0.05);
  ctx.stroke();

  // kormány
  const cx = W * 0.26;
  const cy = H * 1.08;
  const r = H * 0.36;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(s.steerAngle);
  ctx.strokeStyle = '#11161f';
  ctx.lineWidth = H * 0.055;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#28323f';
  ctx.lineWidth = H * 0.016;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.01, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.lineWidth = H * 0.038;
  ctx.strokeStyle = '#11161f';
  [Math.PI * 1.22, Math.PI * 1.78, Math.PI * 0.5].forEach((a) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  });
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // sebességmérő
  const gx = W * 0.8;
  const gy = H * 0.9;
  const gr = H * 0.14;
  ctx.fillStyle = '#05080e';
  ctx.beginPath();
  ctx.arc(gx, gy, gr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#263244';
  ctx.lineWidth = Math.max(1.5, H * 0.006);
  ctx.beginPath();
  ctx.arc(gx, gy, gr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = Math.max(1, H * 0.004);
  for (let i = 0; i <= 11; i++) {
    const a = Math.PI * 0.75 + (Math.PI * 1.5 * i) / 11;
    ctx.beginPath();
    ctx.moveTo(gx + Math.cos(a) * gr * 0.82, gy + Math.sin(a) * gr * 0.82);
    ctx.lineTo(gx + Math.cos(a) * gr * 0.93, gy + Math.sin(a) * gr * 0.93);
    ctx.stroke();
  }
  const over = kmh > SPEED_LIMIT_KMH;
  ctx.strokeStyle = over ? '#ef4444' : '#fbbf24';
  ctx.lineWidth = Math.max(2, H * 0.012);
  const a0 = Math.PI * 0.75;
  ctx.beginPath();
  ctx.arc(gx, gy, gr * 0.72, a0, a0 + Math.PI * 1.5 * clamp(kmh / 110, 0, 1));
  ctx.stroke();
  ctx.fillStyle = over ? '#fca5a5' : '#e2e8f0';
  ctx.font = `bold ${Math.round(H * 0.045)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.round(kmh)), gx, gy + gr * 0.15);
  ctx.font = `${Math.round(H * 0.022)}px monospace`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('km/h', gx, gy + gr * 0.5);

  // sérülésjelző lámpák
  for (let i = 0; i < MAX_DAMAGE; i++) {
    ctx.fillStyle = i < s.damage ? '#ef4444' : '#1e293b';
    ctx.beginPath();
    ctx.arc(W * 0.62 + i * W * 0.022, H * 0.79, H * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/* ============================================================
   KOMPONENS
   ============================================================ */
export default function BusSimulator() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(0);
  const keysRef = useRef({ gas: false, brake: false, left: false, right: false });
  const doorCmdRef = useRef(null); // 'open' | 'close'

  const [phase, setPhase] = useState('idle'); // idle | running | finished
  const [routeIdx, setRouteIdx] = useState(0);
  const [hud, setHud] = useState({
    kmh: 0,
    nextStop: ROUTES[0].stops[0],
    distance: 0,
    inZone: false,
    passengers: 0,
    served: 0,
    missed: 0,
    total: ROUTES[0].stops.length,
    score: 0,
    damage: 0,
    door: 'closed',
    canOpen: false,
    exchange: null,
    paxReady: false,
    message: null,
  });
  const [result, setResult] = useState(null);

  const createState = useCallback((idx) => {
    const route = ROUTES[idx];
    const track = buildTrack(route);
    return {
      ...track,
      route,
      cars: buildTraffic(track.trackLength),
      position: 0,
      speed: 0,
      playerX: 0.5, // jobb sávban indulunk
      steerAngle: 0,
      skyOffset: 0,
      nextStopIndex: 0,
      doorState: 'closed', // closed | opening | open | closing
      doorProgress: 0,
      exchange: null,
      passengers: 0,
      served: 0,
      missedCount: 0,
      score: 0,
      damage: 0,
      time: 0,
      bob: 0,
      crashCooldown: 0,
      crashFlash: 0,
      message: null,
      messageTimer: 0,
      messageTone: 'info',
      endTimer: 0,
      offRoad: false,
      wrecked: false,
      finished: false,
      rnd: mulberry32(777),
    };
  }, []);

  const flash = (s, text, tone = 'info', dur = 2.4) => {
    s.message = text;
    s.messageTone = tone;
    s.messageTimer = dur;
  };

  const findSegment = (s, z) => s.segments[clamp(Math.floor(z / SEGMENT_LENGTH), 0, s.segments.length - 1)];

  const crash = (s, text) => {
    s.crashCooldown = COLLISION_COOLDOWN;
    s.crashFlash = 0.6;
    s.damage += 1;
    s.score -= 35;
    flash(s, text, 'bad', 2.2);
    if (s.damage >= MAX_DAMAGE) {
      s.wrecked = true;
      s.finished = true;
    }
  };

  /* ---------- ajtóparancsok ---------- */
  const handleDoorCommand = (s, cmd) => {
    if (cmd === 'open') {
      if (s.doorState === 'open' || s.doorState === 'opening') return;
      if (s.speed > STOPPED_SPEED) {
        flash(s, 'AJTÓT CSAK ÁLLÓ HELYZETBEN!', 'bad', 1.6);
        return;
      }
      s.doorState = 'opening';
      return;
    }
    if (cmd === 'close') {
      if (s.doorState === 'closed' || s.doorState === 'closing') return;
      const ex = s.exchange;
      if (ex && !(ex.doneAlight >= ex.alight && ex.doneBoard >= ex.board)) {
        const left = ex.board - ex.doneBoard;
        ex.early = true;
        s.score -= 25;
        flash(s, `KORÁN ZÁRTÁL – ${Math.max(0, left)} UTAS KINT MARADT (-25)`, 'bad', 2.6);
      }
      s.doorState = 'closing';
    }
  };

  /* ---------- fizika / játéklogika ---------- */
  const update = useCallback((s, dt) => {
    const keys = keysRef.current;
    const seg = findSegment(s, s.position);
    const speedPercent = s.speed / MAX_SPEED;
    const dx = dt * 2 * speedPercent;
    const doorsShut = s.doorState === 'closed';

    if (doorCmdRef.current) {
      handleDoorCommand(s, doorCmdRef.current);
      doorCmdRef.current = null;
    }

    if (keys.left) s.playerX -= dx * STEER;
    if (keys.right) s.playerX += dx * STEER;
    s.playerX -= dx * speedPercent * seg.curve * CENTRIFUGAL;

    // hajtás – nyitott ajtóval nem indulhat el
    if (!doorsShut) {
      s.speed = 0;
    } else if (keys.gas && !keys.brake) {
      s.speed += ACCEL * dt;
    } else if (keys.brake) {
      s.speed += BRAKE * dt;
    } else {
      s.speed += DECEL * dt;
    }

    const offRoad = s.playerX < -1 || s.playerX > 1;
    if (offRoad && s.speed > OFF_ROAD_LIMIT) s.speed += OFF_ROAD_DECEL * dt;
    if (offRoad && s.speed > 100) {
      s.score -= 2.5 * dt;
      if (s.messageTimer <= 0) flash(s, 'LEHAJTOTTÁL AZ ÚTRÓL!', 'bad', 0.8);
    }

    s.speed = clamp(s.speed, 0, MAX_SPEED);
    s.playerX = clamp(s.playerX, -2.4, 2.4);
    s.position = clamp(s.position + s.speed * dt, 0, s.trackLength - SEGMENT_LENGTH);
    s.offRoad = offRoad;
    s.skyOffset += seg.curve * s.speed * dt * 0.004;

    const kmh = s.speed * KMH_PER_UNIT;
    if (kmh > SPEED_LIMIT_KMH) {
      s.score -= 3 * dt;
      if (s.messageTimer <= 0) flash(s, 'GYORSHAJTÁS! LASSÍTS!', 'bad', 0.8);
    }

    s.bob += dt * (2 + speedPercent * 22);
    const target = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 0.55 + clamp(seg.curve * 0.08, -0.4, 0.4);
    s.steerAngle += (target - s.steerAngle) * Math.min(1, dt * 8);

    if (s.crashCooldown > 0) s.crashCooldown -= dt;
    if (s.crashFlash > 0) s.crashFlash -= dt;

    /* --- forgalom + ütközés --- */
    for (const car of s.cars) {
      car.z += car.speed * dt;
      if (car.z < s.position - 6000 || car.z > s.position + 220000) {
        car.z = s.position + 45000 + s.rnd() * 150000;
        car.offset = car.lane;
      }

      // az azonos irányban haladók időben kikerülik a lassú/álló buszt
      let targetOffset = car.lane;
      if (!car.oncoming && Math.abs(car.z - s.position) < 16000 && Math.abs(car.lane - s.playerX) < 0.6) {
        targetOffset = clamp(s.playerX > 0.1 ? car.lane - 0.66 : car.lane + 0.66, -0.85, 0.85);
      }
      car.offset += (targetOffset - car.offset) * Math.min(1, dt * 2.6);

      if (car.hitCooldown > 0) car.hitCooldown -= dt;
      if (s.crashCooldown <= 0 && !(car.hitCooldown > 0)) {
        const v = VEHICLE[car.type];
        const zHit = car.z - BUS_LENGTH < s.position && car.z + v.depth + BUS_LENGTH > s.position;
        const xHit = Math.abs(car.offset - s.playerX) * ROAD_WIDTH < v.halfW + BUS_HALF;
        if (zHit && xHit) {
          car.hitCooldown = 3;
          const rel = Math.abs(s.speed - car.speed); // szembejövőnél összeadódik
          if (rel < 2200) {
            // csak egy koccanás, nem tesz kárt a buszban
            s.speed *= 0.55;
            s.score -= 10;
            s.crashCooldown = 0.8;
            s.crashFlash = 0.3;
            flash(s, 'KOCCANTOTTÁL! (-10)', 'bad', 1.6);
          } else {
            s.speed = s.speed * 0.12;
            crash(s, car.oncoming ? 'FRONTÁLIS ÜTKÖZÉS! (-35)' : 'RÁFUTÁSOS ÜTKÖZÉS! (-35)');
          }
        }
      }
    }

    /* --- ütközés az út menti tárgyakkal --- */
    if (s.crashCooldown <= 0 && s.speed > 1200) {
      const from = Math.max(0, seg.index - 2);
      const to = Math.min(s.segments.length - 1, seg.index + 3);
      for (let i = from; i <= to && s.crashCooldown <= 0; i++) {
        for (const sp of s.segments[i].sprites) {
          const o = OBJ[sp.type];
          if (!o || !o.hit) continue;
          const objZ = s.segments[i].p1.world.z;
          if (!(objZ - BUS_LENGTH < s.position && objZ + o.depth + BUS_LENGTH > s.position)) continue;
          if (Math.abs(sp.offset * ROAD_WIDTH - s.playerX * ROAD_WIDTH) < o.hit * (sp.scale || 1) + BUS_HALF) {
            const names = {
              tree: 'FÁNAK MENTÉL!',
              lamp: 'LÁMPAOSZLOPNAK MENTÉL!',
              house: 'HÁZNAK MENTÉL!',
              block: 'PANELHÁZNAK MENTÉL!',
              shop: 'ÜZLETNEK MENTÉL!',
              sign: 'LEDÖNTÖTTED A MEGÁLLÓTÁBLÁT!',
              shelter: 'BELEHAJTOTTÁL A MEGÁLLÓBA!',
            };
            s.speed = 0;
            // toljuk vissza az út felé, hogy ne ragadjunk bele
            s.playerX += sp.offset > s.playerX ? -0.12 : 0.12;
            crash(s, (names[sp.type] || 'ÜTKÖZÉS!') + ' (-35)');
            break;
          }
        }
      }
    }

    /* --- ajtó animáció --- */
    if (s.doorState === 'opening') {
      s.doorProgress = Math.min(1, s.doorProgress + dt / DOOR_TIME);
      if (s.doorProgress >= 1) {
        s.doorState = 'open';
        const stop = s.stops[s.nextStopIndex];
        const inZone = stop && s.position >= stop.zStart && s.position <= stop.zEnd;
        const pulledOver = s.playerX > 0.55 && s.playerX < 1.08;
        if (inZone && pulledOver && !s.exchange) {
          const alight = Math.min(s.passengers, Math.floor(s.rnd() * 4));
          s.exchange = {
            stop,
            alight,
            board: stop.waiting,
            doneAlight: 0,
            doneBoard: 0,
            timer: 0,
            early: false,
            pos: s.position,
          };
          flash(s, `${stop.name.toUpperCase()} – UTASCSERE`, 'good', 1.6);
        } else if (inZone && !pulledOver) {
          flash(s, 'ÁLLJ A JÁRDA MELLÉ (JOBBRA)!', 'bad', 2.0);
        }
      }
    } else if (s.doorState === 'closing') {
      s.doorProgress = Math.max(0, s.doorProgress - dt / DOOR_TIME);
      if (s.doorProgress <= 0) {
        s.doorState = 'closed';
        const ex = s.exchange;
        if (ex) {
          const stop = ex.stop;
          const diff = Math.abs(ex.pos - stop.center);
          const precise = diff < STOP_ZONE_SEGMENTS * SEGMENT_LENGTH * 0.5;
          stop.done = true;
          stop.waiting = Math.max(0, ex.board - ex.doneBoard);
          stop.quality = ex.early ? 'early' : precise ? 'perfect' : 'ok';
          s.score += precise ? 100 : 65;
          s.served += 1;
          s.nextStopIndex += 1;
          s.exchange = null;
          flash(
            s,
            precise ? `PONTOS MEGÁLLÁS – ${stop.name} (+100)` : `MEGÁLLTÁL – ${stop.name} (+65)`,
            'good',
            2.6
          );
        }
      }
    }

    /* --- utascsere --- */
    if (s.exchange && s.doorState === 'open') {
      const ex = s.exchange;
      ex.timer += dt;
      while (ex.timer >= PAX_TIME) {
        ex.timer -= PAX_TIME;
        if (ex.doneAlight < ex.alight) {
          ex.doneAlight += 1;
          s.passengers = Math.max(0, s.passengers - 1);
        } else if (ex.doneBoard < ex.board) {
          ex.doneBoard += 1;
          s.passengers += 1;
        } else {
          if (!ex.announced) {
            ex.announced = true;
            flash(s, 'MINDENKI FEL- ÉS LESZÁLLT – CSUKD BE AZ AJTÓT!', 'good', 3.4);
          }
          break;
        }
      }
    }

    /* --- kihagyott megálló --- */
    const stop = s.stops[s.nextStopIndex];
    if (stop && !s.exchange && s.position > stop.zEnd && s.doorState === 'closed') {
      stop.missed = true;
      s.missedCount += 1;
      s.score -= 45;
      s.nextStopIndex += 1;
      flash(s, `KIHAGYTAD: ${stop.name} (-45)`, 'bad', 2.6);
    }

    /* --- vége --- */
    const routeOver = s.nextStopIndex >= s.stops.length || s.position >= s.trackLength - SEGMENT_LENGTH * 2;
    if (routeOver && s.doorState === 'closed') {
      s.endTimer += dt;
      if (s.endTimer > 2.8) s.finished = true;
    }

    if (s.messageTimer > 0) {
      s.messageTimer -= dt;
      if (s.messageTimer <= 0) s.message = null;
    }
    s.time += dt;
  }, []);

  /* ---------- render ---------- */
  const render = useCallback((s, ctx, W, H) => {
    const base = findSegment(s, s.position);
    const basePercent = (s.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
    const playerY = interpolate(base.p1.world.y, base.p2.world.y, basePercent);

    drawSky(ctx, W, H, s.skyOffset);

    const shakeAmt =
      (s.offRoad && s.speed > 200 ? Math.sin(s.bob * 3) * H * 0.006 : 0) +
      (s.crashCooldown > 0 ? Math.sin(s.time * 60) * H * 0.012 * (s.crashCooldown / COLLISION_COOLDOWN) : 0);
    const bob = Math.sin(s.bob) * H * 0.0015 * (s.speed / MAX_SPEED) * 4;

    ctx.save();
    ctx.translate(0, shakeAmt + bob);

    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const seg = s.segments[base.index + n];
      if (seg) seg.cars.length = 0;
    }
    for (const car of s.cars) {
      const idx = Math.floor(car.z / SEGMENT_LENGTH);
      if (idx >= base.index && idx < base.index + DRAW_DISTANCE) {
        const seg = s.segments[idx];
        if (seg) seg.cars.push(car);
      }
    }

    let maxy = H;
    let x = 0;
    let dx = -(base.curve * basePercent);
    const camX = s.playerX * ROAD_WIDTH;

    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const seg = s.segments[base.index + n];
      if (!seg) break;
      seg.clip = maxy;

      project(seg.p1, camX - x, playerY + CAMERA_HEIGHT, s.position, W, H);
      project(seg.p2, camX - x - dx, playerY + CAMERA_HEIGHT, s.position, W, H);

      x += dx;
      dx += seg.curve;

      if (seg.p1.camera.z <= CAMERA_DEPTH || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) continue;

      renderSegment(
        ctx,
        W,
        seg.p1.screen.x,
        seg.p1.screen.y,
        seg.p1.screen.w,
        seg.p2.screen.x,
        seg.p2.screen.y,
        seg.p2.screen.w,
        exponentialFog(n / DRAW_DISTANCE, 4),
        seg.color,
        seg
      );
      maxy = seg.p2.screen.y;
    }

    // térbeli elemek hátulról előre
    for (let n = DRAW_DISTANCE - 1; n >= 2; n--) {
      const seg = s.segments[base.index + n];
      if (!seg || !seg.p1.screen.scale) continue;
      const fog = exponentialFog(n / DRAW_DISTANCE, 4);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, Math.max(0, seg.clip));
      ctx.clip();
      for (const sp of seg.sprites) drawScenery(ctx, s, base.index, W, camX, seg, sp, fog);
      for (const car of seg.cars) drawVehicle(ctx, s, base.index, W, camX, car, fog);
      ctx.restore();
    }

    ctx.restore();

    drawInterior(ctx, W, H, s, s.speed * KMH_PER_UNIT);
    drawCracks(ctx, W, H, s.damage);
    if (s.crashFlash > 0) {
      ctx.fillStyle = `rgba(239,68,68,${0.35 * s.crashFlash})`;
      ctx.fillRect(0, 0, W, H);
    }
    drawMiniMap(ctx, W, H, s);
  }, []);

  /* ---------- fő ciklus ---------- */
  useEffect(() => {
    if (phase !== 'running') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    let last = performance.now();
    let acc = 0;
    let hudAcc = 0;
    const STEP = 1 / 60;

    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.25) dt = 0.25;
      acc += dt;

      while (acc >= STEP) {
        update(s, STEP);
        acc -= STEP;
      }

      render(s, ctx, canvas.width, canvas.height);

      hudAcc += dt;
      if (hudAcc > 0.08) {
        hudAcc = 0;
        const stop = s.stops[s.nextStopIndex];
        const ex = s.exchange;
        setHud({
          kmh: Math.round(s.speed * KMH_PER_UNIT),
          nextStop: stop ? stop.name : '—',
          distance: stop ? Math.max(0, Math.round((stop.center - s.position) / UNITS_PER_METER)) : 0,
          inZone: stop ? s.position >= stop.zStart && s.position <= stop.zEnd : false,
          passengers: s.passengers,
          served: s.served,
          missed: s.missedCount,
          total: s.stops.length,
          score: Math.round(s.score),
          damage: s.damage,
          door: s.doorState,
          canOpen: s.speed <= STOPPED_SPEED,
          exchange: ex
            ? { alight: ex.alight, board: ex.board, doneAlight: ex.doneAlight, doneBoard: ex.doneBoard }
            : null,
          paxReady: !!(ex && ex.doneAlight >= ex.alight && ex.doneBoard >= ex.board),
          message: s.message ? { text: s.message, tone: s.messageTone } : null,
        });
      }

      if (s.finished) {
        cancelAnimationFrame(rafRef.current);
        setResult({
          served: s.served,
          missed: s.missedCount,
          total: s.stops.length,
          passengers: s.passengers,
          score: Math.round(s.score),
          time: s.time,
          damage: s.damage,
          wrecked: s.wrecked,
          route: s.route,
        });
        setPhase('finished');
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, update, render]);

  /* ---------- canvas méret ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.min(wrap.clientWidth, 1280);
      const h = Math.round(w * 0.5625);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      if (stateRef.current) {
        const ctx = canvas.getContext('2d');
        render(stateRef.current, ctx, canvas.width, canvas.height);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [render, phase]);

  /* ---------- billentyűzet ---------- */
  useEffect(() => {
    const map = (code) => {
      if (code === 'ArrowUp' || code === 'KeyW') return 'gas';
      if (code === 'ArrowDown' || code === 'KeyS' || code === 'Space') return 'brake';
      if (code === 'ArrowLeft' || code === 'KeyA') return 'left';
      if (code === 'ArrowRight' || code === 'KeyD') return 'right';
      return null;
    };
    const down = (e) => {
      if (e.code === 'KeyO') {
        e.preventDefault();
        doorCmdRef.current = 'open';
        return;
      }
      if (e.code === 'KeyC') {
        e.preventDefault();
        doorCmdRef.current = 'close';
        return;
      }
      const k = map(e.code);
      if (!k) return;
      e.preventDefault();
      keysRef.current[k] = true;
    };
    const up = (e) => {
      const k = map(e.code);
      if (!k) return;
      e.preventDefault();
      keysRef.current[k] = false;
    };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up, { passive: false });
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const startGame = (idx = routeIdx) => {
    keysRef.current = { gas: false, brake: false, left: false, right: false };
    doorCmdRef.current = null;
    setRouteIdx(idx);
    stateRef.current = createState(idx);
    setResult(null);
    setPhase('running');
  };

  const touch = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      keysRef.current[key] = true;
    },
    onPointerUp: (e) => {
      e.preventDefault();
      keysRef.current[key] = false;
    },
    onPointerLeave: () => {
      keysRef.current[key] = false;
    },
    onPointerCancel: () => {
      keysRef.current[key] = false;
    },
    onContextMenu: (e) => e.preventDefault(),
  });

  const grade = (r) => {
    if (!r) return '';
    if (r.wrecked) return 'A BUSZ RONCS – MŰSZAK VÉGE';
    if (r.missed === 0 && r.damage === 0 && r.score >= r.total * 90) return 'AZ ÉV SOFŐRJE';
    if (r.missed === 0 && r.damage <= 1) return 'MEGBÍZHATÓ SOFŐR';
    if (r.missed <= 2) return 'A MENETREND CSÚSZIK';
    return 'A FŐNÖK BESZÉLNI AKAR VELED';
  };

  const btn =
    'select-none touch-none flex items-center justify-center rounded-xl bg-slate-800/80 border border-slate-600 text-yellow-500 font-bold active:bg-yellow-500 active:text-slate-950 backdrop-blur-sm';

  const doorLabel = { closed: 'ZÁRVA', opening: 'NYÍLIK…', open: 'NYITVA', closing: 'ZÁRÓDIK…' }[hud.door];
  const openActive = hud.door === 'open' || hud.door === 'opening';

  return (
    <div ref={wrapRef} className="relative w-full max-w-5xl select-none">
      <div className="relative overflow-hidden rounded-lg border-4 border-slate-800 bg-slate-950">
        <canvas ref={canvasRef} className="block w-full touch-none" />

        {/* --- HUD --- */}
        {phase === 'running' && (
          <>
            <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 flex-col items-center gap-1 font-mono text-[10px] text-slate-200 sm:text-sm">
              <div className="whitespace-nowrap rounded bg-slate-950/70 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-slate-400">Következő:</span>{' '}
                <span className="font-bold text-yellow-500">{hud.nextStop}</span>
              </div>
              <div
                className={`whitespace-nowrap rounded px-3 py-1.5 backdrop-blur-sm ${
                  hud.inZone ? 'bg-green-600/80 text-white' : 'bg-slate-950/70'
                }`}
              >
                {hud.inZone ? 'MEGÁLLÓBAN – ÁLLJ MEG JOBBRA!' : `${hud.distance} m`}
              </div>
            </div>

            <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1 font-mono text-[10px] text-slate-200 sm:text-sm">
              <div className="rounded bg-slate-950/70 px-3 py-1.5 backdrop-blur-sm">
                Utasok: <span className="font-bold text-yellow-500">{hud.passengers}</span>
              </div>
              <div className="rounded bg-slate-950/70 px-3 py-1.5 backdrop-blur-sm">
                Megállók: {hud.served}/{hud.total} · Pont: {hud.score}
              </div>
              <div
                className={`rounded px-3 py-1.5 backdrop-blur-sm ${
                  hud.damage > 0 ? 'bg-red-900/70 text-red-200' : 'bg-slate-950/70 text-slate-300'
                }`}
              >
                Sérülés: {hud.damage}/{MAX_DAMAGE}
              </div>
              <div
                className={`rounded px-3 py-1.5 backdrop-blur-sm ${
                  openActive ? 'bg-green-600/80 text-white' : 'bg-slate-950/70 text-slate-300'
                }`}
              >
                Ajtó: {doorLabel}
              </div>
            </div>

            {hud.exchange && (
              <div className="pointer-events-none absolute bottom-[30%] left-1/2 w-52 -translate-x-1/2 rounded bg-slate-950/80 px-3 py-2 text-center font-mono text-[10px] text-slate-200 backdrop-blur-sm sm:w-64 sm:text-xs">
                <div className="mb-1">
                  Leszáll: {hud.exchange.doneAlight}/{hud.exchange.alight} · Felszáll: {hud.exchange.doneBoard}/
                  {hud.exchange.board}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${
                        ((hud.exchange.doneAlight + hud.exchange.doneBoard) /
                          Math.max(1, hud.exchange.alight + hud.exchange.board)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                {hud.paxReady && <div className="mt-1 font-bold text-green-400">CSUKD BE AZ AJTÓT!</div>}
              </div>
            )}

            {hud.message && (
              <div
                className={`pointer-events-none absolute left-1/2 top-[38%] max-w-[90%] -translate-x-1/2 rounded px-3 py-2 text-center font-bold uppercase tracking-wider backdrop-blur-sm ${
                  hud.message.tone === 'bad' ? 'bg-red-600/85 text-white' : 'bg-green-600/85 text-white'
                } text-[10px] sm:text-base`}
              >
                {hud.message.text}
              </div>
            )}

            {/* ajtógombok a kormány mellett */}
            <div className="absolute bottom-[7%] left-[49%] hidden gap-2 sm:flex sm:gap-3">
              <button
                onClick={() => (doorCmdRef.current = 'open')}
                className={`flex flex-col items-center rounded-md border px-2 py-1.5 font-mono text-[8px] font-bold leading-tight backdrop-blur-sm transition sm:px-3 sm:text-[11px] ${
                  openActive
                    ? 'border-green-400 bg-green-600/80 text-white'
                    : `border-slate-600 bg-slate-900/85 text-green-400 ${
                        hud.canOpen && hud.inZone && hud.door === 'closed' ? 'animate-pulse' : ''
                      }`
                }`}
              >
                <span className="mb-0.5 block h-1.5 w-1.5 rounded-full bg-green-400 sm:h-2 sm:w-2" />
                AJTÓ
                <br />
                NYIT
              </button>
              <button
                onClick={() => (doorCmdRef.current = 'close')}
                className={`flex flex-col items-center rounded-md border px-2 py-1.5 font-mono text-[8px] font-bold leading-tight backdrop-blur-sm transition sm:px-3 sm:text-[11px] ${
                  hud.door === 'closed'
                    ? 'border-slate-600 bg-slate-900/85 text-slate-400'
                    : `border-red-400 bg-slate-900/85 text-red-400 ${hud.paxReady ? 'animate-pulse' : ''}`
                }`}
              >
                <span className="mb-0.5 block h-1.5 w-1.5 rounded-full bg-red-400 sm:h-2 sm:w-2" />
                AJTÓ
                <br />
                CSUK
              </button>
            </div>
          </>
        )}

        {/* --- INDÍTÓ / EREDMÉNY KÉPERNYŐ --- */}
        {phase !== 'running' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 px-6 text-center">
            {phase === 'idle' && (
              <>
                <h2 className="mb-1 text-2xl font-bold text-yellow-500 sm:text-3xl">MŰSZAK KEZDÉS</h2>
                <p className="mb-3 text-xs text-slate-400 sm:text-sm">Válassz járatot:</p>

                <div className="mb-4 flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
                  {ROUTES.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => setRouteIdx(i)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-left transition ${
                        routeIdx === i
                          ? 'border-yellow-500 bg-yellow-500/15'
                          : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-bold text-yellow-500">
                        {r.name} <span className="text-white">· {r.subtitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{r.stops.length} megálló</div>
                      <div className="hidden text-[11px] text-slate-500 sm:block">{r.desc}</div>
                    </button>
                  ))}
                </div>

                <ol className="mb-5 max-w-md list-inside list-decimal text-left text-[11px] text-slate-500 sm:text-xs">
                  <li>Húzódj a jobb oldali sárga öbölbe és állj meg teljesen.</li>
                  <li>Nyisd ki az ajtót (AJTÓ NYIT gomb vagy O billentyű).</li>
                  <li>Várd meg, míg mindenki le- és felszállt.</li>
                  <li>Csukd be az ajtót (AJTÓ CSUK vagy C) – csak ezután indulhatsz.</li>
                  <li>Vigyázz a forgalomra: {MAX_DAMAGE} ütközés után totálkáros a busz!</li>
                </ol>
              </>
            )}

            {phase === 'finished' && result && (
              <>
                <h2 className={`mb-2 text-2xl font-bold sm:text-3xl ${result.wrecked ? 'text-red-500' : 'text-yellow-500'}`}>
                  {result.wrecked ? 'BALESET' : 'VÉGÁLLOMÁS'}
                </h2>
                <p className="mb-1 font-mono text-xs text-slate-400">
                  {result.route ? `${result.route.name} · ${result.route.subtitle}` : ''}
                </p>
                <p className="mb-4 text-lg font-bold uppercase tracking-widest text-white">{grade(result)}</p>
                <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-sm text-slate-300">
                  <span className="text-left text-slate-500">Megállók:</span>
                  <span className="text-right">
                    {result.served}/{result.total}
                  </span>
                  <span className="text-left text-slate-500">Kihagyott:</span>
                  <span className="text-right text-red-400">{result.missed}</span>
                  <span className="text-left text-slate-500">Ütközés:</span>
                  <span className="text-right text-red-400">{result.damage}</span>
                  <span className="text-left text-slate-500">Utas a buszon:</span>
                  <span className="text-right">{result.passengers}</span>
                  <span className="text-left text-slate-500">Menetidő:</span>
                  <span className="text-right">
                    {Math.floor(result.time / 60)}:{String(Math.floor(result.time % 60)).padStart(2, '0')}
                  </span>
                  <span className="text-left text-slate-500">Pontszám:</span>
                  <span className="text-right font-bold text-yellow-500">{result.score}</span>
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => startGame()}
                className="rounded-full bg-yellow-500 px-8 py-3 font-bold text-slate-950 transition hover:bg-yellow-400"
              >
                {phase === 'finished' ? 'ÚJRA' : 'INDULÁS'}
              </button>
              {phase === 'finished' && (
                <button
                  onClick={() => setPhase('idle')}
                  className="rounded-full border border-slate-600 px-6 py-3 font-bold text-slate-300 transition hover:border-yellow-500 hover:text-yellow-500"
                >
                  MÁSIK JÁRAT
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* mobil vezérlés – a kép alatt, hogy ne takarja az utat */}
      {phase === 'running' && (
        <div className="mt-3 flex flex-col gap-2 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button className={`${btn} h-16 w-16 text-2xl`} {...touch('left')} aria-label="Balra">
                ◀
              </button>
              <button className={`${btn} h-16 w-16 text-2xl`} {...touch('right')} aria-label="Jobbra">
                ▶
              </button>
            </div>
            <div className="flex gap-2">
              <button className={`${btn} h-16 w-20 text-sm`} {...touch('brake')} aria-label="Fék">
                FÉK
              </button>
              <button className={`${btn} h-16 w-20 text-sm`} {...touch('gas')} aria-label="Gáz">
                GÁZ
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => (doorCmdRef.current = 'open')}
              className={`h-12 w-32 rounded-xl border font-mono text-xs font-bold ${
                openActive
                  ? 'border-green-400 bg-green-600/80 text-white'
                  : `border-slate-600 bg-slate-800/80 text-green-400 ${
                      hud.canOpen && hud.inZone && hud.door === 'closed' ? 'animate-pulse' : ''
                    }`
              }`}
            >
              AJTÓ NYIT
            </button>
            <button
              onClick={() => (doorCmdRef.current = 'close')}
              className={`h-12 w-32 rounded-xl border font-mono text-xs font-bold ${
                hud.door === 'closed'
                  ? 'border-slate-600 bg-slate-800/80 text-slate-400'
                  : `border-red-400 bg-slate-800/80 text-red-400 ${hud.paxReady ? 'animate-pulse' : ''}`
              }`}
            >
              AJTÓ CSUK
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 hidden flex-wrap justify-center gap-x-6 gap-y-1 font-mono text-xs text-slate-500 md:flex">
        <span>Gáz: ↑ / W</span>
        <span>Fék: ↓ / S / SPACE</span>
        <span>Kormány: ← → / A D</span>
        <span>Ajtó nyit: O</span>
        <span>Ajtó csuk: C</span>
        <span>Sebességkorlát: {SPEED_LIMIT_KMH} km/h</span>
      </div>
    </div>
  );
}
