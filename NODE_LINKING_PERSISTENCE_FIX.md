# Node Linking and Data Persistence Fix

## Problemas Identificados

### Problema 1: Dados do nó não linkavam e não persistiam
**Sintoma**: Ao clicar no botão de link de output, o valor linkado não era salvo. Ao editar texto comum sem linker, também não persistia após salvar.

**Causa Raiz**: O componente `NodeConfigModal` mantinha um estado local (`config`) que era inicializado quando o modal abria. Quando o usuário clicava no linker e selecionava um output, a função `linkOutput` atualizava diretamente o store do Zustand, mas o estado local do modal não era atualizado. Ao salvar, o estado local antigo sobrescrevia o valor linkado no store.

### Problema 2: Após salvar uma automação, a configuração não funcionava
**Sintoma**: Depois de salvar uma automação, ao tentar configurar um nó, os campos de input não apareciam ou mostravam "sem dados".

**Causa Raiz**: 
1. O `selectedNode` no modal era uma referência capturada quando o modal abriu, e não atualizava quando o store mudava
2. Ao salvar a automação, os campos `agentId`, `toolId`, `mcpId` e `mcpToolId` não eram persistidos, então ao recarregar, o modal não sabia quais parâmetros mostrar

## Correções Implementadas

### 1. NodeConfigModal - Sincronização com Store
**Arquivo**: `flui-frontend/src/components/workflow/NodeConfigModal.tsx`

```typescript
// ✅ Sempre buscar o nó atualizado do store
const selectedNode = selectedNodeId 
  ? nodes.find(n => n.id === selectedNodeId) || storeSelectedNode
  : storeSelectedNode

// ✅ Sincronizar estado local quando o store muda
useEffect(() => {
  if (selectedNode) {
    console.log('[NodeConfigModal] Syncing config from node:', selectedNode.data.config)
    setConfig(selectedNode.data.config || {})
  }
}, [selectedNodeId, nodes, selectedNode?.data.config])
```

**O que isso resolve**: 
- O modal agora sempre lê o nó mais recente do array `nodes` do store
- Quando `linkOutput` atualiza o nó, o array `nodes` muda
- O useEffect detecta a mudança e atualiza o estado local `config`
- Agora os valores linkados persistem ao salvar

### 2. WorkflowEditor - Salvar Identificadores de Nó
**Arquivo**: `flui-frontend/src/pages/WorkflowEditor.tsx`

**Na função `handleSave` e `performSilentSave`**:
```typescript
nodes: latestNodes.map((node) => ({
  id: node.id,
  type: node.data.type,
  name: node.data.name,
  description: node.data.description,
  config: node.data.config || {},
  position: node.position,
  // ✅ FIX: Preservar identificadores necessários para configuração
  ...(node.data.agentId && { agentId: node.data.agentId }),
  ...(node.data.toolId && { toolId: node.data.toolId }),
  ...(node.data.mcpId && { mcpId: node.data.mcpId }),
  ...(node.data.mcpToolId && { mcpToolId: node.data.mcpToolId }),
})),
```

**O que isso resolve**: Ao salvar, agora preservamos os IDs que identificam qual agente/tool/MCP o nó representa.

### 3. WorkflowEditor - Carregar Identificadores de Nó
**Arquivo**: `flui-frontend/src/pages/WorkflowEditor.tsx`

**Na função `loadAutomation`**:
```typescript
const loadedNodes = automation.nodes.map((node: any) => {
  console.log('[WorkflowEditor] Loading node:', node.id, 'config:', node.config)
  return {
    id: node.id,
    type: 'custom',
    position: node.position || { x: 0, y: 0 },
    data: {
      type: node.type,
      name: node.name,
      description: node.description,
      config: node.config || {},
      // ✅ FIX: Restaurar identificadores salvos
      ...(node.agentId && { agentId: node.agentId }),
      ...(node.toolId && { toolId: node.toolId }),
      ...(node.mcpId && { mcpId: node.mcpId }),
      ...(node.mcpToolId && { mcpToolId: node.mcpToolId }),
    },
  }
})
```

**O que isso resolve**: Ao carregar, restauramos os IDs, então o modal sabe quais parâmetros mostrar.

