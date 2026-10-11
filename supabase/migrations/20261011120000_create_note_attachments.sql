insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'note-attachments',
  'note-attachments',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.notes
add constraint notes_id_space_id_unique unique (id, space_id);

create table public.attachments (
  id uuid primary key,
  space_id uuid not null references public.spaces (id) on delete restrict,
  note_id uuid not null references public.notes (id) on delete restrict,
  storage_path text not null unique,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text not null check (mime_type in (
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain'
  )),
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint attachments_note_matches_space foreign key (note_id, space_id)
    references public.notes (id, space_id) on delete restrict,
  constraint attachments_storage_path_matches_scope check (
    storage_path like space_id::text || '/' || note_id::text || '/' || id::text || '.%'
  )
);

create index attachments_note_created_idx
on public.attachments (note_id, created_at desc);

comment on table public.attachments is
  'Private metadata for files attached to notes. Binary data lives in Supabase Storage.';

alter table public.attachments enable row level security;

revoke all on table public.attachments from anon, authenticated;
grant select, insert, delete on table public.attachments to authenticated;

create policy "members can read note attachments"
on public.attachments
for select
to authenticated
using (private.can_access_space(space_id));

create policy "editors can create note attachments"
on public.attachments
for insert
to authenticated
with check (
  private.can_edit_space(space_id)
  and created_by = (select auth.uid())
  and exists (
    select 1
    from public.notes
    where notes.id = note_id
      and notes.space_id = space_id
  )
);

create policy "editors can delete note attachments"
on public.attachments
for delete
to authenticated
using (private.can_edit_space(space_id));

create policy "members can read stored note attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'note-attachments'
  and exists (
    select 1
    from public.attachments
    where attachments.storage_path = storage.objects.name
      and private.can_access_space(attachments.space_id)
  )
);

create policy "editors can upload stored note attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'note-attachments'
  and cardinality(storage.foldername(name)) = 2
  and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]+$'
  and exists (
    select 1
    from public.notes
    where notes.space_id::text = (storage.foldername(name))[1]
      and notes.id::text = (storage.foldername(name))[2]
      and private.can_edit_space(notes.space_id)
  )
);

create policy "editors can delete stored note attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'note-attachments'
  and cardinality(storage.foldername(name)) = 2
  and exists (
    select 1
    from public.notes
    where notes.space_id::text = (storage.foldername(name))[1]
      and notes.id::text = (storage.foldername(name))[2]
      and private.can_edit_space(notes.space_id)
  )
);
