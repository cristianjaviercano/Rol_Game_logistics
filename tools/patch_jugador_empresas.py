"""Hace la Mesa del jugador multiempresa (Café Sinú, Acuícola del Sinú, Shenzhen Parts) y con roles por persona.

Se aplicó una vez sobre mockup/Jugador.dc.html; queda como registro del cambio. Uso: python3 tools/patch_jugador_empresas.py
"""
from pathlib import Path

p = Path(__file__).resolve().parent.parent / 'mockup' / 'Jugador.dc.html'
s = p.read_text(encoding='utf-8')
if 'caso() {' in s:
    raise SystemExit('Ya aplicado.')


def R(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (c, a[:90])
    s = s.replace(a, b)


# ---------- marcado
R('background: {{t.pBlue}}">Café Sinú S.A.S. · Colombia · COP</span>', 'background: {{t.pBlue}}">{{emp.label}}</span>')
R("font-weight: 600\">Mesa de operación · Montería → Cartagena → Rotterdam</h1>", "font-weight: 600\">{{emp.route}}</h1>")
R('data-props=\'{"nocturno":{"editor":"boolean","default":false},', 'data-props=\'{"nocturno":{"editor":"boolean","default":false},"empresa":{"editor":null},"roles":{"editor":null},"owners":{"editor":null},')

# ---------- rol inicial: uno de los propios
R("      role: 'Comercial',", "      role: (props && Array.isArray(props.roles) && props.roles.length ? (props.roles.indexOf('Comercial') >= 0 ? 'Comercial' : props.roles[0]) : 'Comercial'),")

# ---------- casos por empresa
CASO = r'''
  caso() {
    const san = (name, q, a, b, ok) => ({ name: name, q: q, options: [{ id: 'A', text: a }, { id: 'B', text: b }], ok: ok });
    const C = {
      cafe: {
        id: 'cafe', name: 'Café Sinú S.A.S.', country: 'Colombia', cur: 'COP', peso: true, product: 'café',
        code: 'C-07', title: 'Café verde especial', buyer: 'Rotterdam Foods B.V.', qty: "2 × 40' · 38 t", fob: 44000, cif: 48100, cogs: 38000,
        plazo: 7, transit: 14, cargo: 'seca', origin: 'Montería', port: 'Cartagena', dest: 'Rotterdam', alt: 'Santa Marta', carrier: 'Caribe Line',
        cont: 2, dry: 3700, reefer: 8200, air: 76000, airText: 'USD 1,90 por kg facturable · 38 t · incluye la AWB.',
        pref: 'del acuerdo UE–Colombia', prefBonus: true, buyerZone: 'europeo', portCo: true, rtm: true, panama: false, ue: true,
        dexQ: ['¿Ante quién se presenta la declaración de exportación en Colombia?', 'La DIAN, por el sistema aduanero', 'La Cámara de Comercio'],
        san: san('Certificado fitosanitario', '¿Qué entidad certifica la condición fitosanitaria del café de exportación?', 'El Invima', 'El ICA', 'B'),
        market: [
          { id: 'C-07', title: 'Café verde especial → Rotterdam', text: "2 × 40' · USD 48.100 CIF o 44.000 FOB · embarque en 7 días.", tags: 'En curso' },
          { id: 'C-11', title: 'Tilapia congelada → Miami', text: '22 t · USD 88.000 DAP · entrega en 10 días · cadena de frío.', tags: 'Disponible' },
          { id: 'C-14', title: 'Café tostado → Yokohama', text: "1 × 40' · USD 61.500 CIP · embarque en 12 días.", tags: 'Disponible' }
        ]
      },
      acui: {
        id: 'acui', name: 'Acuícola del Sinú', country: 'Colombia', cur: 'COP', peso: true, product: 'tilapia congelada',
        code: 'C-03', title: 'Filete de tilapia congelado', buyer: 'Ocean Fresh Imports (Miami)', qty: "1 × 40' reefer · 22 t", fob: 79500, cif: 83600, cogs: 68000,
        plazo: 7, transit: 5, cargo: 'refrigerada', origin: 'Montería', port: 'Cartagena', dest: 'Miami', alt: 'Santa Marta', carrier: 'Caribe Line',
        cont: 1, dry: 1900, reefer: 3400, air: 41800, airText: 'USD 1,90 por kg facturable · 22 t · incluye la AWB.',
        pref: 'del TLC Colombia–EE. UU.', prefBonus: true, buyerZone: 'estadounidense', portCo: true, rtm: false, panama: false, ue: false,
        dexQ: ['¿Ante quién se presenta la declaración de exportación en Colombia?', 'La DIAN, por el sistema aduanero', 'El Invima'],
        san: san('Certificado sanitario de exportación', '¿Qué entidad expide el certificado sanitario para exportar filete de tilapia congelado desde Colombia?', 'El Invima', 'La DIAN', 'A'),
        market: [
          { id: 'C-03', title: 'Filete de tilapia congelado → Miami', text: "1 × 40' reefer · USD 83.600 CIF o 79.500 FOB · embarque en 7 días.", tags: 'En curso' },
          { id: 'C-12', title: 'Tilapia entera → Houston', text: '18 t · USD 61.000 CFR · cadena de frío · embarque en 9 días.', tags: 'Disponible' },
          { id: 'C-16', title: 'Filete fresco → Nueva York', text: '4 t · USD 31.000 CPT aéreo · entrega en 3 días.', tags: 'Disponible' }
        ]
      },
      shz: {
        id: 'shz', name: 'Shenzhen Parts Co.', country: 'China', cur: 'CNY', peso: false, product: 'repuestos',
        code: 'C-18', title: 'Repuestos para maquinaria agrícola', buyer: 'Agroindustrias del Caribe (Cartagena)', qty: "2 × 40' · 31 t", fob: 61000, cif: 67150, cogs: 52000,
        plazo: 9, transit: 32, cargo: 'seca', origin: 'Dongguan', port: 'Shenzhen (Yantian)', dest: 'Cartagena', alt: 'Hong Kong', carrier: 'una naviera asiática',
        cont: 2, dry: 5600, reefer: 11800, air: 62000, airText: 'USD 2,00 por kg facturable · 31 t · incluye la AWB.',
        pref: '', prefBonus: false, buyerZone: 'colombiano', portCo: false, rtm: false, panama: true, ue: false,
        dexQ: ['¿Ante quién se presenta la declaración de exportación en China?', 'La Administración General de Aduanas (GACC)', 'El Ministerio de Comercio'],
        san: san('Certificado NIMF 15 de embalajes', '¿Qué exige la norma NIMF 15 a los pallets de madera del embarque?', 'Tratamiento térmico o fumigación certificada, con sello visible', 'Que la madera esté pintada', 'A'),
        market: [
          { id: 'C-18', title: 'Repuestos agrícolas → Cartagena', text: "2 × 40' · USD 67.150 CIF o 61.000 FOB · embarque en 9 días.", tags: 'En curso' },
          { id: 'C-21', title: 'Motores eléctricos → Buenaventura', text: "1 × 40' · USD 48.000 CFR · embarque en 12 días.", tags: 'Disponible' },
          { id: 'C-24', title: 'Sensores → Ciudad de México', text: '3 t · USD 39.000 CPT aéreo · entrega en 4 días.', tags: 'Disponible' }
        ]
      }
    };
    return C[this.props.empresa] || C.cafe;
  }

  owns(role) {
    const r = this.props.roles;
    return !Array.isArray(r) || !r.length || r.indexOf(role) >= 0;
  }

  contract() {'''
R("\n  contract() {", CASO)
R("""  contract() {
    const inc = this.state.incoterm;""", """  contract() {
    const inc = this.state.incoterm, k = this.caso();""")
R("""      code: 'C-07', title: 'Café verde especial', buyer: 'Rotterdam Foods B.V.', qty: "2 × 40' · 38 t",
      price: inc === 'FOB' ? 44000 : 48100, cogs: 38000,
      incoterm: inc, plazo: 7, transit: 14, cargo: 'seca', origin: 'Montería', port: 'Cartagena', dest: 'Rotterdam'""",
  """      code: k.code, title: k.title, buyer: k.buyer, qty: k.qty,
      price: inc === 'FOB' ? k.fob : k.cif, cogs: k.cogs,
      incoterm: inc, plazo: k.plazo, transit: k.transit, cargo: k.cargo, origin: k.origin, port: k.port, dest: k.dest""")

# ---------- catálogo
R("""  catalog() {
    return {""", """  catalog() {
    const k = this.caso(), cn = k.cont + " × 40'", trips = k.cont + ' viaje' + (k.cont === 1 ? '' : 's');
    return {""")
R("name: 'Tractomula seca', cost: 1700, days: 1, reefer: false, text: '2 viajes Montería → Cartagena · USD 850 por viaje.'",
  "name: 'Tractomula seca', cost: 850 * k.cont, days: 1, reefer: false, text: trips + ' ' + k.origin + ' → ' + k.port + ' · USD 850 por viaje.'")
R("name: 'Tractomula refrigerada', cost: 2500, days: 1, reefer: true, text: '2 viajes · USD 1.250 por viaje · mantiene −18 °C.'",
  "name: 'Tractomula refrigerada', cost: 1250 * k.cont, days: 1, reefer: true, text: trips + ' · USD 1.250 por viaje · mantiene −18 °C.'")
R("""name: "2 × 40' High Cube", cost: 3700, days: 14, reefer: false, text: 'Caribe Line · Cartagena → Rotterdam · incluye el BL.'""",
  """name: cn + ' High Cube', cost: k.dry, days: k.transit, reefer: false, text: k.carrier + ' · ' + k.port + ' → ' + k.dest + ' · incluye el BL.'""")
R("""name: "2 × 40' Reefer", cost: 8200, days: 14, reefer: true, text: 'Cartagena → Rotterdam · incluye el BL.'""",
  """name: cn + ' Reefer', cost: k.reefer, days: k.transit, reefer: true, text: k.port + ' → ' + k.dest + ' · incluye el BL.'""")
R("name: 'Carga aérea en pallets', cost: 76000, days: 1, reefer: true, text: 'USD 1,90 por kg facturable · 40 t · incluye la AWB.'",
  "name: 'Carga aérea en pallets', cost: k.air, days: 1, reefer: true, text: k.airText")
R("text: 'Fija hoy la tasa (3.200) de los dólares que cobrarás.'", "text: 'Fija hoy la tasa (' + (k.peso ? '3.200 COP' : '7,10 CNY') + ') de los dólares que cobrarás.'")
R("name: 'Ruta alterna: Santa Marta', text: 'Si Cartagena cierra o se congestiona, embarcas por Santa Marta sin retraso (USD 600 si se usa).'",
  "name: 'Ruta alterna: ' + k.alt, text: 'Si ' + k.port + ' cierra o se congestiona, embarcas por ' + k.alt + ' sin retraso (USD 600 si se usa).'")

# ---------- documentos y mercado
R("""  docDefs() {
    return {""", """  docDefs() {
    const k = this.caso();
    return {""")
R("dex: { name: 'Declaración de exportación', req: true, q: '¿Ante quién se presenta la declaración de exportación en Colombia?', options: [{ id: 'A', text: 'La DIAN, por el sistema aduanero' }, { id: 'B', text: 'La Cámara de Comercio' }], ok: 'A' },",
  "dex: { name: 'Declaración de exportación', req: true, q: k.dexQ[0], options: [{ id: 'A', text: k.dexQ[1] }, { id: 'B', text: k.dexQ[2] }], ok: 'A' },")
R("fito: { name: 'Certificado fitosanitario', req: true, q: '¿Qué entidad certifica la condición fitosanitaria del café de exportación?', options: [{ id: 'A', text: 'El Invima' }, { id: 'B', text: 'El ICA' }], ok: 'B' },",
  "fito: { name: k.san.name, req: true, q: k.san.q, options: k.san.options, ok: k.san.ok },")
R("origen: { name: 'Certificado de origen', req: false, q: '¿Para qué sirve el certificado de origen ante el comprador europeo?', options: [{ id: 'A', text: 'Para aplicar la preferencia arancelaria del acuerdo UE–Colombia' }",
  "origen: { name: 'Certificado de origen', req: false, q: '¿Para qué sirve el certificado de origen ante el comprador ' + k.buyerZone + '?', options: [{ id: 'A', text: k.prefBonus ? 'Para aplicar la preferencia arancelaria ' + k.pref : 'Para acreditar el país de origen ante la aduana de destino, aunque no haya preferencia' }")
R("""  marketDefs() {
    return [
      { id: 'C-07', title: 'Café verde especial → Rotterdam', text: "2 × 40' · USD 48.100 CIF o 44.000 FOB · embarque en 7 días.", tags: 'En curso' },
      { id: 'C-11', title: 'Tilapia congelada → Miami', text: '22 t · USD 88.000 DAP · entrega en 10 días · cadena de frío.', tags: 'Disponible' },
      { id: 'C-14', title: 'Café tostado → Yokohama', text: "1 × 40' · USD 61.500 CIP · embarque en 12 días.", tags: 'Disponible' }
    ];""", """  marketDefs() {
    return this.caso().market;""")

# ---------- Incoterm y textos con precios
R("""    const e = term === 'CIF'
      ? this.entry('Comercial', 'Confirmó CIF a USD 48.100', 'Renegociar FOB a USD 44.000', 'Ingresa USD 4.100 más, pero paga flete y seguro (≈ USD 4.100) y asume el alza de fletes.', 0)
      : this.entry('Comercial', 'Renegoció FOB a USD 44.000', 'Mantener CIF a USD 48.100', 'Ingresa USD 4.100 menos y deja flete, seguro y alza de fletes al comprador.' + (moved.length ? ' Volvieron a la mano: ' + moved.join(', ') + '.' : ''), 0);
    this.setState({ incoterm: term, incDecided: true, board: board, hand: hand, quiz: null, seq: e.seq, log: s.log.concat([e]), msg: { text: 'Contrato C-07 en ' + term + '.', tone: 'ok' } });""",
  """    const k = this.caso(), dif = this.fmt(k.cif - k.fob);
    const e = term === 'CIF'
      ? this.entry('Comercial', 'Confirmó CIF a USD ' + this.fmt(k.cif), 'Renegociar FOB a USD ' + this.fmt(k.fob), 'Ingresa USD ' + dif + ' más, pero paga flete y seguro (≈ USD ' + dif + ') y asume el alza de fletes.', 0)
      : this.entry('Comercial', 'Renegoció FOB a USD ' + this.fmt(k.fob), 'Mantener CIF a USD ' + this.fmt(k.cif), 'Ingresa USD ' + dif + ' menos y deja flete, seguro y alza de fletes al comprador.' + (moved.length ? ' Volvieron a la mano: ' + moved.join(', ') + '.' : ''), 0);
    this.setState({ incoterm: term, incDecided: true, board: board, hand: hand, quiz: null, seq: e.seq, log: s.log.concat([e]), msg: { text: 'Contrato ' + k.code + ' en ' + term + '.', tone: 'ok' } });""")
R("fwd: ['Quedar expuesto a la tasa', 'Paga USD ' + this.fmt(cost) + ' para cobrar a 3.200 pase lo que pase con el peso.'],",
  "fwd: ['Quedar expuesto a la tasa', 'Paga USD ' + this.fmt(cost) + ' para cobrar a ' + (this.caso().peso ? '3.200 pase lo que pase con el peso.' : '7,10 CNY pase lo que pase con el yuan.')],")
R("    if (id === 'C-07') { this.say('Este contrato ya está en curso en tu mesa.', 'info'); return; }",
  "    if (id === this.caso().code) { this.say('Este contrato ya está en curso en tu mesa.', 'info'); return; }")

# ---------- efectos de eventos según la ruta de cada empresa
R("""    const act = (this.state.world && this.state.world.active) || {}, cob = this.state.board.cobertura, c = this.contract();""",
  """    const act = (this.state.world && this.state.world.active) || {}, cob = this.state.board.cobertura, c = this.contract(), k = this.caso();""")
R("""    add('tormenta', 'Tormenta tropical', has('smr') ? { cost: 600, text: 'Cartagena cerró, pero embarcas por Santa Marta sin retraso (USD 600).' } : { days: 3, text: 'Cartagena cerrado: tu embarque se retrasa 3 días. Riesgos puede jugar «Ruta alterna: Santa Marta».' });
    add('congestion', 'Congestión en Cartagena', has('smr') ? { cost: 600, text: 'Desvías por Santa Marta sin retraso (USD 600).' } : { days: 2, text: 'Espera de 2 días para cargar el buque.' });
    add('huelga', 'Huelga en Rotterdam', { arrival: 6, text: 'En ' + c.incoterm + ' el riesgo pasó al comprador cuando la carga quedó a bordo: no afecta tu entrega, aunque la llegada se demora 6 días.' });""",
  """    if (k.portCo) {
      add('tormenta', 'Tormenta tropical', has('smr') ? { cost: 600, text: 'Cartagena cerró, pero embarcas por Santa Marta sin retraso (USD 600).' } : { days: 3, text: 'Cartagena cerrado: tu embarque se retrasa 3 días. Riesgos puede jugar «Ruta alterna: Santa Marta».' });
      add('congestion', 'Congestión en Cartagena', has('smr') ? { cost: 600, text: 'Desvías por Santa Marta sin retraso (USD 600).' } : { days: 2, text: 'Espera de 2 días para cargar el buque.' });
    } else {
      add('tormenta', 'Tormenta tropical', { arrival: 3, text: 'Cartagena, tu destino, cerró 3 días: la llegada se demora, pero en ' + c.incoterm + ' el riesgo ya pasó al comprador al quedar la carga a bordo.' });
      add('congestion', 'Congestión en Cartagena', { arrival: 2, text: 'Tu buque espera 2 días para atracar en Cartagena; tu entrega a bordo en origen no cambia.' });
    }
    add('huelga', 'Huelga en Rotterdam', k.rtm ? { arrival: 6, text: 'En ' + c.incoterm + ' el riesgo pasó al comprador cuando la carga quedó a bordo: no afecta tu entrega, aunque la llegada se demora 6 días.' } : { text: 'Tu ruta no toca Rotterdam. Sin efecto.' });""")
R("""    add('sequia', 'Sequía en Panamá', { text: 'Tu ruta no cruza el Canal de Panamá. Sin efecto.' });""",
  """    add('sequia', 'Sequía en Panamá', k.panama ? { arrival: 4, text: 'Tu buque cruza el Canal de Panamá: la llegada se demora 4 días; en ' + c.incoterm + ' el riesgo ya es del comprador.' } : { text: 'Tu ruta no cruza el Canal de Panamá. Sin efecto.' });""")
R("""    add('devaluacion', 'Devaluación del peso', { text: has('fwd') ? 'Tu forward fija la tasa en 3.200: renuncias a la ganancia cambiaria a cambio de certeza.' : 'Cobras en USD: tu margen en pesos sube 12 %.' });
    add('revaluacion', 'Revaluación del peso', { text: has('fwd') ? 'Tu forward te protege: cobras a 3.200.' : 'Cobras en USD: tu margen en pesos cae 8 %. El CFO puede jugar «Forward de venta USD».' });""",
  """    if (k.peso) {
      add('devaluacion', 'Devaluación del peso', { text: has('fwd') ? 'Tu forward fija la tasa en 3.200: renuncias a la ganancia cambiaria a cambio de certeza.' : 'Cobras en USD: tu margen en pesos sube 12 %.' });
      add('revaluacion', 'Revaluación del peso', { text: has('fwd') ? 'Tu forward te protege: cobras a 3.200.' : 'Cobras en USD: tu margen en pesos cae 8 %. El CFO puede jugar «Forward de venta USD».' });
    } else {
      add('devaluacion', 'Devaluación del peso', { text: 'Cobras en USD y conviertes a yuanes: el peso colombiano no te afecta.' });
      add('revaluacion', 'Revaluación del peso', { text: 'Cobras en USD y conviertes a yuanes: el peso colombiano no te afecta.' });
    }""")
R("""    add('alerta', 'Alerta sanitaria en la UE', this.state.docs.fito === 'ok' ? { text: 'Tu certificado fitosanitario cubre la alerta.' } : { days: 5, cost: 900, text: 'Sin certificado fitosanitario válido la carga queda retenida 5 días (USD 900).' });""",
  """    add('alerta', 'Alerta sanitaria en la UE', !k.ue ? { text: 'Tu destino no está en la UE. Sin efecto.' } : (this.state.docs.fito === 'ok' ? { text: 'Tu certificado fitosanitario cubre la alerta.' } : { days: 5, cost: 900, text: 'Sin certificado fitosanitario válido la carga queda retenida 5 días (USD 900).' }));""")

# ---------- evaluación: tasa, cadena de frío y preferencia
R("""    const card = (slot) => (b[slot][0] ? K[b[slot][0]] : null);
    const missing = [];""", """    const card = (slot) => (b[slot][0] ? K[b[slot][0]] : null);
    const k = this.caso(), frio = c.cargo === 'refrigerada';
    const missing = [];""")
R("""      } else if (b[sd.key].length) filled += 1; else missing.push(sd.label.toLowerCase());""",
  """      } else if (b[sd.key].length) {
        const kc = K[b[sd.key][0]];
        if (frio && kc && kc.fam === 'transporte' && !kc.reefer) missing.push(sd.label.toLowerCase() + ' con equipo refrigerado'); else filled += 1;
      } else missing.push(sd.label.toLowerCase());""")
R("    const bonus = s.docs.origen === 'ok' ? Math.round(c.price * 0.01) : 0;", "    const bonus = s.docs.origen === 'ok' && k.prefBonus ? Math.round(c.price * 0.01) : 0;")
R("    const rate = fwd ? 3200 : 3200 * (act.devaluacion ? 1.12 : 1) * (act.revaluacion ? 0.92 : 1);",
  "    const rate = !k.peso ? 7.1 : (fwd ? 3200 : 3200 * (act.devaluacion ? 1.12 : 1) * (act.revaluacion ? 0.92 : 1));")
R("""    if (glosas) warn.push(""", """    if (frio && origen && !origen.reefer) warn.push('La ' + k.product + ' viaja a −18 °C: una tractomula seca rompe la cadena de frío. Usa la refrigerada.');
    if (frio && flete && !flete.reefer) warn.push('La ' + k.product + ' necesita contenedor reefer en el flete principal.');
    if (glosas) warn.push(""")

# ---------- textos de la interfaz
R("(D[id].req ? 'Obligatorio para exportar café.' : 'Opcional: el comprador pag", "(D[id].req ? 'Obligatorio para exportar ' + this.caso().product + '.' : 'Opcional: el comprador pag")
R("""      'Mercado': ['Comercial: confirma el Incoterm del contrato C-07', s.incDecided || s.visto === 'aprobada' ? 'Incoterm decidido: ' + c.incoterm + '. Avanza a Robo.' : 'CIF paga más (USD 48.100) pero te obliga a contratar flete y seguro; FOB (USD 44.000) los deja al comprador.'],""",
  """      'Mercado': ['Comercial: confirma el Incoterm del contrato ' + c.code, s.incDecided || s.visto === 'aprobada' ? 'Incoterm decidido: ' + c.incoterm + '. Avanza a Robo.' : 'CIF paga más (USD ' + this.fmt(this.caso().cif) + ') pero te obliga a contratar flete y seguro; FOB (USD ' + this.fmt(this.caso().fob) + ') los deja al comprador.'],""")
R("""    sum.push({ label: 'Margen en COP a ' + this.fmt(R.rate), value: 'COP ' + this.fmt(R.margen * R.rate),""",
  """    const kk = this.caso();
    sum.push({ label: 'Margen en ' + kk.cur + ' a ' + (kk.peso ? this.fmt(R.rate) : '7,10'), value: kk.cur + ' ' + this.fmt(R.margen * R.rate),""")
R("    sum.push({ label: 'Llegada estimada a Rotterdam', value:", "    sum.push({ label: 'Llegada estimada a ' + c.dest, value:")
R("""        quiz = { kicker: 'DECISIÓN DEL COMERCIAL · FASE MERCADO', q: '¿Con qué Incoterm cierras el contrato C-07 con Rotterdam Foods?', options: [{ id: 'A', text: 'CIF a USD 48.100: contratas flete y seguro hasta Rotterdam' }, { id: 'B', text: 'FOB a USD 44.000: el comprador contrata flete y seguro' }] };""",
  """        const kq = this.caso();
        quiz = { kicker: 'DECISIÓN DEL COMERCIAL · FASE MERCADO', q: '¿Con qué Incoterm cierras el contrato ' + kq.code + ' con ' + kq.buyer + '?', options: [{ id: 'A', text: 'CIF a USD ' + this.fmt(kq.cif) + ': contratas flete y seguro hasta ' + kq.dest }, { id: 'B', text: 'FOB a USD ' + this.fmt(kq.fob) + ': el comprador contrata flete y seguro' }] };""")
R("""q: 'La aduana revisa tu póliza: cubre USD 44.000, el valor FOB, en una venta CIF. ¿Qué debes corregir antes del levante?'""",
  """q: 'La aduana revisa tu póliza: cubre USD ' + this.fmt(this.caso().fob) + ', el valor FOB, en una venta CIF. ¿Qué debes corregir antes del levante?'""")

# ---------- mensaje al Superusuario con la empresa real
R("const msg = { company: 'cafe', ", "const msg = { company: this.caso().id, ")

# ---------- roles por persona
R("""      const on = ro === s.role, act = this.isActive(ro), left = ro === 'CEO' || ro === 'Comercial' ? '' : String(this.playsLeft(ro));
      return {
        label: ro, left: left,""", """      const on = ro === s.role, act = this.isActive(ro), left = ro === 'CEO' || ro === 'Comercial' ? '' : String(this.playsLeft(ro));
      const mine = this.owns(ro), who = (this.props.owners && this.props.owners[ro]) || '';
      return {
        label: mine ? ro : ro + ' · ' + (who || 'otro integrante'), left: left,""")
R("""        pick: () => this.setState({ role: ro, sel: null, msg: null })
      };
    });""", """        pick: () => (mine ? this.setState({ role: ro, sel: null, msg: null }) : this.say('El rol ' + ro + ' lo juega ' + (who || 'otro integrante') + ' en su dispositivo: verás sus jugadas aquí.', 'info'))
      };
    });""")

# ---------- valores de la cabecera
R("""      t: t, modeLabel: s.connected""", """      emp: { label: this.caso().name + ' · ' + this.caso().country + ' · ' + this.caso().cur, route: 'Mesa de operación · ' + c.origin + ' → ' + c.port + ' → ' + c.dest },
      t: t, modeLabel: s.connected""")

R("tú pagas flete y seguro hasta Rotterdam.' : 'El riesgo pasa al comprador a bordo en Cartagena; él contrata", "tú pagas flete y seguro hasta ' + c.dest + '.' : 'El riesgo pasa al comprador a bordo en ' + c.port + '; él contrata")

p.write_text(s, encoding='utf-8')
print('Jugador multiempresa aplicado.')
