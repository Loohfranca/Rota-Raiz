begin;
create table if not exists public.travel_itineraries (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id),
 title text not null check(length(trim(title)) between 1 and 100),
 legs jsonb not null default '[]'::jsonb,
 visits jsonb not null default '[]'::jsonb,
 version bigint not null default 1 check(version>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(jsonb_typeof(legs)='array' and jsonb_typeof(visits)='array'),
 check(jsonb_array_length(legs)<=200 and jsonb_array_length(visits)<=500),
 check(pg_column_size(legs)+pg_column_size(visits)<=1048576)
);
create index if not exists travel_itineraries_owner_idx on public.travel_itineraries(owner_id,created_at desc);
alter table public.travel_itineraries enable row level security;
revoke all on public.travel_itineraries from public,anon,authenticated;
grant select,insert,update on public.travel_itineraries to authenticated;
drop policy if exists itinerary_read_own on public.travel_itineraries;
create policy itinerary_read_own on public.travel_itineraries for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists itinerary_insert_own on public.travel_itineraries;
create policy itinerary_insert_own on public.travel_itineraries for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists itinerary_update_own on public.travel_itineraries;
create policy itinerary_update_own on public.travel_itineraries for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create or replace function public.rr_check_itinerary() returns trigger language plpgsql security invoker set search_path='' as $$
declare leg jsonb; seg jsonb; visit jsonb; departure timestamptz; arrival timestamptz; previous_arrival timestamptz;
begin
 if tg_op='UPDATE' then
  if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id then raise exception 'O roteiro não pode ser transferido para outra conta.';end if;
  new.version:=old.version+1;
  new.created_at:=old.created_at;
 else new.version:=1;
 end if;
 new.updated_at:=now();
 if jsonb_typeof(new.legs)<>'array' or jsonb_typeof(new.visits)<>'array' then raise exception 'Roteiro inválido.';end if;
 if jsonb_array_length(new.legs)<>(select count(distinct value->>'id') from jsonb_array_elements(new.legs)) or jsonb_array_length(new.visits)<>(select count(distinct value->>'id') from jsonb_array_elements(new.visits)) then raise exception 'Registros duplicados.';end if;
 for leg in select value from jsonb_array_elements(new.legs) loop
  if length(coalesce(leg->>'id','')) not between 1 and 100 or not coalesce(leg->>'mode'=any(array['flight','bus','car','boat','walk','bike','other']),false) or not coalesce(leg->>'status'=any(array['planned','done']),false)
  or jsonb_typeof(leg->'segments') is distinct from 'array' or length(coalesce(leg->>'company',''))>120 or length(coalesce(leg->>'comment',''))>1000 then raise exception 'Trecho inválido.';end if;
  if jsonb_array_length(leg->'segments') not between 1 and 8 then raise exception 'Informe de um a oito percursos.';end if;
  previous_arrival:=null;
  for seg in select value from jsonb_array_elements(leg->'segments') loop
   if length(trim(coalesce(seg->>'from',''))) not between 1 and 160 or length(trim(coalesce(seg->>'to',''))) not between 1 and 160
   or lower(trim(seg->>'from'))=lower(trim(seg->>'to'))
   or not coalesce(seg->>'departure' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$',false)
   or not coalesce(seg->>'arrival' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$',false)
   or length(coalesce(seg->>'fromZone','')) not between 1 and 100 or length(coalesce(seg->>'toZone','')) not between 1 and 100 then raise exception 'Confira origem, destino, horários e fusos.';end if;
   departure:=(seg->>'departure')::timestamp at time zone (seg->>'fromZone');
   arrival:=(seg->>'arrival')::timestamp at time zone (seg->>'toZone');
   if arrival<=departure or departure<previous_arrival then raise exception 'Confira a ordem dos horários e as datas das conexões.';end if;
   previous_arrival:=arrival;
  end loop;
 end loop;
 for visit in select value from jsonb_array_elements(new.visits) loop
  if length(coalesce(visit->>'id','')) not between 1 and 100 or length(coalesce(visit->>'placeId','')) not between 1 and 150 or length(trim(coalesce(visit->>'title',''))) not between 1 and 160
  or length(coalesce(visit->>'location',''))>300 or length(coalesce(visit->>'address',''))>500 or length(coalesce(visit->>'comment',''))>1000
  or jsonb_typeof(visit->'visited') is distinct from 'boolean' or jsonb_typeof(visit->'date') is distinct from 'string' then raise exception 'Registro de lugar inválido.';end if;
  if visit->>'date'<>'' and to_char((visit->>'date')::date,'YYYY-MM-DD')<>visit->>'date' then raise exception 'Data da visita inválida.';end if;
 end loop;
 return new;
end $$;
revoke all on function public.rr_check_itinerary() from public,anon,authenticated;
drop trigger if exists check_itinerary_before_write on public.travel_itineraries;
create trigger check_itinerary_before_write before insert or update on public.travel_itineraries for each row execute function public.rr_check_itinerary();
notify pgrst,'reload schema';
commit;
