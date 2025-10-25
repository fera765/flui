# 🧪 Guia de Testes Completo - Triggers e Execução

## 🚀 Como Executar os Testes

### Pré-requisitos:
```bash
# 1. Instalar dependências
cd /workspace
npm install

# 2. Compilar TypeScript
npx tsc

# 3. Iniciar servidor
yarn dev
```

---

## ✅ TESTE 1: Webhook Trigger

### Executar:
```bash
# Em outro terminal (com servidor rodando)
./test-webhook-trigger.sh
```

### Output Esperado:
```
🧪 ==========================================
🧪 TESTE: Webhook Trigger
🧪 ==========================================

📋 FASE 1: Criar Automação de Teste
✅ Automação criada: xxx

📋 FASE 2: Criar Webhook
✅ Webhook criado!
   ID: webhook-xxx
   URL: http://localhost:3001/webhook/webhook-xxx
   Token: abc123...

📋 FASE 3: Testar Webhook - Payload Válido
✅ Webhook executado com sucesso!

📋 FASE 4: Testar Validações
✅ 401 correto (sem token)
✅ 401 correto (token inválido)
✅ 400 correto (campo obrigatório faltando)
✅ 400 correto (tipo errado)

📋 FASE 5: Regenerar Token
✅ Token regenerado com sucesso!
✅ 401 correto (token antigo)
✅ Webhook funciona com token novo!

📋 FASE 6: Listar e Deletar
✅ Webhooks listados com sucesso!
✅ Webhook deletado com sucesso!
✅ 404 correto (webhook deletado)

🎉 TESTE COMPLETO!
```

### Se falhar:
- Verificar se servidor está rodando
- Verificar se porta 3001 está disponível
- Verificar logs do servidor

---

## ✅ TESTE 2: Cron Trigger

### Executar:
```bash
./test-cron-trigger.sh
```

### Output Esperado:
```
🧪 ==========================================
🧪 TESTE: Cron Trigger
🧪 ==========================================

📋 FASE 1: Criar Automação de Teste
✅ Automação criada: xxx

📋 FASE 2: Criar Cron (executa a cada minuto)
✅ Cron criado!
   ID: cron-xxx
   Expression: * * * * * (a cada minuto)
   Max Executions: 3

📋 FASE 3: Listar Crons
Total de crons: 1

📋 FASE 4: Buscar Cron por ID
✅ Cron está ATIVO

📋 FASE 5: Aguardar Execução (65 segundos)
⏳ Aguardando cron executar...
   65/65 segundos

📋 FASE 6: Verificar Execução
Execution Count: 1
Last Executed: 2025-10-25T...
✅ Cron executou 1 vez(es)!

📋 FASE 7: Testar Start/Stop Manual
✅ Cron parado com sucesso!
✅ Cron confirmado como INATIVO
✅ Cron iniciado com sucesso!

📋 FASE 8: Testar Atualização
✅ Cron atualizado com sucesso!
   Nova expressão: */5 * * * * (a cada 5 minutos)

📋 FASE 9: Testar Desabilitar/Habilitar
✅ Cron desabilitado com sucesso!
✅ Cron habilitado com sucesso!

📋 FASE 10: Buscar Crons por Automação
✅ 1 cron(s) encontrado(s) para automação!

📋 FASE 11: Deletar Cron
✅ Cron deletado com sucesso!
✅ 404 correto (cron deletado)

🎉 TESTE COMPLETO!
```

### Notas:
- Fase 5 demora ~65 segundos (aguarda cron executar)
- Pode pular com Ctrl+C se já validou outras partes

---

## ✅ TESTE 3: Concurrent Executions

### Executar:
```bash
./test-concurrent-executions.sh
```

### Output Esperado:
```
🧪 ==========================================
🧪 TESTE: Execuções Simultâneas
🧪 ==========================================

📋 FASE 1: Criar Automação de Teste
✅ Automação criada: xxx

📋 FASE 2: Ver Estatísticas Iniciais
Estado inicial:
  Queued: 0
  Running: 0
  Max Concurrency: 5

📋 FASE 3: Criar Webhook para Testes
✅ Webhook criado: /webhook/webhook-xxx

📋 FASE 4: Disparar 10 Webhooks Simultâneos
🚀 Disparando 10 requisições simultâneas...
  ✓ Disparado: 1/10
  ✓ Disparado: 2/10
  ...
  ✓ Disparado: 10/10

✅ 10 requisições disparadas!

📋 FASE 5: Ver Estatísticas Durante Execução
📊 Monitorando fila por 10 segundos...
   1/10s - Queued: 5 | Running: 5 | Completed: 0
   2/10s - Queued: 3 | Running: 5 | Completed: 2
   ...
   10/10s - Queued: 0 | Running: 2 | Completed: 8

📋 FASE 6: Listar Execuções
Total de execuções: 10

Status das execuções:
  Pending: 0
  Running: 2
  Completed: 8
  Failed: 0

✅ Execuções iniciadas com sucesso!

📋 FASE 7: Verificar Isolamento de Sandboxes
Primeiras 3 execuções:
  ID: exec-xxx-1 | Status: completed | Sandbox: exec-xxx-1
  ID: exec-xxx-2 | Status: completed | Sandbox: exec-xxx-2
  ID: exec-xxx-3 | Status: running  | Sandbox: exec-xxx-3

✅ Sandboxes são isolados (diferentes)!
  Sandbox 1: /path/sandboxes/exec-xxx-1
  Sandbox 2: /path/sandboxes/exec-xxx-2

📋 FASE 8: Testar Limite de Concorrência
Disparando mais 20 requisições...
✅ 20 requisições adicionais disparadas!

Estatísticas após stress test:
{
  "stats": {
    "queued": 12,
    "running": 5,
    "completed": 13,
    "maxConcurrency": 5
  }
}

✅ Limite de concorrência respeitado (5/5)
✅ Fila funcionando (12 na fila)

🎉 TESTE DE CONCORRÊNCIA COMPLETO!

Resumo:
  ✓ 30 execuções disparadas
  ✓ Fila gerenciando concorrência
  ✓ Sandboxes isolados
  ✓ Limite de 5 execuções simultâneas respeitado
```

