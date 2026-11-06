// Pruebas en vacío del juego de cartas: turno guiado por fase, bitácora de decisiones y enlace con el Superusuario.
const fs = require('fs'), path = require('path');
const DIR = process.argv[2];
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(u) { const p = typeof u === 'function' ? u(this.state, this.props) : u; if (p) this.state = Object.assign({}, this.state, p); } }
const load = (f) => { const h = fs.readFileSync(path.join(DIR, f), 'utf8'); return new (new Function('DCLogic', h.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1] + '\nreturn Component;')(DCLogic))({}); };
const results = [];
const test = (id, name, fn) => { try { fn(); results.push({ id, name, status: 'OK' }); } catch (e) { results.push({ id, name, status: 'FALLA', detail: e.message }); } };
const eq = (a, b, m) => { if (a !== b) throw new Error((m || '') + ' esperado ' + JSON.stringify(b) + ', obtenido ' + JSON.stringify(a)); };
const ok = (c, m) => { if (!c) throw new Error(m || 'condición falsa'); };
const v = (c) => c.renderVals();
const card = (c, name) => { let x = v(c).cards.find((k) => k.name === name); if (!x) { c.setState({ tab: 'mano' }); x = v(c).cards.find((k) => k.name === name); } if (!x) throw new Error('no está la carta ' + name); x.pick(); };
const slot = (c, i) => v(c).slots[i].pick();
const as = (c, role) => c.setState({ role });
const go = (c, phase) => { let n = 0; while (c.phaseName() !== phase && n++ < 10) c.advance(); eq(c.phaseName(), phase, 'fase'); };
const emit = (c, name, opt) => { c.setState({ tab: 'archivo' }); card(c, name); v(c).actions[0].run(); v(c).quiz.options.find((o) => o.id === opt).pick(); };
global.setTimeout = (f) => f();

