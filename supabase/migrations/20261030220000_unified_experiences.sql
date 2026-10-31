-- Rota Raiz Parte 2: lugares e experiências unificados.
-- Aditiva e idempotente. Aplicar somente após backup e validação em ambiente de teste.

begin;

create or replace function public.rr_normalize_place_text(p_value text)
returns text language sql immutable parallel safe set search_path = ''
as $$
  select btrim(regexp_replace(
    regexp_replace(
      translate(lower(coalesce(p_value,'')),
        'áàâãäéèêëíìîïóòôõöúùûüçñ',
        'aaaaaeeeeiiiiooooouuuucn'),
      '\m(rua|r|avenida|av|travessa|tv)\M',' ','g'),
    '[^a-z0-9]+',' ','g'));
$$;

create or replace function public.rr_normalize_place_address(p_value text)
returns text language sql immutable parallel safe set search_path = ''
as $$
  select public.rr_normalize_place_text(regexp_replace(
    coalesce(p_value,''),
    '[,[:space:]]+[0-9]{5}-?[0-9]{3,4}[[:space:]]*$','','g'));
$$;

create or replace function public.rr_extract_place_city(p_city text,p_address text)
returns text language sql immutable parallel safe set search_path=''
as $$
  select case
    when m[1] is not null
      and public.rr_normalize_place_text(m[1])<>public.rr_normalize_place_text(x.city_base)
      then btrim(m[1])
    else x.city_base
  end
  from (
    select
      case when upper(btrim(coalesce(p_city,''))) ~ ',[[:space:]]*[A-Z]{2}$'
        then btrim(regexp_replace(btrim(p_city),',[[:space:]]*[A-Za-z]{2}$',''))
        else btrim(coalesce(p_city,'')) end as city_base,
      regexp_match(upper(coalesce(p_address,'')),
        ',[[:space:]]*([^,]+)[[:space:]]*-[[:space:]]*([A-Z]{2})([,[:space:]]*[0-9]{5}-?[0-9]{3})?[[:space:]]*$') as m
  ) x;
$$;

create or replace function public.rr_extract_place_state(p_city text,p_address text)
returns text language sql immutable parallel safe set search_path=''
as $$
  select coalesce(
    case when upper(btrim(coalesce(p_city,''))) ~ ',[[:space:]]*[A-Z]{2}$'
      then upper(substring(btrim(p_city) from '([A-Za-z]{2})$')) end,
    (regexp_match(upper(coalesce(p_address,'')),
      '(^|[, -])([A-Z]{2})([,[:space:]]*[0-9]{5}-?[0-9]{3})?[[:space:]]*$'))[2],
    ''
  );
$$;

create table if not exists public.rr_unified_experience_migrations (
  migration_key text primary key,
  applied_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);
alter table public.rr_unified_experience_migrations enable row level security;
revoke all on public.rr_unified_experience_migrations from anon,authenticated;
insert into public.rr_unified_experience_migrations(migration_key,details)
values('20261030_unified_experiences_v1',
  '{"purpose":"centralizar lugares preservando IDs e experiências antigas"}'::jsonb)
on conflict(migration_key) do nothing;

