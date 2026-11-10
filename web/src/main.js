import * as THREE from 'three';
import { h, render, Component } from 'preact';
import htm from 'htm';
import * as lv from './lv.js';
import { ScreenHost } from './host.js';
import { SCREENS } from './screens.gen.js';

window.THREE = THREE; // las escenas 3D esperan Three.js global (r160, igual que en el lienzo)
const html = htm.bind(h);

/* ---------------- catálogo de pantallas ---------------- */
const GROUPS = [
  { title: 'Mesa del equipo', note: 'Una pantalla grande por equipo: turno guiado por fases, cartas y bitácora.', items: [['Jugador', 'Mesa del jugador']] },
  { title: 'Vistas por rol (celular)', note: 'Cada integrante puede abrir su rol en el teléfono.', items: [['Comercial', 'Gerente Comercial · Incoterms'], ['CFO', 'CFO · Tesorería'], ['Aduana', 'Retos tipo Saber Pro']] },
  { title: 'Planeación', note: 'Herramientas de apoyo para Tráfico y la cadena de suministro.', items: [['Trafico', 'Planificador multimodal'], ['Cadena', 'Cadena y negociación'], ['Seleccion', 'Lobby de empresas']] },
  { title: 'Nodos 3D', note: 'Operación de puerto, aeropuerto y terminal terrestre.', items: [['Puerto', 'Puerto de Cartagena'], ['Aeropuerto', 'Aeropuerto El Dorado'], ['Terminal', 'Terminal de Laredo']] },
  { title: 'Docente', note: 'Mueve el mundo de la partida: fases, eventos y nodos.', items: [['Mesa', 'Mesa del Superusuario'], ['Main', 'Consola v1']], teacher: true }
];
const TEAMS = ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4', 'Equipo 5', 'Equipo 6'];

/* ---------------- estilos ---------------- */
const C = { bg: '#EEF1F8', card: '#FFFFFF', soft: '#F1F4FB', border: '#E3E7F0', border2: '#C9D2E6', text: '#14213D', quiet: '#55627A', accent: '#1F5EFF', ok: '#0E7C55', bad: '#B01F2E', yellow: '#FFF4CC' };
const S = {
  page: 'max-width: 1080px; margin: 0 auto; padding: 24px 16px 48px; box-sizing: border-box',
  card: 'background: #FFFFFF; border: 1px solid ' + C.border + '; border-radius: 18px; padding: 20px; box-sizing: border-box',
  h1: "margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700",
  h2: "margin: 0 0 8px; font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600",
  label: 'display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 600',
  input: 'font: inherit; font-size: 16px; min-height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid ' + C.border2 + '; background: #FFFFFF; color: ' + C.text + '; box-sizing: border-box; width: 100%',
  btn: (kind) => 'font: inherit; font-size: 15px; font-weight: 600; min-height: 44px; padding: 0 16px; border-radius: 12px; cursor: pointer; ' + (kind === 'primary' ? 'background: ' + C.accent + '; color: #FFFFFF; border: 1px solid ' + C.accent : 'background: #FFFFFF; color: ' + C.text + '; border: 1px solid ' + C.border2),
  quiet: 'font-size: 14px; color: ' + C.quiet + '; line-height: 1.5',
  err: 'font-size: 14px; color: ' + C.bad + '; font-weight: 600'
};
const Logo = () => html`<span style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700">Logi<span style="color: ${C.accent}">Verse</span></span>`;

/* ---------------- enrutador ---------------- */
function route() { const r = (location.hash || '#/').slice(1); const parts = r.split('/').filter(Boolean); return { page: parts[0] || '', arg: parts[1] || '' }; }
const go = (h2) => { location.hash = h2; };

