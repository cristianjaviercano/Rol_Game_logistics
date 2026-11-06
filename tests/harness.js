// Arnés de pruebas en vacío: carga la clase Component de cada artboard .dc.html,
// la instancia con un DCLogic simulado y ejecuta casos con clics simulados.
const fs = require('fs');
const path = require('path');

const DIR = process.argv[2];

class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; }
  setState(u) {
    const patch = typeof u === 'function' ? u(this.state, this.props) : u;
    if (patch) this.state = Object.assign({}, this.state, patch);
  }
}

function load(file, props) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf8');
  const m = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('sin script: ' + file);
  const Component = new Function('DCLogic', m[1] + '\nreturn Component;')(DCLogic);
  return new Component(props || {});
}

const results = [];
function test(screen, id, name, fn) {
  try {
    const out = fn();
    results.push({ screen, id, name, status: out && out.finding ? 'HALLAZGO' : 'OK', detail: (out && out.detail) || '' });
  } catch (e) {
    results.push({ screen, id, name, status: 'FALLA', detail: e.message });
  }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' esperado ' + JSON.stringify(b) + ', obtenido ' + JSON.stringify(a)); }
function ok(c, msg) { if (!c) throw new Error(msg || 'condición falsa'); }
const v = (c) => c.renderVals();

