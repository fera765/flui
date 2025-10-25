# Fix: Execução de Automações com Agentes

## 🔍 Problemas Identificados

### 1. Backend Falhando ao Executar Agentes
**Sintoma**: 
```
✅ [API] Execução concluída: { status: 'failed', logsCount: 4 }
```

**Causa**: O `FlowEngineV2` não tinha suporte para nodes do tipo `'agent'`.

```typescript
// ANTES - executeNodeV2
if (node.type === 'tool') {
  output = await this.executeToolNode(node, inputData);
} else if (node.type === 'condition') {
  output = await this.executeConditionNode(node, inputData);
} else {
  throw new Error(`Tipo de node não suportado: ${node.type}`); // ❌ Agent cai aqui
}
```

### 2. Frontend Não Processava Resultado Real
**Sintoma**: Apenas simulação, não mostrava erros reais do backend.

**Causa**: O `handleRun` simulava a execução em vez de processar a resposta real da API.

```typescript
// ANTES
const execution = await executeAutomation({ id: automationIdToRun })

// Simular progresso com setTimeout... ❌
for (let i = 0; i < executionNodes.length; i++) {
  await new Promise(resolve => setTimeout(resolve, 800))
  // ... simulação ...
}
```

### 3. IDs Não Passados para Execução
**Sintoma**: Backend não sabia qual agente/tool executar.

**Causa**: API Server pegava IDs do lugar errado.

```typescript
// ANTES
nodes: automation.nodes.map(node => ({
  type: node.config?.toolId || node.type,  // ❌ toolId no lugar errado
}))

// IDs não eram passados para o engine
```

### 4. Logs de Erro Não Apareciam
**Sintoma**: Frontend mostrava apenas "result > success data = {}" mesmo com falha.

**Causa**: Chat messages não processavam erros corretamente.

## ✅ Correções Implementadas

### 1. FlowEngineV2: Suporte para Agentes
**Arquivo**: `source/core/flowEngineV2.ts`

```typescript
// ✅ ADICIONADO
if (node.type === 'agent') {
  output = await this.executeAgentNode(node, inputData);
}

// ✅ NOVO MÉTODO
private async executeAgentNode(node: FlowNode, inputData: any): Promise<NodeOutput> {
  const agentId = (node as any).agentId;
  if (!agentId) {
    throw new Error('agentId não especificado no node');
  }
  
  // Resolver referências no config
  let resolvedConfig = { ...node.config };
  if (hasReferences(node.config)) {
    resolvedConfig = resolveReferences(node.config, {
      nodeOutputs: this.nodeOutputs,
    });
  }
  
  // Preparar input
  const message = resolvedConfig.message || resolvedConfig.input || '';
  if (!message) {
    throw new Error('Mensagem é obrigatória para o agente');
  }
  
  // Executar via ToolExecutor (que já tem suporte a agents)
  const result = await ToolExecutor.execute(
    `agent-${agentId}`,
    { message, ...resolvedConfig },
    context
  );
  
  if (!result.success) {
    throw new Error(result.error || 'Agent execution failed');
  }
  
  return [createNodeDataItem(result.result || {}, node.id, node.name, this.execution.id)];
}
```

### 2. API Server: IDs Corretos para Execução
**Arquivo**: `source/services/apiServer.ts`

```typescript
// ✅ CORRIGIDO
const executionFlow = {
  nodes: automation.nodes.map(node => ({
    id: node.id,
    type: node.toolId || node.type || 'tool',  // ✅ toolId do node
    name: node.name,
    config: node.config || {},
    // ✅ FIX: Passar IDs necessários
    ...(node.agentId && { agentId: node.agentId }),
    ...(node.toolId && { toolId: node.toolId }),
    ...(node.mcpId && { mcpId: node.mcpId }),
    ...(node.mcpToolId && { mcpToolId: node.mcpToolId }),
  })),
}

// ✅ Logging melhorado
console.log('📊 [API] Execução iniciada:', {
  flowId: executionFlow.id,
  nodesCount: executionFlow.nodes.length,
  nodes: executionFlow.nodes.map(n => ({ 
    id: n.id, 
    type: n.type, 
    agentId: n.agentId,
    toolId: n.toolId,
  }))
});
```

### 3. Frontend: Processar Resultado Real
**Arquivo**: `flui-frontend/src/pages/WorkflowEditor.tsx`

