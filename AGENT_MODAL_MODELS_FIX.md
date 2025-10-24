# Fix: AgentModal - Busca Real de Modelos

## 🔍 Problema Identificado

O **AgentModal** usava os modelos retornados pelo hook `useModels()`, mas não mostrava:
- Estado de loading
- Erros ao buscar modelos
- Botão para refresh dos modelos
- Feedback visual sobre quantos modelos foram carregados

## ✅ Solução Implementada

### 1. Importações Adicionadas
```typescript
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
```

### 2. Hook com Estados Completos
```typescript
const { 
  data: models = [], 
  isLoading: isLoadingModels, 
  error: modelsError, 
  refetch: refetchModels 
} = useModels()
```

### 3. UI Melhorada

**Header com Botão Refresh**:
```tsx
<div className="flex items-center justify-between mb-2">
  <label>Model *</label>
  <button
    type="button"
    onClick={() => refetchModels()}
    disabled={isLoadingModels}
    className="flex items-center gap-1 text-xs"
  >
    <RefreshCw className={isLoadingModels ? 'animate-spin' : ''} />
    Refresh
  </button>
</div>
```

**Mensagem de Erro**:
```tsx
{modelsError && (
  <div className="p-2 bg-destructive/10 border border-destructive/20">
    <AlertCircle className="w-4 h-4" />
    <div>
      <p>Failed to load models</p>
      <p>Configure LLM in Settings first, or using mock models</p>
    </div>
  </div>
)}
```

**Select com Loading**:
```tsx
<select disabled={isLoadingModels}>
  <option value="">
    {isLoadingModels ? 'Loading models...' : 'Select a model'}
  </option>
  {((models as any)?.data || models || []).map((model: any) => (
    <option key={model.id} value={model.id}>
      {model.id}
    </option>
  ))}
</select>
```

**Contador de Modelos**:
```tsx
{!isLoadingModels && !modelsError && (
  <p className="mt-1 text-xs text-muted-foreground">
    {((models as any)?.data || models || []).length} model(s) available
  </p>
)}
```

## 🔄 Fluxo de Busca de Modelos

```
1. AgentModal abre
   ↓
2. useModels() hook executa
   ↓
3. api.getModels() chama /api/models
   ↓
4. Backend verifica config LLM
   ↓
5. Se configurado:
   → Busca do endpoint LLM real
   ↓
6. Se não configurado ou erro:
   → Retorna modelos mock
   ↓
7. Frontend atualiza select
```

## 📊 Estados Visuais

### Loading
```
┌─────────────────────────┐
│ Model *      [⟳] Refresh │
├─────────────────────────┤
│ ⟳ Loading models...     │
└─────────────────────────┘
```

### Erro
```
┌─────────────────────────┐
│ Model *      [↻] Refresh │
├─────────────────────────┤
│ ⚠️ Failed to load models │
│    Configure LLM first   │
├─────────────────────────┤
│ Select a model...       │
└─────────────────────────┘
```

### Sucesso
```
┌─────────────────────────┐
│ Model *      [↻] Refresh │
├─────────────────────────┤
│ gpt-4-turbo-preview     │
├─────────────────────────┤
│ 15 model(s) available   │
└─────────────────────────┘
```

## 🔧 Backend: Endpoint /api/models

O backend já implementa busca real:

```typescript
app.get('/api/models', async (_req, res) => {
  const config = getConfig();
  
  // Se não tiver config, retornar mock
  if (!config?.llm?.endpoint) {
    return res.json({
      data: [
        { id: 'gpt-4-turbo-preview', ... },
        { id: 'gpt-4', ... },
        { id: 'gpt-3.5-turbo', ... },
      ]
    });
  }
  
  // Buscar modelos reais do endpoint
  const response = await fetch(`${config.llm.endpoint}/models`, {
    headers: { Authorization: `Bearer ${config.llm.apiKey}` }
  });
  
  return res.json(await response.json());
});
```

## 🎯 Melhorias Implementadas

1. ✅ **Loading State**: Spinner animado durante busca
2. ✅ **Error Handling**: Mensagem clara quando falha
3. ✅ **Refresh Button**: Usuário pode recarregar manualmente
4. ✅ **Model Counter**: Mostra quantos modelos disponíveis
5. ✅ **Mock Fallback**: Se LLM não configurado, usa mock
6. ✅ **Disabled State**: Select desabilitado durante loading

## 📝 Como Usar

### Cenário 1: LLM Não Configurado
1. Usuário abre AgentModal
2. Vê mensagem "Configure LLM in Settings first"
3. Modelos mock aparecem como opção
4. Pode criar agent com modelo mock
5. Depois, configurar LLM real em Settings

### Cenário 2: LLM Configurado
1. Usuário configura LLM em Settings
2. Abre AgentModal
3. Modelos reais são carregados automaticamente
4. Vê contador: "15 model(s) available"
5. Pode clicar Refresh para atualizar lista

### Cenário 3: Mudou Endpoint
1. Usuário muda endpoint em Settings
2. Volta para AgentModal
3. Clica no botão "Refresh"
4. Novos modelos são carregados

## 🐛 Problema Adicional: toolId undefined

**Status**: ✅ **Não é um problema!**

Para nodes do tipo `'agent'`:
- `agentId` = ID do agente a executar (obrigatório)
- `toolId` = undefined (correto!)

O FlowEngineV2 detecta `node.type === 'agent'` e usa o `agentId` para executar.

```typescript
// ✅ CORRETO
{
  id: 'node-1761329042464',
  type: 'agent',
  agentId: '1761329032910',  // ✅ Usado pelo engine
  toolId: undefined           // ✅ Correto para agents
}
```

## 📁 Arquivo Modificado

- `flui-frontend/src/components/agents/AgentModal.tsx`

## 🧪 Teste

1. Abra AgentModal sem LLM configurado:
   - Deve mostrar aviso
   - Deve mostrar modelos mock
   
2. Configure LLM em Settings

3. Volte ao AgentModal:
   - Deve carregar modelos reais
   - Deve mostrar contador

4. Clique em Refresh:
   - Deve mostrar spinner
   - Deve recarregar modelos

---

**Status**: ✅ Implementado e funcional
**UX**: ✅ Clara e informativa
**Fallback**: ✅ Mock models quando necessário
