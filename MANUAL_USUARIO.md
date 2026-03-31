# Manual do Usuário - Lanchonete Escoteiros POS Suite

Bem-vindo ao Lanchonete Escoteiros POS Suite! Este guia rápido ajudará você a operar o sistema de forma simples e eficiente.

---

## 1. Visão Geral

O sistema é dividido em módulos integrados:
*   **Terminal PDV**: Frente de caixa para operadores.
*   **Totem Autoatendimento**: Interface para o cliente fazer o próprio pedido.
*   **KDS (Cozinha)**: Monitor de preparo de pedidos.
*   **Status TV**: Painel de senhas para os clientes acompanharem.
*   **Admin Backoffice**: Gestão da loja, cardápio, estoque e relatórios.

---

## 2. Fluxo Diário de Operação (Passo a Passo)

Para o sistema funcionar corretamente, siga esta ordem diária:

1.  **Abrir a Loja (Admin)**: Um gerente deve iniciar o expediente no módulo Admin.
2.  **Abrir o Caixa (PDV)**: O operador de caixa inicia seu turno informando o fundo de troco.
3.  **Operação**: Realize vendas no PDV ou Totem. A cozinha recebe os pedidos no KDS.
4.  **Fechar o Caixa (PDV)**: Ao final do turno, o operador fecha o caixa e emite o Relatório Z.
5.  **Fechar a Loja (Admin)**: O gerente encerra o expediente do dia.

---

## 3. Instruções por Módulo

### 🏢 Admin Backoffice (Gestão)

**Como Abrir a Loja:**
1.  Acesse o módulo **Admin Backoffice**.
2.  No Dashboard, localize o painel **Controle da Loja** (topo da tela).
3.  Clique em **ABRIR LOJA** e confirme o usuário responsável.
    *   *Nota: Sem abrir a loja, o PDV e o KDS ficarão bloqueados.*

**Principais Funcionalidades:**
*   **Produtos**: Cadastre novos itens, altere preços e adicione fotos.
*   **Estoque**: Ajuste quantidades de ingredientes e registre entradas de mercadoria.
*   **Relatórios**: Visualize vendas por período, produtos mais vendidos e performance.

---

### 🖥️ Terminal PDV (Caixa)

**Abertura de Caixa:**
1.  Selecione o módulo **Terminal PDV**.
2.  Se a loja estiver aberta, você verá a tela de abertura.
3.  Informe seu **Nome**, **ID do Terminal** (ex: CX-01) e o **Fundo de Caixa** (dinheiro inicial).
4.  Clique em **ABRIR CAIXA**.

**Realizando uma Venda:**
1.  Toque nos produtos no catálogo (centro da tela) para adicionar ao carrinho.
2.  Use o painel à direita para ajustar quantidades ou adicionar observações.
3.  Clique em **PAGAR**.
4.  Selecione o método de pagamento (Dinheiro, Crédito, Débito, PIX).
5.  Confirme o recebimento para finalizar.

**Funções Extras (Menu Lateral):**
*   **⚙️ Ajustes (Shift)**: Para registrar **Sangria** (retirada de dinheiro) ou **Suprimento** (entrada de troco).
*   **🔴 Fechar Turno**: Encerra suas atividades e exibe o resumo financeiro do caixa.

---

### 🍳 KDS (Monitor de Cozinha)

O KDS substitui as impressoras de cozinha.

1.  Os pedidos chegam automaticamente na coluna **RECEBIDOS**.
    *   *Alerta sonoro e visual avisa sobre novos pedidos.*
2.  **Preparando**: Toque no botão "Preparar" (ou seta) para mover o pedido para produção.
3.  **Pronto**: Quando finalizar, toque em "Pronto". Isso move o pedido para a tela de entrega e avisa na TV.
4.  **Filtros**: Use os botões no topo (GRILL, FRITADEIRA, MONTAGEM) para filtrar itens por estação.

---

### 📺 Status TV (Painel de Senhas)

*   Mantenha este módulo aberto em uma TV voltada para o salão.
*   Ele mostra automaticamente os pedidos **Preparando** e **Pronto**.
*   Quando um pedido fica "Pronto" no KDS, ele pisca na TV e toca um som de chamada.

---

## 4. Dicas e Soluções de Problemas

*   **Modo Demo/Local**: Se o sistema avisar que está em "Modo Demo", verifique sua conexão com a internet ou as configurações do banco de dados (`.env`).
*   **Impressão**: O sistema utiliza impressão nativa do navegador. Certifique-se de que a impressora térmica está definida como padrão no sistema operacional.
*   **Sair do Sistema**: Use o botão flutuante "Trocar Módulo" (canto inferior esquerdo) ou o botão de Logoff no menu principal para trocar de usuário/tela.

---
*Lanchonete Escoteiros POS Suite - Simplificando sua operação.*
