#!/bin/bash

echo "🧪 ════════════════════════════════════════════════════════"
echo "🧪 TESTE END-TO-END COMPLETO - WORKFLOW COM MÚLTIPLOS NODES"
echo "🧪 ════════════════════════════════════════════════════════"
echo ""

API_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
  local name="$1"
  local condition="$2"
  
  if [ "$condition" = "true" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $name"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# ═══════════════════════════════════════════════════════════
echo "📋 TESTE 1: Criar Agente"
echo "─────────────────────────────────────────────────────────"

AGENT_ID="e2e-agent-$(date +%s)"
AGENT_RESPONSE=$(curl -s -X POST "${API_URL}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AGENT_ID}'",
    "name": "E2E Test Agent",
    "model": "deepseek-v3.1",
    "systemPrompt": "Responda de forma ultra curta (max 5 palavras).",
    "temperature": 0.7,
    "maxTokens": 50,
    "enabled": true,
    "tools": []
  }')

test_result "Criar agente" "$(echo "$AGENT_RESPONSE" | grep -q 'success' && echo true || echo false)"

# ═══════════════════════════════════════════════════════════
echo ""
echo "📋 TESTE 2: Criar Automação com 5 Nodes em Cadeia"
echo "─────────────────────────────────────────────────────────"

AUTO_ID="e2e-workflow-$(date +%s)"
CREATE_AUTO=$(curl -s -X POST "${API_URL}/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AUTO_ID}'",
    "name": "E2E Complete Workflow",
    "description": "Teste completo com 5 nodes",
    "nodes": [
      {
        "id": "node-1",
        "type": "trigger",
        "name": "Trigger",
        "description": "Node inicial",
        "config": {
          "toolId": "manual-trigger",
          "category": "system",
          "params": {"message": "Inicio"}
        },
        "position": {"x": 100, "y": 100}
      },
      {
        "id": "node-2",
        "type": "agent",
        "name": "Processador 1",
        "description": "Primeiro processador",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "category": "agent",
          "params": {
            "prompt": "Processe: {{node-1.message}}",
            "temperature": 0.7
          }
        },
        "position": {"x": 400, "y": 100}
      },
      {
        "id": "node-3",
        "type": "agent",
        "name": "Processador 2",
        "description": "Segundo processador",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "category": "agent",
          "params": {
            "prompt": "Continue: {{node-2.response}}",
            "temperature": 0.8
          }
        },
        "position": {"x": 700, "y": 100}
      },
      {
        "id": "node-4",
        "type": "agent",
        "name": "Processador 3",
        "description": "Terceiro processador",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "category": "agent",
          "params": {
            "prompt": "Finalize: {{node-3.response}}",
            "temperature": 0.9
          }
        },
        "position": {"x": 1000, "y": 100}
      },
      {
        "id": "node-5",
        "type": "agent",
        "name": "Finalizador",
        "description": "Node final",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "category": "agent",
          "params": {
            "prompt": "Resumo de {{node-1.message}}, {{node-2.response}}, {{node-3.response}}, {{node-4.response}}",
            "temperature": 0.7
          }
        },
        "position": {"x": 1300, "y": 100}
      }
    ],
    "edges": [
      {"id": "e1", "source": "node-1", "target": "node-2"},
      {"id": "e2", "source": "node-2", "target": "node-3"},
      {"id": "e3", "source": "node-3", "target": "node-4"},
      {"id": "e4", "source": "node-4", "target": "node-5"}
    ]
  }')

test_result "Criar automação com 5 nodes" "$(echo "$CREATE_AUTO" | grep -q 'success' && echo true || echo false)"

# ═══════════════════════════════════════════════════════════
echo ""
echo "📋 TESTE 3: Recarregar e Validar Persistência de Configs"
echo "─────────────────────────────────────────────────────────"

RELOAD=$(curl -s "${API_URL}/automations/${AUTO_ID}")

# Verificar cada node
for i in 1 2 3 4 5; do
  NODE_PRESENT=$(echo "$RELOAD" | grep -q "node-$i" && echo true || echo false)
  test_result "Node $i presente" "$NODE_PRESENT"
done

# Verificar configs específicos
test_result "Config node-2 preservado" "$(echo "$RELOAD" | grep -q 'Processe:' && echo true || echo false)"
test_result "Config node-3 preservado" "$(echo "$RELOAD" | grep -q 'Continue:' && echo true || echo false)"
test_result "Config node-5 com múltiplos linkers" "$(echo "$RELOAD" | grep -q 'node-4.response' && echo true || echo false)"

# ═══════════════════════════════════════════════════════════
echo ""
echo "📋 TESTE 4: Atualizar Config do Node 3 (meio da cadeia)"
echo "─────────────────────────────────────────────────────────"

UPDATE=$(curl -s -X PATCH "${API_URL}/automations/${AUTO_ID}/nodes/node-3/config" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "prompt": "ATUALIZADO: {{node-2.response}}",
      "temperature": 0.95,
      "newParam": "valor teste"
    }
  }')

test_result "Atualizar config node-3" "$(echo "$UPDATE" | grep -q 'success' && echo true || echo false)"

