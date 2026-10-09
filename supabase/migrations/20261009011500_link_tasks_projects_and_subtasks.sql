alter table public.tasks
add column project_id uuid references public.projects (id) on delete set null,
add column parent_task_id uuid references public.tasks (id) on delete set null;

create index tasks_project_id_idx on public.tasks (project_id) where project_id is not null;
create index tasks_parent_task_id_idx on public.tasks (parent_task_id) where parent_task_id is not null;
grant update (project_id, parent_task_id) on table public.tasks to authenticated;

create function private.validate_task_relations()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects where id = new.project_id and space_id = new.space_id
  ) then raise exception using errcode = '23514', message = 'Task and project must share a space.'; end if;
  if new.parent_task_id is not null then
    if new.parent_task_id = new.id then raise exception using errcode = '23514', message = 'A task cannot be its own parent.'; end if;
    if not exists (select 1 from public.tasks where id = new.parent_task_id and space_id = new.space_id)
      then raise exception using errcode = '23514', message = 'Task and parent must share a space.'; end if;
    if exists (
      with recursive ancestors as (
        select id, parent_task_id from public.tasks where id = new.parent_task_id
        union all select task.id, task.parent_task_id from public.tasks task join ancestors on task.id = ancestors.parent_task_id
      ) select 1 from ancestors where id = new.id
    ) then raise exception using errcode = '23514', message = 'Task hierarchy cannot contain cycles.'; end if;
  end if;
  return new;
end;
$$;
revoke all on function private.validate_task_relations() from public, anon, authenticated;
create trigger tasks_validate_relations before insert or update of space_id, project_id, parent_task_id on public.tasks
for each row execute function private.validate_task_relations();
