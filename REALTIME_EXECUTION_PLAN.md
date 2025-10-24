# Plan: Execução em Tempo Real com WebSocket

## 🎯 Objetivos

1. **Timeline em tempo real**: Nodes ficam verdes conforme executam
2. **Chat limpo**: Sem mensagens durante execução, apenas mensagem final (máx 4 palavras)
3. **Contexto completo**: Todos inputs/outputs disponíveis para o chat
4. **Animações elegantes**: Transições suaves e visuais atraentes

## 🔄 Como Funciona Atualmente

### Backend (✅ Já implementado)
```typescript
// source/services/apiServer.ts

const engine = new FlowEngineV2(executionFlow, (log) => {
  allLogs.push(log);
  
  // ✅ Broadcast em tempo real via WebSocket
  broadcast({
    type: 'execution-log',
    automationId: automation.id,
    log,  // { status: 'completed', nodeId, nodeName, message, data: {...} }
  });
});
```

### Frontend (❌ NÃO conectado)
- ExecutionModalV2 não se conecta ao WebSocket
- Recebe dados apenas no final da execução
- Todos os nodes atualizam de uma vez

## ✅ Solução

### 1. Hook useWebSocket

**Arquivo**: `flui-frontend/src/hooks/useWebSocket.ts`

```typescript
export function useWebSocket(options) {
  const wsRef = useRef<WebSocket | null>(null)
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001')
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (options.onMessage) {
        options.onMessage(message)
      }
    }
    
    wsRef.current = ws
    
    return () => ws.close()
  }, [])
  
  return { ws: wsRef.current }
}
```

### 2. ExecutionModalV2 Refatorado

**Mudanças principais**:

#### A. Conectar ao WebSocket
```typescript
useWebSocket({
  onMessage: (message) => {
    if (message.automationId !== context.automationId) return
    
    if (message.type === 'execution-log') {
      const log = message.log
      
      // Atualizar node específico
      setExecutionNodes(prev => prev.map(node => 
        node.id === log.nodeId
          ? { 
              ...node, 
              status: mapStatus(log.status),  // running → running, completed → success
              output: log.data?.output 
            }
          : node
      ))
    }
  }
})
```

#### B. Remover Mensagens Automáticas
```typescript
// ❌ ANTES
useEffect(() => {
  newLogs.forEach(log => {
    setChatMessages(prev => [...prev, {
      content: `⚡ ${log.nodeName}: Executando...`  // ❌ Poluído
    }])
  })
}, [context.logs])

// ✅ DEPOIS
// Sem useEffect processando logs para mensagens
// Chat fica LIMPO durante execução
```

#### C. Mensagem Final Curta
```typescript
// ✅ Apenas mensagem final
useEffect(() => {
  if (context.status === 'completed') {
    setChatMessages([{
      role: 'system',
      content: context.files.length > 0 
        ? '✅ Concluído com arquivos'  // 3 palavras
        : '✅ Concluído com sucesso'   // 3 palavras
    }])
  } else if (context.status === 'failed') {
    setChatMessages([{
      role: 'system',
      content: '❌ Execução falhou'  // 2 palavras
    }])
  }
}, [context.status])
```

#### D. Contexto Completo para Chat
```typescript
// Preparar contexto quando finalizar
useEffect(() => {
  if (context.status === 'completed' || context.status === 'failed') {
    const contextParts = []
    
    context.logs.forEach((log, idx) => {
      contextParts.push(`Node ${idx + 1}: ${log.nodeName}`)
      contextParts.push(`Input: ${JSON.stringify(log.input)}`)
      contextParts.push(`Output: ${JSON.stringify(log.output)}`)
    })
    
    setExecutionContext(contextParts.join('\n'))
  }
}, [context.status])

// Ao enviar mensagem
const handleSendMessage = async () => {
  const response = await api.post('/chat', {
    message: userMessage,
    // ✅ TODO o contexto
    executionContext: executionContext
  })
}
```

### 3. Animações Elegantes

**CSS/Tailwind**:
```tsx
{/* Node com transição suave */}
<div className={`
  transition-all duration-500 ease-out
  ${node.status === 'running' 
    ? 'scale-105 animate-pulse border-blue-500 shadow-blue-500/50 shadow-2xl' 
    : node.status === 'success'
    ? 'scale-100 border-green-500 bg-green-500/10'
    : 'scale-100 opacity-60'
  }
