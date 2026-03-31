alter table public.shifts
  add column if not exists drinks_liters numeric(10, 2),
  add column if not exists burger_cost numeric(10, 2),
  add column if not exists burgers_produced integer,
  add column if not exists burgers_unsold integer,
  add column if not exists feedback text;
