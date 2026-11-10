'use strict';
const T = window.THREE;
let alive = true, raf = 0, ro = null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const eio = (t) => t * t * (3 - 2 * t);
const angLerp = (a, b, t) => { const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };
let seed = 20261107; const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
const W = () => Math.max(1, host.clientWidth), H = () => Math.max(1, host.clientHeight);
const hk = hooks || {};

/* ===== catálogos ===== */
const CARR = [
  { n: 'Transportes del Norte', c: 0xff8f55 }, { n: 'Río Bravo Freight', c: 0x3cc0c8 }, { n: 'Carga Sinú', c: 0x82d27c },
  { n: 'Lone Star Haulers', c: 0x9d7ff0 }, { n: 'Fletes Sierra Madre', c: 0xf7c948 }, { n: 'Coral Logística', c: 0xf2647f }];
const ORIG = ['Houston', 'Dallas', 'San Antonio', 'Chicago', 'Atlanta', 'Memphis'];
const DEST = ['Monterrey', 'Ciudad de México', 'Querétaro', 'Guadalajara', 'Saltillo', 'Puebla'];
const GOODS = ['autopartes', 'resinas plásticas', 'maquinaria agrícola', 'electrodomésticos', 'papel y cartón', 'alimentos procesados'];
const SEM = { verde: { n: 'Verde', lane: 0, svc: 3, label: 'revisión documental' }, amarillo: { n: 'Amarillo', lane: 1, svc: 7, label: 'rayos X (no intrusiva)' }, rojo: { n: 'Rojo', lane: 2, svc: 26, label: 'inspección física' } };
const S = { t: 6 * 60, speed: 1, night: false, nightT: 0, sel: null, hov: null };

/* ===== render ===== */
const renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
if ('useLegacyLights' in renderer) renderer.useLegacyLights = true;
const scene = new T.Scene();
const DAY_BG = new T.Color(0xe9e4fb), NIGHT_BG = new T.Color(0x141a3d);
scene.background = DAY_BG.clone(); scene.fog = new T.Fog(DAY_BG.clone(), 320, 720);
const camera = new T.PerspectiveCamera(30, 1, 2, 1500);
const hemi = new T.HemisphereLight(0xffffff, 0xd8d0f5, 0.6); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff4e6, 0.7); sun.position.set(60, 100, 70); sun.target.position.set(-10, 0, 10);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -130, right: 130, top: 110, bottom: -110, near: 10, far: 320 });
sun.shadow.bias = -0.0007; scene.add(sun, sun.target);

const GC = {};
const BG = (w, h, d) => GC['b' + w + '|' + h + '|' + d] || (GC['b' + w + '|' + h + '|' + d] = new T.BoxGeometry(w, h, d));
const CYL = (a, b, h, s) => GC['c' + a + '|' + b + '|' + h + '|' + (s || 16)] || (GC['c' + a + '|' + b + '|' + h + '|' + (s || 16)] = new T.CylinderGeometry(a, b, h, s || 16));
const MC = {};
const clay = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return MC[k] || (MC[k] = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.93, metalness: 0 }, o || {}))); };
const glowMats = [];
const glow = (day, em, max) => { const m = new T.MeshStandardMaterial({ color: day, emissive: em, emissiveIntensity: 0, roughness: 0.6 }); glowMats.push({ m: m, max: max }); return m; };
const winMat = glow(0x9db4e6, 0xffd98a, 1.3), floodMat = glow(0xf4efe0, 0xfff6d6, 2), scanMat = glow(0x9fb2f0, 0x4d7cff, 2.2);
const semMat = { verde: new T.MeshStandardMaterial({ color: 0x2fbf71, emissive: 0x2fbf71, emissiveIntensity: 0.6 }), amarillo: new T.MeshStandardMaterial({ color: 0xf7c948, emissive: 0xf7c948, emissiveIntensity: 0.6 }), rojo: new T.MeshStandardMaterial({ color: 0xe9605f, emissive: 0xff3b3b, emissiveIntensity: 0.6 }) };
function mk(parent, geo, mat, x, y, z, noShadow) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = !noShadow; m.receiveShadow = true; parent.add(m); return m; }
const bx = (p, w, h, d, mat, x, y, z, ns) => mk(p, BG(w, h, d), mat, x, y, z, ns);
const world = new T.Group(); scene.add(world);
const tag = (g, ent) => { g.userData.ent = ent; g.traverse((o) => { if (o !== g) o.userData.ent = ent; }); };