test('G1', 'Empieza en Mercado: solo el Comercial tiene turno', () => {
  const c = load('Jugador.dc.html'); const r = v(c);
  eq(c.phaseName(), 'Mercado'); ok(/TURNO DE COMERCIAL/.test(r.guide.kicker), r.guide.kicker);
  as(c, 'Tráfico'); card(c, 'Tractomula seca'); slot(c, 0); ok(/en espera/.test(c.state.msg.text), c.state.msg.text); eq(c.state.board.origen.length, 0);
});
test('G2', 'El Comercial elige FOB: flete y seguro pasan al comprador y baja el precio', () => {
  const c = load('Jugador.dc.html'); v(c).decisions[0].run(); eq(v(c).quizOpen, true);
  v(c).quiz.options[1].pick(); const r = v(c);
  eq(c.state.incoterm, 'FOB'); eq(r.c.price, '44.000'); eq(r.slots[2].badge, 'Comprador'); eq(r.slots[3].badge, 'Comprador');
  eq(c.state.log[0].role, 'Comercial'); ok(/FOB/.test(c.state.log[0].decision));
  v(c).decisions[0].run(); ok(/ya se decidió/.test(c.state.msg.text), c.state.msg.text);
});
test('G3', 'Se roba solo en Robo, una vez por ronda, y no se avanza con más de 8 cartas', () => {
  const c = load('Jugador.dc.html'); as(c, 'Tráfico'); c.draw(); ok(/fase Robo/.test(c.state.msg.text));
  go(c, 'Robo'); v(c).decisions[0].run(); eq(c.state.hand.length, 10); c.draw(); ok(/ya robó/.test(c.state.msg.text));
  c.advance(); eq(c.phaseName(), 'Robo', 'avanzó con 10 cartas');
  card(c, 'Carga aérea en pallets'); c.toArchive(); card(c, 'Tractomula refrigerada'); c.discardSel(); c.advance(); eq(c.phaseName(), 'Planeación');
});
test('G4', 'En Reacción solo entran coberturas', () => {
  const c = load('Jugador.dc.html'); go(c, 'Reacción'); as(c, 'CFO'); card(c, 'Póliza ICC (C)'); slot(c, 3);
  ok(/solo se juegan coberturas/.test(c.state.msg.text), c.state.msg.text);
  card(c, 'Forward de venta USD'); v(c).cob.pick(); eq(c.state.board.cobertura[0], 'fwd');
});
const fillCIF = (c, docsOk) => {
  go(c, 'Planeación'); as(c, 'Tráfico'); card(c, 'Tractomula seca'); slot(c, 0); card(c, "2 × 40' High Cube"); slot(c, 2);
  as(c, 'CFO'); card(c, 'Póliza ICC (C)'); slot(c, 3);
  as(c, 'Aduanas'); emit(c, 'Factura comercial', 'A'); emit(c, 'Lista de empaque', 'B'); emit(c, 'Declaración de exportación', 'A');
};
test('G5', 'El CEO no puede dar visto con faltantes y la devuelve con motivo', () => {
  const c = load('Jugador.dc.html'); fillCIF(c); go(c, 'Visto del CEO'); as(c, 'CEO');
  v(c).decisions[0].run(); ok(/No puedes aprobar/.test(c.state.msg.text), c.state.msg.text); eq(c.state.visto, 'none');
  v(c).decisions[1].run(); v(c).quiz.options[0].pick(); eq(c.state.visto, 'devuelta'); ok(/devolvió/i.test(c.state.log[c.state.log.length - 1].decision));
});
test('G6', 'Tras devolver, la ronda siguiente recupera jugadas y permite completar, aprobar y liquidar', () => {
  const c = load('Jugador.dc.html'); fillCIF(c); go(c, 'Visto del CEO'); as(c, 'CEO'); v(c).decisions[1].run(); v(c).quiz.options[0].pick();
  go(c, 'Liquidación'); eq(c.state.executed, null, 'liquidó sin visto'); ok(/devuelta/.test(c.state.msg.text));
  c.advance(); eq(c.phaseName(), 'Mercado'); eq(c.state.round, 4); eq(c.state.visto, 'none'); eq(c.playsLeft('Aduanas'), 3);
  go(c, 'Planeación'); as(c, 'Aduanas'); emit(c, 'Certificado fitosanitario', 'B');
  go(c, 'Visto del CEO'); as(c, 'CEO'); v(c).decisions[0].run(); eq(c.state.visto, 'aprobada');
  go(c, 'Liquidación'); ok(c.state.executed && c.state.executed.otif, 'no liquidó con OTIF');
});
test('G7', 'Con visto, solo se admiten coberturas y la operación se liquida al entrar en Liquidación', () => {
  const c = load('Jugador.dc.html'); fillCIF(c); c.setState({ plays: {} }); as(c, 'Aduanas'); emit(c, 'Certificado fitosanitario', 'B');
  go(c, 'Visto del CEO'); as(c, 'CEO'); v(c).decisions[0].run(); eq(c.state.visto, 'aprobada');
  go(c, 'Reacción'); as(c, 'Riesgos'); card(c, 'Ruta alterna: Santa Marta'); v(c).cob.pick(); eq(c.state.board.cobertura.length, 1);
  go(c, 'Liquidación'); ok(c.state.executed, 'no liquidó'); const r = v(c); ok(/puntos/.test(r.resultTitle)); eq(r.roleSum.length, 6);
});
test('G8', 'En la fase Evento nadie del equipo tiene turno', () => {
  const c = load('Jugador.dc.html'); go(c, 'Evento'); ok(/SIN TURNO/.test(v(c).guide.kicker)); ['CEO', 'Comercial', 'Tráfico', 'Aduanas', 'CFO', 'Riesgos'].forEach((r) => eq(c.isActive(r), false, r));
});
test('G9', 'Con FOB el alza de fletes no toca el margen', () => {
  const c = load('Jugador.dc.html'); v(c).decisions[0].run(); v(c).quiz.options[1].pick(); c.setState({ world: { active: { flete: true } } });
  const r = c.evaluate(); eq(r.costs.eventos, 0); ok(r.events[0].text.indexOf('FOB') >= 0);
});
test('B1', 'La bitácora registra la alternativa y la diferencia de costo', () => {
  const c = load('Jugador.dc.html'); go(c, 'Planeación'); as(c, 'Tráfico'); card(c, 'Tractomula refrigerada'); slot(c, 0);
  as(c, 'CFO'); card(c, 'Póliza ICC (A)'); slot(c, 3);
  const [a, b] = c.state.log.slice(-2);
  eq(a.delta, 800); ok(/Tractomula seca/.test(a.alt), a.alt); eq(b.delta, 185); ok(/ICC \(C\)/.test(b.alt), b.alt);
  c.setState({ tab: 'bitacora' }); eq(v(c).log.length, c.state.log.length);
});
test('B2', 'Deshacer una jugada borra su registro de la bitácora', () => {
  const c = load('Jugador.dc.html'); go(c, 'Planeación'); as(c, 'Tráfico'); card(c, 'Tractomula seca'); slot(c, 0); const n = c.state.log.length;
  c.undo(); eq(c.state.log.length, n - 1); eq(c.state.board.origen.length, 0);
});
test('B3', 'Un documento con error queda en la bitácora con USD 500 y en el resumen de Aduanas', () => {
  const c = load('Jugador.dc.html'); go(c, 'Planeación'); as(c, 'Aduanas'); emit(c, 'Factura comercial', 'B');
  const e = c.state.log[c.state.log.length - 1]; eq(e.delta, 500); eq(e.role, 'Aduanas');
  const rs = c.roleSummary(c.theme()).find((x) => x.role === 'Aduanas'); ok(/USD 500/.test(rs.text), rs.text);
});
test('I1', 'Con el Superusuario conectado, él controla la fase y la liquidación ocurre al cambiarla', () => {
  const store = {}, subs = [];
  class BC { constructor(n) { this.n = n; this.onmessage = null; subs.push(this); } postMessage(d) { subs.forEach((s) => { if (s !== this && s.n === this.n && s.onmessage) s.onmessage({ data: JSON.parse(JSON.stringify(d)) }); }); } close() {} }
  const prev = global.BroadcastChannel;
  global.window = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, x) => { store[k] = String(x); } }, BroadcastChannel: BC }; global.BroadcastChannel = BC;
  try {
    const gm = load('Mesa.dc.html'), pl = load('Jugador.dc.html');
    gm.cv = null; gm.tryInit = () => {}; gm.componentDidMount(); pl.componentDidMount(); clearInterval(gm.sec);
    eq(pl.state.connected, true); eq(pl.phaseName(), 'Planeación');
    pl.advance(); ok(/Superusuario/.test(pl.state.msg.text));
    fillCIF(pl); as(pl, 'Aduanas'); pl.setState({ plays: {} }); emit(pl, 'Certificado fitosanitario', 'B');
    gm.nextPhase(); eq(pl.phaseName(), 'Visto del CEO'); as(pl, 'CEO'); v(pl).decisions[0].run(); eq(pl.state.visto, 'aprobada');
    eq(v(gm).left[0].cardsLine.indexOf('visto del CEO: aprobado') >= 0, true, 'el Superusuario no ve el visto');
    gm.nextPhase(); gm.nextPhase(); gm.nextPhase(); eq(pl.phaseName(), 'Liquidación'); ok(pl.state.executed, 'no liquidó');
    gm.nextPhase(); eq(pl.phaseName(), 'Mercado'); eq(pl.playsLeft('Tráfico'), 3);
  } finally { delete global.window; global.BroadcastChannel = prev; }
});

results.forEach((r) => console.log(r.status.padEnd(6), r.id.padEnd(4), r.name, r.detail ? '→ ' + r.detail : ''));
const f = results.filter((r) => r.status !== 'OK').length; console.log(JSON.stringify({ OK: results.length - f, FALLA: f }));
