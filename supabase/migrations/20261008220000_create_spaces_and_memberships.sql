create type public.space_kind as enum ('personal', 'shared');
create type public.space_role as enum ('admin', 'editor', 'viewer');
create type public.space_module_key as enum (
  'dashboard',
  'calendar',
  'tasks',
  'notes',
  'health',
  'fitness',
  'entertainment',
  'shopping',
  'habits',
  'renewals',
  'projects',
  'recipes'
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  kind public.space_kind not null,
  owner_user_id uuid null references auth.users (id) on delete cascade,
  created_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spaces_owner_matches_kind check (
    (kind = 'personal' and owner_user_id is not null)
    or (kind = 'shared' and owner_user_id is null)
  )
);

create unique index spaces_one_personal_per_user
on public.spaces (owner_user_id)
where kind = 'personal';

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.space_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create index space_members_user_id_idx on public.space_members (user_id);

create table public.space_modules (
  space_id uuid not null references public.spaces (id) on delete cascade,
  module_key public.space_module_key not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (space_id, module_key)
);

comment on table public.spaces is
  'Personal and shared authorization boundaries. Personal ownership is immutable.';
comment on table public.space_members is
  'Membership and role assignments for shared spaces only.';
comment on table public.space_modules is
  'Module activation per space. Health is restricted to personal spaces.';

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_modules enable row level security;

revoke all on table public.spaces from anon, authenticated;
revoke all on table public.space_members from anon, authenticated;
revoke all on table public.space_modules from anon, authenticated;

grant select, insert on table public.spaces to authenticated;
grant update (name) on table public.spaces to authenticated;

grant select, insert on table public.space_members to authenticated;
grant update (role) on table public.space_members to authenticated;

grant select, insert, delete on table public.space_modules to authenticated;
grant update (enabled) on table public.space_modules to authenticated;

create function private.is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members
    where space_id = target_space_id
      and user_id = (select auth.uid())
  );
$$;

create function private.has_space_role(
  target_space_id uuid,
  allowed_roles public.space_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members
    where space_id = target_space_id
      and user_id = (select auth.uid())
      and role = any(allowed_roles)
  );
$$;

create function private.can_manage_space(target_space_id uuid)
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
            target_space_id,
            array['admin'::public.space_role]
          )
        )
      )
  );
$$;

revoke all on function private.is_space_member(uuid) from public, anon, authenticated;
revoke all on function private.has_space_role(uuid, public.space_role[]) from public, anon, authenticated;
revoke all on function private.can_manage_space(uuid) from public, anon, authenticated;

grant execute on function private.is_space_member(uuid) to authenticated;
grant execute on function private.has_space_role(uuid, public.space_role[]) to authenticated;
grant execute on function private.can_manage_space(uuid) to authenticated;

create policy "users can read accessible spaces"
on public.spaces
for select
to authenticated
using (
  (kind = 'personal' and owner_user_id = (select auth.uid()))
  or (kind = 'shared' and private.is_space_member(id))
);

create policy "users can create shared spaces"
on public.spaces
for insert
to authenticated
with check (
  kind = 'shared'
  and owner_user_id is null
  and created_by = (select auth.uid())
);

create policy "owners and admins can rename spaces"
on public.spaces
for update
to authenticated
using (private.can_manage_space(id))
with check (private.can_manage_space(id));

create policy "members can read memberships in their spaces"
on public.space_members
for select
to authenticated
using (private.is_space_member(space_id));

create policy "admins can add non-admin members"
on public.space_members
for insert
to authenticated
with check (
  private.has_space_role(space_id, array['admin'::public.space_role])
  and role in ('editor'::public.space_role, 'viewer'::public.space_role)
  and exists (
    select 1
    from public.spaces
    where id = space_id and kind = 'shared'
  )
);

create policy "admins can change non-admin member roles"
on public.space_members
for update
to authenticated
using (
  role in ('editor'::public.space_role, 'viewer'::public.space_role)
  and private.has_space_role(space_id, array['admin'::public.space_role])
)
with check (
  role in ('editor'::public.space_role, 'viewer'::public.space_role)
  and private.has_space_role(space_id, array['admin'::public.space_role])
);

create policy "members can read modules in their spaces"
on public.space_modules
for select
to authenticated
using (
  exists (
    select 1
    from public.spaces
    where id = space_id
      and (
        (kind = 'personal' and owner_user_id = (select auth.uid()))
        or (kind = 'shared' and private.is_space_member(id))
      )
  )
);

create policy "owners and admins can add modules"
on public.space_modules
for insert
to authenticated
with check (private.can_manage_space(space_id));

create policy "owners and admins can update modules"
on public.space_modules
for update
to authenticated
using (private.can_manage_space(space_id))
with check (private.can_manage_space(space_id));

create policy "owners and admins can remove modules"
on public.space_modules
for delete
to authenticated
using (private.can_manage_space(space_id));

create function private.add_shared_space_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'shared' then
    if new.created_by is null then
      raise exception 'A shared space requires a creator.';
    end if;

    insert into public.space_members (space_id, user_id, role)
    values (new.id, new.created_by, 'admin'::public.space_role);
  end if;

  return new;
end;
$$;

create function private.enforce_space_module_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_kind public.space_kind;
begin
  select kind into target_kind
  from public.spaces
  where id = new.space_id;

  if target_kind is null then
    raise exception 'The target space does not exist.';
  end if;

  if new.module_key = 'health'::public.space_module_key
    and target_kind = 'shared'::public.space_kind then
    raise exception 'Health cannot be enabled in a shared space.';
  end if;

  return new;
end;
$$;

revoke all on function private.add_shared_space_creator() from public, anon, authenticated;
revoke all on function private.enforce_space_module_scope() from public, anon, authenticated;

create trigger spaces_set_updated_at
before update on public.spaces
for each row execute function private.set_updated_at();

create trigger add_shared_space_creator_after_insert
after insert on public.spaces
for each row execute function private.add_shared_space_creator();

create trigger space_members_set_updated_at
before update on public.space_members
for each row execute function private.set_updated_at();

create trigger space_modules_set_updated_at
before update on public.space_modules
for each row execute function private.set_updated_at();

create trigger enforce_space_module_scope_before_write
before insert or update on public.space_modules
for each row execute function private.enforce_space_module_scope();

insert into public.spaces (name, kind, owner_user_id, created_by)
select 'Mi espacio', 'personal', profiles.id, profiles.id
from public.profiles
on conflict (owner_user_id) where kind = 'personal' do nothing;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  );

  insert into public.spaces (name, kind, owner_user_id, created_by)
  values (
    'Mi espacio',
    'personal'::public.space_kind,
    new.id,
    new.id
  );

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
