// Servicios del piloto: sesión, Supabase, bus entre pantallas en tiempo real, instantáneas y registro de datos.
// Sin variables de Supabase la app funciona en «modo local»: las pantallas se comunican entre pestañas
// del mismo navegador, como en el lienzo, y no se guarda nada.
import { createClient } from '@supabase/supabase-js';
import { screenHooks } from './host.js';

const URL_ = import.meta.env.VITE_SUPABASE_URL, KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const sb = URL_ && KEY ? createClient(URL_, KEY, { auth: { persistSession: true, storageKey: 'lv-auth' } }) : null;
export const ONLINE = !!sb;

const ls = {
  get(k) { try { const v = window.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } }
};
export const store = ls;

/* ---------------- sesión ---------------- */
export const session = {
  get() { return ls.get('lv-sesion'); },
  set(s) { ls.set('lv-sesion', s); },
  clear() { ls.set('lv-sesion', null); }
};
const emisor = () => { const s = session.get(); return !s ? 'local' : (s.docente ? 'gm' : (s.equipo || 'sin-equipo')); };
const partidaId = () => { const s = session.get(); return s && s.partida ? s.partida.id : null; };

export async function ensureAnon() {
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.user;
  const r = await sb.auth.signInAnonymously();
  if (r.error) throw new Error(r.error.message.includes('Anonymous') ? 'El ingreso anónimo no está activado en Supabase (Authentication → Sign In / Providers).' : r.error.message);
  return r.data.user;
}

export async function joinGame(codigo, alias, equipo, consentimiento) {
  await ensureAnon();
  const { data, error } = await sb.rpc('unirse_partida', { p_codigo: codigo.trim().toUpperCase(), p_alias: alias.trim(), p_equipo: equipo, p_consentimiento: !!consentimiento });
  if (error) throw new Error(error.message);
  const s = { partida: { id: data.partida_id, codigo: data.codigo, nombre: data.nombre }, participante: data.participante_id, alias: alias.trim(), equipo: equipo, docente: false };
  session.set(s);
  await hydrate();
  return s;
}

export async function teacherSignIn(email, password, create) {
  const fn = create ? sb.auth.signUp({ email, password }) : sb.auth.signInWithPassword({ email, password });
  const { data, error } = await fn;
  if (error) throw new Error(error.message);
  if (create && !data.session) return { needsConfirm: true };
  return { user: data.user };
}
export async function currentUser() { if (!sb) return null; const { data } = await sb.auth.getUser(); return data.user || null; }
export async function signOut() { session.clear(); if (sb) await sb.auth.signOut(); }

