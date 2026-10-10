begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_column('public','notes','parent_note_id','notes support child pages');
select has_table('public','note_versions','note versions table exists');
select is((select relrowsecurity from pg_class where oid='public.note_versions'::regclass),true,'note versions use RLS');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at) values
('f1100000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','hierarchy-one@example.com','',now(),now()),
('f1200000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','hierarchy-two@example.com','',now(),now());
select set_config('test.note_space_one',(select id::text from public.spaces where owner_user_id='f1100000-0000-4000-8000-000000000001'),true);
select set_config('test.note_space_two',(select id::text from public.spaces where owner_user_id='f1200000-0000-4000-8000-000000000002'),true);

set local role authenticated;
select set_config('request.jwt.claim.sub','f1100000-0000-4000-8000-000000000001',true);
select lives_ok($$insert into public.notes(id,space_id,created_by,title,body) values('f2100000-0000-4000-8000-000000000001',current_setting('test.note_space_one')::uuid,'f1100000-0000-4000-8000-000000000001','Root','Initial')$$,'owner creates root note');
select is((select count(*) from public.note_versions where note_id='f2100000-0000-4000-8000-000000000001'),1::bigint,'creation captures first version');
select lives_ok($$insert into public.notes(id,space_id,created_by,title,parent_note_id) values('f2200000-0000-4000-8000-000000000002',current_setting('test.note_space_one')::uuid,'f1100000-0000-4000-8000-000000000001','Child','f2100000-0000-4000-8000-000000000001')$$,'owner creates child page');
select is((select parent_note_id from public.note_versions where note_id='f2200000-0000-4000-8000-000000000002' and version_number=1),'f2100000-0000-4000-8000-000000000001'::uuid,'version preserves parent relation');
select lives_ok($$update public.notes set body='Revised' where id='f2100000-0000-4000-8000-000000000001'$$,'owner updates note');
select is((select count(*) from public.note_versions where note_id='f2100000-0000-4000-8000-000000000001'),2::bigint,'update captures another version');
select is((select body from public.note_versions where note_id='f2100000-0000-4000-8000-000000000001' order by version_number desc limit 1),'Revised','latest version has revised body');
select throws_ok($$update public.notes set parent_note_id=id where id='f2100000-0000-4000-8000-000000000001'$$,'23514',null,'self parenting is rejected');
select throws_ok($$update public.notes set parent_note_id='f2200000-0000-4000-8000-000000000002' where id='f2100000-0000-4000-8000-000000000001'$$,'23514',null,'cycles are rejected');

select set_config('request.jwt.claim.sub','f1200000-0000-4000-8000-000000000002',true);
select lives_ok($$insert into public.notes(id,space_id,created_by,title) values('f2300000-0000-4000-8000-000000000003',current_setting('test.note_space_two')::uuid,'f1200000-0000-4000-8000-000000000002','Other root')$$,'second owner creates isolated note');
select is((select count(*) from public.note_versions),1::bigint,'second owner only reads own version');

select set_config('request.jwt.claim.sub','f1100000-0000-4000-8000-000000000001',true);
select throws_ok($$insert into public.notes(space_id,created_by,title,parent_note_id) values(current_setting('test.note_space_one')::uuid,'f1100000-0000-4000-8000-000000000001','Cross-space child','f2300000-0000-4000-8000-000000000003')$$,'23514',null,'cross-space parent is rejected');
select is((select count(*) from public.note_versions where note_id='f2300000-0000-4000-8000-000000000003'),0::bigint,'first owner cannot read second owner versions');
select throws_ok($$insert into public.note_versions(note_id,space_id,version_number,title,body) values('f2100000-0000-4000-8000-000000000001',current_setting('test.note_space_one')::uuid,99,'Forged','')$$,'42501',null,'authenticated users cannot forge versions');

reset role;
set local role anon;
select throws_ok($$select id from public.note_versions$$,'42501',null,'anonymous users cannot read versions');

select * from finish();
rollback;
