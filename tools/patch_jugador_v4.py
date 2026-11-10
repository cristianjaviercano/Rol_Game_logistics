"""Mesa del jugador v4: banco de retos adaptativo con justificación, registro de respuestas por competencia,
TRM de referencia, liquidación oficial y caso regional de ganadería (Ganadería del San Jorge → Aqaba).

Se aplica una vez sobre mockup/Jugador.dc.html; queda como registro del cambio.
"""
from pathlib import Path

p = Path(__file__).resolve().parent.parent / 'mockup' / 'Jugador.dc.html'
s = p.read_text(encoding='utf-8')
if 'bancoBase()' in s:
    raise SystemExit('Ya aplicado.')


def R(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (c, a[:90])
    s = s.replace(a, b)


# ---------- props
R('"owners":{"editor":null},', '"owners":{"editor":null},"banco":{"editor":null},"trm":{"editor":null},"oficial":{"editor":null},')

# ---------- estado
R("      saber: { ok: 0, n: 0 },", "      saber: { ok: 0, n: 0 }, respuestas: [], repaso: '',")

# ---------- caso regional: ganadería
R("""    return C[this.props.empresa] || C.cafe;
  }""", """    C.gan = {
      id: 'gan', name: 'Ganadería del San Jorge', country: 'Colombia', cur: 'COP', peso: true, product: 'carne bovina congelada',
      code: 'C-05', title: 'Carne bovina congelada', buyer: 'Al-Amal Foods (Amán)', qty: "2 × 40' reefer · 48 t", fob: 211000, cif: 227300, cogs: 182000,
      plazo: 8, transit: 24, cargo: 'refrigerada', origin: 'Montería', port: 'Cartagena', dest: 'Aqaba', alt: 'Santa Marta', carrier: 'Caribe Line',
      cont: 2, dry: 6800, reefer: 14400, air: 115200, airText: 'USD 2,40 por kg facturable · 48 t · incluye la AWB.',
      pref: '', prefBonus: false, buyerZone: 'jordano', portCo: true, rtm: false, panama: false, ue: false, suez: true,
      dexQ: ['¿Ante quién se presenta la declaración de exportación en Colombia?', 'La DIAN, por el sistema aduanero', 'El Ministerio de Agricultura'],
      san: san('Certificado sanitario (Invima) y halal', '¿Qué entidad certifica la condición sanitaria de la carne bovina que Colombia exporta?', 'El Invima, que inspecciona la planta de beneficio', 'La DIAN', 'A'),
      market: [
        { id: 'C-05', title: 'Carne bovina congelada → Aqaba', text: "2 × 40' reefer · USD 227.300 CIF o 211.000 FOB · embarque en 8 días.", tags: 'En curso' },
        { id: 'C-08', title: 'Novillos en pie → Beirut', text: 'Buque ganadero · 1.200 cabezas · USD 1,9 millones CFR.', tags: 'Disponible' },
        { id: 'C-13', title: 'Cortes refrigerados → Curazao', text: "1 × 20' reefer · USD 58.000 CFR · embarque en 5 días.", tags: 'Disponible' }
      ]
    };
    return C[this.props.empresa] || C.cafe;
  }

  trm() { const v = Number(this.props.trm); return v > 1000 && v < 10000 ? v : 3200; }

  // Banco de retos tipo Saber Pro (Modelo Basado en Evidencias). El docente puede reemplazarlo por el suyo (prop «banco»).
  bancoBase() {
    const r = (id, eje, competencia, dificultad, pregunta, ops, correcta, just, contexto) => ({ id: id, eje: eje, competencia: competencia, dificultad: dificultad, contexto: contexto || '', pregunta: pregunta, opciones: ops.map((t, i) => ({ id: 'ABCD'[i], text: t })), correcta: correcta, justificacion: just });
    return [
      r('b01', 'incoterms', 'interpretacion', 1, 'En una venta FOB Cartagena, ¿cuándo pasa el riesgo del vendedor al comprador?', ['Cuando la mercancía queda a bordo del buque en Cartagena', 'Cuando llega al puerto de destino', 'Cuando sale de la bodega del vendedor'], 'A', { A: 'En FOB el riesgo se transmite cuando la mercancía queda a bordo en el puerto de embarque convenido (Incoterms 2020).', B: 'Eso ocurre en los términos D (DAP, DPU, DDP), no en FOB.', C: 'Eso corresponde a EXW o FCA en las instalaciones del vendedor.' }),
      r('b02', 'incoterms', 'argumentacion', 2, 'El comprador reclama porque la carga llegó mojada por lluvia en el puerto de destino. ¿Quién tiene la razón?', ['El comprador: CIF obliga a asegurar todo riesgo', 'El vendedor cumplió: CIF solo exige la cobertura mínima ICC (C)', 'Nadie: en CIF no hay seguro'], 'B', { A: 'CIF exige la cobertura mínima, Cláusulas ICC (C); la cobertura amplia (A) es obligatoria en CIP, no en CIF.', B: 'Correcto: en CIF el vendedor contrata seguro con cobertura mínima ICC (C), que no cubre todo riesgo; el comprador pudo pedir más cobertura.', C: 'CIF sí incluye seguro: la «I» es de insurance.' }, 'Un exportador vende CIF Rotterdam y contrata una póliza ICC (C).'),
      r('b03', 'incoterms', 'proposicion', 3, '¿Qué término le propones?', ['EXW Shenzhen', 'CIF Cartagena', 'FCA Shenzhen'], 'B', { A: 'En EXW el comprador asume el despacho de exportación en China y todo el transporte: lo opuesto a lo que busca.', B: 'En CIF el vendedor contrata flete y seguro hasta Cartagena; el importador solo atiende la importación en Colombia.', C: 'En FCA el comprador contrata el flete principal: tendría que gestionar el transporte internacional.' }, 'Un importador colombiano sin experiencia logística compra maquinaria en China. Quiere un precio puesto en su puerto y no manejar el transporte internacional.'),
      r('b04', 'aranceles', 'interpretacion', 1, '¿Para qué sirve la subpartida arancelaria de un producto?', ['Para identificar la mercancía y determinar aranceles, IVA y requisitos', 'Para calcular el flete', 'Para fijar el precio de venta'], 'A', { A: 'La subpartida del Sistema Armonizado clasifica la mercancía y de ella dependen tributos, vistos buenos y preferencias.', B: 'El flete depende del peso, el volumen y la ruta, no de la clasificación.', C: 'El precio lo pactan las partes; la clasificación solo define el tratamiento aduanero.' }),
      r('b05', 'aranceles', 'argumentacion', 2, '¿Por qué el comprador europeo valora el certificado de origen de Café Sinú?', ['Le permite aplicar la preferencia arancelaria del acuerdo UE–Colombia', 'Reemplaza la factura comercial', 'Exonera la carga de la inspección sanitaria'], 'A', { A: 'Acreditar el origen colombiano permite pagar el arancel preferencial del acuerdo comercial.', B: 'La factura sigue siendo obligatoria: el certificado de origen no la sustituye.', C: 'Los controles sanitarios son independientes del origen preferencial.' }),
      r('b06', 'regimenes', 'interpretacion', 2, '¿Qué figura le permite no pagar tributos sobre los insumos?', ['Importación ordinaria', 'Sistema Especial de Importación-Exportación (Plan Vallejo)', 'Tránsito aduanero'], 'B', { A: 'En la importación ordinaria se pagan los tributos al nacionalizar.', B: 'El Plan Vallejo suspende tributos sobre insumos que se usan para producir bienes de exportación.', C: 'El tránsito solo traslada la carga bajo control aduanero; no la exonera.' }, 'Una empresa importa insumos, los transforma y exporta el producto final.'),
      r('b07', 'regimenes', 'proposicion', 3, '¿Qué propones para no nacionalizarla en el puerto?', ['Declarar la importación ordinaria en Cartagena', 'Moverla bajo tránsito aduanero hasta su destino', 'Reexportarla'], 'B', { A: 'Nacionalizar en Cartagena adelanta el pago de tributos que se querían diferir.', B: 'El tránsito aduanero traslada la carga bajo control de la aduana hasta el destino, donde se define su régimen.', C: 'Reexportar la saca del país: no cumple el objetivo.' }, 'Una carga llega a Cartagena, pero su destino es una zona franca en Bogotá.'),
      r('b08', 'transporte', 'interpretacion', 1, '¿Qué documento de transporte se emite en un envío aéreo internacional?', ['Conocimiento de embarque (BL)', 'Guía aérea (AWB)', 'Carta de porte terrestre'], 'B', { A: 'El BL es el documento del transporte marítimo.', B: 'La Air Waybill es el contrato y recibo del transporte aéreo.', C: 'La carta de porte ampara el transporte por carretera.' }),
      r('b09', 'transporte', 'argumentacion', 2, '¿Por qué el contenedor reefer suele ser mejor opción que el avión?', ['Porque el reefer es más rápido', 'Porque cuesta mucho menos por kilo y el tránsito marítimo cumple el plazo', 'Porque el avión no admite alimentos'], 'B', { A: 'El avión es más rápido; la ventaja del reefer es el costo.', B: 'Con 5 días de plazo el tránsito marítimo alcanza, y el flete reefer es una fracción del aéreo por kilo.', C: 'La carga aérea sí transporta perecederos refrigerados.' }, 'Hay que enviar 22 t de tilapia congelada a Miami y el plazo de entrega es de 5 días.'),
      r('b10', 'transporte', 'proposicion', 3, '¿Qué propones?', ['Esperar la reapertura y asumir la penalización', 'Desviar por Santa Marta si el sobrecosto es menor que la penalización y el OTIF que proteges', 'Cancelar el contrato'], 'B', { A: 'Esperar sacrifica el OTIF sin comparar alternativas.', B: 'Comparar el costo del desvío con la penalización y el valor de cumplir es la decisión logística sustentada.', C: 'Cancelar destruye la relación comercial y genera sanciones.' }, 'Una tormenta cierra Cartagena 3 días y tu embarque vence en 4.'),
      r('b11', 'cubicaje', 'interpretacion', 2, 'Un contenedor de 40 pies estándar tiene unos 67 m³ útiles. ¿Cuántas cajas de 0,5 m³ caben como máximo, sin descontar pérdidas de estiba?', ['134', '67', '33'], 'A', { A: '67 m³ ÷ 0,5 m³ = 134 cajas: es el máximo teórico antes de pérdidas por estiba.', B: 'Ese resultado olvida dividir entre el volumen de cada caja.', C: 'Ese resultado divide dos veces.' }),
      r('b12', 'cubicaje', 'argumentacion', 3, '¿Qué limita el llenado?', ['El volumen', 'El peso: la carga es densa y llega al límite de carga útil antes de llenar el espacio', 'Nada lo limita'], 'B', { A: 'Quedan unos 18 m³ libres: el volumen no es el límite.', B: 'Con 27 t la carga está casi en la carga útil (≈ 28 t): manda el peso, no el volumen.', C: 'Todo contenedor tiene límites de peso y volumen.' }, 'Una carga de 27 t ocupa 15 m³ en un contenedor de 20 pies (≈ 33 m³ y ≈ 28 t útiles).'),
      r('b13', 'geografia', 'interpretacion', 1, '¿Qué ruta toma un buque de Shanghái a Róterdam si el mar Rojo está cerrado?', ['Canal de Panamá', 'Cabo de Buena Esperanza', 'Estrecho de Bering'], 'B', { A: 'Panamá conecta el Pacífico con el Caribe: no sirve para ir de Asia a Europa.', B: 'Sin Suez, la ruta Asia–Europa rodea África por el Cabo de Buena Esperanza.', C: 'La ruta ártica no es una alternativa comercial regular para esta carga.' }),
      r('b14', 'geografia', 'argumentacion', 2, '¿Por qué la sequía en Panamá afecta a Shenzhen Parts y no a Café Sinú?', ['Porque Café Sinú no exporta', 'Porque la ruta Asia–Caribe de Shenzhen cruza el canal y la de Café Sinú cruza el Atlántico', 'Porque el canal solo atiende carga china'], 'B', { A: 'Café Sinú sí exporta, a Rotterdam.', B: 'El efecto depende de la ruta: Cartagena–Rotterdam no usa el canal; Yantian–Cartagena sí.', C: 'El canal atiende buques de todos los orígenes.' }),
      r('b15', 'documentos', 'interpretacion', 1, '¿Qué documento detalla pesos, volúmenes y marcas de cada bulto?', ['Factura comercial', 'Lista de empaque', 'Póliza de seguro'], 'B', { A: 'La factura detalla valores y condiciones de venta.', B: 'La lista de empaque (packing list) describe el contenido físico de cada bulto.', C: 'La póliza ampara riesgos; no describe bultos.' }),
      r('b16', 'documentos', 'proposicion', 3, '¿Qué haces antes de presentar la declaración?', ['Presentarla igual y explicar después', 'Corregir el documento errado para que coincidan', 'Retirar la lista de empaque'], 'B', { A: 'Las inconsistencias generan glosas, retenciones y multas.', B: 'Los documentos soporte deben ser consistentes antes de declarar: así se evita la glosa.', C: 'La lista de empaque es un documento soporte exigido.' }, 'La factura dice 38 t y la lista de empaque 36 t.'),
      r('b17', 'finanzas', 'argumentacion', 2, '¿Por qué un forward de venta lo protege?', ['Fija hoy la tasa a la que venderá los dólares', 'Aumenta el precio de venta', 'Elimina el riesgo de impago'], 'A', { A: 'El forward pacta hoy la tasa futura: si el peso se revalúa, recibe la tasa pactada.', B: 'El forward no cambia el precio del contrato.', C: 'El impago se cubre con carta de crédito o seguro de crédito, no con un forward.' }, 'Un exportador cobrará USD en 60 días y teme que el peso se revalúe.'),
      r('b18', 'finanzas', 'proposicion', 3, '¿Qué propones para cobrar con seguridad?', ['Aceptar sin garantía', 'Carta de crédito confirmada por un banco local', 'Exigir pago en efectivo al llegar'], 'B', { A: 'Sin garantía, el riesgo de impago queda en el exportador.', B: 'La carta de crédito confirmada obliga al banco a pagar contra documentos conformes.', C: 'No es un medio de pago viable en comercio internacional.' }, 'Un comprador nuevo en otro país pide 60 días de plazo.')
    ];
  }

  banco() { const b = this.props.banco; return Array.isArray(b) && b.length ? b : this.bancoBase(); }

  // Dificultad adaptativa: con menos de 2 respuestas, nivel 2; con 75 % o más de aciertos, nivel 3; con menos de 45 %, nivel 1.
  pickReto() {
    const s = this.state, B = this.banco(), done = (s.respuestas || []).map((x) => x.id);
    const ratio = s.saber.n ? s.saber.ok / s.saber.n : 0;
    const target = s.saber.n < 2 ? 2 : (ratio >= 0.75 ? 3 : (ratio < 0.45 ? 1 : 2));
    const pool = B.filter((x) => done.indexOf(x.id) < 0);
    const list = pool.length ? pool : B;
    return list.slice().sort((a, b) => Math.abs(a.dificultad - target) - Math.abs(b.dificultad - target))[0] || null;
  }

  startRepaso() {
    const s = this.state, key = this.roundNow() + '·' + this.phaseName();
    if (s.repaso === key) { this.say('Ya respondieron el reto de repaso de esta fase.', 'info'); return; }
    const q = this.pickReto();
    if (!q) { this.say('No hay retos en el banco.', 'warn'); return; }
    this.setState({ quiz: { kind: 'repaso', item: q } });
  }

  answerLog(id, eje, comp, dif, ok, extra) {
    const s = this.state;
    return (s.respuestas || []).concat([Object.assign({ id: id, eje: eje, competencia: comp, dificultad: dif, ok: ok, ronda: this.roundNow(), fase: this.phaseName(), rol: s.role, t: Date.now() }, extra || {})]);
  }""")

# ---------- respuestas de documentos e inspección con su eje y competencia
R("""      this.setState({ docs: docs, board: board, plays: plays, saber: saber, quiz: null, sel: null, seq: e.seq,""",
  """      const M = { factura: ['documentos', 'interpretacion'], lista: ['cubicaje', 'interpretacion'], dex: ['regimenes', 'interpretacion'], fito: ['documentos', 'argumentacion'], origen: ['aranceles', 'argumentacion'] }[q.id] || ['documentos', 'interpretacion'];
      this.setState({ respuestas: this.answerLog('doc-' + q.id, M[0], M[1], 2, right), docs: docs, board: board, plays: plays, saber: saber, quiz: null, sel: null, seq: e.seq,""")
R("""    } else {
      const right = id === 'B';
      if (right) saber.ok += 1;
      const e = this.entry('Aduanas', 'Respondió la inspección sorpresa',""",
  """    } else if (q.kind === 'repaso') {
      const it = q.item, right = id === it.correcta;
      if (right) saber.ok += 1;
      const why = (it.justificacion || {})[id] || '', okWhy = (it.justificacion || {})[it.correcta] || '';
      const txt = right ? 'Correcto. ' + why : 'Incorrecto: la respuesta es ' + it.correcta + '. ' + (why ? why + ' ' : '') + okWhy;
      this.setState({ saber: saber, quiz: null, repaso: this.roundNow() + '·' + this.phaseName(), respuestas: this.answerLog(it.id, it.eje, it.competencia, it.dificultad, right, { elegida: id }), msg: { text: txt, tone: right ? 'ok' : 'warn' } });
    } else {
      const right = id === 'B';
      if (right) saber.ok += 1;
      const e = this.entry('Aduanas', 'Respondió la inspección sorpresa',""")
R("""      this.setState({ insp: right ? 'ok' : 'fail', saber: saber, quiz: null,""",
  """      this.setState({ respuestas: this.answerLog('inspeccion', 'incoterms', 'proposicion', 3, right), insp: right ? 'ok' : 'fail', saber: saber, quiz: null,""")

# ---------- quiz del reto de repaso con su eje, competencia y nivel
R("""      } else if (s.quiz.kind === 'motivo') {""", """      } else if (s.quiz.kind === 'repaso') {
        const it = s.quiz.item, ejes = { incoterms: 'Incoterms', aranceles: 'Aranceles', regimenes: 'Regímenes aduaneros', transporte: 'Transporte', cubicaje: 'Cubicaje', geografia: 'Geografía económica', documentos: 'Documentos', finanzas: 'Finanzas' }, comps = { interpretacion: 'Interpretación', argumentacion: 'Argumentación', proposicion: 'Proposición' };
        quiz = { kicker: 'RETO DE REPASO · ' + (ejes[it.eje] || it.eje).toUpperCase() + ' · ' + (comps[it.competencia] || it.competencia).toUpperCase() + ' · NIVEL ' + it.dificultad, q: (it.contexto ? it.contexto + ' ' : '') + it.pregunta, options: it.opciones };
      } else if (s.quiz.kind === 'motivo') {""")
R("""      actions.push(btn('Responder inspección', () => this.startInspection(), 'primary', s.insp !== 'pending'));""",
  """      actions.push(btn('Responder inspección', () => this.startInspection(), 'primary', s.insp !== 'pending'));
      actions.push(btn('Reto de repaso', () => this.startRepaso(), 'ghost', s.repaso === this.roundNow() + '·' + this.phaseName()));""")

# ---------- TRM de referencia
R("    const rate = !k.peso ? 7.1 : (fwd ? 3200 : 3200 * (act.devaluacion ? 1.12 : 1) * (act.revaluacion ? 0.92 : 1));",
  "    const T0 = this.trm(), rate = !k.peso ? 7.1 : (fwd ? T0 : T0 * (act.devaluacion ? 1.12 : 1) * (act.revaluacion ? 0.92 : 1));")
R("text: 'Fija hoy la tasa (' + (k.peso ? '3.200 COP' : '7,10 CNY') + ') de los dólares que cobrarás.'",
  "text: 'Fija hoy la tasa (' + (k.peso ? this.fmt(this.trm()) + ' COP' : '7,10 CNY') + ') de los dólares que cobrarás.'")
R("fwd: ['Quedar expuesto a la tasa', 'Paga USD ' + this.fmt(cost) + ' para cobrar a ' + (this.caso().peso ? '3.200 pase lo que pase con el peso.' : '7,10 CNY pase lo que pase con el yuan.')],",
  "fwd: ['Quedar expuesto a la tasa', 'Paga USD ' + this.fmt(cost) + ' para cobrar a ' + (this.caso().peso ? this.fmt(this.trm()) + ' pase lo que pase con el peso.' : '7,10 CNY pase lo que pase con el yuan.')],")
R("add('devaluacion', 'Devaluación del peso', { text: has('fwd') ? 'Tu forward fija la tasa en 3.200: renuncias",
  "add('devaluacion', 'Devaluación del peso', { text: has('fwd') ? 'Tu forward fija la tasa en ' + this.fmt(this.trm()) + ': renuncias")
R("add('revaluacion', 'Revaluación del peso', { text: has('fwd') ? 'Tu forward te protege: cobras a 3.200.'",
  "add('revaluacion', 'Revaluación del peso', { text: has('fwd') ? 'Tu forward te protege: cobras a ' + this.fmt(this.trm()) + '.'")

# ---------- ruta por Suez (ganadería)
R("""    add('marrojo', 'Ataques en el mar Rojo', { text: 'Tu ruta cruza el Atlántico: no pasa por Suez. Sin efecto.' });""",
  """    add('marrojo', 'Ataques en el mar Rojo', k.suez ? { arrival: 12, cost: 2400, text: 'Tu buque iba por Suez hacia Aqaba: rodea África, llega 12 días después y paga recargo de USD 2.400.' } : { text: 'Tu ruta no pasa por Suez. Sin efecto.' });""")

# ---------- liquidación oficial en la cabecera
R("""      t: t, modeLabel: s.connected ? 'Fases controladas por el Superusuario' : 'Modo práctica: el equipo avanza las fases',""",
  """      t: t, modeLabel: this.props.oficial && typeof this.props.oficial.puntaje === 'number' ? 'Liquidación oficial · ronda ' + this.props.oficial.ronda + ': ' + String(this.props.oficial.puntaje).replace('.', ',') + ' / 100' : (s.connected ? 'Fases controladas por el Superusuario' : 'Modo práctica: el equipo avanza las fases'),""")

p.write_text(s, encoding='utf-8')
print('Jugador v4 aplicado.')
