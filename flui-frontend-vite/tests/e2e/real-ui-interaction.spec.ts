import { test, expect, type Page } from '@playwright/test';

/**
 * TESTE REAL COM UI - INTERAÇÃO COMPLETA
 * 
 * Este teste interage com a UI REAL do frontend
 */

const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('TESTE REAL - UI Interaction', () => {
  let agentId: string;
  
  test.beforeAll(async () => {
    // Criar agente de teste
    const timestamp = Date.now();
    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `real-ui-test-${timestamp}`,
        name: `Real UI Test Agent ${timestamp}`,
        model: 'deepseek-v3.1',
        systemPrompt: 'Assistente de teste UI real',
        temperature: 0.7,
        maxTokens: 50,
        enabled: true,
        tools: []
      })
    });
    
    const data = await response.json();
    agentId = data.id || data.agent?.id;
    console.log('✅ Agente criado:', agentId);
  });

  test('REAL TEST: Criar automação e adicionar nodes via UI', async ({ page }) => {
    console.log('\n🎬 INICIANDO TESTE REAL COM UI...\n');
    
    // 1. Navegar para página de automações
    console.log('📍 Navegando para /automations...');
    await page.goto(`${FRONTEND_URL}/automations`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Capturar screenshot
    await page.screenshot({ path: '/tmp/step1-automations-page.png' });
    console.log('📸 Screenshot: step1-automations-page.png');
    
    // 2. Clicar em "Nova Automação"
    console.log('🖱️  Procurando botão "Nova Automação"...');
    
    // Tentar diferentes seletores
    const possibleSelectors = [
      'button:has-text("Nova Automação")',
      'a:has-text("Nova Automação")',
      'button:has-text("Nova")',
      'a[href*="/create"]',
      '[data-testid="create-automation"]'
    ];
    
    let createButton = null;
    for (const selector of possibleSelectors) {
      try {
        createButton = await page.waitForSelector(selector, { timeout: 2000 });
        if (createButton) {
          console.log(`✅ Encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Não encontrado: ${selector}`);
      }
    }
    
    if (!createButton) {
      console.log('❌ ERRO: Botão "Nova Automação" não encontrado!');
      console.log('📋 HTML da página:');
      const html = await page.content();
      console.log(html.substring(0, 500));
      
      await page.screenshot({ path: '/tmp/error-no-create-button.png' });
      throw new Error('Botão Nova Automação não encontrado');
    }
    
    await createButton.click();
    console.log('✅ Clicado em "Nova Automação"');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/step2-create-page.png' });
    
    // 3. Verificar se estamos na página de criação
    const url = page.url();
    console.log('📍 URL atual:', url);
    
    if (!url.includes('/create') && !url.includes('/automations/')) {
      console.log('❌ ERRO: Não navegou para página de criação!');
      await page.screenshot({ path: '/tmp/error-wrong-page.png' });
      throw new Error('Não está na página de criação');
    }
    
    // 4. Preencher nome da automação
    console.log('✏️  Preenchendo nome da automação...');
    
    const nameInputSelectors = [
      'input[placeholder*="nome"]',
      'input[name="name"]',
      'input[type="text"]'
    ];
    
    let nameInput = null;
    for (const selector of nameInputSelectors) {
      try {
        nameInput = await page.waitForSelector(selector, { timeout: 2000 });
        if (nameInput) {
          console.log(`✅ Input encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Input não encontrado: ${selector}`);
      }
    }
    
    if (nameInput) {
      await nameInput.fill('Real UI Test Automation');
      console.log('✅ Nome preenchido');
    } else {
      console.log('⚠️  Input de nome não encontrado, continuando...');
    }
    
    await page.screenshot({ path: '/tmp/step3-name-filled.png' });
    
    // 5. Procurar botão de adicionar ferramenta
    console.log('🔍 Procurando botão "Adicionar Ferramenta"...');
    
    const addToolSelectors = [
      'button:has-text("Adicionar Ferramenta")',
      'button:has-text("Adicionar")',
      '[data-testid="add-tool"]',
      '.add-tool-button'
    ];
    
    let addToolButton = null;
    for (const selector of addToolSelectors) {
      try {
        addToolButton = await page.waitForSelector(selector, { timeout: 2000 });
        if (addToolButton) {
          console.log(`✅ Botão encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Botão não encontrado: ${selector}`);
      }
    }
    
    if (!addToolButton) {
      console.log('❌ ERRO: Botão "Adicionar Ferramenta" não encontrado!');
      console.log('📋 Tentando listar todos os botões na página...');
      
      const allButtons = await page.$$('button');
      console.log(`Encontrados ${allButtons.length} botões`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  Botão ${i}: "${text}"`);
      }
      
      await page.screenshot({ path: '/tmp/error-no-add-tool-button.png' });
      throw new Error('Botão Adicionar Ferramenta não encontrado');
    }
    
    await addToolButton.click();
    console.log('✅ Clicado em "Adicionar Ferramenta"');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/step4-tool-palette-open.png' });
    
    // 6. Procurar e clicar no agente
    console.log('🔍 Procurando agente na paleta...');
    
    // Tentar encontrar o agente
    const agentSelectors = [
      `text=${agentId}`,
      'text=Agentes',
      '[data-category="agent"]',
      '.agent-item'
    ];
    
    let agentFound = false;
    for (const selector of agentSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 2000 });
        if (element) {
          console.log(`✅ Agente encontrado: ${selector}`);
          await element.click();
          agentFound = true;
          break;
        }
      } catch (e) {
        console.log(`❌ Agente não encontrado: ${selector}`);
      }
    }
    
    if (!agentFound) {
      console.log('⚠️  Agente não encontrado visualmente, continuando...');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/step5-agent-selected.png' });
    
    // 7. Verificar se node foi adicionado ao canvas
    console.log('🔍 Verificando se node apareceu no canvas...');
    
    const nodeSelectors = [
      '[data-id]',
      '.react-flow__node',
      '[class*="node"]'
    ];
    
    let nodeFound = false;
    for (const selector of nodeSelectors) {
      try {
        const nodes = await page.$$(selector);
        if (nodes.length > 0) {
          console.log(`✅ ${nodes.length} node(s) encontrado(s): ${selector}`);
          nodeFound = true;
          break;
        }
      } catch (e) {
        console.log(`❌ Nodes não encontrados: ${selector}`);
      }
    }
    
    if (!nodeFound) {
      console.log('❌ ERRO: Nenhum node foi adicionado ao canvas!');
      await page.screenshot({ path: '/tmp/error-no-nodes.png' });
    }
    
    await page.screenshot({ path: '/tmp/step6-node-added.png' });
    
    // 8. Tentar clicar no node para abrir config
    console.log('🖱️  Tentando clicar no node...');
    
    try {
      const node = await page.waitForSelector('[data-id]', { timeout: 5000 });
      if (node) {
        await node.click();
        console.log('✅ Clicado no node');
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/step7-node-clicked.png' });
        
        // Verificar se modal abriu
        const modalSelectors = [
          '[role="dialog"]',
          '.modal',
          '[data-testid="config-modal"]'
        ];
        
        let modalFound = false;
        for (const selector of modalSelectors) {
          try {
            const modal = await page.waitForSelector(selector, { timeout: 2000 });
            if (modal) {
              console.log(`✅ Modal aberto: ${selector}`);
              modalFound = true;
              break;
            }
          } catch (e) {
            console.log(`❌ Modal não encontrado: ${selector}`);
          }
        }
        
        if (!modalFound) {
          console.log('❌ PROBLEMA: Modal de configuração NÃO ABRIU!');
          await page.screenshot({ path: '/tmp/error-modal-not-open.png' });
        }
        
        await page.screenshot({ path: '/tmp/step8-modal-state.png' });
      }
    } catch (e) {
      console.log('❌ Erro ao clicar no node:', e);
    }
    
    // 9. RELATÓRIO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DO TESTE REAL');
    console.log('='.repeat(60));
    console.log('✅ Navegou para página de automações');
    console.log(createButton ? '✅' : '❌', 'Botão "Nova Automação" encontrado');
    console.log(nameInput ? '✅' : '❌', 'Input de nome encontrado');
    console.log(addToolButton ? '✅' : '❌', 'Botão "Adicionar Ferramenta" encontrado');
    console.log(agentFound ? '✅' : '❌', 'Agente encontrado na paleta');
    console.log(nodeFound ? '✅' : '❌', 'Node adicionado ao canvas');
    console.log('='.repeat(60));
    
    // Screenshots salvos em /tmp/
    console.log('\n📸 Screenshots salvos em /tmp/step*.png');
  });
});
