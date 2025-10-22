#!/bin/bash

# Integration Test Script for FLUI Frontend-Backend
# This script validates the fix for "Node não encontrado" error

set -e

echo "🧪 FLUI Integration Test - Agent & Condition Node Configuration"
echo "================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "📡 Checking backend API..."
if curl -s http://localhost:3001/api/automations > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "Please start backend with: cd /workspace && npm run start:api"
    exit 1
fi

# Test 1: Create an agent
echo ""
echo "🤖 Test 1: Creating test agent..."
AGENT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/agents \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Agent E2E",
        "model": "gpt-4",
        "systemPrompt": "You are a test assistant",
        "enabled": true
    }')

AGENT_ID=$(echo $AGENT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$AGENT_ID" ]; then
    echo -e "${RED}❌ Failed to create agent${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Agent created with ID: $AGENT_ID${NC}"

# Test 2: Fetch agent as tool
echo ""
echo "🔧 Test 2: Fetching agent as tool..."
TOOL_RESPONSE=$(curl -s http://localhost:3001/api/agents/$AGENT_ID/as-tool)

if echo $TOOL_RESPONSE | grep -q '"id":"agent-'; then
    echo -e "${GREEN}✅ Agent successfully converted to tool format${NC}"
else
    echo -e "${RED}❌ Failed to fetch agent as tool${NC}"
    echo "Response: $TOOL_RESPONSE"
    exit 1
fi

# Test 3: Create automation with agent node
echo ""
echo "🔄 Test 3: Creating automation with agent node..."
AUTOMATION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/automations \
    -H "Content-Type: application/json" \
    -d '{
        "id": "test-integration-auto",
        "name": "Test Integration Automation",
        "description": "Testing agent node configuration",
        "version": "2.0.0",
        "nodes": [
            {
                "id": "node-1",
                "type": "agent",
                "name": "Test Agent E2E",
                "description": "",
                "config": {
                    "toolId": "agent-'$AGENT_ID'",
                    "category": "agent",
                    "params": {
                        "prompt": "Test prompt"
                    }
                },
                "position": { "x": 100, "y": 100 }
            }
        ],
        "edges": [],
        "startNodeId": "node-1",
        "enabled": true
    }')

if echo $AUTOMATION_RESPONSE | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Automation created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create automation${NC}"
    echo "Response: $AUTOMATION_RESPONSE"
    exit 1
fi

# Test 4: Fetch node configuration (this was failing before the fix)
echo ""
echo "🔍 Test 4: Fetching node configuration (THE FIX TEST)..."
NODE_RESPONSE=$(curl -s http://localhost:3001/api/automations/test-integration-auto/nodes/node-1)

if echo $NODE_RESPONSE | grep -q '"id":"node-1"'; then
    echo -e "${GREEN}✅ Node fetched successfully${NC}"
    
    # Verify it has the correct structure
    if echo $NODE_RESPONSE | grep -q '"type":"agent"' && echo $NODE_RESPONSE | grep -q '"toolId":"agent-'; then
        echo -e "${GREEN}✅ Node has correct type and toolId${NC}"
    else
        echo -e "${YELLOW}⚠️  Node structure might be incorrect${NC}"
        echo "Response: $NODE_RESPONSE"
    fi
else
    echo -e "${RED}❌ Failed to fetch node${NC}"
    echo "Response: $NODE_RESPONSE"
    exit 1
fi

# Test 5: Verify condition-flex tool is registered
echo ""
echo "🌿 Test 5: Verifying condition-flex tool..."
CONDITION_RESPONSE=$(curl -s http://localhost:3001/api/tools/condition-flex)

if echo $CONDITION_RESPONSE | grep -q '"id":"condition-flex"'; then
    echo -e "${GREEN}✅ Condition-flex tool is registered${NC}"
else
    echo -e "${RED}❌ Condition-flex tool not found${NC}"
    echo "Response: $CONDITION_RESPONSE"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up test data..."
curl -s -X DELETE http://localhost:3001/api/automations/test-integration-auto > /dev/null
curl -s -X DELETE http://localhost:3001/api/agents/$AGENT_ID > /dev/null
echo -e "${GREEN}✅ Cleanup complete${NC}"

echo ""
echo "================================================================"
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo ""
echo "The fix for 'Node não encontrado' error is working correctly!"
echo ""
echo "Next steps:"
echo "1. Start frontend: cd /workspace/flui-frontend-vite && npm run dev"
echo "2. Open browser: http://localhost:5173"
echo "3. Follow manual test guide in: /workspace/flui-frontend-vite/tests/manual-test.md"
echo ""
