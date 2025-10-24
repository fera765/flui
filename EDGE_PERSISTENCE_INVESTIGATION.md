# Investigação: Perda de Conexões/Ramificações Após Salvar

## Problema Reportado

Ao conectar nós em uma automação via ramificações/edges e depois salvar, ao editar novamente a automação todas as ligações e ramificações se perdem/desconectam sozinhas.

## Investigação Realizada

### 1. Logging Comprehensivo Adicionado

Adicionei logs em todos os pontos críticos do fluxo de save/load de edges:

#### Frontend (`flui-frontend/src/pages/WorkflowEditor.tsx`)

**Ao salvar**:
```typescript
console.log('[WorkflowEditor] Saving with store nodes:', latestNodes.length, 'edges:', latestEdges.length)
console.log('[WorkflowEditor] Edges to save:', latestEdges.map(e => ({ id: e.id, source: e.source, target: e.target })))
```

**Ao carregar**:
```typescript
console.log('[WorkflowEditor] Loading automation:', automationId, 'with', automation.nodes.length, 'nodes', automation.edges.length, 'edges')
console.log('[WorkflowEditor] Raw edges from API:', JSON.stringify(automation.edges, null, 2))
console.log('[WorkflowEditor] Processing edge:', edge)
console.log('[WorkflowEditor] Loaded edges for ReactFlow:', loadedEdges)
```

#### Backend (`source/store/automationStorage.ts`)

**Na validação**:
```typescript
console.log('🔍 [Storage] Edges recebidas:', automation.edges?.length || 0, automation.edges);
console.log('🔗 [Storage] Normalizando edges:', normalized.edges.length);
console.log(`  Edge ${index}:`, normalizedEdge);
console.log('✅ [Storage] Edges normalizadas:', normalized.edges.length);
```

**Ao salvar**:
```typescript
console.log('💾 [Storage] Edges a salvar:', automation.edges?.length || 0, automation.edges);
console.log('💾 [Storage] Edges validadas:', validated.edges?.length || 0, validated.edges);
```

**Ao carregar**:
```typescript
console.log(`📖 [Storage] Loading automation ${id} with ${automation.nodes?.length || 0} nodes, ${automation.edges?.length || 0} edges`);
console.log('📖 [Storage] Raw edges from storage:', automation.edges);
console.log(`📖 [Storage] After migration: ${migrated.edges?.length || 0} edges`);
console.log('📖 [Storage] Migrated edges:', migrated.edges);
```

### 2. Formato de Edges

#### Frontend → Backend (save):
```javascript
{
  id: 'reactflow__edge-node1source-node2target',
  source: 'node-1',
  target: 'node-2',
  // ReactFlow adiciona outros campos que não precisamos persistir:
  // animated, style, type, etc.
}
```

#### Backend → Storage (normalização):
```javascript
{
  id: edge.id || `edge-${index}`,
  source: edge.source || edge.from || '',
  target: edge.target || edge.to || '',
}
```

#### Storage → Backend → Frontend (load):
```javascript
{
  id: 'reactflow__edge-node1source-node2target',
  source: 'node-1',
  target: 'node-2',
  animated: true,
  style: { stroke: 'hsl(var(--primary))' },
}
```

### 3. Fluxo Atual

```
1. Usuário conecta nós no canvas
   ↓
2. ReactFlow cria edge com ID único
   ↓
3. Edge adicionada ao state local (edges)
   ↓
4. State local sincroniza com Zustand store
   ↓
5. Autosave ou Save manual
   ↓
6. Frontend pega edges do store
   ↓
7. Frontend envia edges para API
   ↓
8. Backend normaliza edges
   ↓
9. Backend salva no JSON
   ↓
10. Usuário recarrega página
   ↓
11. Frontend busca automação da API
   ↓
12. Backend lê do JSON
   ↓
13. Backend migra (se necessário)
   ↓
14. API retorna automação com edges
   ↓
15. Frontend processa edges
   ↓
16. Frontend seta edges no ReactFlow
```

### 4. Possíveis Causas Identificadas

Com os logs, podemos identificar onde as edges estão sendo perdidas:

#### Causa A: Frontend não está capturando edges corretamente
- Verificar se `latestEdges` no momento do save está vazio
- Verificar se o Zustand store está sincronizando edges

