begin;
create extension if not exists pgtap with schema extensions;
select plan(23);
select has_table('public','projects','projects table exists');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at) values
('f1000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','project-owner@example.com','',now(),now()),
('f2000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','project-editor@example.com','',now(),now()),
('f3000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','project-viewer@example.com','',now(),now()),
('f4000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','project-other@example.com','',now(),now());
select set_config('test.project_personal',(select id::text from public.spaces where owner_user_id='f1000000-0000-4000-8000-000000000001'),true);
set local role authenticated; select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000001',true);
select lives_ok($$insert into public.spaces(id,name,kind,created_by) values('fa000000-0000-4000-8000-000000000001','Shared projects','shared','f1000000-0000-4000-8000-000000000001')$$,'owner creates shared space');
select lives_ok($$insert into public.space_members values('fa000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000002','editor',now(),now())$$,'owner adds editor');
select lives_ok($$insert into public.space_members values('fa000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000003','viewer',now(),now())$$,'owner adds viewer');
select lives_ok($$insert into public.projects(id,space_id,created_by,name) values('fb000000-0000-4000-8000-000000000001',current_setting('test.project_personal')::uuid,'f1000000-0000-4000-8000-000000000001','Private project')$$,'owner creates private project');
select lives_ok($$insert into public.projects(id,space_id,created_by,name) values('fb000000-0000-4000-8000-000000000002','fa000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','Shared project')$$,'owner creates shared project');
select set_config('request.jwt.claim.sub','f2000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.projects),1::bigint,'editor sees shared project only');
select lives_ok($$insert into public.projects(id,space_id,created_by,name) values('fb000000-0000-4000-8000-000000000003','fa000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000002','Editor project')$$,'editor creates project');
select results_eq($$update public.projects set progress=40,status='active' where id='fb000000-0000-4000-8000-000000000002' returning progress$$,array[40::smallint],'editor updates project');
select set_config('request.jwt.claim.sub','f3000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.projects),2::bigint,'viewer reads shared projects');
select throws_ok($$insert into public.projects(space_id,created_by,name) values('fa000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000003','No')$$,'42501',null,'viewer cannot create');
select is_empty($$update public.projects set progress=99 where id='fb000000-0000-4000-8000-000000000002' returning id$$,'viewer cannot update');
select is_empty($$delete from public.projects where id='fb000000-0000-4000-8000-000000000002' returning id$$,'viewer cannot delete');
select set_config('request.jwt.claim.sub','f4000000-0000-4000-8000-000000000004',true);
select lives_ok($$insert into public.spaces(id,name,kind,created_by) values('fc000000-0000-4000-8000-000000000004','Other projects','shared','f4000000-0000-4000-8000-000000000004')$$,'other creates isolated space');
select lives_ok($$insert into public.projects(id,space_id,created_by,name) values('fd000000-0000-4000-8000-000000000004','fc000000-0000-4000-8000-000000000004','f4000000-0000-4000-8000-000000000004','Hidden')$$,'other creates isolated project');
select is_empty($$select id from public.projects where space_id='fa000000-0000-4000-8000-000000000001'$$,'other cannot read first space');
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000001',true);
select is_empty($$select id from public.projects where space_id='fc000000-0000-4000-8000-000000000004'$$,'owner cannot read other space');
select throws_ok($$update public.projects set space_id='fc000000-0000-4000-8000-000000000004' where id='fb000000-0000-4000-8000-000000000002'$$,'42501',null,'space column cannot update');
select throws_ok($$insert into public.projects(space_id,created_by,name) values('fa000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000002','Forged')$$,'42501',null,'creator cannot be forged');
select throws_ok($$insert into public.projects(space_id,created_by,name,progress) values(current_setting('test.project_personal')::uuid,'f1000000-0000-4000-8000-000000000001','Bad',101)$$,'23514',null,'invalid progress rejected');
select throws_ok($$insert into public.projects(space_id,created_by,name,start_date,due_date) values(current_setting('test.project_personal')::uuid,'f1000000-0000-4000-8000-000000000001','Bad dates','2026-10-10','2026-10-01')$$,'23514',null,'inverted dates rejected');
reset role; set local role anon;
select throws_ok($$select id from public.projects$$,'42501',null,'anonymous cannot read');
select throws_ok($$insert into public.projects(space_id,name) values('fa000000-0000-4000-8000-000000000001','Anon')$$,'42501',null,'anonymous cannot create');
select * from finish(); rollback;
