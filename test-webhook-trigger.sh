#!/bin/bash

# Test script para validar Webhook Trigger

echo "🧪 =========================================="
echo "🧪 TESTE: Webhook Trigger"
echo "🧪 =========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

# Função para aguardar servidor
wait_for_server() {
  echo "⏳ Aguardando servidor iniciar..."
  for i in {1..30}; do
    if curl -s "${API_URL}/health" > /dev/null 2>&1; then
      echo "✅ Servidor está pronto!"
      return 0
    fi
    sleep 1
  done
  echo "❌ Timeout aguardando servidor"
  exit 1
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 1: Criar Automação de Teste"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Criar automação simples para testar
AUTOMATION=$(curl -s -X POST "${API_URL}/api/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook Automation",
    "description": "Automação de teste para webhook",
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
  echo "Response: $AUTOMATION"
  exit 1
fi

echo -e "${GREEN}✅ Automação criada: ${AUTOMATION_ID}${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 2: Criar Webhook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WEBHOOK=$(curl -s -X POST "${API_URL}/api/webhooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"automationId\": \"${AUTOMATION_ID}\",
    \"method\": \"POST\",
    \"requireAuth\": true,
    \"jsonSchema\": {
      \"fields\": [
        {
          \"key\": \"name\",
          \"type\": \"string\",
          \"required\": true,
          \"description\": \"Nome do usuário\"
        },
        {
          \"key\": \"age\",
          \"type\": \"number\",
          \"required\": false,
          \"description\": \"Idade\"
        }
      ]
    }
  }")

echo "$WEBHOOK" | jq '.'

WEBHOOK_ID=$(echo $WEBHOOK | jq -r '.webhook.id')
WEBHOOK_URL=$(echo $WEBHOOK | jq -r '.webhook.url')
WEBHOOK_TOKEN=$(echo $WEBHOOK | jq -r '.webhook.secretToken')

if [ -z "$WEBHOOK_ID" ] || [ "$WEBHOOK_ID" == "null" ]; then
  echo -e "${RED}❌ Falha ao criar webhook${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Webhook criado!${NC}"
echo "   ID: ${WEBHOOK_ID}"
echo "   URL: ${WEBHOOK_URL}"
echo "   Token: ${WEBHOOK_TOKEN:0:20}..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 3: Testar Webhook - Payload Válido"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WEBHOOK_PATH=$(echo $WEBHOOK_URL | sed "s|${API_URL}||")

echo "Disparando webhook: POST ${WEBHOOK_PATH}"
RESPONSE=$(curl -s -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "X-Webhook-Secret: ${WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "age": 30}')

echo "$RESPONSE" | jq '.'

SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Webhook executado com sucesso!${NC}"
else
  echo -e "${RED}❌ Webhook falhou${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 4: Testar Validações"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "4.1 - Testar sem token (deve falhar 401)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ 401 correto (sem token)${NC}"
else
  echo -e "${RED}❌ Esperado 401, recebido ${HTTP_CODE}${NC}"
fi
echo ""

echo "4.2 - Testar com token inválido (deve falhar 401)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "X-Webhook-Secret: invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ 401 correto (token inválido)${NC}"
else
  echo -e "${RED}❌ Esperado 401, recebido ${HTTP_CODE}${NC}"
fi
echo ""

echo "4.3 - Testar com campo obrigatório faltando (deve falhar 400)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "X-Webhook-Secret: ${WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"age": 30}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
  echo -e "${GREEN}✅ 400 correto (campo obrigatório faltando)${NC}"
else
  echo -e "${RED}❌ Esperado 400, recebido ${HTTP_CODE}${NC}"
fi
echo ""

echo "4.4 - Testar com tipo errado (deve falhar 400)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "X-Webhook-Secret: ${WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "age": "not-a-number"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "400" ]; then
  echo -e "${GREEN}✅ 400 correto (tipo errado)${NC}"
else
  echo -e "${RED}❌ Esperado 400, recebido ${HTTP_CODE}${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 5: Regenerar Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEW_TOKEN_RESPONSE=$(curl -s -X POST "${API_URL}/api/webhooks/${WEBHOOK_ID}/regenerate-token")
NEW_TOKEN=$(echo $NEW_TOKEN_RESPONSE | jq -r '.webhook.secretToken')

echo "Token antigo: ${WEBHOOK_TOKEN:0:20}..."
echo "Token novo:   ${NEW_TOKEN:0:20}..."

if [ "$NEW_TOKEN" != "$WEBHOOK_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Token regenerado com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao regenerar token${NC}"
fi
echo ""

echo "5.1 - Testar com token antigo (deve falhar 401)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "X-Webhook-Secret: ${WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ 401 correto (token antigo)${NC}"
else
  echo -e "${RED}❌ Esperado 401, recebido ${HTTP_CODE}${NC}"
fi
echo ""

echo "5.2 - Testar com token novo (deve funcionar)"
RESPONSE=$(curl -s -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "X-Webhook-Secret: ${NEW_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test with new token"}')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Webhook funciona com token novo!${NC}"
else
  echo -e "${RED}❌ Webhook falhou com token novo${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FASE 6: Listar e Deletar"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "6.1 - Listar webhooks"
WEBHOOKS=$(curl -s -X GET "${API_URL}/api/webhooks")
COUNT=$(echo $WEBHOOKS | jq '.webhooks | length')
echo "Total de webhooks: $COUNT"

if [ "$COUNT" -gt "0" ]; then
  echo -e "${GREEN}✅ Webhooks listados com sucesso!${NC}"
else
  echo -e "${YELLOW}⚠️  Nenhum webhook encontrado${NC}"
fi
echo ""

echo "6.2 - Deletar webhook"
DELETE_RESPONSE=$(curl -s -X DELETE "${API_URL}/api/webhooks/${WEBHOOK_ID}")
SUCCESS=$(echo $DELETE_RESPONSE | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo -e "${GREEN}✅ Webhook deletado com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao deletar webhook${NC}"
fi
echo ""

echo "6.3 - Verificar que foi deletado"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${API_URL}${WEBHOOK_PATH}" \
  -H "X-Webhook-Secret: ${NEW_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" == "404" ]; then
  echo -e "${GREEN}✅ 404 correto (webhook deletado)${NC}"
else
  echo -e "${RED}❌ Esperado 404, recebido ${HTTP_CODE}${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TESTE COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
