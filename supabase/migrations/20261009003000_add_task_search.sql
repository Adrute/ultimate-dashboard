create function public.search_tasks(search_query text)
returns setof public.tasks
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
  select task.*
  from public.tasks as task
  where position(lower(normalized_query) in lower(task.title)) > 0
    or position(lower(normalized_query) in lower(coalesce(task.description, ''))) > 0
  order by task.updated_at desc, task.id;
end;
$$;

revoke all on function public.search_tasks(text)
from public, anon, authenticated;
grant execute on function public.search_tasks(text) to authenticated;

comment on function public.search_tasks(text) is
  'Searches visible tasks using caller RLS. F1-02 initial global search.';
