-- WebX Pay: payment session + checkout snapshot for webhook fulfillment.
-- Run in Supabase SQL editor. If the table already exists, add missing columns with ALTER TABLE (see bottom).

create table if not exists public.webx_orders (
  id uuid primary key,
  email text not null,
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  payment_reference text not null unique,
  items jsonb not null default '[]'::jsonb,
  checkout_snapshot jsonb not null,
  shop_order_id uuid null,
  created_at timestamptz not null default now()
);

create index if not exists webx_orders_status_idx on public.webx_orders (status);
create index if not exists webx_orders_shop_order_idx on public.webx_orders (shop_order_id);
create index if not exists webx_orders_created_idx on public.webx_orders (created_at desc);

comment on table public.webx_orders is 'WebX hosted checkout: initiate stores snapshot; webhook creates shop order and sets shop_order_id.';

-- Example upgrades from older `webx_orders` definitions:
-- alter table public.webx_orders add column if not exists items jsonb not null default '[]'::jsonb;
-- alter table public.webx_orders add column if not exists checkout_snapshot jsonb;
-- alter table public.webx_orders add column if not exists shop_order_id uuid null;
-- alter table public.webx_orders drop constraint if exists webx_orders_status_check;
-- alter table public.webx_orders add constraint webx_orders_status_check check (status in ('pending','processing','paid','failed'));
