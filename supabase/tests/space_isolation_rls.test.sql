begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

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
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'first-admin@example.com',
    '',
    now(),
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'second-admin@example.com',
    '',
    now(),
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'first-editor@example.com',
    '',
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values (
      'a0000000-0000-0000-0000-000000000001',
      'First shared space',
      'shared',
      '10000000-0000-0000-0000-000000000001'
    )$$,
  'the first admin can create the first shared space'
);

select lives_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values (
      'a0000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000003',
      'editor'
    )$$,
  'the first admin can add an editor to their space'
);

select lives_ok(
  $$insert into public.space_modules (space_id, module_key)
    values ('a0000000-0000-0000-0000-000000000001', 'tasks')$$,
  'the first admin can activate a module in their space'
);

select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000002',
  true
);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values (
      'b0000000-0000-0000-0000-000000000002',
      'Second shared space',
      'shared',
      '20000000-0000-0000-0000-000000000002'
    )$$,
  'the second admin can create the second shared space'
);

select lives_ok(
  $$insert into public.space_modules (space_id, module_key)
    values ('b0000000-0000-0000-0000-000000000002', 'notes')$$,
  'the second admin can activate a module in their space'
);

select is(
  (select count(*) from public.spaces),
  2::bigint,
  'the second admin sees only their personal and shared spaces'
);

select is_empty(
  $$select id from public.spaces
    where id = 'a0000000-0000-0000-0000-000000000001'$$,
  'the second admin cannot read the first shared space'
);

select is_empty(
  $$select module_key from public.space_modules
    where space_id = 'a0000000-0000-0000-0000-000000000001'$$,
  'the second admin cannot read modules from the first shared space'
);

select is_empty(
  $$update public.spaces set name = 'Cross-space rename'
    where id = 'a0000000-0000-0000-0000-000000000001'
    returning id$$,
  'the second admin cannot rename the first shared space'
);

select throws_ok(
  $$insert into public.space_modules (space_id, module_key)
    values ('a0000000-0000-0000-0000-000000000001', 'notes')$$,
  '42501',
  null,
  'the second admin cannot add modules to the first shared space'
);

select throws_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values (
      'a0000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000002',
      'viewer'
    )$$,
  '42501',
  null,
  'the second admin cannot add memberships to the first shared space'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select is(
  (select count(*) from public.spaces),
  2::bigint,
  'the first admin sees only their personal and shared spaces'
);

select is_empty(
  $$select id from public.spaces
    where id = 'b0000000-0000-0000-0000-000000000002'$$,
  'the first admin cannot read the second shared space'
);

select is_empty(
  $$select user_id from public.space_members
    where space_id = 'b0000000-0000-0000-0000-000000000002'$$,
  'the first admin cannot read memberships from the second shared space'
);

select is_empty(
  $$delete from public.space_modules
    where space_id = 'b0000000-0000-0000-0000-000000000002'
    returning module_key$$,
  'the first admin cannot delete modules from the second shared space'
);

select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000003',
  true
);

select results_eq(
  $$select id from public.spaces
    where id = 'a0000000-0000-0000-0000-000000000001'$$,
  array['a0000000-0000-0000-0000-000000000001'::uuid],
  'the editor can read their assigned shared space'
);

select is_empty(
  $$select id from public.spaces
    where id = 'b0000000-0000-0000-0000-000000000002'$$,
  'the editor cannot read an unassigned shared space'
);

select is_empty(
  $$select module_key from public.space_modules
    where space_id = 'b0000000-0000-0000-0000-000000000002'$$,
  'the editor cannot read modules from an unassigned shared space'
);

select * from finish();

rollback;
