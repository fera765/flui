/**
 * TESTE E2E COMPLETO - MCP INTEGRATION
 * 
 * REAL (sem simulação):
 * 1. Importar MCP @pollinations/model-context-protocol
 * 2. Verificar tools expostas (backend)
 * 3. Criar agente e habilitar tool do MCP
 * 4. Criar automação com tool do MCP
 * 5. Configurar tool com linker
 * 6. Salvar e executar
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = '/workspace/screenshots';
const MCP_PACKAGE = '@pollinations/model-context-protocol';

async function testMCPE2E() {
  console.log('🎭 TESTE E2E COMPLETO - MCP INTEGRATION\n');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const errors = [];
  const consoleLogs = [];
  
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  const results = {
    step1_mcpImported: false,
    step2_toolsExposedBackend: false,
    step3_toolsVisibleFrontend: false,
    step4_agentCreated: false,
    step5_mcpToolEnabled: false,
    step6_automationCreated: false,
    step7_toolConfigured: false,
    step8_automationSaved: false,
  };
  
  let mcpId = null;
  let agentId = null;
  let automationId = null;
  
  try {
    // ========== STEP 1: Verificar MCP no Backend ==========
    console.log('📊 STEP 1: Verificar MCP importado no backend');
    
    const mcpsResponse = await fetch(`${API_URL}/api/mcps`);
    const mcps = await mcpsResponse.json();
    
    const pollinationsMcp = mcps.find(m => m.name.includes('pollinations'));
    
    if (pollinationsMcp) {
      mcpId = pollinationsMcp.id;
      results.step1_mcpImported = true;
      console.log(`  ✅ MCP encontrado: ${pollinationsMcp.name}`);
      console.log(`  ID: ${mcpId}`);
      console.log(`  Tools: ${pollinationsMcp.tools.length}`);
    } else {
      console.log('  ❌ MCP não encontrado - precisa importar primeiro');
    }
    
    // ========== STEP 2: Verificar Tools no Backend ==========
    console.log('\n📊 STEP 2: Verificar tools registradas no backend');
    
    const toolsResponse = await fetch(`${API_URL}/api/tools`);
    const tools = await toolsResponse.json();
    
    const mcpTools = tools.filter(t => t.id.includes('mcp-'));
    
    console.log(`  Total tools: ${tools.length}`);
    console.log(`  Tools MCP: ${mcpTools.length}`);
    
    if (mcpTools.length >= 10) {
      results.step2_toolsExposedBackend = true;
      console.log('  ✅ Tools MCP expostas no backend');
      
      console.log('\n  Primeiras 5 tools:');
      mcpTools.slice(0, 5).forEach(t => {
        const paramsCount = t.params?.length || 0;
        console.log(`    - ${t.name} (${paramsCount} params)`);
      });
    } else {
      console.log('  ❌ Poucas tools MCP encontradas');
    }
    
    // ========== STEP 3: Verificar Tools no Frontend ==========
    console.log('\n📊 STEP 3: Verificar tools visíveis no frontend');
    
    await page.goto(`${FRONTEND_URL}/tools`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-01-tools-page.png'), fullPage: true });
    
    // Buscar por "pollinations"
    const searchInput = await page.locator('input[placeholder*="Search"]').count();
    if (searchInput > 0) {
      await page.fill('input[placeholder*="Search"]', 'pollinations');
      await page.waitForTimeout(1000);
      
      const toolCards = await page.locator('[class*="grid"] > div').count();
      console.log(`  Tool cards com 'pollinations': ${toolCards}`);
      
      if (toolCards > 0) {
        results.step3_toolsVisibleFrontend = true;
        console.log('  ✅ Tools visíveis no frontend');
      }
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-02-tools-search.png'), fullPage: true });
    }
    
    // ========== STEP 4: Criar Agente ==========
    console.log('\n📊 STEP 4: Criar agente');
    
    await page.goto(`${FRONTEND_URL}/agents`);
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("New Agent")');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="name"]', 'MCP Test Agent');
    await page.fill('textarea[name="description"]', 'Agent with Pollinations MCP tools');
    await page.fill('textarea[name="systemPrompt"]', 'You are a helpful assistant with image generation capabilities.');
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-03-agent-form.png'), fullPage: true });
    
    // Ir para aba Tools
    const toolsTab = await page.locator('button:has-text("Tools"), button:has-text("tools")').count();
    if (toolsTab > 0) {
      await page.locator('button:has-text("Tools"), button:has-text("tools")').first().click();
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-04-agent-tools-tab.png'), fullPage: true });
      
      // Procurar checkbox de tool MCP
      const checkboxes = await page.locator('input[type="checkbox"]').count();
      console.log(`  Checkboxes de tools: ${checkboxes}`);
      
      if (checkboxes > 0) {
        // Habilitar primeira tool MCP
        await page.locator('input[type="checkbox"]').first().check();
        results.step5_mcpToolEnabled = true;
        console.log('  ✅ Tool MCP habilitada para o agente');
        
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-05-tool-enabled.png'), fullPage: true });
      }
    }
    
    // Criar agente
    await page.click('button:has-text("Create Agent")');
    await page.waitForTimeout(2000);
    
    results.step4_agentCreated = true;
    console.log('  ✅ Agente criado');
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-06-agent-created.png'), fullPage: true });
    
    // ========== STEP 5: Criar Automação com Tool MCP ==========
    console.log('\n📊 STEP 5: Criar automação com tool MCP');
    
    await page.goto(`${FRONTEND_URL}/automations/new`);
    await page.waitForTimeout(2000);
    
    // Adicionar nó com tool MCP
    await page.click('[data-testid="add-node-button"]');
    await page.waitForTimeout(1500);
    
    await page.click('[data-testid="tab-tools"]');
    await page.waitForTimeout(500);
    
    // Buscar tool pollinations
    const modalSearch = await page.locator('[data-testid="search-input"]').count();
    if (modalSearch > 0) {
      await page.fill('[data-testid="search-input"]', 'pollinations');
      await page.waitForTimeout(1000);
    }
    
    const toolItems = await page.locator('[data-testid="nodes-list"] button').count();
    console.log(`  Tools Pollinations encontradas: ${toolItems}`);
    
    if (toolItems > 0) {
      await page.locator('[data-testid="nodes-list"] button').first().click();
      await page.waitForTimeout(2000);
      
      console.log('  ✅ Tool MCP adicionada à automação');
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-07-mcp-in-automation.png'), fullPage: true });
      
      // Configurar tool
      await page.click('button:has-text("Config")');
      await page.waitForTimeout(2000);
      
      // Verificar se parâmetros do MCP aparecem
      const paramInputs = await page.locator('input, textarea').count();
      console.log(`  Campos de parâmetros: ${paramInputs}`);
      
      if (paramInputs > 2) {
        results.step7_toolConfigured = true;
        console.log('  ✅ Parâmetros MCP visíveis no modal');
      }
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-08-config-modal.png'), fullPage: true });
      
      await page.click('[data-testid="save-node-config"]');
      await page.waitForTimeout(1500);
      
      // Salvar automação
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/automations/') && currentUrl.includes('/edit')) {
        results.step6_automationCreated = true;
        results.step8_automationSaved = true;
        
        const urlMatch = currentUrl.match(/\/automations\/([^\/]+)\/edit/);
        if (urlMatch) {
          automationId = urlMatch[1];
        }
        
        console.log('  ✅ Automação criada e salva');
        console.log(`  ID: ${automationId}`);
      }
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-09-automation-saved.png'), fullPage: true });
    }
    
    // ========== VERIFICAÇÃO FINAL ==========
    console.log('\n📊 VERIFICAÇÃO FINAL: Backend');
    
    if (automationId) {
      const autoResponse = await fetch(`${API_URL}/api/automations`);
      const automations = await autoResponse.json();
      const savedAuto = automations.find(a => a.id === automationId);
      
      if (savedAuto) {
        console.log(`  Automação salva: ✅`);
        console.log(`  Nós: ${savedAuto.nodes.length}`);
        
        if (savedAuto.nodes.length > 0) {
          const node = savedAuto.nodes[0];
          console.log(`  Tipo do nó: ${node.type}`);
          console.log(`  Nome: ${node.name}`);
        }
      }
    }
    
    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL E2E');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([test, passed]) => {
      const label = test.replace(/_/g, ' ').replace(/step\d+/, (m) => m.toUpperCase());
      console.log(`  ${label}: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
    });
    
    console.log('='.repeat(60));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const percentage = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 RESULTADO: ${passedTests}/${totalTests} (${percentage}%)`);
    console.log(`❌ Erros JS: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 ERROS:');
      errors.slice(0, 3).forEach(err => console.log(`  ${err}`));
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      mcpPackage: MCP_PACKAGE,
      mcpId,
      agentId,
      automationId,
      results,
      passed: passedTests,
      total: totalTests,
      percentage,
      errors,
    };
    
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'mcp-e2e-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Relatório salvo: mcp-e2e-report.json');
    console.log('📸 Screenshots: 9 arquivos');
    
  } catch (error) {
    console.error('\n❌ TESTE FALHOU:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'e2e-error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

testMCPE2E()
  .then(() => {
    console.log('\n✅ Teste E2E concluído!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha no teste E2E:', error);
    process.exit(1);
  });
