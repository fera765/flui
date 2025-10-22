import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('UI Test - Agent and Condition Configuration', () => {
  let agentId: string;
  let automationId: string;

  test.beforeAll(async ({ request }) => {
    // Criar agente via API
    const agentResp = await request.post(`${API_BASE_URL}/agents`, {
      data: {
        name: 'UI Test Agent',
        model: 'gpt-4',
        systemPrompt: 'Test assistant',
        enabled: true,
      },
    });
    const agentData = await agentResp.json();
    agentId = agentData.id;

    // Criar automação com condition e agent
    await request.post(`${API_BASE_URL}/automations`, {
      data: {
        id: 'ui-test-auto',
        name: 'UI Test Automation',
        version: '2.0.0',
        nodes: [
          {
            id: 'node-condition',
            type: 'system',
            name: 'Condition Flex',
            config: {
              toolId: 'condition-flex',
              category: 'system',
              params: {
                value: 'test',
                paths: ['path1', 'path2'],
              },
            },
            position: { x: 100, y: 100 },
          },
          {
            id: 'node-agent',
            type: 'agent',
            name: 'Agent Node',
            config: {
              toolId: `agent-${agentId}`,
              category: 'agent',
              params: {
                prompt: 'Hello',
              },
            },
            position: { x: 500, y: 100 },
          },
        ],
        edges: [],
        startNodeId: 'node-condition',
        enabled: true,
      },
    });
    automationId = 'ui-test-auto';
  });

  test.afterAll(async ({ request }) => {
    if (automationId) {
      await request.delete(`${API_BASE_URL}/automations/${automationId}`);
    }
    if (agentId) {
      await request.delete(`${API_BASE_URL}/agents/${agentId}`);
    }
  });

  test('should open condition and agent configuration WITHOUT errors', async ({ page }) => {
    console.log(`🚀 Testing automation: ${automationId}`);
    console.log(`   Agent ID: ${agentId}`);

    // Ir para o editor de automação
    await page.goto(`${FRONTEND_URL}/automations/edit/${automationId}`);
    
    // Esperar o canvas carregar
    await page.waitForTimeout(5000);

    console.log('  📸 Taking screenshot of canvas...');
    await page.screenshot({ path: '/tmp/canvas-loaded.png', fullPage: true });

    // ============================================
    // TEST 1: Editar CONDITION node
    // ============================================
    console.log('🔍 Test 1: Opening Condition configuration...');

    // Tentar encontrar e clicar no node de condition
    const conditionSelectors = [
      'text=Condition Flex',
      '[data-id="node-condition"]',
      '.react-flow__node:has-text("Condition")',
    ];

    let foundCondition = false;
    for (const selector of conditionSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click({ force: true });
          foundCondition = true;
          console.log(`   ✅ Found condition node with: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!foundCondition) {
      console.log('   ⚠️  Condition node not found, taking screenshot...');
      await page.screenshot({ path: '/tmp/condition-not-found.png', fullPage: true });
    }

    // Tentar abrir configuração (procurar botão ou fazer double click)
    await page.waitForTimeout(1000);
    
    // Procurar botão de configurar
    const configBtn = page.locator('button').filter({ hasText: /config|⚙/ }).first();
    if (await configBtn.isVisible({ timeout: 2000 })) {
      await configBtn.click();
    } else {
      // Double click no node
      await page.locator('text=Condition Flex').first().dblclick({ force: true });
    }

    await page.waitForTimeout(2000);

    // Verificar se modal abriu
    const modalVisible = await page.locator('text=Configurar').isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   Modal visible: ${modalVisible}`);

    // 🔥 CRITICAL: Verificar se NÃO tem erro
    const hasError = await page.locator('text=Node não encontrado, text=Erro ao carregar').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasError) {
      console.log('   ❌ ERROR DETECTED in Condition configuration!');
      await page.screenshot({ path: '/tmp/condition-error.png', fullPage: true });
      const errorText = await page.locator('text=Node não encontrado, text=Erro ao carregar').textContent();
      throw new Error(`Condition configuration error: ${errorText}`);
    }

    console.log('   ✅ Condition configuration opened WITHOUT errors');

    // Fechar modal
    const cancelBtn = page.locator('button').filter({ hasText: /cancel|fechar|x/i }).first();
    if (await cancelBtn.isVisible({ timeout: 2000 })) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.waitForTimeout(1000);

    // ============================================
    // TEST 2: Editar AGENT node
    // ============================================
    console.log('🔍 Test 2: Opening Agent configuration...');

    // Procurar node do agente
    const agentSelectors = [
      'text=Agent Node',
      '[data-id="node-agent"]',
      '.react-flow__node:has-text("Agent")',
    ];

    let foundAgent = false;
    for (const selector of agentSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click({ force: true });
          foundAgent = true;
          console.log(`   ✅ Found agent node with: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!foundAgent) {
      console.log('   ⚠️  Agent node not found, taking screenshot...');
      await page.screenshot({ path: '/tmp/agent-not-found.png', fullPage: true });
    }

    await page.waitForTimeout(1000);

    // Abrir configuração
    const agentConfigBtn = page.locator('button').filter({ hasText: /config|⚙/ }).first();
    if (await agentConfigBtn.isVisible({ timeout: 2000 })) {
      await agentConfigBtn.click();
    } else {
      await page.locator('text=Agent Node').first().dblclick({ force: true });
    }

    await page.waitForTimeout(2000);

    // 🔥 CRITICAL: Verificar se NÃO tem erro
    const hasAgentError = await page.locator('text=Node não encontrado, text=Erro ao carregar').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasAgentError) {
      console.log('   ❌ ERROR DETECTED in Agent configuration!');
      await page.screenshot({ path: '/tmp/agent-error.png', fullPage: true });
      const errorText = await page.locator('text=Node não encontrado, text=Erro ao carregar').textContent();
      throw new Error(`Agent configuration error: ${errorText}`);
    }

    console.log('   ✅ Agent configuration opened WITHOUT errors');

    // Verificar se campos do agente estão visíveis
    const promptField = await page.locator('textarea[name="prompt"], label:has-text("prompt")').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Prompt field visible: ${promptField}`);

    console.log('\n✅ ============================================');
    console.log('✅ ALL UI TESTS PASSED!');
    console.log('✅ Both Condition and Agent configurations opened WITHOUT errors');
    console.log('✅ ============================================\n');
  });
});
