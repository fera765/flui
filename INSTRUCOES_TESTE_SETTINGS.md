# 🧪 INSTRUÇÕES: Testar Configurações LLM

## ✅ Sistema Melhorado com Logs Detalhados

Adicionei logs completos para debugar. Siga estes passos:

## 🚀 Passo a Passo

### 1. Iniciar Backend
```bash
cd /workspace
yarn dev
```

**Aguardar**: `✅ API Server rodando em http://localhost:3001`

### 2. Iniciar Frontend (outro terminal)
```bash
cd /workspace/flui-frontend
npm run dev
```

**Aguardar**: `Local: http://localhost:5173/`

### 3. Abrir no Browser
- URL: `http://localhost:5173/settings`
- Abrir **DevTools** (F12) → Aba **Console**

### 4. Verificar o Que Aparece no Console

Deve aparecer automaticamente:
```
✅ Config carregada do backend: { llm: { ... } }
📝 Preenchendo formulário: { endpoint, model, temp, tokens }
✅ Formulário preenchido com sucesso
```

### 5. Preencher os Campos

**IMPORTANTE**: Preencha TODOS os campos:

```
Endpoint: https://openrouter.ai/api/v1
API Key: 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
Model: qwen/qwen3-coder:free
Temperature: 0.7
Max Tokens: 4000
```

**Observar**:
- Ao mudar o **Endpoint**, deve aparecer:
  ```
  🔍 Carregando modelos de: https://openrouter.ai/api/v1
  📥 Resposta: 200 OK
  ✅ X modelos carregados de https://openrouter.ai/api/v1
  ```
- O select de **Model** deve popular com os modelos disponíveis

### 6. Clicar em "Save Configuration"

**Console do Browser** deve mostrar:
```
📤 Enviando config para salvar: {
  endpoint: "https://openrouter.ai/api/v1",
  model: "qwen/qwen3-coder:free",
  temperature: 0.7,
  maxTokens: 4000,
  hasApiKey: true
}

✅ Config salva com sucesso: { success: true, ... }

🔍 Verificando config salva: {
  llm: {
    endpoint: "https://openrouter.ai/api/v1",
    apiKey: "***",
    model: "qwen/qwen3-coder:free",
    temperature: 0.7,
    maxTokens: 4000
  }
}
```

**Terminal do Backend** deve mostrar:
```
📥 [API] Recebendo config: {
  endpoint: 'https://openrouter.ai/api/v1',
  apiKey: 'sk-or-v1-...',
  model: 'qwen/qwen3-coder:free',
  temperature: 0.7,
  maxTokens: 4000
}

💾 [API] Salvando config: {
  endpoint: 'https://openrouter.ai/api/v1',
  apiKey: '***',
  model: 'qwen/qwen3-coder:free',
  temperature: 0.7,
  maxTokens: 4000
}

✅ Configuração LLM atualizada no storage e store
✅ Cliente LLM reinicializado
```

### 7. Clicar em "Test Connection"

**Console do Browser** deve mostrar:
```
🧪 Testando conexão...
✅ Teste bem-sucedido!
```

**Terminal do Backend** deve mostrar:
```
🧪 [API] Testando conexão LLM...
📋 [API] Config atual: {
  endpoint: 'https://openrouter.ai/api/v1',
  model: 'qwen/qwen3-coder:free',
  hasApiKey: true,
  temperature: 0.7,
  maxTokens: 4000
}

🔄 [LLM] Iteração 1/10
📤 [LLM] Enviando request para: https://openrouter.ai/api/v1
📤 [LLM] Model: qwen/qwen3-coder:free, Messages: 2, Tools: 0
📥 [LLM] Resposta recebida: { finishReason: 'stop', ... }
✅ [LLM] Resposta final: "Hello! ..."
```

### 8. Recarregar a Página

Apertar **F5** e verificar se os campos ainda mostram os valores salvos:

```
✅ Config carregada do backend: {
  llm: {
    endpoint: "https://openrouter.ai/api/v1",
    apiKey: "***",
    model: "qwen/qwen3-coder:free",
    temperature: 0.7,
    maxTokens: 4000
  }
}

✅ Formulário preenchido com sucesso
```

## 📊 O Que Verificar

| Etapa | O Que Deve Acontecer | Status |
|-------|----------------------|--------|
| Abrir Settings | Config carregada e formulário preenchido | ? |
| Mudar Endpoint | Modelos carregam automaticamente | ? |
| Preencher campos | Todos os campos editáveis | ? |
| Salvar | Todos os campos salvos | ? |
| Verificar backend | Todos os campos nos logs | ? |
| Recarregar página | Valores salvos aparecem | ? |
| Testar conexão | LLM responde corretamente | ? |

## 🔍 Possíveis Problemas

### Se modelos não carregam:
- Verificar API Key está preenchida
- Verificar endpoint está correto
- Verificar logs no console

### Se salvar não funciona:
- Verificar se todos os campos estão preenchidos
- Verificar logs do backend
- Verificar se há erros de validação

### Se teste falha:
- Verificar se salvou corretamente
- Verificar logs do backend
- Verificar se modelo suporta o endpoint

## 📸 Me Envie

Por favor, me envie:

1. **Screenshot** ou **texto** do Console do Browser após clicar em Save
2. **Texto** dos logs do Terminal do Backend
3. Dizer se o **teste de conexão** funciona ou não

Assim consigo identificar exatamente onde está o problema! 🔍
