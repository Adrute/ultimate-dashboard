begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select has_function('public', 'search_tasks', array['text'], 'task search function exists');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'search-owner@example.com', '', now(), now()),
  ('a2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'search-other@example.com', '', now(), now());

select set_config('test.search_owner_space', (
  select id::text from public.spaces where owner_user_id = 'a1000000-0000-4000-8000-000000000001'
), true);
select set_config('test.search_other_space', (
  select id::text from public.spaces where owner_user_id = 'a2000000-0000-4000-8000-000000000002'
), true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values ('b1000000-0000-4000-8000-000000000001', 'Search shared one', 'shared', 'a1000000-0000-4000-8000-000000000001')$$,
  'the first user creates a shared space'
);

select lives_ok(
  $$insert into public.tasks (space_id, created_by, title)
    values (current_setting('test.search_owner_space')::uuid, 'a1000000-0000-4000-8000-000000000001', 'Needle private')$$,
  'the first user creates a matching private task'
);

select lives_ok(
  $$insert into public.tasks (space_id, created_by, title, description)
    values ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Shared work', 'Contains needle')$$,
  'the first user creates a matching shared task'
);

select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by)
    values ('b2000000-0000-4000-8000-000000000002', 'Search shared two', 'shared', 'a2000000-0000-4000-8000-000000000002')$$,
  'the second user creates an isolated shared space'
);

select lives_ok(
  $$insert into public.tasks (space_id, created_by, title)
    values ('b2000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'Needle hidden')$$,
  'the second user creates a matching isolated task'
);

select results_eq(
  $$select title from public.search_tasks('needle')$$,
  array['Needle hidden'::text],
  'search returns only the second user visible match'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);

select results_eq(
  $$select title from public.search_tasks('NEEDLE') order by title$$,
  array['Needle private'::text, 'Shared work'::text],
  'search is case-insensitive and excludes the other space'
);

select throws_ok(
  $$select * from public.search_tasks('   ')$$,
  '22023', null,
  'search rejects an empty query at the database boundary'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.search_tasks('needle')$$,
  '42501', null,
  'anonymous users cannot execute task search'
);

select * from finish();

rollback;
