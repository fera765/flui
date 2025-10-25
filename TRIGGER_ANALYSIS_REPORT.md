# 🔍 Análise dos Triggers - Problemas Identificados

## ❌ WEBHOOK TRIGGER - Problemas Críticos

### 1. **Webhook criado mas não funciona**
```typescript
// webhookTrigger.ts linha 184
activeWebhooks.set(webhookId, webhookConfig); // ✅ Salva em memória

// ❌ PROBLEMA: Não há rota no apiServer.ts para receber requisições!
// Quando alguém chama POST /webhook/xxx não existe endpoint registrado
```

### 2. **Não persiste webhooks**
```typescript
const activeWebhooks = new Map<string, WebhookConfig>(); // ❌ Apenas em memória

// PROBLEMA: Se reiniciar servidor = perde todos os webhooks
```

### 3. **Não dispara automação**
```typescript
// handleWebhookRequest() linha 289
// ✅ Valida requisição
// ✅ Retorna dados
// ❌ NÃO EXECUTA A AUTOMAÇÃO!
```

### 4. **Webhook não tem JSON schema**
- Usuário não consegue definir campos esperados
- Não valida payload recebido
- `jsonObject` (ADD button) não implementado

---

## ❌ CRON TRIGGER - Problemas Críticos

### 1. **Cron agendado mas não executa automação**
```typescript
// cronTrigger.ts linha 143
const task = cron.schedule(
  cronExpression,
  async () => {
    executionCount++;
    console.log(`⏰ [Cron Trigger] Executando...`);
    
    // ❌ LINHA 156: "implementação futura: callback para ExecutionEngine"
    // NÃO FAZ NADA!
  }
);
```

### 2. **Não persiste agendamentos**
```typescript
const activeCronTasks = new Map<string, any>(); // ❌ Apenas em memória

// PROBLEMA: Se reiniciar servidor = perde todos os agendamentos
```

### 3. **Não recarrega ao iniciar servidor**
- Automações com cron trigger devem ser reativadas ao iniciar
- Atualmente: se reiniciar servidor, cron para de funcionar

### 4. **Timezone não é usado**
```typescript
const timezone = params.timezone || 'America/Sao_Paulo'; // ✅ Recebe
// ❌ MAS NÃO USA! cron.schedule não recebe timezone
```

---

## ❌ EXECUÇÃO EM BACKGROUND - Problemas

### 1. **Execuções são síncronas**
```typescript
// apiServer.ts - POST /api/automations/:id/execute
const result = await engine.execute(req.body.initialData || {});
// ❌ Bloqueia até terminar
// ❌ Se rodar 2 automações ao mesmo tempo, a 2ª espera a 1ª
```

### 2. **Sandbox não é isolado por execução**
```typescript
const sandboxPath = await sandboxManager.createSandbox({
  automationId: automation.id, // ❌ Usa ID da automação
  // PROBLEMA: Se rodar mesma automação 2x ao mesmo tempo = conflito!
});
```

### 3. **Sem fila de execução**
- Múltiplas requisições simultâneas competem
- Não tem controle de concorrência
- Não tem retry em caso de falha

---

## 🎯 Solução Proposta

### FASE 1: Webhook Trigger ✅
1. ✅ Criar rotas dinâmicas no apiServer
2. ✅ Persistir webhooks no storage (conf)
3. ✅ Implementar JSON schema validation
4. ✅ Disparar automação ao receber webhook
5. ✅ Regenerar token
6. ✅ Testar via CURL

### FASE 2: Cron Trigger ✅
1. ✅ Disparar automação ao executar cron
2. ✅ Persistir agendamentos ativos
3. ✅ Recarregar agendamentos ao iniciar servidor
4. ✅ Implementar timezone corretamente
5. ✅ Testar com múltiplas expressões cron

### FASE 3: Execução em Background ✅
1. ✅ Criar ExecutionQueue (fila de execuções)
2. ✅ Sandboxes isolados por execução (não por automação)
3. ✅ Worker threads ou child processes
4. ✅ Limite de concorrência configurável
5. ✅ Retry automático em falhas

### FASE 4: Frontend ✅
1. ✅ UI para definir JSON schema do webhook
2. ✅ Botão "Regenerate Token"
3. ✅ Cron expression builder/helper
4. ✅ Preview de próximas execuções

---

## 📊 Arquitetura Proposta

### Webhook Storage:
```typescript
interface WebhookConfig {
  id: string;
  automationId: string;
  path: string;
  method: string;
  secretToken: string;
  jsonSchema?: {
    fields: Array<{
      key: string;
      type: 'string' | 'number' | 'boolean' | 'json' | 'array';
      required: boolean;
      description?: string;
    }>;
  };
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}
```

### Cron Storage:
```typescript
interface CronConfig {
  id: string;
  automationId: string;
  cronExpression: string;
  timezone: string;
  triggerData: any;
  enabled: boolean;
  maxExecutions: number;
  executionCount: number;
  createdAt: string;
  lastExecutedAt?: string;
}
```

### Execution Queue:
```typescript
interface QueuedExecution {
  id: string;
  automationId: string;
  triggerType: 'manual' | 'webhook' | 'cron';
  triggerData: any;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retries: number;
  maxRetries: number;
}
```

---

## 🧪 Plano de Testes

### Webhook:
```bash
# 1. Criar webhook
curl -X POST http://localhost:3001/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"automationId": "xxx", "method": "POST"}'

# 2. Disparar webhook
curl -X POST http://localhost:3001/webhook/xxx \
  -H "X-Webhook-Secret: token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "value": 123}'

# 3. Validar execução
curl -X GET http://localhost:3001/api/executions/xxx
```

### Cron:
```bash
# 1. Criar cron
curl -X POST http://localhost:3001/api/crons \
  -H "Content-Type: application/json" \
  -d '{
    "automationId": "xxx",
    "cronExpression": "*/1 * * * *",
    "timezone": "America/Sao_Paulo"
  }'

# 2. Aguardar 1 minuto

# 3. Verificar execuções
curl -X GET http://localhost:3001/api/executions?automationId=xxx
```

### Background:
```bash
# 1. Disparar 5 automações simultâneas
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/automations/xxx/execute &
done

# 2. Verificar que todas executam sem conflito
# 3. Verificar sandboxes separados
ls /path/to/sandboxes
```

---

**Prioridade:** 🔴 CRÍTICO  
**Impacto:** ⚠️ ALTO - Funcionalidades não funcionam  
**Status:** 📝 Análise completa - Iniciando implementação
