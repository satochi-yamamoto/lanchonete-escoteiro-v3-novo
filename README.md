# Lanchonete Escoteiros POS Suite

PDV modular do Grupo Escoteiro Cooper Cotia. O frontend React/Vite é servido separadamente e usa uma API Node.js com PostgreSQL em Docker na VPS. O Supabase não faz parte da execução do sistema.

## Arquitetura

- `src/`: SPA React com POS, Admin, KDS, Kiosk e TV.
- `server/`: API Express. Valida PINs com hash `pgcrypto`, emite JWT de 12 horas e expõe SSE para pedidos, turnos e sessões em tempo real.
- `database/init/001_schema.sql`: esquema completo e gatilhos de atualização/realtime do PostgreSQL.
- `docker-compose.yml`: API e Postgres isolados; apenas a API é publicada em `127.0.0.1` para o proxy reverso da VPS.
- `scripts/export-supabase.mjs` e `scripts/import-postgres.mjs`: exportação pontual da origem e importação transacional no novo banco.

## Desenvolvimento do frontend

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Defina a URL pública da API em `.env.local`:

```env
VITE_API_URL=https://api.seu-dominio.com
```

Sem essa variável, o frontend mantém apenas o modo local/mock para desenvolvimento. Produção exige a API.

## Subir API e Postgres na VPS

1. Copie o projeto para um diretório isolado, por exemplo `/opt/lanchonete-escoteiro`.
2. Crie `/opt/lanchonete-escoteiro/.env` a partir de `.env.docker.example`, com senha de banco e `JWT_SECRET` únicos e com `CORS_ORIGINS` restrito aos domínios reais do frontend.
3. Valide e inicie:

```bash
docker compose config -q
docker compose up -d --build
curl -fsS http://127.0.0.1:8787/api/health
```

O Postgres não tem porta publicada. Configure o proxy reverso já existente na VPS para encaminhar somente o domínio HTTPS da API a `127.0.0.1:8787`.

## Migração de dados do Supabase

Faça a exportação enquanto a origem ainda está disponível; o arquivo contém dados operacionais e não deve ser versionado.

```powershell
npm run backup -- backups/supabase-export.json
```

Transfira o arquivo para `/opt/lanchonete-escoteiro/backups/supabase-export.json` na VPS e execute:

```bash
docker compose exec -T api node scripts/import-postgres.mjs /backups/supabase-export.json
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select 'products' as table, count(*) from products union all select 'orders', count(*) from orders union all select 'store_sessions', count(*) from store_sessions union all select 'users', count(*) from users;"
```

A importação é transacional, inclui `store_sessions` (ausente no backup legado) e converte PINs legados em hashes. Não desative a origem antes de comparar as contagens e validar o login, um pedido e a atualização entre dois terminais.

## Comandos

```bash
npm run build
npm run test
npm run backup -- backups/supabase-export.json
npm run import:postgres -- /backups/supabase-export.json
```

## Segurança

- Não publique Postgres na internet.
- Nunca versione `.env`, exportações ou chaves de serviço antigas.
- A lista inicial de usuários não contém PINs; operações de escrita e SSE exigem JWT emitido após o PIN.
- O reset do banco, alterações de usuários e a conclusão forçada de pedidos exigem o papel `ADMIN`.

## Operação sem internet

A versão web permanece online. A variante Windows usa **Tauri 2 + SQLite local + outbox persistida**: toda gravação é armazenada primeiro em `lanchonete-offline.db`; com conexão, a fila é transmitida à API e o estado remoto é recarregado na abertura, reconexão e a cada minuto. Sem rede, o caixa continua com o catálogo, usuários, turno e pedidos do último estado sincronizado.

```powershell
npm install
npm run desktop:dev
npm run desktop:build
```

O instalador NSIS é produzido em `src-tauri/target/release/bundle/nsis/`. Para gerar o executável, instale Rust MSVC e Microsoft C++ Build Tools/WebView2 no Windows; detalhes e o contrato de conflitos estão em [ADR-001](docs/adr/001-offline-first-windows.md). Não use SQLite/IndexedDB como réplica genérica de tabelas para pedidos, estoque ou caixa.
