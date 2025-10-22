#!/bin/bash

# Test to understand node structure

API="http://localhost:3001/api"

echo "🧪 Testing node structure..."
echo ""

# 1. Criar agente
echo "1. Creating agent..."
AGENT_RESP=$(curl -s -X POST $API/agents -H "Content-Type: application/json" -d '{
  "name": "Structure Test Agent",
  "model": "gpt-4",
  "systemPrompt": "test",
  "enabled": true
}')

AGENT_ID=$(echo $AGENT_RESP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Agent ID: $AGENT_ID"
echo ""

# 2. Criar automação com node de agente
echo "2. Creating automation with agent node..."
AUTO_RESP=$(curl -s -X POST $API/automations -H "Content-Type: application/json" -d '{
  "id": "test-structure",
  "name": "Test Structure",
  "version": "2.0.0",
  "nodes": [
    {
      "id": "node-1",
      "type": "agent",
      "name": "Agent Node",
      "config": {
        "toolId": "agent-'$AGENT_ID'",
        "category": "agent",
        "params": {
          "prompt": "test"
        }
      },
      "position": {"x": 100, "y": 100}
    }
  ],
  "edges": [],
  "startNodeId": "node-1",
  "enabled": true
}')

echo "   Automation created"
echo ""

# 3. Buscar node do backend
echo "3. Fetching node from backend..."
NODE_RESP=$(curl -s $API/automations/test-structure/nodes/node-1)
echo "   Node response:"
echo "$NODE_RESP" | python3 -m json.tool 2>/dev/null || echo "$NODE_RESP"
echo ""

# 4. Extrair toolId do node
TOOL_ID=$(echo $NODE_RESP | grep -o '"toolId":"[^"]*"' | cut -d'"' -f4)
NODE_TYPE=$(echo $NODE_RESP | grep -o '"type":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "4. Extracted values:"
echo "   toolId from node.config: $TOOL_ID"
echo "   node.type: $NODE_TYPE"
echo ""

# 5. Testar busca do agente
if [ ! -z "$TOOL_ID" ]; then
  EXTRACTED_AGENT_ID=$(echo $TOOL_ID | sed 's/agent-//')
  echo "5. Testing agent fetch with extracted ID: $EXTRACTED_AGENT_ID"
  AGENT_TOOL=$(curl -s $API/agents/$EXTRACTED_AGENT_ID/as-tool)
  
  if echo $AGENT_TOOL | grep -q '"id":"agent-'; then
    echo "   ✅ Agent fetched successfully as tool"
  else
    echo "   ❌ Failed to fetch agent"
    echo "   Response: $AGENT_TOOL"
  fi
else
  echo "5. ❌ toolId not found in node!"
fi

echo ""

# Cleanup
curl -s -X DELETE $API/automations/test-structure > /dev/null
curl -s -X DELETE $API/agents/$AGENT_ID > /dev/null
echo "✅ Cleanup done"
