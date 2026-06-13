-- Planejamento de abertura: quantidade de lanches reservados para Chefes
-- e o restante destinado a Escoteiros/Extra (= (normal + vegano) - chefes).
alter table public.shifts
  add column if not exists planned_chefe_burgers integer,
  add column if not exists planned_escoteiro_extra_burgers integer;
