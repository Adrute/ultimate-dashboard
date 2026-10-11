create function public.search_notes(search_query text)
returns setof public.notes
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  normalized_query text := btrim(search_query);
begin
  if search_query is null or char_length(normalized_query) not between 1 and 80 then
    raise exception using
      errcode = '22023',
      message = 'Search query must contain between 1 and 80 characters.';
  end if;

  return query
  select note.*
  from public.notes as note
  where position(lower(normalized_query) in lower(note.title)) > 0
    or position(lower(normalized_query) in lower(note.body)) > 0
  order by note.updated_at desc, note.id;
end;
$$;

revoke all on function public.search_notes(text)
from public, anon, authenticated;
grant execute on function public.search_notes(text) to authenticated;

comment on function public.search_notes(text) is
  'Searches visible note titles and derived plain text using caller RLS.';
