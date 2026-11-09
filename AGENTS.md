# FANTASTIC BNB — DIRETRIZES DE ENGENHARIA & QUALIDADE (AGENTS.md)
*Em conformidade com o Manual-Base de Engenharia de Produtos Digitais (Antigravity)*

Este documento estabelece as regras não negociáveis de arquitetura, segurança, design de experiência e código para o **Fantastic BNB**. Qualquer agente de IA ou desenvolvedor atuando neste repositório DEVE seguir rigorosamente estes princípios.

---

## 1. Princípios de Arquitetura & Backend
1. **Servidor como Autoridade Final (Single Source of Truth)**:
   - NUNCA confie em dados calculados ou validados apenas no frontend.
   - Cálculos de valores (faturamento, despesas, repasse de profissionais, lucros e margens) DEVEM ser executados ou recalculados pelo backend com `roundCurrency`.
2. **Zero Deleção Destrutiva em Produção (Auditabilidade)**:
   - Serviços (`jobs`) e registros críticos NUNCA são excluídos fisicamente do banco de dados (`DELETE FROM jobs`).
   - O cancelamento deve ser sempre um soft-delete lógico com preenchimento obrigatório de **motivo de cancelamento** (`cancellation_reason`), gravando log detalhado em `system_logs`.
3. **Integridade Transacional (ACID)**:
   - Operações financeiras em lote (geração de invoices, fechamento mensal, conciliação) devem usar transações SQLite (`BEGIN TRANSACTION ... COMMIT`).
4. **Resiliência a Rate Limits e APIs Externas**:
   - Integrações de e-mail (ex: Resend) e APIs de terceiros devem implementar tratamento de HTTP 429 (`rate_limit_exceeded`) com retry automático e backoff progressivo.
   - Alerta visual e bloqueio contra reenvio acidental (idempotência visual e de backend).

---

## 2. Design System & Frontend Mobile-First
1. **Regra de Ouro do Viewport: Zero Scroll Lateral**:
   - Todas as telas, tabelas e modais DEVEM se adaptar fluidamente a telas de 320px a 430px (smartphones) sem provocar rolagem horizontal (`overflow-x: hidden` / layout responsivo).
   - Tabelas complexas no mobile devem se transformar automaticamente em **Cards Premium** bem espaçados ou colunas colapsáveis.
2. **Respiro e Ergonomia Visual**:
   - Botões de ação em linhas e cards devem ter espaçamento mínimo (`gap: 6px` a `10px`) e área de toque mínima acessível de 44x44px.
   - Em cards mobile compactos (ex: KPIs financeiros), utilizar grid fluido de 2 colunas para otimização de espaço vertical.
3. **Quatro Estados Obrigatórios de Interface**:
   - Toda listagem, modal ou requisição assíncrona deve prever:
     - **Loading**: Skeleton ou spinner visível com feedback claro.
     - **Empty**: Mensagem orientadora quando não houver dados, com botão para ação primária.
     - **Error**: Alerta descritivo com opção de tentar novamente.
     - **Success**: Confirmação visual discreta (toast ou badge).

---

## 3. Segurança & Privacidade (OWASP / LGPD)
1. **Prevenção a Injeção**:
   - Sempre usar consultas SQL parametrizadas com placeholders (`?`).
   - Nunca interpolar variáveis diretamente em strings SQL.
2. **Sanitização XSS**:
   - Todos os dados provindos do usuário exibidos no DOM devem ser higienizados via `escapeHtml()`.
3. **Autenticação & Sessões**:
   - Cookies de sessão com flags `HttpOnly`, `SameSite=Lax` (ou `Strict`) e `Secure` em produção.
   - Rate limiting ativo em rotas sensíveis (`/api/login`).

---

## 4. Observabilidade & Rastreabilidade
1. Todas as mutações de status (cancelamentos, reatribuição de diarista, envio de faturas, alterações de valores) devem alimentar a tabela `system_logs`.
2. O painel de Auditoria deve permitir visualização transparente do histórico com identificação de quem fez, quando e por qual motivo.

---

## 5. Workflow de Entrega e Verificação
Antes de qualquer deploy ou commit:
1. `node --check server.js`
2. `node --check script.js`
3. `node --check client.js`
4. `node --check sw.js`
5. Atualizar a versão do Service Worker (`CACHE_NAME`) para garantir que o cliente não utilize cache antigo.
