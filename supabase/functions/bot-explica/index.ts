// Supabase Edge Function: explica en una frase la decisión de cada empresa automática al cerrar la ronda.
// Despliegue: supabase functions deploy bot-explica  ·  secreto: supabase secrets set ANTHROPIC_API_KEY=...
// La app la usa solo si en Vercel se define VITE_BOT_IA=1.
const MODEL = Deno.env.get('BOT_MODEL') ?? 'claude-haiku-5-5';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { bots, mundo } = await req.json();
    if (!Array.isArray(bots) || bots.length > 10) return new Response(JSON.stringify({ error: 'datos inválidos' }), { status: 400, headers: cors });
    const prompt = 'Eres el gerente de cada empresa automática de un juego de comercio internacional para estudiantes universitarios de Colombia. '
      + 'Para cada empresa escribe UNA frase en español (máximo 22 palabras) que explique su decisión de esta ronda y el razonamiento logístico, sin inventar cifras. '
      + 'Responde solo un objeto JSON {"id": "frase"}.\nEventos activos: ' + JSON.stringify(mundo?.active ?? {}) + '\nEmpresas: ' + JSON.stringify(bots);
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    });
    const j = await r.json();
    const text = j?.content?.[0]?.text ?? '{}';
    const notes = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return new Response(JSON.stringify({ notes }), { headers: { ...cors, 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
