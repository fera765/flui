# 🔍 DIAGNÓSTICO - Sistema de Persistência FLUI

## 📊 ANÁLISE DO SISTEMA ATUAL

### ✅ O QUE JÁ ESTÁ IMPLEMENTADO

#### 1. Sistema de Persistência (Backend)
- **Storage:** `source/store/automationStorage.ts`
- **Método:** Conf (electron-store) - JSON file-based
- **Funções:**
  - `getAutomations()` ✅
  - `getAutomation(id)` ✅
  - `saveAutomation(automation)` ✅
  - `deleteAutomation(id)` ✅

#### 2. Execução de Fluxo (Backend)
- **Engine:** `FlowEngineV2` ✅
- **Features:**
  - Execução sequencial com topological sort ✅
  - Resolução de referências `{{nodeId.key}}` ✅
  - Propagação de outputs entre nodes ✅
  - Logs detalhados ✅
  - Método `executeUntilNode()` para testes ✅

#### 3. API Endpoints
- `GET /api/automations` ✅
- `POST /api/automations` ✅
- `GET /api/automations/:id` ✅
- `PUT /api/automations/:id` ✅
- `DELETE /api/automations/:id` ✅
- `POST /api/automations/:id/execute` ✅
- `POST /api/automations/:id/nodes/:nodeId/test` ✅

#### 4. Frontend
- **OutputSelector:** UI para selecionar keys de nodes pai ✅
- **CreateAutomationV2:** Editor visual ✅
- **NodeConfigPanel:** Configuração de nodes ✅
- **Modo híbrido:** Local + API para outputs ✅

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. Schema de Persistência Incompleto

**Problema:** Tipo `Automation` pode não incluir todos os campos necessários

**Verificar:**
```typescript
// source/types/automation.ts
interface Automation {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];           // ✅ Presente
  edges: Edge[];           // ✅ Presente (mas chamado de connections em alguns lugares)
  initialData?: any;       // ⚠️ FALTA VALIDAÇÃO
  config?: any;            // ⚠️ Pode ser perdido
  createdAt?: string;
  updatedAt?: string;
}
```

**Ação Necessária:**
- Adicionar campos obrigatórios com defaults
- Garantir que `initialData` sempre exista (mesmo que `{}`)
- Adicionar `schemaVersion` para migrations

### 2. Falta de Validação ao Salvar

**Problema:** `saveAutomation()` não valida estrutura antes de persistir

**Código Atual:**
```typescript
export const saveAutomation = (automation: Automation): void => {
  const automations = getAutomations();
  const index = automations.findIndex((a) => a.id === automation.id);
  if (index >= 0) {
    automations[index] = automation;  // ❌ Sem validação!
  } else {
    automations.push(automation);      // ❌ Sem validação!
  }
  config.set('automations', automations);
};
```

**Ação Necessária:**
- Validar campos obrigatórios
- Garantir defaults para campos opcionais
- Adicionar timestamp de update

### 3. Endpoint de Save sem Validação

**Problema:** API aceita qualquer payload

**Ação Necessária:**
- Adicionar validação com Zod ou similar
- Retornar erros claros
- Sanitizar dados

### 4. Falta de Migração de Dados Legados

**Problema:** Automações antigas podem ter schema diferente

**Ação Necessária:**
- Detectar versão do schema
- Converter automaticamente
- Adicionar `initialData: {}` se ausente

---

## 🎯 CARDS DO KANBAN - STATUS ATUAL

### ✅ CONCLUÍDOS (Already Implemented)

- **B-003:** Endpoint de execução autônoma ✅
  - `POST /api/automations/:id/execute` implementado
  - FlowEngineV2 executa todo o fluxo
  - Logs completos retornados

- **F-001:** Modelagem de nós: inputBindings e outputKeys ✅
  - Referências `{{nodeId.key}}` funcionando
  - `nodeOutputExtractor.ts` define outputs por tool
  - Sistema de resolução implementado

- **B-004:** Propagação de dados em cascata ✅
  - FlowEngineV2 armazena outputs em Map
  - Resolve referências antes de executar cada node
  - Topological sort garante ordem correta

- **FE-001:** Frontend salvar/recuperar e UI de binding ✅
  - OutputSelector permite selecionar keys
  - Modo híbrido (local + API)
  - Save/load via API

### 🔧 EM PROGRESSO

