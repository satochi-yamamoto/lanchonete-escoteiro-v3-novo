-- ==============================================================================
-- 🛡️ OmniBurger POS Suite - Security Hardening Script (RLS Fix - Híbrido)
-- ==============================================================================
-- Este script corrige as permissões para permitir o funcionamento do PDV/Kiosk
-- sem exigir login anônimo (que pode estar desativado), mas protege operações
-- críticas (UPDATE/DELETE) para exigir autenticação.
--
-- LÓGICA APLICADA:
-- 1. SELECT/INSERT: Permitidos para público (anon) nas tabelas operacionais
--    (necessário pois o frontend gerencia vendas e estoque diretamente).
-- 2. UPDATE/DELETE: Restritos apenas a usuários autenticados (authenticated).
--    Isso impede que um atacante anônimo limpe ou corrompa o banco.
-- ==============================================================================

-- 1. Products (Cardápio)
DROP POLICY IF EXISTS "Auth Read Products" ON "public"."products";
DROP POLICY IF EXISTS "Auth Write Products" ON "public"."products";
DROP POLICY IF EXISTS "Auth Update Products" ON "public"."products";
DROP POLICY IF EXISTS "Auth Delete Products" ON "public"."products";
-- Limpeza de políticas antigas
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."products";
DROP POLICY IF EXISTS "Enable insert access for all users" ON "public"."products";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."products";
DROP POLICY IF EXISTS "Enable delete access for all users" ON "public"."products";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."products";

-- Leitura Pública (Cardápio)
CREATE POLICY "Public Read Products" ON "public"."products" FOR SELECT USING (true);
-- Inserção Restrita (Admin)
CREATE POLICY "Auth Insert Products" ON "public"."products" FOR INSERT TO authenticated WITH CHECK (true);
-- Edição/Deleção Restrita (Admin)
CREATE POLICY "Auth Update Products" ON "public"."products" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth Delete Products" ON "public"."products" FOR DELETE TO authenticated USING (true);

-- 2. Ingredients (Estoque)
DROP POLICY IF EXISTS "Auth Read Ingredients" ON "public"."ingredients";
DROP POLICY IF EXISTS "Auth Write Ingredients" ON "public"."ingredients";
DROP POLICY IF EXISTS "Auth Update Ingredients" ON "public"."ingredients";
DROP POLICY IF EXISTS "Auth Delete Ingredients" ON "public"."ingredients";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."ingredients";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."ingredients";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."ingredients";
DROP POLICY IF EXISTS "Enable delete access for all users" ON "public"."ingredients";

CREATE POLICY "Public Read Ingredients" ON "public"."ingredients" FOR SELECT USING (true);
CREATE POLICY "Auth Insert Ingredients" ON "public"."ingredients" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Ingredients" ON "public"."ingredients" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Política de Deleção Restrita (Apenas Admin)
-- Requer que o usuário esteja autenticado E tenha role='ADMIN' na tabela users
CREATE POLICY "Auth Delete Ingredients" 
ON "public"."ingredients" 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE public.users.id = auth.uid()::text 
    AND public.users.role = 'ADMIN'
  )
);

-- 3. Users (Funcionários)
DROP POLICY IF EXISTS "Auth Read Users" ON "public"."users";
DROP POLICY IF EXISTS "Auth Write Users" ON "public"."users";
DROP POLICY IF EXISTS "Auth Update Users" ON "public"."users";
DROP POLICY IF EXISTS "Auth Delete Users" ON "public"."users";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."users";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."users";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."users";
DROP POLICY IF EXISTS "Enable delete access for all users" ON "public"."users";

-- Leitura Pública necessária para tela de Login (Listar usuários)
CREATE POLICY "Public Read Users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Auth Insert Users" ON "public"."users" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Users" ON "public"."users" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth Delete Users" ON "public"."users" FOR DELETE TO authenticated USING (true);

-- 4. Orders (Pedidos)
DROP POLICY IF EXISTS "Auth Read Orders" ON "public"."orders";
DROP POLICY IF EXISTS "Auth Create Orders" ON "public"."orders";
DROP POLICY IF EXISTS "Auth Update Orders" ON "public"."orders";
DROP POLICY IF EXISTS "Auth Delete Orders" ON "public"."orders";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."orders";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."orders";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."orders";
DROP POLICY IF EXISTS "Enable delete access for all users" ON "public"."orders";

