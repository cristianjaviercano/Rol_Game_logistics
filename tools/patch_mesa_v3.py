"""Mesa del Superusuario v3: empresas humanas o automáticas, cartas plegables, globo quieto o centrado y noticias de eventos.

Se aplica una vez sobre tools/Mesa.template.html; queda como registro del cambio.
"""
from pathlib import Path

p = Path(__file__).resolve().parent / 'Mesa.template.html'
s = p.read_text(encoding='utf-8')
if 'botStep(' in s:
    raise SystemExit('Ya aplicado.')


def R(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (c, a[:90])
    s = s.replace(a, b)


# ---------- props nuevas
R('"rotar":{"editor":"boolean","default":true},', '"rotar":{"editor":"boolean","default":true},"roster":{"editor":null},')

# ---------- tarjetas de empresa: quién la juega
R("""          <span style="font-size: 12px; color: {{t.quiet}}">{{co.meta}}</span>""",
  """          <span style="font-size: 12px; color: {{t.quiet}}">{{co.meta}}</span>
          <span style="{{co.whoStyle}}">{{co.who}}</span>""", 2)

# ---------- cabecera del globo: giro y centrado
R("""        <span style="font-size: 12px; color: {{t.quiet}}">Arrastra para girar · pasa el cursor sobre un puerto o un aeropuerto · haz clic para ver su operación</span>
      </div>""", """        <span style="font-size: 12px; color: {{t.quiet}}">Arrastra para girar · pasa el cursor sobre un nodo · clic para ver su operación</span>
      </div>
      <div role="group" aria-label="Control del globo" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center">
        <button type="button" onClick="{{toggleSpin}}" aria-pressed="{{spinPressed}}" style="{{spinStyle}}">{{spinLabel}}</button>
        <span style="font-size: 12px; font-weight: 600; color: {{t.quiet}}; margin-left: 4px">Centrar en</span>
        <sc-for list="{{focusBtns}}" as="fb" hint-placeholder-count="6">
          <button type="button" onClick="{{fb.pick}}" aria-pressed="{{fb.pressed}}" style="{{fb.style}}">{{fb.label}}</button>
        </sc-for>
      </div>""")

# ---------- mano de cartas plegable
R("""    <div style="display: flex; gap: 12px; overflow-x: auto; padding: 4px 2px 8px">
      <sc-for list="{{cards}}" as="cd" hint-placeholder-count="5">""", """    <sc-if value="{{handOpen}}" hint-placeholder-val="{{true}}">
    <div style="display: flex; gap: 12px; overflow-x: auto; padding: 4px 2px 8px">
      <sc-for list="{{cards}}" as="cd" hint-placeholder-count="5">""")
R("""      <sc-if value="{{rowEmpty}}" hint-placeholder-val="{{false}}">
        <span style="font-size: 14px; color: {{t.quiet}}; padding: 20px 0">{{rowEmptyText}}</span>
      </sc-if>
    </div>""", """      <sc-if value="{{rowEmpty}}" hint-placeholder-val="{{false}}">
        <span style="font-size: 14px; color: {{t.quiet}}; padding: 20px 0">{{rowEmptyText}}</span>
      </sc-if>
    </div>
    </sc-if>""")

# ---------- estado
R("      player: null, hover: null, nodeSel: null, inside: null\n    };",
  "      player: null, hover: null, nodeSel: null, inside: null,\n      players: {}, bots: {}, handOpen: true, spin: null, focus: null, news: null\n    };")
R("""      this.drag = { x: e.clientX, y: e.clientY, ry: this.g.globe.rotation.y, rx: this.g.tilt.rotation.x, moved: 0 };""",
  """      this.drag = { x: e.clientX, y: e.clientY, ry: this.g.globe.rotation.y, rx: this.g.tilt.rotation.x, moved: 0 };
      if (this.state.focus) this.setState({ focus: null });""")
R("""    const read = (m) => { if (m && m.company) this.setState({ player: m }); };""",
  """    const read = (m) => { if (m && m.company) this.setState((st) => ({ player: m.company === 'cafe' ? m : st.player, players: Object.assign({}, st.players, { [m.company]: m }) })); };""")

# ---------- mensaje del mundo: eventos con su ficha y la última noticia
R("""    const msg = { active: s.active, paused: s.paused, round: s.round, phase: this.phaseList()[s.phase] };""",
  """    const E = this.eventCards(), info = {};
    Object.keys(s.active || {}).forEach((k) => { const e = E[k]; if (e) info[k] = { label: e.label, sub: e.sub, text: e.text, hit: e.hit, counter: e.counter, left: (s.dur || {})[k] || e.dur }; });
    const msg = { active: s.active, paused: s.paused, round: s.round, phase: this.phaseList()[s.phase], info: info, news: s.news || null };""")
R("""    const patch = { active: active, dur: dur, hand: s.hand.filter((k) => k !== key), confirm: null, sel: null, undo: { key: key, left: 10 }, log: [{ round: s.round, text: 'Evento jugado: ' + E[key].label + '. ' + E[key].text }].concat(s.log).slice(0, 14) };
    this.setState(patch);
    this.send({ active: active });""",
  """    const news = { key: key, label: E[key].label, sub: E[key].sub, text: E[key].text, hit: E[key].hit, counter: E[key].counter, round: s.round, at: Date.now() };
    const patch = { active: active, dur: dur, news: news, hand: s.hand.filter((k) => k !== key), confirm: null, sel: null, undo: { key: key, left: 10 }, log: [{ round: s.round, text: 'Evento jugado: ' + E[key].label + '. ' + E[key].text }].concat(s.log).slice(0, 14) };
    this.setState(patch);
    this.send({ active: active, dur: dur, news: news });""")
R("""    this.setState({ active: active, dur: dur, hand: s.hand.concat([key]), undo: null, log: s.log.slice(1), msg: { text: 'Evento deshecho: la carta volvió a tu mano.', tone: 'info' } });
    this.send({ active: active });""",
  """    const news = { key: key, label: this.eventCards()[key].label, undone: true, at: Date.now() };
    this.setState({ active: active, dur: dur, news: news, hand: s.hand.concat([key]), undo: null, log: s.log.slice(1), msg: { text: 'Evento deshecho: la carta volvió a tu mano.', tone: 'info' } });
    this.send({ active: active, dur: dur, news: news });""")

# ---------- empresas automáticas avanzan con las fases
R("""      this.setState({ phase: s.phase + 1, msg: { text: 'Fase ' + nx + ': ' + tips[nx], tone: nx === 'Evento' ? 'warn' : 'info' }, tab: nx === 'Evento' ? 'eventos' : s.tab });
      this.send({ phase: s.phase + 1 });
      return;
    }""", """      this.setState({ phase: s.phase + 1, bots: this.botStep(nx, false), msg: { text: 'Fase ' + nx + ': ' + tips[nx], tone: nx === 'Evento' ? 'warn' : 'info' }, tab: nx === 'Evento' ? 'eventos' : s.tab });
      this.send({ phase: s.phase + 1 });
      return;
    }""")
R("""    this.setState({ round: s.round + 1, phase: 0, active: active, dur: dur, used: used, log: log.slice(0, 14), msg:""",
  """    const bots = this.botStep('Mercado', true);
    Object.keys(bots).forEach((id) => { if (bots[id].closed) { log.unshift({ round: s.round, text: bots[id].name + ' (automática) liquidó su operación.' }); delete bots[id].closed; } });
    this.setState({ round: s.round + 1, phase: 0, active: active, dur: dur, used: used, bots: bots, log: log.slice(0, 14), msg:""")
R("""  togglePause() {""", """  // Empresa automática: avanza un tramo por fase salvo que un evento la golpee (entonces 1 de cada 2 veces);
  // al cerrar la ronda liquida si completó los tramos y arranca una operación nueva.
  botStep(phaseName, closing) {
    const s = this.state, rows = this.companies(), bots = JSON.parse(JSON.stringify(s.bots || {}));
    const roll = (id) => { let hsh = 7; (id + s.round + phaseName).split('').forEach((ch) => { hsh = (hsh * 31 + ch.charCodeAt(0)) % 1000; }); return hsh / 1000; };
    rows.forEach((c) => {
      if (!c.bot) return;
      const b = bots[c.id] || { filled: c.filled, done: 0, name: c.name };
      b.name = c.name;
      if (closing) {
        if (b.filled >= c.req) { b.done += 1; b.filled = 0; b.closed = true; }
      } else if (b.filled < c.req) {
        const hit = c.why.some((w) => !w.up);
        if (!hit || roll(c.id) > 0.5) b.filled += 1;
      }
      bots[c.id] = b;
    });
    return bots;
  }

  companyGeo() {
    return { cafe: [8.75, -75.88], acui: [9.3, -75.4], caribe: [10.39, -75.51], rot: [51.92, 4.48], shz: [22.54, 114.06], aero: [4.7, -74.14] };
  }

  togglePause() {""")

# ---------- companies(): datos en vivo por empresa, humanos o automática
R("""      let filled = c.filled, req = c.req, hand = c.hand, live = false, glosas = 0, days = null, inc = '', visto = '';
      const p = this.state.player;
      if (c.id === 'cafe' && p) { filled = p.filled; req = p.required; hand = p.hand; live = true; glosas = p.glosas; days = p.days; inc = p.incoterm || ''; visto = p.visto || ''; if (p.executed) filled = req; }
      return { id: c.id, name: c.name, meta: c.meta, m: m, o: o, x: x, why: why, hand: hand, op: c.op, filled: filled, req: req, live: live, glosas: glosas, days: days, inc: inc, visto: visto, executed: c.id === 'cafe' && p ? p.executed : filled >= req };""",
  """      let filled = c.filled, req = c.req, hand = c.hand, live = false, glosas = 0, days = null, inc = '', visto = '';
      const p = (this.state.players || {})[c.id] || (c.id === 'cafe' ? this.state.player : null);
      const humans = (this.props.roster || {})[c.id] || [];
      const bot = !p && !humans.length;
      if (p) { filled = p.filled; req = p.required; hand = p.hand; live = true; glosas = p.glosas; days = p.days; inc = p.incoterm || ''; visto = p.visto || ''; if (p.executed) filled = req; if (typeof p.margenPct === 'number') m = p.margenPct; if (typeof p.otif === 'boolean') o = p.otif ? Math.max(o, 95) : Math.min(o, 80); }
      const b = bot ? (this.state.bots || {})[c.id] : null;
      if (b) filled = Math.min(req, b.filled);
      return { id: c.id, name: c.name, meta: c.meta, m: m, o: o, x: x, why: why, hand: hand, op: c.op, filled: filled, req: req, live: live, glosas: glosas, days: days, inc: inc, visto: visto, executed: p ? p.executed : filled >= req, bot: bot, humans: humans, done: b ? b.done : 0 };""")

# ---------- vista de cada tarjeta
R("""        name: c.name, meta: c.meta, rank: rank + 1,""",
  """        name: c.name, meta: c.meta, rank: rank + 1,
        who: c.bot ? 'Automática' + (c.done ? ' · ' + c.done + ' operación' + (c.done === 1 ? '' : 'es') + ' liquidada' + (c.done === 1 ? '' : 's') : '') : 'Equipo: ' + (c.humans.length ? c.humans.join(', ') : 'conectado'),
        whoStyle: 'align-self: flex-start; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; ' + (c.bot ? 'background: ' + t.soft + '; color: ' + t.quiet : 'background: ' + t.okBg + '; color: ' + (night ? t.text : '#0E7C55')),""")

# ---------- acciones y valores nuevos
R("""    actions.push(btn(s.paused ? 'Reanudar' : 'Pausar', () => this.togglePause(), 'ghost', false, s.paused));""",
  """    actions.push(btn(s.handOpen ? 'Ocultar cartas ▾' : 'Mostrar cartas ▴', () => this.setState({ handOpen: !s.handOpen }), 'ghost', false, !s.handOpen));
    actions.push(btn(s.paused ? 'Reanudar' : 'Pausar', () => this.togglePause(), 'ghost', false, s.paused));""")
R("""      tabs: tabs, actions: actions, cards: cards, log: log,""", """      tabs: tabs, actions: actions, cards: cards, log: log, handOpen: s.handOpen !== false,
      ...this.globeCtl(t, s),""")
R("""  nodeVals(t, s, act) {""", """  globeCtl(t, s) {
    const spinning = s.spin === null || s.spin === undefined ? this.props.rotar !== false : s.spin;
    const chip = (on) => 'font: inherit; font-size: 13px; font-weight: 600; min-height: 44px; padding: 0 12px; border-radius: 12px; cursor: pointer; ' + (on ? 'background: ' + t.accent + '; color: ' + t.accentInk + '; border: 1px solid ' + t.accent : 'background: ' + t.card + '; color: ' + t.text + '; border: 1px solid ' + t.border2);
    const short = { cafe: 'Café Sinú', acui: 'Acuícola', caribe: 'Caribe Line', rot: 'Rotterdam', shz: 'Shenzhen', aero: 'AeroCarga' };
    return {
      spinLabel: spinning ? 'Detener giro' : 'Reanudar giro', spinPressed: spinning ? 'false' : 'true', spinStyle: chip(!spinning),
      toggleSpin: () => this.setState({ spin: !spinning }),
      focusBtns: Object.keys(short).map((id) => ({ label: short[id], pressed: s.focus === id ? 'true' : 'false', style: chip(s.focus === id), pick: () => this.setState({ focus: s.focus === id ? null : id, spin: false }) }))
    };
  }

  nodeVals(t, s, act) {""")
p.write_text(s, encoding='utf-8')
print('Mesa v3 aplicada a la plantilla.')
