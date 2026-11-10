"""Mesa del Superusuario v4: caso regional de ganadería, TRM de referencia, liquidación oficial en el ranking
y razones visibles de las empresas automáticas (por reglas o por IA). Se aplica una vez sobre tools/Mesa.template.html.
"""
from pathlib import Path

p = Path(__file__).resolve().parent / 'Mesa.template.html'
s = p.read_text(encoding='utf-8')
if "id: 'gan'" in s:
    raise SystemExit('Ya aplicado.')


def R(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (c, a[:90])
    s = s.replace(a, b)


R('"roster":{"editor":null},', '"roster":{"editor":null},"trm":{"editor":null},"oficial":{"editor":null},"botNotes":{"editor":null},')

# ---------- empresas: ganadería y ruta por Suez
R("""      { id: 'aero', name: 'AeroCarga Andina',""", """      { id: 'gan', name: 'Ganadería del San Jorge', meta: 'Colombia · ganadera · COP', m: 13.1, o: 89, x: 92, co: true, food: true, suez: true, hand: 7, op: 'C-05 carne bovina → Aqaba', filled: 1, req: 5 },
      { id: 'aero', name: 'AeroCarga Andina',""")
R("""      if (act.marrojo && (c.cn || c.nl)) { o -= 8; m -= 1.5; hit('Mar Rojo', -1); }""",
  """      if (act.marrojo && (c.suez || c.nl)) { o -= 8; m -= 1.5; hit('Mar Rojo', -1); }""")
R("hit: 'Shenzhen Parts y Rotterdam Foo", "hit: 'Ganadería del San Jorge y Rotterdam Foo")
R("hit: 'Café Sinú, Acuícola del Sinú y Caribe Line: OTIF −9 pp.'", "hit: 'Café Sinú, Acuícola, Ganadería del San Jorge y Caribe Line: OTIF −9 pp.'")
R("hit: 'Café Sinú, Acuícola del Sinú y Caribe Line: OTIF −4 pp.'", "hit: 'Café Sinú, Acuícola, Ganadería del San Jorge y Caribe Line: OTIF −4 pp.'")
R("hit: 'Café Sinú y Acuícola del Sinú: margen −2 pp en pesos.'", "hit: 'Café Sinú, Acuícola y Ganadería del San Jorge: margen −2 pp en pesos.'")
R("hit: 'Café Sinú y Acuícola del Sinú: margen +2,5 pp.'", "hit: 'Café Sinú, Acuícola y Ganadería del San Jorge: margen +2,5 pp.'")
R("hit: 'Café Sinú y Acuícola del Sinú: margen −1 pp por costo financiero.'", "hit: 'Café Sinú, Acuícola y Ganadería del San Jorge: margen −1 pp por costo financiero.'")
R("hit: 'Las 6 empresas: OTIF −6 pp", "hit: 'Las 7 empresas: OTIF −6 pp")
R("    return { cafe: [8.75, -75.88], acui: [9.3, -75.4], caribe: [10.39, -75.51], rot: [51.92, 4.48], shz: [22.54, 114.06], aero: [4.7, -74.14] };",
  "    return { cafe: [8.75, -75.88], acui: [9.3, -75.4], caribe: [10.39, -75.51], rot: [51.92, 4.48], shz: [22.54, 114.06], gan: [8.3, -75.1], aero: [4.7, -74.14] };")
R("    const short = { cafe: 'Café Sinú', acui: 'Acuícola', caribe: 'Caribe Line', rot: 'Rotterdam', shz: 'Shenzhen', aero: 'AeroCarga' };",
  "    const short = { cafe: 'Café Sinú', acui: 'Acuícola', caribe: 'Caribe Line', rot: 'Rotterdam', shz: 'Shenzhen', gan: 'San Jorge', aero: 'AeroCarga' };")
R("    const left = rows.slice(0, 3).map(view), right = rows.slice(3).map(view);",
  "    const half = Math.ceil(rows.length / 2), left = rows.slice(0, half).map(view), right = rows.slice(half).map(view);")

# ---------- TRM de referencia
R("    const usd = 3200 * (act.devaluacion ? 1.12 : 1) * (act.revaluacion ? 0.92 : 1);",
  "    const T0 = Number(this.props.trm) > 1000 ? Number(this.props.trm) : 3200, usd = T0 * (act.devaluacion ? 1.12 : 1) * (act.revaluacion ? 0.92 : 1);")
R("{ label: 'USD/COP', value: this.fmt(usd), delta: act.devaluacion || act.revaluacion ? (usd > 3200 ? '+' : '−') + this.fmt(Math.abs(usd / 3200 - 1) * 100, 1) + ' %' : 'estable', warn: !!(act.devaluacion || act.revaluacion) },",
  "{ label: 'USD/COP', value: this.fmt(usd), delta: act.devaluacion || act.revaluacion ? (usd > T0 ? '+' : '−') + this.fmt(Math.abs(usd / T0 - 1) * 100, 1) + ' %' : (Number(this.props.trm) > 1000 ? 'TRM de referencia' : 'estable'), warn: !!(act.devaluacion || act.revaluacion) },")

# ---------- liquidación oficial y razones de las automáticas
R("""      const b = bot ? (this.state.bots || {})[c.id] : null;
      if (b) filled = Math.min(req, b.filled);""", """      const b = bot ? (this.state.bots || {})[c.id] : null;
      if (b) filled = Math.min(req, b.filled);
      const of = (this.props.oficial || {})[c.id];
      if (of && typeof of.puntaje === 'number') { if (typeof of.margenPct === 'number') m = of.margenPct; if (typeof of.otif === 'boolean') o = of.otif ? Math.max(o, 95) : Math.min(o, 80); }
      const note = (this.props.botNotes || {})[c.id];""")
R("""executed: p ? p.executed : filled >= req, bot: bot, humans: humans, done: b ? b.done : 0 };""",
  """executed: p ? p.executed : filled >= req, bot: bot, humans: humans, done: b ? b.done : 0, oficial: of || null, reason: note || (b && b.reason) || '' };""")
R("""        const hit = c.why.some((w) => !w.up);
        if (!hit || roll(c.id) > 0.5) b.filled += 1;""", """        const hit = c.why.filter((w) => !w.up).map((w) => w.label);
        if (!hit.length || roll(c.id) > 0.5) { b.filled += 1; b.reason = hit.length ? 'Avanzó pese a ' + hit.join(' y ').toLowerCase() + ': activó su plan alterno.' : 'Avanzó un tramo según su plan.'; }
        else b.reason = 'Esperó: ' + hit.join(' y ').toLowerCase() + ' frenó su operación.';""")
R("""    const ranked = rows.slice().sort((a, b) => b.m - a.m).map((r) => r.id);""",
  """    const scoreOf = (r) => (r.oficial && typeof r.oficial.puntaje === 'number' ? 1000 + r.oficial.puntaje : r.m);
    const ranked = rows.slice().sort((a, b) => scoreOf(b) - scoreOf(a)).map((r) => r.id);""")
R("""        who: c.bot ? 'Automática' + (c.done ? ' · ' + c.done + ' operación' + (c.done === 1 ? '' : 'es') + ' liquidada' + (c.done === 1 ? '' : 's') : '') : 'Equipo: ' + (c.humans.length ? c.humans.join(', ') : 'conectado'),""",
  """        who: c.bot ? 'Automática' + (c.done ? ' · ' + c.done + ' operación' + (c.done === 1 ? '' : 'es') + ' liquidada' + (c.done === 1 ? '' : 's') : '') + (c.reason ? ' · ' + c.reason : '') : 'Equipo: ' + (c.humans.length ? c.humans.join(', ') : 'conectado') + (c.oficial ? ' · oficial R' + c.oficial.ronda + ': ' + String(c.oficial.puntaje).replace('.', ',') + ' pts' : ''),""")
p.write_text(s, encoding='utf-8')
print('Mesa v4 aplicada a la plantilla.')