create table if not exists public.rr_places (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 1 and 120),
  category text not null check(category in ('Comida','Praia','Passeio','Hospedagem','Outros')),
  address text not null check(length(btrim(address)) between 1 and 300),
  city text not null check(length(btrim(city)) between 1 and 120),
  state text not null default '' check(length(state)<=60),
  instagram text not null default '' check(length(instagram)<=120),
  lat double precision,
  lng double precision,
  created_by uuid references auth.users(id) on delete set null,
  source_kind text not null default 'user' check(source_kind in ('user','editorial','legacy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  normalized_name text generated always as(public.rr_normalize_place_text(name)) stored,
  normalized_address text generated always as(public.rr_normalize_place_address(address)) stored,
  normalized_city text generated always as(public.rr_normalize_place_text(city)) stored,
  normalized_state text generated always as(public.rr_normalize_place_text(state)) stored,
  check((lat is null and lng is null) or (lat between -90 and 90 and lng between -180 and 180))
);

create unique index if not exists rr_places_active_identity_uq
on public.rr_places(normalized_name,normalized_address,normalized_city,normalized_state)
where deleted_at is null;
create index if not exists rr_places_active_city_idx
on public.rr_places(normalized_city,normalized_state) where deleted_at is null;

alter table public.community_recommendations
  add column if not exists place_id uuid references public.rr_places(id) on delete restrict,
  add column if not exists visit_date date,
  add column if not exists how_to_get_there text not null default '',
  add column if not exists tips text not null default '',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists version bigint not null default 1;

do $$
begin
  if not exists(select 1 from pg_constraint where conname='community_recommendations_experience_text_limits' and conrelid='public.community_recommendations'::regclass) then
    alter table public.community_recommendations add constraint community_recommendations_experience_text_limits
      check(length(how_to_get_there)<=500 and length(tips)<=500);
  end if;
  if not exists(select 1 from pg_constraint where conname='community_recommendations_version_positive' and conrelid='public.community_recommendations'::regclass) then
    alter table public.community_recommendations add constraint community_recommendations_version_positive check(version>0);
  end if;
end
$$;

create index if not exists community_recommendations_place_recent_idx
on public.community_recommendations(place_id,visit_date desc nulls last,created_at desc)
where deleted_at is null;

alter table public.rr_profile_cities
add column if not exists place_id uuid references public.rr_places(id) on delete restrict;
create index if not exists rr_profile_cities_place_idx
on public.rr_profile_cities(place_id) where place_id is not null;

create table if not exists public.rr_place_link_migration_map (
  source_table text not null check(source_table in ('community_recommendations','rr_profile_cities')),
  source_id uuid not null,
  place_id uuid references public.rr_places(id) on delete restrict,
  decision text not null check(decision in (
    'linked_exact_normalized_identity',
    'unlinked_missing_required_location',
    'unlinked_legacy_profile_album_without_verified_address')),
  match_key text not null default '',
  created_at timestamptz not null default now(),
  primary key(source_table,source_id)
);
alter table public.rr_place_link_migration_map enable row level security;
revoke all on public.rr_place_link_migration_map from anon,authenticated;

-- UF pode vir da cidade ("Cidade, RJ") ou do endereço ("... - RJ, CEP").
-- Se não houver UF e município inequívocos, o registro antigo fica sem vínculo.
with source_rows as (
  select r.id,r.name,r.category,r.address,
    public.rr_extract_place_city(r.city,r.address) as city_value,
    public.rr_extract_place_state(r.city,r.address) as state_value,
    coalesce(r.instagram,'') as instagram,r.user_id,
    coalesce(r.editorial,false) as editorial,r.created_at,
    public.rr_normalize_place_text(r.name) as key_name,
    public.rr_normalize_place_address(r.address) as key_address,
    public.rr_normalize_place_text(public.rr_extract_place_city(r.city,r.address)) as key_city
  from public.community_recommendations r
  where nullif(btrim(r.name),'') is not null
    and nullif(btrim(r.address),'') is not null
    and nullif(btrim(r.city),'') is not null
),
valid_rows as (
  select *,public.rr_normalize_place_text(state_value) as key_state
  from source_rows
  where state_value in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')
    and key_city not in ('acre','alagoas','amapa','amazonas','bahia','ceara','distrito federal',
      'espirito santo','goias','maranhao','mato grosso','mato grosso do sul','minas gerais',
      'para','paraiba','parana','pernambuco','piaui','rio de janeiro','rio grande do norte',
      'rio grande do sul','rondonia','roraima','santa catarina','sao paulo','sergipe','tocantins',
      'caraiva','ilha grande','boipeba')
    and key_city<>''
),
chosen_places as (
  select distinct on(key_name,key_address,key_city,key_state)
    name,category,address,city_value,state_value,instagram,user_id,editorial
  from valid_rows
  where key_name<>'' and key_address<>'' and key_city<>''
  order by key_name,key_address,key_city,key_state,created_at asc,id asc
)
insert into public.rr_places(name,category,address,city,state,instagram,created_by,source_kind)
select name,category,address,city_value,state_value,instagram,user_id,
  case when editorial then 'editorial' else 'legacy' end
from chosen_places
on conflict(normalized_name,normalized_address,normalized_city,normalized_state)
where deleted_at is null do nothing;

with source_rows as (
  select r.id,
    public.rr_normalize_place_text(r.name) as key_name,
    public.rr_normalize_place_address(r.address) as key_address,
    public.rr_normalize_place_text(public.rr_extract_place_city(r.city,r.address)) as key_city,
    public.rr_extract_place_state(r.city,r.address) as state_value
  from public.community_recommendations r
),
valid_rows as (
  select *,public.rr_normalize_place_text(state_value) as key_state
  from source_rows
  where state_value in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')
    and key_city not in ('acre','alagoas','amapa','amazonas','bahia','ceara','distrito federal',
      'espirito santo','goias','maranhao','mato grosso','mato grosso do sul','minas gerais',
      'para','paraiba','parana','pernambuco','piaui','rio de janeiro','rio grande do norte',
      'rio grande do sul','rondonia','roraima','santa catarina','sao paulo','sergipe','tocantins')
)
update public.community_recommendations r
set place_id=p.id
from valid_rows s
join public.rr_places p on p.normalized_name=s.key_name
  and p.normalized_address=s.key_address
  and p.normalized_city=s.key_city
  and p.normalized_state=s.key_state
  and p.deleted_at is null
where r.id=s.id and r.place_id is null;

insert into public.rr_place_link_migration_map(source_table,source_id,place_id,decision,match_key)
select 'community_recommendations',r.id,r.place_id,
  case when r.place_id is not null then 'linked_exact_normalized_identity'
    else 'unlinked_missing_required_location' end,
  concat_ws('|',public.rr_normalize_place_text(r.name),
    public.rr_normalize_place_address(r.address),public.rr_normalize_place_text(r.city))
from public.community_recommendations r
on conflict(source_table,source_id) do nothing;

-- Álbuns antigos não possuem endereço confirmado: não associar por aproximação.
insert into public.rr_place_link_migration_map(source_table,source_id,place_id,decision,match_key)
select 'rr_profile_cities',c.id,null,
  'unlinked_legacy_profile_album_without_verified_address',
  concat_ws('|',public.rr_normalize_place_text(c.place_name),
    public.rr_normalize_place_text(c.city),public.rr_normalize_place_text(c.state))
from public.rr_profile_cities c
on conflict(source_table,source_id) do nothing;

create table if not exists public.rr_experience_photos (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.community_recommendations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  storage_path text not null unique check(length(storage_path) between 1 and 500),
  caption text not null default '' check(length(caption)<=180),
  position smallint not null default 1 check(position in (1,2)),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  check(storage_path like user_id::text||'/%')
);
create unique index if not exists rr_experience_photos_position_uq
on public.rr_experience_photos(experience_id,position) where deleted_at is null;
create unique index if not exists rr_experience_photos_single_cover_uq
on public.rr_experience_photos(experience_id) where is_cover and deleted_at is null;
create index if not exists rr_experience_photos_experience_idx
on public.rr_experience_photos(experience_id,position) where deleted_at is null;

create or replace function public.rr_guard_experience_photo()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_owner uuid; v_count integer;
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then
    raise exception 'A fotografia deve pertencer à conta autenticada.';
  end if;
  select r.user_id into v_owner from public.community_recommendations r
  where r.id=new.experience_id and r.deleted_at is null for update;
  if v_owner is null or v_owner is distinct from auth.uid() then
    raise exception 'A experiência não pertence à sua conta ou está indisponível.';
  end if;
  if new.storage_path not like auth.uid()::text||'/%' then
    raise exception 'Caminho de fotografia não autorizado.';
  end if;
  select count(*)::integer into v_count from public.rr_experience_photos p
  where p.experience_id=new.experience_id and p.deleted_at is null
    and p.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid);
  if new.deleted_at is null and v_count>=2 then
    raise exception 'Cada experiência pode ter no máximo duas fotografias.';
  end if;
  if new.deleted_at is null and new.is_cover and exists(
    select 1 from public.rr_experience_photos p
    where p.experience_id=new.experience_id and p.is_cover and p.deleted_at is null
      and p.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
  ) then raise exception 'A experiência já possui uma fotografia de capa.'; end if;
  return new;
