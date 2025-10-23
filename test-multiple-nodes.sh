#!/bin/bash

echo "🧪 TESTE: Automação com Múltiplos Nodes"
echo "========================================"
echo ""

API_URL="http://localhost:3001/api"

# Criar agente
AGENT_ID="test-agent-multi-$(date +%s)"
echo "📋 Criando agente..."
curl -s -X POST "${API_URL}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AGENT_ID}'",
    "name": "Multi Node Agent",
    "model": "deepseek-v3.1",
    "systemPrompt": "Você é um assistente.",
    "temperature": 0.7,
    "maxTokens": 100,
    "enabled": true,
    "tools": []
  }' > /dev/null

echo "✅ Agente criado: $AGENT_ID"

# Criar automação com 5 nodes
AUTO_ID="test-multi-nodes-$(date +%s)"
echo ""
echo "📋 Criando automação com 5 nodes..."

CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AUTO_ID}'",
    "name": "Test Multiple Nodes",
    "nodes": [
      {
        "id": "node-1",
        "type": "trigger",
        "name": "Trigger",
        "config": {
          "toolId": "manual-trigger",
          "params": {"message": "Start"}
        },
        "position": {"x": 100, "y": 100}
      },
      {
        "id": "node-2",
        "type": "agent",
        "name": "Agent 1",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "params": {"prompt": "Processo 1: {{node-1.message}}"}
        },
        "position": {"x": 400, "y": 100}
      },
      {
        "id": "node-3",
        "type": "agent",
        "name": "Agent 2",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "params": {"prompt": "Processo 2: {{node-2.response}}"}
        },
        "position": {"x": 700, "y": 100}
      },
      {
        "id": "node-4",
        "type": "agent",
        "name": "Agent 3",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "params": {"prompt": "Processo 3: {{node-3.response}}"}
        },
        "position": {"x": 1000, "y": 100}
      },
      {
        "id": "node-5",
        "type": "agent",
        "name": "Agent 4",
        "config": {
          "toolId": "agent-'${AGENT_ID}'",
          "params": {"prompt": "Final: {{node-4.response}}"}
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

echo "✅ Automação criada: $AUTO_ID"
echo ""

# Testar recarregamento
echo "📋 Testando recarregamento..."
RELOAD=$(curl -s "${API_URL}/automations/${AUTO_ID}")

echo "Verificando configs preservados:"
for i in 1 2 3 4 5; do
  HAS_CONFIG=$(echo "$RELOAD" | grep -o "node-$i" | wc -l)
  if [ $HAS_CONFIG -gt 0 ]; then
    echo "  ✅ node-$i: presente"
  else
    echo "  ❌ node-$i: ausente"
  fi
done

echo ""
echo "📋 Testando atualização de config individual..."

# Atualizar config do node-3 (meio da cadeia)
UPDATE=$(curl -s -X PATCH "${API_URL}/automations/${AUTO_ID}/nodes/node-3/config" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "prompt": "ATUALIZADO: {{node-2.response}}",
      "temperature": 0.9
    }
  }')

echo "Response: $UPDATE"

# Verificar se update foi salvo
VERIFY=$(curl -s "${API_URL}/automations/${AUTO_ID}")
if echo "$VERIFY" | grep -q "ATUALIZADO"; then
  echo "✅ Config atualizado e persistido"
else
  echo "❌ Config NÃO foi persistido"
fi

echo ""
echo "========================================="
echo "Automação ID: $AUTO_ID"
echo "Agente ID: $AGENT_ID"
echo "========================================="