```typescript
// ✅ SUBSTITUÍDO simulação por processamento real
const execution = await executeAutomation({ id: automationIdToRun })

// Processar logs do backend
const backendLogs = execution.logs || []
const processedLogs = backendLogs.map(log => ({
  timestamp: log.timestamp || new Date().toISOString(),
  level: log.level || 'info',
  nodeId: log.nodeId || '',
  nodeName: log.nodeName || '',
  message: log.message || '',
  input: log.input,
  output: log.output,
}))

// Atualizar nodes baseado nos logs
const updatedNodes = executionNodes.map(node => {
  const nodeLogs = processedLogs.filter(log => log.nodeId === node.id)
  const hasError = nodeLogs.some(log => log.level === 'error')
  const hasSuccess = nodeLogs.some(log => log.level === 'success')
  
  return {
    ...node,
    status: hasError ? 'error' : hasSuccess ? 'success' : 'pending',
    output: nodeLogs[nodeLogs.length - 1]?.output,
    error: hasError ? nodeLogs.find(l => l.level === 'error')?.message : undefined,
  }
})

// Detectar arquivos
const allFiles = []
backendLogs.forEach(log => {
  if (log.output?.files) allFiles.push(...log.output.files)
})

// Atualizar contexto com dados reais
setExecutionContext(prev => ({
  ...prev,
  status: execution.status === 'completed' ? 'completed' : 'failed',
  nodes: updatedNodes,
  logs: processedLogs,
  files: allFiles,
  duration: execution.duration,
  error: execution.error,
}))
```

### 4. ExecutionModalV2: Mensagens de Erro Claras
**Arquivo**: `flui-frontend/src/components/automations/ExecutionModalV2.tsx`

```typescript
// ✅ Processar TODOS os logs, não apenas o último
const newLogs = context.logs.slice(currentMessageCount)

newLogs.forEach(log => {
  if (log.level === 'error') {
    setChatMessages(prev => [...prev, {
      role: 'system',
      content: `❌ **${log.nodeName}** falhou\n\n${log.message}`
    }])
  } else if (log.level === 'warn') {
    setChatMessages(prev => [...prev, {
      role: 'system',
      content: `⚠️ **${log.nodeName}**: ${log.message}`
    }])
  }
})

// ✅ Mensagem final com todos os erros
if (context.status === 'failed') {
  const errorLogs = context.logs.filter(log => log.level === 'error')
  const errorMessages = errorLogs.map(log => 
    `• **${log.nodeName}**: ${log.message}`
  ).join('\n')
  
  content: `💥 **Automação falhou**\n\n${errorMessages}\n\n🔍 Verifique a aba de Logs`
}
```

**Erros nos Cards dos Nodes**:
```typescript
{node.error && (
  <div className="mt-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20 p-2 rounded font-medium">
    💥 {node.error}
  </div>
)}
```

## 📊 Fluxo Corrigido

### Execução com Agente

```
1. Frontend: handleRun()
   ↓
2. Backend: POST /api/automations/:id/execute
   ↓
3. API Server: Preparar executionFlow
   - type: node.toolId || node.type
   - agentId: node.agentId ✅
   ↓
4. FlowEngineV2: executeNodeV2()
   - if (node.type === 'agent') → executeAgentNode() ✅
   ↓
5. FlowEngineV2: executeAgentNode()
   - Validar agentId ✅
   - Resolver referências {{}} ✅
   - Preparar message ✅
   - ToolExecutor.execute(`agent-${agentId}`, ...) ✅
   ↓
6. ToolExecutor: executeAgent()
   - Buscar agente no store ✅
   - Executar LLM ✅
   - Retornar resultado ✅
   ↓
7. Backend: Retornar resultado com logs
   ↓
8. Frontend: Processar resultado real
   - Mapear logs ✅
   - Detectar erros ✅
   - Atualizar nodes ✅
   ↓
9. ExecutionModalV2: Mostrar
   - Timeline com estados ✅
   - Mensagens de erro no chat ✅
   - Logs detalhados na aba ✅
```

## 🧪 Como Testar

### Criar Automação com Agente

1. Adicione um node **Manual Trigger**
2. Adicione um node **Agent**
3. Configure o Agent:
   - Input: "Hello, test message"
4. Conecte Trigger → Agent
5. Salve
6. Clique em **Run**

### Resultado Esperado ✅