// ---------- Consola del Superusuario ----------
const launch = (c, i) => { v(c).events[i].fire(); c.confirmYes(); };
test('Consola', 'M1', 'Estado inicial: 8 eventos inactivos y USD a 3.200', () => {
  const c = load('Main.dc.html'); const r = v(c);
  eq(r.events.length, 8, 'eventos'); ok(r.events.every((e) => e.pressed === 'false'), 'eventos activos');
  eq(r.fx[0].rate, '3.200', 'USD');
});
test('Consola', 'M2', 'Devaluación: USD +12 %, noticia nueva y margen exportador sube', () => {
  const c = load('Main.dc.html'); const n0 = v(c).news.length;
  launch(c, 0); const r = v(c);
  eq(r.fx[0].rate, '3.584', 'USD'); eq(r.fx[0].delta, '+12,0 %', 'delta'); eq(r.news.length, n0 + 1, 'noticias');
  const cafe = r.companies.filter((x) => x.name === 'Café Sinú S.A.S.')[0]; eq(cafe.margen, '16,7 %', 'margen Café Sinú');
});
test('Consola', 'M3', 'Tormenta: alerta de Cartagena y OTIF de Café Sinú resaltado', () => {
  const c = load('Main.dc.html'); launch(c, 1); const r = v(c);
  ok(r.alerts.some((a) => /Cartagena/.test(a.text)), 'alerta'); const cafe = r.companies.filter((x) => x.name === 'Café Sinú S.A.S.')[0];
  eq(cafe.otif, '83 %', 'OTIF'); ok(/D62839/.test(cafe.otifStyle), 'OTIF sin color de alerta');
});
test('Consola', 'M4', 'Desactivar un evento pide confirmación, lo normaliza y lo anuncia', () => {
  const c = load('Main.dc.html'); launch(c, 3); v(c).events[3].fire(); ok(/Normalizar/.test(v(c).confirm.title), 'sin confirmación de normalizar'); c.confirmYes(); const r = v(c);
  ok(/Se normaliza/.test(r.news[0].text), 'sin noticia de normalización'); eq(r.alerts.length, 0, 'alertas');
});
test('Consola', 'M5', 'Vista nocturna conmuta la paleta', () => {
  const c = load('Main.dc.html'); eq(v(c).t.bg, '#F7F8FC'); v(c).toggleNight(); eq(v(c).t.bg, '#0B1320'); eq(v(c).nightLabel, 'Vista clara');
});
test('Consola', 'M6', 'Ranking ordenado por margen descendente', () => {
  const c = load('Main.dc.html'); launch(c, 4); const r = v(c);
  const ms = r.companies.map((x) => parseFloat(x.margen.replace(',', '.'))); ok(ms.every((m, i) => i === 0 || ms[i - 1] >= m), 'orden');
});
test('Consola', 'M7', 'Mar Rojo pinta a Egipto en el mapa político', () => {
  const c = load('Main.dc.html'); eq(c.alertCountries({ marrojo: true }).join(), '818');
});
test('Consola', 'M8', 'Historial de noticias limitado a 12', () => {
  const c = load('Main.dc.html'); for (let i = 0; i < 10; i++) launch(c, i % 8); eq(v(c).news.length, 12);
});
test('Consola', 'M9', 'Pausar partida cambia estado, etiqueta y botón', () => {
  const c = load('Main.dc.html'); eq(v(c).live.label, 'En vivo'); v(c).togglePause(); const r = v(c);
  eq(c.state.paused, true); eq(r.live.label, 'En pausa'); eq(r.live.cta, 'Reanudar partida'); eq(r.live.pressed, 'true');
  v(c).togglePause(); eq(v(c).live.label, 'En vivo');
});
test('Consola', 'M10', 'Cada empresa muestra qué eventos la afectan y cuánto cambió', () => {
  const c = load('Main.dc.html'); launch(c, 1); launch(c, 7); const r = v(c);
  const cafe = r.companies.filter((x) => x.name === 'Café Sinú S.A.S.')[0];
  eq(cafe.causes.map((z) => z.label).join(), 'Tormenta,Pandemia'); ok(/OTIF −15 pp/.test(cafe.delta), cafe.delta);
  const rot = r.companies.filter((x) => x.name === 'Rotterdam Foods B.V.')[0]; eq(rot.causes.length, 1);
});
test('Consola', 'M11', 'Lanzar un evento exige confirmar y muestra a quién afecta; cancelar no cambia nada', () => {
  const c = load('Main.dc.html'); v(c).events[1].fire(); let r = v(c);
  eq(r.confirmOpen, true); ok(/Caribe Line/.test(r.confirm.hit), 'sin empresas afectadas'); eq(r.events[1].pressed, 'false', 'se activó sin confirmar');
  r.confirmNo(); r = v(c); eq(r.confirmOpen, false); eq(c.state.active.tormenta, undefined);
});
test('Consola', 'M12', 'Deshacer durante 10 s revierte el evento y retira la noticia', () => {
  const c = load('Main.dc.html'); const n0 = c.state.news.length; launch(c, 6); let r = v(c);
  eq(r.undoOpen, true); eq(r.undo.left, 10); r.undoDo(); r = v(c);
  eq(c.state.active.marrojo, false); eq(c.state.news.length, n0); eq(r.undoOpen, false); eq(r.alerts.length, 0);
});