class App extends Component {
  constructor() { super(); this.state = { r: route() }; this.onHash = () => this.setState({ r: route() }); }
  componentDidMount() { window.addEventListener('hashchange', this.onHash); }
  componentWillUnmount() { window.removeEventListener('hashchange', this.onHash); }
  render() {
    const r = this.state.r, s = lv.session.get();
    if (r.page === 'p') return html`<${ScreenPage} key=${r.arg} name=${r.arg} />`;
    if (r.page === 'docente') return html`<${Teacher} />`;
    if (r.page === 'encuesta') return html`<${Survey} />`;
    if (!lv.ONLINE) return html`<${Menu} local=${true} />`;
    return s && s.partida ? html`<${Menu} />` : html`<${Join} />`;
  }
}

/* ---------------- ingreso del estudiante ---------------- */
class Join extends Component {
  constructor() { super(); this.state = { codigo: new URLSearchParams(location.search).get('c') || '', alias: '', equipo: 'Equipo 1', ok: false, busy: false, err: '' }; }
  async submit(e) {
    e.preventDefault();
    const st = this.state;
    if (!/^[A-Za-z0-9]{6}$/.test(st.codigo.trim())) { this.setState({ err: 'El código de la partida tiene 6 caracteres.' }); return; }
    if (!st.alias.trim()) { this.setState({ err: 'Escribe un alias (no uses tu nombre completo).' }); return; }
    if (!st.ok) { this.setState({ err: 'Para participar debes aceptar el consentimiento.' }); return; }
    this.setState({ busy: true, err: '' });
    try { await lv.joinGame(st.codigo, st.alias, st.equipo, st.ok); go('#/'); this.props.done && this.props.done(); location.reload(); }
    catch (x) { this.setState({ busy: false, err: x.message }); }
  }
  render(p, st) {
    return html`<main style=${S.page}>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px"><${Logo} /><a href="#/docente" style="font-size: 14px; font-weight: 600">Soy docente</a></div>
      <form onSubmit=${(e) => this.submit(e)} style=${S.card + '; max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px'}>
        <h1 style=${S.h1}>Entrar a la partida</h1>
        <p style=${S.quiet + '; margin: 0'}>Tu docente proyecta un código de 6 caracteres. Usa un alias: no se guarda tu nombre ni tu correo.</p>
        <label style=${S.label}>Código de la partida
          <input style=${S.input + '; text-transform: uppercase; letter-spacing: 0.2em; font-family: IBM Plex Mono, monospace'} maxlength="6" autocomplete="off" value=${st.codigo} onInput=${(e) => this.setState({ codigo: e.target.value })} /></label>
        <label style=${S.label}>Alias
          <input style=${S.input} maxlength="40" autocomplete="nickname" value=${st.alias} onInput=${(e) => this.setState({ alias: e.target.value })} /></label>
        <label style=${S.label}>Equipo
          <select style=${S.input} value=${st.equipo} onChange=${(e) => this.setState({ equipo: e.target.value })}>${TEAMS.map((t) => html`<option value=${t}>${t}</option>`)}</select></label>
        <details style="font-size: 14px; line-height: 1.5; background: ${C.soft}; border-radius: 12px; padding: 10px 12px">
          <summary style="font-weight: 600; cursor: pointer">Consentimiento informado</summary>
          <p>Participas en una prueba de un laboratorio virtual de logística internacional de la Universidad Pontificia Bolivariana (Montería). La aplicación guarda tu alias, tu equipo, tus decisiones en el juego, tus respuestas a los retos y, si la respondes, una encuesta de usabilidad. No pide nombre, documento ni correo.</p>
          <p>Los datos se usan solo para evaluar y mejorar el laboratorio y, de forma agregada y anónima, en informes académicos. Tu participación es voluntaria, no afecta tu calificación y puedes retirarte cuando quieras. Tratamiento conforme a la Ley 1581 de 2012; para consultas o retirar tus datos, escribe a tu docente.</p>
        </details>
        <label style="display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 1.45; cursor: pointer"><input type="checkbox" checked=${st.ok} onChange=${(e) => this.setState({ ok: e.target.checked })} style="width: 22px; height: 22px; flex: none; margin: 0" />Leí el consentimiento y acepto participar.</label>
        ${st.err ? html`<p role="alert" style=${S.err + '; margin: 0'}>${st.err}</p>` : null}
        <button type="submit" disabled=${st.busy} style=${S.btn('primary')}>${st.busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>`;
  }
}

