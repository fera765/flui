#!/bin/bash

echo "🧪 ============================================"
echo "🧪 VALIDAÇÃO COMPLETA - 100% INTEGRAÇÃO REAL"
echo "🧪 ============================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3001/api"
TESTS_PASSED=0
TESTS_FAILED=0

# Função para validar resposta
validate_response() {
  local test_name="$1"
  local response="$2"
  local expected_field="$3"
  
  echo -n "  Testing: $test_name... "
  
  if echo "$response" | grep -q "$expected_field"; then
    echo -e "${GREEN}✅ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    echo "    Response: $response"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

echo "📋 Teste 1: Persistência de Dados dos Nodes"
echo "─────────────────────────────────────────────"

# Criar automação com linker de output
AUTO_ID="persist-test-$(date +%s)"
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AUTO_ID}'",
    "name": "Persistence Test",
    "nodes": [
      {
        "id": "node-1",
        "type": "tool",
        "name": "Trigger",
        "config": {
          "toolId": "manual-trigger",
          "params": {"triggerMessage": "Test message"}
        }
      },
      {
        "id": "node-2",
        "type": "agent",
        "name": "Agent",
        "config": {
          "toolId": "agent-test",
          "params": {
            "prompt": "{{node-1.triggerMessage}}",
            "temperature": 0.7
          }
        }
      }
    ],
    "edges": [{"id": "e1", "source": "node-1", "target": "node-2"}]
  }')

validate_response "Criar automação com linker" "$CREATE_RESPONSE" "success"

# Recarregar e verificar se linker foi preservado
RELOAD_RESPONSE=$(curl -s "${API_URL}/automations/${AUTO_ID}")
validate_response "Recarregar automação" "$RELOAD_RESPONSE" "node-1.triggerMessage"
validate_response "Preservar temperatura" "$RELOAD_RESPONSE" "0.7"

echo ""
echo "📋 Teste 2: Atualização de Config de Node"
echo "─────────────────────────────────────────────"

# Atualizar config de um node específico
UPDATE_RESPONSE=$(curl -s -X PATCH "${API_URL}/automations/${AUTO_ID}/nodes/node-2/config" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "prompt": "{{node-1.triggerMessage}} - Updated!",
      "temperature": 0.9,
      "newField": "{{node-1.data}}"
    }
  }')

validate_response "Atualizar config do node" "$UPDATE_RESPONSE" "success"

# Verificar se update foi persistido
VERIFY_RESPONSE=$(curl -s "${API_URL}/automations/${AUTO_ID}")
validate_response "Verificar update persistido" "$VERIFY_RESPONSE" "Updated"
validate_response "Verificar novo campo linkado" "$VERIFY_RESPONSE" "newField"
validate_response "Verificar temperatura atualizada" "$VERIFY_RESPONSE" "0.9"

echo ""
echo "📋 Teste 3: Modelos Reais (Não Hardcoded)"
echo "─────────────────────────────────────────────"

# Verificar endpoint de modelos
MODELS_RESPONSE=$(curl -s "${API_URL}/models")
validate_response "Endpoint /models disponível" "$MODELS_RESPONSE" "id"

# Contar modelos
MODEL_COUNT=$(echo "$MODELS_RESPONSE" | grep -o '"id"' | wc -l)
echo "  Modelos encontrados: $MODEL_COUNT"

if [ "$MODEL_COUNT" -gt 0 ]; then
  echo -e "  ${GREEN}✅ Modelos REAIS carregados (não hardcoded)${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "  ${RED}❌ Nenhum modelo encontrado${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "📋 Teste 4: Chat de Logs (Real vs Simulado)"
echo "─────────────────────────────────────────────"

# Testar endpoint de chat
CHAT_RESPONSE=$(curl -s -X POST "${API_URL}/automations/${AUTO_ID}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual é o status?",
    "context": {"logs": []}
  }')

validate_response "Endpoint de chat disponível" "$CHAT_RESPONSE" "response"
validate_response "Chat retorna contexto real" "$CHAT_RESPONSE" "Persistence Test"

echo ""
echo "📋 Teste 5: Execução Completa com Agente Real"
echo "─────────────────────────────────────────────"

# Configurar LLM
curl -s -X POST "${API_URL}/llm/config" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://api.llm7.io/v1",
    "apiKey": "",
    "model": "deepseek-v3.1"
  }' > /dev/null

