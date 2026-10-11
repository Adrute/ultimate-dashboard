begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

select has_table('public', 'attachments', 'attachments table exists');
select has_column('public', 'attachments', 'note_id', 'attachments belong to a note');
select has_column('public', 'attachments', 'space_id', 'attachments retain space scope');
select is(
  (select relrowsecurity from pg_class where oid = 'public.attachments'::regclass),
  true,
  'attachments use RLS'
);
select is(
  (select public from storage.buckets where id = 'note-attachments'),
  false,
  'attachment bucket is private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'note-attachments'),
  5242880::bigint,
  'attachment bucket limits files to 5 MB'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
('a1100000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','attachment-owner@example.com','',now(),now()),
('a1200000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','attachment-editor@example.com','',now(),now()),
('a1300000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','attachment-viewer@example.com','',now(),now()),
('a1400000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','attachment-outsider@example.com','',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.spaces (id, name, kind, created_by) values ('a2100000-0000-4000-8000-000000000001', 'Shared attachments', 'shared', 'a1100000-0000-4000-8000-000000000001')$$,
  'owner creates shared space'
);
select lives_ok(
  $$insert into public.space_members (space_id, user_id, role) values ('a2100000-0000-4000-8000-000000000001', 'a1200000-0000-4000-8000-000000000002', 'editor')$$,
  'owner adds editor'
);
select lives_ok(
  $$insert into public.space_members (space_id, user_id, role) values ('a2100000-0000-4000-8000-000000000001', 'a1300000-0000-4000-8000-000000000003', 'viewer')$$,
  'owner adds viewer'
);
select lives_ok(
  $$insert into public.notes (id, space_id, created_by, title) values ('a3100000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', 'Shared note')$$,
  'owner creates note'
);

select set_config('request.jwt.claim.sub', 'a1200000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id) values ('note-attachments', 'a2100000-0000-4000-8000-000000000001/a3100000-0000-4000-8000-000000000001/a4100000-0000-4000-8000-000000000001.png', 'a1200000-0000-4000-8000-000000000002', 'a1200000-0000-4000-8000-000000000002')$$,
  'editor uploads object to authorized note path'
);
select lives_ok(
  $$insert into public.attachments (id, space_id, note_id, storage_path, file_name, mime_type, size_bytes, created_by) values ('a4100000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001', 'a3100000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001/a3100000-0000-4000-8000-000000000001/a4100000-0000-4000-8000-000000000001.png', 'diagram.png', 'image/png', 128, 'a1200000-0000-4000-8000-000000000002')$$,
  'editor creates attachment metadata'
);
select is((select count(*) from public.attachments), 1::bigint, 'editor reads attachment metadata');
select is((select count(*) from storage.objects where bucket_id = 'note-attachments'), 1::bigint, 'editor reads stored object after metadata exists');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('note-attachments', 'a2100000-0000-4000-8000-000000000001/a3100000-0000-4000-8000-000000000001/not-a-uuid.png')$$,
  '42501',
  null,
  'malformed storage path is rejected'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('note-attachments', 'a2100000-0000-4000-8000-000000000001/a3999999-0000-4000-8000-000000000099/a4200000-0000-4000-8000-000000000002.png')$$,
  '42501',
  null,
  'path for a missing note is rejected'
);
select throws_ok(
  $$insert into public.attachments (id, space_id, note_id, storage_path, file_name, mime_type, size_bytes, created_by) values ('a4300000-0000-4000-8000-000000000003', 'a2100000-0000-4000-8000-000000000001', 'a3100000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001/a3100000-0000-4000-8000-000000000001/a4300000-0000-4000-8000-000000000003.svg', 'active.svg', 'image/svg+xml', 50, 'a1200000-0000-4000-8000-000000000002')$$,
  '23514',
  null,
  'unsupported MIME type is rejected'
);
select throws_ok(
  $$insert into public.attachments (id, space_id, note_id, storage_path, file_name, mime_type, size_bytes, created_by) values ('a4400000-0000-4000-8000-000000000004', 'a2100000-0000-4000-8000-000000000001', 'a3100000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001/a3100000-0000-4000-8000-000000000001/a4400000-0000-4000-8000-000000000004.txt', 'large.txt', 'text/plain', 5242881, 'a1200000-0000-4000-8000-000000000002')$$,
  '23514',
  null,
  'oversized metadata is rejected'
);

select set_config('request.jwt.claim.sub', 'a1300000-0000-4000-8000-000000000003', true);
select is((select count(*) from public.attachments), 1::bigint, 'viewer reads attachment metadata');
select is((select count(*) from storage.objects where bucket_id = 'note-attachments'), 1::bigint, 'viewer reads stored object');
select throws_ok(
  $$insert into public.attachments (id, space_id, note_id, storage_path, file_name, mime_type, size_bytes, created_by) values ('a4500000-0000-4000-8000-000000000005', 'a2100000-0000-4000-8000-000000000001', 'a3100000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001/a3100000-0000-4000-8000-000000000001/a4500000-0000-4000-8000-000000000005.txt', 'viewer.txt', 'text/plain', 10, 'a1300000-0000-4000-8000-000000000003')$$,
  '42501',
  null,
  'viewer cannot create metadata'
);
select is_empty(
  $$delete from public.attachments where id = 'a4100000-0000-4000-8000-000000000001' returning id$$,
  'viewer cannot delete metadata'
);

select set_config('request.jwt.claim.sub', 'a1400000-0000-4000-8000-000000000004', true);
select is((select count(*) from public.attachments), 0::bigint, 'outsider cannot read metadata');
select is((select count(*) from storage.objects where bucket_id = 'note-attachments'), 0::bigint, 'outsider cannot read stored object');

select set_config('request.jwt.claim.sub', 'a1200000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$delete from public.attachments where id = 'a4100000-0000-4000-8000-000000000001'$$,
  'editor deletes attachment metadata'
);

reset role;
set local role anon;
select throws_ok($$select id from public.attachments$$, '42501', null, 'anonymous users cannot read metadata');
select is_empty(
  $$select id from storage.objects where bucket_id = 'note-attachments'$$,
  'anonymous users cannot read stored objects'
);

select * from finish();
rollback;
