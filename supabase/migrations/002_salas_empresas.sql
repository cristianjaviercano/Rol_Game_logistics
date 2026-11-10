-- LogiVerse · salas visibles y empresas por jugador (ejecutar después de 001_piloto.sql)
--
-- listar_salas()          salas abiertas de las últimas 48 h, con los alias por empresa, para elegir sala y empresa
-- miembros_partida(p)     integrantes de una sala (alias, empresa, hora de ingreso), para repartir roles dentro de cada empresa
-- En participantes, la columna «equipo» guarda ahora el identificador de la empresa (cafe, acui, shz…).

create or replace function public.listar_salas()
returns table (id uuid, codigo text, nombre text, creada timestamptz, empresas json)
language sql stable security definer set search_path = public as $$
  select p.id, p.codigo, p.nombre, p.creada,
    coalesce((select json_object_agg(x.equipo, x.alias) from (
      select equipo, json_agg(alias order by creado) as alias from participantes where partida_id = p.id group by equipo) x), '{}'::json)
  from partidas p
  where p.estado = 'abierta' and p.creada > now() - interval '48 hours'
  order by p.creada desc
  limit 30;
$$;

create or replace function public.miembros_partida(p uuid)
returns table (alias text, equipo text, creado timestamptz)
language sql stable security definer set search_path = public as $$
  select alias, equipo, creado from participantes
  where partida_id = p and (es_participante(p) or es_docente_de(p))
  order by creado;
$$;

grant execute on function public.listar_salas() to authenticated;
grant execute on function public.miembros_partida(uuid) to authenticated;
revoke execute on function public.listar_salas() from anon;
revoke execute on function public.miembros_partida(uuid) from anon;