// ---------- Gerente Comercial ----------
test('Comercial', 'C1', 'CIF por defecto: 5 tramos del vendedor y seguro del 110 %', () => {
  const c = load('Comercial.dc.html'); const r = v(c);
  eq(r.legs.filter((l) => l.who === 'Vendedor').length, 5); ok(/110/.test(r.risk), 'riesgo sin 110 %');
});
test('Comercial', 'C2', 'EXW: el vendedor solo embala', () => {
  const c = load('Comercial.dc.html'); v(c).terms[0].pick(); const r = v(c);
  eq(r.legs.filter((l) => l.who === 'Vendedor').map((l) => l.label).join(), 'Embalaje');
});
test('Comercial', 'C3', 'FOB: el riesgo pasa a bordo en origen', () => {
  const c = load('Comercial.dc.html'); v(c).terms[1].pick(); ok(/a bordo/.test(v(c).risk));
});
test('Comercial', 'C4', 'DAP: el seguro aparece como opcional para el vendedor', () => {
  const c = load('Comercial.dc.html'); v(c).terms[3].pick(); const seg = v(c).legs.filter((l) => l.label === 'Seguro')[0];
  eq(seg.who, 'Vendedor (opcional)');
});
test('Comercial', 'C5', 'El precio ofertado cambia con el Incoterm', () => {
  const c = load('Comercial.dc.html'); const got = {};
  v(c).terms.forEach((tm, i) => { v(c).terms[i].pick(); got[tm.code] = v(c).price; });
  eq(JSON.stringify(got), JSON.stringify({ EXW: '42.600', FOB: '44.000', CIF: '48.100', DAP: '49.300' }));
});
test('Comercial', 'C6', 'Enviar oferta sin visto del CEO avisa y no envía', () => {
  const c = load('Comercial.dc.html'); v(c).sendOffer(); const r = v(c); eq(c.state.sent, false); ok(/visto del CEO/.test(r.status), r.status);
});
test('Comercial', 'C7', 'Con visto aprobado la oferta se envía con precio y término', () => {
  const c = load('Comercial.dc.html'); v(c).askCEO(); eq(c.state.visto, 'pedido'); clearTimeout(c.vt); c.setState({ visto: 'ok' });
  v(c).sendOffer(); const r = v(c); eq(c.state.sent, true); ok(/USD 48\.100 CIF/.test(r.status), r.status); eq(r.cta.send, 'Oferta enviada');
});
test('Comercial', 'C8', 'Cambiar de Incoterm anula el visto previo', () => {
  const c = load('Comercial.dc.html'); c.setState({ visto: 'ok' }); v(c).terms[3].pick(); eq(c.state.visto, 'none');
});
test('Comercial', 'C9', 'Alza de fletes en la consola sube el precio CIF y se explica', () => {
  const c = load('Comercial.dc.html'); c.setState({ world: { active: { flete: true } } }); const r = v(c);
  eq(r.price, '48.800'); ok(r.notes.some((n) => /flete/.test(n.text)), 'sin nota');
});

// ---------- CFO ----------
test('CFO', 'F1', 'Pagar el flete exige confirmar y luego descuenta USD 3.700', () => {
  const c = load('CFO.dc.html'); v(c).bills[0].pay(); let r = v(c);
  eq(r.bills[0].asking, true); eq(r.balances[1].value, '86.400', 'descontó sin confirmar'); ok(/11\.840\.000/.test(r.bills[0].ask), r.bills[0].ask);
  r.bills[0].yes(); r = v(c); eq(r.balances[1].value, '82.700'); eq(r.bills[0].isPaid, true);
});
test('CFO', 'F2', 'Pagar embalaje descuenta COP 4.200.000', () => {
  const c = load('CFO.dc.html'); v(c).bills[2].pay(); v(c).bills[2].yes(); eq(v(c).balances[0].value, '408.300.000');
});
test('CFO', 'F3', 'Un pago confirmado no se puede revertir', () => {
  const c = load('CFO.dc.html'); v(c).bills[0].pay(); v(c).bills[0].yes(); const r = v(c);
  eq(r.bills[0].canPay, false); eq(r.bills[0].isPaid, true); v(c).bills[0].no(); eq(c.state.paid.flete, true);
});
test('CFO', 'F4', 'La alerta de devaluación depende del estado de la partida', () => {
  const c = load('CFO.dc.html'); ok(/Sin alertas/.test(v(c).banner.title), 'banner sin evento');
  c.setState({ world: { active: { devaluacion: true } } }); const r = v(c); ok(/devalúa/.test(r.banner.title)); ok(/13\.260\.800 a 3\.584/.test(r.bills[0].ask), r.bills[0].ask);
});
test('CFO', 'F5', 'Convertir USD 10.000 a 3.200 suma COP 32.000.000', () => {
  const c = load('CFO.dc.html'); v(c).conv.toggle(); let r = v(c); eq(r.conv.open, true); ok(/32\.000\.000/.test(r.conv.result), r.conv.result);
  r.conv.yes(); r = v(c); eq(r.balances[1].value, '76.400'); eq(r.balances[0].value, '444.500.000'); eq(r.conv.done, true);
});
test('CFO', 'F6', 'Con devaluación la conversión usa 3.584', () => {
  const c = load('CFO.dc.html'); c.setState({ world: { active: { devaluacion: true } }, conv: true }); ok(/35\.840\.000/.test(v(c).conv.result), v(c).conv.result);
});

