create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('none', 'low', 'medium', 'high');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 5000),
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'none',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_space_status_due_date_idx
on public.tasks (space_id, status, due_date);

comment on table public.tasks is
  'Personal and shared tasks. Access is inherited from the parent space.';

alter table public.tasks enable row level security;

revoke all on table public.tasks from anon, authenticated;
grant select, insert, delete on table public.tasks to authenticated;
grant update (title, description, status, priority, due_date)
on table public.tasks to authenticated;

create function private.can_edit_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.spaces
    where id = target_space_id
      and (
        (kind = 'personal' and owner_user_id = (select auth.uid()))
        or (
          kind = 'shared'
          and private.has_space_role(
            id,
            array['admin', 'editor']::public.space_role[]
          )
        )
      )
  );
$$;

revoke all on function private.can_edit_space(uuid)
from public, anon, authenticated;
grant execute on function private.can_edit_space(uuid) to authenticated;

create policy "members can read tasks"
on public.tasks
for select
to authenticated
using (private.can_access_space(space_id));

create policy "editors can create tasks"
on public.tasks
for insert
to authenticated
with check (
  private.can_edit_space(space_id)
  and created_by = (select auth.uid())
);

create policy "editors can update tasks"
on public.tasks
for update
to authenticated
using (private.can_edit_space(space_id))
with check (private.can_edit_space(space_id));

create policy "editors can delete tasks"
on public.tasks
for delete
to authenticated
using (private.can_edit_space(space_id));

create function private.sync_task_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'done'::public.task_status then
    new.completed_at = coalesce(new.completed_at, now());
  else
    new.completed_at = null;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_task_completion()
from public, anon, authenticated;

create trigger tasks_sync_completion
before insert or update of status on public.tasks
for each row execute function private.sync_task_completion();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();
