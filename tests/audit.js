// Auditoría estática: botones sin acción, objetivos táctiles < 44 px, textos < 12 px y contraste WCAG.
const fs = require('fs');
const path = require('path');
const DIR = process.argv[2];
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.dc.html'));

const out = { dead: [], small: [], tinyText: {}, contrast: [] };
for (const f of files) {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const markup = html.split('<script type="text/x-dc"')[0];
  const buttons = markup.match(/<button[\s\S]*?<\/button>/g) || [];
  buttons.forEach((b) => {
    const label = b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/onClick=/.test(b)) out.dead.push(f + ' · "' + label + '"');
    const mh = b.match(/min-height:\s*(\d+)px/);
    if (mh && Number(mh[1]) < 44) out.small.push(f + ' · "' + label + '" (' + mh[1] + ' px)');
  });
  const script = html.split('<script type="text/x-dc"')[1] || '';
  const mhs = script.match(/min-height:\s*(\d+)px/g) || [];
  mhs.forEach((m) => { const n = Number(m.match(/\d+/)[0]); if (n < 44) out.small.push(f + ' · botón generado en lógica (' + n + ' px)'); });
  const sizes = (html.match(/font-size:\s*(\d+(?:\.\d+)?)px/g) || []).map((s) => Number(s.match(/[\d.]+/)[0]));
  out.tinyText[f] = sizes.filter((s) => s < 12).length;
}

// Contraste WCAG 2.1
const lum = (hex) => {
  const c = hex.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ['Texto principal sobre fondo', '#14213D', '#F7F8FC', 13],
  ['Texto secundario sobre fondo', '#55627A', '#F7F8FC', 12],
  ['Texto secundario sobre tarjeta amarilla', '#55627A', '#FFF4CC', 12],
  ['Texto secundario sobre tarjeta azul', '#55627A', '#E4ECFF', 12],
  ['Texto secundario sobre tarjeta rosa', '#55627A', '#FFE3E6', 12],
  ['Botón primario (blanco sobre azul)', '#FFFFFF', '#1F5EFF', 14],
  ['Alerta (blanco sobre rojo)', '#FFFFFF', '#D62839', 13],
  ['Texto de alerta rojo sobre fondo', '#D62839', '#F7F8FC', 12],
  ['Texto de alerta sobre tarjeta rosa (Comercial, #B01F2E)', '#B01F2E', '#FFE3E6', 12],
  ['Exposición (rojo oscuro sobre rosa)', '#B01F2E', '#FFE3E6', 12],
  ['Etiqueta Comprador (café sobre amarillo)', '#6B4E00', '#FFF4CC', 12],
  ['Botón de evento activo (blanco sobre rojo)', '#FFFFFF', '#D62839', 12],
  ['Valor en azul sobre blanco', '#1F5EFF', '#FFFFFF', 18],
  ['Texto sobre amarillo intenso', '#14213D', '#FFC93C', 13],
  ['Nocturno: texto secundario sobre tarjeta', '#9FB0C3', '#0F1A2B', 12],
  ['Nocturno: ámbar sobre tarjeta', '#F2A93B', '#0F1A2B', 12],
  ['Nocturno: botón cian', '#06201F', '#3DD6D0', 14],
  ['Leyenda continente (texto sobre amarillo mapa)', '#14213D', '#FFD34D', 30]
];
pairs.forEach(([name, fg, bg, size]) => {
  const r = ratio(fg, bg);
  const need = size >= 18 ? 3 : 4.5;
  out.contrast.push({ name, fg, bg, ratio: Math.round(r * 100) / 100, need, pass: r >= need });
});

fs.writeFileSync(path.join(__dirname, 'audit.json'), JSON.stringify(out, null, 1));
console.log('BOTONES SIN ACCIÓN', out.dead.length); out.dead.forEach((d) => console.log('  ', d));
console.log('OBJETIVOS < 44 px', out.small.length); out.small.forEach((d) => console.log('  ', d));
console.log('TEXTOS < 12 px', JSON.stringify(out.tinyText));
out.contrast.forEach((c) => console.log((c.pass ? 'OK  ' : 'FALLA'), c.ratio, '≥', c.need, c.name));
