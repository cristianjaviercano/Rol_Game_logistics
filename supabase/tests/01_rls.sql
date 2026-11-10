-- Pruebas de permisos (RLS) y funciones: correr después de 00_auth_simulado.sql y la migración. Las líneas «debe fallar» deben mostrar un ERROR.
\set ON_ERROR_STOP 0
\pset tuples_only on
create or replace function pg_temp.como(sub text, anon boolean) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', sub, 'is_anonymous', anon)::text, false); execute 'set role authenticated'; end $$;
-- 1 docente crea partida
select pg_temp.como('00000000-0000-0000-0000-00000000000d', false);
select 'T1 crear partida', (crear_partida('Piloto 1')).codigo ~ '^[A-F0-9]{6}$';
reset role;
select codigo as cod from partidas limit 1 \gset
-- 2 anónimo no puede crear partida
select pg_temp.como('00000000-0000-0000-0000-0000000000a1', true);
select 'T2 anónimo crea partida (debe fallar)'; select crear_partida('x');
-- 3 estudiantes se unen
select 'T3 unirse a1', (unirse_partida(:'cod', 'Ana', 'Equipo 1', true))->>'codigo' = :'cod';
select 'T3b sin consentimiento (debe fallar)'; select unirse_partida(:'cod', 'Ana', 'Equipo 1', false);
reset role; select pg_temp.como('00000000-0000-0000-0000-0000000000a2', true);
select 'T4 unirse a2', (unirse_partida(lower(:'cod'), 'Beto', 'Equipo 2', true)) is not null;
select 'T5 código malo (debe fallar)'; select unirse_partida('ZZZZZZ', 'x', 'Equipo 1', true);
-- 6 estudiante escribe su estado y no el de otro equipo ni el del mundo
insert into estado_canal (partida_id, canal, emisor, payload) select id, 'logiverse-jugador', 'Equipo 2', '{"a":1}' from partidas returning 'T6 estado propio ok';
select 'T7 estado de otro equipo (debe fallar)'; insert into estado_canal (partida_id, canal, emisor, payload) select id, 'logiverse-jugador', 'Equipo 1', '{}' from partidas;
select 'T8 escribir mundo como gm (debe fallar)'; insert into estado_canal (partida_id, canal, emisor, payload) select id, 'logiverse-mundo', 'gm', '{}' from partidas;
insert into estado_canal (partida_id, canal, emisor, payload) select id, 'logiverse-jugador', 'Equipo 2', '{"a":2}' from partidas on conflict (partida_id, canal, emisor) do update set payload = excluded.payload returning 'T9 upsert propio ok';
-- 10 eventos: insertar sí, leer no
insert into eventos (partida_id, emisor, tipo, pantalla, datos) select id, 'Equipo 2', 'bitacora', 'Jugador', '{"d":1}' from partidas returning 'T10 evento propio ok';
select 'T11 evento suplantando (debe fallar)'; insert into eventos (partida_id, user_id, emisor, tipo) select id, '00000000-0000-0000-0000-0000000000a1', 'Equipo 1', 'bitacora' from partidas;
select 'T12 estudiante lee eventos = 0', (select count(*) from eventos) = 0;
select 'T13 estudiante ve solo su fila de participantes', (select count(*) from participantes) = 1;
select 'T14 estudiante lee estados de su partida', (select count(*) from estado_canal) >= 1;
insert into encuestas (partida_id, emisor, respuestas, puntaje_sus) select id, 'Equipo 2', '{}', 72.5 from partidas returning 'T15 encuesta propia ok';
-- 16 forastero (no participante) no ve nada
reset role; select id as pid from partidas limit 1 \gset
select pg_temp.como('00000000-0000-0000-0000-0000000000a3', true);
select 'T16 forastero ve partidas = 0', (select count(*) from partidas) = 0, (select count(*) from estado_canal) = 0;
select 'T17 forastero escribe (debe fallar)'; insert into eventos (partida_id, emisor, tipo) values (:'pid', 'x', 'error');
-- 18 docente lee todo y escribe mundo
reset role; select pg_temp.como('00000000-0000-0000-0000-00000000000d', false);
select 'T18 docente ve', (select count(*) from eventos), (select count(*) from participantes), (select count(*) from encuestas);
insert into estado_canal (partida_id, canal, emisor, payload) select id, 'logiverse-mundo', 'gm', '{"round":1}' from partidas returning 'T19 docente escribe mundo ok';
update partidas set estado = 'cerrada' returning 'T20 docente cierra ok';
reset role; select pg_temp.como('00000000-0000-0000-0000-0000000000a3', true);
select 'T21 unirse a cerrada (debe fallar)'; select unirse_partida(:'cod', 'Ceci', 'Equipo 3', true);
reset role;
select 'T22 anon sin login no lee'; set role anon; select count(*) from partidas;
