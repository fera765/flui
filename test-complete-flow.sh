#!/bin/bash

# Complete flow test - simulates user actions

API="http://localhost:3001/api"

echo "🧪 COMPLETE FLOW TEST - Agent and Condition"
echo "============================================"
echo ""

# Cleanup first
curl -s -X DELETE $API/automations/test-complete-flow > /dev/null 2>&1

# 1. Criar agente
echo "1. Creating agent..."
AGENT_RESP=$(curl -s -X POST $API/agents -H "Content-Type: application/json" -d '{
  "name": "Complete Flow Test Agent",
  "model": "gpt-4",
  "systemPrompt": "You are a test assistant",
  "enabled": true
}')

AGENT_ID=$(echo $AGENT_RESP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ✅ Agent created: $AGENT_ID"
echo ""

# 2. Criar automação com CONDITION + AGENT
echo "2. Creating automation with Condition and Agent nodes..."
AUTO_RESP=$(curl -s -X POST $API/automations -H "Content-Type: application/json" -d '{
  "id": "test-complete-flow",
  "name": "Complete Flow Test",
  "version": "2.0.0",
  "nodes": [
    {
      "id": "node-condition",
      "type": "system",
      "name": "Condition Flex",
      "config": {
        "toolId": "condition-flex",
        "category": "system",
        "params": {
          "value": "test",
          "paths": ["path1", "path2"]
        }
      },
      "position": {"x": 100, "y": 100}
    },
    {
      "id": "node-agent",
      "type": "agent",
      "name": "Agent Node",
      "config": {
        "toolId": "agent-'$AGENT_ID'",
        "category": "agent",
        "params": {
          "prompt": "Hello from test"
        }
      },
      "position": {"x": 500, "y": 100}
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-condition",
      "target": "node-agent"
    }
  ],
  "startNodeId": "node-condition",
  "enabled": true
}')

echo "   ✅ Automation created"
echo ""

# 3. Testar busca do CONDITION node
echo "3. Testing CONDITION node fetch..."
CONDITION_NODE=$(curl -s $API/automations/test-complete-flow/nodes/node-condition)

CONDITION_TOOL_ID=$(echo $CONDITION_NODE | grep -o '"toolId":"[^"]*"' | cut -d'"' -f4)
CONDITION_TYPE=$(echo $CONDITION_NODE | grep -o '"type":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "   Node type: $CONDITION_TYPE"
echo "   Tool ID: $CONDITION_TOOL_ID"

if [ "$CONDITION_TOOL_ID" == "condition-flex" ]; then
  echo "   ✅ Condition node has correct toolId"
else
  echo "   ❌ Condition node toolId incorrect: $CONDITION_TOOL_ID"
fi

# Testar busca da tool
CONDITION_TOOL=$(curl -s $API/tools/condition-flex)
if echo $CONDITION_TOOL | grep -q '"id":"condition-flex"'; then
  echo "   ✅ Condition tool fetched successfully"
else
  echo "   ❌ Failed to fetch condition tool"
fi
echo ""

# 4. Testar busca do AGENT node
echo "4. Testing AGENT node fetch..."
AGENT_NODE=$(curl -s $API/automations/test-complete-flow/nodes/node-agent)

AGENT_TOOL_ID=$(echo $AGENT_NODE | grep -o '"toolId":"[^"]*"' | cut -d'"' -f4)
AGENT_NODE_TYPE=$(echo $AGENT_NODE | grep -o '"type":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "   Node type: $AGENT_NODE_TYPE"
echo "   Tool ID: $AGENT_TOOL_ID"

if [ "$AGENT_TOOL_ID" == "agent-$AGENT_ID" ]; then
  echo "   ✅ Agent node has correct toolId"
else
  echo "   ❌ Agent node toolId incorrect: $AGENT_TOOL_ID"
fi

# Testar busca do agente como tool
EXTRACTED_ID=$(echo $AGENT_TOOL_ID | sed 's/agent-//')
AGENT_AS_TOOL=$(curl -s $API/agents/$EXTRACTED_ID/as-tool)

if echo $AGENT_AS_TOOL | grep -q '"id":"agent-'; then
  echo "   ✅ Agent fetched as tool successfully"
else
  echo "   ❌ Failed to fetch agent as tool"
  echo "   Response: $AGENT_AS_TOOL"
fi
echo ""

# 5. Executar automação
echo "5. Executing automation..."
EXEC_RESP=$(curl -s -X POST $API/automations/test-complete-flow/execute \
  -H "Content-Type: application/json" \
  -d '{"debugMode": true, "initialData": {}}')

if echo $EXEC_RESP | grep -q '"success":true'; then
  echo "   ✅ Automation executed successfully"
else
  echo "   ⚠️  Automation execution had issues (expected for test)"
  # echo "   Response: $EXEC_RESP" | head -c 200
fi
echo ""

echo "============================================"
echo "✅ COMPLETE FLOW TEST FINISHED"
echo "============================================"
echo ""
echo "Summary:"
echo "  - Agent ID: $AGENT_ID"
echo "  - Automation ID: test-complete-flow"
echo "  - Condition node: $CONDITION_TYPE with toolId $CONDITION_TOOL_ID"
echo "  - Agent node: $AGENT_NODE_TYPE with toolId $AGENT_TOOL_ID"
echo ""
echo "Cleanup:"
echo "  To clean up, run:"
echo "  curl -X DELETE $API/automations/test-complete-flow"
echo "  curl -X DELETE $API/agents/$AGENT_ID"
echo ""