- **A-001:** Diagnóstico inicial ⏳
  - Este documento é parte do diagnóstico
  - Próximo: reproduzir erro específico

### ❌ PENDENTES (To Do)

- **B-001:** Corrigir persistência de automações ❌
  - Adicionar validação
  - Garantir todos os campos
  - Testes unitários

- **B-002:** Garantir reconstrução correta ao carregar ❌
  - Defaults para campos ausentes
  - Migration de schema legado
  - Fail-safe checks

- **QA-001:** Testes E2E ❌
  - Suíte completa de testes
  - Casos de borda
  - Performance

---

## 🔬 TESTE DE REPRODUÇÃO

### Cenário 1: Salvar e Reabrir Automação

**Passos:**
```
1. Criar nova automação com 3 nodes
2. Node 1: Webhook Trigger
3. Node 2: Data Transform (usa {{node-1.data}})
4. Node 3: Email Sender (usa {{node-2.result}})
5. Salvar automação
6. Recarregar página
7. Abrir automação salva
8. Verificar se nodes mostram configurações corretas
9. Executar automação
10. Verificar se não dá erro "cannot read initialData"
```

**Resultado Esperado:**
- ✅ Todos os campos persistem
- ✅ Referências mantidas
- ✅ Execução funciona

**Resultado Atual:**
- ⚠️ Precisa testar para confirmar

### Cenário 2: Campo `initialData` Ausente

**Teste:**
```typescript
// Simular automação sem initialData
const automation = {
  id: 'test-123',
  name: 'Test',
  nodes: [...],
  edges: [...],
  // initialData: undefined  ← ausente
};

// Ao executar
engine.execute(automation.initialData || {});
```

**Comportamento Atual:**
- ✅ FlowEngineV2 aceita `{}` como default
- ✅ Não quebra execução

**Comportamento ao Carregar:**
- ⚠️ Pode não reconstruir corretamente se backend não enviar

---

## 🛠️ PLANO DE CORREÇÃO

### Prioridade 1 (Crítica) - Hoje

1. **Adicionar Validação ao Save:**
   ```typescript
   function validateAutomation(automation: any): Automation {
     return {
       id: automation.id || nanoid(),
       name: automation.name || 'Nova Automação',
       description: automation.description || '',
       nodes: automation.nodes || [],
       edges: automation.edges || [],
       initialData: automation.initialData || {},
       config: automation.config || {},
       schemaVersion: '2.0',
       createdAt: automation.createdAt || new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };
   }
   ```

2. **Atualizar Endpoint POST/PUT:**
   ```typescript
   app.post('/api/automations', (req, res) => {
     const validated = validateAutomation(req.body);
     saveAutomation(validated);
     res.json(validated);
   });
   ```

3. **Migration ao Carregar:**
   ```typescript
   app.get('/api/automations/:id', (req, res) => {
     let automation = getAutomation(req.params.id);
     if (automation) {
       automation = migrateAutomation(automation);
     }
     res.json(automation);
   });
   ```

### Prioridade 2 (Alta) - Amanhã

1. Testes unitários de validação
2. Testes de migration
3. Teste E2E completo

### Prioridade 3 (Média) - Esta Semana

1. Logs de audit
2. Versionamento
3. Rollback/backup

---

## 📋 CHECKLIST DE VALIDAÇÃO

- [ ] Campo `id` sempre presente
- [ ] Campo `name` sempre presente
- [ ] Campo `nodes` é array (mesmo que vazio)
- [ ] Campo `edges` é array (mesmo que vazio)
- [ ] Campo `initialData` é objeto (mesmo que `{}`)
- [ ] Campo `config` é objeto (mesmo que `{}`)
- [ ] Campo `schemaVersion` presente
- [ ] Timestamps `createdAt` e `updatedAt` presentes
- [ ] Validação impede dados inválidos
- [ ] Migration funciona com schemas antigos
- [ ] Logs mostram o que foi migrado
- [ ] Teste E2E: save → reload → verify
- [ ] Teste E2E: save → restart service → load → verify
- [ ] Teste E2E: execute com initialData ausente → não quebra

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Este diagnóstico** (A-001 - 50% completo)
2. ⏳ **Implementar validação** (B-001)
3. ⏳ **Implementar migration** (B-002)
4. ⏳ **Testes E2E** (QA-001)

---

**Diagnóstico criado em:** 2025-10-20  
**Status:** Em andamento  
**Próxima ação:** Implementar validação de persistência
