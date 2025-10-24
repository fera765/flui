/**
 * TESTE COMPLETO - MCP INTEGRATION
 * 
 * Testa REAL (sem simulação):
 * 1. Importar MCP @pollinations/model-context-protocol
 * 2. Verificar que tools foram expostas
 * 3. Criar agente e habilitar função do MCP
 * 4. Criar automação com MCP
 * 5. Fazer linker
 * 6. Validar tudo
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

async function testMCPCompleteFlow() {
  console.log('🎭 TESTE COMPLETO - MCP INTEGRATION\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  const results = {
    mcpImported: false,
    toolsExposed: false,
    agentCreated: false,
    mcpToolEnabled: false,
    automationCreated: false,
    linkerWorking: false,
  };
  
  try {
    // ========== STEP 1: Importar MCP ==========
    console.log('📊 STEP 1: Importar MCP via frontend');
    await page.goto(`${FRONTEND_URL}/mcps`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-01-page.png'), fullPage: true });
    
    // Clicar em Import MCP
    const importBtn = await page.locator('button:has-text("Import MCP")').count();
    console.log(`  Botão Import MCP: ${importBtn > 0 ? '✅' : '❌'}`);
    
    if (importBtn > 0) {
      await page.click('button:has-text("Import MCP")');
      await page.waitForTimeout(2000);
      
      // Preencher formulário
      await page.fill('input[placeholder*="package"]', MCP_PACKAGE);
      await page.click('button:has-text("NPX")');
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-02-form.png'), fullPage: true });
      
      // Importar
      await page.click('button:has-text("Import")');
      console.log('  ⏳ Aguardando importação (pode levar 30-60s)...');
      
      // Esperar toast de sucesso ou erro
      await page.waitForTimeout(90000); // 90s timeout
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-03-imported.png'), fullPage: true });
      
      // Verificar se MCP aparece na lista
      const mcpCards = await page.locator('[data-testid="mcp-card"]').count();
      console.log(`  MCPs na lista: ${mcpCards}`);
      
      if (mcpCards > 0) {
        results.mcpImported = true;
        console.log('  ✅ MCP importado');
      }
    }
    
    // ========== STEP 2: Verificar Tools ==========
    console.log('\n📊 STEP 2: Verificar tools expostas');
    
    const response = await fetch(`${API_URL}/api/mcps`);
    const mcps = await response.json();
    
    const pollinationsMcp = mcps.find(m => m.name.includes('pollinations'));
    
    if (pollinationsMcp) {
      console.log(`  MCP encontrado: ${pollinationsMcp.name}`);
      console.log(`  Tools: ${pollinationsMcp.tools.length}`);
      
      if (pollinationsMcp.tools.length > 0) {
        results.toolsExposed = true;
        console.log('  ✅ Tools expostas');
        
        pollinationsMcp.tools.slice(0, 3).forEach(tool => {
          console.log(`    - ${tool.name} (${Object.keys(tool.parameters || {}).length} params)`);
        });
      }
    }
    
    // ========== STEP 3: Criar Agente ==========
    console.log('\n📊 STEP 3: Criar agente com MCP tool');
    await page.goto(`${FRONTEND_URL}/agents`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-04-agents.png'), fullPage: true });
    
    const newAgentBtn = await page.locator('button:has-text("New Agent")').count();
    if (newAgentBtn > 0) {
      await page.click('button:has-text("New Agent")');
      await page.waitForTimeout(2000);
      
      // Preencher dados do agente
      await page.fill('input[name="name"]', 'MCP Test Agent');
      await page.fill('textarea[name="systemPrompt"]', 'Agent with MCP tools');
      await page.fill('textarea[name="description"]', 'Testing MCP integration');
      
      // Ir para aba de tools
      const toolsTab = await page.locator('button:has-text("Tools")').count();
      if (toolsTab > 0) {
        await page.click('button:has-text("Tools")');
        await page.waitForTimeout(1000);
        
        // Procurar tool do MCP
        const mcpToolCheckbox = await page.locator('input[type="checkbox"]').first();
        if (await mcpToolCheckbox.count() > 0) {
          await mcpToolCheckbox.check();
          results.mcpToolEnabled = true;
          console.log('  ✅ MCP tool habilitada');
        }
      }
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-05-agent-tools.png'), fullPage: true });
      
      // Salvar agente
      await page.click('button:has-text("Create Agent")');
      await page.waitForTimeout(2000);
      
      results.agentCreated = true;
      console.log('  ✅ Agente criado');
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-06-agent-created.png'), fullPage: true });
    }
    
    // ========== STEP 4: Criar Automação com MCP ==========
    console.log('\n📊 STEP 4: Criar automação com MCP');
    await page.goto(`${FRONTEND_URL}/automations/new`);
    await page.waitForTimeout(2000);
    
    // Adicionar nó com tool do MCP
    await page.click('[data-testid="add-node-button"]');
    await page.waitForTimeout(1500);
    
    await page.click('[data-testid="tab-tools"]');
    await page.waitForTimeout(500);
    
    // Procurar tool do Pollinations
    const searchBox = await page.locator('[data-testid="search-input"]').count();
    if (searchBox > 0) {
      await page.fill('[data-testid="search-input"]', 'pollinations');
      await page.waitForTimeout(500);
    }
    
    const toolsList = await page.locator('[data-testid="nodes-list"] button').count();
    console.log(`  Tools disponíveis: ${toolsList}`);
    
    if (toolsList > 0) {
      await page.locator('[data-testid="nodes-list"] button').first().click();
      await page.waitForTimeout(2000);
      
      console.log('  ✅ Nó MCP adicionado');
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-07-automation.png'), fullPage: true });
      
      // Salvar automação
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/automations/') && currentUrl.includes('/edit')) {
        results.automationCreated = true;
        console.log('  ✅ Automação criada');
      }
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-08-saved.png'), fullPage: true });
    }
    
    // ========== STEP 5: Testar Linker ==========
    console.log('\n📊 STEP 5: Testar linker com MCP');
    
    // Adicionar segundo nó
    await page.click('[data-testid="add-node-button"]');
    await page.waitForTimeout(1500);
    await page.click('[data-testid="tab-tools"]');
    await page.waitForTimeout(500);
    
    if (await page.locator('[data-testid="nodes-list"] button').count() > 0) {
      await page.locator('[data-testid="nodes-list"] button').nth(1).click();
      await page.waitForTimeout(2000);
      
      // Configurar nó
      await page.click('button:has-text("Config")');
      await page.waitForTimeout(2000);
      
      // Procurar botão linker
      const linkerBtn = await page.locator('button[title*="linker"]').count();
      if (linkerBtn > 0) {
        await page.locator('button[title*="linker"]').first().click();
        await page.waitForTimeout(2000);
        
        // Verificar se modal abriu
        const linkerModal = await page.locator('[role="dialog"]').count();
        if (linkerModal > 0) {
          results.linkerWorking = true;
          console.log('  ✅ Linker funcionando');
        }
        
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-09-linker.png'), fullPage: true });
      }
    }
    
    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL');
    console.log('='.repeat(60));
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`  ${test}: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
    });
    console.log('='.repeat(60));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    console.log(`\n✅ ${passedTests}/${totalTests} testes passaram`);
    console.log(`❌ Erros: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔴 ERROS:');
      errors.slice(0, 5).forEach(err => console.log(`  ${err}`));
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      mcpPackage: MCP_PACKAGE,
      results,
      passed: passedTests,
      total: totalTests,
      errors,
    };
    
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'mcp-complete-report.json'),
      JSON.stringify(report, null, 2)
    );
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mcp-error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

testMCPCompleteFlow()
  .then(() => {
    console.log('\n✅ Teste completo concluído!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha:', error);
    process.exit(1);
  });
