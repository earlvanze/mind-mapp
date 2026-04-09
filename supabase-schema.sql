-- Mind Mapp: Projects table + RLS
-- Run this in Supabase SQL Editor

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists projects_user_id_idx on public.projects(user_id);

-- Realtime collaboration: change log for broadcast sync
create table if not exists public.project_changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  operation text not null, -- 'UPSERT' | 'DELETE' | 'EDGE_UPSERT' | 'EDGE_DELETE'
  payload jsonb not null,  -- { node } for UPSERT/DELETE, { fromId, toId } for edges
  client_nanoid text not null, -- unique per-device client ID to skip own echoed changes
  created_at timestamptz default now()
);

alter table public.project_changes enable row level security;

create policy "Authenticated users can read project_changes for their projects"
  on public.project_changes
  for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert own project_changes"
  on public.project_changes
  for insert
  with check (auth.uid() = user_id);

create index if not exists project_changes_project_id_idx on public.project_changes(project_id);
create index if not exists project_changes_created_at_idx on public.project_changes(created_at);
