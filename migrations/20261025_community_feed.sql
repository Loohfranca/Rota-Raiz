-- Execute after 20261022_community.sql. Idempotent; no existing expenses are deleted.
begin;
create table if not exists public.community_recommendations (
 id uuid primary key, name text not null check(length(trim(name)) between 1 and 120),
 category text not null check(category in ('Comida','Praia','Passeio','Hospedagem','Outros')),
 city text not null check(length(trim(city)) between 1 and 120),
 address text not null check(length(trim(address)) between 1 and 300),
 instagram text not null default '', note text not null check(length(trim(note)) between 1 and 500),
 status text not null default 'pending', created_at timestamptz not null default now(), reviewed_at timestamptz
);
alter table public.community_recommendations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.community_recommendations add column if not exists author_name text not null default 'Viajante';
alter table public.community_recommendations enable row level security;
revoke all on public.community_recommendations from anon, authenticated;
grant select on public.community_recommendations to authenticated;
drop policy if exists "Read approved recommendations" on public.community_recommendations;
drop policy if exists "Suggest pending recommendation" on public.community_recommendations;
drop policy if exists "rr_community_read" on public.community_recommendations;
create policy "rr_community_read" on public.community_recommendations for select to authenticated using(status='approved');
-- Published contributions are community reports, not independently verified guides.
update public.community_recommendations set status='approved',reviewed_at=coalesce(reviewed_at,now()) where status='pending';

create or replace function public.rr_display_name() returns text language sql stable set search_path='' as $$
 select left(coalesce(nullif(trim(auth.jwt()->'user_metadata'->>'full_name'),''),nullif(trim(auth.jwt()->'user_metadata'->>'name'),''),'Viajante'),60)
$$;
create or replace function public.rr_publish_recommendation(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result public.community_recommendations;
begin
 if auth.uid() is null then raise exception 'Entre com sua conta para indicar um lugar.';end if;
 if p is null or not coalesce(p->>'category'=any(array['Comida','Praia','Passeio','Hospedagem','Outros']),false)
 or length(trim(coalesce(p->>'name',''))) not between 1 and 120 or length(trim(coalesce(p->>'city',''))) not between 1 and 120
 or length(trim(coalesce(p->>'address',''))) not between 1 and 300 or length(trim(coalesce(p->>'note',''))) not between 1 and 500
 or (coalesce(p->>'instagram','')<>'' and not (p->>'instagram' ~ '^https://www\.instagram\.com/[a-zA-Z0-9._]{1,30}/$')) then raise exception 'Confira nome, endereço, cidade e Instagram.';end if;
 insert into public.community_recommendations(id,name,category,city,address,instagram,note,user_id,author_name,status,reviewed_at)
 values(gen_random_uuid(),trim(p->>'name'),p->>'category',trim(p->>'city'),trim(p->>'address'),coalesce(p->>'instagram',''),trim(p->>'note'),auth.uid(),public.rr_display_name(),'approved',now()) returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.rr_display_name(),public.rr_publish_recommendation(jsonb) from public,anon,authenticated;
grant execute on function public.rr_publish_recommendation(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;

