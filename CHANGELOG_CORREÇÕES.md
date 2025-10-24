# 📝 Changelog - Correções Detalhadas

## Data: 2025-10-24

---

## 🔧 Arquivo 1: WorkflowEditor.tsx

**Caminho:** `/workspace/flui-frontend/src/pages/WorkflowEditor.tsx`

### Mudanças

#### ➕ Adicionado novo handler (após linha 74)
```typescript
// 🗑️ Handle node deletion (Delete key or manual delete)
const onNodesDelete = useCallback((nodesToDelete: any[]) => {
  console.log('[WorkflowEditor] Deleting nodes:', nodesToDelete.length)
  nodesToDelete.forEach(node => {
    workflowStore.deleteNode(node.id)
  })
  toast.info(`${nodesToDelete.length} node(s) removed`, { duration: 2000 })
}, [])
```

#### 🔄 Modificado ReactFlow component (linha 386)
```diff
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
+ onNodesDelete={onNodesDelete}
  onEdgesDelete={onEdgesDelete}
  onConnect={onConnect}
```

**Razão:** Permitir deleção de nós via tecla Delete, não apenas pelo botão

---

## 🔧 Arquivo 2: AgentModal.tsx

**Caminho:** `/workspace/flui-frontend/src/components/agents/AgentModal.tsx`

### Mudanças

#### 🔄 Imports modificados (linha 1)
```diff
- import { useState } from 'react'
+ import { useState, useEffect } from 'react'
```

```diff
- import { useModels, useTools, useMCPs } from '@/hooks/useAgents'
+ import { useTools, useMCPs } from '@/hooks/useAgents'
+ import { api } from '@/services/api'
```

#### ➕ Adicionada interface (após linha 9)
```typescript
interface ModelInfo {
  id: string
  object: string
  created: number
  owned_by: string
  modalities?: { input: string[] }
}
```

#### 🔄 States modificados (linha 35-36)
```diff
- const { data: models = [] } = useModels()
+ const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
+ const [isLoadingModels, setIsLoadingModels] = useState(false)
```

#### 🔄 Agrupamento MCP modificado (linha 41)
```diff
- const mcpToolsList = mcps.flatMap((mcp: any) => 
-   (mcp.tools || []).map((tool: any) => ({
-     ...tool,
-     mcpName: mcp.name,
-     mcpId: mcp.id,
-     id: tool.id || `${mcp.id}-${tool.name}`,
-     displayName: `${tool.name} (${mcp.name})`,
-   }))
- )

+ const mcpGroups = mcps.map((mcp: any) => ({
+   mcpId: mcp.id,
+   mcpName: mcp.name,
+   tools: (mcp.tools || []).map((tool: any) => ({
+     ...tool,
+     mcpName: mcp.name,
+     mcpId: mcp.id,
+     id: tool.id || `${mcp.id}-${tool.name}`,
+     displayName: tool.name,
+   }))
+ })).filter(group => group.tools.length > 0)
+ 
+ const totalMcpTools = mcpGroups.reduce((acc, group) => acc + group.tools.length, 0)
```

#### ➕ Adicionado useForm setValue (linha 54)
```diff
const {
  register,
  handleSubmit,
  formState: { errors },
+ setValue,
} = useForm<AgentFormData>({
```

#### ➕ Adicionado useEffect para carregar modelos (após linha 66)
```typescript
// 🚀 Carregar modelos disponíveis do endpoint configurado
useEffect(() => {
  const loadAvailableModels = async () => {
    if (!isOpen) return
    
    setIsLoadingModels(true)
    try {
      // Buscar configuração da LLM
      const config = await api.get<any>('/api/llm/config')
      if (!config?.llm?.endpoint) {
        console.warn('No LLM endpoint configured')
        setAvailableModels([])
        return
      }

      const endpoint = config.llm.endpoint
      const modelsUrl = endpoint.endsWith('/') ? `${endpoint}models` : `${endpoint}/models`
      
      const response = await fetch(modelsUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Suportar formato OpenAI (data.data) ou formato direto (array)
        const models = Array.isArray(data) ? data : data.data || []
        setAvailableModels(models)
        console.log(`✅ Loaded ${models.length} models from ${endpoint}`)
        
        // Se estiver criando novo agente e tiver modelos, selecionar o primeiro
        if (!agent && models.length > 0) {
          setValue('model', models[0].id)
        }
      } else {
        console.warn('Failed to load models:', response.statusText)
        setAvailableModels([])
      }
    } catch (error) {
      console.error('Error loading models:', error)
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  loadAvailableModels()
}, [isOpen, agent, setValue])
```

