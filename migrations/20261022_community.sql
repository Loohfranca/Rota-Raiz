-- Aplicar pelo administrador do Supabase. Nenhuma chave privada vai para o app.
-- Aprovações são feitas no painel SQL/Table Editor, por uma pessoa responsável.
create table if not exists public.community_recommendations (
  id uuid primary key,
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null check (category in ('Comida','Praia','Passeio','Hospedagem','Outros')),
  city text not null check (length(trim(city)) between 1 and 120),
  address text not null check (length(trim(address)) between 1 and 300),
  instagram text not null default '' check (instagram = '' or instagram ~ '^https://www\.instagram\.com/[a-zA-Z0-9._]{1,30}/$'),
  note text not null check (length(trim(note)) between 1 and 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (status <> 'approved' or reviewed_at is not null)
);
alter table public.community_recommendations enable row level security;
revoke all on public.community_recommendations from anon, authenticated;
grant select on public.community_recommendations to anon, authenticated;
grant insert (id,name,category,city,address,instagram,note,status) on public.community_recommendations to anon, authenticated;
create policy "Read approved recommendations" on public.community_recommendations for select to anon, authenticated using (status='approved');
create policy "Suggest pending recommendation" on public.community_recommendations for insert to anon, authenticated with check (status='pending' and reviewed_at is null);
-- Sem UPDATE/DELETE público: o cliente não pode aprovar nem alterar a revisão.
-- Antes de abrir submissões em escala: endpoint com rate limit/CAPTCHA.