#### Causa B: Backend está descartando edges
- Verificar se edges chegam ao backend
- Verificar se normalização está corrompendo edges
- Verificar se validação Zod está rejeitando edges

#### Causa C: Frontend não está carregando edges corretamente
- Verificar se API retorna edges
- Verificar se transformação para ReactFlow está correta
- Verificar se IDs dos nós mudaram (edges ficariam órfãs)

## Script de Teste

Criei `test-edge-persistence.mjs` que:

1. ✅ Cria automação com 4 nós e 3 edges
2. ✅ Salva no backend
3. ✅ Carrega de volta
4. ✅ Verifica se todos as edges foram preservadas
5. ✅ Adiciona uma nova edge (update)
6. ✅ Carrega novamente
7. ✅ Verifica se a nova edge foi persistida
8. ✅ Limpa teste

### Como executar:

```bash
# Terminal 1: Backend rodando
npm run dev

# Terminal 2: Execute teste
node test-edge-persistence.mjs
```

### Saída Esperada (se tudo funcionar):

```
🧪 Testing Edge/Connection Persistence

1️⃣ Creating automation with edges...
   Nodes: 4
   Edges: 3
     1. edge-1: node-1 → node-2
     2. edge-2: node-2 → node-3
     3. edge-3: node-3 → node-4

2️⃣ Saving automation to backend...
   ✅ Created automation: automation-xxx
   Edges in response: 3

3️⃣ Loading automation from backend...
   ✅ Loaded automation: automation-xxx
   Nodes loaded: 4
   Edges loaded: 3

4️⃣ Verifying edges...
   ✅ Edge count correct: 3 edges
   ✅ Edge preserved: edge-1 (node-1 → node-2)
   ✅ Edge preserved: edge-2 (node-2 → node-3)
   ✅ Edge preserved: edge-3 (node-3 → node-4)

5️⃣ Testing edge persistence after update...
   ✅ Automation updated with new edge
   Edges after reload: 4
   ✅ New edge persisted correctly
   ✅ New edge data correct

6️⃣ Cleaning up...
   ✅ Test automation deleted

============================================================
✅ ALL TESTS PASSED! Edges are being preserved correctly.
============================================================
```

### Saída se houver problema:

```
4️⃣ Verifying edges...
   ❌ CRITICAL: NO EDGES LOADED!
   Expected: 3 edges
   Got: 0 edges
```

ou

```
4️⃣ Verifying edges...
   ❌ Edge count mismatch!
   Expected: 3 edges
   Got: 1 edges
   ❌ Edge LOST: edge-2 (node-2 → node-3)
   ❌ Edge LOST: edge-3 (node-3 → node-4)
```

## Como Diagnosticar

### 1. Execute o teste automatizado:
```bash
node test-edge-persistence.mjs
```

### 2. Se o teste falhar, verifique os logs:

**Backend logs** (console onde `npm run dev` está rodando):
```
💾 [Storage] Edges a salvar: 3 [...]
🔗 [Storage] Normalizando edges: 3
  Edge 0: { id: 'edge-1', source: 'node-1', target: 'node-2' }
  Edge 1: { id: 'edge-2', source: 'node-2', target: 'node-3' }
  Edge 2: { id: 'edge-3', source: 'node-3', target: 'node-4' }
✅ [Storage] Edges normalizadas: 3

📖 [Storage] Loading automation xxx with 4 nodes, 3 edges
📖 [Storage] Raw edges from storage: [...]
```

Se você vir `Edges a salvar: 0` → problema está no frontend
Se você vir `Edges normalizadas: 0` → problema está na normalização
Se você vir `Raw edges from storage: []` → edges não foram persistidas

**Frontend logs** (DevTools Console):
```
[WorkflowEditor] Saving with store nodes: 4 edges: 3
[WorkflowEditor] Edges to save: [...]

[WorkflowEditor] Loading automation: xxx with 4 nodes 3 edges
[WorkflowEditor] Raw edges from API: [...]
[WorkflowEditor] Loaded edges for ReactFlow: [...]
```

Se você vir `edges: 0` ao salvar → edges não estão no store
Se você vir `Raw edges from API: []` → backend não retornou edges
Se você vir `Loaded edges for ReactFlow: []` → transformação falhou

### 3. Teste manual no frontend:

1. Abra DevTools (F12)
2. Vá para Console
3. Crie uma automação nova
4. Adicione 2 nós
5. Conecte os nós
6. Observe os logs:
   ```
   [WorkflowEditor] Saving with store nodes: 2 edges: 1
   [WorkflowEditor] Edges to save: [{ id: '...', source: '...', target: '...' }]
   ```
7. Recarregue a página
8. Observe os logs:
   ```
   [WorkflowEditor] Loading automation: xxx with 2 nodes 1 edges
   [WorkflowEditor] Raw edges from API: [{ id: '...', source: '...', target: '...' }]
   ```

## Possíveis Soluções

Dependendo do que os logs revelarem:

### Se edges não estão no store ao salvar:

**Problema**: Sincronização entre ReactFlow e Zustand está quebrada

**Solução**: Verificar `useEffect` que sincroniza edges:
```typescript
useEffect(() => {
  if (!isSyncingFromStore.current) {
    workflowStore.setEdges(edges)
    hasUnsavedChanges.current = true
    triggerAutosave()
  }
}, [edges])
```

### Se edges não são normalizadas corretamente:

**Problema**: Função de normalização tem bug

**Solução**: Verificar a lógica em `automationStorage.ts`:
```typescript
normalized.edges = normalized.edges.map((edge: any, index: number) => ({
  id: edge.id || `edge-${index}`,
  source: edge.source || edge.from || '',  // Pode estar pegando string vazia
  target: edge.target || edge.to || '',    // Pode estar pegando string vazia
}));
```

### Se edges não são persistidas no JSON:

**Problema**: Schema Zod rejeitando ou bug no Conf

**Solução**: Verificar schema e adicionar try-catch:
```typescript
try {
  config.set('automations', automations);
  console.log('Saved to storage:', automations.find(a => a.id === validated.id).edges);
} catch (error) {
  console.error('Failed to save to storage:', error);
}
```

### Se edges não são carregadas do JSON:

**Problema**: Migration ou leitura do storage

**Solução**: Verificar função `migrateAutomation`:
```typescript
// Se não tem edges mas tem connections (formato antigo)
if (edges.length === 0 && automation.connections) {
  edges = automation.connections.map(...);
}
```

### Se edges não aparecem no ReactFlow:

**Problema**: Transformação ou IDs de nós mudaram

**Solução**: 
1. Verificar se IDs dos nós são consistentes
2. Verificar se edge source/target correspondem a nós existentes
3. ReactFlow descarta edges órfãs silenciosamente

## Status Atual

✅ Logging comprehensivo adicionado
✅ Script de teste automatizado criado
⏳ Aguardando execução do teste para identificar causa específica
⏳ Solução será implementada baseada nos resultados do teste

## Próximos Passos

1. Execute `node test-edge-persistence.mjs`
2. Se passar ✅: Problema pode ser específico do frontend/UI
3. Se falhar ❌: Logs indicarão exatamente onde edges são perdidas
4. Implementar correção específica baseada no diagnóstico
5. Re-testar até passar

## Arquivos Modificados

1. `flui-frontend/src/pages/WorkflowEditor.tsx`
   - Adicionado logging de edges no save
   - Adicionado logging de edges no load

2. `source/store/automationStorage.ts`
   - Adicionado logging em validateAndNormalizeAutomation
   - Adicionado logging em saveAutomation
   - Adicionado logging em getAutomation

3. `test-edge-persistence.mjs`
   - Novo script de teste automatizado

## Comandos Úteis

```bash
# Rodar backend em modo dev (com logs)
npm run dev

# Rodar teste de persistência de edges
node test-edge-persistence.mjs

# Rodar frontend em modo dev
cd flui-frontend && npm run dev

# Ver storage file diretamente
cat workspace/storage/config.json | jq '.automations[] | {id, edges}'
```

## Notas Importantes

- ReactFlow usa IDs próprios para edges (ex: `reactflow__edge-node1source-node2target`)
- Edges órfãs (source ou target não existe) são silenciosamente descartadas pelo ReactFlow
- A função de normalização deve preservar IDs mesmo se tiverem formato estranho
- Migration de schema antigo pode estar afetando edges

---

**Status**: 🔍 Investigação em andamento com logs adicionados
**Próximo**: Executar teste automatizado para identificar causa raiz exata
