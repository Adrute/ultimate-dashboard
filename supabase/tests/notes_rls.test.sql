begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

select has_table('public', 'notes', 'notes table exists');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
('c1000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notes-owner@example.com','',now(),now()),
('c2000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notes-editor@example.com','',now(),now()),
('c3000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notes-viewer@example.com','',now(),now()),
('c4000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','notes-outsider@example.com','',now(),now());

select set_config('test.notes_owner_space',(select id::text from public.spaces where owner_user_id='c1000000-0000-4000-8000-000000000001'),true);

set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);

select lives_ok($$insert into public.spaces(id,name,kind,created_by) values('d1000000-0000-4000-8000-000000000001','Shared notes','shared','c1000000-0000-4000-8000-000000000001')$$,'admin creates first shared space');
select lives_ok($$insert into public.space_members(space_id,user_id,role) values('d1000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000002','editor')$$,'admin adds editor');
select lives_ok($$insert into public.space_members(space_id,user_id,role) values('d1000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000003','viewer')$$,'admin adds viewer');
select lives_ok($$insert into public.notes(id,space_id,created_by,title,body) values('e1000000-0000-4000-8000-000000000001',current_setting('test.notes_owner_space')::uuid,'c1000000-0000-4000-8000-000000000001','Private note','Private')$$,'owner creates private note');
select lives_ok($$insert into public.notes(id,space_id,created_by,title,body) values('e1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','Shared note','Shared')$$,'admin creates shared note');

select set_config('request.jwt.claim.sub','c2000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.notes),1::bigint,'editor reads shared but not private note');
select lives_ok($$insert into public.notes(id,space_id,created_by,title) values('e2000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000002','Editor note')$$,'editor creates shared note');
select results_eq($$update public.notes set body='Edited' where id='e1000000-0000-4000-8000-000000000002' returning body$$,array['Edited'::text],'editor updates shared note');

select set_config('request.jwt.claim.sub','c3000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.notes),2::bigint,'viewer reads shared notes');
select throws_ok($$insert into public.notes(space_id,created_by,title) values('d1000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000003','Viewer note')$$,'42501',null,'viewer cannot create notes');
select is_empty($$update public.notes set title='Nope' where id='e1000000-0000-4000-8000-000000000002' returning id$$,'viewer cannot update notes');
select is_empty($$delete from public.notes where id='e1000000-0000-4000-8000-000000000002' returning id$$,'viewer cannot delete notes');

select set_config('request.jwt.claim.sub','c4000000-0000-4000-8000-000000000004',true);
select lives_ok($$insert into public.spaces(id,name,kind,created_by) values('d2000000-0000-4000-8000-000000000002','Other notes','shared','c4000000-0000-4000-8000-000000000004')$$,'outsider creates second shared space');
select lives_ok($$insert into public.notes(id,space_id,created_by,title) values('e4000000-0000-4000-8000-000000000004','d2000000-0000-4000-8000-000000000002','c4000000-0000-4000-8000-000000000004','Other note')$$,'outsider creates note in own space');
select is_empty($$select id from public.notes where space_id='d1000000-0000-4000-8000-000000000001'$$,'outsider cannot read first shared space notes');

select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select is_empty($$select id from public.notes where space_id='d2000000-0000-4000-8000-000000000002'$$,'owner cannot read second shared space notes');
select throws_ok($$update public.notes set space_id='d2000000-0000-4000-8000-000000000002' where id='e1000000-0000-4000-8000-000000000002'$$,'42501',null,'technical space column cannot be updated');
select throws_ok($$insert into public.notes(space_id,created_by,title) values('d1000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000002','Forged')$$,'42501',null,'creator cannot be forged');
select throws_ok($$insert into public.notes(space_id,created_by,title) values(current_setting('test.notes_owner_space')::uuid,'c1000000-0000-4000-8000-000000000001','   ')$$,'23514',null,'blank title is rejected');
select throws_ok($$insert into public.notes(space_id,created_by,title,body) values(current_setting('test.notes_owner_space')::uuid,'c1000000-0000-4000-8000-000000000001','Long',repeat('a',50001))$$,'23514',null,'oversized body is rejected');

reset role;
set local role anon;
select throws_ok($$select id from public.notes$$,'42501',null,'anonymous users cannot read notes');
select throws_ok($$insert into public.notes(space_id,title) values('d1000000-0000-4000-8000-000000000001','Anon')$$,'42501',null,'anonymous users cannot create notes');

select * from finish();
rollback;
