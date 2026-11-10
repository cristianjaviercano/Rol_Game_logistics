// Herramientas del docente: analítica de aprendizaje, banco de retos y repetición de la partida.
import { h, Component } from 'preact';
import htm from 'htm';
import * as lv from './lv.js';

const html = htm.bind(h);
const C = { card: '#FFFFFF', soft: '#F1F4FB', border: '#E3E7F0', border2: '#C9D2E6', text: '#14213D', quiet: '#55627A', accent: '#1F5EFF', ok: '#0E7C55', bad: '#B01F2E', warn: '#B3600C' };
const S = {
  h2: "margin: 0 0 8px; font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600",
  quiet: 'font-size: 14px; color: ' + C.quiet + '; line-height: 1.5',
  btn: (on) => 'font: inherit; font-size: 14px; font-weight: 600; min-height: 44px; padding: 0 14px; border-radius: 12px; cursor: pointer; ' + (on ? 'background: ' + C.accent + '; color: #FFFFFF; border: 1px solid ' + C.accent : 'background: #FFFFFF; color: ' + C.text + '; border: 1px solid ' + C.border2),
  input: 'font: inherit; font-size: 15px; min-height: 44px; padding: 0 10px; border-radius: 10px; border: 1px solid ' + C.border2 + '; box-sizing: border-box; width: 100%; background: #FFFFFF; color: ' + C.text,
  th: 'text-align: left; padding: 8px; border-bottom: 2px solid ' + C.border2 + '; font-size: 12px; color: ' + C.quiet,
  td: 'padding: 8px; border-bottom: 1px solid ' + C.border + '; font-size: 14px; vertical-align: top'
};
export const EJES = { incoterms: 'Incoterms', aranceles: 'Aranceles', regimenes: 'Regímenes aduaneros', transporte: 'Transporte', cubicaje: 'Cubicaje', geografia: 'Geografía económica', documentos: 'Documentos', finanzas: 'Finanzas' };
export const COMPS = { interpretacion: 'Interpretación', argumentacion: 'Argumentación', proposicion: 'Proposición' };
const empName = (id) => (lv.EMPRESAS.find((e) => e.id === id) || { name: id }).name;
const pct = (ok, n) => (n ? Math.round(ok / n * 100) : null);
const fmt = (v, d) => (v == null || isNaN(v) ? '–' : Number(v).toFixed(d || 0).replace('.', ','));

const Bar = ({ value, color }) => html`<span style="display: inline-flex; align-items: center; gap: 8px; min-width: 160px">
  <span style="flex: 1; height: 10px; border-radius: 999px; background: ${C.soft}; overflow: hidden"><span style=${'display: block; height: 100%; width: ' + (value || 0) + '%; background: ' + (color || C.accent)}></span></span>
  <span style="font-family: 'IBM Plex Mono', monospace; font-size: 13px; min-width: 42px; text-align: right">${value == null ? '–' : value + ' %'}</span></span>`;

function tally(list) {
  const out = {};
  list.forEach((x) => { const k = x.k; out[k] = out[k] || { ok: 0, n: 0 }; out[k].n += 1; if (x.ok) out[k].ok += 1; });
  return out;
}

