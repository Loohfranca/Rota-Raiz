begin;
create or replace function public.rr_complete_legacy_place(p_source uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare source public.community_recommendations;place public.rr_places;municipality text:=btrim(coalesce(p->>'municipality',''));uf text;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 if length(btrim(coalesce(p->>'address',''))) not between 1 and 300 then raise exception 'Confira o endereço ou referência do lugar.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_source::text,0));
 select * into place from public.rr_places where legacy_source_id=p_source and deleted_at is null;
 if place.id is not null then return public.rr_get_internal_place(place.id);end if;
 select * into source from public.community_recommendations where id=p_source and place_id is null and status='approved' and deleted_at is null;
 if source.id is null then raise exception 'Cadastro antigo indisponível. Pesquise novamente.';end if;
 select u into uf from unnest(array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']) u
 where upper(btrim(coalesce(p->>'state','')))=u or public.rr_search_fold(p->>'state')=public.rr_search_fold(public.rr_state_name(u)) limit 1;
 if length(municipality) not between 2 and 120 or uf is null
 or exists(select 1 from unnest(array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']) u where public.rr_search_fold(municipality)=public.rr_search_fold(public.rr_state_name(u)))
 then return jsonb_build_object('id',null,'requires_completion',true,'name',source.name,'category',source.category,'address',btrim(p->>'address'),'municipality','','state','','city_label',source.city);end if;
 if coalesce(p->>'instagram','')<>'' and (p->>'instagram') !~ '^https://www[.]instagram[.]com/[a-zA-Z0-9._]{1,30}/$' then raise exception 'Instagram inválido.';end if;
 if exists(select 1 from public.rr_places where deleted_at is null and normalized_name=public.rr_normalize_place_text(source.name)
 and normalized_address=public.rr_normalize_place_address(p->>'address') and normalized_city=public.rr_normalize_place_text(municipality) and normalized_state=public.rr_normalize_place_text(uf))
 then raise exception 'Já existe um cadastro com estes dados. Selecione-o na pesquisa; nada foi unido automaticamente.';end if;
 insert into public.rr_places(name,category,address,city,state,instagram,created_by,source_kind,legacy_source_id)
 values(source.name,source.category,btrim(p->>'address'),municipality,uf,coalesce(p->>'instagram',''),auth.uid(),'user',source.id) returning * into place;
 return public.rr_get_internal_place(place.id);
end $$;

create or replace function public.rr_publish_completed_legacy_place(p_source uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare place jsonb;r public.community_recommendations;note text:=btrim(coalesce(p->>'note',''));instagram text:=coalesce(p->>'instagram','');
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501';end if;
 if length(note) not between 1 and 500 then raise exception 'Conte sua experiência em até 500 caracteres.';end if;
 if instagram<>'' and instagram !~ '^https://www[.]instagram[.]com/[a-zA-Z0-9._]{1,30}/$' then raise exception 'Instagram inválido.';end if;
 place=public.rr_complete_legacy_place(p_source,p);
 if nullif(place->>'id','') is not null then return public.rr_publish_selected_place((place->>'id')::uuid,jsonb_build_object('note',note));end if;
 -- Preserve an unresolved historical locality rather than inventing a municipality.
 insert into public.community_recommendations(id,name,category,city,address,instagram,note,user_id,author_name,status,reviewed_at)
 values(gen_random_uuid(),place->>'name',place->>'category',left(coalesce(nullif(btrim(p->>'city'),''),place->>'city_label'),120),place->>'address',instagram,note,auth.uid(),public.rr_display_name(),'approved',now()) returning * into r;
 return to_jsonb(r);
end $$;
commit;
