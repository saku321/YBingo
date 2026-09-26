-- =============================================================================
-- Yearly Bingo — database schema
--
-- Run this once in the Supabase SQL editor (or "supabase db push").
-- Tables: profiles, boards, comments, likes, payments
-- Everything is protected with row level security; the browser only ever uses
-- the public anon/publishable key.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Short random ids for share links, e.g. /card/k3Jx9aQ2
create or replace function public.short_id(len int default 8)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  chars constant text := '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(len);
  result text := '';
begin
  for i in 0..len - 1 loop
    result := result || substr(chars, (get_byte(bytes, i) % char_length(chars)) + 1, 1);
  end loop;
  return result;
end;
$$;

-- 25 cells, each {"text": string <= 60 chars, "marked": boolean}
create or replace function public.valid_cells(cells jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(cells) is distinct from 'array' then false
    when jsonb_array_length(cells) <> 25 then false
    else not exists (
      select 1
      from jsonb_array_elements(cells) as c
      where jsonb_typeof(c) <> 'object'
         or coalesce(jsonb_typeof(c -> 'text'), '') <> 'string'
         or char_length(c ->> 'text') > 60
         or (c ? 'marked' and jsonb_typeof(c -> 'marked') <> 'boolean')
    )
  end;
$$;

-- Premium card colors: only known keys, only #rrggbb values.
create or replace function public.valid_colors(colors jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(colors) is distinct from 'object' then false
    else not exists (
      select 1
      from jsonb_each(colors) as kv(k, v)
      where kv.k not in ('background', 'text', 'lines', 'centerFrom', 'centerTo', 'marker')
         or coalesce(jsonb_typeof(kv.v), '') <> 'string'
         or (kv.v #>> '{}') !~ '^#[0-9a-fA-F]{6}$'
    )
  end;
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  avatar_url text check (avatar_url is null or avatar_url ~* '^https://'),
  is_premium boolean not null default false,
  premium_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boards (
  id text primary key default public.short_id(8),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null default 'My bingo card' check (char_length(title) between 1 and 80),
  year int not null check (year between 2000 and 2100),
  cells jsonb not null check (public.valid_cells(cells)),
  colors jsonb check (colors is null or public.valid_colors(colors)),
  is_public boolean not null default true,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boards_owner_idx on public.boards (owner_id, created_at desc);
create index if not exists boards_new_idx on public.boards (created_at desc) where is_public;
create index if not exists boards_top_idx on public.boards (like_count desc, created_at desc) where is_public;
create index if not exists boards_talked_idx on public.boards (comment_count desc, created_at desc) where is_public;

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  board_id text not null references public.boards (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_board_idx on public.comments (board_id, created_at);
create index if not exists comments_author_idx on public.comments (author_id);

create table if not exists public.likes (
  board_id text not null references public.boards (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create index if not exists likes_user_idx on public.likes (user_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'paypal',
  order_id text not null unique,
  capture_id text unique,
  amount numeric(10, 2) not null,
  currency text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- New auth user -> profile row (email sign-up, Google, X).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  candidate text;
  avatar text;
  tries int := 0;
begin
  base := lower(coalesce(
    nullif(meta ->> 'username', ''),
    nullif(meta ->> 'user_name', ''),
    nullif(meta ->> 'preferred_username', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    nullif(meta ->> 'name', ''),
    'player'
  ));
  base := left(regexp_replace(base, '[^a-z0-9_]', '', 'g'), 16);
  if char_length(base) < 3 then
    base := 'player';
  end if;

  candidate := base;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    tries := tries + 1;
    if tries > 25 then
      candidate := 'user_' || left(replace(new.id::text, '-', ''), 12);
      exit;
    end if;
    candidate := left(base, 15) || (floor(random() * 90000) + 10000)::int::text;
  end loop;

  avatar := coalesce(meta ->> 'avatar_url', meta ->> 'picture');
  if avatar is not null and avatar !~* '^https://' then
    avatar := null;
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(nullif(btrim(coalesce(meta ->> 'display_name', meta ->> 'full_name', meta ->> 'name', '')), ''), 40),
    avatar
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists comments_touch on public.comments;
create trigger comments_touch before update of body on public.comments
  for each row execute function public.touch_updated_at();

drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

-- Boards: free-account limit, premium-only colors, center always marked,
-- updated_at only moves when the card itself changes (not on likes/comments).
create or replace function public.boards_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  premium boolean;
begin
  select coalesce(p.is_premium, false) into premium from public.profiles p where p.id = new.owner_id;
  premium := coalesce(premium, false);

  if tg_op = 'INSERT' and not premium
     and (select count(*) from public.boards b where b.owner_id = new.owner_id) >= 10 then
    raise exception 'Free accounts can keep up to 10 cards. Delete one or go Premium for unlimited cards.'
      using errcode = 'P0001';
  end if;

  if new.colors is not null and not premium
     and (tg_op = 'INSERT' or new.colors is distinct from old.colors) then
    raise exception 'Custom colors are a Premium feature.' using errcode = 'P0001';
  end if;

  new.cells := jsonb_set(new.cells, '{12,marked}', 'true'::jsonb);

  if tg_op = 'UPDATE' then
    if (new.title, new.year, new.cells, new.colors, new.is_public)
       is distinct from (old.title, old.year, old.cells, old.colors, old.is_public) then
      new.updated_at := now();
    else
      new.updated_at := old.updated_at;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists boards_guard on public.boards;
create trigger boards_guard before insert or update on public.boards
  for each row execute function public.boards_guard();

-- Denormalised like/comment counters so the feed can sort by them.
create or replace function public.bump_board_counter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'likes' then
    if tg_op = 'INSERT' then
      update public.boards set like_count = like_count + 1 where id = new.board_id;
    else
      update public.boards set like_count = greatest(like_count - 1, 0) where id = old.board_id;
    end if;
  else
    if tg_op = 'INSERT' then
      update public.boards set comment_count = comment_count + 1 where id = new.board_id;
    else
      update public.boards set comment_count = greatest(comment_count - 1, 0) where id = old.board_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count on public.likes;
create trigger likes_count after insert or delete on public.likes
  for each row execute function public.bump_board_counter();

drop trigger if exists comments_count on public.comments;
create trigger comments_count after insert or delete on public.comments
  for each row execute function public.bump_board_counter();

-- -----------------------------------------------------------------------------
-- Popular squares across public cards (used by the idea chips)
-- -----------------------------------------------------------------------------
create or replace function public.popular_ideas(max_results int default 24)
returns table (idea text, uses bigint)
language sql
stable
set search_path = ''
as $$
  select min(btrim(e.c ->> 'text')) as idea, count(distinct b.owner_id) as uses
  from public.boards b
  cross join lateral jsonb_array_elements(b.cells) with ordinality as e (c, idx)
  where b.is_public
    and e.idx <> 13
    and char_length(btrim(e.c ->> 'text')) between 3 and 60
  group by lower(btrim(e.c ->> 'text'))
  having count(distinct b.owner_id) >= 2
  order by uses desc, max(b.created_at) desc
  limit least(greatest(max_results, 1), 50);
$$;

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.payments enable row level security;

-- profiles
drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles
  for select using (true);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- boards
drop policy if exists "Public boards and your own boards are visible" on public.boards;
create policy "Public boards and your own boards are visible" on public.boards
  for select using (is_public or owner_id = (select auth.uid()));

drop policy if exists "Users create their own boards" on public.boards;
create policy "Users create their own boards" on public.boards
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners update their boards" on public.boards;
create policy "Owners update their boards" on public.boards
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners delete their boards" on public.boards;
create policy "Owners delete their boards" on public.boards
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- comments (a board you can see = a board you can comment on)
drop policy if exists "Comments on visible boards are readable" on public.comments;
create policy "Comments on visible boards are readable" on public.comments
  for select using (exists (select 1 from public.boards b where b.id = board_id));

drop policy if exists "Signed-in users comment on visible boards" on public.comments;
create policy "Signed-in users comment on visible boards" on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (select 1 from public.boards b where b.id = board_id)
  );

drop policy if exists "Authors edit their comments" on public.comments;
create policy "Authors edit their comments" on public.comments
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "Authors and card owners delete comments" on public.comments;
create policy "Authors and card owners delete comments" on public.comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (select 1 from public.boards b where b.id = board_id and b.owner_id = (select auth.uid()))
  );

-- likes
drop policy if exists "Likes on visible boards are readable" on public.likes;
create policy "Likes on visible boards are readable" on public.likes
  for select using (exists (select 1 from public.boards b where b.id = board_id));

drop policy if exists "Users like visible boards" on public.likes;
create policy "Users like visible boards" on public.likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.boards b where b.id = board_id)
  );

drop policy if exists "Users remove their likes" on public.likes;
create policy "Users remove their likes" on public.likes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- payments: read your own receipts; only the PayPal edge function writes.
drop policy if exists "Users see their own payments" on public.payments;
create policy "Users see their own payments" on public.payments
  for select to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Column-level privileges: clients may only write the columns they own.
-- (is_premium, counters, owner ids and timestamps are server-controlled.)
-- -----------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.boards from anon, authenticated;
grant insert (title, year, cells, colors, is_public) on public.boards to authenticated;
grant update (title, year, cells, colors, is_public) on public.boards to authenticated;
grant delete on public.boards to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.comments from anon, authenticated;
grant insert (board_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.likes from anon, authenticated;
grant insert (board_id) on public.likes to authenticated;
grant delete on public.likes to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.payments from anon, authenticated;

grant select on public.profiles, public.boards, public.comments, public.likes to anon, authenticated;
grant select on public.payments to authenticated;

-- Trigger functions are not meant to be called over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.boards_guard() from public, anon, authenticated;
revoke execute on function public.bump_board_counter() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
grant execute on function public.popular_ideas(int) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Realtime: live comments and live daubing on the card page
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
    ) then
      alter publication supabase_realtime add table public.comments;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'boards'
    ) then
      alter publication supabase_realtime add table public.boards;
    end if;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Backfill profiles for any users that signed up before this migration.
-- -----------------------------------------------------------------------------
insert into public.profiles (id, username, avatar_url)
select
  u.id,
  'user_' || left(replace(u.id::text, '-', ''), 12),
  case when coalesce(u.raw_user_meta_data ->> 'avatar_url', '') ~* '^https://'
       then u.raw_user_meta_data ->> 'avatar_url' end
from auth.users u
on conflict (id) do nothing;
