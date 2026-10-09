create table public.notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null default '' check (char_length(body) <= 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_space_updated_at_idx
on public.notes (space_id, updated_at desc);

comment on table public.notes is
  'Plain-text notes for the F2-01 basic notes vertical.';

alter table public.notes enable row level security;

revoke all on table public.notes from anon, authenticated;
grant select, insert, delete on table public.notes to authenticated;
grant update (title, body) on table public.notes to authenticated;

create policy "members can read notes"
on public.notes
for select
to authenticated
using (private.can_access_space(space_id));

create policy "editors can create notes"
on public.notes
for insert
to authenticated
with check (
  private.can_edit_space(space_id)
  and created_by = (select auth.uid())
);

create policy "editors can update notes"
on public.notes
for update
to authenticated
using (private.can_edit_space(space_id))
with check (private.can_edit_space(space_id));

create policy "editors can delete notes"
on public.notes
for delete
to authenticated
using (private.can_edit_space(space_id));

create trigger notes_set_updated_at
before update on public.notes
for each row execute function private.set_updated_at();
