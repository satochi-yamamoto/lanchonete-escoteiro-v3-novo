alter table public.shifts
  add column if not exists opening_product_cost_total numeric(10, 2),
  add column if not exists planned_normal_burgers integer,
  add column if not exists planned_vegan_burgers integer,
  add column if not exists opening_unit_cost_suggested numeric(10, 2),
  add column if not exists opening_unit_cost numeric(10, 2),
  add column if not exists daily_menu_name text,
  add column if not exists menu_name text,
  add column if not exists closer_name text;
