# 🧪 TESTE MANUAL - Persistência de Configuração de Node no Frontend

## 🎯 Objetivo
Validar que as configurações dos nodes são persistidas corretamente quando:
1. Usuário adiciona um node
2. Configura o node no modal
3. Salva a configuração
4. Salva a automação
5. Executa a automação

---

## 📋 TESTE PASSO A PASSO

### Pré-requisito
- Frontend rodando em http://localhost:8080
- Backend rodando em http://localhost:3001
- LLM configurado

### Passo 1: Criar Nova Automação
1. Acesse http://localhost:8080/automations
2. Clique em "Nova Automação"
3. Nome: "Teste de Persistência Config"

### Passo 2: Adicionar Nodes
1. Clique em "+ Adicionar Ferramenta"
2. Aba "Ferramentas" → Adicione "Manual Trigger"
3. Aba "Agentes" → Adicione um agente existente

### Passo 3: Configurar o Agente
1. **Clique no node do agente** para abrir o modal de configuração
2. Preencha os campos:
   - **Prompt**: "Diga olá de forma bem curta!"
   - Outros campos conforme necessário
3. **Clique em "Salvar Configuração"**
4. **IMPORTANTE**: Modal deve fechar

### Passo 4: Salvar a Automação
1. **Clique no botão "Salvar"** no topo da página
2. Aguarde mensagem "Automação salva com sucesso!"

### Passo 5: Recarregar a Página (Teste de Persistência)
1. **Pressione F5** ou **Ctrl+R** para recarregar
2. Volte para a automação criada (Edit)
3. **Clique no node do agente** novamente
4. **VALIDAR**: O campo "Prompt" deve mostrar "Diga olá de forma bem curta!"
   - ✅ **SUCESSO** se mostrar o valor
   - ❌ **FALHA** se estiver vazio

### Passo 6: Executar a Automação
1. **Clique em "Executar"**
2. Aguarde a execução
3. **VALIDAR**: Agente deve responder (não deve dar erro "Input é obrigatório")
   - ✅ **SUCESSO** se executar e responder
   - ❌ **FALHA** se der erro "Input é obrigatório para o agente"

---

## 🐛 PROBLEMAS CONHECIDOS (CORRIGIDOS)

### Problema 1: Config perdido ao salvar automação
**Sintoma**:
- Configuração salva no modal
- Ao clicar em "Salvar Automação", config é perdido
- Na execução: "Input é obrigatório para o agente"

**Causa**:
- Modal salvava no backend via PATCH ✅
- Mas NÃO atualizava estado React ❌
- "Salvar Automação" usava estado React desatualizado ❌

**Correção Aplicada**:
```typescript
// EditAutomation.tsx - onSave do NodeConfigurationModalV2
onSave={(savedNodeId?: string, savedConfig?: any) => {
  // ✅ FIX: Atualizar estado React após salvar no backend
  if (savedNodeId && savedConfig) {
    handleSaveNodeConfig(savedNodeId, savedConfig);
  }
  setConfigPanelOpen(false);
  setSelectedNode(null);
}}
```

---

## ✅ RESULTADO ESPERADO APÓS CORREÇÃO

### Durante Configuração:
1. Abrir modal → Preencher campos → Salvar
2. ✅ Backend recebe PATCH e salva
3. ✅ Estado React atualiza imediatamente
4. ✅ Modal fecha

### Ao Salvar Automação:
1. Clicar em "Salvar"
2. ✅ Automação é salva com configs atualizados
3. ✅ Recarregar preserva todas as configurações

### Durante Execução:
1. Clicar em "Executar"
2. ✅ Agente recebe o prompt configurado
3. ✅ Execução completa sem erro
4. ✅ Agente responde corretamente

---

## 🔍 DEBUGGING (Se Falhar)

### Verificar Logs do Frontend (F12 Console)
```javascript
// Ao salvar config no modal, deve aparecer:
📝 [EditAutomation] Atualizando estado local após salvar config: {
  nodeId: "node-...",
  config: { prompt: "...", ... }
}
```

### Verificar Payload Enviado
```bash
# Ao clicar "Salvar Automação", verificar no Network tab:
# PUT /api/automations/:id

# Payload deve conter:
{
  "nodes": [
    {
      "config": {
        "params": {
          "prompt": "Diga olá de forma bem curta!"  // ✅ Deve estar aqui!
        }
      }
    }
  ]
}
```

### Verificar Storage Backend
```bash
cat /workspace/workspace/storage/config.json | grep -A10 '"nodes"'
```

---

## 📊 CHECKLIST FINAL

- [ ] Config salvo no modal persiste
- [ ] Recarregar página mantém config
- [ ] Salvar automação preserva config
- [ ] Executar automação usa config
- [ ] Agente recebe prompt correto
- [ ] Zero erros "Input é obrigatório"

**Se TODOS os itens estiverem ✅, a correção está funcionando!**

---

## 🎉 CONFIRMAÇÃO DE SUCESSO

```
╔════════════════════════════════════════╗
║                                        ║
║  ✅ PERSISTÊNCIA FUNCIONANDO 100%!    ║
║                                        ║
║  1. Config salvo no modal ✅          ║
║  2. Estado React atualizado ✅        ║
║  3. Backend persistido ✅             ║
║  4. Reload preserva dados ✅          ║
║  5. Execução usa config ✅            ║
║                                        ║
║  🚀 PRONTO PARA PRODUÇÃO!             ║
║                                        ║
╚════════════════════════════════════════╝
```
