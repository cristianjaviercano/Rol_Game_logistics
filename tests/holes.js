// Verifica que cada {{hueco}} del markup exista en renderVals() (o sea un alias de sc-for).
const fs = require('fs'), path = require('path');
const DIR = process.argv[2];
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(u) { const p = typeof u === 'function' ? u(this.state, this.props) : u; if (p) this.state = Object.assign({}, this.state, p); } }
let bad = 0;
fs.readdirSync(DIR).filter((f) => f.endsWith('.dc.html')).forEach((f) => {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const markup = html.split('<script type="text/x-dc"')[0];
  const code = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
  const C = new Function('DCLogic', code + '\nreturn Component;')(DCLogic);
  const vals = new C({}).renderVals();
  const aliases = new Set([...markup.matchAll(/as="([^"]+)"/g)].map((m) => m[1]));
  const missing = new Set();
  [...markup.matchAll(/\{\{([^}]+)\}\}/g)].forEach((m) => {
    const parts = m[1].trim().split('.');
    if (aliases.has(parts[0]) || parts[0] === 'false' || parts[0] === 'true') return;
    let o = vals; for (const p of parts) { if (o == null || !(p in o)) { missing.add(m[1]); return; } o = o[p]; }
  });
  if (missing.size) { bad += 1; console.log(f, [...missing].join(', ')); } else console.log(f, 'OK');
});
process.exit(bad ? 1 : 0);