# Verificar se update persistiu
VERIFY=$(curl -s "${API_URL}/automations/${AUTO_ID}")
test_result "Update persistido (ATUALIZADO)" "$(echo "$VERIFY" | grep -q 'ATUALIZADO' && echo true || echo false)"
test_result "Update persistido (temperature 0.95)" "$(echo "$VERIFY" | grep -q '0.95' && echo true || echo false)"
test_result "Update persistido (newParam)" "$(echo "$VERIFY" | grep -q 'newParam' && echo true || echo false)"

# ═══════════════════════════════════════════════════════════
echo ""
echo "📋 TESTE 5: Adicionar Node 6 Dinamicamente"
echo "─────────────────────────────────────────────────────────"

# Recarregar automação atual
CURRENT=$(curl -s "${API_URL}/automations/${AUTO_ID}")

# Adicionar node 6
UPDATED_AUTO=$(echo "$CURRENT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
# Adicionar node-6
data['nodes'].append({
  'id': 'node-6',
  'type': 'agent',
  'name': 'Extra Node',
  'config': {
    'toolId': 'agent-${AGENT_ID}',
    'category': 'agent',
    'params': {
      'prompt': 'Extra: {{node-5.response}}',
      'temperature': 0.8
    }
  },
  'position': {'x': 1600, 'y': 100}
})
# Adicionar edge
data['edges'].append({
  'id': 'e5',
  'source': 'node-5',
  'target': 'node-6'
})
print(json.dumps(data))
")

# Salvar automação atualizada
SAVE_UPDATED=$(curl -s -X PUT "${API_URL}/automations/${AUTO_ID}" \
  -H "Content-Type: application/json" \
  -d "$UPDATED_AUTO")

test_result "Adicionar node-6 dinamicamente" "$(echo "$SAVE_UPDATED" | grep -q 'success' && echo true || echo false)"

# Verificar se node-6 foi salvo
VERIFY_NODE6=$(curl -s "${API_URL}/automations/${AUTO_ID}")
test_result "Node-6 presente após reload" "$(echo "$VERIFY_NODE6" | grep -q 'node-6' && echo true || echo false)"

# ═══════════════════════════════════════════════════════════
echo ""
echo "📋 TESTE 6: Validar Estrutura Completa (6 nodes)"
echo "─────────────────────────────────────────────────────────"

FINAL_CHECK=$(curl -s "${API_URL}/automations/${AUTO_ID}")

NODE_COUNT=$(echo "$FINAL_CHECK" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data['nodes']))")
EDGE_COUNT=$(echo "$FINAL_CHECK" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data['edges']))")

test_result "6 nodes presentes" "$([ "$NODE_COUNT" = "6" ] && echo true || echo false)"
test_result "5 edges presentes" "$([ "$EDGE_COUNT" = "5" ] && echo true || echo false)"

# ═══════════════════════════════════════════════════════════
echo ""
echo "📋 TESTE 7: Executar Automação Completa"
echo "─────────────────────────────────────────────────────────"

echo "Executando workflow com 6 nodes..."
EXEC=$(curl -s -X POST "${API_URL}/automations/${AUTO_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{"debugMode": true}')

test_result "Execução iniciada" "$(echo "$EXEC" | grep -q 'success\|running\|completed' && echo true || echo false)"

# Verificar se todos os nodes executaram (se completou)
if echo "$EXEC" | grep -q '"status":"completed"'; then
  test_result "Execução completada" "true"
  test_result "Node-1 executado" "$(echo "$EXEC" | grep -q 'node-1' && echo true || echo false)"
  test_result "Node-6 executado" "$(echo "$EXEC" | grep -q 'node-6' && echo true || echo false)"
else
  test_result "Execução completada" "false"
  echo "  ⚠️  Execução ainda em andamento ou falhou"
  echo "  Status: $(echo "$EXEC" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('status', 'unknown'))" 2>/dev/null)"
fi

# ═══════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════"
echo "📊 RESULTADO FINAL"
echo "════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Testes Passaram: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Testes Falharam: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}🎉 SUCESSO TOTAL! TODOS OS TESTES PASSARAM!${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "✅ Criação de automação com múltiplos nodes"
  echo "✅ Persistência de configs de todos os nodes"
  echo "✅ Atualização individual de configs"
  echo "✅ Adição dinâmica de nodes"
  echo "✅ Linkers funcionando em cadeia"
  echo "✅ Execução completa do workflow"
  echo ""
  echo "🌐 Automação ID: $AUTO_ID"
  echo "🤖 Agente ID: $AGENT_ID"
  echo ""
  echo "📝 Para testar no frontend:"
  echo "   1. Acesse: http://localhost:8080"
  echo "   2. Vá para 'Automações'"
  echo "   3. Abra: E2E Complete Workflow"
  echo "   4. Verifique a UI dos 6 nodes"
  echo "   5. Configure qualquer node"
  echo "   6. Teste os linkers (deve mostrar TODOS os predecessores)"
  exit 0
else
  echo -e "${RED}════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
  echo -e "${RED}════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Verifique os logs acima para mais detalhes."
  exit 1
fi
