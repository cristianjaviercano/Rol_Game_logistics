-- LogiVerse · esquema del piloto con estudiantes
-- Pegar completo en Supabase → SQL Editor → Run. Se puede volver a ejecutar sin perder datos.
--
-- Modelo:
--   partidas       una sesión de clase; la crea el docente y tiene un código de 6 caracteres
--   participantes  estudiantes que entraron con código + alias (sesión anónima de Supabase Auth)
--   estado_canal   último mensaje de cada canal del juego por emisor (mundo, estado del equipo, instantáneas)
--   eventos        registro del piloto: decisiones de la bitácora, cambios de estado, errores
--   encuestas      escala SUS y comentarios al final de la sesión
--
-- Seguridad (RLS): cada estudiante solo escribe en su partida y solo como él mismo; solo el docente
-- dueño de la partida lee los eventos, las encuestas y la lista de participantes.

create table if not exists public.partidas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[A-Z0-9]{6}$'),
  nombre text not null check (char_length(nombre) between 1 and 120),
  docente_id uuid not null references auth.users (id) on delete cascade,
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  creada timestamptz not null default now()
);

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  partida_id uuid not null references public.partidas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 40),
  equipo text not null check (char_length(equipo) between 1 and 40),
  consentimiento boolean not null default false,
  creado timestamptz not null default now(),
  unique (partida_id, user_id)
);

create table if not exists public.estado_canal (
  partida_id uuid not null references public.partidas (id) on delete cascade,
  canal text not null check (char_length(canal) <= 60),
  emisor text not null check (char_length(emisor) <= 40),
  payload jsonb not null,
  actualizado timestamptz not null default now(),
  user_id uuid default auth.uid(),
  primary key (partida_id, canal, emisor),
  constraint estado_canal_tamano check (pg_column_size(payload) < 200000)
);

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  partida_id uuid not null references public.partidas (id) on delete cascade,
  user_id uuid not null default auth.uid(),
  emisor text not null check (char_length(emisor) <= 40),
  tipo text not null check (tipo in ('bitacora', 'cambio', 'error', 'pantalla')),
  pantalla text check (char_length(pantalla) <= 40),
  datos jsonb not null default '{}'::jsonb,
  ts timestamptz not null default now(),
  constraint eventos_tamano check (pg_column_size(datos) < 16000)
);
create index if not exists eventos_partida_ts on public.eventos (partida_id, ts);

create table if not exists public.encuestas (
  id bigint generated always as identity primary key,
  partida_id uuid not null references public.partidas (id) on delete cascade,
  user_id uuid not null default auth.uid(),
  emisor text not null check (char_length(emisor) <= 40),
  respuestas jsonb not null,
  puntaje_sus numeric(5, 1) check (puntaje_sus between 0 and 100),
  comentarios jsonb not null default '{}'::jsonb,
  ts timestamptz not null default now()
);

-- Funciones auxiliares (security definer para que las políticas no se llamen a sí mismas)
create or replace function public.es_participante(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from participantes where partida_id = p and user_id = auth.uid());
$$;

create or replace function public.es_docente_de(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from partidas where id = p and docente_id = auth.uid());
$$;

create or replace function public.es_anonimo() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- El docente (cuenta con correo, no anónima) crea partidas con un código único
create or replace function public.crear_partida(p_nombre text) returns public.partidas
language plpgsql security definer set search_path = public as $$
declare
  v_codigo text;
  v_fila partidas;
begin
  if auth.uid() is null or es_anonimo() then
    raise exception 'Solo un docente con cuenta de correo puede crear partidas';
  end if;
  loop
    v_codigo := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from partidas where codigo = v_codigo);
  end loop;
  insert into partidas (codigo, nombre, docente_id) values (v_codigo, left(trim(p_nombre), 120), auth.uid())
  returning * into v_fila;
  return v_fila;
end;
$$;

