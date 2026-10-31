begin;
alter table public.rr_places add column version bigint not null default 1,
 add column location_reference text check(length(location_reference)<=300),add column location_kind text not null default 'address' check(location_kind in ('address','point'));
alter table public.community_recommendations add column schema_version smallint not null default 1 check(schema_version in(1,2)),
 add column experience_source_id uuid references public.community_recommendations(id) on delete set null,
 add column request_token uuid,add column how_to_get jsonb not null default '{}'::jsonb;
create index rr_experience_source_idx on public.community_recommendations(experience_source_id) where experience_source_id is not null;
create unique index rr_experience_request_once on public.community_recommendations(user_id,request_token) where request_token is not null;

create or replace function public.rr_get_internal_place(p_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select to_jsonb(p)||jsonb_build_object('municipality',p.city,'address',case when p.location_kind='point' then null else p.address end,'destination',to_jsonb(d)) from public.rr_places p
 left join public.rr_destinations d on d.id=p.destination_id where p.id=p_id and p.deleted_at is null and auth.uid() is not null
 union all
 select jsonb_build_object('id',r.id,'kind','legacy','requires_completion',true,'name',r.name,'category',r.category,'address',r.address,'instagram',r.instagram,'municipality','','state','','original_location',r.city||' · '||r.address)
 from public.community_recommendations r where r.id=p_id and r.place_id is null and r.status='approved' and r.deleted_at is null and auth.uid() is not null
 and not exists(select 1 from public.rr_places p where p.legacy_source_id=r.id and p.deleted_at is null) limit 1;
$$;

create function public.rr_get_own_experience(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(r)||jsonb_build_object('visited_on',r.visit_date,'place',coalesce(public.rr_get_internal_place(r.place_id),case when r.schema_version=2 then jsonb_build_object('id',coalesce(r.experience_source_id,r.id),'requires_completion',true,'name',r.name,'category',r.category,'address',r.address,'municipality','','state','','instagram',r.instagram) end),
 'photos',coalesce((select jsonb_agg(to_jsonb(ph) order by ph.position) from public.rr_experience_photos ph where ph.experience_id=r.id and ph.deleted_at is null),'[]'::jsonb))
 from public.community_recommendations r where r.id=p_id and r.user_id=auth.uid();
$$;

create function public.rr_save_experience_form(p_id uuid,p jsonb,p_expected_version bigint default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r public.community_recommendations;v public.rr_places;data jsonb:=coalesce(p->'place','{}');details jsonb:=coalesce(p->'how_to_get','{}');full_place jsonb;
 story text:=btrim(coalesce(p->>'note',''));visit date;paths text[];photo jsonb;photo_id uuid;i integer:=0;cover integer;place_address text;region uuid;city_label text;kind text:='address';lat double precision;lng double precision;token uuid;
begin
 if uid is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 if p_id is null then raise exception 'Identificador da experiência obrigatório.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended(uid::text,1));
 select * into r from public.community_recommendations where id=p_id for update;
 if r.id is not null then
  if r.user_id is distinct from uid or r.deleted_at is not null then raise exception 'Experiência indisponível para sua conta.' using errcode='42501';end if;
  if p_expected_version is null and r.request_token=(p->>'request_token')::uuid then return public.rr_get_own_experience(r.id);end if;
  if r.version is distinct from p_expected_version then raise exception 'Experiência atualizada por outra sessão.' using errcode='40001';end if;
  if r.schema_version<>2 then raise exception 'Use a edição compatível com sua publicação antiga.';end if;
 elsif p_expected_version is not null then raise exception 'Experiência não encontrada.';end if;
 token:=coalesce(nullif(p->>'request_token','')::uuid,p_id);
 if length(story) not between 1 and 500 then raise exception 'Conte sua experiência em até 500 caracteres.';end if;
 visit:=nullif(p->>'visited_on','')::date;
 if visit is null or visit>(now() at time zone 'America/Sao_Paulo')::date then raise exception 'Informe uma data de visita válida e não futura.';end if;
 if length(coalesce(p->>'tips',''))>500 or jsonb_typeof(details)<>'object'
 or exists(select 1 from jsonb_object_keys(details) k where k not in('starting_point','transport','route')) or exists(select 1 from jsonb_each(details) e where jsonb_typeof(e.value) not in('string','null'))
 or length(coalesce(details->>'starting_point',''))>160 or length(coalesce(details->>'transport',''))>120 or length(coalesce(details->>'route',''))>600 then raise exception 'Confira as orientações e dicas.';end if;
 if coalesce(jsonb_typeof(p->'photos'),'null')<>'array' or jsonb_array_length(p->'photos')<>2 then raise exception 'Escolha exatamente duas fotografias.';end if;
 cover:=(p->>'cover_index')::integer;if cover is null or cover not in(0,1) then raise exception 'Escolha a fotografia de capa.';end if;
 select array_agg(x->>'storage_path') into paths from jsonb_array_elements(p->'photos') x;
 if paths[1] is null or paths[2] is null or paths[1]=paths[2] then raise exception 'Escolha duas fotografias diferentes.';end if;
 foreach place_address in array paths loop
  if place_address not like uid::text||'/%' or place_address !~ '[.]webp$' or not exists(select 1 from storage.objects o where o.bucket_id='community-photos' and o.name=place_address and o.owner_id=uid::text and not coalesce(o.is_delete_marker,false)) then raise exception 'As duas fotografias devem ter sido enviadas pela sua conta.';end if;
  if exists(select 1 from public.rr_experience_photos ph where ph.storage_path=place_address and (ph.experience_id<>p_id or ph.user_id<>uid)) then raise exception 'Fotografia já vinculada a outra experiência.';end if;
 end loop;
 if (select count(*) from public.rr_experience_photos ph join public.community_recommendations e on e.id=ph.experience_id where ph.user_id=uid and ph.deleted_at is null and ph.experience_id<>p_id and e.deleted_at is null)
 +(select count(*) from public.rr_profile_photos where user_id=uid)+2>25 then raise exception 'Limite de fotos da galeria atingido.';end if;
 if coalesce(data->>'instagram','')<>'' and data->>'instagram' !~ '^https://www[.]instagram[.]com/[a-zA-Z0-9._]{1,30}/$' then raise exception 'Instagram inválido.';end if;
 if nullif(data->>'legacy_source_id','') is not null then
  full_place:=public.rr_complete_legacy_place((data->>'legacy_source_id')::uuid,data);
  if nullif(full_place->>'id','') is not null then select * into v from public.rr_places where id=(full_place->>'id')::uuid for update;
  else city_label:=full_place->>'city_label';end if;
 elsif nullif(p->>'place_id','') is not null then
  select * into v from public.rr_places where id=(p->>'place_id')::uuid and deleted_at is null for update;
  if v.id is null then raise exception 'Lugar indisponível.';end if;
 else
  if length(btrim(coalesce(data->>'name',''))) not between 2 and 120 or data->>'category' not in('Comida','Praia','Passeio','Hospedagem','Outros')
  or length(btrim(coalesce(data->>'municipality',''))) not between 2 and 120 or data->>'state' not in('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') then raise exception 'Complete nome, categoria, cidade e estado.';end if;
  place_address:=nullif(btrim(data->>'address'),'');
  if nullif(data->>'lat','') is not null or nullif(data->>'lng','') is not null then
   lat:=nullif(data->>'lat','')::double precision;lng:=nullif(data->>'lng','')::double precision;
   if lat is null or lng is null or not(lat between -90 and 90) or not(lng between -180 and 180) then raise exception 'Coordenadas inválidas.';end if;
  end if;
  if place_address is null then
   if lat is null or lng is null or length(btrim(coalesce(data->>'location_reference',''))) not between 1 and 300 then raise exception 'Informe endereço ou coordenadas e referência geográfica.';end if;
   kind:='point';place_address:='Ponto confirmado: '||lat||', '||lng;
  end if;
  if length(place_address)>300 or length(coalesce(data->>'location_reference',''))>300 then raise exception 'Encurte o endereço ou referência.';end if;
  if coalesce(data->>'instagram','')<>'' and data->>'instagram' !~ '^https://www[.]instagram[.]com/[a-zA-Z0-9._]{1,30}/$' then raise exception 'Instagram inválido.';end if;
  region:=nullif(data->>'destination_id','')::uuid;
  if region is not null and not exists(select 1 from public.rr_destinations where id=region and deleted_at is null and municipality=data->>'municipality' and state=data->>'state') then raise exception 'Confira o destino e o município.';end if;
  if region is null and nullif(btrim(data->>'destination_name'),'') is not null then
   insert into public.rr_destinations(name,municipality,state) values(btrim(data->>'destination_name'),btrim(data->>'municipality'),data->>'state')
   on conflict(search_name,municipality,state) do update set name=public.rr_destinations.name returning id into region;
  end if;
  insert into public.rr_places(name,category,address,city,state,instagram,lat,lng,location_reference,location_kind,destination_id,created_by)
  values(btrim(data->>'name'),data->>'category',place_address,btrim(data->>'municipality'),data->>'state',coalesce(data->>'instagram',''),lat,lng,nullif(btrim(data->>'location_reference'),''),kind,region,uid) returning * into v;
 end if;
 if v.id is not null then
  if p ? 'place_version' and nullif(p->>'place_version','') is not null and v.version<>(p->>'place_version')::bigint then raise exception 'Lugar atualizado por outra sessão.' using errcode='40001';end if;
  if (data ? 'name' and data->>'name'<>v.name) or (data ? 'category' and data->>'category'<>v.category)
  or (nullif(data->>'municipality','') is not null and data->>'municipality'<>v.city) or(nullif(data->>'state','') is not null and v.state<>'' and data->>'state'<>v.state)
  or(nullif(data->>'address','') is not null and v.location_kind='address' and data->>'address'<>v.address)
  or(nullif(data->>'instagram','') is not null and v.instagram<>'' and data->>'instagram'<>v.instagram)
  or(nullif(data->>'lat','') is not null and v.lat is not null and (data->>'lat')::double precision<>v.lat)
  or(nullif(data->>'lng','') is not null and v.lng is not null and (data->>'lng')::double precision<>v.lng)
  then raise exception 'Os dados compartilhados do lugar estão protegidos.';end if;
  if v.instagram='' and nullif(data->>'instagram','') is not null then
   if data->>'instagram' !~ '^https://www[.]instagram[.]com/[a-zA-Z0-9._]{1,30}/$' then raise exception 'Instagram inválido.';end if;
   update public.rr_places set instagram=data->>'instagram',version=version+1 where id=v.id returning * into v;
  end if;
  if v.state='' and nullif(data->>'state','') is not null then
   if data->>'state' not in('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') then raise exception 'Estado inválido.';end if;
   update public.rr_places set state=data->>'state',version=version+1 where id=v.id returning * into v;
  end if;
  city_label:=v.city||', '||v.state;place_address:=v.address;
 else
  place_address:=nullif(btrim(data->>'address'),'');if place_address is null then raise exception 'Preencha o endereço ou referência.';end if;
 end if;
 if r.id is null then
  insert into public.community_recommendations(id,name,category,city,address,instagram,note,user_id,author_name,status,reviewed_at,place_id,visit_date,schema_version,request_token,how_to_get,tips,experience_source_id)
  values(p_id,coalesce(v.name,full_place->>'name'),coalesce(v.category,full_place->>'category'),city_label,place_address,coalesce(v.instagram,data->>'instagram',''),story,uid,public.rr_display_name(),'approved',now(),v.id,visit,2,token,details,coalesce(p->>'tips',''),nullif(data->>'legacy_source_id','')::uuid) returning * into r;
 else
  update public.community_recommendations set place_id=v.id,name=coalesce(v.name,full_place->>'name'),category=coalesce(v.category,full_place->>'category'),city=city_label,address=place_address,instagram=coalesce(v.instagram,data->>'instagram',''),note=story,visit_date=visit,how_to_get=details,tips=coalesce(p->>'tips',''),version=version+1,updated_at=now() where id=p_id returning * into r;
 end if;
 -- Deactivate metadata inside this transaction to permit swaps without losing photo IDs.
 update public.rr_experience_photos set deleted_at=now(),deleted_by=uid,is_cover=false where experience_id=p_id and deleted_at is null;
 for photo in select * from jsonb_array_elements(p->'photos') loop
  i:=i+1;if length(coalesce(photo->>'caption',''))>180 then raise exception 'Legenda muito longa.';end if;
  select id into photo_id from public.rr_experience_photos where storage_path=photo->>'storage_path';
  if photo_id is null then insert into public.rr_experience_photos(experience_id,user_id,storage_path,caption,position,is_cover) values(p_id,uid,photo->>'storage_path',coalesce(photo->>'caption',''),i,i=cover+1);
  else update public.rr_experience_photos set deleted_at=null,deleted_by=null,caption=coalesce(photo->>'caption',''),position=i,is_cover=i=cover+1 where id=photo_id;end if;
 end loop;
 return public.rr_get_own_experience(p_id);
end $$;

create function public.rr_edit_legacy_experience(p_id uuid,p_note text,p_how_to_get jsonb,p_tips text,p_expected_version bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.community_recommendations;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 if length(btrim(coalesce(p_note,''))) not between 1 and 500 or length(coalesce(p_tips,''))>500 or jsonb_typeof(p_how_to_get)<>'object' or length(coalesce(p_how_to_get->>'starting_point',''))>160 or length(coalesce(p_how_to_get->>'transport',''))>120 or length(coalesce(p_how_to_get->>'route',''))>600 or exists(select 1 from jsonb_object_keys(p_how_to_get) k where k not in('starting_point','transport','route')) or exists(select 1 from jsonb_each(p_how_to_get) e where jsonb_typeof(e.value) not in('string','null')) then raise exception 'Confira relato, orientações e dicas.';end if;
 update public.community_recommendations set note=btrim(p_note),how_to_get=p_how_to_get,tips=coalesce(p_tips,''),version=version+1,updated_at=now()
 where id=p_id and user_id=auth.uid() and version=p_expected_version and schema_version=1 and deleted_at is null returning * into r;
 if r.id is null then raise exception 'Experiência indisponível ou atualizada por outra sessão.' using errcode='40001';end if;
 return public.rr_get_own_experience(p_id);
end $$;
create function public.rr_set_experience_deleted(p_id uuid,p_expected_version bigint,p_deleted boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.community_recommendations;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 update public.community_recommendations as target set deleted_at=case when p_deleted then now() else null end,deleted_by=case when p_deleted then auth.uid() else null end,version=version+1,updated_at=now()
 where target.id=p_id and target.user_id=auth.uid() and target.version=p_expected_version and (p_deleted or target.place_id is null or exists(select 1 from public.rr_places p where p.id=target.place_id and p.deleted_at is null)) returning * into r;
 if r.id is null then raise exception 'Experiência indisponível ou atualizada por outra sessão.' using errcode='40001';end if;
 return public.rr_get_own_experience(p_id);
end $$;
revoke all on function public.rr_get_own_experience(uuid),public.rr_save_experience_form(uuid,jsonb,bigint),public.rr_edit_legacy_experience(uuid,text,jsonb,text,bigint),public.rr_set_experience_deleted(uuid,bigint,boolean) from public,anon,authenticated;
grant execute on function public.rr_get_own_experience(uuid),public.rr_save_experience_form(uuid,jsonb,bigint),public.rr_edit_legacy_experience(uuid,text,jsonb,text,bigint),public.rr_set_experience_deleted(uuid,bigint,boolean) to authenticated;

create function public.rr_check_form_photos() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid;e public.community_recommendations;total integer;covers integer;
begin
 if tg_table_name='community_recommendations' then target:=coalesce(new.id,old.id);else target:=coalesce(new.experience_id,old.experience_id);end if;
 select * into e from public.community_recommendations where id=target;
 if e.schema_version=2 and e.deleted_at is null then
  select count(*),count(*) filter(where is_cover) into total,covers from public.rr_experience_photos where experience_id=target and deleted_at is null;
  if total<>2 or covers<>1 or e.visit_date is null or e.visit_date>(now() at time zone 'America/Sao_Paulo')::date then raise exception 'A experiência precisa de data válida, duas fotos e uma capa.';end if;
 end if;
 return null;
end $$;
create constraint trigger rr_form_photos_complete after insert or update or delete on public.rr_experience_photos deferrable initially deferred for each row execute function public.rr_check_form_photos();
create constraint trigger rr_form_experience_complete after insert or update on public.community_recommendations deferrable initially deferred for each row execute function public.rr_check_form_photos();
revoke all on function public.rr_check_form_photos() from public,anon,authenticated;
do $$declare signature text;fn regprocedure;begin
 foreach signature in array array['rr_publish_recommendation(jsonb)','rr_publish_selected_place(uuid,jsonb)','rr_publish_completed_legacy_place(uuid,jsonb)','rr_update_recommendation(uuid,jsonb)','rr_update_selected_place(uuid,uuid,text,bigint)','rr_delete_recommendation(uuid)','rr_publish_experience(jsonb)','rr_update_experience(uuid,jsonb)','rr_add_experience_photos(uuid,jsonb)','rr_set_experience_cover(uuid,uuid)','rr_soft_delete_experience(uuid)','rr_restore_experience(uuid)'] loop
  fn:=to_regprocedure('public.'||signature);if fn is not null then execute format('revoke execute on function %s from public,anon,authenticated',fn);end if;
 end loop;
end$$;
revoke insert on public.rr_profile_cities from authenticated;
revoke insert(user_id,city,state,place_name,place_id) on public.rr_profile_cities from authenticated;
revoke insert on public.rr_profile_photos from authenticated;
create or replace function public.rr_search_places(p_query text,p_limit integer default 8,p_destination_id uuid default null)
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

 union all select 'legacy',r.id,r.name,r.category,'Localização a completar','',null::text,null::uuid,
 case when public.rr_search_fold(r.name)=q then 0 when public.rr_search_fold(r.name) like q||'%' then 1 else 3 end
 from public.community_recommendations r
 where p_destination_id is null and q<>'' and r.place_id is null and r.status='approved' and r.deleted_at is null
 and not exists(select 1 from public.rr_places p where p.legacy_source_id=r.id and p.deleted_at is null)
 and to_tsvector('simple'::regconfig,public.rr_search_fold(r.name||' '||r.category||' '||r.city||' '||r.address))@@tq
 ) select coalesce(jsonb_agg(to_jsonb(r) order by r.rank,public.rr_search_fold(r.name),case r.kind when 'place' then 0 when 'destination' then 1 else 2 end,r.id),'[]'::jsonb)
 from(select * from matches order by rank,public.rr_search_fold(name),case kind when 'place' then 0 when 'destination' then 1 else 2 end,id limit least(10,greatest(1,coalesce(p_limit,8)))) r);
end $$;

commit;
