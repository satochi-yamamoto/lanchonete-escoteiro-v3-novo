-- Include store_sessions in Supabase Realtime so opening/closing the store
-- propagates to POS, KDS and other active terminals.

alter table public.store_sessions replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'store_sessions'
  ) then
    execute 'alter publication supabase_realtime add table public.store_sessions';
  end if;
end $$;