/* ===== mundo estático ===== */
const HWY_Z = 86, GATE_Z = 54, ROW_Z = [32, 38, 44], LANE_X0 = -30, LANE_STOP = -5, LANE_X1 = 20, ROW_FRONT = -42, ROW_STEP = 12.5, ROW_MAX = 5;
const YARD_Z = 20, OUT_IN_Z = -56, OUT_OUT_Z = -50, EXIT_X = 100;
const DOOR_X = [-52.5, -37.5, -22.5, -7.5, 7.5, 22.5, 37.5, 52.5], NDOCK_Z = 5.6, SDOCK_Z = -35.6;
const ground = mk(world, new T.PlaneGeometry(440, 320), clay(0xf6f3ff), 0, -0.05, 10, true); ground.rotation.x = -Math.PI / 2;
const grass = clay(0xcdeccf), asphalt = clay(0x6b7186), concrete = clay(0xd9d6e8), stripe = clay(0xffffff), yellow = clay(0xf7c948);
const plane = (w, d, mat, x, z, y) => { const m = mk(world, new T.PlaneGeometry(w, d), mat, x, y || 0.02, z, true); m.rotation.x = -Math.PI / 2; return m; };
plane(380, 22, grass, 0, 104); plane(380, 16, grass, 0, -76);
plane(360, 10, asphalt, 0, HWY_Z, 0.03);
for (let x = -175; x < 175; x += 8) bx(world, 4, 0.12, 0.3, stripe, x, 0.06, HWY_Z, true);
plane(10, HWY_Z - GATE_Z + 14, asphalt, -110, (HWY_Z + GATE_Z) / 2 - 4, 0.035);
plane(150, 22, concrete, -50, 38, 0.025);
ROW_Z.forEach((z) => { for (let x = -100; x < LANE_X1 + 8; x += 5) bx(world, 2.4, 0.1, 0.18, stripe, x, 0.05, z - 3, true); });
plane(150, 26, concrete, 5, 12, 0.03);
plane(150, 22, concrete, 5, -42, 0.03);
plane(12, 80, asphalt, 70, -15, 0.032);
plane(260, 14, asphalt, 50, -53, 0.034);
for (let x = -60; x < 180; x += 6) bx(world, 3, 0.12, 0.25, stripe, x, 0.06, -53, true);
// garita de entrada
const gate = new T.Group(); world.add(gate);
bx(gate, 16, 0.6, 7, clay(0x2f55e6), -110, 6.5, GATE_Z);
[-117, -110, -103].forEach((x) => bx(gate, 0.6, 6.4, 0.6, clay(0xc9d2e6), x, 3.2, GATE_Z));
const booths = [-113.5, -106.5].map((x) => { const b = bx(gate, 1.6, 2.6, 2, clay(0xf1eefc), x + (x < -110 ? -2.3 : 2.3), 1.3, GATE_Z); bx(gate, 1.4, 0.8, 0.1, winMat, b.position.x, 1.9, GATE_Z + 1.02, true); return { x: x, truck: null }; });
tag(gate, { type: 'gate', name: 'Garita de entrada' });
// casetas de aduana con semáforo
const customs = new T.Group(); world.add(customs);
const canopy = bx(customs, 30, 0.5, 18, new T.MeshStandardMaterial({ color: 0x5b7cfa, transparent: true, opacity: 0.45, roughness: 0.6, depthWrite: false }), -5, 7.3, 38); canopy.castShadow = false;
for (let x = -19; x <= 9; x += 14) [29.5, 46.5].forEach((z) => bx(customs, 0.6, 7, 0.6, clay(0xc9d2e6), x, 3.5, z));
const scanner = new T.Group(); customs.add(scanner);
bx(scanner, 1, 5.4, 1, clay(0x2f55e6), -5, 2.7, ROW_Z[1] - 2.4); bx(scanner, 1, 5.4, 1, clay(0x2f55e6), -5, 2.7, ROW_Z[1] + 2.4); bx(scanner, 1.2, 0.8, 5.8, scanMat, -5, 5.6, ROW_Z[1]);
bx(customs, 7, 1.1, 4, clay(0xb9bccb), -5, 0.55, ROW_Z[2] + 4.2);
for (let i = 0; i < 4; i++) bx(customs, 1.2, 1, 1.2, clay([0xc58b5b, 0xd9a066, 0xb07a4c, 0xe3b27a][i]), -7.5 + i * 1.7, 1.6, ROW_Z[2] + 4.2);
const agents = [];
[[-8, ROW_Z[2] + 2.6], [-2, ROW_Z[2] + 2.6], [-1, ROW_Z[0] + 2.4]].forEach((p) => { const g = new T.Group(); mk(g, CYL(0.35, 0.4, 1.3, 8), clay(0x2b3150), 0, 0.65, 0); mk(g, new T.SphereGeometry(0.32, 10, 8), clay(0xe0b48a), 0, 1.55, 0); g.position.set(p[0], 0, p[1]); customs.add(g); agents.push(g); });
const lanes = ROW_Z.map((z, i) => {
  const pole = mk(customs, CYL(0.15, 0.15, 4.4, 6), clay(0x3a3f55), LANE_X0 + 6, 2.2, z - 2.6);
  const kind = ['verde', 'amarillo', 'rojo'][i];
  mk(customs, new T.SphereGeometry(0.5, 12, 10), semMat[kind], LANE_X0 + 6, 4.6, z - 2.6);
  return { i: i, z: z, kind: kind, truck: null, name: 'Carril ' + (i + 1) + ' · ' + SEM[kind].label };
});
tag(customs, { type: 'customs', name: 'Aduana · casetas de inspección' });
// bodega de trasbordo (cross-dock) con techo translúcido
const wh = new T.Group(); world.add(wh);
const wallMat = clay(0xf1eefc);
bx(wh, 122, 0.3, 32, clay(0xe3e7f0), 0, 0.15, -15);
[-61, 61].forEach((x) => bx(wh, 0.6, 9, 32, wallMat, x, 4.5, -15));
[0.2, -30.2].forEach((z) => {
  for (let i = 0; i <= DOOR_X.length; i++) { const x0 = i === 0 ? -61 : DOOR_X[i - 1] + 2.4, x1 = i === DOOR_X.length ? 61 : DOOR_X[i] - 2.4; bx(wh, x1 - x0, 9, 0.5, wallMat, (x0 + x1) / 2, 4.5, z); }
  DOOR_X.forEach((x) => { bx(wh, 4.8, 4.5, 0.5, wallMat, x, 6.75, z); bx(wh, 4.8, 0.3, 0.6, yellow, x, 4.4, z + (z > 0 ? 0.1 : -0.1)); bx(wh, 5.6, 1.3, 2, clay(0xb9bccb), x, 0.65, z + (z > 0 ? 1 : -1)); });
});
const roof = mk(wh, BG(124, 0.25, 33), new T.MeshStandardMaterial({ color: 0x9fb2f0, transparent: true, opacity: 0.2, roughness: 0.4, depthWrite: false }), 0, 9.2, -15, true); roof.castShadow = false;
for (let x = -60; x <= 60; x += 10) bx(wh, 0.4, 0.5, 32.6, clay(0x7f8cc8), x, 9.3, -15);
[-46.6, -16.6, 13.4, 43.4].forEach((x) => { for (let k = 0; k < 3; k++) bx(wh, 10, 0.25, 2.2, clay(0x9aa3b8), x, 1 + k * 1.8, -15); for (let k = 0; k < 5; k++) bx(wh, 1.6, 1.3, 1.6, clay([0xc58b5b, 0xd9a066, 0xb07a4c][k % 3]), x - 4 + k * 2, 1.85 + (k % 3) * 1.8, -15); });
tag(wh, { type: 'warehouse', name: 'Bodega de trasbordo (cross-dock)' });
const ndoors = DOOR_X.map((x, i) => ({ i: i, x: x, name: 'Andén N' + (i + 1), truck: null, side: 'n' }));
const sdoors = DOOR_X.map((x, i) => ({ i: i, x: x, name: 'Andén S' + (i + 1), truck: null, side: 's', buffer: 0, next: 0 }));
ndoors.forEach((d) => { d.pad = plane(4.6, 9, new T.MeshBasicMaterial({ color: 0x6fe0b5, transparent: true, opacity: 0.22, depthWrite: false }), d.x, NDOCK_Z + 0.5, 0.07); d.pad.userData.ent = { type: 'door', door: d, name: d.name }; });
// garita de salida
const egate = new T.Group(); world.add(egate);
bx(egate, 4, 0.6, 9, clay(0x0e9f6e), EXIT_X, 6.5, -53);
[-57.5, -48.5].forEach((z) => bx(egate, 0.6, 6.4, 0.6, clay(0xc9d2e6), EXIT_X, 3.2, z));
bx(egate, 2, 2.6, 1.6, clay(0xf1eefc), EXIT_X, 1.3, -46.2);
tag(egate, { type: 'exit', name: 'Garita de salida (verificación de precintos)' });
// paisaje
const leaf = clay(0x9fdcae), trunk = clay(0xb79e8a);
for (let x = -170; x <= 170; x += 12) [98, -68].forEach((z) => { if (z > 0 && Math.abs(x + 110) < 9) return; const g = new T.Group(); g.position.set(x, 0, z); mk(g, CYL(0.25, 0.3, 1.6, 6), trunk, 0, 0.8, 0); mk(g, new T.IcosahedronGeometry(1.6, 0), leaf, 0, 2.7, 0); world.add(g); });
[[-150, 20], [-150, -20], [140, 10], [140, -30]].forEach((p) => { bx(world, 18, 3, 12, clay(0xdfe4f5), p[0], 1.5, p[1]); });
[-90, -50, -10, 30].forEach((x) => { mk(world, CYL(0.15, 0.2, 12, 6), clay(0x9aa3b8), x, 6, 25); mk(world, BG(1.6, 0.5, 0.8), floodMat, x, 12, 25, true); });

