-- 1) Backfill tracking records for existing orders that have no tracking row
insert into public.tracking (order_id, tracking_code)
select
  o.id,
  'TRK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
from public.orders o
left join public.tracking t on t.order_id = o.id
where t.order_id is null;

-- 2) Function to generate and insert a tracking record for one order
create or replace function public.create_tracking_for_order(p_order_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_tracking_code text;
begin
  loop
    v_tracking_code := 'TRK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into public.tracking (order_id, tracking_code)
      values (p_order_id, v_tracking_code);
      return v_tracking_code;
    exception
      when unique_violation then
        -- Retry if random code collides.
        continue;
    end;
  end loop;
end;
$$;

-- 3) Optional trigger: auto-create tracking whenever a new order is inserted
create or replace function public.after_order_create_tracking()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.create_tracking_for_order(new.id);
  return new;
end;
$$;

drop trigger if exists trg_after_order_create_tracking on public.orders;
create trigger trg_after_order_create_tracking
after insert on public.orders
for each row
execute function public.after_order_create_tracking();

-- 4) Helpful read query: dashboard order list with tracking_code
-- select o.*, t.tracking_code
-- from public.orders o
-- left join public.tracking t on t.order_id = o.id
-- where o.user_id = :user_id
-- order by o.created_at desc;
