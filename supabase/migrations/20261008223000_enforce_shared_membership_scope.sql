create function private.enforce_shared_space_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.spaces
    where id = new.space_id
      and kind = 'shared'::public.space_kind
  ) then
    raise exception 'Memberships require a shared space.';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_shared_space_membership()
from public, anon, authenticated;

create trigger enforce_shared_space_membership_before_write
before insert or update on public.space_members
for each row execute function private.enforce_shared_space_membership();
