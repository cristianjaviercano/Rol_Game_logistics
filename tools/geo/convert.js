// Convierte world-atlas (TopoJSON) a anillos compactos [lon,lat,...] para pintar la textura del globo.
const fs = require('fs');
const path = require('path');
const topo = require('topojson-client');

const res = process.argv[2] || '50m';
const step = Number(process.argv[3] || 0.08); // distancia mínima en grados entre vértices conservados
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules/world-atlas/countries-' + res + '.json'), 'utf8'));
const fc = topo.feature(src, src.objects.countries);

const out = [];
for (const f of fc.features) {
  if (!f.geometry) continue;
  if (f.id === '010') continue; // Antártida: se omite (cruza el antimeridiano por el polo)
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = [];
  for (const poly of polys) {
    for (const ring of poly) {
      const flat = [];
      let px = null, py = null;
      for (const [x, y] of ring) {
        if (px !== null && Math.abs(x - px) < step && Math.abs(y - py) < step) continue;
        flat.push(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
        px = x; py = y;
      }
      if (flat.length >= 6) rings.push(flat);
    }
  }
  if (rings.length) out.push({ id: f.id || '', n: (f.properties && f.properties.name) || '', r: rings });
}
const json = JSON.stringify(out);
fs.writeFileSync(path.join(__dirname, '..', '..', 'data', 'world-borders.json'), json);
console.log('países:', out.length, 'bytes:', json.length);
const want = ['170', '484', '840', '076', '152', '528', '276', '710', '818', '784', '156', '356', '392', '036', '591'];
console.log('faltan:', want.filter((w) => !out.some((o) => o.id === w)));
