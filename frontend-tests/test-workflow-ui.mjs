/**
 * TESTE PLAYWRIGHT - WORKFLOW UI IMPROVEMENTS
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

async function testWorkflowUI() {
  console.log('🎭 TESTE PLAYWRIGHT - WORKFLOW UI\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  const results = {
    addNodeButton: false,
    addNodeModal: false,
    searchWorks: false,
    tabsWork: false,
  };
  
  try {
    console.log('📊 TEST 1: Navegando para Workflow Editor');
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(2000);
    
    await page.click('a[href="/automations"]');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("New Automation")');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'workflow-01-editor.png'), fullPage: true });
    console.log('  ✅ Editor aberto');
    
    console.log('\n📊 TEST 2: Botão "Add Node"');
    const addNodeBtn = await page.locator('[data-testid="add-node-button"]').count();
    results.addNodeButton = addNodeBtn > 0;
    console.log(`  Botão existe: ${results.addNodeButton ? '✅' : '❌'}`);
    
    if (results.addNodeButton) {
      await page.click('[data-testid="add-node-button"]');
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'workflow-02-add-modal.png'), fullPage: true });
      
      results.addNodeModal = await page.locator('text=Add Node').count() > 0;
      console.log(`  Modal abriu: ${results.addNodeModal ? '✅' : '❌'}`);
      
      console.log('\n📊 TEST 3: Busca');
      results.searchWorks = await page.locator('[data-testid="add-node-search"]').count() > 0;
      console.log(`  Search input: ${results.searchWorks ? '✅' : '❌'}`);
      
      console.log('\n📊 TEST 4: Tabs');
      const tabTools = await page.locator('[data-testid="tab-tools"]').count();
      const tabAgents = await page.locator('[data-testid="tab-agents"]').count();
      const tabMCPs = await page.locator('[data-testid="tab-mcps"]').count();
      results.tabsWork = tabTools > 0 && tabAgents > 0 && tabMCPs > 0;
      console.log(`  Tabs: ${results.tabsWork ? '✅' : '❌'}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO');
    console.log('='.repeat(60));
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`  ${test}: ${passed ? '✅' : '❌'}`);
    });
    
    const passed = Object.values(results).filter(Boolean).length;
    console.log(`\n✅ ${passed}/${Object.keys(results).length} testes passaram`);
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'workflow-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testWorkflowUI().then(() => process.exit(0)).catch(() => process.exit(1));