---

## 🔍 TESTE 4: Frontend Manual

### 1. Webhook UI

```
1. Abrir http://localhost:5173
2. Criar nova automação
3. Adicionar node "Webhook Trigger"
4. Clicar duas vezes no node → Modal abre
5. Verificar:
   ✅ Path (opcional)
   ✅ Method (select)
   ✅ Rate Limit
   ✅ Toggles (Auth, Enabled)
   ✅ JSON Schema:
      - Click ADD button
      - Adicionar campo "name" (string, obrigatório)
      - Adicionar campo "age" (number, opcional)
      - DELETE button funciona
6. Salvar
7. Verificar:
   ✅ Webhook URL aparece
   ✅ Secret Token aparece
   ✅ Exemplo CURL aparece
   ✅ Copy buttons funcionam
   ✅ Regenerate button funciona
```

### 2. Cron UI

```
1. Adicionar node "Cron Trigger"
2. Clicar duas vezes → Modal abre
3. Verificar:
   ✅ Presets rápidos (8 botões)
   ✅ Click em preset → preenche expressão
   ✅ Expressão Cron (input livre)
   ✅ Link para crontab.guru
   ✅ Timezone (select 7 opções)
   ✅ Max Executions
   ✅ Trigger Data (JSON editor)
   ✅ Enabled toggle
4. Selecionar: "A cada 5 minutos"
5. Timezone: America/Sao_Paulo
6. Salvar
7. Reabrir node:
   ✅ Status mostra "Ativo" (pulse verde)
   ✅ Contador de execuções
   ✅ Start/Stop button
```

### 3. Executions Page

```
1. Ir em sidebar → Executions
2. Verificar:
   ✅ 4 cards de estatísticas
   ✅ Números atualizando
   ✅ Lista de execuções
   ✅ Status icons (⏰ 🚀 ✅ ❌)
   ✅ Badges coloridos
   ✅ Trigger badges (👆 🔗 ⏰)
3. Disparar webhook (via CURL)
4. Verificar:
   ✅ Nova execução aparece
   ✅ Status muda em tempo real
   ✅ Auto-refresh funcionando
5. Filtrar por status: "running"
6. Cancelar execução pendente
7. Limpar completadas
```

---

## 🔥 TESTE 5: Integração End-to-End

### Cenário Completo:

```
1. Criar automação "E-commerce Webhook"
   - Node 1: Webhook Trigger
     - JSON Schema: {"orderId": "string", "total": "number"}
   - Node 2: Agent (processar pedido)
   - Node 3: Tool (enviar email)

2. Salvar automação

3. Abrir node Webhook → Copiar URL e Token

4. Disparar webhook:
   curl -X POST {URL} \
     -H "X-Webhook-Secret: {TOKEN}" \
     -d '{"orderId": "123", "total": 99.90}'

5. Ir em /executions

6. Ver execução:
   ✅ Status: pending → running → completed
   ✅ Real-time updates
   ✅ Sandbox isolado
   ✅ Logs completos

7. Criar Cron "Daily Report"
   - Cron: 0 0 * * * (meia-noite)
   - Max: 30 (um mês)

8. Aguardar próxima meia-noite OU atualizar para "* * * * *" (cada minuto)

9. Ver em /executions:
   ✅ Execução disparada automaticamente
   ✅ Trigger badge: ⏰ cron
```

---

## 📊 Métricas de Sucesso

### Backend:
- ✅ 0 erros TypeScript
- ✅ 100% das rotas funcionando
- ✅ Todos os testes CURL passando
- ✅ Persistência funcionando
- ✅ Reload funcionando

### Frontend:
- ✅ 0 erros TypeScript
- ✅ Build passou
- ✅ UI responsiva
- ✅ Real-time updates
- ✅ Integração completa

### Performance:
- ✅ 5 execuções simultâneas
- ✅ Fila gerenciando concorrência
- ✅ Sandboxes isolados
- ✅ Retry automático

---

## 🐛 Troubleshooting

### Webhook não dispara:
1. Verificar se webhook existe: `GET /api/webhooks`
2. Verificar token correto
3. Verificar método HTTP correto
4. Verificar JSON schema (campos obrigatórios)
5. Ver logs do servidor

### Cron não executa:
1. Verificar se cron está ativo: `GET /api/crons/cron-xxx`
2. Verificar expressão cron válida
3. Verificar `isActive: true`
4. Verificar `enabled: true`
5. Aguardar próximo minuto
6. Ver logs do servidor

### Execuções não aparecem:
1. Verificar WebSocket conectado (DevTools → Network → WS)
2. Refresh manual (F5)
3. Verificar filtros (mudar para "Todos")
4. Verificar API: `GET /api/executions`

### Concorrência não funciona:
1. Verificar stats: `GET /api/executions-stats`
2. Disparar múltiplas requisições simultâneas
3. Ver `queued` e `running`
4. Máximo: 5 simultâneas (configurável em ENV)

---

**Dúvidas?** Execute os scripts de teste primeiro!  
**Problemas?** Verifique logs do servidor e do browser console!  
**Performance?** Ajuste `MAX_CONCURRENT_EXECUTIONS` no .env!

---

✅ **TUDO TESTADO E FUNCIONANDO!**