end;
$$;

drop trigger if exists rr_experience_photos_guard on public.rr_experience_photos;
create trigger rr_experience_photos_guard before insert or update
on public.rr_experience_photos for each row execute function public.rr_guard_experience_photo();

-- Só registra duas imagens já enviadas ao bucket público community-photos.
-- A operação é atômica, valida proprietário do arquivo e exige uma única capa.
create or replace function public.rr_add_experience_photos(p_experience_id uuid,p_photos jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_owner uuid; v_item jsonb; v_path text; v_cover boolean; v_position integer;
begin
  if auth.uid() is null then raise exception 'Entre com sua conta.'; end if;
  if coalesce(jsonb_typeof(p_photos),'null')<>'array' or coalesce(jsonb_array_length(p_photos),0)<>2 then
    raise exception 'Envie exatamente duas fotografias.';
  end if;
  if (select count(*) from jsonb_array_elements(p_photos) x where coalesce((x->>'is_cover')::boolean,false))<>1 then
    raise exception 'Escolha exatamente uma fotografia de capa.';
  end if;
  select r.user_id into v_owner from public.community_recommendations r
  where r.id=p_experience_id and r.deleted_at is null for update;
  if v_owner is null or v_owner is distinct from auth.uid() then
    raise exception 'Experiência não encontrada ou sem permissão.';
  end if;
  if exists(select 1 from public.rr_experience_photos where experience_id=p_experience_id and deleted_at is null) then
    raise exception 'Esta experiência já possui fotografias registradas.';
  end if;
  for v_item in select value from jsonb_array_elements(p_photos)
  loop
    v_path:=btrim(coalesce(v_item->>'storage_path',''));
    v_cover:=coalesce((v_item->>'is_cover')::boolean,false);
    if v_path='' or v_path not like auth.uid()::text||'/%' then
      raise exception 'Caminho de fotografia inválido.';
    end if;
    if length(coalesce(v_item->>'caption',''))>180 then
      raise exception 'A legenda da fotografia excede 180 caracteres.';
    end if;
    if not exists(select 1 from storage.objects o
      where o.bucket_id='community-photos' and o.name=v_path
        and o.owner_id=auth.uid()::text and not coalesce(o.is_delete_marker,false)) then
      raise exception 'Uma das fotografias não foi enviada pela sua conta ao armazenamento do Rota Raiz.';
    end if;
  end loop;
  for v_item,v_position in
    select value,ordinality::integer from jsonb_array_elements(p_photos) with ordinality
  loop
    insert into public.rr_experience_photos(experience_id,user_id,storage_path,caption,position,is_cover)
    values(p_experience_id,auth.uid(),btrim(v_item->>'storage_path'),
      btrim(coalesce(v_item->>'caption','')),v_position,coalesce((v_item->>'is_cover')::boolean,false));
  end loop;
  return (select coalesce(jsonb_agg(to_jsonb(p) order by p.position),'[]'::jsonb)
    from public.rr_experience_photos p where p.experience_id=p_experience_id and p.deleted_at is null);
end;
$$;

create or replace function public.rr_set_experience_cover(p_experience_id uuid,p_photo_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Entre com sua conta.'; end if;
  select user_id into v_owner from public.community_recommendations
  where id=p_experience_id and deleted_at is null for update;
  if v_owner is null or v_owner is distinct from auth.uid() then
    raise exception 'Experiência não encontrada ou sem permissão.';
  end if;
  if not exists(select 1 from public.rr_experience_photos
    where id=p_photo_id and experience_id=p_experience_id and user_id=auth.uid() and deleted_at is null) then
    raise exception 'Fotografia não encontrada nesta experiência.';
  end if;
  update public.rr_experience_photos set is_cover=false
  where experience_id=p_experience_id and is_cover and deleted_at is null;
  update public.rr_experience_photos set is_cover=true
  where id=p_photo_id and experience_id=p_experience_id;
  return true;
end;
$$;

alter table public.rr_places enable row level security;
revoke all on public.rr_places from anon,authenticated;
grant select on public.rr_places to authenticated;
drop policy if exists rr_places_read_active on public.rr_places;
create policy rr_places_read_active on public.rr_places for select to authenticated using(deleted_at is null);

alter table public.rr_experience_photos enable row level security;
revoke all on public.rr_experience_photos from anon,authenticated;
grant select on public.rr_experience_photos to authenticated;
drop policy if exists rr_experience_photos_read_active on public.rr_experience_photos;
create policy rr_experience_photos_read_active on public.rr_experience_photos
for select to authenticated using(deleted_at is null and exists(
  select 1 from public.community_recommendations r
  where r.id=experience_id and r.status='approved' and r.deleted_at is null
));

drop policy if exists rr_community_read on public.community_recommendations;
create policy rr_community_read on public.community_recommendations
for select to authenticated using(status='approved' and deleted_at is null);
drop policy if exists community_comments_read on public.community_comments;
create policy community_comments_read on public.community_comments for select to authenticated
using(exists(select 1 from public.community_recommendations r
  where r.id=recommendation_id and r.status='approved' and r.deleted_at is null));

create or replace function public.rr_publish_experience(p jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_place public.rr_places; v_result public.community_recommendations;
  v_name text; v_category text; v_address text; v_city text; v_state text;
  v_instagram text; v_note text; v_visit_date date;
begin
  if auth.uid() is null then raise exception 'Entre com sua conta para publicar uma experiência.'; end if;
  if p is null then raise exception 'Dados da experiência inválidos.'; end if;
  v_note:=btrim(coalesce(p->>'note',''));
  if length(v_note) not between 1 and 500 then raise exception 'O relato deve ter entre 1 e 500 caracteres.'; end if;
  v_visit_date:=nullif(p->>'visit_date','')::date;
  if v_visit_date is null then raise exception 'Informe a data da visita.'; end if;
  if v_visit_date>current_date then raise exception 'A data da visita não pode estar no futuro.'; end if;
  if coalesce(jsonb_typeof(p->'photos'),'null')<>'array' or coalesce(jsonb_array_length(p->'photos'),0)<>2 then
    raise exception 'Envie exatamente duas fotografias.';
  end if;

  if nullif(p->>'place_id','') is not null then
    select * into v_place from public.rr_places where id=(p->>'place_id')::uuid and deleted_at is null;
    if v_place.id is null then raise exception 'O lugar selecionado não está disponível.'; end if;
  else
    v_name:=btrim(coalesce(p->>'name',''));
    v_category:=case when p->>'category'='Alimentação' then 'Comida' else p->>'category' end;
    v_address:=btrim(coalesce(p->>'address','')); v_city:=btrim(coalesce(p->>'city',''));
    v_state:=btrim(coalesce(p->>'state','')); v_instagram:=btrim(coalesce(p->>'instagram',''));
    if length(v_name) not between 1 and 120 or v_category not in ('Comida','Praia','Passeio','Hospedagem','Outros')
      or length(v_address) not between 1 and 300 or length(v_city) not between 1 and 120
      or length(v_state) not between 2 and 60 then
      raise exception 'Para cadastrar um lugar novo, informe nome, categoria, endereço, cidade e estado.';
    end if;
    if length(v_instagram)>120 or (v_instagram<>'' and v_instagram !~ '^https://www[.]instagram[.]com/[a-zA-Z0-9._]{1,30}/$') then
      raise exception 'Informe um perfil válido do Instagram ou deixe o campo vazio.';
    end if;
    insert into public.rr_places(name,category,address,city,state,instagram,created_by,source_kind)
    values(v_name,v_category,v_address,v_city,v_state,v_instagram,auth.uid(),'user')
    on conflict(normalized_name,normalized_address,normalized_city,normalized_state)
      where deleted_at is null do nothing returning * into v_place;
    if v_place.id is null then
      select * into v_place from public.rr_places
      where normalized_name=public.rr_normalize_place_text(v_name)
        and normalized_address=public.rr_normalize_place_address(v_address)
        and normalized_city=public.rr_normalize_place_text(v_city)
        and normalized_state=public.rr_normalize_place_text(v_state)
        and deleted_at is null;
    end if;
  end if;
  if v_place.id is null then raise exception 'Não foi possível identificar o lugar cadastrado.'; end if;

  insert into public.community_recommendations(
    id,name,category,city,address,instagram,note,user_id,author_name,status,reviewed_at,
    place_id,visit_date,how_to_get_there,tips,updated_at
  ) values(
    gen_random_uuid(),v_place.name,v_place.category,v_place.city,v_place.address,v_place.instagram,
    v_note,auth.uid(),public.rr_display_name(),'approved',now(),v_place.id,v_visit_date,
    left(btrim(coalesce(p->>'how_to_get_there','')),500),
    left(btrim(coalesce(p->>'tips','')),500),now()
  ) returning * into v_result;
  perform public.rr_add_experience_photos(v_result.id,p->'photos');
  return to_jsonb(v_result);
end;
$$;

create or replace function public.rr_update_experience(p_id uuid,p jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_current public.community_recommendations; v_place public.rr_places; v_place_id uuid; v_note text; v_visit_date date;
begin
  if auth.uid() is null then raise exception 'Entre com sua conta.'; end if;
  select * into v_current from public.community_recommendations
  where id=p_id and user_id=auth.uid() and deleted_at is null for update;
  if v_current.id is null then raise exception 'Experiência não encontrada ou sem permissão.'; end if;
  v_place_id:=v_current.place_id;
  if nullif(p->>'place_id','') is not null then v_place_id:=(p->>'place_id')::uuid; end if;
  select * into v_place from public.rr_places where id=v_place_id and deleted_at is null;
  if v_place.id is null then raise exception 'Selecione um lugar válido para esta experiência.'; end if;
  v_note:=btrim(coalesce(p->>'note',v_current.note));
  if length(v_note) not between 1 and 500 then raise exception 'O relato deve ter entre 1 e 500 caracteres.'; end if;
  v_visit_date:=case when p ? 'visit_date' then nullif(p->>'visit_date','')::date else v_current.visit_date end;
  if v_visit_date is null then raise exception 'Informe a data da visita.'; end if;
  if v_visit_date>current_date then raise exception 'A data da visita não pode estar no futuro.'; end if;
  update public.community_recommendations set
    place_id=v_place.id,name=v_place.name,category=v_place.category,city=v_place.city,
    address=v_place.address,instagram=v_place.instagram,note=v_note,visit_date=v_visit_date,
    how_to_get_there=case when p ? 'how_to_get_there' then left(btrim(coalesce(p->>'how_to_get_there','')),500) else how_to_get_there end,
    tips=case when p ? 'tips' then left(btrim(coalesce(p->>'tips','')),500) else tips end,
    updated_at=now(),version=version+1
  where id=p_id returning * into v_current;
  return to_jsonb(v_current);
end;
$$;

create or replace function public.rr_soft_delete_experience(p_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_rows integer;
begin
  if auth.uid() is null then raise exception 'Entre com sua conta.'; end if;
  update public.community_recommendations set deleted_at=now(),deleted_by=auth.uid(),
    updated_at=now(),version=version+1
  where id=p_id and user_id=auth.uid() and deleted_at is null;
  get diagnostics v_rows=row_count;
  if v_rows=0 then raise exception 'Experiência não encontrada ou sem permissão.'; end if;
  return true;
end;
$$;

create or replace function public.rr_restore_experience(p_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_rows integer;
begin
  if auth.uid() is null then raise exception 'Entre com sua conta.'; end if;
  update public.community_recommendations r set deleted_at=null,deleted_by=null,
    updated_at=now(),version=version+1
  where r.id=p_id and r.user_id=auth.uid() and r.deleted_at is not null
    and (r.place_id is null or exists(select 1 from public.rr_places p
      where p.id=r.place_id and p.deleted_at is null));
  get diagnostics v_rows=row_count;
  if v_rows=0 then raise exception 'Experiência não encontrada, lugar indisponível ou sem permissão.'; end if;
  return true;
end;
$$;

revoke all on function public.rr_add_experience_photos(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.rr_set_experience_cover(uuid,uuid) from public,anon,authenticated;
revoke all on function public.rr_publish_experience(jsonb) from public,anon,authenticated;
revoke all on function public.rr_update_experience(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.rr_soft_delete_experience(uuid) from public,anon,authenticated;
revoke all on function public.rr_restore_experience(uuid) from public,anon,authenticated;
grant execute on function public.rr_add_experience_photos(uuid,jsonb) to authenticated;
grant execute on function public.rr_set_experience_cover(uuid,uuid) to authenticated;
grant execute on function public.rr_publish_experience(jsonb) to authenticated;
grant execute on function public.rr_update_experience(uuid,jsonb) to authenticated;
grant execute on function public.rr_soft_delete_experience(uuid) to authenticated;
grant execute on function public.rr_restore_experience(uuid) to authenticated;

notify pgrst,'reload schema';
commit;
