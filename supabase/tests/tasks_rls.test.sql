begin;

create extension if not exists pgtap with schema extensions;

select plan(25);

select has_table('public', 'tasks', 'tasks table exists');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('71000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tasks-owner@example.com', '', now(), now()),
  ('72000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tasks-editor@example.com', '', now(), now()),
  ('73000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tasks-viewer@example.com', '', now(), now()),
  ('74000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tasks-outsider@example.com', '', now(), now());

select set_config('test.tasks_owner_space', (
  select id::text from public.spaces where owner_user_id = '71000000-0000-4000-8000-000000000001'
), true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values ('81000000-0000-4000-8000-000000000001', 'Shared tasks', 'shared', '71000000-0000-4000-8000-000000000001')$$,
  'an admin can create a shared task space'
);

select lives_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values ('81000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000002', 'editor')$$,
  'an admin can add an editor'
);

select lives_ok(
  $$insert into public.space_members (space_id, user_id, role)
    values ('81000000-0000-4000-8000-000000000001', '73000000-0000-4000-8000-000000000003', 'viewer')$$,
  'an admin can add a viewer'
);

select lives_ok(
  $$insert into public.tasks (id, space_id, created_by, title, priority)
    values ('91000000-0000-4000-8000-000000000001', current_setting('test.tasks_owner_space')::uuid, '71000000-0000-4000-8000-000000000001', 'Private task', 'medium')$$,
  'an owner can create a task in their personal space'
);

select lives_ok(
  $$insert into public.tasks (id, space_id, created_by, title)
    values ('91000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'Shared task')$$,
  'an admin can create a shared task'
);

select results_eq(
  $$update public.tasks set status = 'done' where id = '91000000-0000-4000-8000-000000000002' returning completed_at is not null$$,
  array[true],
  'completing a task records its completion time'
);

select results_eq(
  $$update public.tasks set status = 'todo' where id = '91000000-0000-4000-8000-000000000002' returning completed_at is null$$,
  array[true],
  'reopening a task clears its completion time'
);

select throws_ok(
  $$insert into public.tasks (space_id, created_by, title)
    values ('81000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000002', 'Forged author')$$,
  '42501', null,
  'a user cannot forge the task creator'
);

select throws_ok(
  $$update public.tasks set space_id = current_setting('test.tasks_owner_space')::uuid
    where id = '91000000-0000-4000-8000-000000000002'$$,
  '42501', null,
  'space ownership cannot be changed through task updates'
);

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*) from public.tasks), 1::bigint,
  'an editor reads shared tasks but not another user private tasks'
);

select lives_ok(
  $$insert into public.tasks (id, space_id, created_by, title)
    values ('91000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000002', 'Editor task')$$,
  'an editor can create a shared task'
);

select results_eq(
  $$update public.tasks set priority = 'high' where id = '91000000-0000-4000-8000-000000000002' returning priority$$,
  array['high'::public.task_priority],
  'an editor can update a shared task'
);

select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000003', true);

select is(
  (select count(*) from public.tasks), 2::bigint,
  'a viewer can read tasks in their shared space'
);

select throws_ok(
  $$insert into public.tasks (space_id, created_by, title)
    values ('81000000-0000-4000-8000-000000000001', '73000000-0000-4000-8000-000000000003', 'Viewer task')$$,
  '42501', null,
  'a viewer cannot create shared tasks'
);

select is_empty(
  $$update public.tasks set status = 'done' where id = '91000000-0000-4000-8000-000000000002' returning id$$,
  'a viewer cannot update shared tasks'
);

select is_empty(
  $$delete from public.tasks where id = '91000000-0000-4000-8000-000000000002' returning id$$,
  'a viewer cannot delete shared tasks'
);

select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000004', true);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values ('82000000-0000-4000-8000-000000000002', 'Other shared tasks', 'shared', '74000000-0000-4000-8000-000000000004')$$,
  'a second admin can create an isolated shared space'
);

select lives_ok(
  $$insert into public.tasks (id, space_id, created_by, title)
    values ('92000000-0000-4000-8000-000000000004', '82000000-0000-4000-8000-000000000002', '74000000-0000-4000-8000-000000000004', 'Other space task')$$,
  'the second admin can create a task in their space'
);

select is_empty(
  $$select id from public.tasks where space_id = '81000000-0000-4000-8000-000000000001'$$,
  'an outsider cannot read tasks from the first shared space'
);

select throws_ok(
  $$insert into public.tasks (space_id, created_by, title)
    values ('81000000-0000-4000-8000-000000000001', '74000000-0000-4000-8000-000000000004', 'Cross-space task')$$,
  '42501', null,
  'an outsider cannot create tasks in the first shared space'
);

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000001', true);

select is_empty(
  $$select id from public.tasks where space_id = '82000000-0000-4000-8000-000000000002'$$,
  'the first admin cannot read tasks from the second shared space'
);

select throws_ok(
  $$insert into public.tasks (space_id, created_by, title)
    values (current_setting('test.tasks_owner_space')::uuid, '71000000-0000-4000-8000-000000000001', '   ')$$,
  '23514', null,
  'the database rejects blank task titles'
);

reset role;
set local role anon;

select throws_ok(
  $$select id from public.tasks$$,
  '42501', null,
  'anonymous users cannot read tasks'
);

select throws_ok(
  $$insert into public.tasks (space_id, title) values ('81000000-0000-4000-8000-000000000001', 'Anonymous task')$$,
  '42501', null,
  'anonymous users cannot create tasks'
);

select * from finish();

rollback;
