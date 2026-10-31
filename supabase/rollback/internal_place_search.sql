begin;
do $$begin if exists(select 1 from public.rr_destinations) then raise exception 'Reversão recusada: preserve os destinos cadastrados e use uma correção aditiva.';end if;end$$;
drop trigger rr_profile_selected_place on public.rr_profile_cities;
drop function public.rr_bind_profile_selected_place();
drop function public.rr_search_places(text,integer,uuid),public.rr_get_internal_place(uuid),public.rr_find_place_duplicates(text,text,text,text,double precision,double precision),public.rr_publish_selected_place(uuid,jsonb),public.rr_update_selected_place(uuid,uuid,text,bigint);
alter table public.rr_places drop column search_name,drop column name_vector,drop column search_vector,drop column destination_id;
drop table public.rr_destinations;
drop function public.rr_search_fold(text),public.rr_state_name(text);
commit;
