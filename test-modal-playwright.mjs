/**
 * Script para testar o modal usando Playwright
 * Abre navegador e interage com a interface
 */

import { chromium } from 'playwright';

async function testModalWithPlaywright() {
  console.log('🚀 Iniciando teste do modal com Playwright...\n');

  const browser = await chromium.launch({
    headless: true, // Modo headless (sem GUI)
    slowMo: 100,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('[CreateAutomationV2]') || 
        text.includes('[NodeConfigModalV2]') ||
        text.includes('handleConfigureNode')) {
      console.log('📋 Browser:', text);
    }
  });

  // Capturar erros
  page.on('pageerror', (error) => {
    console.error('❌ Page Error:', error.message);
  });

  try {
    // 1. Navegar para a página
    console.log('📍 Navegando para http://localhost:5173/create-automation-v2...');
    await page.goto('http://localhost:5173/create-automation-v2', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log('✅ Página carregada\n');

    // Aguardar React carregar
    await page.waitForTimeout(2000);

    // 2. Verificar se página carregou corretamente
    const title = await page.title();
    console.log('📄 Título:', title);

    // 3. Verificar ReactFlow
    const reactFlowExists = await page.locator('.react-flow').count() > 0;
    console.log('🎨 ReactFlow:', reactFlowExists ? '✅' : '❌');

    if (!reactFlowExists) {
      throw new Error('ReactFlow não encontrado!');
    }

    // 4. Verificar nodes
    let nodeCount = await page.locator('.react-flow__node').count();
    console.log('📦 Nodes:', nodeCount);

    // 5. Procurar botão de configuração
    console.log('\n🔍 Procurando botão ⚙️...');
    
    const configButton = page.locator('button[title="Configurar nó"]').first();
    let configButtonCount = await configButton.count();
    
    console.log('⚙️ Botões encontrados:', configButtonCount);

    if (configButtonCount === 0) {
      console.log('\n⚠️ Nenhum botão de config. Inspecionando nodes...');
      
      // Verificar estrutura dos nodes
      const nodeInfo = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.react-flow__node');
        return Array.from(nodes).map((node, i) => {
          const buttons = node.querySelectorAll('button');
          return {
            index: i,
            className: node.className,
            buttonsCount: buttons.length,
            buttonTitles: Array.from(buttons).map(b => b.getAttribute('title') || 'no-title'),
            innerHTML: node.innerHTML.substring(0, 300),
          };
        });
      });
      
      console.log('\n📦 Informações dos nodes:');
      nodeInfo.forEach((info, i) => {
        console.log(`\n  Node ${i}:`);
        console.log(`    Botões: ${info.buttonsCount}`);
        console.log(`    Títulos: ${info.buttonTitles.join(', ')}`);
      });
      
      // Tirar screenshot
      await page.screenshot({ path: '/workspace/debug-no-button.png', fullPage: true });
      console.log('\n📸 Screenshot: /workspace/debug-no-button.png');
    } else {
      // 6. Clicar no botão
      console.log('\n✅ Botão encontrado! Clicando...');
      
      // Destacar botão
      await configButton.evaluate((el) => {
        el.style.border = '3px solid red';
        el.style.boxShadow = '0 0 10px red';
      });
      
      await page.waitForTimeout(500);
      await configButton.click();
      console.log('🖱️ Clicado!\n');

      // 7. Aguardar modal
      console.log('⏳ Aguardando modal...');
      await page.waitForTimeout(2000);

      // 8. Verificar modal
      const modalHeading = page.locator('h2:has-text("Configurar Nó")');
      const modalVisible = await modalHeading.isVisible().catch(() => false);

      console.log('\n📊 RESULTADO:');
      console.log('=' .repeat(50));
      console.log('🎨 Modal visível:', modalVisible ? '✅ SIM' : '❌ NÃO');
      console.log('=' .repeat(50));

      if (modalVisible) {
        console.log('\n🎉🎉🎉 SUCESSO! Modal abriu! 🎉🎉🎉\n');
        
        // Verificar elementos
        const elements = {
          saveButton: await page.locator('button:has-text("Salvar")').count() > 0,
          cancelButton: await page.locator('button:has-text("Cancelar")').count() > 0,
        };
        
        console.log('📋 Elementos:');
        console.log('  Salvar:', elements.saveButton ? '✅' : '❌');
        console.log('  Cancelar:', elements.cancelButton ? '✅' : '❌');
        
        // Screenshot
        await page.screenshot({ path: '/workspace/modal-success.png', fullPage: true });
        console.log('\n📸 Screenshot: /workspace/modal-success.png');
        
        // Aguardar visualização
        await page.waitForTimeout(3000);
        
      } else {
        console.log('\n❌❌❌ FALHA! Modal não abriu! ❌❌❌\n');
        
        // Debug
        const modalExists = await page.locator('h2:has-text("Configurar Nó")').count() > 0;
        console.log('📦 Modal existe no DOM:', modalExists);
        
        if (modalExists) {
          const modalState = await page.evaluate(() => {
            const modal = document.querySelector('h2');
            if (modal && modal.textContent?.includes('Configurar')) {
              const parent = modal.closest('[class*="fixed"]') || modal.parentElement;
              const styles = window.getComputedStyle(parent || modal);
              return {
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                zIndex: styles.zIndex,
              };
            }
            return null;
          });
          console.log('🎨 CSS:', modalState);
        }
        
        // Verificar logs importantes
        console.log('\n📋 Logs importantes:');
        const importantLogs = logs.filter(log => 
          log.includes('handleConfigureNode') ||
          log.includes('NodeConfigModalV2') ||
          log.includes('isOpen') ||
          log.includes('automationId')
        );
        importantLogs.forEach(log => console.log('  -', log));
        
        // Screenshot
        await page.screenshot({ path: '/workspace/modal-failed.png', fullPage: true });
        console.log('\n📸 Screenshot: /workspace/modal-failed.png');
      }
    }

    // Aguardar antes de fechar
    console.log('\n⏳ Aguardando 5s...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
    try {
      await page.screenshot({ path: '/workspace/error.png', fullPage: true });
      console.log('📸 Screenshot: /workspace/error.png');
    } catch (e) {
      // Ignorar
    }
  } finally {
    console.log('\n🔚 Fechando navegador...');
    await browser.close();
  }
}

// Executar
testModalWithPlaywright()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
