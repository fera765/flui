# Guia de Uso: ExecutionModalV2

## 🚀 Como Funciona

### 1. Inicialização da Execução

Quando o usuário clica em "Run" na automação:

```typescript
const handleRun = async () => {
  // 1. Preparar nodes para timeline
  const executionNodes = nodes.map(node => ({
    id: node.id,
    name: node.data.name,
    type: node.data.type,
    status: 'pending',
  }))
  
  // 2. Abrir modal com contexto inicial
  setExecutionContext({
    automationName: 'My Automation',
    automationId: 'auto-123',
    status: 'running',
    nodesExecuted: 0,
    files: [],
    logs: [],
    nodes: executionNodes,
  })
  
  // 3. Iniciar execução no backend
  await executeAutomation({ id: automationId })
}
```

### 2. Atualizações em Tempo Real

Conforme a execução progride, atualize o contexto:

```typescript
// Node começou a executar
setExecutionContext(prev => ({
  ...prev,
  nodes: prev.nodes.map(n => 
    n.id === currentNodeId 
      ? { ...n, status: 'running', startTime: Date.now() }
      : n
  ),
  logs: [...prev.logs, {
    timestamp: new Date().toISOString(),
    level: 'info',
    nodeId: currentNodeId,
    nodeName: currentNodeName,
    message: 'Executando...',
    input: nodeInput,
  }]
}))

// Node concluiu com sucesso
setExecutionContext(prev => ({
  ...prev,
  nodesExecuted: prev.nodesExecuted + 1,
  nodes: prev.nodes.map(n => 
    n.id === currentNodeId 
      ? { 
          ...n, 
          status: 'success',
          endTime: Date.now(),
          duration: Date.now() - n.startTime!,
          output: nodeOutput,
        }
      : n
  ),
  logs: [...prev.logs, {
    timestamp: new Date().toISOString(),
    level: 'success',
    nodeId: currentNodeId,
    nodeName: currentNodeName,
    message: 'Concluído com sucesso',
    output: nodeOutput,
  }],
  // Adicionar arquivos se houver
  files: [...prev.files, ...extractFiles(nodeOutput)]
}))
```

### 3. Detecção Automática de Arquivos

O modal detecta automaticamente arquivos nos outputs:

```typescript
// ✅ Formato suportado 1: Array de arquivos
{
  output: {
    files: [
      {
        name: 'report.pdf',
        type: 'application/pdf',
        content: 'base64...',
        size: 102400
      }
    ]
  }
}

// ✅ Formato suportado 2: Links
{
  output: {
    links: ['https://example.com/download'],
    url: 'https://example.com/result'
  }
}

// ✅ Formato suportado 3: Arquivo único
{
  output: {
    file: {
      name: 'output.txt',
      type: 'text/plain',
      content: 'Hello World'
    }
  }
}
```

### 4. Chat com LLM

Após a conclusão, usuário pode fazer perguntas:

```typescript
// Endpoint do backend
POST /api/automations/:id/chat
{
  message: "Quais arquivos foram gerados?",
  executionContext: {
    status: "completed",
    duration: 5600,
    nodesExecuted: 4,
    files: [...],
    logs: [...],
    nodes: [...]
  }
}

// Resposta
{
  response: "Foram gerados 2 arquivos: report.pdf (100KB) e summary.txt (2KB)"
}
```

## 🎯 Funcionalidades Visuais

### Timeline
- **Auto-scroll** para node em execução
- **Highlight** no node ativo
- **Progress indicator** (X / Y nós)
- **Duration** de cada node
- **Error messages** inline

### Chat
- **Sistema**: Notificações automáticas de progresso
- **Usuário**: Perguntas sobre execução
- **Assistente**: Respostas do LLM
- **Arquivos**: Cards com download
- **Links**: Buttons clicáveis

### Logs
- **Collapsible** Input/Output
- **JSON formatado**
- **Cores por nível**
- **Timestamps**
- **Filtros** (futuro)

## 📱 Exemplo Completo