// ---------- Retos ECAES ----------
test('Retos', 'A1', 'Respuesta correcta en Incoterms da levante', () => {
  const c = load('Aduana.dc.html'); v(c).options[1].pick(); const r = v(c); ok(r.answered); ok(/Correcto/.test(r.fbTitle));
});
test('Retos', 'A2', 'Respuesta incorrecta retiene y no se puede cambiar', () => {
  const c = load('Aduana.dc.html'); v(c).options[0].pick(); v(c).options[1].pick(); const r = v(c);
  ok(/Incorrecto/.test(r.fbTitle)); eq(c.state.picks.incoterms, 'A');
});
test('Retos', 'A3', 'Durante la inspección los demás ejes están bloqueados', () => {
  const c = load('Aduana.dc.html'); let r = v(c); eq(r.topics[0].locked, 'true'); r.topics[0].pick(); r = v(c);
  eq(c.state.topic, 'incoterms'); ok(/inspección en curso/.test(r.note), r.note);
});
test('Retos', 'A4', 'Tiempo agotado bloquea la respuesta', () => {
  const c = load('Aduana.dc.html'); const now = Date.now(); c.setState({ started: { incoterms: now - 91000 }, now: now });
  v(c).options[1].pick(); const r = v(c); ok(/agotado/.test(r.fbTitle)); eq(c.state.picks.incoterms, undefined);
});
test('Retos', 'A5', 'Los 6 ejes tienen respuesta correcta válida', () => {
  const c = load('Aduana.dc.html'); const b = c.bank(); const keys = Object.keys(b); eq(keys.length, 6);
  keys.forEach((k) => ok(b[k].options.some((o) => o.id === b[k].ok), 'eje ' + k));
});
test('Retos', 'A6', 'Cambiar de eje no reinicia el cronómetro de una pregunta', () => {
  const c = load('Aduana.dc.html'); v(c).options[1].pick(); v(c).topics[0].pick();
  const now = Date.now(); c.setState({ started: Object.assign({}, c.state.started, { aduanas: now - 87000 }), now: now });
  v(c).topics[2].pick(); v(c).topics[0].pick(); const left = c.left('aduanas');
  ok(left <= 3, 'quedan ' + left + ' s'); ok(/sigue corriendo/.test(v(c).note));
});
test('Retos', 'A7', 'Una nueva inspección de la consola salta al siguiente eje sin responder', () => {
  const c = load('Aduana.dc.html'); v(c).options[1].pick(); c.newInspection(); const r = v(c);
  eq(c.state.insp, 'geografia'); eq(c.state.topic, 'geografia'); ok(/INSPECCIÓN/.test(r.modeLabel)); eq(r.topics[0].locked, 'true');
});
test('Retos', 'A8', 'En práctica la retroalimentación no aplica sanciones', () => {
  const c = load('Aduana.dc.html'); v(c).options[1].pick(); v(c).topics[0].pick(); v(c).options[0].pick(); const r = v(c);
  eq(r.fbTitle, 'Incorrecto'); ok(!/Sanción/.test(r.fbText)); ok(/PRÁCTICA/.test(r.modeLabel));
});

