-- ==============================================================================
-- 🚑 Lanchonete Escoteiros POS Suite - EMERGENCY RESTORE ACCESS
-- ==============================================================================
-- Execute este script se você estiver vendo erros de "net::ERR_ABORTED" ou "401"
-- e não conseguir carregar os produtos.
--
-- O QUE ELE FAZ:
-- 1. Remove TODAS as políticas de segurança (RLS) das tabelas principais.
-- 2. Cria políticas de LEITURA PÚBLICA (Qualquer um pode ler).
-- 3. Cria políticas de ESCRITA PÚBLICA (Qualquer um pode vender/abrir caixa).
-- ==============================================================================

-- 1. Products
DROP POLICY IF EXISTS "Auth Read Products" ON "public"."products";
DROP POLICY IF EXISTS "Auth Write Products" ON "public"."products";
DROP POLICY IF EXISTS "Auth Update Products" ON "public"."products";
DROP POLICY IF EXISTS "Auth Delete Products" ON "public"."products";
DROP POLICY IF EXISTS "Public Read Products" ON "public"."products";

CREATE POLICY "Public Read Products" ON "public"."products" FOR SELECT USING (true);
CREATE POLICY "Public Write Products" ON "public"."products" FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Products" ON "public"."products" FOR UPDATE USING (true);
CREATE POLICY "Public Delete Products" ON "public"."products" FOR DELETE USING (true);

-- 2. Ingredients
DROP POLICY IF EXISTS "Auth Read Ingredients" ON "public"."ingredients";
DROP POLICY IF EXISTS "Auth Write Ingredients" ON "public"."ingredients";
DROP POLICY IF EXISTS "Public Read Ingredients" ON "public"."ingredients";

CREATE POLICY "Public Read Ingredients" ON "public"."ingredients" FOR SELECT USING (true);
CREATE POLICY "Public Write Ingredients" ON "public"."ingredients" FOR ALL USING (true);

-- 3. Users
DROP POLICY IF EXISTS "Auth Read Users" ON "public"."users";
DROP POLICY IF EXISTS "Public Read Users" ON "public"."users";

CREATE POLICY "Public Read Users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Public Write Users" ON "public"."users" FOR ALL USING (true);

-- 4. Orders
DROP POLICY IF EXISTS "Auth Read Orders" ON "public"."orders";
DROP POLICY IF EXISTS "Public Read Orders" ON "public"."orders";

CREATE POLICY "Public Read Orders" ON "public"."orders" FOR SELECT USING (true);
CREATE POLICY "Public Write Orders" ON "public"."orders" FOR ALL USING (true);

-- 5. Shifts
DROP POLICY IF EXISTS "Auth Read Shifts" ON "public"."shifts";
DROP POLICY IF EXISTS "Public Read Shifts" ON "public"."shifts";

CREATE POLICY "Public Read Shifts" ON "public"."shifts" FOR SELECT USING (true);
CREATE POLICY "Public Write Shifts" ON "public"."shifts" FOR ALL USING (true);

-- 6. Promotions
DROP POLICY IF EXISTS "Auth Read Promotions" ON "public"."promotions";
DROP POLICY IF EXISTS "Public Read Promotions" ON "public"."promotions";

CREATE POLICY "Public Read Promotions" ON "public"."promotions" FOR SELECT USING (true);
CREATE POLICY "Public Write Promotions" ON "public"."promotions" FOR ALL USING (true);

-- 7. Settings
DROP POLICY IF EXISTS "Auth Read Settings" ON "public"."settings";
DROP POLICY IF EXISTS "Public Read Settings" ON "public"."settings";

CREATE POLICY "Public Read Settings" ON "public"."settings" FOR SELECT USING (true);
CREATE POLICY "Public Write Settings" ON "public"."settings" FOR ALL USING (true);

-- 8. Stock Logs
DROP POLICY IF EXISTS "Auth Read StockLogs" ON "public"."stock_logs";
DROP POLICY IF EXISTS "Public Read StockLogs" ON "public"."stock_logs";

CREATE POLICY "Public Read StockLogs" ON "public"."stock_logs" FOR SELECT USING (true);
CREATE POLICY "Public Write StockLogs" ON "public"."stock_logs" FOR ALL USING (true);

-- 9. Store Sessions
DROP POLICY IF EXISTS "Auth Access Sessions" ON "public"."store_sessions";
DROP POLICY IF EXISTS "Public Read Sessions" ON "public"."store_sessions";
DROP POLICY IF EXISTS "Public Access Sessions" ON "public"."store_sessions";

CREATE POLICY "Public Access Sessions" ON "public"."store_sessions" FOR ALL USING (true);

-- Garantir permissões finais
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
