create table public.google_connections (
  owner_user_id uuid primary key references auth.users (id) on delete cascade,
  provider_subject text not null check (char_length(provider_subject) between 1 and 255),
  account_email text not null check (char_length(account_email) between 3 and 320),
  granted_scopes text[] not null check (cardinality(granted_scopes) between 1 and 20),
  token_ciphertext text not null check (char_length(token_ciphertext) between 32 and 32768),
  access_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.google_connections is
  'One encrypted Google OAuth connection per UltimateDashboard user.';
comment on column public.google_connections.token_ciphertext is
  'AES-256-GCM ciphertext; plaintext OAuth tokens never enter Postgres.';

alter table public.google_connections enable row level security;

revoke all on table public.google_connections from anon, authenticated;
grant select, insert, update, delete on table public.google_connections to authenticated;

create policy "users can read own Google connection"
on public.google_connections
for select
to authenticated
using (owner_user_id = (select auth.uid()));

create policy "users can create own Google connection"
on public.google_connections
for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

create policy "users can update own Google connection"
on public.google_connections
for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "users can delete own Google connection"
on public.google_connections
for delete
to authenticated
using (owner_user_id = (select auth.uid()));

create trigger google_connections_set_updated_at
before update on public.google_connections
for each row execute function private.set_updated_at();