```typescript
import { ExecutionModalV2 } from '@/components/automations/ExecutionModalV2'

function MyComponent() {
  const [executionContext, setExecutionContext] = useState(null)
  
  const runAutomation = async () => {
    // Preparar
    const nodes = [
      { id: 'n1', name: 'Start', type: 'trigger', status: 'pending' },
      { id: 'n2', name: 'Process', type: 'agent', status: 'pending' },
      { id: 'n3', name: 'Save', type: 'tool', status: 'pending' },
    ]
    
    // Abrir modal
    setExecutionContext({
      automationName: 'Data Processing',
      automationId: 'auto-123',
      status: 'running',
      nodesExecuted: 0,
      files: [],
      logs: [],
      nodes,
    })
    
    // Simular execução
    for (const node of nodes) {
      // Running
      setExecutionContext(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === node.id ? { ...n, status: 'running' } : n
        )
      }))
      
      await new Promise(r => setTimeout(r, 1000))
      
      // Success
      setExecutionContext(prev => ({
        ...prev,
        nodesExecuted: prev.nodesExecuted + 1,
        nodes: prev.nodes.map(n =>
          n.id === node.id ? { ...n, status: 'success', duration: 1000 } : n
        ),
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          level: 'success',
          nodeId: node.id,
          nodeName: node.name,
          message: 'Success',
          output: { result: 'ok' }
        }]
      }))
    }
    
    // Finalizar
    setExecutionContext(prev => ({
      ...prev,
      status: 'completed',
      duration: 3000
    }))
  }
  
  return (
    <>
      <button onClick={runAutomation}>Run</button>
      
      {executionContext && (
        <ExecutionModalV2
          isOpen={!!executionContext}
          onClose={() => setExecutionContext(null)}
          context={executionContext}
        />
      )}
    </>
  )
}
```

## 🔧 Customização

### Cores dos Estados
Edite em `ExecutionModalV2.tsx`:
```typescript
const getStatusColor = (status) => {
  switch (status) {
    case 'success': return 'text-green-500 border-green-500 bg-green-500/10'
    case 'error': return 'text-red-500 border-red-500 bg-red-500/10'
    // ... customize aqui
  }
}
```

### Ícones dos Nodes
```typescript
const getStatusIcon = (status) => {
  switch (status) {
    case 'success': return <CheckCircle2 className="w-5 h-5" />
    case 'error': return <XCircle className="w-5 h-5" />
    // ... customize aqui
  }
}
```

### Mensagens do Sistema
```typescript
// Personalizar mensagens automáticas
{
  role: 'system',
  content: `🚀 Iniciando ${automationName}...`
}

{
  role: 'system',
  content: `✅ ${nodeName} concluído\n📁 ${files.length} arquivos`
}
```

## 🐛 Troubleshooting

### Arquivos não aparecem no chat
**Problema**: Arquivos gerados mas não aparecem
**Solução**: Verificar formato do output:
```typescript
// ✅ Correto
output: {
  files: [{ name: 'file.txt', type: 'text/plain', content: '...' }]
}

// ❌ Errado
output: {
  file: 'file.txt'  // String não é detectada
}
```

### Timeline não atualiza
**Problema**: Nodes ficam em "pending"
**Solução**: Atualizar contexto corretamente:
```typescript
setExecutionContext(prev => ({
  ...prev,  // ⚠️ Importante: spread prev
  nodes: prev.nodes.map(...)  // Atualizar nodes
}))
```

### Chat travado
**Problema**: Chat não permite enviar mensagens
**Solução**: Verificar status:
```typescript
disabled={context.status === 'running'}  // Desabilita durante execução
```

## ✅ Checklist de Implementação

- [x] ExecutionModalV2 criado
- [x] Timeline visual com estados
- [x] Chat com sistema de mensagens
- [x] Detecção automática de arquivos
- [x] Download de arquivos
- [x] Logs detalhados
- [x] Integração com WorkflowEditor
- [ ] WebSocket para updates em tempo real
- [ ] Streaming de logs
- [ ] Cancelamento de execução
- [ ] Retry de nodes falhados
- [ ] Export de logs

## 🚀 Próximos Passos

1. **WebSocket Integration**: Updates em tempo real do backend
2. **Streaming**: Logs streamados conforme execução
3. **Cancel Button**: Cancelar execução em andamento
4. **Retry**: Reexecutar nodes que falharam
5. **Export**: Exportar logs e resultados
6. **Filters**: Filtrar logs por nível/node
7. **Search**: Buscar nos logs
8. **Performance**: Virtual scroll para muitos nodes

---

**Status**: ✅ Implementado e funcional
**Versão**: 2.0
**Data**: 2025-10-24
