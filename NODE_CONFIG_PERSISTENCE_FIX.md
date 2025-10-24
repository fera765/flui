# Fix: Node Configuration Persistence After Save

## Problema Identificado

Após salvar uma automação, ao tentar editar os nós, todos apareciam com a mensagem:
```
Configuration
No parameters defined for this node type
```

Isso ocorria **apenas** após salvar/editar uma automação existente. Durante a criação inicial funcionava corretamente.

## Causa Raiz

A investigação revelou que o problema estava no **backend**, especificamente na função de normalização de nós em `automationStorage.ts`.

### Fluxo do Problema:

1. **Frontend cria nó**: Quando você adiciona um nó agent/tool/MCP, o frontend armazena no node.data:
   ```javascript
   {
     type: 'agent',
     name: 'My Agent',
     agentId: 'agent-123',  // ✅ ID presente
     config: { ... }
   }
   ```

2. **Frontend salva**: Envia para API incluindo os IDs:
   ```javascript
   {
     id: 'node-1',
     type: 'agent',
     name: 'My Agent',
     agentId: 'agent-123',  // ✅ ID enviado
     config: { ... }
   }
   ```

3. **Backend normaliza** (automationStorage.ts linha 54-70): 
   A função `validateAndNormalizeAutomation` criava um novo objeto de nó com apenas campos hardcoded:
   ```javascript
   return {
     id: node.id,
     type: nodeType,
     name: node.name,
     config: node.config,
     // ❌ agentId, toolId, mcpId, mcpToolId eram PERDIDOS
   }
   ```

4. **Backend retorna**: API responde com nós **sem os IDs**

5. **Frontend carrega**: Recebe os nós mas sem agentId/toolId/mcpId/mcpToolId

6. **NodeConfigModal abre**: Tenta determinar parâmetros:
   ```javascript
   if (selectedNode.data.type === 'agent' && selectedNode.data.agentId) {
     // ❌ agentId está undefined, não entra aqui
   }
   // Result: params = [] (vazio)
   ```

7. **Resultado**: Mostra "No parameters defined"

## Correções Implementadas

### 1. Backend: Schema Zod Atualizado
**Arquivo**: `source/types/automation.ts`

Adicionado campos opcionais ao schema de nó:

```typescript
export const AutomationNodeSchema = z.object({
  id: z.string(),
  type: AutomationNodeTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  nextNodes: z.array(z.string()).default([]),
  // ✅ FIX: Node identifiers for configuration
  agentId: z.string().optional(),
  toolId: z.string().optional(),
  mcpId: z.string().optional(),
  mcpToolId: z.string().optional(),
});
```

### 2. Backend: Função de Normalização Atualizada
**Arquivo**: `source/store/automationStorage.ts`

Modificada a função `validateAndNormalizeAutomation` para preservar os IDs:

```typescript
normalized.nodes = normalized.nodes.map((node: any) => {
  const normalizedNode = {
    id: node.id || generateId(),
    type: nodeType,
    name: node.name || 'Node',
    description: node.description || '',
    config: node.config || {},
    position: node.position || { x: 0, y: 0 },
    nextNodes: Array.isArray(node.nextNodes) ? node.nextNodes : [],
    // ✅ FIX: Preserve node identifiers needed for configuration
    ...(node.agentId && { agentId: node.agentId }),
    ...(node.toolId && { toolId: node.toolId }),
    ...(node.mcpId && { mcpId: node.mcpId }),
    ...(node.mcpToolId && { mcpToolId: node.mcpToolId }),
  };
  
  // Log para debug
  if (node.agentId || node.toolId || node.mcpId || node.mcpToolId) {
    console.log(`✅ [Storage] Node ${node.id} preserving IDs:`, {
      agentId: node.agentId,
      toolId: node.toolId,
      mcpId: node.mcpId,
      mcpToolId: node.mcpToolId,
    });
  }
  
  return normalizedNode;
});
```

### 3. Backend: Logging ao Carregar
**Arquivo**: `source/store/automationStorage.ts`

Adicionado logging na função `getAutomation` para debug:

```typescript
export const getAutomation = (id: string): Automation | null => {
  // ... código existente ...
  
  console.log(`📖 [Storage] Loading automation ${id} with ${automation.nodes?.length || 0} nodes`);
  
  const migrated = migrateAutomation(automation);
  
  // Log dos nodes para debug
  migrated.nodes.forEach((node: any) => {
    if (node.agentId || node.toolId || node.mcpId || node.mcpToolId) {
      console.log(`  📦 Node ${node.id} (${node.type}):`, {
        agentId: node.agentId,
        toolId: node.toolId,
        mcpId: node.mcpId,
        mcpToolId: node.mcpToolId,
        config: Object.keys(node.config || {}),
      });
    }
  });
  
  return migrated;
};
```

### 4. Frontend: Logging no Modal
**Arquivo**: `flui-frontend/src/components/workflow/NodeConfigModal.tsx`

Adicionado logging para diagnosticar problemas:

```typescript
console.log('[NodeConfigModal] Selected node:', {
  id: selectedNode.id,
  type: selectedNode.data.type,
  agentId: selectedNode.data.agentId,
  toolId: selectedNode.data.toolId,
  mcpId: selectedNode.data.mcpId,
  mcpToolId: selectedNode.data.mcpToolId,
});

// ... código de detecção de params ...

console.log('[NodeConfigModal] Resolved params:', {
  count: params.length,
  params: params.map(p => p.key),
  hasItemData: !!itemData,
});
```