-- El estudiante entra con código + alias + equipo; repetir la llamada actualiza su alias o equipo
create or replace function public.unirse_partida(p_codigo text, p_alias text, p_equipo text, p_consentimiento boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_partida partidas;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sesión no iniciada'; end if;
  if not coalesce(p_consentimiento, false) then raise exception 'Se requiere aceptar el consentimiento informado'; end if;
  select * into v_partida from partidas where codigo = upper(trim(p_codigo));
  if not found then raise exception 'No existe una partida con ese código'; end if;
  if v_partida.estado <> 'abierta' then raise exception 'La partida ya está cerrada'; end if;
  insert into participantes (partida_id, user_id, alias, equipo, consentimiento)
  values (v_partida.id, auth.uid(), left(trim(p_alias), 40), left(trim(p_equipo), 40), true)
  on conflict (partida_id, user_id) do update set alias = excluded.alias, equipo = excluded.equipo, consentimiento = true
  returning id into v_id;
  return json_build_object('partida_id', v_partida.id, 'codigo', v_partida.codigo, 'nombre', v_partida.nombre, 'participante_id', v_id);
end;
$$;

grant execute on function public.crear_partida(text) to authenticated;
grant execute on function public.unirse_partida(text, text, text, boolean) to authenticated;
revoke execute on function public.crear_partida(text) from anon;
revoke execute on function public.unirse_partida(text, text, text, boolean) from anon;

alter table public.partidas enable row level security;
alter table public.participantes enable row level security;
alter table public.estado_canal enable row level security;
alter table public.eventos enable row level security;
alter table public.encuestas enable row level security;

drop policy if exists partidas_leer on public.partidas;
create policy partidas_leer on public.partidas for select to authenticated
  using (docente_id = auth.uid() or public.es_participante(id));
drop policy if exists partidas_editar on public.partidas;
create policy partidas_editar on public.partidas for update to authenticated
  using (docente_id = auth.uid()) with check (docente_id = auth.uid());
drop policy if exists partidas_borrar on public.partidas;
create policy partidas_borrar on public.partidas for delete to authenticated
  using (docente_id = auth.uid());

drop policy if exists participantes_leer on public.participantes;
create policy participantes_leer on public.participantes for select to authenticated
  using (user_id = auth.uid() or public.es_docente_de(partida_id));

drop policy if exists estado_leer on public.estado_canal;
create policy estado_leer on public.estado_canal for select to authenticated
  using (public.es_participante(partida_id) or public.es_docente_de(partida_id));
drop policy if exists estado_crear on public.estado_canal;
create policy estado_crear on public.estado_canal for insert to authenticated
  with check (
    (public.es_docente_de(partida_id))
    or (public.es_participante(partida_id) and emisor <> 'gm' and emisor = (select equipo from public.participantes where partida_id = estado_canal.partida_id and user_id = auth.uid()))
  );
drop policy if exists estado_actualizar on public.estado_canal;
create policy estado_actualizar on public.estado_canal for update to authenticated
  using (public.es_docente_de(partida_id) or (public.es_participante(partida_id) and emisor <> 'gm'))
  with check (
    (public.es_docente_de(partida_id))
    or (public.es_participante(partida_id) and emisor <> 'gm' and emisor = (select equipo from public.participantes where partida_id = estado_canal.partida_id and user_id = auth.uid()))
  );

drop policy if exists eventos_crear on public.eventos;
create policy eventos_crear on public.eventos for insert to authenticated
  with check (user_id = auth.uid() and (public.es_participante(partida_id) or public.es_docente_de(partida_id)));
drop policy if exists eventos_leer on public.eventos;
create policy eventos_leer on public.eventos for select to authenticated
  using (public.es_docente_de(partida_id));

drop policy if exists encuestas_crear on public.encuestas;
create policy encuestas_crear on public.encuestas for insert to authenticated
  with check (user_id = auth.uid() and public.es_participante(partida_id));
drop policy if exists encuestas_leer on public.encuestas;
create policy encuestas_leer on public.encuestas for select to authenticated
  using (public.es_docente_de(partida_id));

grant select, insert, update, delete on public.partidas, public.participantes, public.estado_canal, public.eventos, public.encuestas to authenticated;
revoke all on public.partidas, public.participantes, public.estado_canal, public.eventos, public.encuestas from anon;
