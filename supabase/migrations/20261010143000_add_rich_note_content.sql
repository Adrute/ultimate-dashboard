alter table public.notes
add column content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
add constraint notes_content_is_document
check (
  jsonb_typeof(content) = 'object'
  and content ->> 'type' = 'doc'
  and octet_length(content::text) <= 200000
);

alter table public.note_versions
add column content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
add constraint note_versions_content_is_document
check (
  jsonb_typeof(content) = 'object'
  and content ->> 'type' = 'doc'
  and octet_length(content::text) <= 200000
);

update public.notes
set content = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    case
      when body = '' then jsonb_build_object('type', 'paragraph')
      else jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', body)
        )
      )
    end
  )
);

update public.note_versions
set content = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    case
      when body = '' then jsonb_build_object('type', 'paragraph')
      else jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', body)
        )
      )
    end
  )
);

grant insert (content), update (content) on table public.notes to authenticated;

create or replace function private.capture_note_version()
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
    and new.content is not distinct from old.content
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
    content,
    parent_note_id,
    created_by
  )
  values (
    new.id,
    new.space_id,
    next_version,
    new.title,
    new.body,
    new.content,
    new.parent_note_id,
    (select auth.uid())
  );

  return new;
end;
$$;

revoke all on function private.capture_note_version() from public, anon, authenticated;

drop trigger notes_capture_changed_version on public.notes;

create trigger notes_capture_changed_version
after update of title, body, content, parent_note_id on public.notes
for each row execute function private.capture_note_version();
