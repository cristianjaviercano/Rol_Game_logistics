-- LogiVerse · motor central de liquidación, banco de retos y analítica (ejecutar después de 002)
--
-- resultados   liquidación oficial por ronda y empresa: la escribe solo el Superusuario dueño de la sala
-- retos        banco de retos tipo Saber Pro del docente (eje, competencia, dificultad, justificación por opción)
-- eventos      admite los tipos «reto» (cada respuesta) y «liquidacion»

alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('bitacora', 'cambio', 'error', 'pantalla', 'reto', 'liquidacion'));

create table if not exists public.resultados (
  partida_id uuid not null references public.partidas (id) on delete cascade,
  ronda int not null check (ronda between 1 and 99),
  empresa text not null check (char_length(empresa) <= 40),
  humana boolean not null default true,
  puntaje numeric(5, 1) not null check (puntaje between 0 and 100),
  margen_pct numeric(6, 2),
  otif boolean,
  exactitud numeric(5, 1),
  saber_pct numeric(5, 1),
  datos jsonb not null default '{}'::jsonb,
  calculado timestamptz not null default now(),
  primary key (partida_id, ronda, empresa),
  constraint resultados_tamano check (pg_column_size(datos) < 20000)
);

create table if not exists public.retos (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eje text not null check (eje in ('incoterms', 'aranceles', 'regimenes', 'transporte', 'cubicaje', 'geografia', 'documentos', 'finanzas')),
  competencia text not null check (competencia in ('interpretacion', 'argumentacion', 'proposicion')),
  dificultad int not null default 2 check (dificultad between 1 and 3),
  contexto text not null default '' check (char_length(contexto) <= 1200),
  pregunta text not null check (char_length(pregunta) between 5 and 600),
  opciones jsonb not null,
  correcta text not null check (correcta in ('A', 'B', 'C', 'D')),
  justificacion jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  constraint retos_opciones check (jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) between 2 and 4)
);
create index if not exists retos_docente on public.retos (docente_id);

alter table public.resultados enable row level security;
alter table public.retos enable row level security;

drop policy if exists resultados_leer on public.resultados;
create policy resultados_leer on public.resultados for select to authenticated
  using (public.es_participante(partida_id) or public.es_docente_de(partida_id));
drop policy if exists resultados_escribir on public.resultados;
create policy resultados_escribir on public.resultados for insert to authenticated
  with check (public.es_docente_de(partida_id));
drop policy if exists resultados_actualizar on public.resultados;
create policy resultados_actualizar on public.resultados for update to authenticated
  using (public.es_docente_de(partida_id)) with check (public.es_docente_de(partida_id));

drop policy if exists retos_docente on public.retos;
create policy retos_docente on public.retos for all to authenticated
  using (docente_id = auth.uid()) with check (docente_id = auth.uid() and not public.es_anonimo());

-- Retos activos del docente dueño de la sala, para los jugadores de esa sala
create or replace function public.banco_partida(p uuid)
returns table (id uuid, eje text, competencia text, dificultad int, contexto text, pregunta text, opciones jsonb, correcta text, justificacion jsonb)
language sql stable security definer set search_path = public as $$
  select r.id, r.eje, r.competencia, r.dificultad, r.contexto, r.pregunta, r.opciones, r.correcta, r.justificacion
  from retos r join partidas pa on pa.docente_id = r.docente_id
  where pa.id = p and r.activo and (es_participante(p) or es_docente_de(p))
  order by r.creado;
$$;

grant select, insert, update, delete on public.resultados, public.retos to authenticated;
revoke all on public.resultados, public.retos from anon;
grant execute on function public.banco_partida(uuid) to authenticated;
revoke execute on function public.banco_partida(uuid) from anon;
