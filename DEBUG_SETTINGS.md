# 🔍 DEBUG: Settings não salvando todos os campos

## 🎯 Como Testar

### 1. Iniciar Backend em Modo Debug

```bash
cd /workspace
yarn dev
```

### 2. Iniciar Frontend

```bash
cd /workspace/flui-frontend
npm run dev
```

### 3. Abrir Console do Browser

Abrir **DevTools** → **Console** (F12)

### 4. Preencher Formulário

```
Endpoint: https://openrouter.ai/api/v1
API Key: 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
Model: qwen/qwen3-coder:free
Temperature: 0.7
Max Tokens: 4000
```

### 5. Clicar em "Save Configuration"

### 6. Verificar Logs

#### Console do Browser (Frontend):
```
📤 Enviando config: {
  endpoint: "https://openrouter.ai/api/v1",
  apiKey: "sk-or-v1-...",
  model: "qwen/qwen3-coder:free",
  temperature: 0.7,
  maxTokens: 4000
}

✅ Config salva: { success: true, ... }
```

#### Terminal do Backend:
```
📥 [API] Recebendo config: {
  endpoint: "https://openrouter.ai/api/v1",
  apiKey: "sk-or-v1-...",
  model: "qwen/qwen3-coder:free",
  temperature: 0.7,
  maxTokens: 4000
}

💾 [API] Salvando config: {
  endpoint: "https://openrouter.ai/api/v1",
  apiKey: "***",
  model: "qwen/qwen3-coder:free",
  temperature: 0.7,
  maxTokens: 4000
}

✅ Configuração LLM atualizada no storage e store
✅ Cliente LLM reinicializado
```

## 🔍 O Que Verificar

### Se APENAS endpoint aparece nos logs:

**Problema**: Frontend não está enviando todos os campos

**Solução**:
1. Verificar se os campos estão preenchidos
2. Verificar se o `register()` está correto
3. Verificar se há erros de validação

### Se backend recebe mas não salva:

**Problema**: Backend não está persistindo

**Solução**:
1. Verificar se `setConfig()` funciona
2. Verificar permissões do arquivo `workspace/storage/config.json`
3. Verificar logs de erro

## 🧪 Teste Manual Rápido

```bash
# Testar POST direto
curl -X POST http://localhost:3001/api/llm/config \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://openrouter.ai/api/v1",
    "apiKey": "sk-or-v1-test",
    "model": "qwen/qwen3-coder:free",
    "temperature": 0.7,
    "maxTokens": 4000
  }'

# Verificar GET
curl http://localhost:3001/api/llm/config
```

## 📝 Checklist

- [ ] Backend rodando
- [ ] Frontend rodando
- [ ] DevTools aberto
- [ ] Todos os campos preenchidos
- [ ] Logs do frontend aparecem no console
- [ ] Logs do backend aparecem no terminal
- [ ] Todos os campos aparecem nos logs
- [ ] Config salva com sucesso
- [ ] Teste de conexão funciona

## 🎯 Resultado Esperado

**Frontend envia**:
```json
{
  "endpoint": "https://openrouter.ai/api/v1",
  "apiKey": "sk-or-v1-...",
  "model": "qwen/qwen3-coder:free",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

**Backend salva**:
```json
{
  "llm": {
    "endpoint": "https://openrouter.ai/api/v1",
    "apiKey": "sk-or-v1-...",
    "model": "qwen/qwen3-coder:free",
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

**GET retorna**:
```json
{
  "llm": {
    "endpoint": "https://openrouter.ai/api/v1",
    "apiKey": "***",
    "model": "qwen/qwen3-coder:free",
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

---

**Me envie os logs que aparecem no console e no terminal!** 🔍