## Fluxo Correto Após Correção

1. **Frontend cria nó** com agentId/toolId/mcpId/mcpToolId
2. **Frontend salva** → envia IDs para backend
3. **Backend normaliza** → **preserva** todos os IDs
4. **Backend persiste** → IDs salvos no JSON
5. **Frontend carrega** → recebe nós **com IDs**
6. **NodeConfigModal abre** → detecta IDs → carrega parâmetros corretos
7. **Resultado**: ✅ Campos de configuração aparecem corretamente

## Teste de Verificação

Criado script de teste: `test-node-id-persistence.mjs`

O teste:
1. ✅ Cria automação com nodes contendo todos os IDs
2. ✅ Salva no backend
3. ✅ Carrega de volta
4. ✅ Verifica se todos os IDs foram preservados
5. ✅ Limpa o teste

### Como executar o teste:

```bash
# Terminal 1: Certifique-se que o backend está rodando
npm run dev

# Terminal 2: Execute o teste
node test-node-id-persistence.mjs
```

Saída esperada:
```
🧪 Testing Node ID Persistence

1️⃣ Creating automation with node IDs...
2️⃣ Saving automation to backend...
   ✅ Created automation: automation-xxx
3️⃣ Loading automation from backend...
   ✅ Loaded automation: automation-xxx
4️⃣ Verifying node IDs...

   📦 Node node-1:
      ✅ agentId preserved: test-agent-123
      ✅ config preserved: message
   📦 Node node-2:
      ✅ toolId preserved: test-tool-456
      ✅ config preserved: param1
   📦 Node node-3:
      ✅ mcpId preserved: test-mcp-789
      ✅ mcpToolId preserved: test-mcp-tool-101
      ✅ config preserved: param2

5️⃣ Cleaning up...
   ✅ Test automation deleted

============================================================
✅ ALL TESTS PASSED! Node IDs are being preserved correctly.
============================================================
```

## Teste Manual

1. **Criar Automação**:
   - Adicione um nó Agent
   - Configure o input
   - Salve a automação

2. **Editar Automação Salva**:
   - Recarregue a página ou navegue para a lista de automações
   - Clique em "Edit" na automação criada
   - Clique no botão "Config" do nó
   - **Antes**: "No parameters defined"
   - **Depois**: ✅ Campo "User Input" aparece com valor

3. **Verificar Console**:
   ```
   Backend (Terminal):
   📖 [Storage] Loading automation automation-xxx with 1 nodes
     📦 Node node-yyy (agent):
       agentId: 'agent-123'
       config: ['message']
   
   Frontend (DevTools):
   [NodeConfigModal] Selected node: {
     id: 'node-yyy',
     type: 'agent',
     agentId: 'agent-123'  ✅ ID presente
   }
   [NodeConfigModal] Resolved params: {
     count: 1,
     params: ['message']  ✅ Parâmetro detectado
   }
   ```

## Tipos de Nós Afetados

A correção resolve o problema para **todos** os tipos de nós que dependem de IDs:

1. **Agent nodes** (agentId)
   - Precisam do agentId para buscar o agent e mostrar campo "message"

2. **System Tool nodes** (toolId)
   - Precisam do toolId para buscar a tool e mostrar seus parâmetros

3. **MCP Tool nodes** (mcpId + mcpToolId)
   - Precisam de ambos IDs para localizar o MCP e a tool específica
   - Mostram parâmetros definidos no schema da tool

## Arquivos Modificados

### Backend
1. `source/types/automation.ts`
   - Adicionado campos opcionais ao schema

2. `source/store/automationStorage.ts`
   - Modificada normalização para preservar IDs
   - Adicionado logging

### Frontend
3. `flui-frontend/src/components/workflow/NodeConfigModal.tsx`
   - Adicionado logging para debug

## Compatibilidade

✅ **Compatibilidade retroativa**: Automações antigas sem esses IDs continuam funcionando
✅ **Migrations safe**: Função de migração preserva IDs se presentes
✅ **Schema validation**: Zod valida mas aceita campos opcionais

## Status

✅ **Problema**: Node configuration showing "No parameters defined" after save - **RESOLVIDO**
✅ **Backend**: Preservando todos os IDs necessários
✅ **Frontend**: Carregando e detectando IDs corretamente
✅ **Testing**: Script de teste automatizado criado
✅ **Logging**: Logs comprehensivos para debug futuro

## Logs para Monitoramento

Após a correção, você verá estes logs indicando que tudo está funcionando:

**Ao salvar**:
```
✅ [Storage] Node node-xxx preserving IDs: { agentId: 'agent-123' }
💾 [Storage] Salvando automação: automation-yyy
✅ [Storage] Automação salva com sucesso
```

**Ao carregar**:
```
📖 [Storage] Loading automation automation-yyy with 1 nodes
  📦 Node node-xxx (agent): { agentId: 'agent-123', config: ['message'] }
```

**Ao abrir configuração**:
```
[NodeConfigModal] Selected node: { agentId: 'agent-123', ... }
[NodeConfigModal] Resolved params: { count: 1, params: ['message'] }
```

Se você ver "No parameters defined", verifique os logs e certifique-se de que os IDs estão sendo preservados em cada etapa.
