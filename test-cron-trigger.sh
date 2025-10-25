#!/bin/bash

# Test script para validar Cron Trigger

echo "🧪 =========================================="
echo "🧪 TESTE: Cron Trigger"
echo "🧪 =========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 1: Criar Automação de Teste"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AUTOMATION=$(curl -s -X POST "${API_URL}/api/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cron Automation",
    "description": "Automação de teste para cron",
    "nodes": [
      {
        "id": "node-1",
        "type": "manual-trigger",
        "name": "Start",
        "toolId": "manual-trigger",
        "position": {"x": 0, "y": 0},
        "config": {}
      }
    ],
    "edges": []
  }')

AUTOMATION_ID=$(echo $AUTOMATION | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

if [ -z "$AUTOMATION_ID" ]; then
  echo -e "${RED}❌ Falha ao criar automação${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Automação criada: ${AUTOMATION_ID}${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 2: Criar Cron (executa a cada minuto)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRON=$(curl -s -X POST "${API_URL}/api/crons" \
  -H "Content-Type: application/json" \
  -d "{
    \"automationId\": \"${AUTOMATION_ID}\",
    \"cronExpression\": \"* * * * *\",
    \"timezone\": \"America/Sao_Paulo\",
    \"enabled\": true,
    \"maxExecutions\": 3,
    \"triggerData\": {
      \"source\": \"cron-test\",
      \"message\": \"Scheduled execution\"
    }
  }")

echo "$CRON" | jq '.'

CRON_ID=$(echo $CRON | jq -r '.cron.id')

if [ -z "$CRON_ID" ] || [ "$CRON_ID" == "null" ]; then
  echo -e "${RED}❌ Falha ao criar cron${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Cron criado!${NC}"
echo "   ID: ${CRON_ID}"
echo "   Expression: * * * * * (a cada minuto)"
echo "   Max Executions: 3"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 3: Listar Crons"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRONS=$(curl -s -X GET "${API_URL}/api/crons")
echo "$CRONS" | jq '.'

COUNT=$(echo $CRONS | jq '.crons | length')
echo -e "${GREEN}Total de crons: ${COUNT}${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 4: Buscar Cron por ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRON_DETAIL=$(curl -s -X GET "${API_URL}/api/crons/${CRON_ID}")
echo "$CRON_DETAIL" | jq '.'

IS_ACTIVE=$(echo $CRON_DETAIL | jq -r '.cron.isActive')
if [ "$IS_ACTIVE" == "true" ]; then
  echo -e "${GREEN}✅ Cron está ATIVO${NC}"
else
  echo -e "${RED}❌ Cron está INATIVO${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 5: Aguardar Execução (65 segundos)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "⏳ Aguardando cron executar..."
echo "   Deve executar após ~60 segundos (próximo minuto)"
echo ""

for i in {1..65}; do
  echo -ne "   ${i}/65 segundos\r"
  sleep 1
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 6: Verificar Execução"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRON_DETAIL=$(curl -s -X GET "${API_URL}/api/crons/${CRON_ID}")
echo "$CRON_DETAIL" | jq '.'

EXECUTION_COUNT=$(echo $CRON_DETAIL | jq -r '.cron.executionCount')
LAST_EXECUTED=$(echo $CRON_DETAIL | jq -r '.cron.lastExecutedAt')

echo ""
echo "Execution Count: ${EXECUTION_COUNT}"
echo "Last Executed: ${LAST_EXECUTED}"

if [ "$EXECUTION_COUNT" -gt "0" ]; then
  echo -e "${GREEN}✅ Cron executou ${EXECUTION_COUNT} vez(es)!${NC}"
else
  echo -e "${YELLOW}⚠️  Cron ainda não executou (pode demorar até 1 minuto)${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 7: Testar Start/Stop Manual"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "7.1 - Parar cron"
STOP_RESPONSE=$(curl -s -X POST "${API_URL}/api/crons/${CRON_ID}/stop")
echo "$STOP_RESPONSE" | jq '.'

