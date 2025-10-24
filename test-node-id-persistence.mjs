#!/usr/bin/env node

/**
 * Test script to verify node ID persistence
 * 
 * This script:
 * 1. Creates an automation with nodes containing agentId/toolId/mcpId
 * 2. Saves it to the backend
 * 3. Loads it back
 * 4. Verifies that all IDs are preserved
 */

const API_BASE = 'http://localhost:3001'

async function testNodeIdPersistence() {
  console.log('🧪 Testing Node ID Persistence\n')
  
  try {
    // Step 1: Create automation with nodes that have IDs
    console.log('1️⃣ Creating automation with node IDs...')
    
    const testAutomation = {
      name: 'Test Node ID Persistence',
      description: 'Testing if agentId, toolId, mcpId, mcpToolId are preserved',
      nodes: [
        {
          id: 'node-1',
          type: 'agent',
          name: 'Test Agent Node',
          description: 'Agent with agentId',
          config: { message: 'test input' },
          position: { x: 100, y: 100 },
          agentId: 'test-agent-123',
        },
        {
          id: 'node-2',
          type: 'tool',
          name: 'Test Tool Node',
          description: 'Tool with toolId',
          config: { param1: 'value1' },
          position: { x: 300, y: 100 },
          toolId: 'test-tool-456',
        },
        {
          id: 'node-3',
          type: 'tool',
          name: 'Test MCP Tool Node',
          description: 'MCP tool with mcpId and mcpToolId',
          config: { param2: 'value2' },
          position: { x: 500, y: 100 },
          mcpId: 'test-mcp-789',
          mcpToolId: 'test-mcp-tool-101',
        },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-2', target: 'node-3' },
      ],
      startNodeId: 'node-1',
    }
    
    console.log('   Nodes to save:', testAutomation.nodes.map(n => ({
      id: n.id,
      type: n.type,
      agentId: n.agentId,
      toolId: n.toolId,
      mcpId: n.mcpId,
      mcpToolId: n.mcpToolId,
    })))
    
    // Step 2: Save to backend
    console.log('\n2️⃣ Saving automation to backend...')
    const createResponse = await fetch(`${API_BASE}/api/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAutomation),
    })
    
    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(`Failed to create automation: ${error.error}`)
    }
    
    const createResult = await createResponse.json()
    const automationId = createResult.id
    console.log(`   ✅ Created automation: ${automationId}`)
    
    // Step 3: Load back from backend
    console.log('\n3️⃣ Loading automation from backend...')
    const loadResponse = await fetch(`${API_BASE}/api/automations/${automationId}`)
    
    if (!loadResponse.ok) {
      throw new Error('Failed to load automation')
    }
    
    const loadedAutomation = await loadResponse.json()
    console.log(`   ✅ Loaded automation: ${loadedAutomation.id}`)
    
    // Step 4: Verify node IDs
    console.log('\n4️⃣ Verifying node IDs...\n')
    
    let allPassed = true
    
    for (const originalNode of testAutomation.nodes) {
      const loadedNode = loadedAutomation.nodes.find(n => n.id === originalNode.id)
      
      if (!loadedNode) {
        console.log(`   ❌ Node ${originalNode.id} not found in loaded automation`)
        allPassed = false
        continue
      }
      
      console.log(`   📦 Node ${originalNode.id}:`)
      
      // Check agentId
      if (originalNode.agentId) {
        if (loadedNode.agentId === originalNode.agentId) {
          console.log(`      ✅ agentId preserved: ${loadedNode.agentId}`)
        } else {
          console.log(`      ❌ agentId LOST: expected ${originalNode.agentId}, got ${loadedNode.agentId}`)
          allPassed = false
        }
      }
      
      // Check toolId
      if (originalNode.toolId) {
        if (loadedNode.toolId === originalNode.toolId) {
          console.log(`      ✅ toolId preserved: ${loadedNode.toolId}`)
        } else {
          console.log(`      ❌ toolId LOST: expected ${originalNode.toolId}, got ${loadedNode.toolId}`)
          allPassed = false
        }
      }
      
      // Check mcpId
      if (originalNode.mcpId) {
        if (loadedNode.mcpId === originalNode.mcpId) {
          console.log(`      ✅ mcpId preserved: ${loadedNode.mcpId}`)
        } else {
          console.log(`      ❌ mcpId LOST: expected ${originalNode.mcpId}, got ${loadedNode.mcpId}`)
          allPassed = false
        }
      }
      
      // Check mcpToolId
      if (originalNode.mcpToolId) {
        if (loadedNode.mcpToolId === originalNode.mcpToolId) {
          console.log(`      ✅ mcpToolId preserved: ${loadedNode.mcpToolId}`)
        } else {
          console.log(`      ❌ mcpToolId LOST: expected ${originalNode.mcpToolId}, got ${loadedNode.mcpToolId}`)
          allPassed = false
        }
      }
      
      // Check config
      if (loadedNode.config && Object.keys(loadedNode.config).length > 0) {
        console.log(`      ✅ config preserved: ${Object.keys(loadedNode.config).join(', ')}`)
      } else {
        console.log(`      ⚠️  config is empty`)
      }
    }
    
    // Step 5: Cleanup
    console.log('\n5️⃣ Cleaning up...')
    await fetch(`${API_BASE}/api/automations/${automationId}`, {
      method: 'DELETE',
    })
    console.log('   ✅ Test automation deleted')
    
    // Final result
    console.log('\n' + '='.repeat(60))
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED! Node IDs are being preserved correctly.')
    } else {
      console.log('❌ SOME TESTS FAILED! Check the output above for details.')
    }
    console.log('='.repeat(60))
    
    process.exit(allPassed ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    process.exit(1)
  }
}

// Run the test
testNodeIdPersistence()
