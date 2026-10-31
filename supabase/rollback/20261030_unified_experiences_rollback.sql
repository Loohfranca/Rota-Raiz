-- Rollback protegido da Parte 2. Aborta se houver dados novos dependentes.
begin;
do $$
declare v_applied_at timestamptz;
begin
  select applied_at into v_applied_at from public.rr_unified_experience_migrations
  where migration_key='20261030_unified_experiences_v1';
  if v_applied_at is null then raise exception 'Migração da Parte 2 não encontrada.'; end if;
  if exists(select 1 from public.rr_experience_photos) then raise exception 'Rollback bloqueado: existem fotografias novas.'; end if;
  if exists(select 1 from public.community_recommendations where created_at>v_applied_at or version>1 or deleted_at is not null)
    then raise exception 'Rollback bloqueado: existem experiências novas, editadas ou excluídas.'; end if;
  if exists(select 1 from public.rr_places where source_kind='user')
    then raise exception 'Rollback bloqueado: existem lugares criados por usuários.'; end if;
  if exists(select 1 from public.rr_profile_cities where place_id is not null)
    then raise exception 'Rollback bloqueado: existem vínculos novos no Perfil.'; end if;
end
$$;

update public.community_recommendations r set place_id=null
where exists(select 1 from public.rr_place_link_migration_map m
  where m.source_table='community_recommendations' and m.source_id=r.id);

drop policy if exists rr_experience_photos_read_active on public.rr_experience_photos;
drop policy if exists rr_places_read_active on public.rr_places;
drop trigger if exists rr_experience_photos_guard on public.rr_experience_photos;
drop function if exists public.rr_guard_experience_photo();
drop function if exists public.rr_add_experience_photos(uuid,jsonb);
drop function if exists public.rr_set_experience_cover(uuid,uuid);
drop function if exists public.rr_publish_experience(jsonb);
drop function if exists public.rr_update_experience(uuid,jsonb);
drop function if exists public.rr_soft_delete_experience(uuid);
drop function if exists public.rr_restore_experience(uuid);
drop table if exists public.rr_experience_photos;
drop table if exists public.rr_place_link_migration_map;

alter table public.community_recommendations
  drop column if exists place_id,drop column if exists visit_date,
  drop column if exists how_to_get_there,drop column if exists tips,
  drop column if exists updated_at,drop column if exists deleted_at,
  drop column if exists deleted_by,drop column if exists version;
alter table public.rr_profile_cities drop column if exists place_id;
drop table if exists public.rr_places;
drop table if exists public.rr_unified_experience_migrations;
drop function if exists public.rr_extract_place_state(text,text);
drop function if exists public.rr_extract_place_city(text,text);
drop function if exists public.rr_normalize_place_address(text);
drop function if exists public.rr_normalize_place_text(text);

drop policy if exists rr_community_read on public.community_recommendations;
create policy rr_community_read on public.community_recommendations
for select to authenticated using(status='approved');
drop policy if exists community_comments_read on public.community_comments;
create policy community_comments_read on public.community_comments
for select to authenticated using(true);
notify pgrst,'reload schema';
commit;