// ---------- Planificador de transporte ----------
test('Tráfico', 'T1', 'Exportación por defecto: 1 × 40 pies Reefer, sin alertas', () => {
  const c = load('Trafico.dc.html'); const r = v(c).r; ok(/^1 × 40 pies Reefer/.test(r.cubicaje), r.cubicaje); ok(r.clean, 'con alertas');
});
test('Tráfico', 'T2', 'Contenedor seco para carga congelada genera alerta', () => {
  const c = load('Trafico.dc.html'); v(c).steps[1].options[0].pick(); ok(v(c).r.warnings.some((w) => /refrigerado/.test(w.text)));
});
test('Tráfico', 'T3', 'Aéreo con CIF advierte que es solo marítimo', () => {
  const c = load('Trafico.dc.html'); v(c).steps[0].options[1].pick(); v(c).terms[3].pick(); ok(v(c).r.warnings.some((w) => /CIF solo aplica/.test(w.text)));
});
test('Tráfico', 'T4', 'Volver a marítimo conserva una unidad válida para la carga', () => {
  const c = load('Trafico.dc.html'); v(c).steps[0].options[1].pick(); v(c).steps[0].options[0].pick();
  const r = v(c).r;
  ok(!r.warnings.some((w) => /refrigerado/.test(w.text)), 'alerta de rechazo'); eq(c.state.sel.expo.unit, '40rf');
});
test('Tráfico', 'T5', 'Importación: 40 pies HC limitado por volumen, 35 días', () => {
  const c = load('Trafico.dc.html'); v(c).cases[1].pick(); const r = v(c).r; ok(/volumen/.test(r.cubicaje), r.cubicaje); eq(r.days, '35');
});
test('Tráfico', 'T6', 'Importación aérea: se factura peso volumétrico', () => {
  const c = load('Trafico.dc.html'); v(c).cases[1].pick(); v(c).steps[0].options[1].pick(); ok(v(c).r.warnings.some((w) => /volumétrico/.test(w.text)));
});
test('Tráfico', 'T7', 'CIP con ICC (C) advierte cobertura insuficiente', () => {
  const c = load('Trafico.dc.html'); v(c).cases[1].pick(); v(c).terms[4].pick(); v(c).steps[4].options[1].pick(); ok(v(c).r.warnings.some((w) => /ICC \(A\)/.test(w.text)));
});
test('Tráfico', 'T8', 'El Incoterm de cada caso se conserva al alternar casos', () => {
  const c = load('Trafico.dc.html'); v(c).terms[5].pick(); v(c).cases[1].pick(); v(c).cases[0].pick(); eq(c.state.terms.expo, 'DAP');
});
test('Tráfico', 'T9', 'Formato de días con decimales', () => {
  const c = load('Trafico.dc.html'); v(c).steps[2].options[1].pick(); eq(v(c).r.days, '7,5');
});

