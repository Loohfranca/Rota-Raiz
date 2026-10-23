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

create table if not exists public.shared_trips (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 ledger jsonb not null, version bigint not null default 1, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.trip_members (
 trip_id uuid not null references public.shared_trips(id) on delete cascade,
 user_id uuid not null references auth.users(id), person_id text not null, display_name text not null,
 joined_at timestamptz not null default now(), primary key(trip_id,user_id), unique(trip_id,person_id)
);
create table if not exists public.trip_invitations (
 token_hash text primary key, trip_id uuid not null references public.shared_trips(id) on delete cascade,
 created_by uuid not null references auth.users(id), person_id text,
 expires_at timestamptz not null default now()+interval '7 days', used_by uuid references auth.users(id), used_at timestamptz
);
alter table public.shared_trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;
-- Access exclusively through authenticated RPCs. No public table or invitation reads.
revoke all on public.shared_trips,public.trip_members,public.trip_invitations from anon,authenticated;

create or replace function public.rr_display_name() returns text language sql stable set search_path='' as $$
 select left(coalesce(nullif(trim(auth.jwt()->'user_metadata'->>'full_name'),''),nullif(trim(auth.jwt()->'user_metadata'->>'name'),''),'Viajante'),60)
$$;

create or replace function public.rr_validate_ledger(p jsonb) returns void language plpgsql set search_path='' as $$
declare person jsonb; expense jsonb; shares record; person_ids text[]; sum_shares bigint;
begin
 if p is null or pg_column_size(p)>1048576 or jsonb_typeof(p)<>'object' or jsonb_typeof(p->'name') is distinct from 'string' or length(trim(p->>'name')) not between 1 and 100
 or jsonb_typeof(p->'people') is distinct from 'array' or jsonb_typeof(p->'expenses') is distinct from 'array' then raise exception 'Dados da viagem inválidos.';end if;
 if jsonb_array_length(p->'people') not between 1 and 50 or jsonb_array_length(p->'expenses')>10000 then raise exception 'Limite de participantes ou despesas excedido.';end if;
 select array_agg(value->>'id') into person_ids from jsonb_array_elements(p->'people');
 if cardinality(person_ids)<>(select count(distinct x) from unnest(person_ids) x) then raise exception 'Participantes duplicados.';end if;
 for person in select value from jsonb_array_elements(p->'people') loop
  if jsonb_typeof(person->'id') is distinct from 'string' or length(person->>'id') not between 1 and 100 or jsonb_typeof(person->'name') is distinct from 'string' or length(trim(person->>'name')) not between 1 and 60 then raise exception 'Participante inválido.';end if;
 end loop;
 if jsonb_array_length(p->'expenses')<>(select count(distinct value->>'id') from jsonb_array_elements(p->'expenses')) then raise exception 'Despesas duplicadas.';end if;
 for expense in select value from jsonb_array_elements(p->'expenses') loop
  if jsonb_typeof(expense->'id') is distinct from 'string' or length(expense->>'id') not between 1 and 100
   or jsonb_typeof(expense->'description') is distinct from 'string' or length(trim(expense->>'description')) not between 1 and 160
   or not coalesce(expense->>'category'=any(array['Alimentação','Transporte','Hospedagem','Passeios','Compras','Outros']),false)
   or jsonb_typeof(expense->'amount') is distinct from 'number' or not coalesce(expense->>'amount' ~ '^[0-9]+$',false)
   or (expense->>'amount')::numeric not between 1 and 100000000
   or not coalesce((expense->>'payer')=any(person_ids),false)
   or not coalesce(expense->>'date' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',false)
   or jsonb_typeof(expense->'shares') is distinct from 'object' then raise exception 'Despesa inválida.';end if;
  if to_char((expense->>'date')::date,'YYYY-MM-DD')<>expense->>'date' then raise exception 'Data inválida.';end if;
  sum_shares:=0;
  if (select count(*) from jsonb_each(expense->'shares'))=0 then raise exception 'Escolha quem participa da divisão.';end if;
  for shares in select key,value from jsonb_each(expense->'shares') loop
   if not shares.key=any(person_ids) or jsonb_typeof(shares.value)<>'number' or not (shares.value::text ~ '^[0-9]+$') or shares.value::text::numeric>100000000 then raise exception 'Divisão inválida.';end if;
   sum_shares:=sum_shares+shares.value::text::bigint;
  end loop;
  if sum_shares<>(expense->>'amount')::bigint then raise exception 'A divisão não corresponde ao valor do gasto.';end if;
 end loop;
end $$;

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

create or replace function public.rr_list_trips() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(t.ledger||jsonb_build_object('id',t.id,'version',t.version,'members',(select jsonb_agg(jsonb_build_object('user_id',m.user_id,'person_id',m.person_id,'name',m.display_name)) from public.trip_members m where m.trip_id=t.id)) order by t.created_at desc),'[]'::jsonb)
 from public.shared_trips t join public.trip_members mine on mine.trip_id=t.id and mine.user_id=auth.uid()
$$;

create or replace function public.rr_create_trip(p jsonb,p_self_person text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare tid uuid:=coalesce((p->>'id')::uuid,gen_random_uuid()); pid text:=coalesce(p_self_person,gen_random_uuid()::text); value jsonb; me text:=public.rr_display_name();
begin
 if auth.uid() is null then raise exception 'Entre com sua conta para criar uma viagem.';end if;
 if (select count(*) from public.trip_members where user_id=auth.uid())>=100 then raise exception 'Sua conta já tem 100 viagens. Saia de uma antes de criar outra.';end if;
 value:=jsonb_build_object('id',tid,'name',p->>'name','people',coalesce(p->'people','[]'::jsonb),'expenses',coalesce(p->'expenses','[]'::jsonb));
 if not exists(select 1 from jsonb_array_elements(value->'people') x where x->>'id'=pid) then
  value:=jsonb_set(value,'{people}',(value->'people')||jsonb_build_array(jsonb_build_object('id',pid,'name',me)));
 end if;
 value:=jsonb_set(value,'{people}',(select jsonb_agg(case when person->>'id'=pid then person||jsonb_build_object('name',me) else person end) from jsonb_array_elements(value->'people') person));
 perform public.rr_validate_ledger(value);
 insert into public.shared_trips(id,owner_id,ledger) values(tid,auth.uid(),value);
 insert into public.trip_members(trip_id,user_id,person_id,display_name) values(tid,auth.uid(),pid,me);
 return value||jsonb_build_object('id',tid,'version',1,'members',jsonb_build_array(jsonb_build_object('user_id',auth.uid(),'person_id',pid,'name',me)));
end $$;

create or replace function public.rr_save_trip(p_id uuid,p_version bigint,p jsonb) returns void language plpgsql security definer set search_path='' as $$
declare current_version bigint;
begin
 select version into current_version from public.shared_trips t where t.id=p_id for update;
 if not exists(select 1 from public.trip_members where trip_id=p_id and user_id=auth.uid()) then raise exception 'Você não participa desta viagem.';end if;
 if p_version is null or current_version<>p_version then raise exception 'A viagem foi atualizada por outra pessoa. Confira os dados e tente novamente.';end if;
 if p->>'id'<>p_id::text then raise exception 'Viagem inválida.';end if;
 perform public.rr_validate_ledger(p);
 if exists(select 1 from public.trip_members m where m.trip_id=p_id and not exists(select 1 from jsonb_array_elements(p->'people') person where person->>'id'=m.person_id)) then raise exception 'Use Sair da viagem para remover o acesso de uma pessoa.';end if;
 update public.shared_trips set ledger=jsonb_build_object('id',p_id,'name',p->>'name','people',p->'people','expenses',p->'expenses'),version=version+1,updated_at=now() where id=p_id;
end $$;

create or replace function public.rr_create_invite(p_trip uuid,p_person text default null) returns text language plpgsql security definer set search_path='' as $$
declare token text:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
begin
 perform 1 from public.shared_trips where id=p_trip for update;
 if not exists(select 1 from public.trip_members where trip_id=p_trip and user_id=auth.uid()) then raise exception 'Você não participa desta viagem.';end if;
 if p_person is not null and (not exists(select 1 from public.shared_trips t,jsonb_array_elements(t.ledger->'people') p where t.id=p_trip and p->>'id'=p_person) or exists(select 1 from public.trip_members where trip_id=p_trip and person_id=p_person)) then raise exception 'Escolha uma pessoa ainda sem acesso.';end if;
 if p_person is null and (select jsonb_array_length(ledger->'people') from public.shared_trips where id=p_trip)>=50 then raise exception 'A viagem já tem 50 participantes.';end if;
 -- One active invitation per existing participant; renewal invalidates older links.
 if p_person is not null then delete from public.trip_invitations where trip_id=p_trip and person_id=p_person and used_at is null;end if;
 insert into public.trip_invitations(token_hash,trip_id,created_by,person_id) values(encode(sha256(convert_to(token,'UTF8')),'hex'),p_trip,auth.uid(),p_person);
 return token;
end $$;

create or replace function public.rr_preview_invite(p_token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Entre para abrir o convite.';end if;
 select jsonb_build_object('name',t.ledger->>'name','inviter',m.display_name,'already_joined',exists(select 1 from public.trip_members me where me.trip_id=t.id and me.user_id=auth.uid())) into result
 from public.trip_invitations i join public.shared_trips t on t.id=i.trip_id join public.trip_members m on m.trip_id=i.trip_id and m.user_id=i.created_by
 where i.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and i.expires_at>now() and (i.used_at is null or i.used_by=auth.uid());
 if result is null then raise exception 'Este convite expirou ou já foi usado. Peça um novo link.';end if;
 return result;
end $$;

create or replace function public.rr_join_trip(p_token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare invitation public.trip_invitations; value jsonb; pid text; tid uuid;
begin
 if auth.uid() is null then raise exception 'Entre para aceitar o convite.';end if;
 select trip_id into tid from public.trip_invitations where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if tid is null then raise exception 'Este convite não está disponível.';end if;
 -- Trip lock first in every mutation: avoids join/save/leave races and lost expenses.
 select ledger into value from public.shared_trips where id=tid for update;
 select * into invitation from public.trip_invitations where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
 if invitation.token_hash is null or invitation.expires_at<=now() or (invitation.used_at is not null and invitation.used_by<>auth.uid()) or not exists(select 1 from public.trip_members where trip_id=tid and user_id=invitation.created_by) then raise exception 'Este convite expirou ou já foi usado. Peça um novo link.';end if;
 if exists(select 1 from public.trip_members where trip_id=tid and user_id=auth.uid()) then return jsonb_build_object('id',tid);end if;
 if (select count(*) from public.trip_members where user_id=auth.uid())>=100 then raise exception 'Sua conta já tem 100 viagens.';end if;
 if invitation.used_at is not null then raise exception 'Peça um novo convite para entrar novamente.';end if;
 pid:=coalesce(invitation.person_id,gen_random_uuid()::text);
 if exists(select 1 from public.trip_members where trip_id=tid and person_id=pid) then raise exception 'Essa pessoa já tem acesso.';end if;
 if invitation.person_id is null then value:=jsonb_set(value,'{people}',(value->'people')||jsonb_build_array(jsonb_build_object('id',pid,'name',public.rr_display_name())));end if;
 perform public.rr_validate_ledger(value);
 insert into public.trip_members(trip_id,user_id,person_id,display_name) values(tid,auth.uid(),pid,public.rr_display_name());
 update public.shared_trips set ledger=value,version=version+1,updated_at=now() where id=tid;
 update public.trip_invitations set used_at=now(),used_by=auth.uid() where token_hash=invitation.token_hash;
 return jsonb_build_object('id',tid);
end $$;

create or replace function public.rr_leave_trip(p_trip uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.shared_trips where id=p_trip for update;
 if not exists(select 1 from public.trip_members where trip_id=p_trip and user_id=auth.uid()) then raise exception 'Você não participa desta viagem.';end if;
 delete from public.trip_members where trip_id=p_trip and user_id=auth.uid();
 delete from public.trip_invitations where trip_id=p_trip and created_by=auth.uid() and used_at is null;
 update public.shared_trips set version=version+1,updated_at=now() where id=p_trip;
end $$;

-- Functions are not executable anonymously, including helper functions.
revoke all on function public.rr_display_name(),public.rr_validate_ledger(jsonb),public.rr_publish_recommendation(jsonb),public.rr_list_trips(),public.rr_create_trip(jsonb,text),public.rr_save_trip(uuid,bigint,jsonb),public.rr_create_invite(uuid,text),public.rr_preview_invite(text),public.rr_join_trip(text),public.rr_leave_trip(uuid) from public,anon,authenticated;
grant execute on function public.rr_publish_recommendation(jsonb),public.rr_list_trips(),public.rr_create_trip(jsonb,text),public.rr_save_trip(uuid,bigint,jsonb),public.rr_create_invite(uuid,text),public.rr_preview_invite(text),public.rr_join_trip(text),public.rr_leave_trip(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
