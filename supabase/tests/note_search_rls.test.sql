begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_function('public', 'search_notes', array['text'], 'note search function exists');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
('b1100000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','search-owner@example.com','',now(),now()),
('b1200000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','search-editor@example.com','',now(),now()),
('b1300000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','search-outsider@example.com','',now(),now());

select set_config('test.note_search_owner_space', (select id::text from public.spaces where owner_user_id = 'b1100000-0000-4000-8000-000000000001'), true);
select set_config('test.note_search_outsider_space', (select id::text from public.spaces where owner_user_id = 'b1300000-0000-4000-8000-000000000003'), true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000001', true);
insert into public.spaces (id, name, kind, created_by)
values ('b2100000-0000-4000-8000-000000000001', 'Shared search', 'shared', 'b1100000-0000-4000-8000-000000000001');
insert into public.space_members (space_id, user_id, role)
values ('b2100000-0000-4000-8000-000000000001', 'b1200000-0000-4000-8000-000000000002', 'editor');
insert into public.notes (id, space_id, created_by, title, body)
values
('b3100000-0000-4000-8000-000000000001', current_setting('test.note_search_owner_space')::uuid, 'b1100000-0000-4000-8000-000000000001', 'Private lighthouse', 'secret journal'),
('b3200000-0000-4000-8000-000000000002', 'b2100000-0000-4000-8000-000000000001', 'b1100000-0000-4000-8000-000000000001', 'Shared plan', 'lighthouse launch');

select is((select count(*) from public.search_notes('lighthouse')), 2::bigint, 'owner finds authorized private and shared notes');
select is((select count(*) from public.search_notes('  LIGHTHOUSE  ')), 2::bigint, 'search trims and ignores case');

select set_config('request.jwt.claim.sub', 'b1200000-0000-4000-8000-000000000002', true);
select is((select count(*) from public.search_notes('lighthouse')), 1::bigint, 'editor finds shared note');
select is((select count(*) from public.search_notes('secret journal')), 0::bigint, 'editor cannot find owner private note');

select set_config('request.jwt.claim.sub', 'b1300000-0000-4000-8000-000000000003', true);
insert into public.notes (id, space_id, created_by, title, body)
values ('b3300000-0000-4000-8000-000000000003', current_setting('test.note_search_outsider_space')::uuid, 'b1300000-0000-4000-8000-000000000003', 'Outsider lighthouse', 'isolated');
select is((select count(*) from public.search_notes('lighthouse')), 1::bigint, 'outsider finds only own matching note');
select is((select count(*) from public.search_notes('Shared plan')), 0::bigint, 'outsider cannot find shared note');

select set_config('request.jwt.claim.sub', 'b1100000-0000-4000-8000-000000000001', true);
select is((select count(*) from public.search_notes('Outsider lighthouse')), 0::bigint, 'owner cannot find outsider note');
select throws_ok($$select * from public.search_notes('   ')$$, '22023', null, 'blank search is rejected');
select throws_ok($$select * from public.search_notes(repeat('a', 81))$$, '22023', null, 'oversized search is rejected');

reset role;
set local role anon;
select throws_ok($$select * from public.search_notes('lighthouse')$$, '42501', null, 'anonymous search is rejected');

select * from finish();
rollback;
