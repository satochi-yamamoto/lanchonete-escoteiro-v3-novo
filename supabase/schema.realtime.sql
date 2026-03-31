
-- Enable Realtime (Replication) for key tables
-- This allows the frontend to subscribe to changes (INSERT/UPDATE/DELETE)

begin;

  -- 1. Set Replica Identity to FULL (ensures we get the full row data on updates/deletes)
  alter table public.orders replica identity full;
  alter table public.stock_logs replica identity full;
  alter table public.shifts replica identity full;

  -- 2. Add tables to the supabase_realtime publication
  -- Note: This publication is created by default by Supabase, but we ensure our tables are in it.
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.orders, 
    public.stock_logs, 
    public.shifts,
    public.products,
    public.promotions,
    public.ingredients;

commit;
