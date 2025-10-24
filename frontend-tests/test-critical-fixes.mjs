/**
 * Test: Critical Fixes Validation
 * 
 * Foca nos 3 fixes críticos:
 * 1. Deleção de nós
 * 2. Modelos dinâmicos
 * 3. MCP tools individualmente
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

async function testCriticalFixes() {
  console.log('🎭 Playwright Test: Critical Fixes\n');
  console.log('='.repeat(70));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const testResults = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Syncing nodes from store')) {
      console.log(`  📝 ${text}`);
    }
  });
  
  try {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // ========================================================================
    // FIX 1: Deleção de Nós
    // ========================================================================
    console.log('\n📍 FIX 1: Node Deletion');
    console.log('-'.repeat(70));
    
    await page.goto(`${FRONTEND_URL}/automations`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    await page.click('button:has-text("New Automation")');
    await sleep(3000);
    
    // Add 3 nodes
    for (let i = 1; i <= 3; i++) {
      await page.keyboard.press('Escape');
      await sleep(300);
      
      const addBtn = await page.locator('button[data-testid="add-node-button"]');
      await addBtn.click({ force: true });
      await sleep(800);
      
      const firstItem = await page.locator('button[data-testid^="node-item-"]').first();
      await firstItem.click({ force: true });
      await sleep(1200);
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'critical-01-nodes-added.png'), 
      fullPage: true 
    });
    
    const nodesStart = await page.locator('.react-flow__node').count();
    console.log(`  📊 Nodes added: ${nodesStart}`);
    
    // Delete 1 node via keyboard
    const node = await page.locator('.react-flow__node').first();
    await node.click({ force: true });
    await sleep(400);
    await page.keyboard.press('Delete');
    await sleep(2000);
    
    const nodesAfter1 = await page.locator('.react-flow__node').count();
    const deletion1Works = nodesAfter1 < nodesStart;
    
    console.log(`  📊 After 1st delete: ${nodesAfter1} (was ${nodesStart})`);
    console.log(`  ${deletion1Works ? '✅' : '❌'} Delete #1: ${deletion1Works ? 'WORKS' : 'FAILED'}`);
    
    // Delete another
    const node2 = await page.locator('.react-flow__node').first();
    await node2.click({ force: true });
    await sleep(400);
    await page.keyboard.press('Delete');
    await sleep(2000);
    
    const nodesAfter2 = await page.locator('.react-flow__node').count();
    const deletion2Works = nodesAfter2 < nodesAfter1;
    
    console.log(`  📊 After 2nd delete: ${nodesAfter2} (was ${nodesAfter1})`);
    console.log(`  ${deletion2Works ? '✅' : '❌'} Delete #2: ${deletion2Works ? 'WORKS' : 'FAILED'}`);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'critical-01-nodes-deleted.png'), 
      fullPage: true 
    });
    
    testResults.push({ 
      name: 'Node Deletion Works', 
      passed: deletion1Works && deletion2Works 
    });
    
    // ========================================================================
    // FIX 2: Modelos Dinâmicos
    // ========================================================================
    console.log('\n📍 FIX 2: Dynamic Models in AgentModal');
    console.log('-'.repeat(70));
    
    await page.goto(`${FRONTEND_URL}/agents`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    const newAgentBtn = await page.locator('button:has-text("New Agent")');
    await newAgentBtn.click();
    await sleep(2000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'critical-02-agent-modal.png'), 
      fullPage: true 
    });
    
    const modelSelect = await page.locator('select').first();
    const modelOptions = await modelSelect.locator('option').count();
    
    console.log(`  📊 Model options: ${modelOptions}`);
    
    // Get option texts
    const options = await modelSelect.locator('option').allTextContents();
    console.log(`  📊 Models: ${options.slice(0, 3).join(', ')}...`);
    
    const hasDynamicModels = modelOptions > 1;
    console.log(`  ${hasDynamicModels ? '✅' : '❌'} Dynamic models loaded: ${hasDynamicModels ? 'YES' : 'NO'}`);
    
    testResults.push({ name: 'Dynamic Models Loaded', passed: hasDynamicModels });
    
    await page.keyboard.press('Escape');
    await sleep(1000);
    
    // ========================================================================
    // FIX 3: MCP Tools Listed
    // ========================================================================
    console.log('\n📍 FIX 3: MCP Tools Listed Individually');
    console.log('-'.repeat(70));
    
    await page.goto(`${FRONTEND_URL}/automations`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    const firstWorkflow = await page.locator('button:has-text("Open")').first();
    if (await firstWorkflow.count() > 0) {
      await firstWorkflow.click();
      await sleep(3000);
    }
    
    await page.keyboard.press('Escape');
    await sleep(500);
    
    const addBtn = await page.locator('button[data-testid="add-node-button"]');
    await addBtn.click({ force: true });
    await sleep(1000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'critical-03-add-modal.png'), 
      fullPage: true 
    });
    
    // Check MCPs tab
    await page.click('button[data-testid="tab-mcps"]');
    await sleep(1000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'critical-03-mcps-tab.png'), 
      fullPage: true 
    });
    
    const tabText = await page.locator('button[data-testid="tab-mcps"]').textContent();
    const showsToolsLabel = tabText.includes('MCP Tools') || tabText.includes('Tools');
    
    console.log(`  📊 Tab label: ${tabText}`);
    console.log(`  ${showsToolsLabel ? '✅' : '❌'} Shows "MCP Tools": ${showsToolsLabel ? 'YES' : 'NO'}`);
    
    testResults.push({ name: 'MCP Tools Tab Renamed', passed: showsToolsLabel });
    
    // ========================================================================
    // FINAL REPORT
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 CRITICAL FIXES RESULTS');
    console.log('='.repeat(70) + '\n');
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`Success Rate: ${successRate}%\n`);
    
    testResults.forEach((test, idx) => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${idx + 1}. ${test.name}: ${status}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`\n🏁 RESULT: ${failedTests === 0 ? '✅ ALL CRITICAL FIXES VALIDATED' : '⚠️  SOME FAILED'}\n`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'critical-error.png'), 
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

testCriticalFixes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
