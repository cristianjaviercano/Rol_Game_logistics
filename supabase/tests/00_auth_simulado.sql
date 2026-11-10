-- Simula lo mínimo de Supabase (roles y auth.uid/auth.jwt) para probar la migración en un PostgreSQL local.
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
grant usage on schema auth to anon, authenticated; grant execute on all functions in schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
insert into auth.users values ('00000000-0000-0000-0000-00000000000d','doc@upb'),('00000000-0000-0000-0000-0000000000a1',null),('00000000-0000-0000-0000-0000000000a2',null),('00000000-0000-0000-0000-0000000000a3',null);
