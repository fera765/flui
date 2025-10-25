# 🚀 Quick Start Guide - FLUI Platform

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Iniciar Sistema

```bash
# Iniciar backend
cd /workspace
yarn dev
```

**Aguarde ver:**
```
✅ [Storage] Storage inicializado
✅ Cliente LLM inicializado
✅ 4 ferramentas registradas
✅ 0 MCPs carregados
✅ Rotas de webhooks registradas
✅ Rotas de crons registradas
✅ 0 cron(s) recarregado(s)
✅ Rotas de execution queue registradas
✅ ExecutionQueue conectada ao WebSocket
🚀 API Server rodando em http://localhost:3001
📡 WebSocket Server rodando em ws://localhost:3001
```

### 2️⃣ Acessar Frontend

```
http://localhost:5173
```

**Navegação:**
- Dashboard (/)
- Agents (/agents)
- MCPs (/mcps)
- Automations (/automations)
- Tools (/tools)
- **Executions** (/executions) ← **NOVO!**
- Settings (/settings)

---

## 🧪 Testar Funcionalidades

### ✅ TESTE 1: Webhook (5 min)

#### Via UI:
```
1. Ir em Automations → Create
2. Adicionar node "Webhook Trigger"
3. Duplo-clique no node
4. Configurar:
   - Method: POST
   - JSON Schema:
     - Click ADD
     - Key: name, Type: string, Required: ✓
     - Click ADD
     - Key: age, Type: number, Required: ✗
5. Click "Criar Webhook"
6. Copiar URL e Token (buttons de copy)
7. Abrir terminal
8. Executar CURL (exemplo já vem pronto)
9. Ir em /executions
10. Ver execução aparecer em tempo real!
```

#### Via Script:
```bash
./test-webhook-trigger.sh
# Duração: ~30s
# Testa tudo automaticamente
```

---

### ✅ TESTE 2: Cron (3 min + aguardar)

#### Via UI:
```
1. Adicionar node "Cron Trigger"
2. Duplo-clique no node
3. Selecionar preset: "A cada minuto"
4. Timezone: America/Sao_Paulo
5. Max Executions: 3
6. Click "Criar Cron"
7. Ver status: ⚫ Ativo (pulse verde)
8. Aguardar ~60 segundos
9. Ir em /executions
10. Ver execução automática!
```

#### Via Script:
```bash
./test-cron-trigger.sh
# Duração: ~80s (aguarda cron executar)
# Testa tudo automaticamente
```

---

### ✅ TESTE 3: Concorrência (2 min)

```bash
./test-concurrent-executions.sh
# Dispara 30 webhooks simultâneos
# Valida:
#   - Fila funciona
#   - Max 5 simultâneas
#   - Sandboxes isolados
```

---

## 🎨 Navegação Completa

### Sidebar Menu:

```
┌─────────────────────┐
│  📊 Dashboard       │
│  🤖 Agents          │
│  🧩 MCPs            │
│  🔄 Automations     │
│  ⚡ Tools           │
│  ✅ Executions      │ ← NOVO!
│  ⚙️  Settings        │
└─────────────────────┘
```

### Páginas Principais:

1. **Dashboard** - Visão geral
2. **Agents** - Criar/editar agentes AI
3. **MCPs** - Instalar Model Context Protocols
4. **Automations** - Criar/editar workflows
5. **Tools** - Ver ferramentas disponíveis
6. **Executions** - Monitorar execuções em tempo real
7. **Settings** - Configurar LLM

---

## 🔗 Webhook - Exemplo Real

### 1. Criar Webhook:

**Request:**
```bash
curl -X POST http://localhost:3001/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "automationId": "automation-xxx",
    "method": "POST",
    "jsonSchema": {
      "fields": [
        {"key": "user_id", "type": "string", "required": true},
        {"key": "action", "type": "string", "required": true},
        {"key": "data", "type": "json", "required": false}
      ]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "webhook": {
    "id": "webhook-abc123",
    "url": "http://localhost:3001/webhook/webhook-abc123",
    "secretToken": "64-char-hex-token",
    "curlExample": "curl -X POST ..."
  }
}
```

### 2. Disparar Webhook:

```bash
curl -X POST http://localhost:3001/webhook/webhook-abc123 \
  -H "X-Webhook-Secret: 64-char-hex-token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "12345",
    "action": "purchase",
    "data": {"product": "Pro Plan", "price": 99.90}
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook recebido e automação enfileirada",
  "executionId": "exec-123-abc",
  "executionStatus": "queued"
}
```

### 3. Ver Execução:

```bash
curl http://localhost:3001/api/executions/exec-123-abc
```

---

## ⏰ Cron - Exemplo Real

### 1. Criar Cron:

```bash
curl -X POST http://localhost:3001/api/crons \
  -H "Content-Type: application/json" \
  -d '{
    "automationId": "automation-xxx",
    "cronExpression": "0 9 * * *",
    "timezone": "America/Sao_Paulo",
    "enabled": true,
    "maxExecutions": 30,
    "triggerData": {
      "type": "daily_report",
      "recipients": ["admin@example.com"]
    }
  }'
```

**Resultado:**
- Executará todo dia às 09:00 (horário de São Paulo)
- Máximo 30 execuções (30 dias)
- Passa `triggerData` para automação

### 2. Controlar Cron:

```bash
# Parar
curl -X POST http://localhost:3001/api/crons/cron-xxx/stop

# Iniciar
curl -X POST http://localhost:3001/api/crons/cron-xxx/start

# Atualizar para executar a cada hora
curl -X PUT http://localhost:3001/api/crons/cron-xxx \
  -H "Content-Type: application/json" \
  -d '{"cronExpression": "0 * * * *"}'
```

---

## 📊 Monitorar Execuções

### Via UI:
```
http://localhost:5173/executions
```

**Ver:**
- 📊 Estatísticas em tempo real
- 📋 Lista de execuções
- 🔍 Filtros
- ⏱️ Auto-refresh (3s)

### Via API:
```bash
# Stats
curl http://localhost:3001/api/executions-stats

# Listar
curl http://localhost:3001/api/executions?limit=10

# Por automação
curl http://localhost:3001/api/executions?automationId=xxx

# Por status
curl http://localhost:3001/api/executions?status=running
```

---

## 🎯 Casos de Uso

### 1. E-commerce: Processar Pedidos
```
Webhook → Validar Pedido → Criar Fatura → Enviar Email
```

### 2. Marketing: Relatório Diário
```
Cron (9:00) → Buscar Dados → Gerar Relatório → Enviar Slack
```

### 3. DevOps: Deploy Automático
```
Webhook (GitHub) → Testar → Build → Deploy → Notificar
```

### 4. Suporte: Ticket Automation
```
Webhook (Zendesk) → Classificar → Atribuir → Responder
```

---

## ✅ Verificação Final

### Checklist:
- [ ] Servidor iniciou sem erros
- [ ] Frontend acessível em localhost:5173
- [ ] Sidebar tem item "Executions"
- [ ] Página /executions abre
- [ ] Stats cards aparecem
- [ ] test-webhook-trigger.sh passa
- [ ] test-cron-trigger.sh passa
- [ ] test-concurrent-executions.sh passa

**Se TODOS ✅ = Sistema 100% funcional!**

---

**Dúvidas?** Leia a documentação completa:
- `COMPLETE_TRIGGERS_IMPLEMENTATION.md`
- `TESTING_GUIDE.md`
- `WEBHOOK_IMPLEMENTATION_SUMMARY.md`

**Problemas?** Execute os scripts de teste primeiro!

---

✅ **SISTEMA COMPLETO E PRONTO PARA USO!** 🎉
