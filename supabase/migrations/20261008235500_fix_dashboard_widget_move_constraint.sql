create or replace function public.move_dashboard_widget(
  target_widget_id uuid,
  move_direction text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_layout_id uuid;
  current_position integer;
  neighbor_id uuid;
  neighbor_position integer;
begin
  if move_direction not in ('up', 'down') then
    raise exception using
      errcode = '22023',
      message = 'Dashboard widget direction must be up or down.';
  end if;

  select layout_id, position
  into current_layout_id, current_position
  from public.dashboard_widgets
  where id = target_widget_id;

  if not found then
    return false;
  end if;

  if move_direction = 'up' then
    select id, position
    into neighbor_id, neighbor_position
    from public.dashboard_widgets
    where layout_id = current_layout_id
      and position < current_position
    order by position desc
    limit 1;
  else
    select id, position
    into neighbor_id, neighbor_position
    from public.dashboard_widgets
    where layout_id = current_layout_id
      and position > current_position
    order by position asc
    limit 1;
  end if;

  if neighbor_id is null then
    return false;
  end if;

  set constraints public.dashboard_widgets_layout_position_unique deferred;

  update public.dashboard_widgets
  set position = case
    when id = target_widget_id then neighbor_position
    else current_position
  end
  where id in (target_widget_id, neighbor_id);

  return true;
end;
$$;

revoke all on function public.move_dashboard_widget(uuid, text)
from public, anon, authenticated;
grant execute on function public.move_dashboard_widget(uuid, text)
to authenticated;