// ---------- Cadena y negociación ----------
test('Cadena', 'K1', 'Sin eventos: abastecimiento en 38 días y planta sin parada', () => {
  const c = load('Cadena.dc.html'); const k = v(c).k; eq(k.lead, 38); eq(k.stop, 0); eq(k.hhi, '10.000');
});
test('Cadena', 'K2', 'Mar Rojo sin inventario detiene la planta 12 días', () => {
  const c = load('Cadena.dc.html'); v(c).events[0].pick(); eq(v(c).k.stop, 0, 'con 15 días'); v(c).stock[0].pick(); eq(v(c).k.stop, 12, 'sin inventario');
});
test('Cadena', 'K3', 'Doble fuente reduce concentración y retraso', () => {
  const c = load('Cadena.dc.html'); v(c).events[0].pick(); v(c).stock[0].pick(); v(c).inputs[0].toggleDual(); const k = v(c).k; eq(k.hhi, '7.500'); ok(k.stop < 12, 'parada ' + k.stop);
});
test('Cadena', 'K4', 'Devaluación del COP encarece insumos importados', () => {
  const c = load('Cadena.dc.html'); const a = parseInt(v(c).k.cost.replace(/\./g, ''), 10); v(c).events[5].pick(); const b = parseInt(v(c).k.cost.replace(/\./g, ''), 10);
  ok(Math.abs(b / a - 1.12) < 0.001, 'razón ' + (b / a));
});
test('Cadena', 'K5', 'Una oferta bajo el mínimo del vendedor recibe contraoferta, no aceptación', () => {
  const c = load('Cadena.dc.html'); const n = c.negotiate(); ok(!n.accepted, 'aceptó'); ok(/USD 1,10/.test(n.reply), n.reply);
});
test('Cadena', 'K10', 'Primera ronda sobre el mínimo: contraoferta; segunda ronda: aceptación', () => {
  const c = load('Cadena.dc.html'); c.setState({ offer: Object.assign({}, c.state.offer, { price: 1.10 }) });
  c.send(); eq(c.state.deal, null, 'aceptó en la primera ronda'); ok(/Proponemos USD 1,13/.test(c.state.history[2].text), c.state.history[2].text);
  c.send(); ok(c.state.deal && c.state.deal.price === 1.10, 'no aceptó en la segunda ronda');
});
test('Cadena', 'K6', 'Oferta agresiva con cuenta abierta a 60 días y COP se rechaza', () => {
  const c = load('Cadena.dc.html'); c.setState({ offer: { qty: 1000, price: 0.95, cur: 'COP', inc: 'CIF', pay: 'Cuenta abierta', term: '60 días' } }); ok(/No podemos/.test(c.negotiate().reply));
});
test('Cadena', 'K7', 'Ofertas rechazadas añaden 2 mensajes y el historial se limita a 8', () => {
  const c = load('Cadena.dc.html'); c.setState({ offer: { qty: 1000, price: 0.95, cur: 'COP', inc: 'CIF', pay: 'Cuenta abierta', term: '60 días' } });
  for (let i = 0; i < 6; i++) c.send(); eq(c.state.history.length, 8); eq(c.state.deal, null);
});
test('Cadena', 'K8', 'Un trato aceptado fija al proveedor y su precio en la cadena', () => {
  const c = load('Cadena.dc.html'); v(c).inputs[0].options[1].pick(); eq(c.state.pick.sacos, 'fique');
  c.setState({ offer: Object.assign({}, c.state.offer, { price: 1.10 }) }); c.send(); c.send(); const r = v(c); eq(c.state.pick.sacos, 'jute'); eq(r.hasDeal, true); eq(r.inputs[0].options[0].tag, 'Contrato');
  ok(/1,10/.test(r.inputs[0].options[0].price), r.inputs[0].options[0].price); ok(/Contrato vigente/.test(r.inputs[0].summary));
  ok(c.state.history.some((h) => h.sys), 'sin mensaje de contrato');
  const n = c.state.history.length; c.send(); eq(c.state.history.length, n, 'renegoció con contrato vigente');
});
test('Cadena', 'K9', 'Rescindir el contrato devuelve el precio de lista', () => {
  const c = load('Cadena.dc.html'); c.setState({ offer: Object.assign({}, c.state.offer, { price: 1.10 }) }); c.send(); c.send(); eq(v(c).resetLabel, 'Rescindir y renegociar'); v(c).reset(); const r = v(c);
  eq(r.hasDeal, false); eq(c.state.rounds, 0); ok(/1,15/.test(r.inputs[0].options[0].price), r.inputs[0].options[0].price);
});