/* ---------------- analítica de aprendizaje ---------------- */
export class Analitica extends Component {
  constructor() { super(); this.state = { loading: true, err: '', ev: [], res: [], mem: [], who: '' }; }
  async componentDidMount() {
    try {
      const [ev, res, mem] = await Promise.all([lv.readAll('eventos'), lv.readAll('resultados'), lv.members()]);
      this.setState({ loading: false, ev: ev, res: res, mem: mem });
    } catch (e) { this.setState({ loading: false, err: e.message }); }
  }
  render(p, st) {
    if (st.loading) return html`<p style=${S.quiet}>Cargando datos de la sala…</p>`;
    if (st.err) return html`<p role="alert" style="color: ${C.bad}">${st.err}</p>`;
    const retos = st.ev.filter((e) => e.tipo === 'reto' && e.datos);
    const decis = st.ev.filter((e) => e.tipo === 'bitacora' && e.pantalla === 'Jugador' && e.datos);
    const emps = Array.from(new Set(st.res.map((r) => r.empresa).concat(retos.map((r) => r.emisor)).concat(decis.map((d) => d.emisor)))).filter((x) => x && x !== 'gm');
    const rondas = Array.from(new Set(st.res.map((r) => r.ronda))).sort((a, b) => a - b);
    const byComp = tally(retos.map((r) => ({ k: r.datos.competencia, ok: r.datos.ok })));
    const byEje = tally(retos.map((r) => ({ k: r.datos.eje, ok: r.datos.ok })));
    const empComp = (e) => tally(retos.filter((r) => r.emisor === e).map((r) => ({ k: r.datos.competencia, ok: r.datos.ok })));
    const nivel = tally(retos.map((r) => ({ k: 'N' + (r.datos.dificultad || 2), ok: r.datos.ok })));
    // informe individual: los roles de cada integrante salen del reparto por orden de llegada
    const persona = st.mem.find((m) => m.alias === st.who);
    let informe = null;
    if (persona) {
      const roles = lv.rolesFor(st.mem, persona.equipo).byAlias[persona.alias] || [];
      const misRetos = retos.filter((r) => r.emisor === persona.equipo && roles.indexOf(r.datos.rol) >= 0);
      const misDec = decis.filter((d) => d.emisor === persona.equipo && roles.indexOf(d.datos.role) >= 0);
      const comp = tally(misRetos.map((r) => ({ k: r.datos.competencia, ok: r.datos.ok })));
      const of = st.res.filter((r) => r.empresa === persona.equipo).sort((a, b) => b.ronda - a.ronda)[0];
      informe = { persona: persona, roles: roles, retos: misRetos, dec: misDec, comp: comp, of: of };
    }
    return html`<div style="display: flex; flex-direction: column; gap: 18px">
      <section>
        <h2 style=${S.h2}>Liquidación oficial por ronda</h2>
        ${st.res.length ? html`<div style="overflow-x: auto"><table style="width: 100%; border-collapse: collapse">
          <thead><tr><th scope="col" style=${S.th}>Empresa</th>${rondas.map((r) => html`<th scope="col" style=${S.th}>Ronda ${r}</th>`)}<th scope="col" style=${S.th}>Tendencia</th></tr></thead>
          <tbody>${emps.map((e) => { const rs = rondas.map((r) => st.res.find((x) => x.ronda === r && x.empresa === e)); const pts = rs.map((x) => (x ? Number(x.puntaje) : null)); return html`<tr>
            <td style=${S.td + '; font-weight: 600'}>${empName(e)}</td>
            ${rs.map((x) => html`<td style=${S.td}>${x ? html`<strong>${fmt(x.puntaje, 1)}</strong> pts<br /><span style="font-size: 12px; color: ${C.quiet}">margen ${fmt(x.margen_pct, 1)} % · OTIF ${x.otif ? 'sí' : 'no'} · exactitud ${fmt(x.exactitud)} % · Saber ${fmt(x.saber_pct)} %</span>` : '–'}</td>`)}
            <td style=${S.td}><${Spark} values=${pts} /></td></tr>`; })}</tbody></table></div>` : html`<p style=${S.quiet}>Aún no hay liquidaciones oficiales: se calculan cuando la Mesa del Superusuario entra en la fase Liquidación.</p>`}
      </section>
      <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px">
        <div><h2 style=${S.h2}>Competencias Saber Pro (toda la sala)</h2>
          ${Object.keys(COMPS).map((k) => html`<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 6px 0"><span style="font-size: 14px">${COMPS[k]} <span style="color: ${C.quiet}">(${(byComp[k] || { n: 0 }).n})</span></span><${Bar} value=${pct((byComp[k] || {}).ok, (byComp[k] || {}).n)} /></div>`)}
          <p style=${S.quiet + '; margin: 8px 0 0'}>Aciertos por nivel: ${['N1', 'N2', 'N3'].map((k) => k.replace('N', 'nivel ') + ' ' + (pct((nivel[k] || {}).ok, (nivel[k] || {}).n) == null ? '–' : pct(nivel[k].ok, nivel[k].n) + ' %')).join(' · ')}</p></div>
        <div><h2 style=${S.h2}>Ejes temáticos</h2>
          ${Object.keys(EJES).map((k) => html`<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 4px 0"><span style="font-size: 14px">${EJES[k]} <span style="color: ${C.quiet}">(${(byEje[k] || { n: 0 }).n})</span></span><${Bar} value=${pct((byEje[k] || {}).ok, (byEje[k] || {}).n)} color=${C.ok} /></div>`)}</div>
      </section>
      <section>
        <h2 style=${S.h2}>Competencias por empresa</h2>
        <div style="overflow-x: auto"><table style="width: 100%; border-collapse: collapse"><thead><tr><th scope="col" style=${S.th}>Empresa</th>${Object.keys(COMPS).map((k) => html`<th scope="col" style=${S.th}>${COMPS[k]}</th>`)}<th scope="col" style=${S.th}>Decisiones</th></tr></thead>
          <tbody>${emps.map((e) => { const t = empComp(e); return html`<tr><td style=${S.td + '; font-weight: 600'}>${empName(e)}</td>${Object.keys(COMPS).map((k) => html`<td style=${S.td}><${Bar} value=${pct((t[k] || {}).ok, (t[k] || {}).n)} /></td>`)}<td style=${S.td}>${decis.filter((d) => d.emisor === e).length}</td></tr>`; })}</tbody></table></div>
      </section>
      <section class="lv-informe">
        <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between">
          <h2 style=${S.h2 + '; margin: 0'}>Informe individual</h2>
          <div style="display: flex; gap: 8px; align-items: center">
            <select aria-label="Estudiante" style=${S.input + '; width: auto'} value=${st.who} onChange=${(e) => this.setState({ who: e.target.value })}><option value="">Elige un estudiante</option>${st.mem.map((m) => html`<option value=${m.alias}>${m.alias} · ${empName(m.equipo)}</option>`)}</select>
            <button type="button" style=${S.btn(false)} disabled=${!informe} onClick=${() => window.print()}>Imprimir o guardar PDF</button>
          </div>
        </div>
        ${informe ? html`<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px">
          <p style="margin: 0; font-size: 15px"><strong>${informe.persona.alias}</strong> · ${empName(informe.persona.equipo)} · roles: ${informe.roles.join(', ')}</p>
          <p style=${S.quiet + '; margin: 0'}>${informe.of ? 'Última liquidación oficial de su empresa (ronda ' + informe.of.ronda + '): ' + fmt(informe.of.puntaje, 1) + ' pts · margen ' + fmt(informe.of.margen_pct, 1) + ' % · OTIF ' + (informe.of.otif ? 'sí' : 'no') + ' · exactitud documental ' + fmt(informe.of.exactitud) + ' %.' : 'Su empresa aún no tiene liquidación oficial.'}</p>
          <div>${Object.keys(COMPS).map((k) => html`<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 4px 0; max-width: 520px"><span style="font-size: 14px">${COMPS[k]} (${(informe.comp[k] || { n: 0 }).n} retos)</span><${Bar} value=${pct((informe.comp[k] || {}).ok, (informe.comp[k] || {}).n)} /></div>`)}</div>
          <h3 style="margin: 6px 0 0; font-size: 15px">Decisiones de sus roles (${informe.dec.length})</h3>
          <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5">${informe.dec.map((d) => html`<li><strong>${d.datos.role}</strong> · ronda ${d.datos.round} · ${d.datos.decision}. <span style="color: ${C.quiet}">${d.datos.effect}</span></li>`)}</ol>
          <h3 style="margin: 6px 0 0; font-size: 15px">Retos respondidos (${informe.retos.length})</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5">${informe.retos.map((r) => html`<li>${EJES[r.datos.eje] || r.datos.eje} · ${COMPS[r.datos.competencia] || r.datos.competencia} · nivel ${r.datos.dificultad} · ${r.datos.ok ? 'correcto' : 'incorrecto'} (${r.datos.rol})</li>`)}</ul>
        </div>` : html`<p style=${S.quiet}>Elige un estudiante para ver sus roles, decisiones y retos. Las decisiones y retos se atribuyen por rol: si una persona tenía varios roles, se suman.</p>`}
      </section>
    </div>`;
  }
}

const Spark = ({ values }) => {
  const v = values.filter((x) => x != null);
  if (v.length < 2) return html`<span style="color: ${C.quiet}">–</span>`;
  const w = 120, hgt = 32, pts = values.map((x, i) => (x == null ? null : [i / (values.length - 1) * w, hgt - x / 100 * hgt])).filter(Boolean);
  return html`<svg width=${w} height=${hgt} role="img" aria-label=${'Puntajes: ' + v.join(', ')}><polyline points=${pts.map((p) => p.join(',')).join(' ')} fill="none" stroke=${C.accent} stroke-width="2.5" stroke-linejoin="round" />${pts.map((p) => html`<circle cx=${p[0]} cy=${p[1]} r="3" fill=${C.accent} />`)}</svg>`;
};

/* ---------------- banco de retos ---------------- */
const BLANK = { eje: 'incoterms', competencia: 'interpretacion', dificultad: 2, contexto: '', pregunta: '', opciones: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }], correcta: 'A', justificacion: {}, activo: true };
const csvLine = (arr) => arr.map((v) => { const s = v == null ? '' : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const COLS = ['eje', 'competencia', 'dificultad', 'contexto', 'pregunta', 'A', 'B', 'C', 'D', 'correcta', 'just_A', 'just_B', 'just_C', 'just_D'];

export class BancoRetos extends Component {
  constructor() { super(); this.state = { items: [], loading: true, edit: null, err: '', info: '' }; }
  componentDidMount() { this.load(); }
  async load() { try { this.setState({ items: await lv.myRetos(), loading: false }); } catch (e) { this.setState({ err: e.message, loading: false }); } }
  async save() {
    const r = this.state.edit;
    const ops = r.opciones.filter((o) => o.text.trim());
    if (!r.pregunta.trim() || ops.length < 2) { this.setState({ err: 'Escribe la pregunta y al menos dos opciones.' }); return; }
    if (!ops.find((o) => o.id === r.correcta)) { this.setState({ err: 'La respuesta correcta debe ser una de las opciones escritas.' }); return; }
    try { await lv.saveReto(Object.assign({}, r, { opciones: ops })); this.setState({ edit: null, err: '', info: 'Reto guardado.' }); this.load(); } catch (e) { this.setState({ err: e.message }); }
  }
  async seed() {
    try { for (const r of lv.bancoBase()) await lv.saveReto(Object.assign({}, r, { id: null })); this.setState({ info: 'Se cargaron los 18 retos base: ahora puedes editarlos.' }); this.load(); } catch (e) { this.setState({ err: e.message }); }
  }
  exportCsv() {
    const lines = [csvLine(COLS)].concat(this.state.items.map((r) => { const o = {}; (r.opciones || []).forEach((x) => { o[x.id] = x.text; }); const j = r.justificacion || {}; return csvLine([r.eje, r.competencia, r.dificultad, r.contexto, r.pregunta, o.A, o.B, o.C, o.D, r.correcta, j.A, j.B, j.C, j.D]); }));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'logiverse_banco_retos.csv'; a.click();
  }
  async importCsv(file) {
    if (!file) return;
    try {
      const rows = parseCsv((await file.text()).replace(/^﻿/, ''));
      const head = rows.shift().map((x) => x.trim());
      let n = 0;
      for (const r of rows) {
        if (r.length < 6) continue;
        const g = (k) => (r[head.indexOf(k)] || '').trim();
        const opciones = ['A', 'B', 'C', 'D'].filter((k) => g(k)).map((k) => ({ id: k, text: g(k) }));
        const justificacion = {}; ['A', 'B', 'C', 'D'].forEach((k) => { if (g('just_' + k)) justificacion[k] = g('just_' + k); });
        await lv.saveReto({ eje: g('eje'), competencia: g('competencia'), dificultad: Number(g('dificultad')) || 2, contexto: g('contexto'), pregunta: g('pregunta'), opciones: opciones, correcta: g('correcta').toUpperCase(), justificacion: justificacion });
        n++;
      }
      this.setState({ info: 'Importados ' + n + ' retos.' }); this.load();
    } catch (e) { this.setState({ err: 'No se pudo importar: ' + e.message }); }
  }
  render(p, st) {
    const e = st.edit;
    const set = (k, v) => this.setState({ edit: Object.assign({}, e, { [k]: v }) });
    return html`<div style="display: flex; flex-direction: column; gap: 14px">
      <p style=${S.quiet + '; margin: 0'}>Los jugadores de tus salas reciben los retos activos de este banco en el «Reto de repaso», con dificultad adaptativa: nivel 2 al empezar, nivel 3 si el equipo acierta 75 % o más, nivel 1 si acierta menos de 45 %. Si el banco está vacío, usan los 18 retos base.</p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <button type="button" style=${S.btn(true)} onClick=${() => this.setState({ edit: JSON.parse(JSON.stringify(BLANK)), err: '' })}>Nuevo reto</button>
        ${!st.items.length && !st.loading ? html`<button type="button" style=${S.btn(false)} onClick=${() => this.seed()}>Cargar los 18 retos base para editarlos</button>` : null}
        <button type="button" style=${S.btn(false)} onClick=${() => this.exportCsv()} disabled=${!st.items.length}>Exportar CSV</button>
        <label style=${S.btn(false) + '; display: inline-flex; align-items: center'}>Importar CSV<input type="file" accept=".csv,text/csv" style="position: absolute; opacity: 0; width: 1px; height: 1px" onChange=${(ev) => this.importCsv(ev.target.files[0])} /></label>
      </div>
      <p style="margin: 0; font-size: 12px; color: ${C.quiet}">Columnas del CSV: ${COLS.join(', ')}. Ejes: ${Object.keys(EJES).join(', ')}. Competencias: ${Object.keys(COMPS).join(', ')}.</p>
      ${st.err ? html`<p role="alert" style="margin: 0; color: ${C.bad}; font-weight: 600">${st.err}</p>` : null}${st.info ? html`<p role="status" style="margin: 0; font-size: 14px">${st.info}</p>` : null}
      ${e ? html`<section style=${'border: 2px solid ' + C.accent + '; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px'}>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px">
          <label style="font-size: 13px; font-weight: 600">Eje<select style=${S.input} value=${e.eje} onChange=${(ev) => set('eje', ev.target.value)}>${Object.keys(EJES).map((k) => html`<option value=${k}>${EJES[k]}</option>`)}</select></label>
          <label style="font-size: 13px; font-weight: 600">Competencia<select style=${S.input} value=${e.competencia} onChange=${(ev) => set('competencia', ev.target.value)}>${Object.keys(COMPS).map((k) => html`<option value=${k}>${COMPS[k]}</option>`)}</select></label>
          <label style="font-size: 13px; font-weight: 600">Dificultad<select style=${S.input} value=${String(e.dificultad)} onChange=${(ev) => set('dificultad', Number(ev.target.value))}><option value="1">1 · básica</option><option value="2">2 · media</option><option value="3">3 · alta</option></select></label>
        </div>
        <label style="font-size: 13px; font-weight: 600">Contexto (caso)<textarea rows="2" style=${S.input + '; padding: 8px 10px'} value=${e.contexto} onInput=${(ev) => set('contexto', ev.target.value)}></textarea></label>
        <label style="font-size: 13px; font-weight: 600">Pregunta<textarea rows="2" style=${S.input + '; padding: 8px 10px'} value=${e.pregunta} onInput=${(ev) => set('pregunta', ev.target.value)}></textarea></label>
        ${['A', 'B', 'C', 'D'].map((k, i) => { const o = e.opciones[i] || { id: k, text: '' }; return html`<div style="display: grid; grid-template-columns: 44px 1fr 1fr; gap: 8px; align-items: center">
          <label style="display: flex; align-items: center; gap: 4px; font-weight: 700"><input type="radio" name="correcta" checked=${e.correcta === k} onChange=${() => set('correcta', k)} />${k}</label>
          <input aria-label=${'Opción ' + k} placeholder=${'Opción ' + k + (k === 'D' ? ' (opcional)' : '')} style=${S.input} value=${o.text} onInput=${(ev) => { const ops = e.opciones.slice(); ops[i] = { id: k, text: ev.target.value }; set('opciones', ops); }} />
          <input aria-label=${'Justificación ' + k} placeholder="Por qué es o no es correcta" style=${S.input} value=${(e.justificacion || {})[k] || ''} onInput=${(ev) => set('justificacion', Object.assign({}, e.justificacion, { [k]: ev.target.value }))} /></div>`; })}
        <label style="display: flex; gap: 8px; align-items: center; font-size: 14px"><input type="checkbox" checked=${e.activo !== false} onChange=${(ev) => set('activo', ev.target.checked)} />Activo (los jugadores lo reciben)</label>
        <div style="display: flex; gap: 8px"><button type="button" style=${S.btn(true)} onClick=${() => this.save()}>Guardar</button><button type="button" style=${S.btn(false)} onClick=${() => this.setState({ edit: null, err: '' })}>Cancelar</button></div>
      </section>` : null}
      ${st.loading ? html`<p style=${S.quiet}>Cargando…</p>` : html`<div style="overflow-x: auto"><table style="width: 100%; border-collapse: collapse">
        <thead><tr>${['Eje', 'Competencia', 'Nivel', 'Pregunta', 'Estado', ''].map((x) => html`<th scope="col" style=${S.th}>${x}</th>`)}</tr></thead>
        <tbody>${st.items.map((r) => html`<tr><td style=${S.td}>${EJES[r.eje] || r.eje}</td><td style=${S.td}>${COMPS[r.competencia] || r.competencia}</td><td style=${S.td}>${r.dificultad}</td>
          <td style=${S.td}>${r.contexto ? html`<span style="color: ${C.quiet}">${r.contexto} </span>` : null}${r.pregunta}</td><td style=${S.td}>${r.activo ? 'activo' : 'inactivo'}</td>
          <td style=${S.td + '; white-space: nowrap'}><button type="button" style=${S.btn(false)} onClick=${() => this.setState({ edit: JSON.parse(JSON.stringify(Object.assign({}, r, { opciones: ['A', 'B', 'C', 'D'].map((k) => (r.opciones || []).find((o) => o.id === k) || { id: k, text: '' }) }))) })}>Editar</button> <button type="button" style=${S.btn(false)} onClick=${async () => { if (window.confirm('¿Eliminar este reto?')) { await lv.deleteReto(r.id); this.load(); } }}>Eliminar</button></td></tr>`)}</tbody></table>
        ${st.items.length ? null : html`<p style=${S.quiet}>Tu banco está vacío: los jugadores reciben los 18 retos base.</p>`}</div>`}
    </div>`;
  }
}

/* ---------------- repetición de la partida ---------------- */
const DEBRIEF = ['¿Qué decisión cambió más el resultado de su empresa en esta ronda?', '¿Qué evento les afectó y cómo lo mitigaron, o por qué no pudieron?', '¿Qué haría distinto cada rol con lo que saben ahora?', '¿Cómo se refleja el Incoterm elegido en los costos y en el riesgo que asumieron?'];
export class Repeticion extends Component {
  constructor() { super(); this.state = { ev: [], loading: true, emp: '', tipo: 'todo', pos: 1, play: false, err: '' }; }
  async componentDidMount() {
    try { const ev = (await lv.readAll('eventos')).filter((e) => e.tipo === 'bitacora' || e.tipo === 'reto' || e.tipo === 'liquidacion' || (e.tipo === 'cambio' && ['phase', 'phaseIdx', 'active', 'incoterm', 'visto', 'round'].indexOf(e.datos && e.datos.clave) >= 0)).sort((a, b) => (a.ts < b.ts ? -1 : 1)); this.setState({ ev: ev, loading: false, pos: ev.length }); }
    catch (e) { this.setState({ err: e.message, loading: false }); }
  }
  componentWillUnmount() { clearInterval(this.iv); }
  toggle() {
    if (this.state.play) { clearInterval(this.iv); this.setState({ play: false }); return; }
    this.setState({ play: true, pos: this.state.pos >= this.state.ev.length ? 1 : this.state.pos });
    this.iv = setInterval(() => { if (this.state.pos >= this.state.ev.length) { clearInterval(this.iv); this.setState({ play: false }); } else this.setState({ pos: this.state.pos + 1 }); }, 900);
  }
  line(e) {
    const d = e.datos || {};
    if (e.tipo === 'bitacora' && e.pantalla === 'Mesa') return { icon: '🌍', who: 'Superusuario', text: d.text };
    if (e.tipo === 'bitacora') return { icon: '🃏', who: empName(e.emisor) + ' · ' + d.role, text: d.decision + (d.alt ? ' (alternativa: ' + d.alt + ')' : '') + '. ' + (d.effect || '') };
    if (e.tipo === 'reto') return { icon: d.ok ? '✅' : '❌', who: empName(e.emisor) + ' · ' + (d.rol || ''), text: 'Reto de ' + (EJES[d.eje] || d.eje) + ' (' + (COMPS[d.competencia] || d.competencia) + ', nivel ' + d.dificultad + '): ' + (d.ok ? 'correcto' : 'incorrecto') };
    if (e.tipo === 'liquidacion') return { icon: '🏁', who: 'Liquidación oficial · ronda ' + d.ronda, text: Object.keys(d.resultados || {}).map((k) => empName(k) + ' ' + String(d.resultados[k].puntaje).replace('.', ',') + ' pts').join(' · ') };
    if (d.clave === 'active') return { icon: '⚡', who: e.emisor === 'gm' ? 'Superusuario' : empName(e.emisor), text: 'Eventos en juego: ' + (Object.keys(d.valor || {}).join(', ') || 'ninguno') };
    return { icon: '•', who: e.emisor === 'gm' ? 'Superusuario' : empName(e.emisor), text: ({ phase: 'Fase', phaseIdx: 'Fase', round: 'Ronda', incoterm: 'Incoterm', visto: 'Visto del CEO' }[d.clave] || d.clave) + ': ' + (typeof d.valor === 'object' ? JSON.stringify(d.valor) : d.valor) };
  }
  render(p, st) {
    if (st.loading) return html`<p style=${S.quiet}>Cargando la partida…</p>`;
    if (st.err) return html`<p role="alert" style="color: ${C.bad}">${st.err}</p>`;
    const emps = Array.from(new Set(st.ev.map((e) => e.emisor))).filter((x) => x && x !== 'gm');
    const shown = st.ev.slice(0, st.pos).filter((e) => (!st.emp || e.emisor === st.emp || e.emisor === 'gm') && (st.tipo === 'todo' || (st.tipo === 'decisiones' && e.tipo === 'bitacora') || (st.tipo === 'retos' && e.tipo === 'reto') || (st.tipo === 'mundo' && (e.emisor === 'gm' || e.tipo === 'liquidacion'))));
    const t0 = st.ev.length ? new Date(st.ev[0].ts) : null;
    return html`<div style="display: flex; flex-direction: column; gap: 14px">
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
        <button type="button" style=${S.btn(true)} onClick=${() => this.toggle()} disabled=${!st.ev.length}>${st.play ? 'Pausar' : 'Reproducir'}</button>
        <input type="range" min="1" max=${Math.max(1, st.ev.length)} value=${st.pos} aria-label="Momento de la partida" style="flex: 1 1 240px" onInput=${(e) => this.setState({ pos: Number(e.target.value) })} />
        <span style="font-family: 'IBM Plex Mono', monospace; font-size: 13px">${st.pos} / ${st.ev.length}</span>
        <select aria-label="Empresa" style=${S.input + '; width: auto'} value=${st.emp} onChange=${(e) => this.setState({ emp: e.target.value })}><option value="">Todas las empresas</option>${emps.map((e) => html`<option value=${e}>${empName(e)}</option>`)}</select>
        <select aria-label="Qué mostrar" style=${S.input + '; width: auto'} value=${st.tipo} onChange=${(e) => this.setState({ tipo: e.target.value })}><option value="todo">Todo</option><option value="decisiones">Decisiones</option><option value="retos">Retos</option><option value="mundo">Mundo y liquidaciones</option></select>
        <button type="button" style=${S.btn(false)} onClick=${() => window.print()}>Imprimir</button>
      </div>
      ${st.ev.length ? null : html`<p style=${S.quiet}>Aún no hay jugadas registradas en esta sala.</p>`}
      <ol style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 560px; overflow-y: auto">
        ${shown.slice().reverse().map((e) => { const l = this.line(e); const mins = t0 ? Math.round((new Date(e.ts) - t0) / 60000) : 0; return html`<li style=${'display: grid; grid-template-columns: 52px 28px 1fr; gap: 8px; align-items: start; padding: 8px 10px; border-radius: 12px; background: ' + (e.tipo === 'liquidacion' ? '#DDF4EA' : (e.emisor === 'gm' ? '#FFF4CC' : C.soft))}>
          <span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: ${C.quiet}">+${mins} min</span><span aria-hidden="true">${l.icon}</span>
          <span style="font-size: 14px; line-height: 1.45"><strong>${l.who}</strong> · ${l.text}</span></li>`; })}
      </ol>
      <section style=${'background: ' + C.soft + '; border-radius: 14px; padding: 12px 14px'}>
        <h2 style=${S.h2}>Preguntas para el cierre (debriefing)</h2>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6">${DEBRIEF.map((q) => html`<li>${q}</li>`)}</ol>
      </section>
    </div>`;
  }
}