/* ---------------- menú de pantallas ---------------- */
class Menu extends Component {
  componentDidMount() { if (!this.props.local) lv.connectRealtime('menú'); }
  render(p) {
    const s = lv.session.get() || {}, teacher = p.local || s.docente;
    return html`<main style=${S.page}>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px">
        <${Logo} />
        ${p.local ? html`<a href="#/docente" style="font-size: 14px; font-weight: 600">Panel docente</a>` : html`<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
          <span style="font-family: IBM Plex Mono, monospace; font-size: 14px; padding: 6px 12px; border-radius: 999px; background: ${C.yellow}">Partida ${s.partida.codigo}</span>
          <span style="font-size: 14px; font-weight: 600">${s.alias} · ${s.docente ? 'Docente' : s.equipo}</span>
          <${Status} />
          ${s.docente ? html`<a href="#/docente" style="font-size: 14px; font-weight: 600">Panel docente</a>` : html`<a href="#/encuesta" style="font-size: 14px; font-weight: 600">Encuesta final</a>`}
          <button type="button" style=${S.btn()} onClick=${async () => { await lv.signOut(); location.hash = '#/'; location.reload(); }}>Salir</button></div>`}
      </div>
      ${p.local ? html`<p role="note" style="margin: 0 0 18px; padding: 12px 14px; border-radius: 12px; background: ${C.yellow}; font-size: 14px; line-height: 1.5"><strong>Modo local de demostración.</strong> Las pantallas se comunican entre pestañas de este navegador y no se guarda ningún dato. Para jugar entre varios computadores hay que conectar Supabase.</p>` : null}
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px">
        ${GROUPS.filter((g) => !g.teacher || teacher).map((g) => html`<section style=${S.card}>
          <h2 style=${S.h2}>${g.title}</h2><p style=${S.quiet + '; margin: 0 0 12px'}>${g.note}</p>
          <div style="display: flex; flex-direction: column; gap: 8px">${g.items.map((it) => html`<a href=${'#/p/' + it[0]} style="display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 0 14px; border-radius: 12px; border: 1px solid ${C.border2}; text-decoration: none; color: ${C.text}; font-weight: 600; font-size: 15px">${it[1]}<span aria-hidden="true">→</span></a>`)}</div>
        </section>`)}
      </div>
    </main>`;
  }
}

class Status extends Component {
  componentDidMount() { this.off = lv.onStatus((st, pres) => this.setState({ st: st, n: Object.keys(pres || {}).length })); }
  componentWillUnmount() { if (this.off) this.off(); }
  render(p, st) {
    const on = st.st === 'en línea', col = on ? C.ok : (st.st === 'local' ? C.quiet : '#B3600C');
    return html`<span role="status" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: ${col}"><span style="width: 9px; height: 9px; border-radius: 50%; background: ${col}"></span>${st.st || 'local'}${on && st.n ? ' · ' + st.n + ' conectados' : ''}</span>`;
  }
}