export async function myGames() {
  const u = await currentUser(); if (!u) return [];
  const { data, error } = await sb.from('partidas').select('*').eq('docente_id', u.id).order('creada', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
export async function createGame(nombre) {
  const { data, error } = await sb.rpc('crear_partida', { p_nombre: nombre });
  if (error) throw new Error(error.message);
  return data;
}
export async function setGameState(id, estado) {
  const { error } = await sb.from('partidas').update({ estado: estado }).eq('id', id);
  if (error) throw new Error(error.message);
}
export async function openAsTeacher(p) {
  const u = await currentUser();
  session.set({ partida: { id: p.id, codigo: p.codigo, nombre: p.nombre }, alias: u ? u.email : 'docente', equipo: 'gm', docente: true });
  await hydrate();
}

/* ---------------- estado persistido por canal ---------------- */
const snaps = {};
async function hydrate() {
  const pid = partidaId(); if (!sb || !pid) return;
  const { data, error } = await sb.from('estado_canal').select('canal, emisor, payload, actualizado').eq('partida_id', pid).order('actualizado', { ascending: false });
  if (error || !data) return;
  const me = emisor();
  const mundo = data.find((r) => r.canal === 'logiverse-mundo' && r.emisor === 'gm');
  if (mundo) ls.set('logiverse-mundo', mundo.payload);
  const jug = me === 'gm' ? data.find((r) => r.canal === 'logiverse-jugador') : data.find((r) => r.canal === 'logiverse-jugador' && r.emisor === me);
  ls.set('logiverse-jugador', jug ? jug.payload : null);
  Object.keys(snaps).forEach((k) => delete snaps[k]);
  data.filter((r) => r.canal.startsWith('snap:') && r.emisor === me).forEach((r) => { snaps[r.canal.slice(5)] = r.payload; });
}
export { hydrate };

const pending = {};
function upsertLater(canal, payload, wait) {
  const pid = partidaId(); if (!sb || !pid) return;
  clearTimeout(pending[canal]);
  pending[canal] = setTimeout(async () => {
    const { error } = await sb.from('estado_canal').upsert({ partida_id: pid, canal: canal, emisor: emisor(), payload: payload, actualizado: new Date().toISOString() });
    if (error) logError('estado_canal', error.message);
  }, wait);
}
export async function teamStates() {
  const pid = partidaId(); if (!sb || !pid) return [];
  const { data } = await sb.from('estado_canal').select('emisor, payload, actualizado').eq('partida_id', pid).eq('canal', 'logiverse-jugador');
  return data || [];
}

/* ---------------- bus en tiempo real (reemplaza BroadcastChannel) ---------------- */
const RealBC = window.BroadcastChannel;
const locals = new Set();
let rt = null, rtStatus = 'local', presence = {};
const statusSubs = new Set();
export const onStatus = (f) => { statusSubs.add(f); f(rtStatus, presence); return () => statusSubs.delete(f); };
const emit = () => statusSubs.forEach((f) => f(rtStatus, presence));

class LVChannel {
  constructor(name) {
    this.name = name; this.onmessage = null;
    this.real = RealBC ? new RealBC(name) : null;
    if (this.real) this.real.onmessage = (e) => { if (this.onmessage) this.onmessage(e); };
    locals.add(this);
  }
  postMessage(data) {
    if (this.real) this.real.postMessage(data);
    const me = emisor();
    if (ONLINE && partidaId()) {
      if (this.name === 'logiverse-mundo' && me !== 'gm') return; // solo el docente mueve el mundo
      const payload = JSON.parse(JSON.stringify(data));
      if (rt) rt.send({ type: 'broadcast', event: 'bus', payload: { name: this.name, data: payload, emisor: me } });
      upsertLater(this.name, payload, 600);
    }
  }
  close() { locals.delete(this); if (this.real) this.real.close(); }
  addEventListener(t, f) { if (t === 'message') this.onmessage = f; }
  removeEventListener() { this.onmessage = null; }
}
window.BroadcastChannel = LVChannel;

export function connectRealtime(pantalla) {
  const pid = partidaId(), s = session.get();
  if (!sb || !pid) { rtStatus = 'local'; emit(); return; }
  if (rt && rt.__pid === pid) { if (pantalla) rt.track({ alias: s.alias, equipo: s.equipo, pantalla: pantalla, docente: !!s.docente }); return; }
  if (rt) { sb.removeChannel(rt); rt = null; }
  rtStatus = 'conectando'; emit();
  rt = sb.channel('lv-' + pid, { config: { broadcast: { self: false }, presence: { key: (s.alias || 'anon') + '·' + Math.random().toString(36).slice(2, 6) } } });
  rt.__pid = pid;
  rt.on('broadcast', { event: 'bus' }, ({ payload }) => {
    if (!payload || !payload.name) return;
    const me = emisor();
    // Un equipo no recibe el estado de otro equipo: cada mesa ve solo el suyo; el docente ve todos.
    if (payload.name === 'logiverse-jugador' && me !== 'gm' && payload.emisor !== me) return;
    ls.set(payload.name, payload.data);
    locals.forEach((c) => { if (c.name === payload.name && c.onmessage) { try { c.onmessage({ data: payload.data }); } catch (e) { logError('bus', e.message); } } });
  });
  rt.on('presence', { event: 'sync' }, () => { presence = rt.presenceState(); emit(); });
  rt.subscribe((st) => {
    rtStatus = st === 'SUBSCRIBED' ? 'en línea' : (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' ? 'sin conexión' : 'conectando');
    emit();
    if (st === 'SUBSCRIBED') rt.track({ alias: s.alias, equipo: s.equipo, pantalla: pantalla || 'menú', docente: !!s.docente });
  });
}

/* ---------------- registro de datos del piloto ---------------- */
const queue = [];
export function logEvent(tipo, pantalla, datos) {
  if (!ONLINE || !partidaId()) return;
  queue.push({ partida_id: partidaId(), tipo: tipo, pantalla: pantalla || null, emisor: emisor(), datos: datos == null ? {} : datos, ts: new Date().toISOString() });
}
export function logError(where, msg) { logEvent('error', where, { mensaje: String(msg).slice(0, 500), ruta: location.hash, agente: navigator.userAgent.slice(0, 160) }); }
async function flush() {
  if (!sb || !queue.length) return;
  const batch = queue.splice(0, 200);
  const { data } = await sb.auth.getUser();
  if (!data.user) { queue.unshift(...batch); return; }
  batch.forEach((r) => { r.user_id = data.user.id; });
  const { error } = await sb.from('eventos').insert(batch);
  if (error) { console.warn('No se pudo guardar el registro:', error.message); if (queue.length < 2000) queue.unshift(...batch); }
}
setInterval(flush, 3000);
window.addEventListener('pagehide', flush);
window.addEventListener('error', (e) => logError('ventana', e.message));
window.addEventListener('unhandledrejection', (e) => logError('promesa', e.reason && e.reason.message ? e.reason.message : e.reason));

// Qué cambios de estado se guardan como evento, por pantalla.
const WATCH = {
  Jugador: ['phaseIdx', 'role', 'incoterm', 'visto', 'saber', 'executed', 'insp', 'docs'],
  Mesa: ['round', 'phase', 'paused', 'active', 'inside'],
  Main: ['active', 'paused', 'day'],
  Aduana: ['picks', 'topic'],
  Comercial: ['term', 'sent', 'visto'],
  CFO: ['paid', 'sold', 'lastConv'],
  Trafico: ['caseId', 'terms', 'sel'],
  Cadena: ['deal', 'rounds', 'pick'],
  Seleccion: ['joined']
};
// Qué no se guarda en la instantánea (estado efímero de la interfaz).
const TRANSIENT = new Set(['msg', 'quiz', 'sel', 'noGL', 'toast', 'toastAt', 'hover', 'nodeSel', 'confirm', 'undo', 'connected', 'world', 'tick', 'now', 'asking', 'warn', 'player', 'inside', 'blocked', 'lastInsp']);
const SNAP = new Set(['Jugador', 'Mesa', 'Main', 'Aduana', 'Comercial', 'CFO', 'Trafico', 'Cadena', 'Seleccion']);

screenHooks.restore = (screen, embedded) => (embedded ? null : snaps[screen] || null);
screenHooks.onError.push((screen, e) => logError(screen, e && e.message ? e.message : e));
screenHooks.onState.push((screen, st, prev, embedded) => {
  if (!ONLINE || !partidaId() || embedded) return;
  if (Array.isArray(st.log) && Array.isArray(prev.log) && st.log !== prev.log) {
    const old = new Set(prev.log);
    st.log.filter((x) => !old.has(x)).forEach((x) => logEvent('bitacora', screen, x));
  }
  (WATCH[screen] || []).forEach((k) => {
    if (st[k] !== prev[k] && JSON.stringify(st[k]) !== JSON.stringify(prev[k])) logEvent('cambio', screen, { clave: k, valor: st[k] });
  });
  if (SNAP.has(screen)) {
    const snap = {};
    Object.keys(st).forEach((k) => { if (!TRANSIENT.has(k) && typeof st[k] !== 'function') snap[k] = st[k]; });
    snaps[screen] = JSON.parse(JSON.stringify(snap));
    upsertLater('snap:' + screen, snaps[screen], 2500);
  }
});

/* ---------------- encuesta y exportación ---------------- */
export async function saveSurvey(respuestas, puntaje, comentarios) {
  const { data } = await sb.auth.getUser();
  const { error } = await sb.from('encuestas').insert({ partida_id: partidaId(), user_id: data.user.id, emisor: emisor(), respuestas: respuestas, puntaje_sus: puntaje, comentarios: comentarios });
  if (error) throw new Error(error.message);
}
async function fetchAll(table, pid) {
  const rows = []; let from = 0;
  for (;;) {
    const { data, error } = await sb.from(table).select('*').eq('partida_id', pid).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}
const csvCell = (v) => { if (v == null) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export async function exportCsv(pid, table) {
  const rows = await fetchAll(table, pid);
  const cols = rows.length ? Object.keys(rows[0]) : ['sin_datos'];
  const csv = '﻿' + cols.join(',') + '\n' + rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'logiverse_' + table + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return rows.length;
}
