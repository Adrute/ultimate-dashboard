begin;

create extension if not exists pgtap with schema extensions;

select plan(35);

select has_table('public', 'spaces', 'spaces table exists');
select has_table('public', 'space_members', 'space_members table exists');
select has_table('public', 'space_modules', 'space_modules table exists');

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  created_at,
  updated_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',
    '',
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'editor@example.com',
    '',
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'viewer@example.com',
    '',
    now(),
    now()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'outsider@example.com',
    '',
    now(),
    now()
  );

select is(
  (
    select count(*)
    from public.spaces
    where kind = 'personal'
      and owner_user_id in (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'dddddddd-dddd-dddd-dddd-dddddddddddd'
      )
  ),
  4::bigint,
  'signup creates exactly one personal space per user'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true
);

select is(
  (select count(*) from public.spaces),
  1::bigint,
  'a user initially reads only their personal space'
);

select is_empty(
  $$select id from public.spaces where owner_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  'a user cannot read another personal space'
);

select throws_ok(
  $$insert into public.spaces (name, kind, owner_user_id, created_by)
    values (
      'Forbidden personal',
      'personal',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )$$,
  '42501',
  null,
  'users cannot create personal spaces directly'
);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values (
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'Equipo',
      'shared',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )$$,
  'an authenticated user can create a shared space'
);

select results_eq(
  $$select role from public.space_members
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
      and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  array['admin'::public.space_role],
  'the shared-space creator becomes an admin'
);

select lives_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values
      (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'editor'
      ),
      (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'viewer'
      )$$,
  'an admin can add editor and viewer memberships'
);

select throws_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values (
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'admin'
    )$$,
  '42501',
  null,
  'an admin cannot promote another admin without an explicit flow'
);

select throws_ok(
  $$insert into public.space_members (space_id, user_id, role)
    select
      id,
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'viewer'
    from public.spaces
    where owner_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'P0001',
  'Memberships require a shared space.',
  'memberships cannot be added to personal spaces'
);

select results_eq(
  $$update public.spaces set name = 'Equipo actualizado'
    where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
    returning name$$,
  array['Equipo actualizado'::text],
  'an admin can rename a shared space'
);

select throws_ok(
  $$update public.spaces set kind = 'personal'
    where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  '42501',
  null,
  'users cannot change a space authorization kind'
);

select lives_ok(
  $$insert into public.space_modules (space_id, module_key)
    values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'tasks')$$,
  'an admin can activate a module in a shared space'
);

select throws_ok(
  $$insert into public.space_modules (space_id, module_key)
    values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'health')$$,
  'P0001',
  'Health cannot be enabled in a shared space.',
  'health cannot be activated in a shared space'
);

select lives_ok(
  $$insert into public.space_modules (space_id, module_key)
    select id, 'health'
    from public.spaces
    where owner_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'health can be activated in its owner personal space'
);

select set_config(
  'request.jwt.claim.sub',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  true
);

select results_eq(
  $$select name from public.spaces where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  array['Equipo actualizado'::text],
  'an editor can read their shared space'
);

select is(
  (
    select count(*)
    from public.space_members
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
  ),
  3::bigint,
  'an editor can read memberships in their shared space'
);

select results_eq(
  $$select module_key from public.space_modules
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  array['tasks'::public.space_module_key],
  'an editor can read modules in their shared space'
);

select is_empty(
  $$select module_key from public.space_modules where module_key = 'health'$$,
  'a shared-space member cannot read the admin personal health module'
);

select is_empty(
  $$update public.spaces set name = 'Forbidden editor rename'
    where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
    returning id$$,
  'an editor cannot rename a shared space'
);

select throws_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values (
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'viewer'
    )$$,
  '42501',
  null,
  'an editor cannot add members'
);

select throws_ok(
  $$insert into public.space_modules (space_id, module_key)
    values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'notes')$$,
  '42501',
  null,
  'an editor cannot manage modules'
);

select set_config(
  'request.jwt.claim.sub',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  true
);

select results_eq(
  $$select id from public.spaces where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  array['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid],
  'a viewer can read their shared space'
);

select is_empty(
  $$update public.space_modules set enabled = false
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
    returning module_key$$,
  'a viewer cannot update modules'
);

select set_config(
  'request.jwt.claim.sub',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  true
);

select is_empty(
  $$select id from public.spaces where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  'an outsider cannot read a shared space'
);

select is_empty(
  $$select module_key from public.space_modules
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  'an outsider cannot read shared-space modules'
);

select set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true
);

select results_eq(
  $$update public.space_members set role = 'viewer'
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
      and user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    returning role$$,
  array['viewer'::public.space_role],
  'an admin can change a non-admin member role'
);

select is_empty(
  $$update public.space_members set role = 'viewer'
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
      and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning user_id$$,
  'an admin cannot demote an administrator without an explicit flow'
);

select throws_ok(
  $$delete from public.space_members
    where space_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
      and user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  '42501',
  null,
  'member removal is unavailable until its explicit flow is defined'
);

select throws_ok(
  $$delete from public.spaces where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  '42501',
  null,
  'space deletion is unavailable until its explicit flow is defined'
);

reset role;
set local role anon;

select throws_ok(
  $$select id from public.spaces$$,
  '42501',
  null,
  'anonymous users cannot read spaces'
);

select throws_ok(
  $$select space_id from public.space_members$$,
  '42501',
  null,
  'anonymous users cannot read memberships'
);

select throws_ok(
  $$select space_id from public.space_modules$$,
  '42501',
  null,
  'anonymous users cannot read module activation'
);

select * from finish();

rollback;