/* ---------------- página de una pantalla ---------------- */
class ScreenPage extends Component {
  constructor(props) { super(props); this.state = { w: window.innerWidth }; this.onResize = () => this.setState({ w: window.innerWidth }); }
  componentDidMount() {
    window.addEventListener('resize', this.onResize);
    lv.connectRealtime(this.props.name);
    lv.logEvent('pantalla', this.props.name, { ancho: window.innerWidth, alto: window.innerHeight });
  }
  componentWillUnmount() { window.removeEventListener('resize', this.onResize); }
  render(p, st) {
    const scr = SCREENS[p.name], s = lv.session.get();
    if (!scr) return html`<main style=${S.page}><p>No existe esa pantalla. <a href="#/">Volver al menú</a></p></main>`;
    if (lv.ONLINE && !s) { go('#/'); return null; }
    const teacherOnly = p.name === 'Mesa' || p.name === 'Main';
    if (lv.ONLINE && teacherOnly && !s.docente) return html`<main style=${S.page}><p>Esta pantalla es del docente. <a href="#/">Volver al menú</a></p></main>`;
    const w = scr.preview.width, zoom = Math.min(1, st.w / w);
    return html`<div>
      <nav aria-label="Navegación del piloto" style="position: sticky; top: 0; z-index: 50; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 6px 12px; background: #14213D; color: #FFFFFF; font-size: 13px">
        <a href="#/" style="color: #FFFFFF; font-weight: 700; min-height: 32px; display: inline-flex; align-items: center; padding: 0 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.35); text-decoration: none">← Menú</a>
        <span style="font-weight: 600">${scr.title}</span>
        <span style="flex: 1"></span>
        ${s ? html`<span>Partida ${s.partida.codigo} · ${s.alias} · ${s.docente ? 'Docente' : s.equipo}</span>` : html`<span>Modo local</span>`}
        <span style="background: #FFFFFF; border-radius: 999px; padding: 2px 10px"><${Status} /></span>
      </nav>
      <div style=${'zoom: ' + zoom.toFixed(4) + '; width: ' + w + 'px; margin: 0 auto; background: #FFFFFF'}>
        <${ScreenHost} screen=${p.name} />
      </div>
    </div>`;
  }
}

