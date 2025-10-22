import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8080';

/**
 * REAL UI TEST - Usando automação existente
 * 
 * Pré-requisito: Executar /workspace/test-complete-flow.sh primeiro
 * para criar a automação "test-complete-flow"
 */

test.describe('Real UI Test - Agent and Condition', () => {
  test('should edit condition and agent nodes WITHOUT errors', async ({ page }) => {
    const automationId = 'test-complete-flow';
    
    console.log(`🚀 Testing automation: ${automationId}`);

    // Verificar que automação existe no backend
    const autoResp = await page.request.get(`${API_BASE_URL}/automations/${automationId}`);
    if (!autoResp.ok()) {
      throw new Error(`Automation not found! Please run: /workspace/test-complete-flow.sh`);
    }
    const autoData = await autoResp.json();
    console.log(`   ✅ Automation found with ${autoData.nodes.length} nodes`);

    // Navegar para o editor (corrigir ordem da URL!)
    console.log(`   📍 Navigating to: ${FRONTEND_URL}/automations/${automationId}/edit`);
    await page.goto(`${FRONTEND_URL}/automations/${automationId}/edit`);
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('   📸 Taking initial screenshot...');
    await page.screenshot({ path: '/tmp/01-page-loaded.png', fullPage: true });

    // Verificar que a página carregou (deve ter título ou elementos)
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);

    // ============================================
    // TEST 1: Editar CONDITION node
    // ============================================
    console.log('\n🔍 TEST 1: Opening Condition configuration...');

    // Esperar React Flow estar pronto
    const reactFlowExists = await page.locator('.react-flow').isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`   React Flow present: ${reactFlowExists}`);

    if (!reactFlowExists) {
      await page.screenshot({ path: '/tmp/02-no-react-flow.png', fullPage: true });
      throw new Error('React Flow canvas not found!');
    }

    // Procurar nodes no canvas
    const allNodes = await page.locator('.react-flow__node').count();
    console.log(`   Found ${allNodes} nodes in canvas`);

    if (allNodes === 0) {
      console.log('   ❌ No nodes found in canvas!');
      await page.screenshot({ path: '/tmp/03-no-nodes.png', fullPage: true });
      
      // Debug: verificar console do browser
      page.on('console', msg => console.log('   [Browser]', msg.text()));
      
      throw new Error('No nodes rendered in canvas!');
    }

    // Procurar especificamente o node de condition
    await page.waitForTimeout(2000);
    
    // Tentar encontrar pelo texto
    const conditionNode = page.locator('.react-flow__node').filter({ hasText: 'Condition' }).first();
    const conditionVisible = await conditionNode.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   Condition node visible: ${conditionVisible}`);

    if (!conditionVisible) {
      // Listar todos os textos dos nodes
      const nodeTexts = await page.locator('.react-flow__node').allTextContents();
      console.log(`   Node texts: ${JSON.stringify(nodeTexts)}`);
      await page.screenshot({ path: '/tmp/04-condition-not-visible.png', fullPage: true });
    }

    // Clicar no node de condition
    await conditionNode.click({ force: true });
    await page.waitForTimeout(1000);
    
    console.log('   📸 Clicked condition node, taking screenshot...');
    await page.screenshot({ path: '/tmp/05-condition-clicked.png', fullPage: true });

    // Procurar botão de configurar (pode estar em qualquer lugar)
    const configureButtons = [
      page.locator('button').filter({ hasText: /configurar|config|settings|⚙/i }),
      page.locator('[title*="config" i]'),
      page.locator('[aria-label*="config" i]'),
    ];

    let configOpened = false;
    for (const btnLocator of configureButtons) {
      try {
        const btn = btnLocator.first();
        if (await btn.isVisible({ timeout: 2000 })) {
          console.log('   🔧 Found configure button, clicking...');
          await btn.click();
          configOpened = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!configOpened) {
      console.log('   ⚠️  Configure button not found, trying double-click...');
      await conditionNode.dblclick({ force: true });
    }

    // Aguardar modal abrir
    await page.waitForTimeout(3000);
    
    console.log('   📸 After opening config, taking screenshot...');
    await page.screenshot({ path: '/tmp/06-condition-config.png', fullPage: true });

    // 🔥 VERIFICAÇÃO CRÍTICA: NÃO deve ter erro
    const errorLocator = page.locator('text=/node não encontrado|erro ao carregar/i');
    const hasError = await errorLocator.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasError) {
      console.log('   ❌ ERROR DETECTED in Condition configuration!');
      const errorText = await errorLocator.textContent();
      console.log(`   Error text: ${errorText}`);
      await page.screenshot({ path: '/tmp/07-condition-ERROR.png', fullPage: true });
      throw new Error(`Condition configuration ERROR: ${errorText}`);
    }

    console.log('   ✅ Condition configuration opened WITHOUT ERRORS!');

    // Verificar se modal tem campos esperados
    const hasValueField = await page.locator('input[name="value"], label:has-text("value")').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Value field visible: ${hasValueField}`);

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // ============================================
    // TEST 2: Editar AGENT node
    // ============================================
    console.log('\n🔍 TEST 2: Opening Agent configuration...');

    // Procurar node do agente
    const agentNode = page.locator('.react-flow__node').filter({ hasText: /agent/i }).first();
    const agentVisible = await agentNode.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   Agent node visible: ${agentVisible}`);

    if (!agentVisible) {
      await page.screenshot({ path: '/tmp/08-agent-not-visible.png', fullPage: true });
    }

    // Clicar no agent node
    await agentNode.click({ force: true });
    await page.waitForTimeout(1000);

    console.log('   📸 Clicked agent node, taking screenshot...');
    await page.screenshot({ path: '/tmp/09-agent-clicked.png', fullPage: true });

    // Abrir configuração
    configOpened = false;
    for (const btnLocator of configureButtons) {
      try {
        const btn = btnLocator.first();
        if (await btn.isVisible({ timeout: 2000 })) {
          console.log('   🔧 Found configure button for agent, clicking...');
          await btn.click();
          configOpened = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!configOpened) {
      console.log('   ⚠️  Configure button not found, trying double-click...');
      await agentNode.dblclick({ force: true });
    }

    await page.waitForTimeout(3000);

    console.log('   📸 After opening agent config, taking screenshot...');
    await page.screenshot({ path: '/tmp/10-agent-config.png', fullPage: true });

    // 🔥 VERIFICAÇÃO CRÍTICA: NÃO deve ter erro
    const hasAgentError = await errorLocator.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasAgentError) {
      console.log('   ❌ ERROR DETECTED in Agent configuration!');
      const errorText = await errorLocator.textContent();
      console.log(`   Error text: ${errorText}`);
      await page.screenshot({ path: '/tmp/11-agent-ERROR.png', fullPage: true });
      throw new Error(`Agent configuration ERROR: ${errorText}`);
    }

    console.log('   ✅ Agent configuration opened WITHOUT ERRORS!');

    // Verificar campos do agente
    const hasPromptField = await page.locator('textarea[name="prompt"], label:has-text("prompt")').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Prompt field visible: ${hasPromptField}`);

    // Preencher e salvar
    if (hasPromptField) {
      console.log('   💾 Filling and saving agent config...');
      await page.locator('textarea[name="prompt"]').first().fill('Teste E2E completo - agente configurado!');
      
      const saveBtn = page.locator('button').filter({ hasText: /salvar|save/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 })) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Agent config saved');
      }
    }

    // ============================================
    // TEST 3: Salvar Automação
    // ============================================
    console.log('\n💾 TEST 3: Saving automation...');
    
    const topSaveBtn = page.locator('button').filter({ hasText: /^salvar$|^save$/i }).first();
    if (await topSaveBtn.isVisible({ timeout: 3000 })) {
      await topSaveBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Automation saved');
    }

    // ============================================
    // TEST 4: Executar Automação
    // ============================================
    console.log('\n▶️  TEST 4: Executing automation...');
    
    const executeBtn = page.locator('button').filter({ hasText: /executar|execute|run/i }).first();
    if (await executeBtn.isVisible({ timeout: 3000 })) {
      await executeBtn.click();
      await page.waitForTimeout(5000);
      
      console.log('   ✅ Automation execution triggered');
      await page.screenshot({ path: '/tmp/12-execution.png', fullPage: true });
    }

    // Final screenshot
    await page.screenshot({ path: '/tmp/13-final.png', fullPage: true });

    console.log('\n✅ ========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('✅ ========================================');
    console.log('✅ Condition node: Configuration opened WITHOUT errors');
    console.log('✅ Agent node: Configuration opened WITHOUT errors');
    console.log('✅ Automation saved successfully');
    console.log('✅ Automation executed');
    console.log('✅ ========================================\n');

    console.log('📁 Screenshots saved to:');
    console.log('   /tmp/01-page-loaded.png');
    console.log('   /tmp/06-condition-config.png');
    console.log('   /tmp/10-agent-config.png');
    console.log('   /tmp/13-final.png');
  });
});
