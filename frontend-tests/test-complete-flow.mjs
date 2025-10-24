/**
 * TESTE E2E COMPLETO - FLUXO REAL
 * Cria Agent, Importa MCP, Cria Automation
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

async function testCompleteFlow() {
  console.log('🎭 TESTE E2E - FLUXO COMPLETO\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    // ========== TEST 1: VERIFICAR DASHBOARD INICIAL ==========
    console.log('📊 TEST 1: Dashboard - Verificar contadores REAIS');
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(3000);
    
    const dashboardText = await page.textContent('body');
    console.log('  Dashboard carregou:', dashboardText?.includes('Dashboard') ? '✅' : '❌');
    
    // Verificar se mostra 4 tools (existem 4 na API)
    const toolsCount = await page.locator('text=Tools').locator('..').locator('p').textContent();
    console.log(`  Tools count no dashboard: ${toolsCount}`);
    console.log(`  Deveria mostrar 4 tools: ${toolsCount === '4' ? '✅' : '❌ FALHOU'}`);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-01-dashboard-initial.png'), fullPage: true });
    
    // ========== TEST 2: CRIAR UM AGENT ==========
    console.log('\n🤖 TEST 2: Criar um Agent');
    await page.click('a[href="/agents"]');
    await page.waitForTimeout(2000);
    
    const hasNewAgentBtn = await page.locator('button:has-text("New Agent")').count() > 0;
    console.log(`  Botão "New Agent" existe: ${hasNewAgentBtn ? '✅' : '❌'}`);
    
    if (hasNewAgentBtn) {
      await page.click('button:has-text("New Agent")');
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-02-agent-modal-open.png'), fullPage: true });
      
      // Preencher formulário
      await page.fill('input[name="name"]', 'Test Agent E2E');
      await page.fill('input[name="description"]', 'Agent criado via teste automatizado');
      await page.fill('textarea[name="systemPrompt"]', 'Você é um assistente de testes');
      
      // Selecionar modelo
      await page.selectOption('select[name="model"]', 'gpt-3.5-turbo');
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-03-agent-form-filled.png'), fullPage: true });
      
      // Click em Tools tab
      await page.click('button:has-text("Tools & MCPs")');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-04-agent-tools-tab.png'), fullPage: true });
      
      // Tentar criar
      await page.click('button[type="submit"]:has-text("Create")');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-05-agent-created.png'), fullPage: true });
      
      // Verificar se toast apareceu
      const pageContent = await page.textContent('body');
      const agentCreated = pageContent?.includes('Test Agent E2E') || pageContent?.includes('created successfully');
      console.log(`  Agent foi criado: ${agentCreated ? '✅' : '❌ NÃO CONFIRMADO'}`);
    }
    
    // ========== TEST 3: IMPORTAR MCP ==========
    console.log('\n🧩 TEST 3: Importar MCP');
    await page.click('a[href="/mcps"]');
    await page.waitForTimeout(2000);
    
    const hasImportBtn = await page.locator('button:has-text("Import")').count() > 0;
    console.log(`  Botão "Import MCP" existe: ${hasImportBtn ? '✅' : '❌'}`);
    
    if (hasImportBtn) {
      await page.click('button:has-text("Import")');
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-06-mcp-import-modal.png'), fullPage: true });
      
      // Selecionar NPM
      const npmButtons = await page.locator('button:has-text("NPM")').all();
      if (npmButtons.length > 0) {
        await npmButtons[0].click();
        await page.waitForTimeout(500);
      }
      
      // Preencher package
      await page.fill('input[name="package"]', 'chalk');
      await page.fill('input[name="version"]', '4.1.2');
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-07-mcp-form-filled.png'), fullPage: true });
      
      // Import
      await page.click('button[type="submit"]:has-text("Import")');
      console.log('  Import iniciado, aguardando...');
      await page.waitForTimeout(15000); // MCP import pode demorar
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-08-mcp-importing.png'), fullPage: true });
      
      // Verificar se apareceu na lista
      await page.waitForTimeout(3000);
      const mcpsList = await page.textContent('body');
      const mcpImported = mcpsList?.includes('chalk') || mcpsList?.includes('imported');
      console.log(`  MCP chalk foi importado: ${mcpImported ? '✅' : '❌ NÃO CONFIRMADO'}`);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-09-mcp-list.png'), fullPage: true });
    }
    
    // ========== TEST 4: CRIAR AUTOMATION ==========
    console.log('\n🔄 TEST 4: Criar Automation');
    await page.click('a[href="/automations"]');
    await page.waitForTimeout(2000);
    
    const hasNewAutoBtn = await page.locator('button:has-text("New Automation")').count() > 0;
    console.log(`  Botão "New Automation" existe: ${hasNewAutoBtn ? '✅' : '❌'}`);
    
    let reactFlowExists = false;
    if (hasNewAutoBtn) {
      await page.click('button:has-text("New Automation")');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-10-workflow-editor.png'), fullPage: true });
      
      // Verificar React Flow
      reactFlowExists = await page.locator('.react-flow').count() > 0;
      console.log(`  React Flow canvas existe: ${reactFlowExists ? '✅' : '❌'}`);
      
      // Tentar adicionar um nó
      const addNodeBtn = await page.locator('button:has-text("Tool")').count() > 0;
      console.log(`  Botão "Add Tool" existe: ${addNodeBtn ? '✅' : '❌'}`);
      
      if (addNodeBtn) {
        await page.click('button:has-text("Tool")');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-11-node-added.png'), fullPage: true });
      }
    }
    
    // ========== TEST 5: VERIFICAR DADOS FINAIS ==========
    console.log('\n📊 TEST 5: Verificar Dados Finais via API');
    
    const finalData = await page.evaluate(async () => {
      const [agents, mcps, tools, automations] = await Promise.all([
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/mcps').then(r => r.json()),
        fetch('/api/tools').then(r => r.json()),
        fetch('/api/automations').then(r => r.json()),
      ]);
      return { agents, mcps, tools, automations };
    });
    
    console.log(`  Agents: ${finalData.agents.length} (esperado: >= 1)`);
    console.log(`  MCPs: ${finalData.mcps.length} (esperado: >= 1)`);
    console.log(`  Tools: ${finalData.tools.length} (esperado: 4)`);
    console.log(`  Automations: ${finalData.automations.length} (esperado: >= 0)`);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-12-final-state.png'), fullPage: true });
    
    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL - SEM MENTIRAS!');
    console.log('='.repeat(60));
    console.log(`Dashboard mostra tools: ${toolsCount === '4' ? '✅ SIM' : '❌ NÃO (mostra ' + toolsCount + ')'}`);
    console.log(`Agent foi criado: ${finalData.agents.length > 0 ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`MCP foi importado: ${finalData.mcps.length > 0 ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`React Flow funciona: ${reactFlowExists ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Erros no console: ${errors.length > 0 ? '❌ SIM (' + errors.length + ')' : '✅ NÃO'}`);
    console.log('='.repeat(60));
    
    if (errors.length > 0) {
      console.log('\n🔴 ERROS ENCONTRADOS:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      testsCompleted: true,
      results: {
        dashboardShowsCorrectTools: toolsCount === '4',
        agentCreated: finalData.agents.length > 0,
        mcpImported: finalData.mcps.length > 0,
        workflowEditorWorks: reactFlowExists,
        finalData,
        errors
      }
    };
    
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'complete-flow-report.json'),
      JSON.stringify(report, null, 2)
    );
    
  } catch (error) {
    console.error('\n❌ TESTE FALHOU:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'flow-error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

testCompleteFlow()
  .then(() => {
    console.log('\n✅ Fluxo completo testado!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha no teste:', error);
    process.exit(1);
  });