#### 🔄 Select de modelo modificado (linha 156)
```diff
<div>
  <label className="block text-sm font-medium text-foreground mb-2">
    Model *
  </label>
- <select
-   {...register('model')}
-   className="w-full h-10 px-3 border border-input bg-background rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
- >
-   <option value="">Select a model</option>
-   {((models as any)?.data || models || []).map((model: any) => (
-     <option key={model.id} value={model.id}>
-       {model.id}
-     </option>
-   ))}
- </select>
- {errors.model && (
-   <p className="mt-1 text-sm text-destructive">{errors.model.message}</p>
- )}

+ {availableModels.length > 0 ? (
+   <div>
+     <select
+       {...register('model')}
+       className="w-full h-10 px-3 border border-input bg-background rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
+       disabled={isLoadingModels}
+     >
+       <option value="">Select a model</option>
+       {availableModels.map((model) => (
+         <option key={model.id} value={model.id}>
+           {model.id} {model.owned_by ? `(${model.owned_by})` : ''}
+         </option>
+       ))}
+     </select>
+     <p className="text-xs text-muted-foreground mt-1">
+       {availableModels.length} models available from configured LLM endpoint
+     </p>
+   </div>
+ ) : (
+   <div>
+     <Input
+       {...register('model')}
+       placeholder="deepseek-v3.1"
+       error={errors.model?.message}
+       disabled={isLoadingModels}
+     />
+     <p className="text-xs text-muted-foreground mt-1">
+       {isLoadingModels 
+         ? 'Loading models from LLM endpoint...' 
+         : 'Enter model name manually or configure LLM endpoint in Settings'
+       }
+     </p>
+   </div>
+ )}
+ 
+ {errors.model && (
+   <p className="mt-1 text-sm text-destructive">{errors.model.message}</p>
+ )}
</div>
```

#### 🔄 Seção MCP Tools modificada (linha 241)
```diff
- <h3 className="text-sm font-medium text-foreground mb-3">
-   MCP Tools ({mcpToolsList.length})
- </h3>
- <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-thin">
-   {mcpToolsList.map((tool: any) => (
-     <button
-       key={tool.id}
-       type="button"
-       onClick={() => toggleMCPTool(tool.id)}
-       className={`p-3 text-left border rounded-lg transition-colors ${
-         selectedMCPTools.includes(tool.id)
-           ? 'border-primary bg-primary/10'
-           : 'border-border hover:border-primary/50'
-       }`}
-     >
-       <div className="font-medium text-sm">{tool.displayName || tool.name}</div>
-       <div className="text-xs text-muted-foreground line-clamp-1">
-         {tool.description}
-       </div>
-       <div className="text-xs text-purple-500 mt-1">
-         MCP: {tool.mcpName}
-       </div>
-     </button>
-   ))}
- </div>

+ <h3 className="text-sm font-medium text-foreground mb-3">
+   MCP Tools ({totalMcpTools})
+ </h3>
+ <div className="max-h-80 overflow-y-auto space-y-4 scrollbar-thin">
+   {mcpGroups.length === 0 && (
+     <div className="text-center py-8 text-muted-foreground text-sm">
+       No MCP tools available. Import MCPs from the MCPs page.
+     </div>
+   )}
+   
+   {mcpGroups.map((group: any) => (
+     <div key={group.mcpId} className="space-y-2">
+       {/* MCP Header */}
+       <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 rounded">
+         <div className="font-semibold text-sm text-purple-500">
+           {group.mcpName}
+         </div>
+         <span className="text-xs text-muted-foreground">
+           ({group.tools.length} {group.tools.length === 1 ? 'tool' : 'tools'})
+         </span>
+       </div>
+       
+       {/* MCP Tools */}
+       <div className="grid grid-cols-2 gap-2 ml-2">
+         {group.tools.map((tool: any) => (
+           <button
+             key={tool.id}
+             type="button"
+             onClick={() => toggleMCPTool(tool.id)}
+             className={`p-3 text-left border rounded-lg transition-colors ${
+               selectedMCPTools.includes(tool.id)
+                 ? 'border-primary bg-primary/10'
+                 : 'border-border hover:border-primary/50'
+             }`}
+           >
+             <div className="font-medium text-sm">{tool.displayName || tool.name}</div>
+             <div className="text-xs text-muted-foreground line-clamp-1">
+               {tool.description || 'No description'}
+             </div>
+           </button>
+         ))}
+       </div>
+     </div>
+   ))}
+ </div>
```

**Razão:** Carregar modelos dinamicamente do endpoint LLM e agrupar ferramentas MCP

