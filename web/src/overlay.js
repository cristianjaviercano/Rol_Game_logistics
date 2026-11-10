// Aviso animado a pantalla completa cuando el Superusuario juega un evento: lo ven todos los jugadores,
// en cualquier pantalla de la app, y también el proyector del docente.
import { h, Component } from 'preact';
import htm from 'htm';
import * as lv from './lv.js';

const html = htm.bind(h);

// Animación y colores por evento. «art» es el elemento central; «fx» las partículas de fondo.
const LOOK = {
  tormenta: { bg: 'linear-gradient(160deg, #0B1E4D, #2F55E6)', art: 'spiral', fx: 'rain', glyph: '🌀' },
  congestion: { bg: 'linear-gradient(160deg, #3D2A0A, #B3600C)', art: 'ships', fx: 'none', glyph: '🚢' },
  huelga: { bg: 'linear-gradient(160deg, #4A0A12, #D62839)', art: 'sign', fx: 'none', glyph: '✊', sign: 'HUELGA' },
  marrojo: { bg: 'linear-gradient(160deg, #3A0606, #B01F2E)', art: 'pulse', fx: 'smoke', glyph: '⚠️' },
  sequia: { bg: 'linear-gradient(160deg, #5A2C04, #F2A93B)', art: 'sun', fx: 'heat', glyph: '☀️' },
  devaluacion: { bg: 'linear-gradient(160deg, #053B27, #0E7C55)', art: 'pulse', fx: 'coinsUp', glyph: '💵' },
  revaluacion: { bg: 'linear-gradient(160deg, #4A0A12, #B01F2E)', art: 'pulse', fx: 'coinsDown', glyph: '💵' },
  flete: { bg: 'linear-gradient(160deg, #0B1E4D, #1F5EFF)', art: 'bounce', fx: 'arrows', glyph: '📦' },
  pandemia: { bg: 'linear-gradient(160deg, #2A1155, #8B5CF6)', art: 'pulse', fx: 'bubbles', glyph: '🦠' },
  alerta: { bg: 'linear-gradient(160deg, #0B1E4D, #127E89)', art: 'pulse', fx: 'none', glyph: '🛡️' },
  ciber: { bg: 'linear-gradient(160deg, #000000, #14213D)', art: 'glitch', fx: 'none', glyph: '💻' },
  inspeccion: { bg: 'linear-gradient(160deg, #14213D, #55627A)', art: 'zoom', fx: 'none', glyph: '🔍' },
  impago: { bg: 'linear-gradient(160deg, #26303F, #55627A)', art: 'spin', fx: 'none', glyph: '⏳' }
};
const SEEN = 'lv-noticia-vista';

export class EventOverlay extends Component {
  constructor() { super(); this.state = { news: null }; }
  componentDidMount() {
    this.off = lv.onBus((name, data) => {
      if (name !== 'logiverse-mundo' || !data || !data.news) return;
      const n = data.news; let seen = 0;
      try { seen = Number(window.sessionStorage.getItem(SEEN) || 0); } catch (e) { /* nada */ }
      if (n.at <= seen || Date.now() - n.at > 60000) return;
      try { window.sessionStorage.setItem(SEEN, String(n.at)); } catch (e) { /* nada */ }
      clearTimeout(this.t);
      this.setState({ news: n });
      this.t = setTimeout(() => this.setState({ news: null }), n.undone ? 3500 : 9000);
    });
    this.onKey = (e) => { if (e.key === 'Escape') this.close(); };
    window.addEventListener('keydown', this.onKey);
  }
  componentWillUnmount() { if (this.off) this.off(); clearTimeout(this.t); window.removeEventListener('keydown', this.onKey); }
  close() { clearTimeout(this.t); this.setState({ news: null }); }
  render(p, st) {
    const n = st.news;
    if (!n) return null;
    const L = LOOK[n.key] || { bg: 'linear-gradient(160deg, #14213D, #1F5EFF)', art: 'pulse', fx: 'none', glyph: '⚡' };
    const parts = L.fx === 'none' ? [] : Array.from({ length: 18 }, (x, i) => i);
    return html`<div role="alertdialog" aria-live="assertive" aria-label=${(n.undone ? 'Evento deshecho: ' : 'Nuevo evento: ') + n.label} class="lv-ov" onClick=${() => this.close()}>
      <div class=${'lv-ov-card'} style=${'background: ' + (n.undone ? 'linear-gradient(160deg, #26303F, #55627A)' : L.bg)} onClick=${(e) => e.stopPropagation()}>
        <div class=${'lv-fx lv-fx-' + L.fx} aria-hidden="true">${parts.map((i) => html`<span style=${'--i: ' + i + '; left: ' + ((i * 37) % 100) + '%; animation-delay: ' + ((i * 0.23) % 2.4).toFixed(2) + 's'}>${L.fx === 'coinsUp' || L.fx === 'coinsDown' ? '$' : (L.fx === 'arrows' ? '▲' : '')}</span>`)}</div>
        <div class=${'lv-art lv-art-' + (n.undone ? 'pulse' : L.art)} aria-hidden="true">${L.art === 'sign' && !n.undone ? html`<span class="lv-sign">${L.sign}</span>` : html`<span class="lv-glyph">${n.undone ? '↩️' : L.glyph}</span>`}</div>
        <span class="lv-kicker">${n.undone ? 'EVENTO DESHECHO' : 'NUEVO EVENTO' + (n.round ? ' · RONDA ' + n.round : '')}</span>
        <span class="lv-title">${n.label}</span>
        ${n.undone ? html`<span class="lv-text">El Superusuario retiró la carta: no tiene efecto.</span>` : html`
          ${n.sub ? html`<span class="lv-sub">${n.sub}</span>` : null}
          <span class="lv-text">${n.text}</span>
          ${n.hit ? html`<span class="lv-text"><strong>Afecta a:</strong> ${n.hit}</span>` : null}
          ${n.counter ? html`<span class="lv-text"><strong>Se mitiga con:</strong> ${n.counter}</span>` : null}`}
        <button type="button" class="lv-ok" onClick=${() => this.close()}>Entendido</button>
      </div>
    </div>`;
  }
}