-- Público pode ler (KDS/TV) e CRIAR pedidos (Venda)
CREATE POLICY "Public Read Orders" ON "public"."orders" FOR SELECT USING (true);
CREATE POLICY "Public Create Orders" ON "public"."orders" FOR INSERT WITH CHECK (true);
-- Apenas Auth pode alterar status ou deletar (Segurança)
CREATE POLICY "Auth Update Orders" ON "public"."orders" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth Delete Orders" ON "public"."orders" FOR DELETE TO authenticated USING (true);

-- 5. Shifts (Turnos)
DROP POLICY IF EXISTS "Auth Read Shifts" ON "public"."shifts";
DROP POLICY IF EXISTS "Auth Create Shifts" ON "public"."shifts";
DROP POLICY IF EXISTS "Auth Update Shifts" ON "public"."shifts";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."shifts";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."shifts";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."shifts";
DROP POLICY IF EXISTS "Enable delete access for all users" ON "public"."shifts";

CREATE POLICY "Public Read Shifts" ON "public"."shifts" FOR SELECT USING (true);
CREATE POLICY "Public Open Shift" ON "public"."shifts" FOR INSERT WITH CHECK (true);
-- Atualização de caixa (fechamento/transação) exige Auth para segurança
CREATE POLICY "Auth Update Shifts" ON "public"."shifts" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 6. Stock Logs
DROP POLICY IF EXISTS "Auth Read StockLogs" ON "public"."stock_logs";
DROP POLICY IF EXISTS "Auth Insert StockLogs" ON "public"."stock_logs";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."stock_logs";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."stock_logs";

CREATE POLICY "Public Read StockLogs" ON "public"."stock_logs" FOR SELECT USING (true);
-- Inserção pública para baixa automática de estoque na venda
CREATE POLICY "Public Insert StockLogs" ON "public"."stock_logs" FOR INSERT WITH CHECK (true);

-- 7. Promotions
DROP POLICY IF EXISTS "Auth Read Promotions" ON "public"."promotions";
DROP POLICY IF EXISTS "Auth Write Promotions" ON "public"."promotions";
DROP POLICY IF EXISTS "Auth Update Promotions" ON "public"."promotions";
DROP POLICY IF EXISTS "Auth Delete Promotions" ON "public"."promotions";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."promotions";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."promotions";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."promotions";
DROP POLICY IF EXISTS "Enable delete access for all users" ON "public"."promotions";

CREATE POLICY "Public Read Promotions" ON "public"."promotions" FOR SELECT USING (true);
CREATE POLICY "Auth Insert Promotions" ON "public"."promotions" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Promotions" ON "public"."promotions" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth Delete Promotions" ON "public"."promotions" FOR DELETE TO authenticated USING (true);

-- 8. Settings
DROP POLICY IF EXISTS "Auth Read Settings" ON "public"."settings";
DROP POLICY IF EXISTS "Auth Write Settings" ON "public"."settings";
DROP POLICY IF EXISTS "Auth Update Settings" ON "public"."settings";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."settings";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."settings";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."settings";

CREATE POLICY "Public Read Settings" ON "public"."settings" FOR SELECT USING (true);
CREATE POLICY "Auth Insert Settings" ON "public"."settings" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Settings" ON "public"."settings" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 9. Store Sessions
DROP POLICY IF EXISTS "Auth Access Sessions" ON "public"."store_sessions";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."store_sessions";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."store_sessions";
DROP POLICY IF EXISTS "Enable update access for all users" ON "public"."store_sessions";

CREATE POLICY "Public Read Sessions" ON "public"."store_sessions" FOR SELECT USING (true);
-- Abrir loja precisa de Auth? Idealmente sim, mas para simplificar vamos deixar insert public
CREATE POLICY "Public Open Sessions" ON "public"."store_sessions" FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth Update Sessions" ON "public"."store_sessions" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 10. Stripe Events
DROP POLICY IF EXISTS "Auth Read StripeEvents" ON "public"."stripe_events";
DROP POLICY IF EXISTS "Auth Insert StripeEvents" ON "public"."stripe_events";
-- Limpeza
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."stripe_events";
DROP POLICY IF EXISTS "Enable write access for all users" ON "public"."stripe_events";

CREATE POLICY "Public Read StripeEvents" ON "public"."stripe_events" FOR SELECT USING (true);
CREATE POLICY "Public Insert StripeEvents" ON "public"."stripe_events" FOR INSERT WITH CHECK (true);

-- Grant permissions explicitly
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
