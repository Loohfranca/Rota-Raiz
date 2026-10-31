-- Part 3. Requires the Part 2 foundation. No data imports or inferred matches.
begin;
create function public.rr_search_fold(p_text text) returns text
language sql immutable parallel safe set search_path='' as $$
  select btrim(regexp_replace(regexp_replace(lower(normalize(coalesce(p_text,''),NFD)),U&'[\0300-\036f]','','g'),'[^a-z0-9]+',' ','g'));
$$;
create function public.rr_state_name(p_state text) returns text
language sql immutable parallel safe set search_path='' as $$
select case p_state when 'AC' then 'Acre' when 'AL' then 'Alagoas' when 'AP' then 'Amapá'
when 'AM' then 'Amazonas' when 'BA' then 'Bahia' when 'CE' then 'Ceará' when 'DF' then 'Distrito Federal'
when 'ES' then 'Espírito Santo' when 'GO' then 'Goiás' when 'MA' then 'Maranhão' when 'MT' then 'Mato Grosso'
when 'MS' then 'Mato Grosso do Sul' when 'MG' then 'Minas Gerais' when 'PA' then 'Pará' when 'PB' then 'Paraíba'
when 'PR' then 'Paraná' when 'PE' then 'Pernambuco' when 'PI' then 'Piauí' when 'RJ' then 'Rio de Janeiro'
when 'RN' then 'Rio Grande do Norte' when 'RS' then 'Rio Grande do Sul' when 'RO' then 'Rondônia'
when 'RR' then 'Roraima' when 'SC' then 'Santa Catarina' when 'SP' then 'São Paulo'
when 'SE' then 'Sergipe' when 'TO' then 'Tocantins' else coalesce(p_state,'') end;
$$;
-- Reuse production rr_places. Destinations are an optional region relation, not another place catalog.
create table public.rr_destinations(
 id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name)) between 2 and 120),
 municipality text not null check(length(btrim(municipality)) between 2 and 120),
 state text not null check(state in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 deleted_at timestamptz,
 search_name text generated always as(public.rr_search_fold(name)) stored,
 search_vector tsvector generated always as(to_tsvector('simple'::regconfig,public.rr_search_fold(name||' '||municipality||' '||state||' '||public.rr_state_name(state)))) stored
);
alter table public.rr_destinations enable row level security;
revoke all on public.rr_destinations from public,anon,authenticated;
grant select on public.rr_destinations to authenticated;
create policy rr_destinations_read on public.rr_destinations for select to authenticated using(deleted_at is null);
create unique index rr_destinations_identity on public.rr_destinations(search_name,municipality,state);
create index rr_destination_search_tokens on public.rr_destinations using gin(search_vector);
alter table public.rr_places add column destination_id uuid references public.rr_destinations(id) on delete restrict,
 add column search_name text generated always as(public.rr_search_fold(name)) stored,
 add column name_vector tsvector generated always as(to_tsvector('simple'::regconfig,public.rr_search_fold(name))) stored,
 add column search_vector tsvector generated always as(to_tsvector('simple'::regconfig,public.rr_search_fold(name||' '||category||case when category='Comida' then ' alimentação' else '' end||' '||city||' '||state||' '||public.rr_state_name(upper(state))))) stored;