/* ===== modelos ===== */
function makeTruck(c, loaded) {
  const g = new T.Group();
  bx(g, 2.4, 2.6, 2.5, clay(c), 4.6, 1.75, 0); bx(g, 0.2, 1.1, 2.1, winMat, 5.85, 2.3, 0); bx(g, 0.5, 3.1, 2.3, clay(c), 3.3, 1.95, 0);
  const box = bx(g, 8, 2.8, 2.6, clay(0xf1eefc), -0.8, 2.15, 0);
  bx(g, 8.02, 0.35, 2.62, clay(c), -0.8, 3.4, 0);
  [4.6, 2.6, -2.6, -4].forEach((x) => [1.15, -1.15].forEach((z) => mk(g, CYL(0.5, 0.5, 0.35, 10), clay(0x3a3f55), x, 0.5, z).rotation.x = Math.PI / 2));
  g.userData.box = box;
  return g;
}
function makeForklift() {
  const g = new T.Group();
  bx(g, 1.6, 1.1, 1.2, clay(0xf7c948), 0, 0.85, 0); bx(g, 0.9, 0.9, 1.1, clay(0x3a3f55), -0.3, 1.8, 0);
  bx(g, 0.12, 2.6, 0.9, clay(0x3a3f55), 0.9, 1.3, 0);
  const forks = new T.Group(); forks.position.set(1.4, 0.3, 0); g.add(forks);
  bx(forks, 1, 0.08, 0.2, clay(0x3a3f55), 0, 0, 0.3); bx(forks, 1, 0.08, 0.2, clay(0x3a3f55), 0, 0, -0.3);
  const pal = new T.Group(); forks.add(pal); bx(pal, 1.2, 0.15, 1.0, clay(0xb79e8a), 0, 0.12, 0); bx(pal, 1.1, 1.0, 0.95, clay(0xc58b5b), 0, 0.7, 0);
  [[0.5, 0.45], [0.5, -0.45], [-0.5, 0.45], [-0.5, -0.45]].forEach((w) => mk(g, CYL(0.28, 0.28, 0.2, 8), clay(0x3a3f55), w[0], 0.28, w[1]).rotation.x = Math.PI / 2);
  g.userData.pal = pal; g.userData.forks = forks;
  return g;
}
const stackGroups = sdoors.map((d) => { const g = new T.Group(); g.position.set(d.x + 1.8, 0, -15 + (d.i % 2 ? 4 : -4)); world.add(g); return g; });
function drawStack(d) { const g = stackGroups[d.i]; while (g.children.length) g.remove(g.children[0]); for (let k = 0; k < d.buffer; k++) bx(g, 1.1, 1.0, 1.0, clay(0xc58b5b), (k % 2) * 1.25, 0.55 + Math.floor(k / 2) * 1.05, 0); }

