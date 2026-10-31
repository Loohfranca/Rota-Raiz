begin;
do $$begin if exists(select 1 from public.rr_places where legacy_source_id is not null) then raise exception 'Reversão recusada: preserve os cadastros completados pelos usuários.';end if;end$$;
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
 ) select coalesce(jsonb_agg(to_jsonb(r) order by r.rank,public.rr_search_fold(r.name),r.kind,r.id),'[]'::jsonb)
 from(select * from matches order by rank,public.rr_search_fold(name),kind,id limit least(10,greatest(1,coalesce(p_limit,8)))) r);
end $$;
create or replace function public.rr_get_internal_place(p_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select to_jsonb(p)||jsonb_build_object('municipality',p.city,'destination',to_jsonb(d)) from public.rr_places p
 left join public.rr_destinations d on d.id=p.destination_id where p.id=p_id and p.deleted_at is null and auth.uid() is not null;
$$;

drop function public.rr_publish_completed_legacy_place(uuid,jsonb),public.rr_complete_legacy_place(uuid,jsonb);
drop index public.rr_legacy_search_tokens;
alter table public.rr_places drop column legacy_source_id;
commit;
