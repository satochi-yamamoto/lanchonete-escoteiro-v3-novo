-- Enable RLS on all tables
alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.stock_logs enable row level security;
alter table public.users enable row level security;
alter table public.scouts enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.shifts enable row level security;
alter table public.settings enable row level security;
alter table public.stripe_events enable row level security;

-- Create Policies (PERMISSIVE for Demo/Dev Context)
-- In a real production environment, you should restrict write access to authenticated users only
-- or use specific roles. For this POS demo, we allow 'anon' to read/write to simulate
-- the terminal access without complex auth flows.

-- Products: Everyone can read, only anon/auth can modify (effectively open for POS demo)
create policy "Enable read access for all users" on public.products for select using (true);
create policy "Enable write access for all users" on public.products for insert with check (true);
create policy "Enable update access for all users" on public.products for update using (true);
create policy "Enable delete access for all users" on public.products for delete using (true);

-- Ingredients: Same as products
create policy "Enable read access for all users" on public.ingredients for select using (true);
create policy "Enable write access for all users" on public.ingredients for insert with check (true);
create policy "Enable update access for all users" on public.ingredients for update using (true);
create policy "Enable delete access for all users" on public.ingredients for delete using (true);

-- Stock Logs: Same
create policy "Enable read access for all users" on public.stock_logs for select using (true);
create policy "Enable write access for all users" on public.stock_logs for insert with check (true);

-- Users (Staff): Same
create policy "Enable read access for all users" on public.users for select using (true);
create policy "Enable write access for all users" on public.users for insert with check (true);
create policy "Enable update access for all users" on public.users for update using (true);
create policy "Enable delete access for all users" on public.users for delete using (true);

-- Scouts: Same
create policy "Enable read access for all users" on public.scouts for select using (true);
create policy "Enable write access for all users" on public.scouts for insert with check (true);
create policy "Enable update access for all users" on public.scouts for update using (true);
create policy "Enable delete access for all users" on public.scouts for delete using (true);

-- Promotions: Same
create policy "Enable read access for all users" on public.promotions for select using (true);
create policy "Enable write access for all users" on public.promotions for insert with check (true);
create policy "Enable update access for all users" on public.promotions for update using (true);
create policy "Enable delete access for all users" on public.promotions for delete using (true);

-- Orders: Same
create policy "Enable read access for all users" on public.orders for select using (true);
create policy "Enable write access for all users" on public.orders for insert with check (true);
create policy "Enable update access for all users" on public.orders for update using (true);

-- Shifts: Same
create policy "Enable read access for all users" on public.shifts for select using (true);
create policy "Enable write access for all users" on public.shifts for insert with check (true);
create policy "Enable update access for all users" on public.shifts for update using (true);

-- Settings: Same
create policy "Enable read access for all users" on public.settings for select using (true);
create policy "Enable write access for all users" on public.settings for insert with check (true);
create policy "Enable update access for all users" on public.settings for update using (true);

-- Stripe Events: Same
create policy "Enable read access for all users" on public.stripe_events for select using (true);
create policy "Enable write access for all users" on public.stripe_events for insert with check (true);

-- Grant permissions explicitly (Redundant if default privileges are set, but safe)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
