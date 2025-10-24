#!/usr/bin/env node

/**
 * Test script to verify edge/connection persistence
 * 
 * This script:
 * 1. Creates an automation with nodes and edges
 * 2. Saves it to the backend
 * 3. Loads it back
 * 4. Verifies that all edges are preserved
 */

const API_BASE = 'http://localhost:3001'

async function testEdgePersistence() {
  console.log('🧪 Testing Edge/Connection Persistence\n')
  
  try {
    // Step 1: Create automation with nodes and edges
    console.log('1️⃣ Creating automation with edges...')
    
    const testAutomation = {
      name: 'Test Edge Persistence',
      description: 'Testing if edges/connections are preserved after save',
      nodes: [
        {
          id: 'node-1',
          type: 'manual-trigger',
          name: 'Start',
          description: 'Manual trigger',
          config: {},
          position: { x: 100, y: 100 },
        },
        {
          id: 'node-2',
          type: 'agent',
          name: 'Agent Node',
          description: 'Process with agent',
          config: { message: 'test' },
          position: { x: 300, y: 100 },
          agentId: 'test-agent',
        },
        {
          id: 'node-3',
          type: 'tool',
          name: 'Tool Node',
          description: 'Use a tool',
          config: { param: 'value' },
          position: { x: 500, y: 100 },
          toolId: 'test-tool',
        },
        {
          id: 'node-4',
          type: 'condition',
          name: 'Condition',
          description: 'Branch based on condition',
          config: { condition: 'value > 10' },
          position: { x: 700, y: 100 },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-2', target: 'node-3' },
        { id: 'edge-3', source: 'node-3', target: 'node-4' },
      ],
      startNodeId: 'node-1',
    }
    
    console.log(`   Nodes: ${testAutomation.nodes.length}`)
    console.log(`   Edges: ${testAutomation.edges.length}`)
    testAutomation.edges.forEach((edge, i) => {
      console.log(`     ${i + 1}. ${edge.id}: ${edge.source} → ${edge.target}`)
    })
    
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
    console.log(`   Edges in response: ${createResult.automation?.edges?.length || 0}`)
    
    // Step 3: Load back from backend
    console.log('\n3️⃣ Loading automation from backend...')
    const loadResponse = await fetch(`${API_BASE}/api/automations/${automationId}`)
    
    if (!loadResponse.ok) {
      throw new Error('Failed to load automation')
    }
    
    const loadedAutomation = await loadResponse.json()
    console.log(`   ✅ Loaded automation: ${loadedAutomation.id}`)
    console.log(`   Nodes loaded: ${loadedAutomation.nodes?.length || 0}`)
    console.log(`   Edges loaded: ${loadedAutomation.edges?.length || 0}`)
    
    // Step 4: Verify edges
    console.log('\n4️⃣ Verifying edges...\n')
    
    let allPassed = true
    
    if (!loadedAutomation.edges || loadedAutomation.edges.length === 0) {
      console.log('   ❌ CRITICAL: NO EDGES LOADED!')
      console.log('   Expected:', testAutomation.edges.length, 'edges')
      console.log('   Got: 0 edges')
      allPassed = false
    } else if (loadedAutomation.edges.length !== testAutomation.edges.length) {
      console.log(`   ❌ Edge count mismatch!`)
      console.log(`   Expected: ${testAutomation.edges.length} edges`)
      console.log(`   Got: ${loadedAutomation.edges.length} edges`)
      allPassed = false
    } else {
      console.log(`   ✅ Edge count correct: ${loadedAutomation.edges.length} edges`)
    }
    
    // Verify each edge
    for (const originalEdge of testAutomation.edges) {
      const loadedEdge = loadedAutomation.edges?.find(
        (e) => e.id === originalEdge.id || 
               (e.source === originalEdge.source && e.target === originalEdge.target)
      )
      
      if (!loadedEdge) {
        console.log(`   ❌ Edge LOST: ${originalEdge.id} (${originalEdge.source} → ${originalEdge.target})`)
        allPassed = false
      } else {
        const idMatch = loadedEdge.id === originalEdge.id
        const sourceMatch = loadedEdge.source === originalEdge.source
        const targetMatch = loadedEdge.target === originalEdge.target
        
        if (idMatch && sourceMatch && targetMatch) {
          console.log(`   ✅ Edge preserved: ${loadedEdge.id} (${loadedEdge.source} → ${loadedEdge.target})`)
        } else {
          console.log(`   ⚠️  Edge found but with issues:`)
          if (!idMatch) console.log(`      - ID mismatch: expected ${originalEdge.id}, got ${loadedEdge.id}`)
          if (!sourceMatch) console.log(`      - Source mismatch: expected ${originalEdge.source}, got ${loadedEdge.source}`)
          if (!targetMatch) console.log(`      - Target mismatch: expected ${originalEdge.target}, got ${loadedEdge.target}`)
          allPassed = false
        }
      }
    }
    
    // Step 5: Test update (simulate editing)
    console.log('\n5️⃣ Testing edge persistence after update...')
    
    // Add one more edge
    const updatedAutomation = {
      ...loadedAutomation,
      edges: [
        ...loadedAutomation.edges,
        { id: 'edge-4', source: 'node-4', target: 'node-2' }, // Create a loop
      ],
    }
    
    const updateResponse = await fetch(`${API_BASE}/api/automations/${automationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedAutomation),
    })
    
    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      throw new Error(`Failed to update automation: ${error.error}`)
    }
    
    console.log('   ✅ Automation updated with new edge')
    
    // Load again
    const loadResponse2 = await fetch(`${API_BASE}/api/automations/${automationId}`)
    const loadedAutomation2 = await loadResponse2.json()
    
    console.log(`   Edges after reload: ${loadedAutomation2.edges?.length || 0}`)
    
    if (loadedAutomation2.edges?.length === 4) {
      console.log('   ✅ New edge persisted correctly')
      
      // Check if the new edge is there
      const newEdge = loadedAutomation2.edges.find(e => e.id === 'edge-4')
      if (newEdge && newEdge.source === 'node-4' && newEdge.target === 'node-2') {
        console.log('   ✅ New edge data correct')
      } else {
        console.log('   ❌ New edge data incorrect')
        allPassed = false
      }
    } else {
      console.log(`   ❌ Expected 4 edges after update, got ${loadedAutomation2.edges?.length || 0}`)
      allPassed = false
    }
    
    // Step 6: Cleanup
    console.log('\n6️⃣ Cleaning up...')
    await fetch(`${API_BASE}/api/automations/${automationId}`, {
      method: 'DELETE',
    })
    console.log('   ✅ Test automation deleted')
    
    // Final result
    console.log('\n' + '='.repeat(60))
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED! Edges are being preserved correctly.')
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
testEdgePersistence()