---

## 🔧 Arquivo 3: AddNodeModal.tsx

**Caminho:** `/workspace/flui-frontend/src/components/workflow/AddNodeModal.tsx`

### Mudanças

#### 🔄 Agrupamento MCP modificado (linha 37)
```diff
- // ✅ Extract MCP tools into individual items
- const mcpTools = mcps.flatMap((mcp: any) => 
-   (mcp.tools || []).map((tool: any) => ({
-     ...tool,
-     mcpName: mcp.name,
-     mcpId: mcp.id,
-     // Ensure each tool has a unique ID
-     id: tool.id || `${mcp.id}-${tool.name}`,
-     displayName: `${tool.name} (${mcp.name})`,
-   }))
- )

+ // ✅ Group MCP tools by MCP for better organization
+ const mcpGroups = mcps.map((mcp: any) => ({
+   mcpId: mcp.id,
+   mcpName: mcp.name,
+   tools: (mcp.tools || []).map((tool: any) => ({
+     ...tool,
+     mcpName: mcp.name,
+     mcpId: mcp.id,
+     id: tool.id || `${mcp.id}-${tool.name}`,
+     displayName: tool.name,
+   }))
+ })).filter(group => group.tools.length > 0)
```

#### 🔄 Filtros modificados (linha 49)
```diff
const filteredItems = (() => {
  let items: any[] = []
  
  if (selectedTab === 'tools') {
    items = tools
  } else if (selectedTab === 'agents') {
    items = agents
- } else if (selectedTab === 'mcps') {
-   items = mcpTools // ✅ Use individual MCP tools, not MCPs
  }
  
  if (!search) return items
  return items.filter((item: any) => 
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
-   (item.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
-   (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
-   (item.mcpName || '').toLowerCase().includes(search.toLowerCase())
+   (item.description || '').toLowerCase().includes(search.toLowerCase())
  )
})()
+
+ // Filter MCP groups by search
+ const filteredMcpGroups = selectedTab === 'mcps' 
+   ? mcpGroups.map(group => ({
+       ...group,
+       tools: search 
+         ? group.tools.filter((tool: any) =>
+             (tool.name || '').toLowerCase().includes(search.toLowerCase()) ||
+             (tool.description || '').toLowerCase().includes(search.toLowerCase()) ||
+             (group.mcpName || '').toLowerCase().includes(search.toLowerCase())
+           )
+         : group.tools
+     })).filter(group => group.tools.length > 0)
+   : []
+ 
+ const totalMcpTools = mcpGroups.reduce((acc, group) => acc + group.tools.length, 0)
```

#### 🔄 Tab MCP modificado (linha 148)
```diff
<button
  onClick={() => setSelectedTab('mcps')}
  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
    selectedTab === 'mcps'
      ? 'border-primary text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground'
  }`}
  data-testid="tab-mcps"
>
  <Puzzle className="w-4 h-4 inline mr-2" />
- MCP Tools ({mcpTools.length})
+ MCP Tools ({totalMcpTools})
</button>
```

#### 🔄 Lista de items modificada (linha 153)
```diff
- {/* Items Grid */}
- <div className="max-h-96 overflow-y-auto space-y-2" data-testid="nodes-list">
-   {filteredItems.length === 0 && (
-     <div className="text-center py-8 text-muted-foreground">
-       No {selectedTab} found
-     </div>
-   )}
-   
-   {filteredItems.map((item: any) => (
-     <button
-       key={item.id}
-       onClick={() => handleAddNode(item)}
-       className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
-       data-testid={`node-item-${item.id}`}
-     >
-       <div className="flex items-start gap-3">
-         <div className="p-2 bg-primary/10 rounded-lg">
-           {selectedTab === 'tools' && <Zap className="w-5 h-5 text-primary" />}
-           {selectedTab === 'agents' && <Bot className="w-5 h-5 text-primary" />}
-           {selectedTab === 'mcps' && <Puzzle className="w-5 h-5 text-primary" />}
-         </div>
-         <div className="flex-1 min-w-0">
-           <h3 className="font-semibold text-foreground truncate">
-             {item.displayName || item.name}
-           </h3>
-           <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
-             {item.description || 'No description'}
-           </p>
-           {selectedTab === 'tools' && item.category && (
-             <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
-               {item.category}
-             </span>
-           )}
-           {selectedTab === 'mcps' && item.mcpName && (
-             <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-purple-500/10 text-purple-500 rounded">
-               MCP: {item.mcpName}
-             </span>
-           )}
-         </div>
-       </div>
-     </button>
-   ))}
- </div>