// ---------- Lobby ----------
test('Lobby', 'S1', 'Todas las empresas tienen país registrado', () => {
  const c = load('Seleccion.dc.html'); const w = c.world(); w.companies.forEach((x) => ok(w.countries[x.country], 'país ' + x.country));
});
test('Lobby', 'S2', 'Todos los proveedores tienen continente registrado', () => {
  const c = load('Seleccion.dc.html'); const w = c.world(); const missing = [];
  w.companies.forEach((x) => x.inputs.forEach((i) => i.options.forEach((o) => { if (!w.supCont[o[1]]) missing.push(o[1]); })));
  eq(missing.length, 0, 'sin continente: ' + missing.join(', '));
});
test('Lobby', 'S3', 'Filtro por continente', () => {
  const c = load('Seleccion.dc.html'); v(c).filters[2].pick(); eq(v(c).cards.length, 2);
});
test('Lobby', 'S4', 'La ficha sigue al filtro', () => {
  const c = load('Seleccion.dc.html'); v(c).filters[2].pick(); const r = v(c);
  ok(r.cards.some((x) => x.pressed === 'true'), 'ninguna tarjeta seleccionada'); eq(r.d.name, 'Rotterdam Foods B.V.');
});
test('Lobby', 'S5', 'El botón final refleja empresa y rol', () => {
  const c = load('Seleccion.dc.html'); v(c).roles[4].pick(); eq(v(c).roleLabel, 'CFO'); ok(/CFO de Café Sinú/.test(v(c).joinLabel));
});
test('Lobby', 'S6', 'Los roles ocupados se ven y no se pueden tomar', () => {
  const c = load('Seleccion.dc.html'); let r = v(c); eq(r.seats.free, 3); eq(r.roles[0].sub, 'Laura P.'); eq(r.roles[0].taken, 'true');
  r.roles[0].pick(); r = v(c); eq(c.state.role, 'Comercial'); ok(/ya lo ocupa/.test(r.msg), r.msg);
});
test('Lobby', 'S7', 'Unirme registra al jugador, marca "Tú" y permite salir', () => {
  const c = load('Seleccion.dc.html'); v(c).join(); let r = v(c);
  eq(c.state.joined.role, 'Comercial'); eq(r.roles[1].sub, 'Tú'); ok(/Te uniste/.test(r.msg)); eq(r.joinLabel, 'Salir del rol');
  r.join(); eq(c.state.joined, null);
});
test('Lobby', 'S8', 'Al cambiar a una empresa con el rol ocupado se elige uno libre', () => {
  const c = load('Seleccion.dc.html'); const w = c.world(); let bad = 0;
  w.companies.forEach((co) => { const role = c.firstFree(co.id, 'CEO'); if (c.seats(co.id)[role]) bad += 1; });
  eq(bad, 0);
});

// ---------- Estado compartido entre pantallas ----------
test('Integración', 'I1', 'Un evento lanzado en la consola llega al CFO, al Comercial, a Retos y a la Cadena', () => {
  const store = {}; const subs = [];
  class BC { constructor(n) { this.n = n; this.onmessage = null; subs.push(this); } postMessage(d) { subs.forEach((s) => { if (s !== this && s.n === this.n && s.onmessage) s.onmessage({ data: JSON.parse(JSON.stringify(d)) }); }); } close() { const i = subs.indexOf(this); if (i >= 0) subs.splice(i, 1); } }
  const ls = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, val) => { store[k] = String(val); } };
  const prevBC = global.BroadcastChannel;
  global.window = { localStorage: ls, BroadcastChannel: BC }; global.BroadcastChannel = BC;
  try {
    const main = load('Main.dc.html'), cfo = load('CFO.dc.html'), com = load('Comercial.dc.html'), adu = load('Aduana.dc.html'), cad = load('Cadena.dc.html');
    [cfo, com, adu, cad].forEach((x) => x.componentDidMount());
    launch(main, 0); launch(main, 4); launch(main, 1);
    ok(/devalúa/.test(v(cfo).banner.title), 'CFO'); eq(v(com).price, '48.800', 'Comercial');
    eq(cad.state.ev.devcop, true, 'Cadena devaluación'); eq(cad.state.ev.huracan, true, 'Cadena tormenta');
    v(adu).options[1].pick(); launch(main, 5); eq(adu.state.insp, 'geografia', 'Retos');
    const late = load('CFO.dc.html'); late.componentDidMount(); ok(/devalúa/.test(v(late).banner.title), 'pantalla abierta después');
    [cfo, com, adu, cad, late].forEach((x) => x.componentWillUnmount());
    clearInterval(adu.timer);
  } finally { delete global.window; global.BroadcastChannel = prevBC; }
});

fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 1));
const sum = { OK: 0, FALLA: 0, HALLAZGO: 0 };
results.forEach((r) => { sum[r.status] += 1; });
results.forEach((r) => console.log(r.status.padEnd(9), r.screen.padEnd(10), r.id.padEnd(4), r.name, r.detail ? '→ ' + r.detail : ''));
console.log(JSON.stringify(sum));
