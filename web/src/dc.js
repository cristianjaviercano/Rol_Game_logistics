// Runtime mínimo para montar las pantallas del mock-up (.dc.html) con Preact.
// Soporta lo que usan las pantallas: huecos {{a.b}} en texto y atributos, <sc-for>, <sc-if>,
// <dc-import>, ref y eventos por función, y enlaces entre pantallas (X.dc.html → #/p/X).
import { h, Fragment } from 'preact';

/* ---------- analizador de marcado ---------- */
const VOID = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : m;
});
const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

function parseValue(raw) {
  // Devuelve {lit} si no hay huecos, {hole} si es un único hueco, o {parts} si mezcla texto y huecos.
  const v = decode(raw);
  const only = v.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
  if (only) return { hole: only[1].split('.') };
  if (!v.includes('{{')) return { lit: v };
  const parts = []; let last = 0; let m;
  HOLE.lastIndex = 0;
  while ((m = HOLE.exec(v))) { if (m.index > last) parts.push(v.slice(last, m.index)); parts.push({ hole: m[1].split('.') }); last = m.index + m[0].length; }
  if (last < v.length) parts.push(v.slice(last));
  return { parts };
}

export function parse(src) {
  const root = { tag: '#root', attrs: [], children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) { // cierre
      const name = m[1];
      for (let i = stack.length - 1; i > 0; i--) { if (stack[i].tag === name) { stack.length = i; break; } }
      continue;
    }
    if (m[2]) {
      const tag = m[2], attrs = [];
      const ar = /([^\s=>/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g; let a;
      while ((a = ar.exec(m[3] || ''))) {
        const val = a[3] !== undefined ? a[3] : (a[4] !== undefined ? a[4] : (a[5] !== undefined ? a[5] : ''));
        attrs.push({ name: a[1], value: parseValue(val) });
      }
      const node = { tag: tag, attrs: attrs, children: [] };
      top.children.push(node);
      if (!m[4] && !VOID.has(tag.toLowerCase())) stack.push(node);
      continue;
    }
    if (m[5]) {
      const text = m[5];
      if (!text.trim()) { if (text.includes('\n')) continue; top.children.push({ text: { lit: ' ' } }); continue; }
      top.children.push({ text: parseValue(text.replace(/\s*\n\s*/g, ' ')) });
    }
  }
  return root;
}

/* ---------- evaluación ---------- */
function look(path, vals, scope) {
  let o; const first = path[0];
  if (first === 'true') return true;
  if (first === 'false') return false;
  for (let i = scope.length - 1; i >= 0; i--) { if (first in scope[i]) { o = scope[i][first]; return walk(o, path, 1); } }
  return walk(vals, path, 0);
}
function walk(o, path, i) { for (; i < path.length; i++) { if (o == null) return undefined; o = o[path[i]]; } return o; }
function evalValue(v, vals, scope) {
  if (v.lit !== undefined) return v.lit;
  if (v.hole) return look(v.hole, vals, scope);
  return v.parts.map((p) => (typeof p === 'string' ? p : (() => { const x = look(p.hole, vals, scope); return x == null ? '' : String(x); })())).join('');
}
const camel = (s) => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());

export function renderTree(node, vals, scope, ctx) {
  const out = [];
  node.children.forEach((c, i) => {
    const r = renderNode(c, vals, scope, ctx, i);
    if (Array.isArray(r)) r.forEach((x) => out.push(x)); else if (r != null) out.push(r);
  });
  return out;
}

function renderNode(n, vals, scope, ctx, key) {
  if (n.text) { const t = evalValue(n.text, vals, scope); return t == null ? '' : String(t); }
  const attr = (name) => { const a = n.attrs.find((x) => x.name === name); return a ? evalValue(a.value, vals, scope) : undefined; };
  if (n.tag === 'sc-for') {
    const list = attr('list') || [], as = attr('as') || 'item';
    return (Array.isArray(list) ? list : []).map((item, i) => h(Fragment, { key: i }, renderTree(n, vals, scope.concat([{ [as]: item }]), ctx)));
  }
  if (n.tag === 'sc-if') {
    return attr('value') ? renderTree(n, vals, scope, ctx) : null;
  }
  if (n.tag === 'dc-import') {
    const props = {};
    n.attrs.forEach((a) => { if (a.name !== 'name' && !a.name.startsWith('hint-')) props[camel(a.name)] = evalValue(a.value, vals, scope); });
    return h(ctx.Host, { key: key, screen: attr('name'), props: props, embedded: true });
  }
  const props = { key: key };
  n.attrs.forEach((a) => {
    if (a.name.startsWith('hint-')) return;
    let v = evalValue(a.value, vals, scope);
    if (a.name === 'href' && typeof v === 'string' && /\.dc\.html$/.test(v)) v = '#/p/' + v.replace('.dc.html', '');
    if (a.name === 'ref') { if (typeof v === 'function') props.ref = v; return; }
    if (/^on[A-Z]/.test(a.name)) { if (typeof v === 'function') props[a.name] = v; return; }
    if (v === false || v == null) return;
    props[a.name] = v === true ? '' : v;
  });
  return h(n.tag, props, renderTree(n, vals, scope, ctx));
}