create index rr_place_search_name on public.rr_places(search_name text_pattern_ops);
create index rr_place_search_tokens on public.rr_places using gin(search_vector);
create index rr_place_search_destination on public.rr_places(destination_id);
create function public.rr_search_places(p_query text,p_limit integer default 8,p_destination_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare q text:=public.rr_search_fold(left(coalesce(p_query,''),80)); tq tsquery; lexemes text;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501'; end if;
 if q='' and p_destination_id is null then return '[]'::jsonb; end if;
 if q<>'' then select string_agg(quote_literal(token)||':*',' & ') into lexemes from(select token from unnest(string_to_array(q,' ')) token limit 10) words;tq=to_tsquery('simple'::regconfig,lexemes);end if;
 return (with destinations as materialized(select * from public.rr_destinations where search_vector@@tq or(q='' and id=p_destination_id)),
 candidates as(select id from public.rr_places where search_vector@@tq union select id from public.rr_places where destination_id in(select id from destinations) union select id from public.rr_places where q='' and destination_id=p_destination_id),
 matches as(
 select 'place' kind,p.id,p.name,p.category,p.city municipality,p.state,d.name destination,p.destination_id,
 case when p.search_name=q then 0 when p.search_name like q||'%' then 1 when p.name_vector@@tq then 2 else 3 end rank
 from public.rr_places p join candidates c on c.id=p.id left join public.rr_destinations d on d.id=p.destination_id
 where p.deleted_at is null and(p_destination_id is null or p.destination_id=p_destination_id)
 union all select 'destination',d.id,d.name,'Destino',d.municipality,d.state,d.name,d.id,
 case when d.search_name=q then 0 when d.search_name like q||'%' then 1 else 3 end from destinations d where p_destination_id is null
 ) select coalesce(jsonb_agg(to_jsonb(r) order by r.rank,public.rr_search_fold(r.name),r.kind,r.id),'[]'::jsonb)
 from(select * from matches order by rank,public.rr_search_fold(name),kind,id limit least(10,greatest(1,coalesce(p_limit,8)))) r);
end $$;
create function public.rr_get_internal_place(p_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select to_jsonb(p)||jsonb_build_object('municipality',p.city,'destination',to_jsonb(d)) from public.rr_places p
 left join public.rr_destinations d on d.id=p.destination_id where p.id=p_id and p.deleted_at is null and auth.uid() is not null;
$$;
create function public.rr_find_place_duplicates(p_name text,p_address text default '',p_municipality text default '',p_state text default '',p_lat double precision default null,p_lng double precision default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 with candidates as(select p.id,p.name,p.category,p.city municipality,p.state,p.address,p.lat,p.lng,true same_name,
 public.rr_search_fold(p.city)=public.rr_search_fold(p_municipality) and btrim(p_municipality)<>'' same_city,
 (public.rr_search_fold(p.state)=public.rr_search_fold(p_state) or public.rr_search_fold(public.rr_state_name(upper(p.state)))=public.rr_search_fold(p_state)) and btrim(p_state)<>'' same_state,
 public.rr_search_fold(p.address)=public.rr_search_fold(p_address) and btrim(p_address)<>'' same_address,
 coalesce(p.lat=p_lat and p.lng=p_lng,false) same_point
 from public.rr_places p where p.search_name=public.rr_search_fold(left(p_name,120)) and p.deleted_at is null and auth.uid() is not null and public.rr_search_fold(p_name)<>''),
 ranked as(select *,same_city and same_state and(same_address or same_point) possible_duplicate from candidates)
 select coalesce(jsonb_agg(to_jsonb(r) order by possible_duplicate desc,same_city desc,id),'[]'::jsonb) from(select * from ranked order by possible_duplicate desc,same_city desc,id limit 6)r;
$$;
-- The current composer still uses the legacy photo/date rules until Part 4.
-- These wrappers hydrate shared fields on the server; callers supply only their story.
create function public.rr_publish_selected_place(p_place_id uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v public.rr_places; r public.community_recommendations; note text:=btrim(coalesce(p->>'note',''));
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 if length(note) not between 1 and 500 then raise exception 'Conte sua experiência em até 500 caracteres.';end if;
 select * into v from public.rr_places where id=p_place_id and deleted_at is null;
 if v.id is null then raise exception 'Lugar não está disponível.';end if;
 insert into public.community_recommendations(id,name,category,city,address,instagram,note,user_id,author_name,status,reviewed_at,place_id)
 values(gen_random_uuid(),v.name,v.category,v.city||', '||v.state,v.address,v.instagram,note,auth.uid(),public.rr_display_name(),'approved',now(),v.id) returning * into r;
 return to_jsonb(r);
end $$;
create function public.rr_update_selected_place(p_id uuid,p_place_id uuid,p_note text,p_expected_version bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v public.rr_places;r public.community_recommendations;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 if length(btrim(coalesce(p_note,''))) not between 1 and 500 then raise exception 'Conte sua experiência em até 500 caracteres.';end if;
 select * into r from public.community_recommendations where id=p_id and user_id=auth.uid() and deleted_at is null for update;
 if r.id is null or r.version is distinct from p_expected_version then raise exception 'Indicação indisponível ou alterada por outra sessão.' using errcode='40001';end if;
 select * into v from public.rr_places where id=p_place_id and deleted_at is null;
 if v.id is null then raise exception 'Lugar não está disponível.';end if;
 update public.community_recommendations set place_id=v.id,name=v.name,category=v.category,city=v.city||', '||v.state,address=v.address,instagram=v.instagram,
 note=btrim(p_note),version=version+1,updated_at=now() where id=p_id returning * into r;
 return to_jsonb(r);
end $$;
-- Selected profile albums use the existing place_id FK; no parallel profile records.
create function public.rr_bind_profile_selected_place() returns trigger language plpgsql security invoker set search_path='' as $$
declare v public.rr_places;
begin
 if new.place_id is null then return new;end if;
 select * into v from public.rr_places where id=new.place_id and deleted_at is null;
 if v.id is null then raise exception 'Lugar não está disponível.';end if;
 new.place_name=v.name;new.city=v.city;new.state=v.state;return new;
end $$;
create trigger rr_profile_selected_place before insert or update on public.rr_profile_cities for each row execute function public.rr_bind_profile_selected_place();
grant insert(place_id) on public.rr_profile_cities to authenticated;
revoke all on function public.rr_search_places(text,integer,uuid),public.rr_get_internal_place(uuid),public.rr_find_place_duplicates(text,text,text,text,double precision,double precision),public.rr_publish_selected_place(uuid,jsonb),public.rr_update_selected_place(uuid,uuid,text,bigint),public.rr_bind_profile_selected_place() from public,anon,authenticated;
grant execute on function public.rr_search_places(text,integer,uuid),public.rr_get_internal_place(uuid),public.rr_find_place_duplicates(text,text,text,text,double precision,double precision),public.rr_publish_selected_place(uuid,jsonb),public.rr_update_selected_place(uuid,uuid,text,bigint) to authenticated;
commit;
