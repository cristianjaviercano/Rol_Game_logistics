// Monta una pantalla del mock-up: crea la instancia de su clase (DCLogic), la renderiza con el
// runtime y avisa a los observadores (registro de datos, instantáneas) en cada cambio de estado.
import { h, Component } from 'preact';
import { SCREENS } from './screens.gen.js';
import { parse, renderTree } from './dc.js';

const trees = {}, classes = {};
const hooks = { onState: [], onError: [], restore: null };
export const screenHooks = hooks;

class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; this.__host = null; }
  setState(u, cb) {
    const p = typeof u === 'function' ? u(this.state, this.props) : u;
    if (p) {
      const prev = this.state;
      this.state = Object.assign({}, this.state, p);
      if (this.__host) this.__host.changed(prev);
    }
    if (typeof cb === 'function') cb();
  }
  forceUpdate() { if (this.__host) this.__host.redraw(); }
}

function classOf(name) {
  if (!classes[name]) classes[name] = SCREENS[name].make(DCLogic);
  return classes[name];
}
function treeOf(name) {
  if (!trees[name]) trees[name] = parse(SCREENS[name].markup);
  return trees[name];
}

// Instancia la lógica de una pantalla sin interfaz: sirve para el cálculo oficial y para leer datos base.
export function headless(screen, props, state) {
  const Cls = classOf(screen), inst = new Cls(Object.assign({}, SCREENS[screen].defaults, props || {}));
  if (state) inst.state = Object.assign({}, inst.state, state);
  return inst;
}

export class ScreenHost extends Component {
  constructor(props) {
    super(props);
    const scr = SCREENS[props.screen];
    this.scr = scr;
    this.state = { n: 0, error: null };
    if (!scr) return;
    const Cls = classOf(props.screen);
    this.inst = new Cls(this.mergedProps());
    if (hooks.restore) {
      const snap = hooks.restore(props.screen, !!props.embedded);
      if (snap) this.inst.state = Object.assign({}, this.inst.state, snap);
    }
    this.inst.__host = this;
    // Acceso de depuración desde la consola del navegador: window.__lv.Mesa, window.__lv.Jugador…
    (window.__lv = window.__lv || {})[props.screen] = this.inst;
  }
  mergedProps() { return Object.assign({}, this.scr.defaults, this.props.props || {}); }
  changed(prev) {
    hooks.onState.forEach((f) => { try { f(this.props.screen, this.inst.state, prev, !!this.props.embedded); } catch (e) { /* el registro nunca rompe el juego */ } });
    this.redraw();
  }
  redraw() { if (!this.dead) this.setState((s) => ({ n: s.n + 1 })); }
  componentDidMount() {
    if (this.inst && this.inst.componentDidMount) { try { this.inst.componentDidMount(); } catch (e) { this.fail(e); } }
  }
  componentWillUnmount() {
    this.dead = true;
    if (this.inst && this.inst.componentWillUnmount) { try { this.inst.componentWillUnmount(); } catch (e) { /* nada */ } }
  }
  componentDidCatch(e) { this.fail(e); }
  fail(e) {
    hooks.onError.forEach((f) => { try { f(this.props.screen, e); } catch (x) { /* nada */ } });
    if (!this.dead) this.setState({ error: String(e && e.message ? e.message : e) });
  }
  render() {
    if (!this.scr) return h('p', { style: 'padding: 24px' }, 'No existe la pantalla «' + this.props.screen + '».');
    if (this.state.error) {
      return h('div', { role: 'alert', style: 'margin: 24px; padding: 16px; border-radius: 12px; background: #FFE3E6; color: #14213D; font: 14px/1.5 system-ui' },
        h('strong', null, 'La pantalla «' + this.scr.title + '» tuvo un error y quedó registrado. '), 'Recarga la página para continuar. Detalle: ' + this.state.error);
    }
    this.inst.props = this.mergedProps();
    let vals;
    try { vals = this.inst.renderVals(); } catch (e) { setTimeout(() => this.fail(e), 0); return null; }
    const kids = renderTree(treeOf(this.props.screen), vals, [], { Host: ScreenHost });
    return kids.length === 1 ? kids[0] : h('div', null, kids);
  }
}
