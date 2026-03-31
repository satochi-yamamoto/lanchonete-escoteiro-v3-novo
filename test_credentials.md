# 🔐 Credenciais de Teste - OmniBurger POS Suite

Este documento contém todas as credenciais de usuários de teste do sistema.

## 📋 Usuários Disponíveis

### Usuários do Sistema

| Nome | Role | PIN | Email | Permissões |
|------|------|-----|-------|------------|
| **Admin** | ADMIN | `0000` | admin@test.com | Acesso total ao sistema, incluindo Admin Backoffice |
| **Gerente João** | MANAGER | `0000` | gerente@test.com | Acesso a POS, KDS, TV, relatórios |
| **Caixa 01** | CASHIER | `0000` | caixa01@test.com | Acesso a POS (Terminal de Vendas) |
| **Cozinha** | KITCHEN | `0000` | cozinha@test.com | Acesso a KDS (Kitchen Display System) |

### Modo Convidado

O **Kiosk (Totem de Autoatendimento)** pode ser acessado sem autenticação:
- Adicione `?mode=kiosk` na URL: `http://localhost:5173?mode=kiosk`
- Ou use o botão "Modo Totem" na tela inicial (quando disponível)

---

## 🎭 Perfis e Acessos

### ADMIN (Administrador)
- ✅ POS (Terminal PDV)
- ✅ Kiosk (Totem)
- ✅ KDS (Cozinha)
- ✅ TV (Painel Público)
- ✅ Admin Backoffice (Gestão completa)

**Use este perfil para:** Configuração inicial, testes de gestão, acesso completo

---

### MANAGER (Gerente)
- ✅ POS (Terminal PDV)
- ✅ Kiosk (Totem)
- ✅ KDS (Cozinha)
- ✅ TV (Painel Público)
- ❌ Admin Backoffice (acesso limitado)

**Use este perfil para:** Operações diárias, supervisão de vendas

---

### CASHIER (Caixa)
- ✅ POS (Terminal PDV)
- ✅ Kiosk (Totem)
- ❌ KDS (Cozinha)
- ✅ TV (Painel Público)
- ❌ Admin Backoffice

**Use este perfil para:** Testes de operação de caixa, vendas

---

### KITCHEN (Cozinha)
- ❌ POS (Terminal PDV)
- ❌ Kiosk (Totem)
- ✅ KDS (Cozinha)
- ✅ TV (Painel Público)
- ❌ Admin Backoffice

**Use este perfil para:** Testes de preparo de pedidos, gestão de fila de produção

---

## 🧪 Credenciais para Testes Automatizados

### TestSprite / Playwright

Use o PIN `0000` para todos os usuários nos testes automatizados.

Exemplo de fluxo de login em testes:

```python
# Selecionar usuário
await page.click("text=Admin")

# Entrar PIN 0000
for digit in "0000":
    await page.click(f"button:has-text('{digit}')")

# Aguardar redirecionamento
await page.wait_for_selector("text=Selecione um módulo")
```

---

## 🔄 Resetar Dados de Teste

Para limpar e repopular dados de teste:

1. Acesse o Admin Backoffice com usuário Admin
2. No modo DEV, clique em "🌱 Popular Dados de Teste"
3. Para limpar: "🧹 Limpar Dados de Teste"

---

## 🔒 Segurança

⚠️ **IMPORTANTE:** Estes PINs são apenas para ambiente de desenvolvimento e testes!

**NUNCA use estes PINs em produção!**

Em produção:
- Configure PINs fortes de 4 dígitos únicos
- Implemente política de rotação de PINs
- Adicione tentativas limitadas e bloqueio
- Use hash/criptografia no backend

---

## 📞 Suporte

Para problemas com autenticação ou credenciais:
1. Verifique se está usando o PIN correto: `0000`
2. Confirme que o usuário existe em `src/services/mockData.ts`
3. Limpe o cache do navegador e tente novamente

**Última atualização:** 09/03/2026
