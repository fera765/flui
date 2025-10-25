# 🧪 TESTE DE INTEGRAÇÃO FRONTEND

## ✅ CORREÇÃO APLICADA

**Problema:** Modal genérico abria ao invés do WebhookTriggerModal

**Solução:** Adicionado useEffect que detecta `toolId` e abre modal correto

---

## 🔧 CÓDIGO CORRIGIDO

### NodeConfigModal.tsx

```typescript
// ✅ DETECTAR TRIGGERS e abrir modal específico
useEffect(() => {
  if (isConfigModalOpen && selectedNode && automationId) {
    const toolId = selectedNode.data.toolId
    
    console.log('[NodeConfigModal] Checking for trigger:', {
      toolId,
      isWebhook: toolId === 'webhook-trigger',
      isCron: toolId === 'cron-trigger',
      automationId,
    })
    
    if (toolId === 'webhook-trigger') {
      console.log('[NodeConfigModal] 🔗 Abrindo WebhookTriggerModal')
      setShowWebhookModal(true)
      closeConfigModal() // Fechar modal genérico
    } else if (toolId === 'cron-trigger') {
      console.log('[NodeConfigModal] ⏰ Abrindo CronTriggerModal')
      setShowCronModal(true)
      closeConfigModal() // Fechar modal genérico
    }
  }
}, [isConfigModalOpen, selectedNode?.data.toolId, automationId])

// ... no final do return

return (
  <>
    <Modal isOpen={isConfigModalOpen} ...>
      {/* Conteúdo genérico */}
    </Modal>
    
    {/* Webhook Trigger Modal */}
    {showWebhookModal && automationId && (
      <WebhookTriggerModal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        automationId={automationId}
      />
    )}
    
    {/* Cron Trigger Modal */}
    {showCronModal && automationId && (
      <CronTriggerModal
        isOpen={showCronModal}
        onClose={() => setShowCronModal(false)}
        automationId={automationId}
      />
    )}
  </>
)
```

---

## 🧪 TESTE MANUAL (Browser)

### 1. Acessar Frontend
```
http://localhost:5173
```

### 2. Criar Automação
```
Sidebar → Automations → Create New
Nome: "Test Webhook Integration"
Save
```

### 3. Adicionar Node Webhook
```
Canvas → Tools (na barra lateral)
Arrastar "Webhook Trigger" para o canvas
```

### 4. Configurar Node (PASSO CRÍTICO!)
```
Duplo-clique no node "Webhook Trigger"

✅ DEVE ACONTECER:
  1. NodeConfigModal genérico abre por 0.1s
  2. useEffect detecta toolId === 'webhook-trigger'
  3. NodeConfigModal fecha
  4. WebhookTriggerModal abre

❌ NÃO DEVE ACONTECER:
  - Modal genérico ficar aberto
  - Mostrar "No parameters defined"
  - Não ter URL/Token
```

### 5. Verificar WebhookTriggerModal
```
Modal deve mostrar:

📝 Configurações:
  - Path Customizado (input, opcional)
  - Método HTTP (select: POST, GET, PUT, etc.)
  - Rate Limit (input número)
  - ✓ Requer Autenticação (checkbox)
  - ✓ Habilitado (checkbox)

📋 JSON Schema (Campos Esperados):
  - Botão: [+ Adicionar Campo]
  - (vazio inicialmente)

🔘 Botões:
  - [Fechar]
  - [Criar Webhook]
```

### 6. Adicionar Campos JSON Schema
```
Click "Adicionar Campo"

Deve aparecer card com:
  - Input "Nome do campo" (ex: name)
  - Select "Type" (string, number, boolean, json, array, object)
  - Checkbox "Obrigatório"
  - Input "Descrição" (opcional)
  - Botão [🗑️] DELETE

Adicionar 2 campos:
  1. name (string, obrigatório)
  2. age (number, opcional)
```

### 7. Criar Webhook
```
Click "Criar Webhook"

✅ DEVE ACONTECER:
  - Toast: "Webhook criado!"
  - Modal atualiza mostrando card "Webhook Ativo"
  - Card mostra:
    🔗 Webhook URL
       http://localhost:3001/webhook/webhook-xxx
       [📋 Copy]
    
    🔐 Secret Token
       64-char-hex-string
       [📋 Copy] [🔄 Regenerate]
    
    📋 Exemplo (CURL)
       curl -X POST "http://localhost:3001/webhook/webhook-xxx" ...
       [📋 Copy]
```

### 8. Testar Botões
```
✅ Click [Copy] da URL → Copiado para clipboard
✅ Click [Copy] do Token → Copiado para clipboard
✅ Click [Regenerate] → Novo token gerado
✅ Click [Copy] do CURL → Copiado para clipboard
```

### 9. Fechar e Reabrir
```
Click "Fechar"
Duplo-clique no node novamente

✅ DEVE ACONTECER:
  - WebhookTriggerModal abre direto (não genérico)
  - Mostra webhook existente com URL e Token
  - Botões funcionam
```

---

## 🐛 DEBUG (Se não funcionar)

### Console do Browser (F12 → Console)

#### Logs esperados:
```javascript
[NodeConfigModal] Syncing config from node: {...}

[NodeConfigModal] Selected node: {
  id: "node-xxx",
  type: "tool",
  toolId: "webhook-trigger",  // ← DEVE TER ISSO!
  ...
}

[NodeConfigModal] Checking for trigger: {
  toolId: "webhook-trigger",  // ← DEVE SER webhook-trigger
  isWebhook: true,           // ← DEVE SER true
  automationId: "xxx"        // ← DEVE TER ID
}

[NodeConfigModal] 🔗 Abrindo WebhookTriggerModal
```

#### Se toolId for undefined ou diferente:
```
❌ O node não foi criado corretamente
❌ Verificar em Redux DevTools o state do node
❌ Node.data.toolId deve ser "webhook-trigger"
```

---

## 🔧 FORÇAR CORREÇÃO (Se necessário)

### Se node não tem toolId correto:

```javascript
// No console do browser
// 1. Abrir Redux DevTools
// 2. Ver workflowStore → nodes
// 3. Encontrar o node do webhook
// 4. Verificar: node.data.toolId === 'webhook-trigger'

// Se estiver errado, corrigir manualmente:
workflowStore.getState().updateNode('node-xxx', {
  ...node.data,
  toolId: 'webhook-trigger'
})
```

---

## ✅ CHECKLIST

- [ ] Frontend rodando em http://localhost:5173
- [ ] Backend rodando em http://localhost:3001
- [ ] Criar automação funciona
- [ ] Adicionar node "Webhook Trigger" funciona
- [ ] Duplo-clique abre WebhookTriggerModal (não genérico)
- [ ] Modal mostra campos corretos
- [ ] Criar webhook funciona
- [ ] URL aparece (read-only, copy)
- [ ] Token aparece (read-only, copy, regenerate)
- [ ] CURL example aparece (copy)
- [ ] Console mostra logs corretos

---

## 🚀 PRÓXIMO PASSO

Se TUDO acima funcionar:
- ✅ Testar Cron Trigger (mesma lógica)
- ✅ Testar disparo de webhook
- ✅ Ver execução em /executions em tempo real

---

**Status:** Código corrigido, pronto para teste no browser  
**Frontend:** http://localhost:5173  
**Backend:** http://localhost:3001