/* ---------------- panel docente ---------------- */
class Teacher extends Component {
  constructor() { super(); this.state = { user: null, loading: true, email: '', pass: '', err: '', info: '', games: [], name: '', sel: null, teams: [], busy: false }; }
  async componentDidMount() {
    if (!lv.ONLINE) { this.setState({ loading: false }); return; }
    const u = await lv.currentUser();
    const user = u && !u.is_anonymous ? u : null;
    this.setState({ user: user, loading: false });
    if (user) { this.load(); const s = lv.session.get(); if (s && s.docente) lv.connectRealtime('panel docente'); }
    this.iv = setInterval(() => this.refreshTeams(), 5000);
  }
  componentWillUnmount() { clearInterval(this.iv); }
  async load() { try { const g = await lv.myGames(); const s = lv.session.get(); this.setState({ games: g, sel: s && s.docente ? g.find((x) => x.id === s.partida.id) || null : null }); this.refreshTeams(); } catch (e) { this.setState({ err: e.message }); } }
  async refreshTeams() { if (!this.state.sel) return; const t = await lv.teamStates(); this.setState({ teams: t }); }
  async auth(create) {
    this.setState({ busy: true, err: '', info: '' });
    try {
      const { data } = await lv.sb.auth.getSession();
      if (data.session && data.session.user.is_anonymous) await lv.signOut();
      const r = await lv.teacherSignIn(this.state.email.trim(), this.state.pass, create);
      if (r.needsConfirm) { this.setState({ busy: false, info: 'Revisa tu correo y confirma la cuenta; luego ingresa.' }); return; }
      this.setState({ user: r.user, busy: false }); this.load();
    } catch (e) { this.setState({ busy: false, err: e.message }); }
  }
  async create(e) {
    e.preventDefault(); if (!this.state.name.trim()) return;
    try { const g = await lv.createGame(this.state.name.trim()); await lv.openAsTeacher(g); this.setState({ name: '' }); this.load(); } catch (x) { this.setState({ err: x.message }); }
  }
  async pick(g) { await lv.openAsTeacher(g); lv.connectRealtime('panel docente'); this.setState({ sel: g, teams: [] }); this.refreshTeams(); }
  async toggle(g) { await lv.setGameState(g.id, g.estado === 'abierta' ? 'cerrada' : 'abierta'); this.load(); }
  async dl(t) { try { const n = await lv.exportCsv(this.state.sel.id, t); this.setState({ info: 'Descargadas ' + n + ' filas de ' + t + '.' }); } catch (e) { this.setState({ err: e.message }); } }
  render(p, st) {
    const head = html`<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px"><${Logo} /><a href="#/" style="font-size: 14px; font-weight: 600">Menú de pantallas</a></div>`;
    if (!lv.ONLINE) return html`<main style=${S.page}>${head}<section style=${S.card}><h1 style=${S.h1}>Panel docente</h1><p style=${S.quiet}>La app está en modo local: falta conectar Supabase (variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel). Mientras tanto puedes abrir la Mesa del Superusuario y la del jugador en dos pestañas de este navegador.</p></section></main>`;
    if (st.loading) return html`<main style=${S.page}>${head}<p>Cargando…</p></main>`;
    if (!st.user) {
      return html`<main style=${S.page}>${head}<form onSubmit=${(e) => { e.preventDefault(); this.auth(false); }} style=${S.card + '; max-width: 460px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px'}>
        <h1 style=${S.h1}>Panel docente</h1>
        <label style=${S.label}>Correo<input type="email" autocomplete="email" style=${S.input} value=${st.email} onInput=${(e) => this.setState({ email: e.target.value })} /></label>
        <label style=${S.label}>Contraseña<input type="password" autocomplete="current-password" minlength="8" style=${S.input} value=${st.pass} onInput=${(e) => this.setState({ pass: e.target.value })} /></label>
        ${st.err ? html`<p role="alert" style=${S.err + '; margin: 0'}>${st.err}</p>` : null}${st.info ? html`<p role="status" style="margin: 0; font-size: 14px">${st.info}</p>` : null}
        <div style="display: flex; flex-wrap: wrap; gap: 8px"><button type="submit" disabled=${st.busy} style=${S.btn('primary')}>Ingresar</button><button type="button" disabled=${st.busy} onClick=${() => this.auth(true)} style=${S.btn()}>Crear cuenta</button></div>
      </form></main>`;
    }
    const sel = st.sel;
    return html`<main style=${S.page}>${head}
      <div style="display: grid; grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); gap: 14px; align-items: start">
        <section style=${S.card}>
          <h2 style=${S.h2}>Partidas</h2>
          <form onSubmit=${(e) => this.create(e)} style="display: flex; gap: 8px; margin-bottom: 12px"><input aria-label="Nombre de la nueva partida" placeholder="Ej.: Logística internacional · grupo 1" style=${S.input} value=${st.name} onInput=${(e) => this.setState({ name: e.target.value })} /><button type="submit" style=${S.btn('primary')}>Crear</button></form>
          <div style="display: flex; flex-direction: column; gap: 6px">${st.games.map((g) => html`<button type="button" onClick=${() => this.pick(g)} aria-pressed=${sel && sel.id === g.id ? 'true' : 'false'} style=${'text-align: left; font: inherit; padding: 10px 12px; border-radius: 12px; cursor: pointer; color: ' + C.text + '; background: ' + (sel && sel.id === g.id ? '#E4ECFF' : C.soft) + '; border: ' + (sel && sel.id === g.id ? '2px solid ' + C.accent : '1px solid ' + C.border)}>
            <span style="display: block; font-weight: 600">${g.nombre}</span><span style="font-size: 13px; color: ${C.quiet}; font-family: IBM Plex Mono, monospace">${g.codigo} · ${g.estado} · ${new Date(g.creada).toLocaleDateString('es-CO')}</span></button>`)}
            ${st.games.length ? null : html`<p style=${S.quiet}>Aún no tienes partidas.</p>`}</div>
          <button type="button" style=${S.btn() + '; margin-top: 12px'} onClick=${async () => { await lv.signOut(); location.reload(); }}>Cerrar sesión (${st.user.email})</button>
        </section>
        ${sel ? html`<section style=${S.card + '; display: flex; flex-direction: column; gap: 14px'}>
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: center">
            <div><h2 style=${S.h2}>${sel.nombre}</h2><${Status} /></div>
            <div style="text-align: center"><span style="display: block; font-size: 13px; color: ${C.quiet}">Código para proyectar</span><span style="font-family: IBM Plex Mono, monospace; font-size: 40px; font-weight: 600; letter-spacing: 0.15em">${sel.codigo}</span></div>
          </div>
          <p style=${S.quiet + '; margin: 0'}>Los estudiantes entran en ${location.origin}/?c=${sel.codigo} con alias y equipo. Abre la Mesa del Superusuario en el proyector y avanza las fases desde allí.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <a href="#/p/Mesa" style=${S.btn('primary') + '; display: inline-flex; align-items: center; text-decoration: none'}>Abrir Mesa del Superusuario</a>
            <button type="button" style=${S.btn()} onClick=${() => this.toggle(sel)}>${sel.estado === 'abierta' ? 'Cerrar inscripciones' : 'Reabrir partida'}</button>
          </div>
          <h2 style=${S.h2 + '; margin-top: 6px'}>Equipos (se actualiza cada 5 s)</h2>
          <div style="overflow-x: auto"><table style="width: 100%; border-collapse: collapse; font-size: 14px">
            <thead><tr>${['Equipo', 'Incoterm', 'Visto CEO', 'Documentos', 'Glosas', 'Decisiones', 'Margen', 'OTIF', 'Liquidó', 'Actualizado'].map((x) => html`<th scope="col" style="text-align: left; padding: 8px; border-bottom: 2px solid ${C.border2}; font-size: 12px; color: ${C.quiet}">${x}</th>`)}</tr></thead>
            <tbody>${st.teams.sort((a, b) => a.emisor.localeCompare(b.emisor)).map((t) => { const m = t.payload || {}; return html`<tr>
              <td style="padding: 8px; border-bottom: 1px solid ${C.border}; font-weight: 600">${t.emisor}</td><td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.incoterm || '–'}</td>
              <td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.visto || '–'}</td><td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.filled != null ? m.filled + ' de ' + m.required : '–'}</td>
              <td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.glosas != null ? m.glosas : '–'}</td><td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.decisions != null ? m.decisions : '–'}</td>
              <td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.margenPct != null ? m.margenPct.toFixed(1) + ' %' : '–'}</td><td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.otif == null ? '–' : (m.otif ? 'sí' : 'no')}</td>
              <td style="padding: 8px; border-bottom: 1px solid ${C.border}">${m.executed ? 'sí' : 'no'}</td><td style="padding: 8px; border-bottom: 1px solid ${C.border}; font-size: 12px">${new Date(t.actualizado).toLocaleTimeString('es-CO')}</td></tr>`; })}</tbody>
          </table>${st.teams.length ? null : html`<p style=${S.quiet}>Ningún equipo ha jugado todavía.</p>`}</div>
          <h2 style=${S.h2 + '; margin-top: 6px'}>Datos del piloto (CSV)</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 8px">${[['eventos', 'Decisiones y eventos'], ['participantes', 'Participantes'], ['encuestas', 'Encuestas SUS'], ['estado_canal', 'Estado final por equipo']].map((x) => html`<button type="button" style=${S.btn()} onClick=${() => this.dl(x[0])}>${x[1]}</button>`)}</div>
          ${st.err ? html`<p role="alert" style=${S.err}>${st.err}</p>` : null}${st.info ? html`<p role="status" style="font-size: 14px; margin: 0">${st.info}</p>` : null}
        </section>` : html`<section style=${S.card}><p style=${S.quiet}>Crea una partida o elige una para ver su código, abrir la Mesa del Superusuario y descargar los datos.</p>${st.err ? html`<p role="alert" style=${S.err}>${st.err}</p>` : null}</section>`}
      </div>
    </main>`;
  }
}

