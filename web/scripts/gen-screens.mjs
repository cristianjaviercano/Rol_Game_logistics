// Convierte cada mockup/*.dc.html en un módulo que la app puede montar fuera del lienzo de Claude.
// No modifica las pantallas: extrae su marcado (<x-dc>), su clase (script x-dc) y sus props por defecto.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const MOCK = join(here, '..', '..', 'mockup');
const OUT = join(here, '..', 'src', 'screens.gen.js');

const files = readdirSync(MOCK).filter((f) => f.endsWith('.dc.html')).sort();
let out = '// Archivo generado por scripts/gen-screens.mjs a partir de mockup/*.dc.html. No editar a mano.\n';
const names = [];
for (const f of files) {
  const name = f.replace('.dc.html', '');
  const html = readFileSync(join(MOCK, f), 'utf8');
  const xdc = html.match(/<x-dc>([\s\S]*?)<\/x-dc>/);
  if (!xdc) throw new Error('Sin <x-dc> en ' + f);
  const markup = xdc[1].replace(/<helmet>[\s\S]*?<\/helmet>/, '').trim();
  const sm = html.match(/<script type="text\/x-dc" data-dc-script data-props='([^']*)'>([\s\S]*?)<\/script>/);
  if (!sm) throw new Error('Sin script x-dc en ' + f);
  const meta = JSON.parse(sm[1]);
  const defaults = {};
  Object.keys(meta).forEach((k) => { if (k[0] !== '$' && meta[k] && 'default' in meta[k]) defaults[k] = meta[k].default; });
  const preview = meta.$preview || { width: 1440, height: 1000 };
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || name;
  out += '\nexport const ' + name + ' = {\n'
    + '  name: ' + JSON.stringify(name) + ',\n'
    + '  title: ' + JSON.stringify(title) + ',\n'
    + '  preview: ' + JSON.stringify(preview) + ',\n'
    + '  defaults: ' + JSON.stringify(defaults) + ',\n'
    + '  markup: ' + JSON.stringify(markup) + ',\n'
    + '  make: function (DCLogic) {\n' + sm[2] + '\n    return Component;\n  }\n};\n';
  names.push(name);
}
out += '\nexport const SCREENS = { ' + names.join(', ') + ' };\n';
writeFileSync(OUT, out);
console.log('Pantallas generadas:', names.join(', '));