### 4. WorkflowStore - Logging Aprimorado
**Arquivo**: `flui-frontend/src/store/workflowStore.ts`

Adicionamos logs detalhados em:
- `updateNode`: Para rastrear atualizações de configuração
- `linkOutput`: Para rastrear quando um output é linkado

### 5. WorkflowEditor - Correção de Subscribe
**Arquivo**: `flui-frontend/src/pages/WorkflowEditor.tsx`

Corrigimos o uso da API `subscribe` do Zustand:
```typescript
// ❌ Antes (incorreto - sintaxe não suportada)
const unsubscribe = useWorkflowStore.subscribe(
  (state) => state.nodes,
  (storeNodes) => { ... }
)

// ✅ Depois (correto)
const unsubscribe = useWorkflowStore.subscribe((state) => {
  isSyncingFromStore.current = true
  setNodes(state.nodes)
  setEdges(state.edges)
  requestAnimationFrame(() => {
    isSyncingFromStore.current = false
  })
})
```

## Fluxo Correto Agora

### Fluxo de Linking:
1. Usuário abre NodeConfigModal
2. Modal lê `selectedNode` do store (via `nodes.find()`)
3. Estado local `config` é inicializado com `selectedNode.data.config`
4. Usuário clica no botão Link
5. Abre TypedLinkerModal
6. Usuário seleciona um output
7. `linkOutput` atualiza o store → array `nodes` muda
8. useEffect no modal detecta mudança no array `nodes`
9. Estado local `config` é atualizado com o novo valor linkado
10. Usuário clica Save
11. `updateNode` salva o estado local (agora correto) no store

### Fluxo de Persistência:
1. Usuário edita um campo de texto
2. `handleConfigChange` atualiza estado local `config`
3. Usuário clica Save
4. `updateNode` salva o estado local no store
5. Autosave (ou Save manual) salva para backend
6. Backend agora recebe `agentId`, `toolId`, `mcpId`, `mcpToolId`
7. Ao recarregar, `loadAutomation` restaura esses IDs
8. Modal pode determinar quais parâmetros mostrar
9. Valores de configuração são restaurados corretamente

## Teste de Verificação

Criado arquivo de teste: `frontend-tests/test-node-linking-persistence.mjs`

O teste verifica:
1. ✅ Persistência de texto simples
2. ✅ Linking de outputs
3. ✅ Persistência de links
4. ✅ Configuração após salvar e recarregar

## Como Testar Manualmente

1. **Teste de Linking**:
   - Crie uma automação nova
   - Adicione 2 nós (ex: Agent + Tool)
   - Configure o segundo nó
   - Clique no botão de Link
   - Selecione um output do primeiro nó
   - Salve
   - Reabra a configuração → deve mostrar o valor linkado (ex: `{{node-123.output}}`)

2. **Teste de Persistência de Texto**:
   - Configure um nó
   - Digite texto em um campo
   - Salve
   - Reabra → texto deve estar lá

3. **Teste Após Save**:
   - Crie automação com nós configurados
   - Salve a automação
   - Recarregue a página
   - Tente configurar os nós → campos devem aparecer com valores

## Arquivos Modificados

1. `flui-frontend/src/components/workflow/NodeConfigModal.tsx`
   - Adicionado leitura fresh do node do store
   - Corrigido dependencies do useEffect

2. `flui-frontend/src/pages/WorkflowEditor.tsx`
   - Corrigido `handleSave` para persistir IDs
   - Corrigido `performSilentSave` para persistir IDs
   - Corrigido `loadAutomation` para restaurar IDs
   - Corrigido uso de `subscribe`

3. `flui-frontend/src/store/workflowStore.ts`
   - Adicionado logging em `updateNode`
   - Adicionado logging em `linkOutput`

## Status

✅ **Problema 1**: Linking e persistência de dados - RESOLVIDO
✅ **Problema 2**: Configuração após salvar - RESOLVIDO

Os nós agora:
- ✅ Linkam outputs corretamente
- ✅ Persistem valores linkados
- ✅ Persistem texto comum
- ✅ Mantêm configuração após salvar e recarregar
