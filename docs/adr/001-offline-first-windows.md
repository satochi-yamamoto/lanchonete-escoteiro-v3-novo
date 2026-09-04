# ADR-001: Operação offline com aplicativo Windows e SQLite

**Status:** Proposed

**Date:** 2026-09-03

**Deciders:** Grupo Escoteiro Cooper Cotia

## Context

Após a migração para a API Docker/PostgreSQL na VPS, os terminais precisam continuar registrando a operação quando não houver internet. O fluxo atual atualiza o estado Zustand e envia diversos `upsert`s independentes. Se a rede falha, a interface continua momentaneamente, mas esses dados não sobrevivem ao reinício e não existe fila, confirmação de entrega ou política de conflito.

O PostgreSQL da VPS continuará sendo a fonte de verdade compartilhada. O modo offline não pode usar "última gravação vence" para estoque, pedidos e caixa: uma venda envolve pedido, baixa de estoque, log de estoque e movimentação de turno que precisam ser aceitos uma única vez e na ordem correta.

## Decision

Criar uma distribuição Windows baseada em **Tauri 2 + React existente + SQLite local** após concluir e validar a migração do banco.

Cada instalação terá um `device_id` persistente e uma base SQLite no diretório de dados do aplicativo. A base terá uma réplica operacional limitada do catálogo, usuários autorizados para o dispositivo, sessão/turno ativo, pedidos necessários e uma **outbox** durável de comandos. O aplicativo atualiza primeiro a transação local e, quando houver conexão, sincroniza a outbox com a API. O servidor confirma a operação por chave de idempotência e publica as alterações consolidadas de volta ao dispositivo.

Não será feita sincronização de linhas genéricas do banco. A API receberá comandos de domínio transacionais, por exemplo `CHECKOUT`, `ORDER_STATUS_CHANGED`, `SHIFT_TRANSACTION`, `SHIFT_CLOSED` e `INVENTORY_ADJUSTED`.

## Options Considered

### Option A: PWA com IndexedDB

| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Operação sem internet | Good |
| Banco SQLite nativo | No |
| Instalação Windows | Browser-dependent |
| Confiabilidade no caixa | Medium |

**Pros:** sem instalador; pode reutilizar a SPA; IndexedDB suporta armazenamento offline e consultas locais.

**Cons:** armazenamento depende do navegador e suas políticas; não oferece SQLite nativo, integração com impressora e backup local são mais limitados; múltiplas abas aumentam risco operacional.

### Option B: SQLite WASM/OPFS no navegador

| Dimension | Assessment |
|---|---|
| Complexity | High |
| Operação sem internet | Good |
| Banco SQLite nativo | No, em WASM |
| Concorrência entre abas | Restricted |
| Adequação ao PDV | Low |

**Pros:** usa SQL no browser e dados persistem no OPFS quando suportado.

**Cons:** requer worker e compatibilidade específica do navegador; SQLite WASM documenta restrições de lock/concurrency e, em alguns modos, necessidade de headers COOP/COEP. É um cache do origin, não uma base Windows administrável.

### Option C: Tauri 2 + SQLite local + API/Postgres remoto

| Dimension | Assessment |
|---|---|
| Complexity | High, mas controlada |
| Operação sem internet | Excellent |
| Banco SQLite nativo | Yes |
| Instalação Windows | MSI ou NSIS |
| Adequação ao PDV | High |

**Pros:** mantém React; SQLite é arquivo local confiável; permite instalador, integração futura com impressora, backup local e identificação do terminal; o plugin SQL oficial suporta SQLite em Windows.

**Cons:** requer toolchain Rust/Windows para build e atualização de instaladores; adiciona ciclo de release desktop; sincronização deve ser implementada e testada como parte do domínio, não como cache genérico.

## Trade-off Analysis

A PWA pode ser um modo de contingência futuro, porém não resolve bem a necessidade principal: operação de caixa previsível em computadores Windows e recuperação após reinício. SQLite WASM/OPFS é tecnicamente viável, mas seus requisitos de worker, lock e compatibilidade entre abas aumentam o risco sem entregar os benefícios de um aplicativo desktop.

