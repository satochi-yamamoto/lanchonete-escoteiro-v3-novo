-- Recreate users table with TEXT id to support mock data (u1, u2, etc)
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN')),
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.users FOR DELETE USING (true);

-- Seed initial users
INSERT INTO public.users (id, name, role, pin) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Admin', 'ADMIN', '0000'),
('550e8400-e29b-41d4-a716-446655440002', 'Gerente João', 'MANAGER', '1234'),
('550e8400-e29b-41d4-a716-446655440003', 'Caixa 01', 'CASHIER', '1111'),
('550e8400-e29b-41d4-a716-446655440004', 'Cozinha', 'KITCHEN', '2222')
ON CONFLICT (id) DO NOTHING;
