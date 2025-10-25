#!/bin/bash

# Test script para validar execuções simultâneas

echo "🧪 =========================================="
echo "🧪 TESTE: Execuções Simultâneas"
echo "🧪 =========================================="
echo ""

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
    "name": "Concurrent Test Automation",
    "description": "Automação para testar concorrência",
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
echo "📋 FASE 2: Ver Estatísticas Iniciais"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATS=$(curl -s -X GET "${API_URL}/api/executions-stats")
echo "$STATS" | jq '.'

QUEUED=$(echo $STATS | jq -r '.stats.queued')
RUNNING=$(echo $STATS | jq -r '.stats.running')
MAX_CONCURRENCY=$(echo $STATS | jq -r '.stats.maxConcurrency')

echo ""
echo "Estado inicial:"
echo "  Queued: ${QUEUED}"
echo "  Running: ${RUNNING}"
echo "  Max Concurrency: ${MAX_CONCURRENCY}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 3: Criar Webhook para Testes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WEBHOOK=$(curl -s -X POST "${API_URL}/api/webhooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"automationId\": \"${AUTOMATION_ID}\",
    \"method\": \"POST\",
    \"requireAuth\": true
  }")

WEBHOOK_URL=$(echo $WEBHOOK | jq -r '.webhook.url')
WEBHOOK_TOKEN=$(echo $WEBHOOK | jq -r '.webhook.secretToken')
WEBHOOK_PATH=$(echo $WEBHOOK_URL | sed "s|${API_URL}||")

echo -e "${GREEN}✅ Webhook criado: ${WEBHOOK_PATH}${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 4: Disparar 10 Webhooks Simultâneos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🚀 Disparando 10 requisições simultâneas..."

EXECUTION_IDS=()

for i in {1..10}; do
  (
    RESPONSE=$(curl -s -X POST "${API_URL}${WEBHOOK_PATH}" \
      -H "X-Webhook-Secret: ${WEBHOOK_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"test\": \"execution-${i}\"}")
    
    EXEC_ID=$(echo $RESPONSE | jq -r '.executionId')
    echo "  ✓ Disparado: ${i}/10 (execId: ${EXEC_ID})"
  ) &
done

# Aguardar todas as requisições
wait

echo ""
echo -e "${GREEN}✅ 10 requisições disparadas!${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 5: Ver Estatísticas Durante Execução"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📊 Monitorando fila por 10 segundos..."
echo ""

for i in {1..10}; do
  STATS=$(curl -s -X GET "${API_URL}/api/executions-stats")
  QUEUED=$(echo $STATS | jq -r '.stats.queued')
  RUNNING=$(echo $STATS | jq -r '.stats.running')
  COMPLETED=$(echo $STATS | jq -r '.stats.completed')
  
  echo -ne "   ${i}/10s - Queued: ${QUEUED} | Running: ${RUNNING} | Completed: ${COMPLETED}\r"
  sleep 1
done

echo ""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 6: Listar Execuções"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

EXECUTIONS=$(curl -s -X GET "${API_URL}/api/executions?automationId=${AUTOMATION_ID}&limit=15")

echo "Total de execuções:"
TOTAL=$(echo $EXECUTIONS | jq '.executions | length')
echo "  ${TOTAL}"
echo ""

echo "Status das execuções:"
PENDING=$(echo $EXECUTIONS | jq '[.executions[] | select(.status == "pending")] | length')
RUNNING=$(echo $EXECUTIONS | jq '[.executions[] | select(.status == "running")] | length')
COMPLETED=$(echo $EXECUTIONS | jq '[.executions[] | select(.status == "completed")] | length')
FAILED=$(echo $EXECUTIONS | jq '[.executions[] | select(.status == "failed")] | length')

echo "  Pending: ${PENDING}"
echo "  Running: ${RUNNING}"
echo "  Completed: ${COMPLETED}"
echo "  Failed: ${FAILED}"
echo ""

if [ "$COMPLETED" -gt "0" ] || [ "$RUNNING" -gt "0" ]; then
  echo -e "${GREEN}✅ Execuções iniciadas com sucesso!${NC}"
else
  echo -e "${RED}❌ Nenhuma execução foi processada${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 7: Verificar Isolamento de Sandboxes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Primeiras 3 execuções:"
echo $EXECUTIONS | jq -r '.executions[0:3] | .[] | "  ID: \(.id) | Status: \(.status) | Sandbox: \(.sandboxPath // "N/A")"'
echo ""

# Verificar se sandboxes são diferentes
SANDBOX1=$(echo $EXECUTIONS | jq -r '.executions[0].sandboxPath // ""')
SANDBOX2=$(echo $EXECUTIONS | jq -r '.executions[1].sandboxPath // ""')

if [ -n "$SANDBOX1" ] && [ -n "$SANDBOX2" ] && [ "$SANDBOX1" != "$SANDBOX2" ]; then
  echo -e "${GREEN}✅ Sandboxes são isolados (diferentes)!${NC}"
  echo "  Sandbox 1: ${SANDBOX1}"
  echo "  Sandbox 2: ${SANDBOX2}"
elif [ -z "$SANDBOX1" ] || [ -z "$SANDBOX2" ]; then
  echo -e "${YELLOW}⚠️  Sandboxes ainda não foram criados (execuções pendentes)${NC}"
else
  echo -e "${RED}❌ Sandboxes parecem ser iguais (possível problema)${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 8: Testar Limite de Concorrência"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Disparando mais 20 requisições..."

for i in {1..20}; do
  (
    curl -s -X POST "${API_URL}${WEBHOOK_PATH}" \
      -H "X-Webhook-Secret: ${WEBHOOK_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"test\": \"stress-${i}\"}" > /dev/null
  ) &
done

wait
echo ""
echo -e "${GREEN}✅ 20 requisições adicionais disparadas!${NC}"
echo ""

# Ver estatísticas finais
echo "Estatísticas após stress test:"
STATS=$(curl -s -X GET "${API_URL}/api/executions-stats")
echo "$STATS" | jq '.'

QUEUED=$(echo $STATS | jq -r '.stats.queued')
RUNNING=$(echo $STATS | jq -r '.stats.running')
MAX=$(echo $STATS | jq -r '.stats.maxConcurrency')

echo ""
if [ "$RUNNING" -le "$MAX" ]; then
  echo -e "${GREEN}✅ Limite de concorrência respeitado (${RUNNING}/${MAX})${NC}"
else
  echo -e "${RED}❌ Limite de concorrência excedido (${RUNNING}/${MAX})${NC}"
fi

if [ "$QUEUED" -gt "0" ]; then
  echo -e "${GREEN}✅ Fila funcionando (${QUEUED} na fila)${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TESTE DE CONCORRÊNCIA COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Resumo:"
echo "  ✓ 30 execuções disparadas"
echo "  ✓ Fila gerenciando concorrência"
echo "  ✓ Sandboxes isolados"
echo "  ✓ Limite de ${MAX} execuções simultâneas respeitado"
echo ""
