create type public.dashboard_widget_size as enum ('small', 'medium', 'large');

create table public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, name)
);

create unique index dashboard_layouts_one_default_per_user
on public.dashboard_layouts (owner_user_id)
where is_default;

create table public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.dashboard_layouts (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  widget_type text not null default 'placeholder'
    check (widget_type = 'placeholder'),
  title text not null check (char_length(btrim(title)) between 1 and 60),
  size public.dashboard_widget_size not null default 'medium',
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_widgets_layout_position_unique
    unique (layout_id, position)
    deferrable initially immediate
);

create index dashboard_widgets_space_id_idx
on public.dashboard_widgets (space_id);

comment on table public.dashboard_layouts is
  'User-owned dashboard views. F0-06 creates one default view per user.';
comment on table public.dashboard_widgets is
  'User-owned widget configuration. Referenced space data remains protected by its own RLS.';

alter table public.dashboard_layouts enable row level security;
alter table public.dashboard_widgets enable row level security;

revoke all on table public.dashboard_layouts from anon, authenticated;
revoke all on table public.dashboard_widgets from anon, authenticated;

grant select on table public.dashboard_layouts to authenticated;
grant select, insert, delete on table public.dashboard_widgets to authenticated;
grant update (title, size, position) on table public.dashboard_widgets to authenticated;

create function private.owns_dashboard_layout(target_layout_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dashboard_layouts
    where id = target_layout_id
      and owner_user_id = (select auth.uid())
  );
$$;

create function private.can_access_space(target_space_id uuid)
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
        or (kind = 'shared' and private.is_space_member(id))
      )
  );
$$;

revoke all on function private.owns_dashboard_layout(uuid)
from public, anon, authenticated;
revoke all on function private.can_access_space(uuid)
from public, anon, authenticated;

grant execute on function private.owns_dashboard_layout(uuid) to authenticated;
grant execute on function private.can_access_space(uuid) to authenticated;

create policy "users can read their dashboard layouts"
on public.dashboard_layouts
for select
to authenticated
using (owner_user_id = (select auth.uid()));

create policy "users can read their dashboard widgets"
on public.dashboard_widgets
for select
to authenticated
using (private.owns_dashboard_layout(layout_id));

create policy "users can add accessible dashboard widgets"
on public.dashboard_widgets
for insert
to authenticated
with check (
  private.owns_dashboard_layout(layout_id)
  and private.can_access_space(space_id)
);

create policy "users can update their dashboard widgets"
on public.dashboard_widgets
for update
to authenticated
using (private.owns_dashboard_layout(layout_id))
with check (
  private.owns_dashboard_layout(layout_id)
  and private.can_access_space(space_id)
);

create policy "users can delete their dashboard widgets"
on public.dashboard_widgets
for delete
to authenticated
using (private.owns_dashboard_layout(layout_id));

create function public.move_dashboard_widget(
  target_widget_id uuid,
  move_direction text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_layout_id uuid;
  current_position integer;
  neighbor_id uuid;
  neighbor_position integer;
begin
  if move_direction not in ('up', 'down') then
    raise exception using
      errcode = '22023',
      message = 'Dashboard widget direction must be up or down.';
  end if;

  select layout_id, position
  into current_layout_id, current_position
  from public.dashboard_widgets
  where id = target_widget_id;

  if not found then
    return false;
  end if;

  if move_direction = 'up' then
    select id, position
    into neighbor_id, neighbor_position
    from public.dashboard_widgets
    where layout_id = current_layout_id
      and position < current_position
    order by position desc
    limit 1;
  else
    select id, position
    into neighbor_id, neighbor_position
    from public.dashboard_widgets
    where layout_id = current_layout_id
      and position > current_position
    order by position asc
    limit 1;
  end if;

  if neighbor_id is null then
    return false;
  end if;

  set constraints dashboard_widgets_layout_position_unique deferred;

  update public.dashboard_widgets
  set position = case
    when id = target_widget_id then neighbor_position
    else current_position
  end
  where id in (target_widget_id, neighbor_id);

  return true;
end;
$$;

revoke all on function public.move_dashboard_widget(uuid, text)
from public, anon, authenticated;
grant execute on function public.move_dashboard_widget(uuid, text)
to authenticated;

create trigger dashboard_layouts_set_updated_at
before update on public.dashboard_layouts
for each row execute function private.set_updated_at();

create trigger dashboard_widgets_set_updated_at
before update on public.dashboard_widgets
for each row execute function private.set_updated_at();

insert into public.dashboard_layouts (owner_user_id, name, is_default)
select profiles.id, 'Principal', true
from public.profiles
on conflict (owner_user_id, name) do nothing;

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

  insert into public.dashboard_layouts (owner_user_id, name, is_default)
  values (new.id, 'Principal', true);

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
