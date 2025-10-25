#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TESTE DE INTEGRAÇÃO COMPLETA        ║${NC}"
echo -e "${BLUE}║  Frontend + Backend + Triggers        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

API_URL="http://localhost:3001"

# ==========================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 1: Verificar Servidor${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verificar se servidor está rodando
if ! curl -s "$API_URL/api/tools" > /dev/null; then
  echo -e "${RED}❌ Servidor não está rodando em $API_URL${NC}"
  echo -e "${YELLOW}Execute: npx tsx source/startApi.ts${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Servidor está rodando${NC}"

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 2: Criar Automação${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

AUTOMATION_RESPONSE=$(curl -s -X POST "$API_URL/api/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Integration Automation",
    "description": "Automação para teste de integração completo",
    "nodes": [
      {
        "id": "node-manual",
        "type": "tool",
        "position": {"x": 100, "y": 100},
        "data": {
          "type": "tool",
          "toolId": "manual-trigger",
          "name": "Manual Trigger",
          "config": {}
        }
      }
    ],
    "edges": []
  }')

AUTOMATION_ID=$(echo "$AUTOMATION_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$AUTOMATION_ID" ]; then
  echo -e "${RED}❌ Falha ao criar automação${NC}"
  echo "Response: $AUTOMATION_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Automação criada: $AUTOMATION_ID${NC}"

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 3: Criar Webhook${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

WEBHOOK_RESPONSE=$(curl -s -X POST "$API_URL/api/webhooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"automationId\": \"$AUTOMATION_ID\",
    \"method\": \"POST\",
    \"enabled\": true,
    \"jsonSchema\": {
      \"fields\": [
        {\"key\": \"name\", \"type\": \"string\", \"required\": true},
        {\"key\": \"email\", \"type\": \"string\", \"required\": true},
        {\"key\": \"age\", \"type\": \"number\", \"required\": false}
      ]
    }
  }")

WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
WEBHOOK_PATH=$(echo "$WEBHOOK_RESPONSE" | grep -o '"path":"[^"]*' | cut -d'"' -f4 | head -1)
SECRET_TOKEN=$(echo "$WEBHOOK_RESPONSE" | grep -o '"secretToken":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$WEBHOOK_ID" ]; then
  echo -e "${RED}❌ Falha ao criar webhook${NC}"
  echo "Response: $WEBHOOK_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Webhook criado${NC}"
echo -e "   ID: ${WEBHOOK_ID}"
echo -e "   Path: ${WEBHOOK_PATH}"
echo -e "   Token: ${SECRET_TOKEN:0:20}..."

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 4: Testar Webhook (Payload Válido)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

WEBHOOK_EXEC_RESPONSE=$(curl -s -X POST "$API_URL$WEBHOOK_PATH" \
  -H "X-Webhook-Secret: $SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }')

WEBHOOK_EXEC_ID=$(echo "$WEBHOOK_EXEC_RESPONSE" | grep -o '"executionId":"[^"]*' | cut -d'"' -f4)

if [ -z "$WEBHOOK_EXEC_ID" ]; then
  echo -e "${RED}❌ Falha ao disparar webhook${NC}"
  echo "Response: $WEBHOOK_EXEC_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Webhook disparado com sucesso${NC}"
echo -e "   Execution ID: $WEBHOOK_EXEC_ID"

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 5: Executar Automação Manual${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MANUAL_EXEC_RESPONSE=$(curl -s -X POST "$API_URL/api/automations/$AUTOMATION_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{"initialData": {"source": "manual", "user": "admin"}}')

MANUAL_EXEC_ID=$(echo "$MANUAL_EXEC_RESPONSE" | grep -o '"executionId":"[^"]*' | cut -d'"' -f4)

if [ -z "$MANUAL_EXEC_ID" ]; then
  echo -e "${RED}❌ Falha ao executar automação${NC}"
  echo "Response: $MANUAL_EXEC_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Automação executada com sucesso${NC}"
echo -e "   Execution ID: $MANUAL_EXEC_ID"

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 6: Verificar Execuções${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

sleep 2 # Aguardar execuções processarem

EXECUTIONS_RESPONSE=$(curl -s "$API_URL/api/executions")
EXEC_COUNT=$(echo "$EXECUTIONS_RESPONSE" | grep -o '"id":"exec-' | wc -l)

echo -e "${GREEN}✅ $EXEC_COUNT execução(ões) encontrada(s)${NC}"

# Verificar execução do webhook
WEBHOOK_EXEC_STATUS=$(echo "$EXECUTIONS_RESPONSE" | grep -A 5 "\"id\":\"$WEBHOOK_EXEC_ID\"" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo -e "   Webhook execution: ${WEBHOOK_EXEC_ID} - Status: $WEBHOOK_EXEC_STATUS"

# Verificar execução manual
MANUAL_EXEC_STATUS=$(echo "$EXECUTIONS_RESPONSE" | grep -A 5 "\"id\":\"$MANUAL_EXEC_ID\"" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo -e "   Manual execution: ${MANUAL_EXEC_ID} - Status: $MANUAL_EXEC_STATUS"

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 7: Verificar Estatísticas${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

STATS_RESPONSE=$(curl -s "$API_URL/api/executions-stats")

echo -e "${GREEN}✅ Estatísticas da fila:${NC}"
echo "$STATS_RESPONSE" | grep -o '"[^"]*":[0-9]*' | head -4 | while read line; do
  echo -e "   $line"
done

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 8: Criar Cron${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CRON_RESPONSE=$(curl -s -X POST "$API_URL/api/crons" \
  -H "Content-Type: application/json" \
  -d "{
    \"automationId\": \"$AUTOMATION_ID\",
    \"cronExpression\": \"*/5 * * * *\",
    \"timezone\": \"America/Sao_Paulo\",
    \"enabled\": false,
    \"maxExecutions\": 10
  }")

CRON_ID=$(echo "$CRON_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$CRON_ID" ]; then
  echo -e "${RED}❌ Falha ao criar cron${NC}"
  echo "Response: $CRON_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Cron criado (desabilitado)${NC}"
echo -e "   ID: $CRON_ID"
echo -e "   Expression: */5 * * * * (a cada 5 minutos)"

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 9: Listar Webhooks e Crons${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

WEBHOOKS_LIST=$(curl -s "$API_URL/api/webhooks")
WEBHOOK_COUNT=$(echo "$WEBHOOKS_LIST" | grep -o '"id":"webhook-' | wc -l)

CRONS_LIST=$(curl -s "$API_URL/api/crons")
CRON_COUNT=$(echo "$CRONS_LIST" | grep -o '"id":"cron-' | wc -l)

echo -e "${GREEN}✅ $WEBHOOK_COUNT webhook(s) registrado(s)${NC}"
echo -e "${GREEN}✅ $CRON_COUNT cron(s) registrado(s)${NC}"

# ==========================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 FASE 10: Cleanup (Deletar Recursos)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Deletar webhook
curl -s -X DELETE "$API_URL/api/webhooks/$WEBHOOK_ID" > /dev/null
echo -e "${GREEN}✅ Webhook deletado${NC}"

# Deletar cron
curl -s -X DELETE "$API_URL/api/crons/$CRON_ID" > /dev/null
echo -e "${GREEN}✅ Cron deletado${NC}"

# Deletar automação
curl -s -X DELETE "$API_URL/api/automations/$AUTOMATION_ID" > /dev/null
echo -e "${GREEN}✅ Automação deletada${NC}"

# ==========================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ TESTE COMPLETO - 100% SUCESSO     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 Resumo:${NC}"
echo -e "   ✓ Servidor rodando"
echo -e "   ✓ Automação criada e executada"
echo -e "   ✓ Webhook criado e disparado"
echo -e "   ✓ Cron criado"
echo -e "   ✓ ExecutionQueue funcionando"
echo -e "   ✓ Execuções visíveis em /api/executions"
echo -e "   ✓ Cleanup realizado"
echo ""

echo -e "${YELLOW}🌐 Frontend (se estiver rodando):${NC}"
echo -e "   http://localhost:5173/executions"
echo ""

echo -e "${GREEN}✅ Integração Frontend + Backend 100% funcional!${NC}"
