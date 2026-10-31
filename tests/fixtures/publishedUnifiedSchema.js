import {PGlite} from "@electric-sql/pglite";
export async function fixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable
      as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function public.rr_display_name() returns text language sql stable
      as $$ select 'Pessoa de teste'::text $$;
    create schema storage;
    create table storage.objects(
      id uuid primary key default gen_random_uuid(), bucket_id text not null,
      name text not null, owner uuid, owner_id text, is_delete_marker boolean default false
    );
    create table public.community_recommendations(
      id uuid primary key, name text not null, category text not null, city text not null,
      address text not null, instagram text not null default '', note text not null,
      status text not null default 'pending', created_at timestamptz not null default now(),
      reviewed_at timestamptz, user_id uuid references auth.users(id),
      author_name text not null default 'Viajante', image_url text, editorial boolean not null default false
    );
    create table public.rr_profile_cities(
      id uuid primary key, user_id uuid not null references auth.users(id),
      city text not null, state text not null default '', place_name text not null default '',
      created_at timestamptz not null default now()
    );
    create table public.community_likes(
      recommendation_id uuid not null references public.community_recommendations(id),
      user_id uuid not null references auth.users(id), created_at timestamptz default now(),
      primary key(recommendation_id,user_id)
    );
    create table public.community_comments(
      id uuid primary key, recommendation_id uuid not null references public.community_recommendations(id),
      user_id uuid not null references auth.users(id), author_name text not null,
      body text not null, created_at timestamptz default now()
    );
    alter table public.community_recommendations enable row level security;
    alter table public.community_comments enable row level security;
    create policy rr_community_read on public.community_recommendations
      for select to authenticated using(status='approved');
    create policy community_comments_read on public.community_comments
      for select to authenticated using(true);
  `);
  await db.exec("grant usage on schema auth to authenticated,anon");
  return db;
}
