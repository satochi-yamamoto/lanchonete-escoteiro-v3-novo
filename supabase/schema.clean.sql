create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric(10, 2) not null,
  category text not null,
  station text not null,
  image text,
  description text,
  is_available boolean not null default true,
  modifiers jsonb,
  recipe jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id text primary key,
  name text not null,
  unit text not null,
  cost_per_unit numeric(10, 2) not null default 0,
  current_stock numeric(12, 3) not null default 0,
  min_stock numeric(12, 3) not null default 0,
  supplier text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_logs (
  id text primary key,
  date timestamptz not null,
  ingredient_id text not null references public.ingredients (id),
  change numeric(12, 3) not null,
  type text not null,
  notes text
);

create index if not exists stock_logs_ingredient_date_idx on public.stock_logs (ingredient_id, date desc);

create table if not exists public.users (
  id text primary key,
  name text not null,
  role text not null,
  pin text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.scouts (
  id text primary key,
  name text not null,
  branch text not null,
  patrol text,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id text primary key,
  name text not null,
  type text not null,
  rules jsonb not null,
  value numeric(10, 4) not null,
  priority integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  valid_days integer[],
  valid_hours_start text,
  valid_hours_end text,
  channels text[],
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  order_number text not null,
  created_at timestamptz not null,
  paid_at timestamptz,
  started_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  status text not null,
  type text not null,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null,
  total numeric(10, 2) not null,
  customer_name text,
  payment_method text,
  payment_info jsonb,
  shift_id text,
  terminal_id text,
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);

create table if not exists public.shifts (
  id text primary key,
  staff_name text not null,
  terminal_id text not null,
  opened_at timestamptz not null,
  closed_at timestamptz,
  start_cash numeric(10, 2) not null,
  current_cash numeric(10, 2) not null,
  status text not null,
  transactions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists shifts_status_opened_idx on public.shifts (status, opened_at desc);

create table if not exists public.settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id bigserial primary key,
  stripe_event_id text not null unique,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

