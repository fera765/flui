# 🚀 FLUI - Quick Start Guide

## Iniciar o Sistema Completo

### 1. API Server (Backend)
```bash
cd /workspace
npm start
```
Acesse: `http://localhost:3001`

### 2. Frontend (Interface Web)
```bash
cd /workspace/flui-frontend-vite
npm run dev
```
Acesse: `http://localhost:5173`

### 3. CLI (Terminal Interativo)
```bash
cd /workspace
node dist/cli.js
```

---

## 🎯 Criar Sua Primeira Automação

### Exemplo: Atendimento Automático via Webhook

#### Passo 1: Criar Agente (CLI ou Frontend)

**Via CLI:**
```
> / 
> agents
> Novo Agente
Nome: Atendimento Comercial
Prompt: Você é um assistente comercial amigável e prestativo
```

**Via Frontend:**
```
Menu → Agentes → Novo Agente
```

#### Passo 2: Criar Workflow

**Via Frontend:**
```
Menu → Automações → Nova Automação
Nome: "Atendimento WhatsApp"
```

#### Passo 3: Adicionar Nós
```
+ → Webhook Trigger
+ → Condição Universal  
+ → Agente Execute (x3 para cada branch)
+ → Webhook Response (x3)
```

#### Passo 4: Conectar Nós
```
Webhook Trigger
    │
    ├─→ Condição Universal
    │       │
    │       ├─→ Agente Execute (Vendas) → Response
    │       ├─→ Agente Execute (Suporte) → Response  
    │       └─→ Agente Execute (Geral) → Response
```

#### Passo 5: Configurar

**Webhook Trigger:**
```json
{
  "extractField": "message"
}
```

**Condição Universal:**
```json
{
  "comparisonType": "contains",
  "caseSensitive": false,
  "branches": [
    {
      "name": "vendas",
      "condition": "venda",
      "description": "Cliente quer comprar"
    },
    {
      "name": "suporte", 
      "condition": "suporte",
      "description": "Cliente precisa de ajuda"
    },
    {
      "name": "geral",
      "condition": "*",
      "description": "Qualquer outra coisa"
    }
  ]
}
```

**Agente Execute (cada branch):**
- Selecione o agente da lista dropdown
- Prompt será preenchido automaticamente com a mensagem!

**Webhook Response:**
- Response será preenchida automaticamente com a resposta do agente!

#### Passo 6: Salvar e Testar

```
Botão "Salvar" → Automação criada!
Botão "Executar" → Testar fluxo
```

---

## 🧪 Testar o Fluxo

### Via API (Simular Webhook)
```bash
curl -X POST http://localhost:3001/api/automations/{id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "webhookData": {
      "message": "Quero falar com vendas",
      "user": "João"
    }
  }'
```

### Via Frontend
```
1. Abrir automação
2. Clicar em "Executar"
3. Ver logs em tempo real
4. Verificar resultado
```

---

## 📚 Ferramentas Disponíveis

### Integração (3)
- 🌐 **HTTP Request** - Chamar APIs externas
- 📨 **Webhook Trigger** - Receber dados externos
- 📤 **Webhook Response** - Responder webhooks

### Controle de Fluxo (2)
- 🔀 **Condição Universal** - Roteamento inteligente
- ⏱️ **Delay** - Pausas temporizadas

### Agente & AI (1)
- 🤖 **Agent Execute** - Executar agentes LLM

### Dados (3)
- 🔄 **Data Transform** - Transformar com JS
- 🔍 **Data Filter** - Filtrar arrays
- 🔗 **Data Merge** - Combinar dados

### Sistema (8)
- 🖥️ **Shell Executor** - Executar comandos
- 📄 **File Read/Write/Edit** - Manipular arquivos
- 🔎 **File Search** - Buscar arquivos
- 📝 **Text Search** - Buscar em conteúdo
- ℹ️ **System Info** - Info do sistema

### Custom (1)
- 💻 **Custom Code** - JavaScript/Python

**Total: 17 ferramentas prontas para uso!**

---

## 💡 Dicas Pro

### 1. Use Expressões de Template
```
{{ nodes.webhook-1.data }}
{{ nodes.condition-1.branch }}
{{ nodes.agent-1.response }}
```

### 2. Aproveite os Exemplos
Cada ferramenta tem exemplos clicáveis. Clique para preencher automaticamente!

### 3. Use Wildcards em Condições
```json
{
  "branches": [
    {"name": "sim", "condition": "sim"},
    {"name": "nao", "condition": "não"},
    {"name": "qualquer_outro", "condition": "*"}
  ]
}
```

### 4. Teste Incrementalmente
Adicione e teste um nó por vez. Use o botão "Executar" frequentemente.

### 5. Use o CLI para Comandos Rápidos
```bash
# Abrir CLI
node dist/cli.js

# Usar comandos
/ → lista comandos
@ → menciona agentes
```

---

## 🐛 Troubleshooting

### "Nenhum agente disponível"
→ Crie um agente primeiro em Menu → Agentes

### "Tool não encontrada"
→ Reinicie o servidor API: `npm start`

### "Erro de validação"
→ Verifique se todos os campos obrigatórios (*) estão preenchidos

### Conexão não funciona
→ Verifique se os tipos são compatíveis (string→string, object→object)

---

## 📞 Suporte

### Documentação
- `FINAL_REPORT.md` - Relatório completo
- `IMPROVEMENTS_SUMMARY.md` - Melhorias detalhadas
- `README.md` - Documentação geral

### Testes
```bash
npm test                    # Todos os testes
npm test workflow          # Teste de workflow
npm test tools             # Teste de tools
```

---

## 🎊 Enjoy FLUI!

**Sistema pronto para criar automações poderosas de forma simples!**

Qualquer dúvida, consulte `FINAL_REPORT.md` para documentação completa.

🚀 **Happy Automating!**