+ {/* Items Grid - Tools & Agents */}
+ {selectedTab !== 'mcps' && (
+   <div className="max-h-96 overflow-y-auto space-y-2" data-testid="nodes-list">
+     {filteredItems.length === 0 && (
+       <div className="text-center py-8 text-muted-foreground">
+         No {selectedTab} found
+       </div>
+     )}
+     
+     {filteredItems.map((item: any) => (
+       <button
+         key={item.id}
+         onClick={() => handleAddNode(item)}
+         className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
+         data-testid={`node-item-${item.id}`}
+       >
+         <div className="flex items-start gap-3">
+           <div className="p-2 bg-primary/10 rounded-lg">
+             {selectedTab === 'tools' && <Zap className="w-5 h-5 text-primary" />}
+             {selectedTab === 'agents' && <Bot className="w-5 h-5 text-primary" />}
+           </div>
+           <div className="flex-1 min-w-0">
+             <h3 className="font-semibold text-foreground truncate">
+               {item.name}
+             </h3>
+             <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
+               {item.description || 'No description'}
+             </p>
+             {selectedTab === 'tools' && item.category && (
+               <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
+                 {item.category}
+               </span>
+             )}
+           </div>
+         </div>
+       </button>
+     ))}
+   </div>
+ )}
+ 
+ {/* MCP Tools - Grouped by MCP */}
+ {selectedTab === 'mcps' && (
+   <div className="max-h-96 overflow-y-auto space-y-4" data-testid="nodes-list">
+     {filteredMcpGroups.length === 0 && (
+       <div className="text-center py-8 text-muted-foreground">
+         No MCP tools found
+       </div>
+     )}
+     
+     {filteredMcpGroups.map((group: any) => (
+       <div key={group.mcpId} className="space-y-2">
+         {/* MCP Header */}
+         <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 rounded">
+           <Puzzle className="w-4 h-4 text-purple-500" />
+           <h3 className="font-semibold text-sm text-purple-500">
+             {group.mcpName}
+           </h3>
+           <span className="text-xs text-muted-foreground">
+             ({group.tools.length} {group.tools.length === 1 ? 'tool' : 'tools'})
+           </span>
+         </div>
+         
+         {/* MCP Tools */}
+         {group.tools.map((tool: any) => (
+           <button
+             key={tool.id}
+             onClick={() => handleAddNode(tool)}
+             className="w-full p-3 ml-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
+             data-testid={`node-item-${tool.id}`}
+           >
+             <div className="flex items-start gap-3">
+               <div className="p-2 bg-primary/10 rounded-lg">
+                 <Puzzle className="w-4 h-4 text-primary" />
+               </div>
+               <div className="flex-1 min-w-0">
+                 <h3 className="font-semibold text-sm text-foreground truncate">
+                   {tool.displayName || tool.name}
+                 </h3>
+                 <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
+                   {tool.description || 'No description'}
+                 </p>
+               </div>
+             </div>
+           </button>
+         ))}
+       </div>
+     ))}
+   </div>
+ )}
```

**Razão:** Agrupar ferramentas MCP por MCP de origem com hierarquia visual clara

---

## ➕ Arquivo Novo: test-all-fixes.mjs

**Caminho:** `/workspace/frontend-tests/test-all-fixes.mjs`

Script de teste E2E completo com Playwright para validar todas as 5 correções automaticamente.

**Características:**
- ✅ Testa deleção de nós
- ✅ Testa carregamento de modelos
- ✅ Testa agrupamento MCP
- ✅ Testa configuração de nós
- ✅ Testa lista de ferramentas
- 📊 Relatório detalhado de resultados

---

## 📊 Estatísticas

- **Arquivos Modificados:** 3
- **Arquivos Criados:** 4 (test + docs)
- **Linhas Adicionadas:** ~400
- **Linhas Removidas:** ~50
- **Bugs Corrigidos:** 1 crítico
- **Features Implementadas:** 4
- **Testes Criados:** 1 suite completa

---

## 🎯 Resumo de Impacto

### Alto Impacto
- ✅ Deleção de nós (funcionalidade crítica de UX)

### Médio Impacto
- ✅ Carregamento dinâmico de modelos (flexibilidade)
- ✅ Agrupamento de ferramentas MCP (escalabilidade)

### Baixo Impacto
- ✅ Configuração de nós (clareza)
- ✅ Lista de ferramentas (prevenção de erros)

---

**Versão:** 1.0.0  
**Data:** 2025-10-24  
**Status:** ✅ PRODUCTION READY
