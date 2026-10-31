begin;
do $$begin
 if exists(select 1 from public.community_recommendations where schema_version=2 or how_to_get<>'{}'::jsonb)
 or exists(select 1 from public.rr_places where version<>1 or location_reference is not null or location_kind<>'address') then raise exception 'Reversão recusada: preserve experiências e dados novos; use rollback do frontend ou correção aditiva.';end if;
end$$;
drop trigger rr_form_photos_complete on public.rr_experience_photos;
drop trigger rr_form_experience_complete on public.community_recommendations;
drop function public.rr_check_form_photos(),public.rr_get_own_experience(uuid),public.rr_save_experience_form(uuid,jsonb,bigint),public.rr_edit_legacy_experience(uuid,text,jsonb,text,bigint),public.rr_set_experience_deleted(uuid,bigint,boolean);
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

alter table public.community_recommendations drop column schema_version,drop column request_token,drop column how_to_get,drop column experience_source_id;
alter table public.rr_places drop column version,drop column location_reference,drop column location_kind;
do $$declare signature text;fn regprocedure;begin
 foreach signature in array array['rr_publish_recommendation(jsonb)','rr_publish_selected_place(uuid,jsonb)','rr_publish_completed_legacy_place(uuid,jsonb)','rr_update_recommendation(uuid,jsonb)','rr_update_selected_place(uuid,uuid,text,bigint)','rr_delete_recommendation(uuid)','rr_publish_experience(jsonb)','rr_update_experience(uuid,jsonb)','rr_add_experience_photos(uuid,jsonb)','rr_set_experience_cover(uuid,uuid)','rr_soft_delete_experience(uuid)','rr_restore_experience(uuid)'] loop
  fn:=to_regprocedure('public.'||signature);if fn is not null then execute format('grant execute on function %s to authenticated',fn);end if;
 end loop;
end$$;
grant insert(user_id,city,state,place_name,place_id) on public.rr_profile_cities to authenticated;
grant insert on public.rr_profile_photos to authenticated;
commit;
