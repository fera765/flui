/**
 * Teste Simplificado do Sistema de Linker
 */

import { chromium } from 'playwright';

async function testLinkerSimple() {
  console.log('🚀 TESTE DO SISTEMA DE LINKER\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Capturar TODOS os logs e erros
    page.on('console', msg => {
      console.log(`📋 [${msg.type()}]`, msg.text());
    });
    
    page.on('pageerror', err => {
      console.error('❌ Page Error:', err.message);
    });

    // 1. Navegar
    console.log('📍 Navegando...');
    await page.goto('http://localhost:8080/automations/create', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Esperar React carregar
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Screenshot inicial
    await page.screenshot({ path: '/workspace/step1-loaded.png', fullPage: true });
    console.log('✅ Página carregada');
    
    // Debug: HTML content
    const html = await page.content();
    const hasReact = html.includes('react-flow') || html.includes('button');
    console.log(`   React carregou: ${hasReact ? '✅' : '❌'}`);

    // 2. Procurar botões disponíveis
    console.log('\n🔍 Procurando botões...');
    const allButtons = await page.locator('button').all();
    console.log(`   Total de botões: ${allButtons.length}`);
    
    // Botão de adicionar tool (específico)
    const addButton = page.locator('button:has-text("Adicionar Ferramenta")');
    const hasAddButton = await addButton.count() > 0;
    console.log(`   Botão de adicionar: ${hasAddButton ? '✅' : '❌'}`);
    
    if (hasAddButton) {
      await addButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/workspace/step2-palette-open.png' });
      
      // Procurar tools na palette
      const tools = await page.locator('[class*="tool"]').or(
        page.locator('button').filter({ hasText: /Trigger|Manual|Cron/ })
      ).all();
      
      console.log(`   Tools disponíveis: ${tools.length}`);
      
      if (tools.length > 0) {
        // Adicionar primeiro tool
        await tools[0].click();
        await page.waitForTimeout(2000);
        console.log('✅ Tool 1 adicionada');
        
        // Adicionar segundo tool
        await addButton.click();
        await page.waitForTimeout(1000);
        const tools2 = await page.locator('button').filter({ hasText: /Cron|Webhook/ }).all();
        if (tools2.length > 0) {
          await tools2[0].click();
          await page.waitForTimeout(2000);
          console.log('✅ Tool 2 adicionada');
          
          await page.screenshot({ path: '/workspace/step3-two-nodes.png' });
          
          // Verificar nodes
          const nodes = await page.locator('.react-flow__node').all();
          console.log(`\n📦 Nodes no canvas: ${nodes.length}`);
          
          if (nodes.length >= 2) {
            // Conectar nodes (arrastar)
            console.log('\n🔗 Conectando nodes...');
            
            const node1 = nodes[0];
            const node2 = nodes[1];
            
            const box1 = await node1.boundingBox();
            const box2 = await node2.boundingBox();
            
            if (box1 && box2) {
              // Arrastar do centro do node 1 para o node 2
              await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
              await page.mouse.down();
              await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, { steps: 20 });
              await page.mouse.up();
              await page.waitForTimeout(2000);
              
              await page.screenshot({ path: '/workspace/step4-nodes-connected.png' });
              
              // Abrir config do segundo node
              console.log('\n⚙️ Abrindo config do node 2...');
              const configButtons = await page.locator('button[title*="Config"]').or(
                page.locator('button').filter({ has: page.locator('svg[class*="gear"]') })
              ).all();
              
              console.log(`   Botões de config: ${configButtons.length}`);
              
              if (configButtons.length >= 2) {
                // Forçar clique no botão
                await configButtons[1].evaluate(btn => btn.click());
                await page.waitForTimeout(3000);
                
                await page.screenshot({ path: '/workspace/step5-modal-open.png' });
                
                // Verificar modal
                const modalVisible = await page.locator('h2').filter({ hasText: /Config/ }).isVisible();
                console.log(`   Modal visível: ${modalVisible ? '✅' : '❌'}`);
                
                if (modalVisible) {
                  // Verificar cor do texto
                  const input = page.locator('input[type="text"]').first();
                  if (await input.count() > 0) {
                    const color = await input.evaluate(el => window.getComputedStyle(el).color);
                    console.log(`\n🎨 Cor do texto: ${color}`);
                    const isBlack = color.includes('17, 24, 39') || color.includes('0, 0, 0');
                    console.log(`   É preto? ${isBlack ? '✅' : '❌'}`);
                  }
                  
                  // Procurar botões de linker específicos
                  const linkerBtn = page.locator('button[title="Linkar campo"]').first();
                  const hasLinkerBtn = await linkerBtn.count() > 0;
                  
                  console.log(`\n🔗 Botão de linker: ${hasLinkerBtn ? '✅' : '❌'}`);
                  
                  if (hasLinkerBtn) {
                    // Clicar no linker (forçar)
                    await linkerBtn.evaluate(btn => btn.click());
                    await page.waitForTimeout(2000);
                    
                    await page.screenshot({ path: '/workspace/step6-linker-open.png' });
                    
                    // Verificar mensagem
                    const noOutputs = await page.locator('text=/Nenhum output/i').count();
                    const hasOutputs = await page.locator('button').filter({ hasText: /result|output|data|trigger/ }).count();
                    
                    console.log(`   Mensagem "Nenhum output": ${noOutputs > 0 ? '❌' : '✅'}`);
                    console.log(`   Outputs disponíveis: ${hasOutputs}`);
                    
                    if (hasOutputs > 0) {
                      console.log('\n🎉 LINKER FUNCIONANDO! Outputs disponíveis!');
                      
                      // Fazer linker
                      const output = page.locator('button').filter({ hasText: /result|output/ }).first();
                      await output.click();
                      await page.waitForTimeout(1000);
                      
                      // Verificar campo verde
                      const linked = await page.locator('.bg-green-50').count();
                      console.log(`   Campo linkado (verde): ${linked > 0 ? '✅' : '❌'}`);
                      
                      // Salvar (específico do modal)
                      await page.locator('button:has-text("Salvar Configuração")').click();
                      await page.waitForTimeout(2000);
                      
                      await page.screenshot({ path: '/workspace/step7-final.png' });
                      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
                    } else {
                      console.log('\n❌ Outputs não disponíveis!');
                      await page.screenshot({ path: '/workspace/error-no-outputs.png' });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await page.screenshot({ path: '/workspace/error-final.png' });
  } finally {
    await browser.close();
  }
}

testLinkerSimple().catch(console.error);
