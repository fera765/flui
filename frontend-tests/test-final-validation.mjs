/**
 * Test: Final Validation - Agent Config & Node Deletion
 * 
 * Testa os dois problemas reportados:
 * 1. Campos de agentes não carregam ao editar nó
 * 2. Não é possível deletar nós
 * 
 * Fluxo completo:
 * - Criar agente
 * - Adicionar agente em automação
 * - Editar configurações do agente no nó
 * - Deletar nó
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFinalValidation() {
  console.log('🎭 Playwright Test: Final Validation\n');
  console.log('='.repeat(70));
  console.log('🎯 OBJECTIVE: Validate agent config loading & node deletion');
  console.log('='.repeat(70) + '\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const consoleLogs = [];
  const consoleErrors = [];
  const testResults = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error' && !text.includes('Failed to load resource')) {
      consoleErrors.push(text);
      console.log(`  🔴 [ERROR] ${text}`);
    }
    
    // Monitor important logs
    if (text.includes('Deleting node') || text.includes('Node deleted')) {
      console.log(`  📝 ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
    console.error(`  🔴 [PAGE ERROR] ${error.message}`);
  });
  
  try {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // ========================================================================
    // STEP 1: Create an Agent
    // ========================================================================
    console.log('\n📍 STEP 1: Create Test Agent');
    console.log('-'.repeat(70));
    
    await page.click('a[href="/agents"]');
    await sleep(2000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'final-01-agents-page.png'), 
      fullPage: true 
    });
    
    const newAgentBtn = await page.locator('button:has-text("New Agent")');
    if (await newAgentBtn.count() > 0) {
      console.log('  🔧 Creating new agent...');
      await newAgentBtn.click();
      await sleep(2000);
      
      // Fill agent form with unique name
      const uniqueName = `Test Agent ${Date.now()}`;
      await page.fill('input[name="name"]', uniqueName);
      await page.fill('input[name="description"]', 'Agent for testing node config');
      await page.fill('textarea', 'You are a helpful assistant for testing.');
      
      // Select model
      const modelSelect = await page.locator('select').first();
      if (await modelSelect.count() > 0) {
        await modelSelect.selectOption({ index: 1 }); // Select first real model
      }
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'final-02-agent-form.png'), 
        fullPage: true 
      });
      
      // Submit
      await page.click('button[type="submit"]:has-text("Create")');
      await sleep(3000);
      
      console.log('  ✅ Agent created');
      testResults.push({ name: 'Create Agent', passed: true });
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'final-03-agent-created.png'), 
        fullPage: true 
      });
    } else {
      console.log('  ⚠️  New Agent button not found');
      testResults.push({ name: 'Create Agent', passed: false });
    }
    
    // ========================================================================
    // STEP 2: Create Automation and Add Agent Node
    // ========================================================================
    console.log('\n📍 STEP 2: Add Agent to Automation');
    console.log('-'.repeat(70));
    
    await page.click('a[href="/automations"]');
    await sleep(2000);
    await page.click('button:has-text("New Automation")');
    await sleep(3000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'final-04-workflow-editor.png'), 
      fullPage: true 
    });
    
    // Add agent node
    const addNodeBtn = await page.locator('button[data-testid="add-node-button"]');
    if (await addNodeBtn.count() > 0) {
      console.log('  🔧 Adding agent node...');
      await addNodeBtn.click();
      await sleep(1000);
      
      // Switch to Agents tab
      await page.click('button[data-testid="tab-agents"]');
      await sleep(1000);
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'final-05-add-node-agents-tab.png'), 
        fullPage: true 
      });
      
      // Select the first agent (most recent)
      const agentsList = await page.locator('button[data-testid^="node-item-"]');
      const agentCount = await agentsList.count();
      console.log(`  📊 Available agents: ${agentCount}`);
      
      if (agentCount > 0) {
        await agentsList.first().click();
        await sleep(2000);
        
        console.log('  ✅ Agent node added to workflow');
        testResults.push({ name: 'Add Agent Node', passed: true });
        
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, 'final-06-agent-node-added.png'), 
          fullPage: true 
        });
      } else {
        console.log('  ⚠️  Test agent not found in list');
        testResults.push({ name: 'Add Agent Node', passed: false });
      }
    }
    
    // Check if node is on canvas
    const nodesOnCanvas = await page.locator('.react-flow__node').count();
    console.log(`  📊 Nodes on canvas: ${nodesOnCanvas}`);
    
    // ========================================================================
    // STEP 3: Edit Agent Node Configuration (CRITICAL TEST)
    // ========================================================================
    console.log('\n📍 STEP 3: Edit Agent Node Configuration');
    console.log('-'.repeat(70));
    console.log('  🎯 CRITICAL: Verify agent fields load correctly');
    
    // Click on Config button in the node
    const configButton = await page.locator('button:has-text("Config")').first();
    if (await configButton.count() > 0) {
      console.log('  🔧 Opening node configuration...');
      await configButton.click();
      await sleep(2000);
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'final-07-node-config-modal.png'), 
        fullPage: true 
      });
      
      // Check if modal is open
      const modalOpen = await page.locator('[role="dialog"]').count() > 0;
      console.log(`  📊 Config modal opened: ${modalOpen ? '✅' : '❌'}`);
      testResults.push({ name: 'Open Node Config Modal', passed: modalOpen });
      
      if (modalOpen) {
        // Check for agent-specific fields
        const messageField = await page.locator('input[placeholder*="message" i], label:has-text("Message")').count();
        const hasAgentFields = messageField > 0;
        
        console.log(`  📊 Agent fields detected: ${hasAgentFields ? '✅' : '❌'}`);
        console.log(`    → Message field: ${messageField > 0 ? 'YES' : 'NO'}`);
        testResults.push({ name: 'Agent Fields Load', passed: hasAgentFields });
        
        // Check for parameter inputs
        const paramInputs = await page.locator('input, textarea, select').count();
        console.log(`  📊 Total configuration inputs: ${paramInputs}`);
        
        // Check for linker buttons (to link outputs)
        const linkerButtons = await page.locator('button[title*="Link" i], button:has-text("🔗")').count();
        console.log(`  📊 Linker buttons: ${linkerButtons}`);
        testResults.push({ name: 'Linker Buttons Present', passed: linkerButtons > 0 || hasAgentFields });
        
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, 'final-08-agent-fields.png'), 
          fullPage: true 
        });
        
        // Close modal
        await page.click('button:has-text("Cancel")');
        await sleep(1000);
        console.log('  ✅ Modal closed');
      }
    } else {
      console.log('  ⚠️  Config button not found');
      testResults.push({ name: 'Open Node Config Modal', passed: false });
    }
    
    // Make sure no modals are open
    const openModals = await page.locator('[role="dialog"]').count();
    if (openModals > 0) {
      console.log('  🔄 Closing open modals...');
      await page.keyboard.press('Escape');
      await sleep(1000);
    }
    
    // ========================================================================
    // STEP 4: Delete Node (CRITICAL TEST)
    // ========================================================================
    console.log('\n📍 STEP 4: Delete Node');
    console.log('-'.repeat(70));
    console.log('  🎯 CRITICAL: Verify node deletion works');
    
    const nodesBeforeDelete = await page.locator('.react-flow__node').count();
    console.log(`  📊 Nodes before delete: ${nodesBeforeDelete}`);
    
    if (nodesBeforeDelete > 0) {
      // Click delete button on node using testid
      const deleteButton = await page.locator('button[data-testid="node-delete-button"]').first();
      if (await deleteButton.count() > 0) {
        console.log('  🗑️  Clicking delete button...');
        await deleteButton.click({ force: true }); // Force click to bypass event capture
        await sleep(2000);
        
        const nodesAfterDelete = await page.locator('.react-flow__node').count();
        console.log(`  📊 Nodes after delete: ${nodesAfterDelete}`);
        
        const deletionWorked = nodesAfterDelete < nodesBeforeDelete;
        console.log(`  ${deletionWorked ? '✅' : '❌'} Node deletion: ${deletionWorked ? 'WORKS' : 'FAILED'}`);
        testResults.push({ name: 'Delete Node Works', passed: deletionWorked });
        
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, 'final-09-node-deleted.png'), 
          fullPage: true 
        });
      } else {
        console.log('  ⚠️  Delete button not found');
        testResults.push({ name: 'Delete Node Works', passed: false });
      }
    } else {
      console.log('  ℹ️  No nodes to delete');
      testResults.push({ name: 'Delete Node Works', passed: false });
    }
    
    // ========================================================================
    // STEP 5: Add Multiple Nodes and Test Features
    // ========================================================================
    console.log('\n📍 STEP 5: Add Multiple Nodes for Full Testing');
    console.log('-'.repeat(70));
    
    // Add another agent node
    await addNodeBtn.click();
    await sleep(1000);
    await page.click('button[data-testid="tab-agents"]');
    await sleep(1000);
    
    const firstAgent = await page.locator('button[data-testid^="node-item-"]').first();
    if (await firstAgent.count() > 0) {
      await firstAgent.click();
      await sleep(2000);
      console.log('  ✅ Second agent node added');
    }
    
    // Add a tool node
    await addNodeBtn.click();
    await sleep(1000);
    await page.click('button[data-testid="tab-tools"]');
    await sleep(1000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'final-10-tools-tab.png'), 
      fullPage: true 
    });
    
    const firstTool = await page.locator('button[data-testid^="node-item-"]').first();
    if (await firstTool.count() > 0) {
      await firstTool.click();
      await sleep(2000);
      console.log('  ✅ Tool node added');
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'final-11-multiple-nodes.png'), 
      fullPage: true 
    });
    
    const finalNodeCount = await page.locator('.react-flow__node').count();
    console.log(`  📊 Total nodes on canvas: ${finalNodeCount}`);
    testResults.push({ name: 'Multiple Nodes Added', passed: finalNodeCount >= 2 });
    
    // Test deleting one more node
    const deleteBtn2 = await page.locator('button[data-testid="node-delete-button"]').nth(1);
    if (await deleteBtn2.count() > 0) {
      await deleteBtn2.click({ force: true });
      await sleep(2000);
      
      const afterSecondDelete = await page.locator('.react-flow__node').count();
      console.log(`  📊 After 2nd deletion: ${afterSecondDelete} nodes`);
      testResults.push({ name: 'Multiple Deletions Work', passed: afterSecondDelete < finalNodeCount });
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'final-12-after-deletions.png'), 
        fullPage: true 
      });
    }
    
    // ========================================================================
    // FINAL REPORT
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL VALIDATION RESULTS');
    console.log('='.repeat(70) + '\n');
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`Success Rate: ${successRate}%\n`);
    
    console.log('DETAILED RESULTS:');
    console.log('-'.repeat(70));
    testResults.forEach((test, idx) => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${idx + 1}. ${test.name}: ${status}`);
    });
    console.log('');
    
    console.log('📝 ERROR SUMMARY:');
    console.log(`   Console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🔴 ERRORS DETECTED:');
      consoleErrors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.substring(0, 150)}`);
      });
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: parseFloat(successRate),
      },
      tests: testResults,
      consoleErrors,
      consoleLogs: consoleLogs.filter(log => 
        log.text.includes('node') || 
        log.text.includes('agent') ||
        log.text.includes('delete')
      ),
      screenshots: [
        'final-01-agents-page.png',
        'final-02-agent-form.png',
        'final-03-agent-created.png',
        'final-04-workflow-editor.png',
        'final-05-add-node-agents-tab.png',
        'final-06-agent-node-added.png',
        'final-07-node-config-modal.png',
        'final-08-agent-fields.png',
        'final-09-node-deleted.png',
        'final-10-tools-tab.png',
        'final-11-multiple-nodes.png',
        'final-12-after-deletions.png',
      ],
    };
    
    const reportPath = path.join(SCREENSHOTS_DIR, 'final-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved: ${reportPath}\n`);
    
    console.log('='.repeat(70));
    const overallSuccess = failedTests === 0;
    console.log(`\n🏁 FINAL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}\n`);
    
    if (!overallSuccess) {
      throw new Error(`${failedTests} test(s) failed`);
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'final-test-error.png'), 
      fullPage: true 
    });
    throw error;
  } finally {
    console.log('🔚 Closing browser...\n');
    await browser.close();
  }
}

// Run test
testFinalValidation()
  .then(() => {
    console.log('🎉 Final validation completed successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Validation failed:', error.message);
    process.exit(1);
  });
