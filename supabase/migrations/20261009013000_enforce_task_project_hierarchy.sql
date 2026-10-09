create or replace function private.validate_task_relations()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.project_id is not null and not exists (
    select 1
    from public.projects
    where id = new.project_id
      and space_id = new.space_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'Task and project must share a space.';
  end if;

  if new.parent_task_id is not null then
    if new.parent_task_id = new.id then
      raise exception using
        errcode = '23514',
        message = 'A task cannot be its own parent.';
    end if;

    if not exists (
      select 1
      from public.tasks
      where id = new.parent_task_id
        and space_id = new.space_id
    ) then
      raise exception using
        errcode = '23514',
        message = 'Task and parent must share a space.';
    end if;

    if not exists (
      select 1
      from public.tasks
      where id = new.parent_task_id
        and project_id is not distinct from new.project_id
    ) then
      raise exception using
        errcode = '23514',
        message = 'Task and parent must belong to the same project.';
    end if;

    if exists (
      with recursive ancestors as (
        select id, parent_task_id
        from public.tasks
        where id = new.parent_task_id

        union all

        select task.id, task.parent_task_id
        from public.tasks as task
        join ancestors on task.id = ancestors.parent_task_id
      )
      select 1
      from ancestors
      where id = new.id
    ) then
      raise exception using
        errcode = '23514',
        message = 'Task hierarchy cannot contain cycles.';
    end if;
  end if;

  if exists (
    select 1
    from public.tasks as child
    where child.parent_task_id = new.id
      and child.project_id is distinct from new.project_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'A parent and its children must belong to the same project.';
  end if;

  return new;
end;
$$;

comment on function private.validate_task_relations() is
  'Keeps task project, space and recursive parent relationships consistent.';