Tauri é a escolha recomendada porque a UI atual já é React, o banco local é SQLite real e a distribuição Windows é suportada por instaladores MSI ou NSIS. A complexidade adicional é justificada somente se o modo offline for tratado como uma função de operação, com fila, idempotência e resolução explícita de conflitos.

## Sync Contract

### Dados locais

- `sync_meta`: `device_id`, cursor remoto, última sincronização e versão do esquema.
- `outbox`: `operation_id`, sequência local, tipo de comando, payload JSON, criado em, tentativas, estado e último erro.
- Réplicas de leitura: catálogo, receitas, ingredientes, promoções, usuários autorizados, sessão/turno e pedidos da janela operacional.
- `conflicts`: operações que exigem revisão humana; nunca descartar automaticamente.

### API remota a criar

- `POST /api/sync/bootstrap`: entrega o snapshot inicial autorizado ao terminal e o cursor remoto.
- `POST /api/sync/push`: recebe lote ordenado de comandos com `device_id` e `operation_id`; responde por operação sem reexecutar duplicatas.
- `GET /api/sync/pull?cursor=...`: entrega mudanças remotas após o cursor, inclusive tombstones.
- Tabelas PostgreSQL de suporte: dispositivos autorizados, chaves de idempotência, log de mudanças e conflitos auditáveis.

`CHECKOUT` precisa se tornar uma operação atômica no servidor: cria o pedido, aplica movimentos de estoque e registra a transação de caixa no mesmo `BEGIN/COMMIT`. O código atual faz essas escritas separadamente e não é suficiente para sincronização offline segura.

### Regras de conflito

| Domínio | Regra |
|---|---|
| Pedido novo | UUID de cliente + idempotência; aceitar uma única vez. |
| Status do pedido | Transições validadas no servidor; estado terminal não retrocede sem comando administrativo. |
| Estoque | Sincronizar movimentos, nunca sobrescrever `current_stock`; servidor recalcula saldo. |
| Caixa/turno | Um terminal autorizado por turno offline; conflito de dois turnos abertos exige revisão. |
| Catálogo, preços e promoções | Servidor vence; terminal baixa a atualização antes da próxima venda. |
| Usuários e PINs | Não replicar PINs nem tokens; permitir offline somente a perfis previamente autorizados e protegidos no dispositivo. |

## Security and Recovery

- Proteger a chave local com recurso do sistema operacional (DPAPI/Stronghold), sem salvar PIN ou JWT em texto puro.
- Criptografar ou proteger o arquivo SQLite conforme o modelo de ameaça aprovado; limitar dados retidos no terminal.
- Fazer backup local exportável somente pelo administrador e validar restauração em ambiente de teste.
- Mostrar estado inequívoco: `ONLINE`, `OFFLINE — N operações pendentes`, `SINCRONIZANDO` e `CONFLITO REQUER REVISÃO`.

## Consequences

- O terminal opera sem internet e recupera operações após reinício.
- O backend deixa de aceitar `upsert` genérico como caminho para operações financeiras/estoque; comandos de domínio passam a ser obrigatórios.
- O primeiro piloto deve usar um único terminal offline por vez. Vários dispositivos desconectados podem vender simultaneamente, mas não podem garantir estoque ou caixa em tempo real.
- A versão web continua suportada online; ela não ganha SQLite nativo por esta decisão.

## Action Items

1. [ ] Concluir a migração Supabase para Postgres e comparar contagens antes de qualquer corte.
2. [ ] Implementar e testar os comandos transacionais de checkout, turno e inventário na API VPS.
3. [ ] Criar contrato de sync, migrations PostgreSQL e testes de idempotência/ordem/conflito.
4. [ ] Criar a casca Tauri 2 para Windows e o esquema SQLite/migrations locais.
5. [ ] Migrar o frontend para um repositório local + outbox e implementar bootstrap/push/pull.
6. [ ] Simular queda de rede, reinício do Windows, reenvio duplicado e conflito de turno antes do piloto.
7. [ ] Gerar instalador Windows, testar impressão e executar piloto com um terminal.

## References

- [SQLite WASM persistence and OPFS](https://sqlite.org/wasm/doc/tip/persistence.md)
- [Tauri SQL plugin with SQLite](https://v2.tauri.app/reference/javascript/sql/)
- [Tauri Windows installers](https://v2.tauri.app/distribute/windows-installer/)