/* ===== flujo ===== */
const trucks = [], forklifts = [], rows = [[], [], []], waitRoad = [], moveLog = [], crossLog = [], crossTimes = [], semLog = [], alerts = [];
let nextArr = S.t + 1, idSeq = 0, slowGateUntil = 0, diverted = 0;
function pushAlert(sev, txt, ent) { alerts.unshift({ sev: sev, txt: txt, t: S.t, ent: ent }); if (alerts.length > 14) alerts.pop(); }
const P = (x, z) => new T.Vector3(x, 0, z);
function pathLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return L; }
function along(pts, d, out) {
  for (let i = 1; i < pts.length; i++) { const L = pts[i].distanceTo(pts[i - 1]); if (d <= L && L > 0) { out.copy(pts[i - 1]).lerp(pts[i], d / L); return Math.atan2(-(pts[i].z - pts[i - 1].z), pts[i].x - pts[i - 1].x); } d -= L; }
  const n = pts.length; out.copy(pts[n - 1]); return Math.atan2(-(pts[n - 1].z - pts[n - 2].z), pts[n - 1].x - pts[n - 2].x);
}
const tmpV = new T.Vector3();
function go(tk, pts, speed, rev, then) { tk.path = pts; tk.pd = 0; tk.pl = pathLen(pts); tk.spd = speed; tk.rev = !!rev; tk.then = then; }
const plate = () => String.fromCharCode(65 + Math.floor(rnd() * 26), 65 + Math.floor(rnd() * 26)) + '-' + (1000 + Math.floor(rnd() * 8999));
function newTruck(kind) {
  const ci = Math.floor(rnd() * CARR.length);
  const tk = { id: ++idSeq, type: 'truck', kind: kind, ci: ci, carrier: CARR[ci].n, name: plate(), from: ORIG[Math.floor(rnd() * ORIG.length)], to: DEST[Math.floor(rnd() * DEST.length)], goods: GOODS[Math.floor(rnd() * GOODS.length)],
    st: '', pal: 0, cap: 16, hd: 0, path: null, wait: 0, arrAt: 0, outAt: 0, sem: null, slotX: 0 };
  tk.mesh = makeTruck(CARR[ci].c); tk.mesh.userData.ent = tk; tk.mesh.traverse((o) => { o.userData.ent = tk; }); world.add(tk.mesh);
  trucks.push(tk);
  return tk;
}
function spawnInbound() {
  if (waitRoad.length + trucks.filter((x) => x.st === 'hwy').length >= 2) { diverted += 1; if (diverted % 3 === 1) pushAlert('warn', 'Acceso saturado: los camiones siguen por la autopista y esperan turno', null); return; }
  const tk = newTruck('in');
  tk.pal = 10 + Math.floor(rnd() * 9); tk.pal0 = tk.pal;
  const r = rnd(); tk.sem = r < 0.68 ? 'verde' : (r < 0.9 ? 'amarillo' : 'rojo');
  tk.mesh.position.set(-185, 0, HWY_Z - 2.5); tk.st = 'hwy';
  go(tk, [P(-185, HWY_Z - 2.5), P(-110, HWY_Z - 2.5), P(-110, HWY_Z - 8)], 34, false, () => { tk.st = 'road'; waitRoad.push(tk); tk.arrAt = S.t; });
}
function spawnThrough() {
  const tk = newTruck('thru'); const east = rnd() < 0.5;
  tk.st = 'thru';
  const z = east ? HWY_Z - 2.5 : HWY_Z + 2.5, a = east ? -185 : 185;
  tk.mesh.position.set(a, 0, z);
  go(tk, [P(a, z), P(-a, z)], 40, false, () => { tk.st = 'done'; world.remove(tk.mesh); if (S.sel === tk) select(null); });
}
function spawnOutbound(d) {
  const tk = newTruck('out'); tk.st = 'obArrive'; tk.door = d; d.truck = tk; tk.arrAt = S.t;
  tk.mesh.position.set(185, 0, OUT_IN_Z);
  go(tk, [P(185, OUT_IN_Z), P(d.x, OUT_IN_Z)], 30, false, () => {
    go(tk, [P(d.x, OUT_IN_Z), P(d.x, SDOCK_Z)], 6, true, () => { tk.st = 'loading'; });
  });
}
function rowSlot(k, idx) { return ROW_FRONT - idx * ROW_STEP; }
function stepRoad() {
  waitRoad.forEach((tk, i) => { if (!tk.path) { const z = 62 + i * 12; if (Math.abs(tk.mesh.position.z - z) > 0.2) go(tk, [tk.mesh.position.clone(), P(-110, z)], 14, false, null); } });
  const front = waitRoad[0];
  if (front && !front.path) { const b = booths.find((x) => !x.truck); if (b) { waitRoad.shift(); b.truck = front; front.booth = b; front.st = 'toGate'; go(front, [front.mesh.position.clone(), P(b.x, GATE_Z + 5), P(b.x, GATE_Z)], 12, false, () => { front.st = 'gate'; front.wait = (1.5 + rnd() * 1.5) * (S.t < slowGateUntil ? 2.2 : 1); }); } }
}
function stepTruck(tk, h) {
  if (tk.path) {
    tk.pd += tk.spd * h;
    const hd = along(tk.path, Math.min(tk.pd, tk.pl), tmpV);
    tk.mesh.position.copy(tmpV);
    tk.hd = angLerp(tk.hd, hd + (tk.rev ? Math.PI : 0), Math.min(1, h * 7));
    if (tk.pd >= tk.pl) { const f = tk.then; tk.path = null; if (f) f(); }
    return;
  }
  if (tk.st === 'gate') {
    tk.wait -= h;
    const k = SEM[tk.sem].lane;
    if (tk.wait <= 0 && rows[k].length < ROW_MAX) {
      tk.booth.truck = null; tk.booth = null; rows[k].push(tk); tk.st = 'toQueue'; tk.gateAt = S.t;
      const idx = rows[k].length - 1, x = rowSlot(k, idx);
      go(tk, [tk.mesh.position.clone(), P(tk.mesh.position.x, ROW_Z[k] + 6), P(-104, ROW_Z[k]), P(x, ROW_Z[k])], 14, false, () => { tk.st = 'queue'; tk.slotX = x; });
    } else if (tk.wait <= 0 && !tk.held) { tk.held = true; pushAlert('warn', 'Fila del carril ' + SEM[tk.sem].n.toLowerCase() + ' llena: ' + tk.name + ' retenido en la garita', tk); }
  } else if (tk.st === 'queue') {
    const k = SEM[tk.sem].lane, idx = rows[k].indexOf(tk), x = rowSlot(k, idx);
    if (idx === 0 && !lanes[k].truck) {
      rows[k].shift(); lanes[k].truck = tk; tk.st = 'toLane';
      go(tk, [tk.mesh.position.clone(), P(LANE_STOP, ROW_Z[k])], 10, false, () => { tk.st = 'inspect'; tk.wait = SEM[tk.sem].svc * (0.8 + rnd() * 0.4); semLog.push(tk.sem); if (semLog.length > 30) semLog.shift(); });
    } else if (Math.abs(tk.mesh.position.x - x) > 0.3) { go(tk, [tk.mesh.position.clone(), P(x, ROW_Z[k])], 10, false, () => { tk.st = 'queue'; }); }
  } else if (tk.st === 'inspect') {
    tk.wait -= h;
    if (tk.wait <= 0) {
      if (tk.sem === 'amarillo' && rnd() < 0.12 && !tk.flag) { tk.flag = true; tk.sem = 'rojo'; tk.wait = 0; lanes[1].truck = null; tk.st = 'toQueue'; rows[2].push(tk); pushAlert('bad', 'Rayos X detecta inconsistencia: ' + tk.name + ' pasa a inspección física', tk); go(tk, [tk.mesh.position.clone(), P(LANE_X1, ROW_Z[1]), P(LANE_X1 + 4, ROW_Z[1] + 3), P(LANE_X1 + 4, 50), P(-104, 50), P(-104, ROW_Z[2]), P(rowSlot(2, rows[2].length - 1), ROW_Z[2])], 16, false, () => { tk.st = 'queue'; }); return; }
      const d = ndoors.find((x) => !x.truck);
      if (!d) { if (!tk.held2) { tk.held2 = true; pushAlert('warn', 'Sin andén libre: ' + tk.name + ' espera en el carril de aduana', tk); } return; }
      lanes[SEM[tk.sem].lane].truck = null; d.truck = tk; tk.door = d; tk.st = 'toDock';
      const z = tk.mesh.position.z;
      go(tk, [tk.mesh.position.clone(), P(LANE_X1 + 6, z), P(30, z - 4), P(30, YARD_Z + 2), P(d.x + (d.x < 30 ? 0 : 0), YARD_Z)], 16, false, () => {
        go(tk, [P(d.x, YARD_Z), P(d.x, NDOCK_Z)], 5, true, () => { tk.st = 'unload'; });
      });
    }
  } else if (tk.st === 'unload') {
    if (tk.pal <= 0 && !tk.claimed) {
      const d = tk.door; d.truck = null; tk.door = null; tk.st = 'leave';
      go(tk, [tk.mesh.position.clone(), P(d.x, YARD_Z), P(70, YARD_Z), P(70, OUT_OUT_Z + 4), P(EXIT_X - 8, OUT_OUT_Z), P(EXIT_X, OUT_OUT_Z)], 18, false, () => exitGate(tk));
    }
  } else if (tk.st === 'loading') {
    if (tk.pal >= tk.cap && !tk.claimed) {
      const d = tk.door; d.truck = null; d.next = S.t + 2 + rnd() * 4; tk.door = null; tk.st = 'obLeave';
      go(tk, [tk.mesh.position.clone(), P(d.x, OUT_OUT_Z + 3), P(EXIT_X - 14, OUT_OUT_Z + 3), P(EXIT_X - 8, OUT_OUT_Z), P(EXIT_X, OUT_OUT_Z)], 16, false, () => exitGate(tk));
    }
  } else if (tk.st === 'exit') {
    tk.wait -= h;
    if (tk.wait <= 0) {
      tk.st = 'gone'; tk.outAt = S.t;
      if (tk.kind === 'in') { crossLog.push(S.t); crossTimes.push(S.t - tk.arrAt); if (crossTimes.length > 16) crossTimes.shift(); }
      go(tk, [tk.mesh.position.clone(), P(190, OUT_OUT_Z)], 34, false, () => { tk.st = 'done'; world.remove(tk.mesh); if (S.sel === tk) select(null); });
      tk.st = 'departing';
    }
  }
}
function exitGate(tk) { tk.st = 'exit'; tk.wait = 0.8 + rnd() * 0.6; }
/* montacargas: uno por par de andenes N/S */
DOOR_X.forEach((x, i) => { const g = makeForklift(); world.add(g); const f = { type: 'forklift', name: 'Montacargas ' + (i + 1), i: i, g: g, mesh: g, z: -15, st: 'idle', carry: false, wait: 0, src: null }; tag(g, f); forklifts.push(f); });
const FZ_N = -2.4, FZ_S = -27.6, FZ_B = -15, FSPD = 42;
function stepForklift(f, h) {
  const n = ndoors[f.i].truck, s = sdoors[f.i].truck, sd = sdoors[f.i];
  const nIn = n && n.st === 'unload', sIn = s && s.st === 'loading';
  const moveTo = (z) => { const dz = z - f.z, st = FSPD * h; if (Math.abs(dz) <= st) { f.z = z; return true; } f.z += Math.sign(dz) * st; f.dir = Math.sign(dz); return false; };
  if (f.st === 'idle') {
    if (nIn && n.pal > 0 && (sd.buffer < 6 || sIn)) { n.claimed = true; f.st = 'toN'; }
    else if (sd.buffer > 0 && sIn && s.pal < s.cap) { s.claimed = true; f.st = 'toB'; }
    else moveTo(FZ_B + (f.i % 2 ? 4 : -4) - 3);
  } else if (f.st === 'toN') { if (moveTo(FZ_N)) { f.st = 'pickN'; f.wait = 0.25; } }
  else if (f.st === 'pickN') { f.wait -= h; if (f.wait <= 0) { if (n && n.pal > 0) { n.pal -= 1; f.carry = true; moveLog.push(S.t); } if (n) n.claimed = false; f.st = f.carry ? (sIn && s.pal < s.cap ? 'toS' : 'toBdrop') : 'idle'; if (f.st === 'toS') s.claimed = true; } }
  else if (f.st === 'toS') { if (moveTo(FZ_S)) { f.st = 'dropS'; f.wait = 0.25; } }
  else if (f.st === 'dropS') { f.wait -= h; if (f.wait <= 0) { const t2 = sdoors[f.i].truck; if (t2 && t2.st === 'loading') { t2.pal += 1; t2.claimed = false; f.carry = false; f.st = 'idle'; } else { f.st = 'toBdrop'; } } }
  else if (f.st === 'toBdrop') { if (moveTo(FZ_B + (f.i % 2 ? 4 : -4) - 1.8)) { sd.buffer += 1; drawStack(sd); f.carry = false; f.st = 'idle'; } }
  else if (f.st === 'toB') { if (moveTo(FZ_B + (f.i % 2 ? 4 : -4) - 1.8)) { f.st = 'pickB'; f.wait = 0.2; } }
  else if (f.st === 'pickB') { f.wait -= h; if (f.wait <= 0) { if (sd.buffer > 0) { sd.buffer -= 1; drawStack(sd); f.carry = true; } f.st = f.carry ? 'toS' : 'idle'; if (!f.carry && s) s.claimed = false; } }
  if ((f.st === 'toS' || f.st === 'dropS') && !(sdoors[f.i].truck && sdoors[f.i].truck.st === 'loading') && f.st === 'toS') { if (s) s.claimed = false; f.st = 'toBdrop'; }
  f.g.position.set(DOOR_X[f.i] - 1.6, 0, f.z);
  f.g.rotation.y = (f.dir || 1) > 0 ? -Math.PI / 2 : Math.PI / 2;
  f.g.userData.pal.visible = f.carry;
}
function simStep(h) {
  S.t += h;
  if (S.t >= nextArr) { spawnInbound(); nextArr = S.t + 3 + rnd() * 3.5; }
  if (S.t >= (simStep.thru || 0)) { spawnThrough(); simStep.thru = S.t + 1.2 + rnd() * 2.5; }
  sdoors.forEach((d) => { if (!d.truck && S.t >= d.next) spawnOutbound(d); });
  stepRoad();
  for (const tk of trucks) if (tk.st !== 'done') stepTruck(tk, h);
  forklifts.forEach((f) => stepForklift(f, h));
  while (moveLog.length && moveLog[0] < S.t - 60) moveLog.shift();
  while (crossLog.length && crossLog[0] < S.t - 60) crossLog.shift();
  for (let i = trucks.length - 1; i >= 0; i--) { const tk = trucks[i]; if (tk.st === 'done' && S.sel !== tk) { trucks.splice(i, 1); } }
  if (S.t > (simStep.fail || S.t + 1)) { simStep.fail = S.t + 160 + rnd() * 120; slowGateUntil = S.t + 20; pushAlert('bad', 'Falla intermitente del sistema aduanero: la garita atiende a la mitad del ritmo durante 20 min', null); }
  if (!simStep.fail) simStep.fail = S.t + 120;
}
function inTerminal(tk) { return tk.kind !== 'thru' && ['road', 'toGate', 'gate', 'toQueue', 'queue', 'toLane', 'inspect', 'toDock', 'unload', 'leave', 'obArrive', 'loading', 'obLeave', 'exit'].indexOf(tk.st) >= 0; }
function prog(tk) {
  if (tk.kind === 'out') return clamp(tk.pal / tk.cap * 100, 0, 100);
  const order = ['hwy', 'road', 'toGate', 'gate', 'toQueue', 'queue', 'toLane', 'inspect', 'toDock', 'unload', 'leave', 'exit', 'departing', 'done'];
  if (tk.st === 'unload') return 60 + (1 - tk.pal / (tk.pal0 || tk.pal || 1)) * 30;
  return clamp(order.indexOf(tk.st) / (order.length - 3) * 100, 0, 100);
}
const STATUS = { hwy: 'En la autopista', road: 'En el acceso', toGate: 'Entrando a la garita', gate: 'En la garita', toQueue: 'Hacia la fila', queue: 'En fila de aduana', toLane: 'Entrando al carril', inspect: 'En inspección', toDock: 'Hacia el andén', unload: 'Descargando', leave: 'Saliendo vacío', obArrive: 'Llegando al andén', loading: 'Cargando', obLeave: 'Saliendo cargado', exit: 'En la garita de salida', departing: 'Despachado', done: 'Despachado', thru: 'De paso' };
const fmtHM = (m) => { m = Math.floor(m); const h = Math.floor(m / 60) % 24, mm = m % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
function entLabel(e) {
  if (!e) return '';
  if (e.type === 'truck') return 'Camión ' + e.name + ' · ' + e.carrier + ' · ' + (STATUS[e.st] || e.st) + (e.sem ? ' · semáforo ' + SEM[e.sem].n.toLowerCase() : '') + (e.kind !== 'thru' ? ' · ' + e.pal + ' pallets' : '');
  if (e.type === 'forklift') return e.name + ' · ' + ({ idle: 'en espera', toN: 'hacia el andén norte', pickN: 'tomando pallet', toS: 'hacia el andén sur', dropS: 'entregando pallet', toBdrop: 'dejando en piso', toB: 'hacia el piso', pickB: 'tomando del piso' }[e.st] || e.st);
  if (e.type === 'door') return e.door.truck ? e.name + ' · ' + e.door.truck.name : e.name + ' · libre';
  if (e.type === 'customs') return e.name + ' · ' + lanes.map((l) => (l.truck ? l.truck.name : 'libre')).join(' · ');
  if (e.type === 'gate') return e.name + ' · ' + booths.filter((b) => b.truck).length + ' de 2 casetas ocupadas · ' + waitRoad.length + ' en el acceso';
  return e.name;
}

/* ===== cámara ===== */
const cam = { target: new T.Vector3(-15, 0, 8), yaw: 0.5, pitch: 0.66, dist: 290, vy: 0, vp: 0, vd: 0, vpan: new T.Vector3(), goal: null, follow: false };
const VIEWS = { all: { t: [-15, 0, 8], d: 290, yaw: 0.5, pitch: 0.66 }, gate: { t: [-105, 1, 60], d: 70, yaw: 0.9, pitch: 0.5 }, customs: { t: [-25, 2, 38], d: 85, yaw: 0.35, pitch: 0.55 }, dock: { t: [0, 2, 6], d: 95, yaw: 0.3, pitch: 0.6 }, inside: { t: [0, 0, -15], d: 75, yaw: 0.2, pitch: 1.05 }, exit: { t: [80, 1, -48], d: 75, yaw: -0.6, pitch: 0.5 } };
function flyTo(t, d, yaw, pitch) { cam.goal = { t: new T.Vector3().copy(t), d: d, yaw: yaw, pitch: pitch }; cam.follow = false; }
function applyCam() { const cp = Math.cos(cam.pitch); camera.position.set(cam.target.x + Math.sin(cam.yaw) * cp * cam.dist, cam.target.y + Math.sin(cam.pitch) * cam.dist, cam.target.z + Math.cos(cam.yaw) * cp * cam.dist); camera.lookAt(cam.target); }
const ptrs = new Map(); let drag = null, moved = 0;
const mouse = { x: 0, y: 0, dirty: false };
const rel = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
function panBy(dx, dy) { const s = cam.dist * 0.0016, rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw), fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw); const mx = -dx * s * rx + dy * s * fx * 1.3, mz = -dx * s * rz + dy * s * fz * 1.3; cam.target.x += mx; cam.target.z += mz; cam.vpan.set(mx, 0, mz); cam.follow = false; }
const onCtx = (e) => e.preventDefault();
const onDown = (e) => { cv.setPointerCapture(e.pointerId); const p = rel(e); ptrs.set(e.pointerId, p); moved = 0; cam.goal = null; if (fly.on) stopFly(); drag = { pan: e.button === 2 || e.shiftKey || e.button === 1 }; };
const onMove = (e) => {
  const q = rel(e); mouse.x = q.x; mouse.y = q.y; mouse.dirty = true;
  const p = ptrs.get(e.pointerId); if (!p) return; const dx = q.x - p.x, dy = q.y - p.y;
  if (drag) { moved += Math.abs(dx) + Math.abs(dy); if (drag.pan) panBy(dx, dy); else { const ay = -dx * 0.0052, ap = dy * 0.0052; cam.yaw += ay; cam.pitch = clamp(cam.pitch + ap, 0.12, 1.4); cam.vy = cam.vy * 0.4 + ay * 0.6; cam.vp = cam.vp * 0.4 + ap * 0.6; } }
  p.x = q.x; p.y = q.y;
};
const onUp = (e) => { const q = rel(e); ptrs.delete(e.pointerId); if (e.type === 'pointerup' && moved < 5) clickAt(q.x, q.y); if (!ptrs.size) drag = null; };
const onWheel = (e) => { e.preventDefault(); cam.goal = null; if (fly.on) stopFly(); cam.vd += clamp(e.deltaY, -120, 120) * 0.00055; };
cv.addEventListener('contextmenu', onCtx); cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp); cv.addEventListener('wheel', onWheel, { passive: false });
function stepCamera(dt) {
  const k = Math.pow(0.04, dt);
  if (!drag) { cam.yaw += cam.vy; cam.pitch = clamp(cam.pitch + cam.vp, 0.12, 1.4); cam.vy *= k; cam.vp *= k; cam.target.addScaledVector(cam.vpan, 1); cam.vpan.multiplyScalar(k); }
  if (Math.abs(cam.vd) > 1e-5) { cam.dist = clamp(cam.dist * Math.exp(cam.vd), 25, 460); cam.vd *= Math.pow(0.003, dt); }
  if (cam.goal) { const f = 1 - Math.exp(-dt * 3.4), g = cam.goal; cam.target.lerp(g.t, f); cam.dist += (g.d - cam.dist) * f; if (g.yaw != null) cam.yaw = angLerp(cam.yaw, g.yaw, f); if (g.pitch != null) cam.pitch += (g.pitch - cam.pitch) * f; if (cam.target.distanceTo(g.t) < 0.15 && Math.abs(g.d - cam.dist) < 0.4) cam.goal = null; }
  if (cam.follow && S.sel && S.sel.mesh && !cam.goal) { cam.target.lerp(tmpV.copy(S.sel.mesh.position).setY(Math.min(S.sel.mesh.position.y, 6)), 1 - Math.exp(-dt * 4)); }
  cam.target.x = clamp(cam.target.x, -170, 170); cam.target.z = clamp(cam.target.z, -75, 100);
}
/* vuelo cinematográfico */
const fly = { on: false, t: 0, blend: 0 };
const FK = [[[160, 90, 150], [-10, 0, 10]], [[-170, 20, 110], [-110, 3, 70]], [[-120, 14, 40], [-70, 2, 38]], [[-30, 10, 60], [-5, 3, 38]], [[45, 14, 34], [0, 2, 8]], [[10, 30, -5], [0, 1, -15]], [[110, 16, -25], [70, 2, -50]], [[160, 80, 120], [-10, 0, 10]]];
const flyP = new T.CatmullRomCurve3(FK.map((k) => new T.Vector3(...k[0])), true, 'catmullrom', 0.5), flyTg = new T.CatmullRomCurve3(FK.map((k) => new T.Vector3(...k[1])), true, 'catmullrom', 0.5);
const fp = new T.Vector3(), ft = new T.Vector3();
function startFly() { fly.on = true; fly.t = 0; fly.blend = 0; fly.p0 = camera.position.clone(); fly.t0 = cam.target.clone(); cam.goal = null; select(null); }
function stopFly() { fly.on = false; camera.fov = 30; camera.updateProjectionMatrix(); cam.target.copy(ft); const d = fp.clone().sub(ft); cam.dist = clamp(d.length(), 25, 460); cam.yaw = Math.atan2(d.x, d.z); cam.pitch = clamp(Math.asin(d.y / d.length()), 0.12, 1.4); }
function stepFly(dt) { fly.t = (fly.t + dt / 80) % 1; fly.blend = Math.min(1, fly.blend + dt / 3); flyP.getPointAt(fly.t, fp); flyTg.getPointAt(fly.t, ft); const b = eio(fly.blend); fp.lerp(fly.p0, 1 - b); ft.lerp(fly.t0, 1 - b); camera.position.copy(fp); camera.lookAt(ft); }
/* selección */
const ray = new T.Raycaster(), ndc = new T.Vector2();
const hl = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)), new T.LineBasicMaterial({ color: 0x2f55e6, transparent: true, opacity: 1, depthTest: false })); hl.visible = false; hl.renderOrder = 10; scene.add(hl);
const hov = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)), new T.LineBasicMaterial({ color: 0x6d86ff, transparent: true, opacity: 0.8, depthTest: false })); hov.visible = false; hov.renderOrder = 10; scene.add(hov);
function pickList() { const l = [gate, customs, wh, egate]; trucks.forEach((t) => { if (t.st !== 'done') l.push(t.mesh); }); forklifts.forEach((f) => l.push(f.g)); ndoors.forEach((d) => { if (!d.truck) l.push(d.pad); }); return l; }
function pickAt(x, y) {
  ndc.set(x / W() * 2 - 1, -(y / H()) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickList(), true);
  for (const h of hits) { if (h.object === roof) continue; let o = h.object; while (o && !o.userData.ent) o = o.parent; if (o && o.userData.ent) return o.userData.ent; }
  return null;
}
const box3 = new T.Box3();
function objOf(e) { if (!e) return null; if (e.type === 'truck') return e.mesh; if (e.type === 'forklift') return e.g; if (e.type === 'door') return e.door.pad; if (e.type === 'gate') return gate; if (e.type === 'customs') return customs; if (e.type === 'exit') return egate; return null; }
function fit(m, e) { const o = objOf(e); if (!o) { m.visible = false; return; } box3.setFromObject(o); const s = box3.getSize(tmpV).addScalar(0.4); box3.getCenter(m.position); m.scale.copy(s); m.visible = true; }
function clickAt(x, y) {
  const e = pickAt(x, y);
  if (e && e.type === 'door') { toast('Andén ' + e.door.name.slice(6) + ' libre: lo ocupará el próximo camión que salga de aduana'); return; }
  select(e);
}
function select(e) {
  S.sel = e; cam.follow = false;
  if (!e) { hl.visible = false; return; }
  const o = objOf(e); if (o) { box3.setFromObject(o); box3.getCenter(tmpV); cam.goal = { t: tmpV.clone().setY(Math.min(tmpV.y, 4)), d: e.type === 'truck' || e.type === 'forklift' ? 45 : 70, yaw: null, pitch: null }; cam.follow = e.type === 'truck' || e.type === 'forklift'; }
}
function toast(t) { if (hk.toast) hk.toast(t); }

