/**
 * TESTE PLAYWRIGHT - CONFIG PERSISTENCE
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

async function testConfigPersistence() {
  console.log('🎭 TESTE - CONFIG PERSISTENCE\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  let automationId = null;
  const testName = 'My Configured Node';
  const testDescription = 'Node with persisted config';
  
  try {
    console.log('📊 STEP 1: Nova automação');
    await page.goto(`${FRONTEND_URL}/automations/new`);
    await page.waitForTimeout(2000);
    
    console.log('📊 STEP 2: Adicionar nó');
    await page.click('[data-testid="add-node-button"]');
    await page.waitForTimeout(1500);
    await page.click('[data-testid="tab-tools"]');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="nodes-list"] button').first().click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'persist-01-node-added.png'), fullPage: true });
    
    console.log('📊 STEP 3: Configurar nó');
    await page.click('button:has-text("Config")');
    await page.waitForTimeout(2000);
    
    await page.fill('[data-testid="node-name-input"]', testName);
    await page.fill('[data-testid="node-description-input"]', testDescription);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'persist-02-config-edited.png'), fullPage: true });
    
    await page.click('[data-testid="save-node-config"]');
    await page.waitForTimeout(1500);
    console.log('  ✅ Config salva');
    
    console.log('📊 STEP 4: Salvar automação');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const urlMatch = currentUrl.match(/\/automations\/([^\/]+)\/edit/);
    if (urlMatch) {
      automationId = urlMatch[1];
      console.log(`  ✅ Automação: ${automationId}`);
    }
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'persist-03-saved.png'), fullPage: true });
    
    console.log('📊 STEP 5: Verificar backend');
    const response = await fetch(`http://localhost:3001/api/automations`);
    const automations = await response.json();
    const saved = automations.find(a => a.id === automationId);
    
    if (saved && saved.nodes.length > 0) {
      const node = saved.nodes[0];
      console.log(`  Nome backend: "${node.name}"`);
      console.log(`  Desc backend: "${node.description}"`);
      
      const nameOk = node.name === testName;
      const descOk = node.description === testDescription;
      
      console.log(`\n  📊 BACKEND:`);
      console.log(`  Nome: ${nameOk ? '✅' : '❌'}`);
      console.log(`  Desc: ${descOk ? '✅' : '❌'}`);
      
      if (nameOk && descOk) {
        console.log('\n  🎉 SUCESSO! Config persistiu no backend!');
      }
    }
    
    console.log('\n📊 STEP 6: Reabrir config');
    await page.click('button:has-text("Config")');
    await page.waitForTimeout(2000);
    
    const reopenName = await page.inputValue('[data-testid="node-name-input"]');
    const reopenDesc = await page.inputValue('[data-testid="node-description-input"]');
    
    console.log(`  Nome UI: "${reopenName}"`);
    console.log(`  Desc UI: "${reopenDesc}"`);
    
    const uiNameOk = reopenName === testName;
    const uiDescOk = reopenDesc === testDescription;
    
    console.log(`\n  📊 UI:`);
    console.log(`  Nome: ${uiNameOk ? '✅' : '❌'}`);
    console.log(`  Desc: ${uiDescOk ? '✅' : '❌'}`);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'persist-04-reopened.png'), fullPage: true });
    
    const backendOk = saved?.nodes[0]?.name === testName;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADO FINAL');
    console.log('='.repeat(50));
    console.log(`Backend: ${backendOk ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`UI: ${uiNameOk ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log('='.repeat(50));
    
    const logs = consoleLogs.filter(log => 
      log.includes('WorkflowStore') || 
      log.includes('Saving') ||
      log.includes('Loading')
    );
    
    if (logs.length > 0) {
      console.log('\n📝 LOGS:');
      logs.forEach(log => console.log(`  ${log}`));
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'persist-error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

testConfigPersistence()
  .then(() => {
    console.log('\n✅ Teste concluído!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha:', error);
    process.exit(1);
  });
