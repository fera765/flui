#!/bin/bash

echo "🧪 TESTANDO PERSISTÊNCIA DE CONFIGURAÇÃO DE NODE"
echo "================================================="
echo ""

API_URL="http://localhost:3001/api"

# Criar agente primeiro
AGENT_ID="test-agent-$(date +%s)"
echo "📋 Criando agente de teste..."
curl -s -X POST "${API_URL}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AGENT_ID}'",
    "name": "Test Agent Config",
    "model": "deepseek-v3.1",
    "systemPrompt": "Você é um assistente útil.",
    "temperature": 0.7,
    "maxTokens": 100,
    "enabled": true,
    "tools": []
  }' > /dev/null

echo "✅ Agente criado: $AGENT_ID"
echo ""

# Criar automação
AUTO_ID="test-config-persist-$(date +%s)"
echo "📋 Criando automação..."
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AUTO_ID}'",
    "name": "Test Config Persistence",
    "nodes": [
      {
        "id": "node-trigger",
        "type": "trigger",
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
          "category": "agent",
          "params": {}
        }
      }
    ],
    "edges": [{"id": "e1", "source": "node-trigger", "target": "node-agent"}]
  }')

echo "✅ Automação criada: $AUTO_ID"
echo ""

# Atualizar config do node agente (simulando modal de configuração)
echo "📋 Atualizando configuração do node agente..."
UPDATE_RESPONSE=$(curl -s -X PATCH "${API_URL}/automations/${AUTO_ID}/nodes/node-agent/config" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "prompt": "Diga olá de forma curta!",
      "temperature": 0.8
    },
    "toolId": "agent-'${AGENT_ID}'"
  }')

echo "✅ Configuração atualizada"
echo "Response: $UPDATE_RESPONSE"
echo ""

# Recarregar automação e verificar se config foi salvo
echo "📋 Recarregando automação para verificar persistência..."
RELOAD_RESPONSE=$(curl -s "${API_URL}/automations/${AUTO_ID}")

if echo "$RELOAD_RESPONSE" | grep -q "Diga olá de forma curta!"; then
  echo "✅ SUCESSO: Configuração persistida corretamente!"
  echo "   Encontrado: 'Diga olá de forma curta!'"
else
  echo "❌ FALHA: Configuração NÃO foi persistida!"
  echo "Response:"
  echo "$RELOAD_RESPONSE" | python3 -m json.tool | grep -A5 '"node-agent"'
  exit 1
fi

# Verificar estrutura do config
echo ""
echo "📊 Estrutura do config do node agente:"
echo "$RELOAD_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
agent_node = next((n for n in data.get('nodes', []) if n['id'] == 'node-agent'), None)
if agent_node:
  print(json.dumps(agent_node.get('config', {}), indent=2))
else:
  print('Node agente não encontrado!')
"

# Executar automação e verificar se agente recebe o prompt
echo ""
echo "📋 Executando automação para verificar se agente recebe o prompt..."
EXEC_RESPONSE=$(curl -s -X POST "${API_URL}/automations/${AUTO_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{"debugMode": true}')

if echo "$EXEC_RESPONSE" | grep -q '"success":true'; then
  echo "✅ SUCESSO: Automação executada!"
  if echo "$EXEC_RESPONSE" | grep -q "response"; then
    echo "✅ SUCESSO: Agente respondeu (recebeu o prompt)!"
  else
    echo "⚠️  AVISO: Automação executou mas agente não respondeu"
    echo "Response: $EXEC_RESPONSE" | python3 -m json.tool | grep -A3 '"error"'
  fi
else
  echo "❌ FALHA: Erro na execução"
  echo "Response:"
  echo "$EXEC_RESPONSE" | python3 -m json.tool | head -30
fi

echo ""
echo "==========================================="
echo "🎯 TESTE CONCLUÍDO"
echo "==========================================="
