-- Planejamento de abertura: litros de bebida previstos para o turno.
alter table public.shifts
  add column if not exists opening_drinks_liters numeric(10, 2);
