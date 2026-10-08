begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select has_table('public', 'profiles', 'profiles table exists');

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
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@example.com',
    '',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'other@example.com',
    '',
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);

select results_eq(
  $$select id from public.profiles order by id$$,
  array['11111111-1111-1111-1111-111111111111'::uuid],
  'an authenticated user reads only their own profile'
);

select is_empty(
  $$select id from public.profiles where id = '22222222-2222-2222-2222-222222222222'$$,
  'a user cannot read another profile'
);

select results_eq(
  $$update public.profiles set display_name = 'Owner' where id = '11111111-1111-1111-1111-111111111111' returning id$$,
  array['11111111-1111-1111-1111-111111111111'::uuid],
  'a user can update their own profile'
);

select is_empty(
  $$update public.profiles set display_name = 'Forbidden' where id = '22222222-2222-2222-2222-222222222222' returning id$$,
  'a user cannot update another profile'
);

select throws_ok(
  $$update public.profiles set created_at = now() where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'authenticated users cannot update technical profile columns'
);

select throws_ok(
  $$insert into public.profiles (id) values ('33333333-3333-3333-3333-333333333333')$$,
  '42501',
  null,
  'authenticated users cannot insert profiles directly'
);

select throws_ok(
  $$delete from public.profiles where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'authenticated users cannot delete profiles directly'
);

reset role;
set local role anon;

select throws_ok(
  $$select id from public.profiles$$,
  '42501',
  null,
  'anonymous users cannot read profiles'
);

select throws_ok(
  $$update public.profiles set display_name = 'Anonymous'$$,
  '42501',
  null,
  'anonymous users cannot update profiles'
);

select * from finish();

rollback;
