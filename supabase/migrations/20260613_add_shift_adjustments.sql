-- Histórico de ajustes feitos no fechamento do caixa em relação ao
-- planejado na abertura (cardápio, custo do lanche e total produzido).
-- Cada item do array: { id, field, label, previous_value, new_value, changed_at, changed_by }
alter table public.shifts
  add column if not exists adjustments jsonb not null default '[]'::jsonb;