**Backend logs**:
```
📊 [API] Execução iniciada: {
  nodes: [
    { id: 'node-1', type: 'manual-trigger' },
    { id: 'node-2', type: 'agent', agentId: 'agent-123' }
  ]
}
🤖 [FlowEngineV2] Executando agent node: My Agent (agent-123)
🤖 [AgentExecutor] Executando agente: My Agent
✅ [API] Execução concluída: { status: 'completed' }
```

**Frontend modal**:
```
Timeline:
● ✓ Manual Trigger    ✓ 234ms
● ✓ My Agent          ✓ 1523ms

Chat:
🚀 Iniciando execução...
✅ Manual Trigger executado com sucesso
✅ My Agent executado com sucesso
🎉 Automação concluída! ⏱️ 1.76s
```

### Se Houver Erro ❌

**Backend logs**:
```
❌ [FlowEngineV2] Erro ao executar node: agentId não especificado
✅ [API] Execução concluída: { 
  status: 'failed',
  error: 'agentId não especificado'
}
```

**Frontend modal**:
```
Timeline:
● ✓ Manual Trigger    ✓ 234ms
● ✗ My Agent          ✗ Erro
  💥 agentId não especificado

Chat:
🚀 Iniciando execução...
✅ Manual Trigger executado
❌ My Agent falhou
   agentId não especificado

💥 Automação falhou
• My Agent: agentId não especificado
🔍 Verifique a aba de Logs
```

## 📝 Logs Detalhados

**Aba de Logs** mostra:
```
┌────────────────────────────────┐
│ ✓ Manual Trigger               │
│   Concluído em 234ms            │
│   📥 Input                     │
│   📤 Output                    │
├────────────────────────────────┤
│ ✗ My Agent                     │
│   agentId não especificado     │
│   📥 Input                     │
└────────────────────────────────┘
```

## 🎯 Tipos de Node Suportados

| Tipo | Status | Handler |
|------|--------|---------|
| tool | ✅ | executeToolNode |
| **agent** | ✅ | **executeAgentNode** (novo!) |
| condition | ✅ | executeConditionNode |
| loop | ✅ | executeLoopNode |
| manual-trigger | ✅ | inline handler |
| cron-trigger | ✅ | inline handler |
| webhook-trigger | ✅ | inline handler |

## 📁 Arquivos Modificados

### Backend
1. `source/core/flowEngineV2.ts`
   - ✅ Adicionado caso `node.type === 'agent'`
   - ✅ Implementado `executeAgentNode()`
   - ✅ Suporte a resolução de referências
   - ✅ Integração com ToolExecutor

2. `source/services/apiServer.ts`
   - ✅ Corrigido mapeamento de node.toolId
   - ✅ Adicionado preservação de agentId, mcpId
   - ✅ Logging melhorado

### Frontend
3. `flui-frontend/src/pages/WorkflowEditor.tsx`
   - ✅ Removida simulação
   - ✅ Processamento de resultado real
   - ✅ Mapeamento de logs do backend
   - ✅ Detecção de arquivos
   - ✅ Atualização de nodes com status real

4. `flui-frontend/src/components/automations/ExecutionModalV2.tsx`
   - ✅ Processamento de todos os logs
   - ✅ Mensagens de erro claras
   - ✅ Erros agrupados na mensagem final
   - ✅ Preview de output nos cards dos nodes

## ✅ Status

| Feature | Antes | Depois |
|---------|-------|--------|
| Executar Agent | ❌ Erro | ✅ Funciona |
| Logs de Erro | ❌ Não aparecem | ✅ Aparecem |
| Timeline Real | ❌ Simulado | ✅ Real do backend |
| Arquivos | ❌ Simulado | ✅ Real detectados |
| Input/Output | ❌ Fake | ✅ Real nos logs |

## 🚀 Resultado Final

Agora ao executar uma automação com agentes:

1. ✅ **Backend executa corretamente** o node de agent
2. ✅ **Frontend processa resultado real** do backend
3. ✅ **Erros aparecem claramente** no chat e timeline
4. ✅ **Logs detalhados** mostram input/output de cada node
5. ✅ **Arquivos detectados** automaticamente
6. ✅ **Links** mostrados com botões

---

**Data**: 2025-10-24
**Status**: ✅ **Totalmente Funcional**
**Tipos Suportados**: tool, **agent**, condition, loop, triggers
