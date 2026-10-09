begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
select has_column('public','tasks','project_id','tasks link to projects');
select has_column('public','tasks','parent_task_id','tasks support subtasks');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at) values
('aa100000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','relations-one@example.com','',now(),now()),
('aa200000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','relations-two@example.com','',now(),now());
select set_config('test.rel_space_one',(select id::text from public.spaces where owner_user_id='aa100000-0000-4000-8000-000000000001'),true);
select set_config('test.rel_space_two',(select id::text from public.spaces where owner_user_id='aa200000-0000-4000-8000-000000000002'),true);
set local role authenticated; select set_config('request.jwt.claim.sub','aa100000-0000-4000-8000-000000000001',true);
select lives_ok($$insert into public.projects(id,space_id,created_by,name) values('ab100000-0000-4000-8000-000000000001',current_setting('test.rel_space_one')::uuid,'aa100000-0000-4000-8000-000000000001','Project')$$,'owner creates project');
select lives_ok($$insert into public.tasks(id,space_id,created_by,title,project_id) values('ac100000-0000-4000-8000-000000000001',current_setting('test.rel_space_one')::uuid,'aa100000-0000-4000-8000-000000000001','Root','ab100000-0000-4000-8000-000000000001')$$,'project accepts root task');
select lives_ok($$insert into public.tasks(id,space_id,created_by,title,project_id,parent_task_id) values('ac200000-0000-4000-8000-000000000002',current_setting('test.rel_space_one')::uuid,'aa100000-0000-4000-8000-000000000001','Child','ab100000-0000-4000-8000-000000000001','ac100000-0000-4000-8000-000000000001')$$,'task accepts subtask');
select is((select count(*) from public.tasks where project_id='ab100000-0000-4000-8000-000000000001'),2::bigint,'project returns its task tree');
select throws_ok($$update public.tasks set parent_task_id='ac200000-0000-4000-8000-000000000002' where id='ac100000-0000-4000-8000-000000000001'$$,'23514',null,'cycles are rejected');
select throws_ok($$update public.tasks set parent_task_id=id where id='ac100000-0000-4000-8000-000000000001'$$,'23514',null,'self parenting is rejected');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select lives_ok($$insert into public.projects(id,space_id,created_by,name) values('ab200000-0000-4000-8000-000000000002',current_setting('test.rel_space_two')::uuid,'aa200000-0000-4000-8000-000000000002','Other')$$,'second user creates isolated project');
select set_config('request.jwt.claim.sub','aa100000-0000-4000-8000-000000000001',true);
select throws_ok($$insert into public.tasks(space_id,created_by,title,project_id) values(current_setting('test.rel_space_one')::uuid,'aa100000-0000-4000-8000-000000000001','Cross','ab200000-0000-4000-8000-000000000002')$$,'23514',null,'cross-space project relation is rejected');
select * from finish(); rollback;