`}>
  {/* Ícone animado */}
  {node.status === 'running' && (
    <Loader2 className="animate-spin text-blue-500" />
  )}
  {node.status === 'success' && (
    <CheckCircle2 className="text-green-500 animate-bounce-once" />
  )}
</div>
```

## 🔄 Fluxo Completo

```
1. Usuário clica "Run"
   ↓
2. WorkflowEditor.handleRun()
   - Abre ExecutionModalV2
   - Chama API POST /execute
   ↓
3. Backend: FlowEngineV2.execute()
   - Para cada node:
     a. this.log(nodeId, 'running', '...') → WebSocket broadcast
     b. Executa node
     c. this.log(nodeId, 'completed', '...') → WebSocket broadcast
   ↓
4. Frontend: ExecutionModalV2 (conectado via WebSocket)
   - Recebe 'execution-log' → Atualiza node específico
   - Node muda: pending → running (azul, pulse)
   - Node muda: running → success (verde, checkmark)
   ↓
5. Backend: Termina todos os nodes
   - broadcast({ type: 'execution-complete' })
   ↓
6. Frontend: WorkflowEditor recebe resultado completo
   - Atualiza context final
   - ExecutionModalV2 mostra mensagem (máx 4 palavras)
   - Prepara contexto completo para chat
```

## 📊 Timeline Visual

### Antes (tudo de uma vez)
```
[Inicia execução]
⏳ Node 1
⏳ Node 2  
⏳ Node 3
  ...aguarda...
[Finaliza tudo]
✓ Node 1
✓ Node 2
✓ Node 3
```

### Depois (em tempo real)
```
[Inicia]
⚡ Node 1 (azul, pulse)
⏳ Node 2
⏳ Node 3
  ↓ WebSocket
✓ Node 1 (verde)
⚡ Node 2 (azul, pulse)
⏳ Node 3
  ↓ WebSocket
✓ Node 1
✓ Node 2 (verde)
⚡ Node 3 (azul, pulse)
  ↓ WebSocket
✓ Node 1
✓ Node 2
✓ Node 3 (verde)
[Finaliza]
```

## 📝 Chat Experience

### Antes
```
🚀 Iniciando...
⚡ Manual Trigger: Executando...
✅ Manual Trigger executado
⚡ Agent: Executando agente...
✅ Agent executado
🎉 Automação concluída com sucesso!
```

### Depois
```
[Timeline animando em tempo real]
[Chat vazio/limpo]
  ...
[Finaliza]
✅ Concluído com sucesso

[Usuário pergunta]
> O que o agent respondeu?

[LLM tem TODO o contexto]
< O agent executou com input "oi" e retornou "Olá! Como posso ajudar?"...
```

## 🎨 Animações CSS

### Pulse Suave
```css
@keyframes gentle-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.02); }
}

.animate-gentle-pulse {
  animation: gentle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Bounce Once (checkmark)
```css
@keyframes bounce-once {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-bounce-once {
  animation: bounce-once 0.5s ease-out;
}
```

### Glow Effect
```css
.shadow-glow-blue {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.shadow-glow-green {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
}
```

## 📁 Arquivos a Modificar

1. ✅ `flui-frontend/src/hooks/useWebSocket.ts` (criado)
2. ⏳ `flui-frontend/src/components/automations/ExecutionModalV2.tsx` (refatorar)
3. ⏳ `flui-frontend/src/pages/WorkflowEditor.tsx` (ajustes menores)

## ✅ Checklist

- [x] Criar hook useWebSocket
- [ ] Conectar ExecutionModalV2 ao WebSocket
- [ ] Remover mensagens automáticas do chat
- [ ] Adicionar mensagem final (máx 4 palavras)
- [ ] Preparar contexto completo para chat
- [ ] Melhorar animações CSS
- [ ] Testar fluxo completo

## 🧪 Teste

1. Criar automação: Manual Trigger → Agent
2. Clicar Run
3. **Verificar**:
   - ✅ Timeline: Node 1 fica azul (pulse)
   - ✅ Timeline: Node 1 fica verde, Node 2 fica azul
   - ✅ Timeline: Ambos verdes
   - ✅ Chat: Vazio durante execução
   - ✅ Chat: "✅ Concluído com sucesso" no final
   - ✅ Chat: Perguntar sobre execução → LLM responde com detalhes

---

**Status**: 🚧 Em implementação
**WebSocket Backend**: ✅ Funcionando
**WebSocket Frontend**: ⏳ A implementar
