# 🧪 TESTE FRONTEND - WEBHOOK TRIGGER MODAL

## ✅ CORREÇÃO APLICADA

Adicionei `useEffect` que detecta quando o node é `webhook-trigger` ou `cron-trigger` e abre o modal correto automaticamente.

---

## 🔧 O QUE FOI CORRIGIDO

### Antes:
```
Clicar em config do node webhook-trigger
→ Abria NodeConfigModal genérico
→ Sem URL, sem Token, sem nada
```

### Depois:
```
Clicar em config do node webhook-trigger
→ Detecta toolId === 'webhook-trigger'
→ Fecha NodeConfigModal genérico
→ Abre WebhookTriggerModal
→ Mostra URL, Token, Regenerate, Copy buttons
```

---

## 🧪 COMO TESTAR

### 1. Abrir Frontend
```
http://localhost:5173
```

### 2. Criar/Abrir Automação
```
Sidebar → Automations → Create
Ou abrir automação existente
```

### 3. Adicionar Node Webhook Trigger
```
Canvas → Botão "+" ou arrastar
Selecionar: "Webhook Trigger"
```

### 4. Configurar Node
```
Duplo-clique no node
Ou clique direito → Configure
```

### 5. Verificar Modal
```
✅ Deve abrir: WebhookTriggerModal
❌ NÃO deve abrir: NodeConfigModal genérico

WebhookTriggerModal deve mostrar:
- Campo "Path" (opcional)
- Select "Method" (POST, GET, etc.)
- Campo "Rate Limit"
- Toggle "Requer Autenticação"
- Toggle "Habilitado"
- Seção "JSON Schema" com botão ADD
```

### 6. Criar Webhook
```
- Deixar campos padrão ou customizar
- Click "Criar Webhook"

Modal atualiza mostrando:
- ✅ Webhook Ativo (card verde/azul)
- 🔗 Webhook URL (read-only, copy button)
- 🔐 Secret Token (read-only, copy button, REGENERATE button)
- 📋 Exemplo CURL (read-only, copy button)
```

---

## 🐛 SE NÃO FUNCIONAR

### Debug no Browser Console

Abrir DevTools → Console

Procurar logs:
```
[NodeConfigModal] Syncing config from node: {...}
[NodeConfigModal] Checking for trigger: {
  toolId: 'webhook-trigger',
  isWebhook: true,
  automationId: 'xxx'
}
[NodeConfigModal] 🔗 Abrindo WebhookTriggerModal
```

Se NÃO aparecer `toolId: 'webhook-trigger'`:
- O node não tem `data.toolId` correto
- Verificar no Redux DevTools o state do node

Se aparecer mas modal não abre:
- Verificar se `automationId` existe
- Verificar se componente `WebhookTriggerModal` está importado

---

## 📝 CÓDIGO ADICIONADO

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
```

---

## ✅ VALIDAÇÃO

### Checklist:
- [ ] NodeConfigModal detecta webhook-trigger
- [ ] NodeConfigModal fecha automaticamente
- [ ] WebhookTriggerModal abre
- [ ] Modal mostra campos corretos
- [ ] Botão "Criar Webhook" funciona
- [ ] URL aparece (read-only, copy button)
- [ ] Token aparece (read-only, copy button)
- [ ] Botão REGENERATE aparece e funciona
- [ ] Exemplo CURL aparece (copy button)

---

## 🚀 PRÓXIMOS PASSOS

Se tudo funcionar:
- ✅ Testar Cron Trigger da mesma forma
- ✅ Testar criação de webhook via UI
- ✅ Testar disparo de webhook
- ✅ Ver execução em /executions

---

**Status:** Código corrigido, aguardando validação no browser
