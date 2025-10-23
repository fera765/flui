import { test, expect } from '@playwright/test';

/**
 * INVESTIGAÇÃO DE BUGS REAIS
 * 
 * Este teste investiga os problemas reportados:
 * 1. Config desaparece ao salvar
 * 2. Linkers só mostram primeiro node
 */

const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('INVESTIGAÇÃO - Bugs Reais', () => {
  let agentId: string;
  let automationId: string;

  test.beforeAll(async () => {
    // Criar agente
    const timestamp = Date.now();
    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `bug-test-${timestamp}`,
        name: `Bug Test Agent ${timestamp}`,
        model: 'deepseek-v3.1',
        systemPrompt: 'Test',
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

  test('BUG 1: Config desaparece - Teste completo', async ({ page }) => {
    console.log('\n🐛 BUG 1: Testando se config desaparece...\n');
    
    // 1. Criar automação via API
    console.log('📋 Criando automação via API...');
    automationId = `bug-auto-${Date.now()}`;
    
    await fetch(`${API_URL}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: automationId,
        name: 'Bug Test Automation',
        description: 'Testing config persistence',
        nodes: [{
          id: 'node-1',
          type: 'agent',
          name: 'Test Agent Node',
          config: {
            toolId: `agent-${agentId}`,
            category: 'agent',
            params: {}
          },
          position: { x: 100, y: 100 }
        }],
        edges: []
      })
    });
    
    console.log('✅ Automação criada:', automationId);
    
    // 2. Navegar para página de edição
    console.log('📍 Navegando para página de edição...');
    await page.goto(`${FRONTEND_URL}/automations/${automationId}/edit`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/bug1-step1-page-loaded.png' });
    
    // 3. Procurar o node no canvas
    console.log('🔍 Procurando node no canvas...');
    
    // O node é um componente React, vamos procurar pelo botão de Settings
    const settingsButton = await page.waitForSelector('button[title="Configurar"]', {
      timeout: 10000
    });
    
    if (!settingsButton) {
      console.log('❌ ERRO: Botão de configuração não encontrado!');
      await page.screenshot({ path: '/tmp/bug1-error-no-settings-button.png' });
      throw new Error('Botão de configuração não encontrado');
    }
    
    console.log('✅ Botão de configuração encontrado');
    
    // 4. Clicar no botão de configuração
    console.log('🖱️  Clicando no botão de configuração...');
    await settingsButton.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/tmp/bug1-step2-clicked-settings.png' });
    
    // 5. Verificar se modal abriu
    console.log('🔍 Verificando se modal abriu...');
    
    const modal = await page.waitForSelector('[role="dialog"], .modal', {
      timeout: 5000
    }).catch(() => null);
    
    if (!modal) {
      console.log('❌ ERRO CRÍTICO: Modal NÃO ABRIU!');
      await page.screenshot({ path: '/tmp/bug1-error-modal-not-open.png' });
      
      // Listar todos os elementos visíveis
      const allElements = await page.$$('*');
      console.log(`Total de elementos na página: ${allElements.length}`);
      
      throw new Error('Modal não abriu');
    }
    
    console.log('✅ Modal aberto');
    await page.screenshot({ path: '/tmp/bug1-step3-modal-open.png' });
    
    // 6. Procurar campo de prompt no modal
    console.log('🔍 Procurando campo de prompt...');
    
    const promptSelectors = [
      'input[name="prompt"]',
      'textarea[name="prompt"]',
      'input[placeholder*="prompt"]',
      'textarea[placeholder*="prompt"]'
    ];
    
    let promptField = null;
    for (const selector of promptSelectors) {
      promptField = await page.$(selector);
      if (promptField) {
        console.log(`✅ Campo encontrado: ${selector}`);
        break;
      }
    }
    
    if (!promptField) {
      console.log('⚠️  Campo "prompt" não encontrado');
      console.log('📋 Listando todos os inputs no modal:');
      
      const allInputs = await modal.$$('input, textarea');
      for (let i = 0; i < allInputs.length; i++) {
        const name = await allInputs[i].getAttribute('name');
        const placeholder = await allInputs[i].getAttribute('placeholder');
        const type = await allInputs[i].getAttribute('type');
        console.log(`  Input ${i}: name="${name}", placeholder="${placeholder}", type="${type}"`);
      }
      
      // Usar o primeiro input disponível
      if (allInputs.length > 0) {
        promptField = allInputs[0];
        console.log('✅ Usando primeiro input disponível');
      }
    }
    
    if (promptField) {
      // 7. Preencher config
      console.log('✏️  Preenchendo config...');
      await promptField.fill('Config de teste - NÃO DEVE DESAPARECER!');
      await page.screenshot({ path: '/tmp/bug1-step4-config-filled.png' });
      
      // 8. Salvar config
      console.log('💾 Salvando config...');
      const saveButton = await page.waitForSelector('button:has-text("Salvar")', {
        timeout: 5000
      });
      
      if (saveButton) {
        await saveButton.click();
        console.log('✅ Clicado em Salvar');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: '/tmp/bug1-step5-config-saved.png' });
      }
      
      // 9. Reabrir modal e verificar se config está lá
      console.log('🔍 Reabrindo modal para verificar persistência...');
      await page.waitForTimeout(1000);
      
      const settingsButton2 = await page.waitForSelector('button[title="Configurar"]', {
        timeout: 5000
      });
      
      if (settingsButton2) {
        await settingsButton2.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: '/tmp/bug1-step6-modal-reopened.png' });
        
        // Verificar valor
        const promptValue = await promptField.inputValue();
        console.log('📋 Valor do campo:', promptValue);
        
        if (promptValue.includes('Config de teste')) {
          console.log('✅ Config PERSISTIU localmente!');
        } else {
          console.log('❌ BUG CONFIRMADO: Config DESAPARECEU localmente!');
        }
        
        // Fechar modal
        const closeButton = await page.$('button:has-text("Cancelar"), button:has-text("Fechar")');
        if (closeButton) {
          await closeButton.click();
        }
      }
      
      // 10. Salvar automação
      console.log('💾 Salvando automação completa...');
      const saveAutoButton = await page.waitForSelector('button:has-text("Salvar Automação"), button:has-text("Salvar")', {
        timeout: 5000
      }).catch(() => null);
      
      if (saveAutoButton) {
        await saveAutoButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Automação salva');
        
        await page.screenshot({ path: '/tmp/bug1-step7-automation-saved.png' });
      }
      
      // 11. Verificar via API se config foi salvo
      console.log('🔍 Verificando config via API...');
      const apiResponse = await fetch(`${API_URL}/automations/${automationId}`);
      const automation = await apiResponse.json();
      
      const node1 = automation.nodes?.find((n: any) => n.id === 'node-1');
      console.log('📋 Node 1 do backend:', JSON.stringify(node1?.config, null, 2));
      
      if (node1?.config?.params?.prompt?.includes('Config de teste')) {
        console.log('✅ Config PERSISTIDO no backend!');
      } else {
        console.log('❌ BUG CONFIRMADO: Config NÃO foi salvo no backend!');
        console.log('   Config atual:', node1?.config);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO BUG 1');
    console.log('='.repeat(60));
  });

  test('BUG 2: Linkers só mostram primeiro node', async ({ page }) => {
    console.log('\n🐛 BUG 2: Testando linkers em cadeia...\n');
    
    // 1. Criar automação com 3 nodes via API
    const chainAutoId = `chain-auto-${Date.now()}`;
    
    await fetch(`${API_URL}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: chainAutoId,
        name: 'Chain Test',
        nodes: [
          {
            id: 'n1',
            type: 'agent',
            name: 'Node 1',
            config: {
              toolId: `agent-${agentId}`,
              category: 'agent',
              params: { prompt: 'Node 1' }
            },
            position: { x: 100, y: 100 }
          },
          {
            id: 'n2',
            type: 'agent',
            name: 'Node 2',
            config: {
              toolId: `agent-${agentId}`,
              category: 'agent',
              params: { prompt: 'Node 2' }
            },
            position: { x: 400, y: 100 }
          },
          {
            id: 'n3',
            type: 'agent',
            name: 'Node 3',
            config: {
              toolId: `agent-${agentId}`,
              category: 'agent',
              params: { prompt: 'Node 3' }
            },
            position: { x: 700, y: 100 }
          }
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' }
        ]
      })
    });
    
    console.log('✅ Automação criada:', chainAutoId);
    
    // 2. Navegar para página de edição
    await page.goto(`${FRONTEND_URL}/automations/${chainAutoId}/edit`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/bug2-step1-3-nodes.png' });
    
    // 3. Clicar no Node 3 para configurar
    console.log('🖱️  Abrindo config do Node 3...');
    
    // Procurar todos os botões de settings
    const settingsButtons = await page.$$('button[title="Configurar"]');
    console.log(`✅ Encontrados ${settingsButtons.length} botões de configuração`);
    
    if (settingsButtons.length >= 3) {
      // Clicar no 3º botão (Node 3)
      await settingsButtons[2].click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: '/tmp/bug2-step2-node3-config.png' });
      
      // 4. Procurar botão de linker
      console.log('🔍 Procurando botão de linker...');
      
      const linkerButton = await page.waitForSelector('button:has-text("🔗"), button[title*="linker"]', {
        timeout: 5000
      }).catch(() => null);
      
      if (!linkerButton) {
        console.log('⚠️  Botão de linker não encontrado visualmente');
        console.log('   Listando botões no modal:');
        
        const modal = await page.$('[role="dialog"]');
        if (modal) {
          const modalButtons = await modal.$$('button');
          for (let i = 0; i < modalButtons.length; i++) {
            const text = await modalButtons[i].textContent();
            const title = await modalButtons[i].getAttribute('title');
            console.log(`  Botão ${i}: text="${text}", title="${title}"`);
          }
        }
      } else {
        // Clicar no botão de linker
        await linkerButton.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: '/tmp/bug2-step3-linker-menu.png' });
        
        // 5. Verificar quantos nodes aparecem
        console.log('🔍 Verificando linkers disponíveis...');
        
        const linkerMenu = await page.$('[role="menu"], [data-linkers], .linker-menu');
        
        if (linkerMenu) {
          const text = await linkerMenu.textContent();
          console.log('📋 Conteúdo do menu de linkers:', text);
          
          // Contar menções aos nodes
          const hasNode1 = text?.includes('Node 1') || text?.includes('n1');
          const hasNode2 = text?.includes('Node 2') || text?.includes('n2');
          
          console.log('Node 1 visível:', hasNode1 ? '✅' : '❌');
          console.log('Node 2 visível:', hasNode2 ? '✅' : '❌');
          
          if (!hasNode1 || !hasNode2) {
            console.log('❌ BUG CONFIRMADO: Não mostra TODOS os nodes anteriores!');
          } else {
            console.log('✅ TODOS os nodes anteriores estão visíveis!');
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO BUG 2');
    console.log('='.repeat(60));
  });
});