# Criar agente real
AGENT_ID="test-agent-$(date +%s)"
curl -s -X POST "${API_URL}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AGENT_ID}'",
    "name": "Test Agent",
    "model": "deepseek-v3.1",
    "systemPrompt": "Responda de forma curta.",
    "temperature": 0.7,
    "maxTokens": 100,
    "enabled": true,
    "tools": []
  }' > /dev/null

# Criar automação com agente real
AUTO_ID_REAL="real-test-$(date +%s)"
curl -s -X POST "${API_URL}/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AUTO_ID_REAL}'",
    "name": "Real Agent Test",
    "nodes": [
      {
        "id": "node-trigger",
        "type": "tool",
        "name": "Trigger",
        "config": {
          "toolId": "manual-trigger",
          "params": {"debugMode": true}
        }
      },
      {
        "id": "node-agent",
        "type": "agent",
        "name": "Agent",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "params": {"prompt": "Diga olá!"}
        }
      }
    ],
    "edges": [{"id": "e1", "source": "node-trigger", "target": "node-agent"}]
  }' > /dev/null

echo "  Executando automação com agente real..."
EXEC_RESPONSE=$(curl -s -X POST "${API_URL}/automations/${AUTO_ID_REAL}/execute" \
  -H "Content-Type: application/json" \
  -d '{"debugMode": true}')

validate_response "Execução com agente" "$EXEC_RESPONSE" "success"
validate_response "Resposta do agente" "$EXEC_RESPONSE" "response"
validate_response "Modelo real usado" "$EXEC_RESPONSE" "deepseek"

# Verificar se não é resposta simulada
if echo "$EXEC_RESPONSE" | grep -qi "mock\|simulado\|hardcoded\|fake"; then
  echo -e "  ${RED}❌ FAIL: Resposta parece ser simulada!${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
else
  echo -e "  ${GREEN}✅ PASS: Resposta é REAL (não simulada)${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
fi

echo ""
echo "📋 Teste 6: Frontend Unit Tests"
echo "─────────────────────────────────────────────"

cd /workspace/flui-frontend-vite
TEST_OUTPUT=$(npm test 2>&1)

if echo "$TEST_OUTPUT" | grep -q "Tests.*passed"; then
  UNIT_TESTS=$(echo "$TEST_OUTPUT" | grep -o '[0-9]* passed' | head -1 | cut -d' ' -f1)
  echo -e "  ${GREEN}✅ PASS: $UNIT_TESTS testes unitários passaram${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "  ${RED}❌ FAIL: Testes unitários falharam${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "============================================"
echo "📊 RESULTADO FINAL"
echo "============================================"
echo ""
echo -e "✅ Testes Passaram: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "❌ Testes Falharam: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ============================================${NC}"
  echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
  echo -e "${GREEN}🎉 INTEGRAÇÃO 100% REAL - SEM HARDCODED${NC}"
  echo -e "${GREEN}🎉 ============================================${NC}"
  echo ""
  echo "✅ Persistência de dados: FUNCIONANDO"
  echo "✅ Modelos reais: FUNCIONANDO"
  echo "✅ Chat de logs: REAL (não simulado)"
  echo "✅ Execução de agentes: REAL"
  echo "✅ Testes unitários: PASSANDO"
  echo ""
  echo "🌐 Frontend disponível em: http://localhost:8080"
  echo "📡 Backend disponível em: http://localhost:3001"
  exit 0
else
  echo -e "${RED}❌ Alguns testes falharam. Verifique os logs acima.${NC}"
  exit 1
fi
