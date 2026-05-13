
-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Notebooks table — stores full notebook payload as jsonb for flexibility
create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  name text not null default 'Untitled Grimoire',
  theme text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index notebooks_user_id_idx on public.notebooks(user_id);

alter table public.notebooks enable row level security;

create policy "Users can view own notebooks"
  on public.notebooks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own notebooks"
  on public.notebooks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own notebooks"
  on public.notebooks for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own notebooks"
  on public.notebooks for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger notebooks_set_updated_at
  before update on public.notebooks
  for each row execute function public.set_updated_at();