/* ===== bucle ===== */
const nightC = new T.Color();
let nightCur = -1, time = 0, frameN = 0;
function visuals(dt) {
  time += dt;
  S.nightT += ((S.night ? 1 : 0) - S.nightT) * Math.min(1, dt * 2.2); const n = S.nightT;
  if (Math.abs(n - nightCur) > 0.002) {
    nightCur = n; scene.background.copy(DAY_BG).lerp(NIGHT_BG, n); scene.fog.color.copy(scene.background);
    hemi.color.setHex(0xffffff).lerp(nightC.setHex(0x6a78c8), n); hemi.groundColor.setHex(0xd8d0f5).lerp(nightC.setHex(0x232a58), n); hemi.intensity = lerp(0.6, 0.85, n);
    sun.color.setHex(0xfff4e6).lerp(nightC.setHex(0x8fa6ff), n); sun.intensity = lerp(0.7, 0.28, n);
    glowMats.forEach((g) => { g.m.emissiveIntensity = g.max * n; });
  }
  scanMat.emissiveIntensity = 2.2 * n + (lanes[1].truck && lanes[1].truck.st === 'inspect' ? 1 + 0.8 * Math.sin(time * 9) : 0);
  trucks.forEach((tk) => { if (tk.st === 'done') return; tk.mesh.rotation.set(0, tk.hd, 0); });
  ndoors.forEach((d) => { d.pad.visible = !d.truck; d.pad.material.opacity = 0.18 + 0.1 * Math.sin(time * 2.4 + d.i); });
  agents.forEach((a, i) => { a.rotation.y = Math.sin(time * 0.8 + i) * 0.8; });
  if (S.hov) fit(hov, S.hov); else hov.visible = false;
  if (S.sel) fit(hl, S.sel);
}
const resize = () => { renderer.setSize(W(), H(), false); camera.aspect = W() / H(); camera.updateProjectionMatrix(); };
if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(host); }
resize();
for (let i = 0; i < 480; i++) simStep(0.25);
applyCam();
renderer.shadowMap.needsUpdate = true;
let last = performance.now();
function frame(now) {
  if (!alive) return; raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; frameN++;
  let rem = dt * S.speed; while (rem > 1e-6) { const h = Math.min(rem, 0.25); simStep(h); rem -= h; }
  if (fly.on) stepFly(dt); else { stepCamera(dt); applyCam(); }
  if (mouse.dirty && frameN % 2 === 0 && !drag) { mouse.dirty = false; S.hov = pickAt(mouse.x, mouse.y); }
  visuals(dt);
  if (frameN % 2 === 0) renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
}
raf = requestAnimationFrame(frame);
return {
  S: S, trucks: trucks, forklifts: forklifts, ndoors: ndoors, sdoors: sdoors, lanes: lanes, rows: rows, booths: booths, CARR: CARR, SEM: SEM, STATUS: STATUS, VIEWS: VIEWS,
  get waitRoad() { return waitRoad; }, get moveLog() { return moveLog; }, get crossLog() { return crossLog; }, get crossTimes() { return crossTimes; }, get semLog() { return semLog; }, get alerts() { return alerts; }, get slowGate() { return S.t < slowGateUntil; },
  get fly() { return fly; }, startFly: startFly, stopFly: stopFly, flyTo: flyTo, select: select, entLabel: entLabel, prog: prog, inTerminal: inTerminal, fmtHM: fmtHM, simStep: simStep, pickAt: pickAt,
  dispose: () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); cv.removeEventListener('contextmenu', onCtx); cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp); cv.removeEventListener('wheel', onWheel); try { renderer.dispose(); renderer.forceContextLoss(); } catch (err) {} }
};
