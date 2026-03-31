
-- Create store_sessions table to track business days
create table if not exists public.store_sessions (
  id text primary key,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null check (status in ('OPEN', 'CLOSED')),
  opened_by text not null,
  closed_by text,
  notes text,
  updated_at timestamptz not null default now()
);

-- Enable RLS for store_sessions
alter table public.store_sessions enable row level security;

-- Add RLS Policies for store_sessions (permissive for demo)
create policy "Enable read access for all users" on public.store_sessions for select using (true);
create policy "Enable write access for all users" on public.store_sessions for insert with check (true);
create policy "Enable update access for all users" on public.store_sessions for update using (true);

-- Add session_id to orders
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='session_id') then
    alter table public.orders add column session_id text references public.store_sessions(id);
  end if;
end $$;

-- Add session_id to shifts
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='shifts' and column_name='session_id') then
    alter table public.shifts add column session_id text references public.store_sessions(id);
  end if;
end $$;

-- Add store_sessions to realtime publication
alter publication supabase_realtime add table public.store_sessions;
