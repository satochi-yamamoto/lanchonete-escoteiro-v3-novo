-- Planejamento de abertura: promoção parametrizada dos lanches do dia.
alter table public.shifts
  add column if not exists opening_promotion_quantity integer,
  add column if not exists opening_promotion_value numeric(10, 2);
