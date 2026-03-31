# Migrações de Banco de Dados

Para corrigir o problema de usuários não aparecendo e habilitar a funcionalidade de Escoteiros, você precisa executar os scripts SQL abaixo no **Editor SQL do Supabase**.

## 1. Corrigir Tabela de Usuários
Este script recria a tabela de usuários utilizando o padrão `UUID` (prática recomendada do Supabase) e insere os usuários padrão.

**Arquivo:** `supabase/migrations/20250218_fix_users_table.sql`

```sql
-- Recreate users table with UUID id
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
```

## 2. Criar Tabela de Escoteiros
Este script cria a tabela necessária para o gerenciamento de escoteiros.

**Arquivo:** `supabase/migrations/20250218_create_scouts_table.sql`

```sql
-- Recreate scouts table with UUID id
DROP TABLE IF EXISTS public.scouts CASCADE;

CREATE TABLE public.scouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    branch TEXT NOT NULL,
    patrol TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scouts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.scouts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.scouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.scouts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.scouts FOR DELETE USING (true);
```

---

Após executar estes scripts, recarregue a aplicação. Os usuários devem aparecer na tela de login e a aba de Escoteiros estará funcional.