SUCCESS=$(echo $STOP_RESPONSE | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Cron parado com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao parar cron${NC}"
fi
echo ""

echo "7.2 - Verificar que está parado"
CRON_DETAIL=$(curl -s -X GET "${API_URL}/api/crons/${CRON_ID}")
IS_ACTIVE=$(echo $CRON_DETAIL | jq -r '.cron.isActive')

if [ "$IS_ACTIVE" == "false" ]; then
  echo -e "${GREEN}✅ Cron confirmado como INATIVO${NC}"
else
  echo -e "${RED}❌ Cron ainda está ATIVO${NC}"
fi
echo ""

echo "7.3 - Iniciar cron novamente"
START_RESPONSE=$(curl -s -X POST "${API_URL}/api/crons/${CRON_ID}/start")
echo "$START_RESPONSE" | jq '.'

SUCCESS=$(echo $START_RESPONSE | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Cron iniciado com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao iniciar cron${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 8: Testar Atualização"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "8.1 - Atualizar expressão cron"
UPDATE_RESPONSE=$(curl -s -X PUT "${API_URL}/api/crons/${CRON_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "cronExpression": "*/5 * * * *",
    "maxExecutions": 10
  }')

echo "$UPDATE_RESPONSE" | jq '.'

SUCCESS=$(echo $UPDATE_RESPONSE | jq -r '.success')
NEW_EXPRESSION=$(echo $UPDATE_RESPONSE | jq -r '.cron.cronExpression')

if [ "$SUCCESS" == "true" ] && [ "$NEW_EXPRESSION" == "*/5 * * * *" ]; then
  echo -e "${GREEN}✅ Cron atualizado com sucesso!${NC}"
  echo "   Nova expressão: ${NEW_EXPRESSION} (a cada 5 minutos)"
else
  echo -e "${RED}❌ Falha ao atualizar cron${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 9: Testar Desabilitar/Habilitar"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "9.1 - Desabilitar cron"
DISABLE_RESPONSE=$(curl -s -X PUT "${API_URL}/api/crons/${CRON_ID}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}')

ENABLED=$(echo $DISABLE_RESPONSE | jq -r '.cron.enabled')
IS_ACTIVE=$(echo $DISABLE_RESPONSE | jq -r '.cron.isActive')

if [ "$ENABLED" == "false" ] && [ "$IS_ACTIVE" == "false" ]; then
  echo -e "${GREEN}✅ Cron desabilitado com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao desabilitar cron${NC}"
fi
echo ""

echo "9.2 - Habilitar cron novamente"
ENABLE_RESPONSE=$(curl -s -X PUT "${API_URL}/api/crons/${CRON_ID}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}')

ENABLED=$(echo $ENABLE_RESPONSE | jq -r '.cron.enabled')
IS_ACTIVE=$(echo $ENABLE_RESPONSE | jq -r '.cron.isActive')

if [ "$ENABLED" == "true" ] && [ "$IS_ACTIVE" == "true" ]; then
  echo -e "${GREEN}✅ Cron habilitado com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao habilitar cron${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 10: Buscar Crons por Automação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRONS_BY_AUTO=$(curl -s -X GET "${API_URL}/api/crons/automation/${AUTOMATION_ID}")
echo "$CRONS_BY_AUTO" | jq '.'

COUNT=$(echo $CRONS_BY_AUTO | jq '.crons | length')
if [ "$COUNT" -gt "0" ]; then
  echo -e "${GREEN}✅ ${COUNT} cron(s) encontrado(s) para automação!${NC}"
else
  echo -e "${YELLOW}⚠️  Nenhum cron encontrado${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 11: Deletar Cron"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DELETE_RESPONSE=$(curl -s -X DELETE "${API_URL}/api/crons/${CRON_ID}")
SUCCESS=$(echo $DELETE_RESPONSE | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Cron deletado com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao deletar cron${NC}"
fi
echo ""

echo "11.1 - Verificar que foi deletado"
CRON_DETAIL=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${API_URL}/api/crons/${CRON_ID}")

HTTP_CODE=$(echo "$CRON_DETAIL" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "404" ]; then
  echo -e "${GREEN}✅ 404 correto (cron deletado)${NC}"
else
  echo -e "${RED}❌ Esperado 404, recebido ${HTTP_CODE}${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TESTE COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
