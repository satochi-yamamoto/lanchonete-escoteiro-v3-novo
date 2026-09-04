create extension if not exists pgcrypto;

create table products (
  id text primary key, name text not null, price numeric(10,2) not null, category text not null,
  station text not null, image text, description text, is_available boolean not null default true,
  modifiers jsonb, recipe jsonb, updated_at timestamptz not null default now()
);
create table ingredients (
  id text primary key, name text not null, unit text not null, cost_per_unit numeric(10,3) not null default 0,
  current_stock numeric(12,3) not null default 0, min_stock numeric(12,3) not null default 0,
  supplier text not null default '', updated_at timestamptz not null default now()
);
create table users (
  id text primary key, name text not null, role text not null check (role in ('ADMIN','MANAGER','CASHIER','KITCHEN')),
  pin_hash text not null, failed_pin_attempts integer not null default 0, pin_locked_until timestamptz,
  updated_at timestamptz not null default now()
);
create table scouts (
  id text primary key, name text not null, branch text not null, patrol text, created_at timestamptz not null default now()
);
create table promotions (
  id text primary key, name text not null, type text not null, rules jsonb not null, value numeric(10,4) not null,
  priority integer not null default 0, valid_from timestamptz, valid_until timestamptz, valid_days integer[],
  valid_hours_start text, valid_hours_end text, channels text[], updated_at timestamptz not null default now()
);
create table store_sessions (
  id text primary key, opened_at timestamptz not null default now(), closed_at timestamptz,
  status text not null check (status in ('OPEN','CLOSED')), opened_by text not null, closed_by text, notes text,
  updated_at timestamptz not null default now()
);
create table shifts (
  id text primary key, staff_name text not null, terminal_id text not null, session_id text references store_sessions(id),
  opened_at timestamptz not null, closed_at timestamptz, start_cash numeric(10,2) not null,
  current_cash numeric(10,2) not null, status text not null, transactions jsonb not null default '[]'::jsonb,
  opening_product_cost_total numeric(10,2), planned_normal_burgers integer, planned_vegan_burgers integer,
  planned_chefe_burgers integer, planned_escoteiro_extra_burgers integer, opening_unit_cost_suggested numeric(10,2),
  opening_unit_cost numeric(10,2), opening_promotion_quantity integer, opening_promotion_value numeric(10,2),
  daily_menu_name text, opening_drinks_liters numeric(10,2), drinks_liters numeric(10,2), burger_cost numeric(10,2),
  burgers_produced integer, burgers_unsold integer, menu_name text, closer_name text, feedback text,
  adjustments jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now()
);
create table orders (
  id text primary key, order_number text not null, created_at timestamptz not null, paid_at timestamptz,
  started_at timestamptz, ready_at timestamptz, delivered_at timestamptz, status text not null, type text not null,
  items jsonb not null, subtotal numeric(10,2) not null, discount numeric(10,2) not null, total numeric(10,2) not null,
  customer_name text, payment_method text, payment_info jsonb, shift_id text, session_id text references store_sessions(id),
  terminal_id text, updated_at timestamptz not null default now()
);
create table stock_logs (
  id text primary key, date timestamptz not null, ingredient_id text not null references ingredients(id),
  change numeric(12,3) not null, type text not null, notes text
);
create table settings (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table stripe_events (id bigserial primary key, stripe_event_id text not null unique, type text not null, payload jsonb not null, created_at timestamptz not null default now());

create index orders_status_created_idx on orders (status, created_at desc);
create index shifts_status_opened_idx on shifts (status, opened_at desc);
create index stock_logs_ingredient_date_idx on stock_logs (ingredient_id, date desc);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger products_updated_at before update on products for each row execute function set_updated_at();
create trigger ingredients_updated_at before update on ingredients for each row execute function set_updated_at();
create trigger promotions_updated_at before update on promotions for each row execute function set_updated_at();
create trigger shifts_updated_at before update on shifts for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders for each row execute function set_updated_at();
create trigger sessions_updated_at before update on store_sessions for each row execute function set_updated_at();
create trigger settings_updated_at before update on settings for each row execute function set_updated_at();

create or replace function notify_pos_change() returns trigger language plpgsql as $$
declare row_id text;
begin
  row_id := case when TG_OP = 'DELETE' then OLD.id else NEW.id end;
  perform pg_notify('pos_changes', json_build_object('entity', TG_TABLE_NAME, 'eventType', TG_OP, 'id', row_id)::text);
  return coalesce(NEW, OLD);
end;
$$;
create trigger orders_changes after insert or update or delete on orders for each row execute function notify_pos_change();
create trigger shifts_changes after insert or update or delete on shifts for each row execute function notify_pos_change();
create trigger sessions_changes after insert or update or delete on store_sessions for each row execute function notify_pos_change();
