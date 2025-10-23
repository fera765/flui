#!/bin/bash

echo "🧪 TESTE: Workflow Completo - Adicionar e Configurar Node"
echo "=========================================================="
echo ""

API_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Criar agente
AGENT_ID="test-workflow-agent-$(date +%s)"
echo "📋 Passo 1: Criar agente..."
curl -s -X POST "${API_URL}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AGENT_ID}'",
    "name": "Workflow Test Agent",
    "model": "deepseek-v3.1",
    "systemPrompt": "Assistente de teste",
    "temperature": 0.7,
    "maxTokens": 50,
    "enabled": true,
    "tools": []
  }' > /dev/null

echo "✅ Agente criado: $AGENT_ID"

# Criar automação inicial (VAZIA - sem nodes)
AUTO_ID="test-workflow-$(date +%s)"
echo ""
echo "📋 Passo 2: Criar automação VAZIA..."

CREATE=$(curl -s -X POST "${API_URL}/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'${AUTO_ID}'",
    "name": "Workflow Test Empty",
    "description": "Automação vazia para teste",
    "nodes": [],
    "edges": []
  }')

if echo "$CREATE" | grep -q 'success'; then
  echo -e "${GREEN}✅ Automação vazia criada${NC}"
else
  echo -e "${RED}❌ Falha ao criar automação${NC}"
  exit 1
fi

# Adicionar node-1 (simulando adicionar via UI sem salvar)
echo ""
echo "📋 Passo 3: Adicionar Node 1 (simulando UI)..."

# Pegar automação atual
CURRENT=$(curl -s "${API_URL}/automations/${AUTO_ID}")

# Adicionar node-1
UPDATED_WITH_NODE1=$(echo "$CURRENT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
data['nodes'] = [{
  'id': 'node-1',
  'type': 'trigger',
  'name': 'Trigger',
  'config': {
    'toolId': 'manual-trigger',
    'category': 'system',
    'params': {}
  },
  'position': {'x': 100, 'y': 100}
}]
print(json.dumps(data))
")

# Salvar com node-1
curl -s -X PUT "${API_URL}/automations/${AUTO_ID}" \
  -H "Content-Type: application/json" \
  -d "$UPDATED_WITH_NODE1" > /dev/null

echo -e "${GREEN}✅ Node 1 adicionado e automação salva${NC}"

# Agora adicionar node-2 SEM salvar a automação (simulando comportamento real)
echo ""
echo "📋 Passo 4: Adicionar Node 2 SEM salvar automação..."

CURRENT2=$(curl -s "${API_URL}/automations/${AUTO_ID}")

UPDATED_WITH_NODE2=$(echo "$CURRENT2" | python3 -c "
import sys, json
data = json.load(sys.stdin)
data['nodes'].append({
  'id': 'node-2',
  'type': 'agent',
  'name': 'Agente Novo',
  'config': {
    'toolId': 'agent-${AGENT_ID}',
    'category': 'agent',
    'params': {}
  },
  'position': {'x': 400, 'y': 100}
})
data['edges'].append({
  'id': 'e1',
  'source': 'node-1',
  'target': 'node-2'
})
print(json.dumps(data))
")

echo "Node 2 adicionado APENAS no estado local (não salvo no backend)"

# Tentar configurar node-2 ANTES de salvar a automação
echo ""
echo "📋 Passo 5: Configurar Node 2 (SEM ter salvado automação)..."

CONFIG_RESPONSE=$(curl -s -X PATCH "${API_URL}/automations/${AUTO_ID}/nodes/node-2/config" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "prompt": "Teste de config sem salvar",
      "temperature": 0.8
    }
  }')

if echo "$CONFIG_RESPONSE" | grep -q '404'; then
  echo -e "${GREEN}✅ ESPERADO: Node não existe no backend (404)${NC}"
  echo "   (Isso é normal - node só existe localmente)"
elif echo "$CONFIG_RESPONSE" | grep -q 'success'; then
  echo -e "${GREEN}✅ Config salvo (node já existia no backend)${NC}"
else
  echo -e "${RED}❌ Erro inesperado: $CONFIG_RESPONSE${NC}"
fi

# Agora salvar a automação completa com node-2 e config
echo ""
echo "📋 Passo 6: Salvar automação completa com Node 2 configurado..."

curl -s -X PUT "${API_URL}/automations/${AUTO_ID}" \
  -H "Content-Type: application/json" \
  -d "$UPDATED_WITH_NODE2" > /dev/null

echo -e "${GREEN}✅ Automação salva com Node 2${NC}"

# Atualizar config do node-2 agora que ele existe
echo ""
echo "📋 Passo 7: Atualizar config do Node 2 (agora ele existe)..."

UPDATE_CONFIG=$(curl -s -X PATCH "${API_URL}/automations/${AUTO_ID}/nodes/node-2/config" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "prompt": "Config atualizado após salvar",
      "temperature": 0.9
    }
  }')

if echo "$UPDATE_CONFIG" | grep -q 'success'; then
  echo -e "${GREEN}✅ Config atualizado com sucesso${NC}"
else
  echo -e "${RED}❌ Falha ao atualizar config${NC}"
  echo "Response: $UPDATE_CONFIG"
fi

# Verificar persistência
echo ""
echo "📋 Passo 8: Verificar persistência do config..."

VERIFY=$(curl -s "${API_URL}/automations/${AUTO_ID}")

if echo "$VERIFY" | grep -q "Config atualizado após salvar"; then
  echo -e "${GREEN}✅ Config persistido corretamente!${NC}"
else
  echo -e "${RED}❌ Config NÃO foi persistido${NC}"
  echo "Config atual do node-2:"
  echo "$VERIFY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
node2 = next((n for n in data.get('nodes', []) if n['id'] == 'node-2'), None)
if node2:
  print(json.dumps(node2.get('config', {}), indent=2))
else:
  print('Node 2 não encontrado')
"
fi

# Recarregar (simular F5)
echo ""
echo "📋 Passo 9: Recarregar automação (simular F5)..."

RELOAD=$(curl -s "${API_URL}/automations/${AUTO_ID}")

if echo "$RELOAD" | grep -q "Config atualizado após salvar"; then
  echo -e "${GREEN}✅ Config preservado após reload!${NC}"
  
  # Mostrar resumo
  NODE_COUNT=$(echo "$RELOAD" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['nodes']))")
  echo ""
  echo "📊 Resumo Final:"
  echo "  - Nodes: $NODE_COUNT"
  echo "  - Node 1: Trigger (config vazio)"
  echo "  - Node 2: Agente (config completo)"
  echo ""
  echo -e "${GREEN}🎉 TESTE PASSOU - FLUXO FUNCIONANDO!${NC}"
else
  echo -e "${RED}❌ Config perdido após reload${NC}"
  exit 1
fi

echo ""
echo "========================================="
echo "Automação ID: $AUTO_ID"
echo "Agente ID: $AGENT_ID"
echo "========================================="
