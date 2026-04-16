-- profiles: stores public username (unique), linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"  on public.profiles for select  using (auth.uid() = id);
create policy "profiles_insert_own"  on public.profiles for insert  with check (auth.uid() = id);
create policy "profiles_update_own"  on public.profiles for update  using (auth.uid() = id);
create policy "profiles_delete_own"  on public.profiles for delete  using (auth.uid() = id);

-- Allow unauthenticated reads so we can check username uniqueness before signup
create policy "profiles_public_read_username" on public.profiles for select using (true);

-- links: stores generated platform links per user
create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  url         text not null,
  created_at  timestamp with time zone default now()
);

alter table public.links enable row level security;

create policy "links_select_own" on public.links for select using (auth.uid() = user_id);
create policy "links_insert_own" on public.links for insert with check (auth.uid() = user_id);
create policy "links_delete_own" on public.links for delete using (auth.uid() = user_id);

-- registrations: IP-based signup rate limiting (max 3 per IP)
create table if not exists public.registrations (
  ip_address  text primary key,
  count       integer not null default 0
);

alter table public.registrations enable row level security;

-- Only service role can write; no user-level policies needed (handled server-side)
create policy "registrations_no_access" on public.registrations for all using (false);

-- Trigger: auto-create profile row on user signup (uses username from metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
