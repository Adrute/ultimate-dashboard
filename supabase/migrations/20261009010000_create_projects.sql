create type public.project_status as enum ('planned', 'active', 'on_hold', 'completed');
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  description text check (description is null or char_length(description) <= 5000),
  status public.project_status not null default 'planned',
  progress smallint not null default 0 check (progress between 0 and 100),
  start_date date, due_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (start_date is null or due_date is null or start_date <= due_date)
);
create index projects_space_status_idx on public.projects (space_id, status);
create index projects_due_date_idx on public.projects (due_date) where due_date is not null;
alter table public.projects enable row level security;
revoke all on table public.projects from anon, authenticated;
grant select, insert, delete on table public.projects to authenticated;
grant update (name, description, status, progress, start_date, due_date) on table public.projects to authenticated;
create policy "members can read projects" on public.projects for select to authenticated using (private.can_access_space(space_id));
create policy "editors can create projects" on public.projects for insert to authenticated with check (private.can_edit_space(space_id) and created_by = (select auth.uid()));
create policy "editors can update projects" on public.projects for update to authenticated using (private.can_edit_space(space_id)) with check (private.can_edit_space(space_id));
create policy "editors can delete projects" on public.projects for delete to authenticated using (private.can_edit_space(space_id));
create trigger projects_set_updated_at before update on public.projects for each row execute function private.set_updated_at();
comment on table public.projects is 'Basic personal and shared projects for F2-02.';