/* ---------------- encuesta SUS ---------------- */
const SUS = ['Creo que me gustaría usar este laboratorio con frecuencia.', 'Encontré el laboratorio innecesariamente complejo.', 'Pensé que era fácil de usar.', 'Creo que necesitaría el apoyo de una persona experta para poder usarlo.', 'Encontré que sus funciones estaban bien integradas.', 'Pensé que había demasiada inconsistencia.', 'Imagino que la mayoría de las personas aprendería a usarlo muy rápido.', 'Lo encontré muy engorroso de usar.', 'Me sentí muy seguro/a usándolo.', 'Necesité aprender muchas cosas antes de poder empezar.'];
class Survey extends Component {
  constructor() { super(); this.state = { a: {}, util: '', cambio: '', rol: '', busy: false, done: false, err: '' }; }
  async send(e) {
    e.preventDefault();
    const a = this.state.a;
    if (SUS.some((x, i) => !a[i])) { this.setState({ err: 'Responde las 10 afirmaciones.' }); return; }
    const score = SUS.reduce((t, x, i) => t + (i % 2 === 0 ? a[i] - 1 : 5 - a[i]), 0) * 2.5;
    this.setState({ busy: true, err: '' });
    try { await lv.saveSurvey(a, score, { mas_util: this.state.util, cambiaria: this.state.cambio, rol: this.state.rol }); this.setState({ done: true, busy: false, score: score }); }
    catch (x) { this.setState({ busy: false, err: x.message }); }
  }
  render(p, st) {
    const s = lv.session.get();
    if (!lv.ONLINE || !s || s.docente) return html`<main style=${S.page}><p>La encuesta la responden los estudiantes dentro de una partida. <a href="#/">Volver</a></p></main>`;
    if (st.done) return html`<main style=${S.page}><section style=${S.card + '; max-width: 640px; margin: 0 auto'}><h1 style=${S.h1}>¡Gracias!</h1><p style=${S.quiet}>Tu respuesta quedó guardada.</p><a href="#/">Volver al menú</a></section></main>`;
    return html`<main style=${S.page}><form onSubmit=${(e) => this.send(e)} style=${S.card + '; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px'}>
      <h1 style=${S.h1}>Encuesta final (5 min)</h1>
      <p style=${S.quiet + '; margin: 0'}>1 = totalmente en desacuerdo · 5 = totalmente de acuerdo.</p>
      ${SUS.map((q, i) => html`<fieldset style="border: 1px solid ${C.border}; border-radius: 12px; padding: 10px 12px; margin: 0">
        <legend style="font-size: 15px; font-weight: 600; padding: 0 4px">${i + 1}. ${q}</legend>
        <div style="display: flex; gap: 6px; flex-wrap: wrap">${[1, 2, 3, 4, 5].map((v) => html`<label style=${'display: inline-flex; align-items: center; justify-content: center; min-width: 48px; min-height: 44px; border-radius: 10px; cursor: pointer; font-weight: 600; border: 1px solid ' + (st.a[i] === v ? C.accent : C.border2) + '; background: ' + (st.a[i] === v ? '#E4ECFF' : '#FFFFFF')}><input type="radio" name=${'q' + i} value=${v} checked=${st.a[i] === v} onChange=${() => this.setState({ a: Object.assign({}, st.a, { [i]: v }) })} style="position: absolute; opacity: 0; width: 1px; height: 1px" />${v}</label>`)}</div>
      </fieldset>`)}
      <label style=${S.label}>¿Qué rol jugaste más?<select style=${S.input} value=${st.rol} onChange=${(e) => this.setState({ rol: e.target.value })}><option value="">Elige</option>${['CEO', 'Comercial', 'Tráfico', 'Aduanas', 'CFO', 'Riesgos', 'Varios'].map((r) => html`<option value=${r}>${r}</option>`)}</select></label>
      <label style=${S.label}>¿Qué fue lo más útil para aprender?<textarea rows="3" style=${S.input + '; padding: 10px 12px'} value=${st.util} onInput=${(e) => this.setState({ util: e.target.value })}></textarea></label>
      <label style=${S.label}>¿Qué cambiarías o qué te confundió?<textarea rows="3" style=${S.input + '; padding: 10px 12px'} value=${st.cambio} onInput=${(e) => this.setState({ cambio: e.target.value })}></textarea></label>
      ${st.err ? html`<p role="alert" style=${S.err + '; margin: 0'}>${st.err}</p>` : null}
      <button type="submit" disabled=${st.busy} style=${S.btn('primary')}>${st.busy ? 'Enviando…' : 'Enviar encuesta'}</button>
    </form></main>`;
  }
}

const start = () => render(html`<${App} />`, document.getElementById('app'));
// Antes de montar, recupera el estado guardado de la partida (instantáneas y último mundo).
(lv.ONLINE && lv.session.get() ? lv.hydrate().catch(() => {}) : Promise.resolve()).then(start);
