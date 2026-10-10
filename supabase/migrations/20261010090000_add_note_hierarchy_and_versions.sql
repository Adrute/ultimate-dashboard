alter table public.notes
add column parent_note_id uuid references public.notes (id) on delete set null;

create index notes_parent_note_id_idx
on public.notes (parent_note_id)
where parent_note_id is not null;

grant update (parent_note_id) on table public.notes to authenticated;

create function private.validate_note_parent()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.parent_note_id is not null then
    if new.parent_note_id = new.id then
      raise exception using
        errcode = '23514',
        message = 'A note cannot be its own parent.';
    end if;

    if not exists (
      select 1
      from public.notes
      where id = new.parent_note_id
        and space_id = new.space_id
    ) then
      raise exception using
        errcode = '23514',
        message = 'A note and its parent must share a space.';
    end if;

    if exists (
      with recursive ancestors as (
        select id, parent_note_id
        from public.notes
        where id = new.parent_note_id

        union all

        select note.id, note.parent_note_id
        from public.notes as note
        join ancestors on note.id = ancestors.parent_note_id
      )
      select 1
      from ancestors
      where id = new.id
    ) then
      raise exception using
        errcode = '23514',
        message = 'Note hierarchy cannot contain cycles.';
    end if;
  end if;

  if exists (
    select 1
    from public.notes as child
    where child.parent_note_id = new.id
      and child.space_id <> new.space_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'A parent and its children must share a space.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_note_parent() from public, anon, authenticated;

create trigger notes_validate_parent
before insert or update of space_id, parent_note_id on public.notes
for each row execute function private.validate_note_parent();

create table public.note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(body) <= 50000),
  parent_note_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (note_id, version_number)
);

create index note_versions_note_version_idx
on public.note_versions (note_id, version_number desc);

comment on table public.note_versions is
  'Immutable snapshots of authorized note changes.';

alter table public.note_versions enable row level security;

revoke all on table public.note_versions from anon, authenticated;
grant select on table public.note_versions to authenticated;

create policy "members can read note versions"
on public.note_versions
for select
to authenticated
using (private.can_access_space(space_id));

create function private.capture_note_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_version integer;
begin
  if tg_op = 'UPDATE'
    and new.title is not distinct from old.title
    and new.body is not distinct from old.body
    and new.parent_note_id is not distinct from old.parent_note_id
  then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.id::text, 0)
  );

  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.note_versions
  where note_id = new.id;

  insert into public.note_versions (
    note_id,
    space_id,
    version_number,
    title,
    body,
    parent_note_id,
    created_by
  )
  values (
    new.id,
    new.space_id,
    next_version,
    new.title,
    new.body,
    new.parent_note_id,
    (select auth.uid())
  );

  return new;
end;
$$;

revoke all on function private.capture_note_version() from public, anon, authenticated;

insert into public.note_versions (
  note_id,
  space_id,
  version_number,
  title,
  body,
  parent_note_id,
  created_by,
  created_at
)
select
  id,
  space_id,
  1,
  title,
  body,
  parent_note_id,
  created_by,
  created_at
from public.notes;

create trigger notes_capture_initial_version
after insert on public.notes
for each row execute function private.capture_note_version();

create trigger notes_capture_changed_version
after update of title, body, parent_note_id on public.notes
for each row execute function private.capture_note_version();
