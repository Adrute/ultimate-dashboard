begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public', 'google_connections', 'Google connections table exists');
select has_column('public', 'google_connections', 'token_ciphertext', 'encrypted token payload is stored');
select is(
  (select relrowsecurity from pg_class where oid = 'public.google_connections'::regclass),
  true,
  'Google connections use RLS'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
('d1100000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','google-owner@example.com','',now(),now()),
('d1200000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','google-other@example.com','',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.google_connections (owner_user_id, provider_subject, account_email, granted_scopes, token_ciphertext, access_expires_at) values ('d1100000-0000-4000-8000-000000000001', 'google-subject-one', 'calendar-owner@example.com', array['openid','https://www.googleapis.com/auth/calendar.events'], repeat('a', 64), now() + interval '1 hour')$$,
  'user creates own Google connection'
);
select is((select count(*) from public.google_connections), 1::bigint, 'user reads own connection');
select results_eq(
  $$update public.google_connections set account_email = 'updated@example.com' returning account_email$$,
  array['updated@example.com'::text],
  'user updates own connection'
);
select throws_ok(
  $$insert into public.google_connections (owner_user_id, provider_subject, account_email, granted_scopes, token_ciphertext) values ('d1200000-0000-4000-8000-000000000002', 'forged-subject', 'forged@example.com', array['openid'], repeat('b', 64))$$,
  '42501',
  null,
  'user cannot forge another owner connection'
);
select throws_ok(
  $$insert into public.google_connections (owner_user_id, provider_subject, account_email, granted_scopes, token_ciphertext) values ('d1100000-0000-4000-8000-000000000001', 'duplicate', 'duplicate@example.com', array['openid'], repeat('c', 64))$$,
  '23505',
  null,
  'only one Google connection is allowed per user'
);

select set_config('request.jwt.claim.sub', 'd1200000-0000-4000-8000-000000000002', true);
select is((select count(*) from public.google_connections), 0::bigint, 'other user cannot read connection');
select is_empty(
  $$update public.google_connections set account_email = 'stolen@example.com' returning owner_user_id$$,
  'other user cannot update connection'
);
select is_empty(
  $$delete from public.google_connections returning owner_user_id$$,
  'other user cannot delete connection'
);
select lives_ok(
  $$insert into public.google_connections (owner_user_id, provider_subject, account_email, granted_scopes, token_ciphertext) values ('d1200000-0000-4000-8000-000000000002', 'google-subject-two', 'calendar-other@example.com', array['openid'], repeat('d', 64))$$,
  'other user creates own connection'
);
select is((select count(*) from public.google_connections), 1::bigint, 'other user sees only own connection');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000001', true);
select is((select count(*) from public.google_connections), 1::bigint, 'first user still sees only own connection');
select lives_ok(
  $$delete from public.google_connections where owner_user_id = 'd1100000-0000-4000-8000-000000000001'$$,
  'user deletes own connection'
);
select is((select count(*) from public.google_connections), 0::bigint, 'deleted connection is no longer visible');

reset role;
set local role anon;
select throws_ok($$select owner_user_id from public.google_connections$$, '42501', null, 'anonymous users cannot read connections');
select throws_ok(
  $$insert into public.google_connections (owner_user_id, provider_subject, account_email, granted_scopes, token_ciphertext) values ('d1100000-0000-4000-8000-000000000001', 'anon', 'anon@example.com', array['openid'], repeat('e', 64))$$,
  '42501',
  null,
  'anonymous users cannot create connections'
);

select * from finish();
rollback;
