begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

select has_table('public', 'dashboard_layouts', 'dashboard_layouts table exists');
select has_table('public', 'dashboard_widgets', 'dashboard_widgets table exists');

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
    '41000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dashboard-owner@example.com',
    '',
    now(),
    now()
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dashboard-other@example.com',
    '',
    now(),
    now()
  );

select is(
  (
    select count(*)
    from public.dashboard_layouts
    where owner_user_id in (
      '41000000-0000-4000-8000-000000000001',
      '42000000-0000-4000-8000-000000000002'
    )
      and is_default
  ),
  2::bigint,
  'signup creates one default dashboard layout per user'
);

select set_config(
  'test.owner_layout_id',
  (
    select id::text
    from public.dashboard_layouts
    where owner_user_id = '41000000-0000-4000-8000-000000000001'
  ),
  true
);
select set_config(
  'test.other_layout_id',
  (
    select id::text
    from public.dashboard_layouts
    where owner_user_id = '42000000-0000-4000-8000-000000000002'
  ),
  true
);
select set_config(
  'test.owner_space_id',
  (
    select id::text
    from public.spaces
    where owner_user_id = '41000000-0000-4000-8000-000000000001'
  ),
  true
);
select set_config(
  'test.other_space_id',
  (
    select id::text
    from public.spaces
    where owner_user_id = '42000000-0000-4000-8000-000000000002'
  ),
  true
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '41000000-0000-4000-8000-000000000001',
  true
);

select is(
  (select count(*) from public.dashboard_layouts),
  1::bigint,
  'a user reads only their dashboard layout'
);

select is_empty(
  $$select id from public.dashboard_layouts
    where id = current_setting('test.other_layout_id')::uuid$$,
  'a user cannot read another dashboard layout'
);

select throws_ok(
  $$insert into public.dashboard_layouts (owner_user_id, name, is_default)
    values (
      '41000000-0000-4000-8000-000000000001',
      'Forbidden',
      false
    )$$,
  '42501',
  null,
  'users cannot create dashboard layouts directly'
);

select lives_ok(
  $$insert into public.dashboard_widgets (
      id, layout_id, space_id, title, size, position
    ) values (
      '51000000-0000-4000-8000-000000000001',
      current_setting('test.owner_layout_id')::uuid,
      current_setting('test.owner_space_id')::uuid,
      'First widget',
      'small',
      0
    )$$,
  'a user can add a widget to their layout for an accessible space'
);

select results_eq(
  $$select title from public.dashboard_widgets order by position$$,
  array['First widget'::text],
  'a user can read their widget configuration'
);

select results_eq(
  $$update public.dashboard_widgets set size = 'large'
    where id = '51000000-0000-4000-8000-000000000001'
    returning size$$,
  array['large'::public.dashboard_widget_size],
  'a user can resize their widget'
);

select throws_ok(
  $$update public.dashboard_widgets
    set layout_id = current_setting('test.other_layout_id')::uuid
    where id = '51000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'users cannot move widgets between layouts by changing technical columns'
);

select throws_ok(
  $$insert into public.dashboard_widgets (
      layout_id, space_id, title, position
    ) values (
      current_setting('test.other_layout_id')::uuid,
      current_setting('test.owner_space_id')::uuid,
      'Foreign layout',
      0
    )$$,
  '42501',
  null,
  'a user cannot add widgets to another layout'
);

select throws_ok(
  $$insert into public.dashboard_widgets (
      layout_id, space_id, title, position
    ) values (
      current_setting('test.owner_layout_id')::uuid,
      current_setting('test.other_space_id')::uuid,
      'Foreign personal space',
      1
    )$$,
  '42501',
  null,
  'a user cannot add widgets for an inaccessible personal space'
);

select lives_ok(
  $$insert into public.dashboard_widgets (
      id, layout_id, space_id, title, size, position
    ) values (
      '52000000-0000-4000-8000-000000000002',
      current_setting('test.owner_layout_id')::uuid,
      current_setting('test.owner_space_id')::uuid,
      'Second widget',
      'medium',
      1
    )$$,
  'a user can add a second ordered widget'
);

select results_eq(
  $$select public.move_dashboard_widget(
    '51000000-0000-4000-8000-000000000001',
    'down'
  )$$,
  array[true],
  'the move function reorders an owned widget'
);

select results_eq(
  $$select title from public.dashboard_widgets order by position$$,
  array['Second widget'::text, 'First widget'::text],
  'widget order persists after an atomic move'
);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values (
      '61000000-0000-4000-8000-000000000001',
      'Shared dashboard source',
      'shared',
      '41000000-0000-4000-8000-000000000001'
    )$$,
  'the owner can create a shared source space'
);

select lives_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values (
      '61000000-0000-4000-8000-000000000001',
      '42000000-0000-4000-8000-000000000002',
      'viewer'
    )$$,
  'the shared-space admin can add a viewer'
);

select lives_ok(
  $$insert into public.dashboard_widgets (
      id, layout_id, space_id, title, position
    ) values (
      '53000000-0000-4000-8000-000000000003',
      current_setting('test.owner_layout_id')::uuid,
      '61000000-0000-4000-8000-000000000001',
      'Shared source widget',
      2
    )$$,
  'a member can add a widget sourced from an accessible shared space'
);

select set_config(
  'request.jwt.claim.sub',
  '42000000-0000-4000-8000-000000000002',
  true
);

select is(
  (select count(*) from public.dashboard_layouts),
  1::bigint,
  'the second user still reads only their own layout'
);

select is_empty(
  $$select id from public.dashboard_widgets
    where layout_id = current_setting('test.owner_layout_id')::uuid$$,
  'the second user cannot read the first user widgets'
);

select is_empty(
  $$update public.dashboard_widgets set title = 'Cross-user update'
    where id = '51000000-0000-4000-8000-000000000001'
    returning id$$,
  'the second user cannot update another user widget'
);

select lives_ok(
  $$insert into public.dashboard_widgets (
      id, layout_id, space_id, title, position
    ) values (
      '54000000-0000-4000-8000-000000000004',
      current_setting('test.other_layout_id')::uuid,
      '61000000-0000-4000-8000-000000000001',
      'Viewer shared widget',
      0
    )$$,
  'a viewer can reference an accessible shared space in their own dashboard'
);

select throws_ok(
  $$insert into public.dashboard_widgets (
      layout_id, space_id, title, position
    ) values (
      current_setting('test.other_layout_id')::uuid,
      current_setting('test.owner_space_id')::uuid,
      'Private cross-user widget',
      1
    )$$,
  '42501',
  null,
  'shared membership does not expose another user personal space'
);

select results_eq(
  $$select public.move_dashboard_widget(
    '51000000-0000-4000-8000-000000000001',
    'up'
  )$$,
  array[false],
  'a user cannot move another user widget through the RPC'
);

select is_empty(
  $$delete from public.dashboard_widgets
    where id = '51000000-0000-4000-8000-000000000001'
    returning id$$,
  'a user cannot delete another user widget'
);

select results_eq(
  $$delete from public.dashboard_widgets
    where id = '54000000-0000-4000-8000-000000000004'
    returning id$$,
  array['54000000-0000-4000-8000-000000000004'::uuid],
  'a user can delete their own widget'
);

reset role;
set local role anon;

select throws_ok(
  $$select id from public.dashboard_layouts$$,
  '42501',
  null,
  'anonymous users cannot read dashboard layouts'
);

select throws_ok(
  $$select id from public.dashboard_widgets$$,
  '42501',
  null,
  'anonymous users cannot read dashboard widgets'
);

select * from finish();

rollback;
