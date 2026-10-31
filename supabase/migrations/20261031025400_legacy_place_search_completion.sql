begin;
-- Explicit user-confirmed promotion; original stories, images and interactions are untouched.
alter table public.rr_places add column legacy_source_id uuid references public.community_recommendations(id) on delete set null;
create unique index rr_place_legacy_source on public.rr_places(legacy_source_id) where deleted_at is null and legacy_source_id is not null;
create index rr_legacy_search_tokens on public.community_recommendations using gin(to_tsvector('simple'::regconfig,public.rr_search_fold(name||' '||category||' '||city||' '||address))) where place_id is null and status='approved' and deleted_at is null;
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
 ) select coalesce(jsonb_agg(to_jsonb(r) order by r.rank,public.rr_search_fold(r.name),r.kind,r.id),'[]'::jsonb)
 from(select * from matches order by rank,public.rr_search_fold(name),kind,id limit least(10,greatest(1,coalesce(p_limit,8)))) r);
end $$;

create or replace function public.rr_get_internal_place(p_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select to_jsonb(p)||jsonb_build_object('municipality',p.city,'destination',to_jsonb(d)) from public.rr_places p
 left join public.rr_destinations d on d.id=p.destination_id where p.id=p_id and p.deleted_at is null and auth.uid() is not null
 union all
 select jsonb_build_object('id',r.id,'kind','legacy','requires_completion',true,'name',r.name,'category',r.category,'address',r.address,'instagram',r.instagram,'municipality','','state','','original_location',r.city||' · '||r.address)
 from public.community_recommendations r where r.id=p_id and r.place_id is null and r.status='approved' and r.deleted_at is null and auth.uid() is not null
 and not exists(select 1 from public.rr_places p where p.legacy_source_id=r.id and p.deleted_at is null)
 limit 1;
$$;
create function public.rr_complete_legacy_place(p_source uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare source public.community_recommendations;place public.rr_places;municipality text:=btrim(coalesce(p->>'municipality',''));uf text;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_source::text,0));
 select * into place from public.rr_places where legacy_source_id=p_source and deleted_at is null;
 if place.id is not null then return public.rr_get_internal_place(place.id);end if;
 select * into source from public.community_recommendations where id=p_source and place_id is null and status='approved' and deleted_at is null;
 if source.id is null then raise exception 'Cadastro antigo indisponível. Pesquise novamente.';end if;
 if coalesce((p->>'location_confirmed')::boolean,false) is not true then raise exception 'Confira e confirme a localização do lugar.';end if;
 select u into uf from unnest(array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']) u
 where upper(btrim(coalesce(p->>'state','')))=u or public.rr_search_fold(p->>'state')=public.rr_search_fold(public.rr_state_name(u)) limit 1;
 if length(municipality) not between 2 and 120 or uf is null
 or exists(select 1 from unnest(array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']) u where public.rr_search_fold(municipality)=public.rr_search_fold(public.rr_state_name(u)))
 then raise exception 'Informe o município e o estado do lugar. Um estado não é município.';end if;
 if length(btrim(coalesce(p->>'address',''))) not between 1 and 300 then raise exception 'Confira o endereço ou referência do lugar.';end if;
 if coalesce(p->>'instagram','')<>'' and (p->>'instagram') !~ '^https://www[.]instagram[.]com/[a-zA-Z0-9._]{1,30}/$' then raise exception 'Instagram inválido.';end if;
 if exists(select 1 from public.rr_places where deleted_at is null and normalized_name=public.rr_normalize_place_text(source.name)
 and normalized_address=public.rr_normalize_place_address(p->>'address') and normalized_city=public.rr_normalize_place_text(municipality) and normalized_state=public.rr_normalize_place_text(uf))
 then raise exception 'Já existe um cadastro com estes dados. Selecione-o na pesquisa; nada foi unido automaticamente.';end if;
 insert into public.rr_places(name,category,address,city,state,instagram,created_by,source_kind,legacy_source_id)
 values(source.name,source.category,btrim(p->>'address'),municipality,uf,coalesce(p->>'instagram',''),auth.uid(),'user',source.id) returning * into place;
 return public.rr_get_internal_place(place.id);
end $$;
create function public.rr_publish_completed_legacy_place(p_source uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare place jsonb;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 place=public.rr_complete_legacy_place(p_source,p);
 return public.rr_publish_selected_place((place->>'id')::uuid,jsonb_build_object('note',p->>'note'));
end $$;
revoke all on function public.rr_complete_legacy_place(uuid,jsonb),public.rr_publish_completed_legacy_place(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.rr_complete_legacy_place(uuid,jsonb),public.rr_publish_completed_legacy_place(uuid,jsonb) to authenticated;
commit;
